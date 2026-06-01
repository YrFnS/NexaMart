"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

import { useI18n } from "@/lib/i18n";
import { type Product } from "@/components/buyer/product-card";
import { type Category } from "@/components/buyer/category-grid";
import { ProductQuickView } from "@/components/buyer/product-quick-view";
import {
	HeroSection,
	CategorySection,
	FeaturedProductsSection,
	FlashSaleBanner,
	RecentlyViewed,
	TrustStrip,
	TopBrandsSectionWrapper,
	FeaturedStoresSectionWrapper,
	TopRatedSectionWrapper,
	SellersNearYouSectionWrapper,
	AIRecommendationsSection,
	DealsSection,
	NewsletterSection,
	TrendingSearchesSection,
	LocationGuideSection,
	type FeaturedStore,
} from "@/components/buyer/home";

export function HomePage() {
	const { t, locale } = useI18n();
	const isRTL = locale === "ar";

	// Quick view state
	const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
		null,
	);
	const [quickViewOpen, setQuickViewOpen] = useState(false);

	// Data state
	const [categories, setCategories] = useState<Category[]>([]);
	const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
	const [newProducts, setNewProducts] = useState<Product[]>([]);
	const [saleProducts, setSaleProducts] = useState<Product[]>([]);
	const [featuredStores, setFeaturedStores] = useState<FeaturedStore[]>([]);
	const [allStores, setAllStores] = useState<FeaturedStore[]>([]);

	// Hero banners from admin
	const [heroBanners, setHeroBanners] = useState<
		{
			id: string;
			title: string;
			titleAr: string | null;
			description: string | null;
			descriptionAr: string | null;
			ctaText: string | null;
			ctaTextAr: string | null;
			ctaLink: string | null;
			gradient: string | null;
			icon: string | null;
		}[]
	>([]);

	// Stats state — fetched from API, with fallback to counting fetched data
	const [platformStats, setPlatformStats] = useState<{
		products: number;
		sellers: number;
		users: number;
		countries: number;
	} | null>(null);

	// AI recommendations = memoized mix of featured + sale + new
	const aiProducts = useMemo(() => {
		const mixed = [
			...featuredProducts.slice(0, 3),
			...saleProducts.slice(0, 3),
			...newProducts.slice(0, 2),
		];
		const unique = mixed.filter(
			(p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
		);
		return unique.slice(0, 6);
	}, [featuredProducts, saleProducts, newProducts]);

	// Fetch all data
	useEffect(() => {
		const fetchData = async () => {
			try {
				const [
					catRes,
					featRes,
					newRes,
					saleRes,
					storesRes,
					statsRes,
					bannerRes,
				] = await Promise.all([
					fetch("/api/categories"),
					fetch("/api/products?featured=true&limit=10"),
					fetch("/api/products?new=true&limit=12"),
					fetch("/api/products?sale=true&limit=8"),
					fetch("/api/stores"),
					fetch("/api/stats"),
					fetch("/api/banners?position=hero"),
				]);

				if (catRes.ok) {
					const catData = await catRes.json();
					setCategories(Array.isArray(catData) ? catData : []);
				}
				if (featRes.ok) {
					const featData = await featRes.json();
					setFeaturedProducts(featData.products || []);
				}
				if (newRes.ok) {
					const newData = await newRes.json();
					setNewProducts(newData.products || []);
				}
				if (saleRes.ok) {
					const saleData = await saleRes.json();
					setSaleProducts(saleData.products || []);
				}
				if (storesRes.ok) {
					const storesData = await storesRes.json();
					const storesArr = Array.isArray(storesData) ? storesData : [];
					setAllStores(
						[...storesArr].sort(
							(a: FeaturedStore, b: FeaturedStore) => b.rating - a.rating,
						),
					);
					setFeaturedStores(
						storesArr.filter((s: FeaturedStore) => s.isVerified).slice(0, 4),
					);
				}
				if (statsRes.ok) {
					const statsData = await statsRes.json();
					if (statsData.products !== undefined) {
						setPlatformStats(statsData);
					}
				}
				if (bannerRes.ok) {
					const bannerData = await bannerRes.json();
					if (bannerData.banners && bannerData.banners.length > 0) {
						setHeroBanners(bannerData.banners);
					}
				}
			} catch {
				// silently fail
			}
		};
		fetchData();
	}, []);

	// Fallback: if stats API returned 0 or null, compute from fetched data
	const displayStats =
		platformStats && (platformStats.products > 0 || platformStats.sellers > 0)
			? platformStats
			: {
					products:
						featuredProducts.length + newProducts.length + saleProducts.length,
					sellers: allStores.length,
					users: 0,
					countries: 0,
				};

	// Default fallback slides (used when no banners from admin)
	const defaultSlides = [
		{
			title: t("heroTitle"),
			description: t("heroDesc"),
			gradient: "from-amber-600 via-yellow-600 to-orange-600",
			cta: t("shopNow"),
			ctaLink: "/shop",
			icon: "Sparkles" as string,
		},
		{
			title: t("heroSlide2Title"),
			description: t("heroSlide2Desc"),
			gradient: "from-yellow-600 via-amber-600 to-orange-600",
			cta: t("shopNow"),
			ctaLink: "/deals",
			icon: "Zap" as string,
		},
		{
			title: t("heroSlide3Title"),
			description: t("heroSlide3Desc"),
			gradient: "from-orange-600 via-yellow-600 to-amber-600",
			cta: t("shopNow"),
			ctaLink: "/shop",
			icon: "TrendingUp" as string,
		},
	];

	// Build hero slides from admin banners (priority) or fallback to defaults
	const heroSlides =
		heroBanners.length > 0
			? heroBanners.map((b) => ({
					title: isRTL && b.titleAr ? b.titleAr : b.title,
					description:
						isRTL && b.descriptionAr ? b.descriptionAr : b.description || "",
					gradient: b.gradient || "from-emerald-600 via-teal-600 to-cyan-600",
					cta: isRTL && b.ctaTextAr ? b.ctaTextAr : b.ctaText || t("shopNow"),
					ctaLink: b.ctaLink || "/shop",
					icon: b.icon || "Sparkles",
				}))
			: defaultSlides;

	// Best discount from sale products (used in hero floating badge)
	const bestDiscount =
		saleProducts.length > 0
			? Math.max(
					...saleProducts
						.filter((p) => p.originalPrice)
						.map((p) =>
							Math.round(
								((p.originalPrice! - p.price) / p.originalPrice!) * 100,
							),
						),
				)
			: 0;

	const handleQuickView = useCallback((product: Product) => {
		setQuickViewProduct(product);
		setQuickViewOpen(true);
	}, []);

	// Most Popular products = all products sorted by soldCount
	const mostPopularProducts = useMemo(() => {
		const allProducts = [...featuredProducts, ...saleProducts, ...newProducts];
		const unique = allProducts.filter(
			(p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
		);
		return unique.sort((a, b) => b.soldCount - a.soldCount).slice(0, 8);
	}, [featuredProducts, saleProducts, newProducts]);

	return (
		<div className="space-y-12 md:space-y-16 overflow-x-hidden">
			<HeroSection heroSlides={heroSlides} bestDiscount={bestDiscount} />
			<FlashSaleBanner
				saleProducts={saleProducts}
				platformStats={displayStats}
			/>
			<TrendingSearchesSection />
			<TrustStrip />
			<CategorySection categories={categories} />
			<TopBrandsSectionWrapper allStores={allStores} />
			<FeaturedProductsSection
				featuredProducts={featuredProducts}
				newProducts={newProducts}
				mostPopularProducts={mostPopularProducts}
				onQuickView={handleQuickView}
			/>
			<FeaturedStoresSectionWrapper stores={featuredStores} />
			<AIRecommendationsSection
				aiProducts={aiProducts}
				onQuickView={handleQuickView}
			/>
			<DealsSection saleProducts={saleProducts} onQuickView={handleQuickView} />
			<TopRatedSectionWrapper products={featuredProducts} />
			<SellersNearYouSectionWrapper stores={featuredStores} />
			<RecentlyViewed />
			<LocationGuideSection />
			<NewsletterSection />
			<ProductQuickView
				product={quickViewProduct}
				open={quickViewOpen}
				onClose={() => setQuickViewOpen(false)}
			/>
		</div>
	);
}
