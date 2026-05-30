"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MessageCircle, Wifi, WifiOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useUserStore } from "@/stores/user-store";
import { useChat } from "@/components/chat/useChat";
import { ChatList } from "@/components/chat/ChatList";
import { ChatWindow } from "@/components/chat/ChatWindow";

interface Conversation {
	id: string;
	storeName: string;
	storeNameAr: string;
	storeAvatar: string;
	lastMessage: string;
	lastMessageAr: string;
	time: string;
	unread: number;
	online: boolean;
	sellerId: string;
}

interface ChatMessageData {
	id: string;
	conversationId: string;
	sender: "buyer" | "seller";
	text: string;
	time: string;
	read: boolean;
	status: "sent" | "delivered" | "read";
	translated?: string;
}

export function ChatPage() {
	const { t, locale } = useI18n();
	const { user } = useUserStore();
	const isRTL = locale === "ar";

	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [selectedConv, setSelectedConv] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [autoTranslate, setAutoTranslate] = useState(false);
	const [isLoadingConversations, setIsLoadingConversations] = useState(true);

	const {
		isConnected,
		messages: allMessages,
		typingUsers,
		onlineStatus,
		joinRoom,
		leaveRoom,
		sendMessage,
		startTyping,
		stopTyping,
	} = useChat({
		userId: user?.id || "guest",
		username: user?.name || "Guest",
		role: user?.role === "seller" ? "seller" : "buyer",
		avatar: user?.avatar || "",
	});

	// Fetch conversations from API
	useEffect(() => {
		const fetchConversations = async () => {
			setIsLoadingConversations(true);
			try {
				const res = await fetch("/api/stores?limit=10");
				if (res.ok) {
					const data = await res.json();
					const storeList = data.stores || data || [];
					setConversations(
						storeList.map((s: Record<string, unknown>, i: number) => ({
							id: (s.id as string) || `c-${i}`,
							storeName: (s.name as string) || "Store",
							storeNameAr: (s.nameAr as string) || (s.name as string) || "متجر",
							storeAvatar: (s.logo as string) || "",
							lastMessage: "",
							lastMessageAr: "",
							time: "",
							unread: 0,
							online: false,
							sellerId: (s.ownerId as string) || `seller-${i}`,
						})),
					);
				}
			} catch {
				// API error — leave conversations empty
			} finally {
				setIsLoadingConversations(false);
			}
		};
		fetchConversations();
	}, []);

	// Join/leave room when selecting conversation
	useEffect(() => {
		if (selectedConv && isConnected) {
			joinRoom(selectedConv);
			return () => {
				leaveRoom(selectedConv);
			};
		}
	}, [selectedConv, isConnected, joinRoom, leaveRoom]);

	const currentMessages: ChatMessageData[] = selectedConv
		? (allMessages[selectedConv] || []).map((m) => ({
				...m,
				sender: (m.sender === (user?.id || "") || m.sender === "buyer"
					? "buyer"
					: "seller") as "buyer" | "seller",
			}))
		: [];

	const typingUsersList = selectedConv ? typingUsers[selectedConv] || [] : [];
	const typingText =
		typingUsersList.length > 0
			? typingUsersList.length === 1
				? `${typingUsersList[0]} ${isRTL ? "يكتب..." : "is typing..."}`
				: `${typingUsersList.length} ${isRTL ? "أشخاص يكتبون..." : "people typing..."}`
			: "";

	const handleSendMessage = useCallback(
		(text: string) => {
			if (selectedConv) {
				sendMessage(selectedConv, text);
			}
		},
		[selectedConv, sendMessage],
	);

	const handleTypingChange = useCallback(
		(text: string) => {
			if (selectedConv) {
				if (text.trim()) {
					startTyping(selectedConv);
				} else {
					stopTyping(selectedConv);
				}
			}
		},
		[selectedConv, startTyping, stopTyping],
	);

	const handleTranslate = useCallback(
		async (msg: ChatMessageData) => {
			try {
				const res = await fetch("/api/ai/translate", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						text: msg.text,
						targetLang: isRTL ? "ar" : "en",
					}),
				});
				const data = await res.json();
				if (data.translated && selectedConv) {
					// Update message with translation (handled via state in useChat)
				}
			} catch {
				// fallback: show original
			}
		},
		[isRTL, selectedConv],
	);

	const currentConv = conversations.find((c) => c.id === selectedConv);
	const showChatOnMobile = !!selectedConv;

	return (
		<div
			className="min-h-screen bg-gradient-to-b from-background to-muted/30"
			dir={isRTL ? "rtl" : "ltr"}
		>
			<div className="container mx-auto px-4 py-4 max-w-6xl">
				<Card
					className="border-0 shadow-md overflow-hidden"
					style={{ height: "calc(100vh - 120px)" }}
				>
					<div className="flex h-full">
						<ChatList
							conversations={conversations}
							selectedId={selectedConv}
							searchQuery={searchQuery}
							onlineStatus={onlineStatus}
							isLoading={isLoadingConversations}
							onSelect={setSelectedConv}
							onSearch={setSearchQuery}
						/>

						<div
							className={`${showChatOnMobile ? "flex" : "hidden md:flex"} flex-col flex-1`}
						>
							{selectedConv && currentConv ? (
								<ChatWindow
									conversationId={selectedConv}
									conversationName={currentConv.storeName}
									conversationNameAr={currentConv.storeNameAr}
									messages={currentMessages}
									isConnected={isConnected}
									typingText={typingText}
									autoTranslate={autoTranslate}
									onBack={() => setSelectedConv(null)}
									onSendMessage={handleSendMessage}
									onTypingChange={handleTypingChange}
									onAutoTranslateChange={setAutoTranslate}
									onTranslate={handleTranslate}
								/>
							) : (
								<div className="flex-1 flex items-center justify-center">
									<div className="text-center space-y-3">
										<MessageCircle className="size-16 mx-auto text-muted-foreground/20" />
										<p className="text-lg font-medium text-muted-foreground">
											{isRTL ? "اختر محادثة" : "Select a conversation"}
										</p>
										<div className="flex items-center justify-center gap-2 text-xs">
											{isConnected ? (
												<>
													<Wifi className="size-3.5 text-emerald-500" />
													<span className="text-emerald-600">
														{isRTL ? "متصل" : "Connected"}
													</span>
												</>
											) : (
												<>
													<WifiOff className="size-3.5 text-red-400" />
													<span className="text-red-500">
														{isRTL ? "غير متصل" : "Disconnected"}
													</span>
												</>
											)}
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
}
