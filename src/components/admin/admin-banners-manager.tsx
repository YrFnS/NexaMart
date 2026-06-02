"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { adminFetch } from "@/lib/admin-api";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	EMPTY_FORM,
	POSITION_OPTIONS,
} from "@/components/admin/admin-banner-constants";
import type {
	BannerData,
	BannerFormData,
} from "@/components/admin/admin-banner-constants";
import { AdminBannerTable } from "@/components/admin/admin-banner-table";
import { AdminBannerForm } from "@/components/admin/admin-banner-form";
import { BannerPreviewCard } from "@/components/admin/admin-banner-preview";

export function AdminBannersManager() {
	const { t } = useI18n();

	const [banners, setBanners] = useState<BannerData[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [positionFilter, setPositionFilter] = useState("all");

	const [formOpen, setFormOpen] = useState(false);
	const [editingBanner, setEditingBanner] = useState<BannerData | null>(null);
	const [form, setForm] = useState<BannerFormData>({ ...EMPTY_FORM });
	const [saving, setSaving] = useState(false);

	const [deleteTarget, setDeleteTarget] = useState<BannerData | null>(null);
	const [previewBanner, setPreviewBanner] = useState<BannerData | null>(null);

	const fetchBanners = useCallback(async () => {
		try {
			setLoading(true);
			const res = await adminFetch("/api/admin/banners");
			if (!res.ok) throw new Error("Failed to fetch");
			const data = await res.json();
			setBanners(data.banners || []);
		} catch (err) {
			console.error("Fetch banners error:", err);
			toast.error(t("somethingWentWrong"));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		fetchBanners();
	}, [fetchBanners]);

	const filteredBanners = banners.filter((b) => {
		const matchesSearch =
			!searchQuery ||
			b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(b.titleAr &&
				b.titleAr.toLowerCase().includes(searchQuery.toLowerCase()));
		const matchesPosition =
			positionFilter === "all" || b.position === positionFilter;
		return matchesSearch && matchesPosition;
	});

	const sortedBanners = [...filteredBanners].sort(
		(a, b) => a.sortOrder - b.sortOrder,
	);

	const totalBanners = banners.length;
	const activeBanners = banners.filter((b) => b.isActive).length;

	const openCreateForm = () => {
		setEditingBanner(null);
		setForm({ ...EMPTY_FORM, sortOrder: banners.length });
		setFormOpen(true);
	};

	const openEditForm = (banner: BannerData) => {
		setEditingBanner(banner);
		setForm({
			title: banner.title,
			titleAr: banner.titleAr || "",
			description: banner.description || "",
			descriptionAr: banner.descriptionAr || "",
			image: banner.image || "",
			link: banner.link || "",
			ctaText: banner.ctaText || "",
			ctaTextAr: banner.ctaTextAr || "",
			ctaLink: banner.ctaLink || "",
			gradient: banner.gradient || "emerald-teal-cyan",
			icon: banner.icon || "Sparkles",
			position: banner.position,
			sortOrder: banner.sortOrder,
			isActive: banner.isActive,
			startDate: banner.startDate ? banner.startDate.split("T")[0] : "",
			endDate: banner.endDate ? banner.endDate.split("T")[0] : "",
		});
		setFormOpen(true);
	};

	const handleSave = async () => {
		if (!form.title.trim()) {
			toast.error(t("adminBannerTitle"));
			return;
		}
		setSaving(true);
		try {
			if (editingBanner) {
				const res = await adminFetch("/api/admin/banners", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						bannerId: editingBanner.id,
						...form,
						startDate: form.startDate || null,
						endDate: form.endDate || null,
					}),
				});
				if (!res.ok) {
					const errData = await res.json();
					throw new Error(errData.error || "Failed to update");
				}
				toast.success(t("adminBannerUpdated"));
			} else {
				const res = await adminFetch("/api/admin/banners", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						...form,
						startDate: form.startDate || null,
						endDate: form.endDate || null,
					}),
				});
				if (!res.ok) {
					const errData = await res.json();
					throw new Error(errData.error || "Failed to create");
				}
				toast.success(t("adminBannerCreated"));
			}
			setFormOpen(false);
			fetchBanners();
		} catch (err) {
			console.error("Save banner error:", err);
			toast.error(t("somethingWentWrong"));
		} finally {
			setSaving(false);
		}
	};

	const handleToggleActive = async (banner: BannerData) => {
		try {
			const res = await adminFetch("/api/admin/banners", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					bannerId: banner.id,
					isActive: !banner.isActive,
				}),
			});
			if (!res.ok) throw new Error("Failed to toggle");
			setBanners((prev) =>
				prev.map((b) =>
					b.id === banner.id ? { ...b, isActive: !b.isActive } : b,
				),
			);
		} catch (err) {
			console.error("Toggle active error:", err);
			toast.error(t("somethingWentWrong"));
		}
	};

	const handleMove = async (banner: BannerData, direction: "up" | "down") => {
		const samePositionBanners = banners
			.filter((b) => b.position === banner.position)
			.sort((a, b) => a.sortOrder - b.sortOrder);
		const idx = samePositionBanners.findIndex((b) => b.id === banner.id);
		if (
			(direction === "up" && idx === 0) ||
			(direction === "down" && idx === samePositionBanners.length - 1)
		) {
			return;
		}
		const swapWith =
			samePositionBanners[direction === "up" ? idx - 1 : idx + 1];

		setBanners((prev) =>
			prev.map((b) => {
				if (b.id === banner.id) return { ...b, sortOrder: swapWith.sortOrder };
				if (b.id === swapWith.id) return { ...b, sortOrder: banner.sortOrder };
				return b;
			}),
		);

		try {
			await Promise.all([
				adminFetch("/api/admin/banners", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						bannerId: banner.id,
						sortOrder: swapWith.sortOrder,
					}),
				}),
				adminFetch("/api/admin/banners", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						bannerId: swapWith.id,
						sortOrder: banner.sortOrder,
					}),
				}),
			]);
		} catch (err) {
			console.error("Reorder error:", err);
			fetchBanners();
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		try {
			const res = await adminFetch(`/api/admin/banners?id=${deleteTarget.id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete");
			toast.success(t("adminBannerDeletedSuccess"));
			setBanners((prev) => prev.filter((b) => b.id !== deleteTarget.id));
		} catch (err) {
			console.error("Delete error:", err);
			toast.error(t("somethingWentWrong"));
		} finally {
			setDeleteTarget(null);
		}
	};

	return (
		<div className="space-y-6">
			{/* Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							{t("adminBannerTotalBanners")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold text-emerald-600">
							{totalBanners}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							{t("adminBannerActiveBanners")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold text-teal-600">{activeBanners}</p>
					</CardContent>
				</Card>
			</div>

			{/* Toolbar */}
			<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
				<div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
					<div className="relative flex-1 min-w-0">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("adminSearchBanners")}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Select value={positionFilter} onValueChange={setPositionFilter}>
						<SelectTrigger className="w-full sm:w-[180px]">
							<SelectValue placeholder={t("adminBannerFilterPosition")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								{t("adminBannerAllPositions")}
							</SelectItem>
							{POSITION_OPTIONS.map((pos) => (
								<SelectItem key={pos} value={pos}>
									{t(
										`adminBannerPosition${pos.charAt(0).toUpperCase() + pos.slice(1)}` as string,
									)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button
					onClick={openCreateForm}
					className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
				>
					<Plus className="h-4 w-4 me-2" />
					{t("adminBannerCreateNew")}
				</Button>
			</div>

			{/* Table */}
			<AdminBannerTable
				banners={sortedBanners}
				loading={loading}
				onToggleActive={handleToggleActive}
				onMove={handleMove}
				onPreview={setPreviewBanner}
				onEdit={openEditForm}
				onDelete={setDeleteTarget}
				onCreateNew={openCreateForm}
			/>

			{/* Create / Edit Dialog */}
			<AdminBannerForm
				open={formOpen}
				onOpenChange={setFormOpen}
				editingBanner={editingBanner}
				form={form}
				saving={saving}
				onFormChange={setForm}
				onSave={handleSave}
			/>

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={() => setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("adminDeleteBanner")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("adminDeleteBannerConfirm")} &ldquo;{deleteTarget?.title}
							&rdquo;
							<br />
							<span className="text-destructive font-medium">
								{t("adminDeleteBannerWarning")}
							</span>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Preview Dialog */}
			<Dialog
				open={!!previewBanner}
				onOpenChange={() => setPreviewBanner(null)}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>{t("adminBannerPreview")}</DialogTitle>
					</DialogHeader>
					{previewBanner && (
						<div className="space-y-4">
							<BannerPreviewCard banner={previewBanner} />
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div>
									<span className="text-muted-foreground">
										{t("adminBannerPosition")}:
									</span>{" "}
									<Badge>{previewBanner.position}</Badge>
								</div>
								<div>
									<span className="text-muted-foreground">
										{t("adminBannerSortOrder")}:
									</span>{" "}
									{previewBanner.sortOrder}
								</div>
								<div>
									<span className="text-muted-foreground">
										{t("adminStatus")}:
									</span>{" "}
									<Badge
										variant={previewBanner.isActive ? "default" : "secondary"}
										className={
											previewBanner.isActive
												? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
												: ""
										}
									>
										{previewBanner.isActive
											? t("adminActive")
											: t("adminInactive")}
									</Badge>
								</div>
								{previewBanner.startDate && (
									<div>
										<span className="text-muted-foreground">
											{t("adminStartDate")}:
										</span>{" "}
										{previewBanner.startDate.split("T")[0]}
									</div>
								)}
								{previewBanner.endDate && (
									<div>
										<span className="text-muted-foreground">
											{t("adminEndDate")}:
										</span>{" "}
										{previewBanner.endDate.split("T")[0]}
									</div>
								)}
							</div>
							{previewBanner.titleAr && (
								<div className="text-sm" dir="rtl">
									<span className="text-muted-foreground">
										{t("adminBannerTitleAr")}:
									</span>{" "}
									{previewBanner.titleAr}
								</div>
							)}
							{previewBanner.descriptionAr && (
								<div className="text-sm" dir="rtl">
									<span className="text-muted-foreground">
										{t("adminBannerDescriptionAr")}:
									</span>{" "}
									{previewBanner.descriptionAr}
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
