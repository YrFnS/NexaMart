import React from "react";
import { useI18n } from "@/lib/i18n";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	GRADIENT_PRESETS,
	ICON_OPTIONS,
	POSITION_OPTIONS,
	ICON_MAP,
	EMPTY_FORM,
} from "@/components/admin/admin-banner-constants";
import type {
	BannerData,
	BannerFormData,
} from "@/components/admin/admin-banner-constants";
import { BannerPreviewCard } from "@/components/admin/admin-banner-preview";

interface AdminBannerFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingBanner: BannerData | null;
	form: BannerFormData;
	saving: boolean;
	onFormChange: (form: BannerFormData) => void;
	onSave: () => void;
}

export function AdminBannerForm({
	open,
	onOpenChange,
	editingBanner,
	form,
	saving,
	onFormChange,
	onSave,
}: AdminBannerFormProps) {
	const { t } = useI18n();

	const update = (partial: Partial<BannerFormData>) =>
		onFormChange({ ...form, ...partial });

	const previewBanner: BannerData = {
		id: "preview",
		title: form.title || "Banner Title",
		titleAr: form.titleAr || null,
		description: form.description || null,
		descriptionAr: form.descriptionAr || null,
		image: form.image || null,
		link: form.link || null,
		ctaText: form.ctaText || null,
		ctaTextAr: form.ctaTextAr || null,
		ctaLink: form.ctaLink || null,
		gradient: form.gradient || null,
		icon: form.icon || null,
		position: form.position,
		sortOrder: form.sortOrder,
		isActive: form.isActive,
		startDate: form.startDate || null,
		endDate: form.endDate || null,
		createdAt: new Date().toISOString(),
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{editingBanner
							? t("adminBannerEditExisting")
							: t("adminBannerCreateNew")}
					</DialogTitle>
					<DialogDescription>
						{editingBanner ? t("adminEditBannerDesc") : t("adminAddBannerDesc")}
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					{/* Title */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="title">{t("adminBannerTitle")} *</Label>
							<Input
								id="title"
								value={form.title}
								onChange={(e) => update({ title: e.target.value })}
								placeholder={t("adminBannerTitle")}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="titleAr">{t("adminBannerTitleAr")}</Label>
							<Input
								id="titleAr"
								value={form.titleAr}
								onChange={(e) => update({ titleAr: e.target.value })}
								placeholder={t("adminBannerTitleAr")}
								dir="rtl"
							/>
						</div>
					</div>

					{/* Description */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="description">{t("adminBannerDescription")}</Label>
							<Textarea
								id="description"
								value={form.description}
								onChange={(e) => update({ description: e.target.value })}
								placeholder={t("adminBannerDescription")}
								rows={3}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="descriptionAr">
								{t("adminBannerDescriptionAr")}
							</Label>
							<Textarea
								id="descriptionAr"
								value={form.descriptionAr}
								onChange={(e) => update({ descriptionAr: e.target.value })}
								placeholder={t("adminBannerDescriptionAr")}
								dir="rtl"
								rows={3}
							/>
						</div>
					</div>

					{/* CTA */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="ctaText">{t("adminBannerCTAText")}</Label>
							<Input
								id="ctaText"
								value={form.ctaText}
								onChange={(e) => update({ ctaText: e.target.value })}
								placeholder={t("adminBannerCTAText")}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="ctaTextAr">{t("adminBannerCTATextAr")}</Label>
							<Input
								id="ctaTextAr"
								value={form.ctaTextAr}
								onChange={(e) => update({ ctaTextAr: e.target.value })}
								placeholder={t("adminBannerCTATextAr")}
								dir="rtl"
							/>
						</div>
					</div>

					{/* CTA Link */}
					<div className="space-y-2">
						<Label htmlFor="ctaLink">{t("adminBannerCTALink")}</Label>
						<Input
							id="ctaLink"
							value={form.ctaLink}
							onChange={(e) => update({ ctaLink: e.target.value })}
							placeholder="/shop, /deals, https://..."
						/>
					</div>

					<Separator />

					{/* Gradient */}
					<div className="space-y-2">
						<Label>{t("adminBannerGradient")}</Label>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
							{GRADIENT_PRESETS.map((preset) => (
								<button
									key={preset.key}
									type="button"
									onClick={() => update({ gradient: preset.key })}
									className={`rounded-lg p-3 text-white text-xs font-medium transition-all border-2 ${
										form.gradient === preset.key
											? "border-white ring-2 ring-emerald-500 scale-105"
											: "border-transparent hover:border-white/30"
									} bg-gradient-to-r ${preset.value}`}
								>
									{t(preset.i18nKey)}
								</button>
							))}
						</div>
					</div>

					{/* Icon */}
					<div className="space-y-2">
						<Label>{t("adminBannerIcon")}</Label>
						<div className="flex flex-wrap gap-2">
							{ICON_OPTIONS.map((opt) => {
								const IconComp = ICON_MAP[opt.key];
								return (
									<button
										key={opt.key}
										type="button"
										onClick={() => update({ icon: opt.key })}
										className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm transition-all ${
											form.icon === opt.key
												? "border-emerald-500 bg-emerald-50 text-emerald-700"
												: "border-border hover:border-emerald-300"
										}`}
									>
										{IconComp && <IconComp className="h-4 w-4" />}
										<span>{t(opt.i18nKey)}</span>
									</button>
								);
							})}
						</div>
					</div>

					<Separator />

					{/* Position & Sort */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>{t("adminBannerPosition")}</Label>
							<Select
								value={form.position}
								onValueChange={(val) => update({ position: val })}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
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
						<div className="space-y-2">
							<Label htmlFor="sortOrder">{t("adminBannerSortOrder")}</Label>
							<Input
								id="sortOrder"
								type="number"
								value={form.sortOrder}
								onChange={(e) =>
									update({ sortOrder: parseInt(e.target.value) || 0 })
								}
								min={0}
							/>
						</div>
					</div>

					{/* Active toggle */}
					<div className="flex items-center gap-3">
						<Switch
							id="isActive"
							checked={form.isActive}
							onCheckedChange={(checked) => update({ isActive: checked })}
						/>
						<Label htmlFor="isActive">{t("adminBannerActive")}</Label>
					</div>

					{/* Dates */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="startDate">{t("adminBannerStartDate")}</Label>
							<Input
								id="startDate"
								type="date"
								value={form.startDate}
								onChange={(e) => update({ startDate: e.target.value })}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="endDate">{t("adminBannerEndDate")}</Label>
							<Input
								id="endDate"
								type="date"
								value={form.endDate}
								onChange={(e) => update({ endDate: e.target.value })}
							/>
						</div>
					</div>

					<Separator />

					{/* Image & Link (optional) */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="image">{t("adminBannerImage")}</Label>
							<Input
								id="image"
								value={form.image}
								onChange={(e) => update({ image: e.target.value })}
								placeholder="https://..."
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="link">{t("adminBannerLink")}</Label>
							<Input
								id="link"
								value={form.link}
								onChange={(e) => update({ link: e.target.value })}
								placeholder="https://..."
							/>
						</div>
					</div>

					{/* Live preview */}
					<div className="space-y-2">
						<Label>{t("adminBannerPreview")}</Label>
						<BannerPreviewCard banner={previewBanner} />
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("cancel")}
					</Button>
					<Button
						onClick={onSave}
						disabled={saving || !form.title.trim()}
						className="bg-emerald-600 hover:bg-emerald-700 text-white"
					>
						{saving ? t("processing") : t("save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
