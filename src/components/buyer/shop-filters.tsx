import React from "react";
import {
	SlidersHorizontal,
	Search,
	Star,
	Truck,
	Package,
	Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/currency";
import type { Category } from "@/components/buyer/category-grid";

interface ShopFiltersProps {
	locale: string;
	isRTL: boolean;
	categories: Category[];
	categoryId: string | null;
	search: string;
	priceRange: [number, number];
	minRating: number;
	freeShipping: boolean;
	b2bOnly: boolean;
	onSale: boolean;
	onCategoryChange: (id: string | null) => void;
	onSearchChange: (value: string) => void;
	onSearchSubmit: (e: React.FormEvent) => void;
	onPriceRangeChange: (value: [number, number]) => void;
	onMinRatingChange: (value: number) => void;
	onFreeShippingChange: (value: boolean) => void;
	onB2bOnlyChange: (value: boolean) => void;
	onSaleChange: (value: boolean) => void;
}

export function ShopFilters({
	locale: _locale,
	isRTL,
	categories,
	categoryId,
	search,
	priceRange,
	minRating,
	freeShipping,
	b2bOnly,
	onSale,
	onCategoryChange,
	onSearchChange,
	onSearchSubmit,
	onPriceRangeChange,
	onMinRatingChange,
	onFreeShippingChange,
	onB2bOnlyChange,
	onSaleChange,
}: ShopFiltersProps) {
	const { t } = useI18n();

	return (
		<div className="space-y-5">
			{/* Search */}
			<div>
				<Label className="text-xs font-semibold mb-2 block text-amber-700 dark:text-amber-400 uppercase tracking-wider">
					{t("search")}
				</Label>
				<form onSubmit={onSearchSubmit} className="flex gap-2">
					<div className="relative flex-1">
						<Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => onSearchChange(e.target.value)}
							placeholder={t("searchProducts")}
							className="text-sm ps-8 h-9 border-amber-200 dark:border-amber-800 focus-visible:ring-amber-500/30"
						/>
					</div>
					<Button
						type="submit"
						size="icon"
						className="shrink-0 h-9 w-9 bg-amber-600 hover:bg-amber-700"
					>
						<Search className="size-4" />
					</Button>
				</form>
			</div>

			<Separator className="bg-amber-100 dark:bg-amber-900/50" />

			{/* Categories - Enhanced Pills */}
			<div>
				<Label className="text-xs font-semibold mb-3 block text-amber-700 dark:text-amber-400 uppercase tracking-wider">
					{t("categories")}
				</Label>
				<div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
					<button
						onClick={() => onCategoryChange(null)}
						className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
							!categoryId
								? "bg-amber-600 text-white shadow-md shadow-amber-500/25 scale-105"
								: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/70 hover:shadow-sm border border-amber-200/60 dark:border-amber-800/60"
						}`}
					>
						{t("allCategories")}
					</button>
					{categories.map((cat) => {
						const catName = isRTL && cat.nameAr ? cat.nameAr : cat.name;
						const isActive = categoryId === cat.id;
						return (
							<button
								key={cat.id}
								onClick={() => onCategoryChange(cat.id)}
								className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
									isActive
										? "bg-amber-600 text-white shadow-md shadow-amber-500/25 scale-105"
										: "bg-muted/60 text-foreground hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-700 dark:hover:text-amber-300 hover:shadow-sm border border-border hover:border-amber-200/60 dark:hover:border-amber-800/60"
								}`}
							>
								<span>{catName}</span>
								{cat.productCount > 0 && (
									<span
										className={`text-[10px] ${isActive ? "text-amber-100" : "text-muted-foreground"}`}
									>
										{cat.productCount}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>

			<Separator className="bg-amber-100 dark:bg-amber-900/50" />

			{/* Price Range */}
			<div>
				<Label className="text-xs font-semibold mb-3 block text-amber-700 dark:text-amber-400 uppercase tracking-wider">
					{t("priceRange")}
				</Label>
				<Slider
					value={priceRange}
					min={0}
					max={2000}
					step={10}
					onValueChange={(val) => onPriceRangeChange(val as [number, number])}
					className="mb-3"
				/>
				<div className="flex items-center justify-between text-sm">
					<span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold text-xs border border-amber-200/50 dark:border-amber-800/50">
						{formatPrice(priceRange[0])}
					</span>
					<div className="flex-1 mx-2 h-px bg-amber-200 dark:bg-amber-800" />
					<span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold text-xs border border-amber-200/50 dark:border-amber-800/50">
						{formatPrice(priceRange[1])}
					</span>
				</div>
			</div>

			<Separator className="bg-amber-100 dark:bg-amber-900/50" />

			{/* Rating Filter */}
			<div>
				<Label className="text-xs font-semibold mb-2 block text-amber-700 dark:text-amber-400 uppercase tracking-wider">
					{t("ratings")}
				</Label>
				<div className="space-y-1">
					{[4, 3, 2, 1].map((rating) => (
						<button
							key={rating}
							onClick={() =>
								onMinRatingChange(minRating === rating ? 0 : rating)
							}
							className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
								minRating === rating
									? "bg-amber-100 dark:bg-amber-900 shadow-sm border border-amber-200 dark:border-amber-800"
									: "hover:bg-muted/60 border border-transparent hover:border-amber-200/40 dark:hover:border-amber-800/40"
							}`}
						>
							<div className="flex items-center">
								{Array.from({ length: 5 }, (_, i) => (
									<Star
										key={i}
										className={`size-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
									/>
								))}
							</div>
							<span className="text-xs text-muted-foreground">& Up</span>
						</button>
					))}
				</div>
			</div>

			<Separator className="bg-amber-100 dark:bg-amber-900/50" />

			{/* Toggle Filters */}
			<div className="space-y-3">
				<div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors">
					<div className="flex items-center gap-2">
						<div className="flex items-center justify-center size-7 rounded-md bg-amber-100 dark:bg-amber-900">
							<Truck className="size-3.5 text-amber-600 dark:text-amber-400" />
						</div>
						<Label className="text-sm cursor-pointer">
							{t("freeShipping")}
						</Label>
					</div>
					<Switch
						checked={freeShipping}
						onCheckedChange={onFreeShippingChange}
					/>
				</div>

				<div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors">
					<div className="flex items-center gap-2">
						<div className="flex items-center justify-center size-7 rounded-md bg-amber-100 dark:bg-amber-900">
							<Package className="size-3.5 text-amber-600 dark:text-amber-400" />
						</div>
						<Label className="text-sm cursor-pointer">B2B Only</Label>
					</div>
					<Switch checked={b2bOnly} onCheckedChange={onB2bOnlyChange} />
				</div>

				<div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors">
					<div className="flex items-center gap-2">
						<div className="flex items-center justify-center size-7 rounded-md bg-red-100 dark:bg-red-900">
							<Tag className="size-3.5 text-red-600 dark:text-red-400" />
						</div>
						<Label className="text-sm cursor-pointer">{t("sale")}</Label>
					</div>
					<Switch checked={onSale} onCheckedChange={onSaleChange} />
				</div>
			</div>
		</div>
	);
}
