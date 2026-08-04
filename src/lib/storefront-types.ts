export interface StorefrontCategory {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  icon?: string;
  image?: string;
  productCount: number;
}

export interface StorefrontStoreSummary {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  slug: string;
  logo?: string;
  banner?: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  productCount: number;
  location?: string;
  memberSince: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorefrontProductVariant {
  id: string;
  sku: string;
  attributes: string;
  optionKey: string;
  price: number;
  originalPrice?: number;
  stock: number;
  isActive: boolean;
}

export interface StorefrontProduct {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  originalPrice?: number;
  images: string;
  categoryId: string;
  storeId: string;
  sku?: string;
  stock: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  views: number;
  isFeatured: boolean;
  isNew: boolean;
  isSale: boolean;
  isB2b: boolean;
  hasFreeShipping: boolean;
  variations: string;
  tieredPricing: string;
  tags: string;
  status: string;
  hasVariants: boolean;
  variantSkus?: StorefrontProductVariant[];
  category: {
    id: string;
    name: string;
    nameAr?: string;
    slug: string;
  };
  store: {
    id: string;
    name: string;
    nameAr?: string;
    rating: number;
    isVerified: boolean;
    location?: string;
    productCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StorefrontHeroBanner {
  id: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  ctaText?: string;
  ctaTextAr?: string;
  ctaLink?: string;
  gradient?: string;
  icon?: string;
}

export interface StorefrontReview {
  id: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  comment: string;
  date: string;
}

export interface RatingDistributionEntry {
  count: number;
  percentage: number;
}

export interface StorefrontReviewsData {
  reviews: StorefrontReview[];
  total: number;
  averageRating: number;
  ratingDistribution: Record<string, RatingDistributionEntry>;
}

export interface HomePageData {
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
  stores: StorefrontStoreSummary[];
  heroBanners: StorefrontHeroBanner[];
}

export interface ProductDetailData {
  product: StorefrontProduct;
  similarProducts: StorefrontProduct[];
  relatedProducts: StorefrontProduct[];
}

export interface StorePageData {
  store: StorefrontStoreSummary;
  products: StorefrontProduct[];
  similarStores: StorefrontStoreSummary[];
  reviews: StorefrontReviewsData;
}

export type ProductSort =
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'rating'
  | 'popular';

export interface ProductListingQuery {
  page: number;
  limit: number;
  categoryId?: string;
  search?: string;
  sort: ProductSort;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  freeShipping?: boolean;
  b2bOnly?: boolean;
  onSale?: boolean;
}

export interface ProductListingData {
  products: StorefrontProduct[];
  categories: StorefrontCategory[];
  total: number;
  page: number;
  pages: number;
}

export type StoreSort = 'rating' | 'products' | 'newest';

export interface StoreListingQuery {
  page: number;
  limit: number;
  search?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  sort: StoreSort;
}

export interface StoreListingData {
  stores: StorefrontStoreSummary[];
  total: number;
  page: number;
  pages: number;
}

export interface SitemapStorefrontData {
  products: Array<{ id: string; updatedAt: Date }>;
  stores: Array<{ id: string; updatedAt: Date }>;
  categories: Array<{ slug: string; createdAt: Date }>;
}
