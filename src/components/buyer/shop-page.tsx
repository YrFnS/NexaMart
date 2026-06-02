"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
	SlidersHorizontal,
	X,
	Star,
	ChevronDown,
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
	Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/currency";
import { useAppStore } from "@/stores/app-store";

import { ProductCard, type Product } from "@/components/buyer/product-card";
import { ProductQuickView } from "@/components/buyer/product-quick-view";
import type { Category } from "@/components/buyer/category-grid";
import { ShopFilters } from "@/components/buyer/shop-filters";
import { ShopPagination } from "@/components/buyer/shop-pagination";
import {
	ShopSkeletonCard,
	ShopSkeletonListItem,
} from "@/components/buyer/shop-skeletons";

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

	const isRTL = locale === "ar";

	const [categories, setCategories] = useState<Category[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [total, setTotal] = useState(0);
	const [pages, setPages] = useState(1);

	const [categoryId, setCategoryId] = useState<string | null>(selectedCategory);
	const [sort, setSort] = useState<SortValue>("newest");
	const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
	const [minRating, setMinRating] = useState(0);
	const [freeShipping, setFreeShipping] = useState(false);
	const [b2bOnly, setB2bOnly] = useState(false);
	const [onSale, setOnSale] = useState(false);
	const [search, setSearch] = useState(searchQuery);
	const [page, setPage] = useState(1);

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

	useEffect(() => {
		fetch("/api/categories")
			.then((res) => res.json())
			.then((data) => setCategories(Array.isArray(data) ? data : []))
			.catch(() => {});
	}, []);

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

	useEffect(() => {
		if (prevTotalRef.current !== 0 && prevTotalRef.current !== total) {
			setCountAnimating(true);
			const timer = setTimeout(() => setCountAnimating(false), 400);
			return () => clearTimeout(timer);
		}
		prevTotalRef.current = total;
	}, [total]);

	useEffect(() => {
		if (selectedCategory) setCategoryId(selectedCategory);
	}, [selectedCategory]);

	useEffect(() => {
		if (searchQuery) setSearch(searchQuery);
	}, [searchQuery]);

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

	const handleCategoryChange = (id: string | null) => {
		setCategoryId(id);
		selectCategory(id);
		setPage(1);
	};

	const handlePriceRangeChange = (val: [number, number]) => {
		setPriceRange(val);
		setPage(1);
	};

	const handleMinRatingChange = (val: number) => {
		setMinRating(val);
		setPage(1);
	};

	const handleFreeShippingChange = (val: boolean) => {
		setFreeShipping(val);
		setPage(1);
	};

	const handleB2bOnlyChange = (val: boolean) => {
		setB2bOnly(val);
		setPage(1);
	};

	const handleSaleChange = (val: boolean) => {
		setOnSale(val);
		setPage(1);
	};

	const filterProps = {
		locale,
		isRTL,
		categories,
		categoryId,
		search,
		priceRange,
		minRating,
		freeShipping,
		b2bOnly,
		onSale,
		onCategoryChange: handleCategoryChange,
		onSearchChange: setSearch,
		onSearchSubmit: handleSearch,
		onPriceRangeChange: handlePriceRangeChange,
		onMinRatingChange: handleMinRatingChange,
		onFreeShippingChange: handleFreeShippingChange,
		onB2bOnlyChange: handleB2bOnlyChange,
		onSaleChange: handleSaleChange,
	};

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
						<div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />
						<div className="p-4 relative overflow-hidden">
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
								<ShopFilters {...filterProps} />
							</ScrollArea>
						</div>
					</div>
				</aside>

				{/* Main Content */}
				<div className="flex-1 min-w-0">
					{/* Results Summary Bar */}
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 p-3 bg-muted/30 dark:bg-muted/10 rounded-xl border border-border/50 overflow-hidden">
						<div className="flex items-center gap-3 w-full sm:w-auto">
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
											<ShopFilters {...filterProps} />
										</ScrollArea>
									</div>
								</SheetContent>
							</Sheet>

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
										<ShopSkeletonCard />
									) : (
										<ShopSkeletonListItem />
									)}
								</div>
							))}
						</div>
					) : products.length === 0 ? (
						<div className="text-center py-20">
							<div className="relative inline-block mb-6 overflow-hidden p-4">
								<div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 animate-pulse" />
								<div
									className="absolute -bottom-2 -left-6 w-14 h-14 rounded-full bg-yellow-100 dark:bg-yellow-900/30 animate-pulse"
									style={{ animationDelay: "0.5s" }}
								/>
								<div className="absolute top-1/2 -right-8 w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-800/30" />
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

					{!loading && (
						<ShopPagination
							locale={locale}
							page={page}
							pages={pages}
							onPageChange={setPage}
						/>
					)}

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

			<ProductQuickView
				product={quickViewProduct}
				open={quickViewOpen}
				onClose={() => setQuickViewOpen(false)}
			/>
		</div>
	);
}
