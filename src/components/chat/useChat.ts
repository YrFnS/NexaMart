"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ChatMessage {
	id: string;
	conversationId: string;
	sender: string;
	senderName: string;
	text: string;
	time: string;
	read: boolean;
	status: "sent" | "delivered" | "read";
	translated?: string;
}

interface UseChatOptions {
	userId: string;
	username: string;
	role: "buyer" | "seller";
	avatar?: string;
}

interface ChatResponse {
	messages?: ChatMessage[];
	message?: ChatMessage;
	error?: string;
}

const EMPTY_TYPING_USERS: Record<string, string[]> = {};
const EMPTY_ONLINE_STATUS: Record<string, boolean> = {};

function normalizeMessage(message: ChatMessage): ChatMessage {
	const date = new Date(message.time);
	return {
		...message,
		time: Number.isNaN(date.getTime())
			? message.time
			: date.toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				}),
	};
}

export function useChat({ userId }: UseChatOptions) {
	const activeRoomsRef = useRef(new Set<string>());
	const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
	const isConnected = userId !== "guest";

	const refreshRoom = useCallback(
		async (conversationId: string) => {
			if (!isConnected) return;

			try {
				const response = await fetch(
					`/api/chat?conversationId=${encodeURIComponent(conversationId)}`,
					{
						credentials: "same-origin",
						cache: "no-store",
					},
				);
				if (!response.ok) return;

				const data = (await response.json()) as ChatResponse;
				setMessages((current) => ({
					...current,
					[conversationId]: (data.messages || []).map(normalizeMessage),
				}));
			} catch {
				// Keep the most recent successfully loaded messages.
			}
		},
		[isConnected],
	);

	const markAsRead = useCallback(
		(conversationId: string) => {
			if (!isConnected) return;
			void fetch("/api/chat", {
				method: "PATCH",
				credentials: "same-origin",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ conversationId }),
			}).then(() => refreshRoom(conversationId));
		},
		[isConnected, refreshRoom],
	);

	const refreshActiveRooms = useCallback(async () => {
		await Promise.all(
			[...activeRoomsRef.current].map((conversationId) =>
				refreshRoom(conversationId),
			),
		);
	}, [refreshRoom]);

	useEffect(() => {
		if (!isConnected) return;

		const interval = window.setInterval(() => {
			void refreshActiveRooms();
		}, 4_000);
		return () => window.clearInterval(interval);
	}, [isConnected, refreshActiveRooms]);

	const joinRoom = useCallback(
		(conversationId: string) => {
			activeRoomsRef.current.add(conversationId);
			void refreshRoom(conversationId);
			markAsRead(conversationId);
		},
		[markAsRead, refreshRoom],
	);

	const leaveRoom = useCallback((conversationId: string) => {
		activeRoomsRef.current.delete(conversationId);
	}, []);

	const sendMessage = useCallback(
		(conversationId: string, text: string) => {
			const trimmed = text.trim();
			if (!isConnected || !trimmed) return;

			void fetch("/api/chat", {
				method: "POST",
				credentials: "same-origin",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ conversationId, text: trimmed }),
			})
				.then(async (response) => {
					if (!response.ok) return null;
					return (await response.json()) as ChatResponse;
				})
				.then((data) => {
					if (!data?.message) return;
					const message = normalizeMessage(data.message);
					setMessages((current) => {
						const room = current[conversationId] || [];
						if (room.some((item) => item.id === message.id)) return current;
						return {
							...current,
							[conversationId]: [...room, message],
						};
					});
				});
		},
		[isConnected],
	);

	const startTyping = useCallback((_conversationId: string) => {
		// Typing indicators require a dedicated real-time service and are disabled
		// in the authenticated polling transport.
	}, []);

	const stopTyping = useCallback((_conversationId: string) => {
		// No-op for the polling transport.
	}, []);

	return {
		isConnected,
		messages,
		typingUsers: EMPTY_TYPING_USERS,
		onlineStatus: EMPTY_ONLINE_STATUS,
		joinRoom,
		leaveRoom,
		sendMessage,
		startTyping,
		stopTyping,
		markAsRead,
	};
}
