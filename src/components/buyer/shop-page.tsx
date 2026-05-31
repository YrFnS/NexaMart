"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
	SlidersHorizontal,
	X,
	Star,
	Truck,
	Package,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Search,
	LayoutGrid,
	List,
	ShoppingCart,
	PackageSearch,
	RotateCcw,
	Filter,
	ArrowUp,
	ArrowDown,
	Heart,
	Clock,
	Store,
	Sparkles,
	Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/currency";
import { useAppStore } from "@/stores/app-store";
import { useAppNavigation } from "@/lib/use-app-navigation";
import { ProductCard, type Product } from "@/components/buyer/product-card";
import { ProductQuickView } from "@/components/buyer/product-quick-view";
import type { Category } from "@/components/buyer/category-grid";

type SortValue = "newest" | "price-asc" | "price-desc" | "rating" | "popular";
type ViewMode = "grid" | "list";

interface ActiveFilter {
	type: "category" | "price" | "freeShipping" | "b2b" | "sale" | "rating";
	label: string;
	value: string;
}

export function ShopPage() {
	const { t, locale } = useI18n();
	const { selectedCategory, selectCategory, searchQuery, setSearchQuery } =
		useAppStore();
	const nav = useAppNavigation();
	const isRTL = locale === "ar";

	// Data
	const [categories, setCategories] = useState<Category[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [total, setTotal] = useState(0);
	const [pages, setPages] = useState(1);

	// Filters
	const [categoryId, setCategoryId] = useState<string | null>(selectedCategory);
	const [sort, setSort] = useState<SortValue>("newest");
	const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
	const [minRating, setMinRating] = useState(0);
	const [freeShipping, setFreeShipping] = useState(false);
	const [b2bOnly, setB2bOnly] = useState(false);
	const [onSale, setOnSale] = useState(false);
	const [search, setSearch] = useState(searchQuery);
	const [page, setPage] = useState(1);

	// UI state
	const [loading, setLoading] = useState(true);
	const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
	const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
		null,
	);
	const [quickViewOpen, setQuickViewOpen] = useState(false);
	const [viewMode, setViewMode] = useState<ViewMode>("grid");
	const [isGridAnimating, setIsGridAnimating] = useState(false);
	const [countAnimating, setCountAnimating] = useState(false);
	const prevTotalRef = useRef<number>(0);

	const handleQuickView = useCallback((product: Product) => {
		setQuickViewProduct(product);
		setQuickViewOpen(true);
	}, []);

	const handleViewModeChange = (mode: ViewMode) => {
		setIsGridAnimating(true);
		setViewMode(mode);
		setTimeout(() => setIsGridAnimating(false), 400);
	};

	const limit = 12;

	// Fetch categories
	useEffect(() => {
		fetch("/api/categories")
			.then((res) => res.json())
			.then((data) => setCategories(Array.isArray(data) ? data : []))
			.catch(() => {});
	}, []);

	// Fetch products with filters
	const fetchProducts = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.set("page", String(page));
			params.set("limit", String(limit));
			params.set("sort", sort);
			if (categoryId) params.set("category", categoryId);
			if (search) params.set("search", search);
			if (freeShipping) params.set("freeShipping", "true");
			if (b2bOnly) params.set("b2b", "true");
			if (onSale) params.set("sale", "true");
			if (priceRange[0] > 0) params.set("minPrice", String(priceRange[0]));
			if (priceRange[1] < 2000) params.set("maxPrice", String(priceRange[1]));

			const res = await fetch(`/api/products?${params.toString()}`);
			if (res.ok) {
				const data = await res.json();
				setProducts(data.products || []);
				setTotal(data.total || 0);
				setPages(data.pages || 1);
			}
		} catch {
			// silently fail
		} finally {
			setLoading(false);
		}
	}, [
		page,
		sort,
		categoryId,
		search,
		freeShipping,
		b2bOnly,
		onSale,
		priceRange,
	]);

	useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);

	// Animate product count when it changes
	useEffect(() => {
		if (prevTotalRef.current !== 0 && prevTotalRef.current !== total) {
			setCountAnimating(true);
			const timer = setTimeout(() => setCountAnimating(false), 400);
			return () => clearTimeout(timer);
		}
		prevTotalRef.current = total;
	}, [total]);

	// Sync with app store
	useEffect(() => {
		if (selectedCategory) setCategoryId(selectedCategory);
	}, [selectedCategory]);

	useEffect(() => {
		if (searchQuery) setSearch(searchQuery);
	}, [searchQuery]);

	// Active filters
	const activeFilters: ActiveFilter[] = [];
	if (categoryId) {
		const cat = categories.find((c) => c.id === categoryId);
		activeFilters.push({
			type: "category",
			label: cat ? (isRTL && cat.nameAr ? cat.nameAr : cat.name) : categoryId,
			value: categoryId,
		});
	}
	if (priceRange[0] > 0 || priceRange[1] < 2000) {
		activeFilters.push({
			type: "price",
			label: `${formatPrice(priceRange[0])} - ${formatPrice(priceRange[1])}`,
			value: `${priceRange[0]}-${priceRange[1]}`,
		});
	}
	if (freeShipping) {
		activeFilters.push({
			type: "freeShipping",
			label: t("freeShipping"),
			value: "true",
		});
	}
	if (b2bOnly) {
		activeFilters.push({ type: "b2b", label: "B2B Only", value: "true" });
	}
	if (onSale) {
		activeFilters.push({ type: "sale", label: t("sale"), value: "true" });
	}
	if (minRating > 0) {
		activeFilters.push({
			type: "rating",
			label: `${minRating}+ ★`,
			value: String(minRating),
		});
	}

	const removeFilter = (filter: ActiveFilter) => {
		switch (filter.type) {
			case "category":
				setCategoryId(null);
				selectCategory(null);
				break;
			case "price":
				setPriceRange([0, 2000]);
				break;
			case "freeShipping":
				setFreeShipping(false);
				break;
			case "b2b":
				setB2bOnly(false);
				break;
			case "sale":
				setOnSale(false);
				break;
			case "rating":
				setMinRating(0);
				break;
		}
		setPage(1);
	};

	const clearAllFilters = () => {
		setCategoryId(null);
		selectCategory(null);
		setPriceRange([0, 2000]);
		setFreeShipping(false);
		setB2bOnly(false);
		setOnSale(false);
		setMinRating(0);
		setSearch("");
		setSearchQuery("");
		setPage(1);
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setPage(1);
		fetchProducts();
	};

	// Filter panel content (shared between desktop sidebar and mobile sheet)
	const FilterContent = () => (
		<div className="space-y-5">
			{/* Search */}
			<div>
				<Label className="text-xs font-semibold mb-2 block text-amber-700 dark:text-amber-400 uppercase tracking-wider">
					{t("search")}
				</Label>
				<form onSubmit={handleSearch} className="flex gap-2">
					<div className="relative flex-1">
						<Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
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
						onClick={() => {
							setCategoryId(null);
							selectCategory(null);
							setPage(1);
						}}
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
								onClick={() => {
									setCategoryId(cat.id);
									selectCategory(cat.id);
									setPage(1);
								}}
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
					onValueChange={(val) => {
						setPriceRange(val as [number, number]);
						setPage(1);
					}}
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
							onClick={() => {
								setMinRating(minRating === rating ? 0 : rating);
								setPage(1);
							}}
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
						onCheckedChange={(v) => {
							setFreeShipping(v);
							setPage(1);
						}}
					/>
				</div>

				<div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors">
					<div className="flex items-center gap-2">
						<div className="flex items-center justify-center size-7 rounded-md bg-amber-100 dark:bg-amber-900">
							<Package className="size-3.5 text-amber-600 dark:text-amber-400" />
						</div>
						<Label className="text-sm cursor-pointer">B2B Only</Label>
					</div>
					<Switch
						checked={b2bOnly}
						onCheckedChange={(v) => {
							setB2bOnly(v);
							setPage(1);
						}}
					/>
				</div>

				<div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors">
					<div className="flex items-center gap-2">
						<div className="flex items-center justify-center size-7 rounded-md bg-red-100 dark:bg-red-900">
							<Tag className="size-3.5 text-red-600 dark:text-red-400" />
						</div>
						<Label className="text-sm cursor-pointer">{t("sale")}</Label>
					</div>
					<Switch
						checked={onSale}
						onCheckedChange={(v) => {
							setOnSale(v);
							setPage(1);
						}}
					/>
				</div>
			</div>
		</div>
	);

	// Pagination rendering helper
	const renderPagination = () => {
		if (pages <= 1) return null;

		const getPageNumbers = () => {
			const nums: (number | "ellipsis")[] = [];
			if (pages <= 7) {
				for (let i = 1; i <= pages; i++) nums.push(i);
			} else if (page <= 3) {
				for (let i = 1; i <= 4; i++) nums.push(i);
				nums.push("ellipsis");
				nums.push(pages);
			} else if (page >= pages - 2) {
				nums.push(1);
				nums.push("ellipsis");
				for (let i = pages - 3; i <= pages; i++) nums.push(i);
			} else {
				nums.push(1);
				nums.push("ellipsis");
				for (let i = page - 1; i <= page + 1; i++) nums.push(i);
				nums.push("ellipsis");
				nums.push(pages);
			}
			return nums;
		};

		return (
			<div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border">
				{/* Page X of Y */}
				<p className="text-sm text-muted-foreground">
					{t("pageOf", { current: page, total: pages })}
				</p>

				{/* Pagination Buttons */}
				<div className="flex items-center gap-1.5">
					{/* Previous */}
					<Button
						variant="outline"
						size="sm"
						disabled={page <= 1}
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						className="gap-1 h-9 px-3 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 disabled:opacity-40"
					>
						{isRTL ? (
							<ChevronRight className="size-4" />
						) : (
							<ChevronLeft className="size-4" />
						)}
						<span className="hidden sm:inline">{t("back")}</span>
					</Button>

					{/* Page Numbers */}
					{getPageNumbers().map((num, idx) =>
						num === "ellipsis" ? (
							<span
								key={`ellipsis-${idx}`}
								className="px-1 text-muted-foreground"
							>
								…
							</span>
						) : (
							<Button
								key={num}
								variant={page === num ? "default" : "outline"}
								size="sm"
								className={`h-9 w-9 p-0 transition-all duration-200 ${
									page === num
										? "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/25 border-amber-600"
										: "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950"
								}`}
								onClick={() => setPage(num)}
							>
								{num}
							</Button>
						),
					)}

					{/* Next */}
					<Button
						variant="outline"
						size="sm"
						disabled={page >= pages}
						onClick={() => setPage((p) => Math.min(pages, p + 1))}
						className="gap-1 h-9 px-3 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 disabled:opacity-40"
					>
						<span className="hidden sm:inline">{t("next")}</span>
						{isRTL ? (
							<ChevronLeft className="size-4" />
						) : (
							<ChevronRight className="size-4" />
						)}
					</Button>
				</div>
			</div>
		);
	};

	// Skeleton card component
	const SkeletonCard = () => (
		<div className="bg-card rounded-xl border border-border overflow-hidden">
			<div className="aspect-square skeleton-emerald relative overflow-hidden">
				<div className="absolute bottom-0 inset-x-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent" />
				<div className="absolute top-2 start-2 h-5 w-14 skeleton-emerald rounded-full" />
				<div className="absolute top-2 end-2 h-5 w-10 skeleton-emerald rounded-full" />
			</div>
			<div className="p-3 space-y-2">
				<div className="h-3 w-1/3 skeleton-emerald rounded" />
				<div className="h-4 w-3/4 skeleton-emerald rounded" />
				<div className="flex items-center gap-0.5">
					{Array.from({ length: 5 }, (_, j) => (
						<div key={j} className="size-3 skeleton-emerald rounded-sm" />
					))}
					<div className="h-3 w-12 skeleton-emerald rounded ms-1" />
				</div>
				<div className="flex items-baseline gap-2">
					<div className="h-5 w-16 skeleton-emerald rounded" />
					<div className="h-3 w-12 skeleton-emerald rounded" />
				</div>
				<div className="h-8 w-full skeleton-emerald rounded-lg mt-1" />
			</div>
		</div>
	);

	// Skeleton list item component
	const SkeletonListItem = () => (
		<Card className="overflow-hidden">
			<div className="flex gap-4 p-4">
				<div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-lg skeleton-emerald" />
				<div className="flex-1 space-y-2">
					<div className="h-4 w-3/4 skeleton-emerald rounded" />
					<div className="h-3 w-1/4 skeleton-emerald rounded" />
					<div className="flex items-center gap-0.5">
						{Array.from({ length: 5 }, (_, j) => (
							<div key={j} className="size-3 skeleton-emerald rounded-sm" />
						))}
					</div>
					<div className="flex items-baseline gap-2">
						<div className="h-5 w-20 skeleton-emerald rounded" />
						<div className="h-3 w-16 skeleton-emerald rounded" />
					</div>
					<div className="h-8 w-28 skeleton-emerald rounded-lg" />
				</div>
			</div>
		</Card>
	);

	return (
		<div className="container mx-auto px-4 py-4">
			{/* Active Filters Summary Bar */}
			{activeFilters.length > 0 && (
				<div className="mb-4 p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-800/60 backdrop-blur-sm">
					<div className="flex flex-wrap items-center gap-2">
						<div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 me-1">
							<Filter className="size-3.5" />
							<span className="text-xs font-semibold uppercase tracking-wider">
								{t("activeFilters")}:
							</span>
						</div>
						{activeFilters.map((filter) => (
							<Badge
								key={`${filter.type}-${filter.value}`}
								variant="secondary"
								className="gap-1 bg-white dark:bg-card text-amber-700 dark:text-amber-300 pr-1 pl-2.5 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/70 transition-all duration-200 shadow-sm"
							>
								{filter.label}
								<button
									onClick={() => removeFilter(filter)}
									className="hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full p-0.5 transition-all hover:scale-110 active:scale-90 text-amber-500 hover:text-red-500"
									aria-label={t("removeFilter")}
								>
									<X className="size-3" />
								</button>
							</Badge>
						))}
						<Button
							variant="ghost"
							size="sm"
							className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 ms-1"
							onClick={clearAllFilters}
						>
							<RotateCcw className="size-3 me-1" />
							{t("clearFilters")}
						</Button>
					</div>
				</div>
			)}

			<div className="flex gap-6">
				{/* Desktop Sidebar Filters */}
				<aside className="hidden lg:block w-72 shrink-0">
					<div className="sticky top-4 rounded-xl border border-amber-200/60 dark:border-amber-800/60 bg-card overflow-hidden shadow-sm shadow-amber-500/5">
						{/* Gradient Accent Bar */}
						<div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />

						<div className="p-4 relative overflow-hidden">
							{/* Subtle decorative element */}
							<div className="absolute top-6 end-2 w-20 h-20 rounded-full bg-amber-100/30 dark:bg-amber-900/20 blur-2xl pointer-events-none" />

							<div className="flex items-center justify-between mb-4">
								<h3 className="font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
									<SlidersHorizontal className="size-4" />
									{t("filter")}
								</h3>
								{activeFilters.length > 0 && (
									<Button
										variant="ghost"
										size="sm"
										className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-7"
										onClick={clearAllFilters}
									>
										<RotateCcw className="size-3 me-1" />
										{t("clearAll")}
									</Button>
								)}
							</div>
							<ScrollArea className="max-h-[calc(100vh-10rem)] overflow-hidden">
								<FilterContent />
							</ScrollArea>
						</div>
					</div>
				</aside>

				{/* Main Content */}
				<div className="flex-1 min-w-0">
					{/* Results Summary Bar: Sort, View Toggle, Product Count, Mobile Filters */}
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 p-3 bg-muted/30 dark:bg-muted/10 rounded-xl border border-border/50 overflow-hidden">
						<div className="flex items-center gap-3 w-full sm:w-auto">
							{/* Mobile Filter Button */}
							<Sheet
								open={mobileFiltersOpen}
								onOpenChange={setMobileFiltersOpen}
							>
								<SheetTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="lg:hidden gap-1.5 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 h-9"
									>
										<SlidersHorizontal className="size-4" />
										{t("filter")}
										{activeFilters.length > 0 && (
											<Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 ms-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
												{activeFilters.length}
											</Badge>
										)}
									</Button>
								</SheetTrigger>
								<SheetContent
									side={isRTL ? "right" : "left"}
									className="w-80 p-0"
								>
									{/* Gradient Accent Bar */}
									<div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />
									<SheetHeader className="px-4 pt-4">
										<SheetTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
											<SlidersHorizontal className="size-4" />
											{t("filter")}
										</SheetTitle>
									</SheetHeader>
									<div className="px-4 pb-4 mt-2">
										{activeFilters.length > 0 && (
											<div className="flex items-center gap-2 mb-3 p-2 bg-amber-50/50 dark:bg-amber-950/30 rounded-lg">
												<span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
													{activeFilters.length} {isRTL ? "نشط" : "active"}
												</span>
												<Button
													variant="ghost"
													size="sm"
													className="text-xs text-red-500 hover:text-red-600 ms-auto h-6 px-2"
													onClick={clearAllFilters}
												>
													{t("clearAll")}
												</Button>
											</div>
										)}
										<ScrollArea className="max-h-[calc(100vh-10rem)]">
											<FilterContent />
										</ScrollArea>
									</div>
								</SheetContent>
							</Sheet>

							{/* Results Count */}
							<span className="text-sm text-muted-foreground whitespace-nowrap">
								{loading ? (
									<Skeleton className="h-4 w-32 inline-block" />
								) : (
									<>
										<span
											className={`font-bold text-amber-600 dark:text-amber-400 ${countAnimating ? "animate-product-count" : ""}`}
										>
											{total}
										</span>{" "}
										{isRTL ? "منتج" : t("productsFound")}
									</>
								)}
							</span>
						</div>

						{/* Sort Dropdown + View Toggle */}
						<div className="flex items-center gap-2 w-full sm:w-auto">
							<Select
								value={sort}
								onValueChange={(v) => {
									setSort(v as SortValue);
									setPage(1);
								}}
							>
								<SelectTrigger className="w-44 text-sm h-9 border-amber-200 dark:border-amber-800 focus:ring-amber-500/30">
									<ArrowUp className="size-3.5 text-amber-500 me-1" />
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="newest">
										<span className="flex items-center gap-2">
											<Clock className="size-3.5" /> {t("newest")}
										</span>
									</SelectItem>
									<SelectItem value="price-asc">
										<span className="flex items-center gap-2">
											<ArrowUp className="size-3.5" /> {t("priceLowHigh")}
										</span>
									</SelectItem>
									<SelectItem value="price-desc">
										<span className="flex items-center gap-2">
											<ArrowDown className="size-3.5" /> {t("priceHighLow")}
										</span>
									</SelectItem>
									<SelectItem value="rating">
										<span className="flex items-center gap-2">
											<Star className="size-3.5" /> {t("bestRating")}
										</span>
									</SelectItem>
									<SelectItem value="popular">
										<span className="flex items-center gap-2">
											<Heart className="size-3.5" /> {t("mostPopular")}
										</span>
									</SelectItem>
								</SelectContent>
							</Select>

							{/* Grid/List View Toggle */}
							<div className="flex items-center border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden">
								<Button
									variant={viewMode === "grid" ? "default" : "ghost"}
									size="icon"
									className={`size-9 rounded-none transition-all duration-200 ${
										viewMode === "grid"
											? "bg-amber-600 text-white hover:bg-amber-700"
											: "text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
									}`}
									onClick={() => handleViewModeChange("grid")}
									aria-label={t("gridView")}
								>
									<LayoutGrid className="size-4" />
								</Button>
								<Button
									variant={viewMode === "list" ? "default" : "ghost"}
									size="icon"
									className={`size-9 rounded-none transition-all duration-200 ${
										viewMode === "list"
											? "bg-amber-600 text-white hover:bg-amber-700"
											: "text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
									}`}
									onClick={() => handleViewModeChange("list")}
									aria-label={t("listView")}
								>
									<List className="size-4" />
								</Button>
							</div>
						</div>
					</div>

					{/* Product Grid/List */}
					{loading ? (
						<div
							className={
								viewMode === "grid"
									? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
									: "space-y-3"
							}
						>
							{Array.from({ length: 8 }, (_, i) => (
								<div key={i} style={{ animationDelay: `${i * 0.05}s` }}>
									{viewMode === "grid" ? (
										<SkeletonCard />
									) : (
										<SkeletonListItem />
									)}
								</div>
							))}
						</div>
					) : products.length === 0 ? (
						/* Empty State */
						<div className="text-center py-20">
							<div className="relative inline-block mb-6 overflow-hidden p-4">
								{/* Decorative circles */}
								<div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 animate-pulse" />
								<div
									className="absolute -bottom-2 -left-6 w-14 h-14 rounded-full bg-yellow-100 dark:bg-yellow-900/30 animate-pulse"
									style={{ animationDelay: "0.5s" }}
								/>
								<div className="absolute top-1/2 -right-8 w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-800/30" />
								{/* Main icon */}
								<div className="relative bg-amber-50 dark:bg-amber-950/40 rounded-2xl p-6 border border-amber-200/60 dark:border-amber-800/60">
									<PackageSearch className="size-16 text-amber-400 dark:text-amber-600" />
								</div>
							</div>
							<h3 className="text-xl font-bold mb-2">{t("noProductsFound")}</h3>
							<p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
								{t("noProductsMatchDesc")}
							</p>
							<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
								{activeFilters.length > 0 && (
									<Button
										className="bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/25"
										onClick={clearAllFilters}
									>
										<RotateCcw className="size-4 me-1.5" />
										{t("clearFilters")}
									</Button>
								)}
								<Button
									asChild
									variant="outline"
									className="border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950"
								>
									<Link href="/shop">
										<Store className="size-4 me-1.5" />
										{t("browseAllProducts")}
									</Link>
								</Button>
							</div>
						</div>
					) : viewMode === "grid" ? (
						<div
							className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 transition-opacity duration-300 ${isGridAnimating ? "opacity-0" : "opacity-100"}`}
						>
							{products.map((product, idx) => (
								<div
									key={product.id}
									className="animate-card-appear group/card-wrapper"
									style={{ animationDelay: `${idx * 0.05}s` }}
								>
									<div className="transition-transform duration-300 group-hover/card-wrapper:scale-[1.02]">
										<ProductCard
											product={product}
											onQuickView={handleQuickView}
										/>
									</div>
								</div>
							))}
						</div>
					) : (
						<div
							className={`space-y-3 transition-opacity duration-300 ${isGridAnimating ? "opacity-0" : "opacity-100"}`}
						>
							{products.map((product) => {
								const displayName =
									isRTL && product.nameAr ? product.nameAr : product.name;
								const discount = product.originalPrice
									? Math.round(
											((product.originalPrice - product.price) /
												product.originalPrice) *
												100,
										)
									: 0;
								return (
									<Link
										key={product.id}
										href={`/product/${product.id}`}
										className="block"
									>
										<Card className="overflow-hidden cursor-pointer hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300 group/list">
											<div className="flex gap-4 p-4">
												<div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-lg bg-muted overflow-hidden relative">
													<div className="w-full h-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-950 dark:to-yellow-950 flex items-center justify-center">
														<ShoppingCart className="size-8 text-amber-400 opacity-50" />
													</div>
													{/* Sale badge on list view - more prominent */}
													{discount > 0 && (
														<div className="absolute top-1 start-1">
															<Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 font-bold shadow-md shadow-red-500/30 animate-deal-pulse">
																-{discount}% {t("off")}
															</Badge>
														</div>
													)}
												</div>
												<div className="flex-1 min-w-0 space-y-1.5">
													<h3 className="font-medium line-clamp-1 group-hover/list:text-amber-600 dark:group-hover/list:text-amber-400 transition-colors">
														{displayName}
													</h3>
													{product.store && (
														<p className="text-xs text-muted-foreground">
															{product.store.name}
														</p>
													)}
													<div className="flex items-center gap-1">
														{Array.from({ length: 5 }, (_, i) => (
															<Star
																key={i}
																className={`size-3 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
															/>
														))}
														<span className="text-[10px] text-muted-foreground">
															({product.reviewCount})
														</span>
													</div>
													<div className="flex items-baseline gap-2">
														<span className="font-bold text-amber-600 dark:text-amber-400">
															{formatPrice(product.price)}
														</span>
														{product.originalPrice && discount > 0 && (
															<span className="text-xs text-muted-foreground line-through">
																{formatPrice(product.originalPrice)}
															</span>
														)}
													</div>
													<div className="flex items-center gap-2 pt-1">
														<Button
															size="sm"
															className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 rounded-lg shadow-sm shadow-amber-500/20"
															onClick={(e) => {
																e.preventDefault();
																e.stopPropagation();
															}}
														>
															<ShoppingCart className="size-3 me-1" />
															{t("addToCart")}
														</Button>
														{product.hasFreeShipping && (
															<Badge
																variant="secondary"
																className="text-[9px] bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
															>
																<Truck className="size-2.5 me-0.5" />
																{t("freeShipping")}
															</Badge>
														)}
													</div>
												</div>
											</div>
										</Card>
									</Link>
								);
							})}
						</div>
					)}

					{/* Pagination */}
					{!loading && renderPagination()}

					{/* Load More alternative */}
					{!loading && products.length > 0 && page < pages && (
						<div className="text-center mt-6">
							<Button
								variant="outline"
								className="border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 shadow-sm"
								onClick={() => setPage((p) => p + 1)}
							>
								{t("loadMore")}
								<ChevronDown className="size-4 ms-1" />
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Quick View Dialog */}
			<ProductQuickView
				product={quickViewProduct}
				open={quickViewOpen}
				onClose={() => setQuickViewOpen(false)}
			/>
		</div>
	);
}
