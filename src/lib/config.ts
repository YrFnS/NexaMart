/**
 * NexaMart - Centralized Configuration
 *
 * All app-wide constants, defaults, and configuration values
 * should be defined here instead of being hardcoded across components.
 */

// ─── App Branding ────────────────────────────────────────────────────────────

export const APP_NAME = "NexaMart";
export const APP_TAGLINE = "AI-Powered Multi-Vendor Commerce";
export const APP_DESCRIPTION =
	"Discover thousands of products from verified sellers with AI-powered shopping";
export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "nexamart.com";
export const APP_URL = `https://${APP_DOMAIN}`;
export const APP_SUPPORT_EMAIL = `support@${APP_DOMAIN}`;
export const APP_NOREPLY_EMAIL = `noreply@${APP_DOMAIN}`;
export const APP_SUPPORT_PHONE =
	process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+966 50 123 4567";
export const APP_ADDRESS =
	process.env.NEXT_PUBLIC_APP_ADDRESS || "Dubai, UAE & Riyadh, KSA";

export const APP_SOCIAL_LINKS = {
	facebook: `https://facebook.com/${APP_NAME.toLowerCase()}`,
	twitter: `https://twitter.com/${APP_NAME.toLowerCase()}`,
	instagram: `https://instagram.com/${APP_NAME.toLowerCase()}`,
	youtube: `https://youtube.com/@${APP_NAME.toLowerCase()}`,
	linkedin: `https://linkedin.com/company/${APP_NAME.toLowerCase()}`,
} as const;

// ─── SEO Defaults ────────────────────────────────────────────────────────────

export const SEO_DEFAULTS = {
	title: `${APP_NAME} - AI-Powered Shopping`,
	metaDescription: APP_DESCRIPTION,
	ogImage: "/og-image.png",
	analyticsId: process.env.NEXT_PUBLIC_GA_ID || "",
};

// ─── AI / OpenRouter ─────────────────────────────────────────────────────────

export const AI_CONFIG = {
	baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
	defaultModel: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
	referer: APP_URL,
	title: `${APP_NAME} AI Commerce Platform`,
	defaultTemperature: 0.7,
	defaultMaxTokens: 1024,
	jsonTemperature: 0.3,
	jsonMaxTokens: 2048,
};

// ─── Shipping ────────────────────────────────────────────────────────────────

export const SHIPPING_CONFIG = {
	freeShippingThreshold: 100,
	defaultShippingRate: 5.99,
	estimatedDeliveryDays: 5,
	methods: {
		standard: { id: "standard", price: 0, days: "5-7" },
		express: { id: "express", price: 9.99, days: "2-3" },
		nextDay: { id: "next_day", price: 19.99, days: "1" },
	},
	chatServicePort: parseInt(
		process.env.NEXT_PUBLIC_CHAT_SERVICE_PORT || "3003",
		10,
	),
};

// ─── Commission & Fees ───────────────────────────────────────────────────────

export const COMMISSION_CONFIG = {
	defaultRate: 10,
	proSubscriptionPrice: 29.99,
	unlimitedMonthlyPrice: 49.99,
	paymentGatewayFee: 2.5,
	minPayoutThreshold: 50,
	currencyConversionFee: 2.5,
};

// ─── AI Credits / Token Prices ───────────────────────────────────────────────

export const AI_CREDIT_PACKAGES = [
	{ credits: 10, price: 4.99, perCredit: 0.5 },
	{ credits: 50, price: 19.99, perCredit: 0.4, popular: true },
	{ credits: 100, price: 34.99, perCredit: 0.35 },
	{ credits: -1, price: 9.99, perCredit: 0, unlimited: true, monthly: false },
];

// ─── Ad Products (Promoted Listings) ─────────────────────────────────────────

export const AD_PRODUCTS = [
	{ id: "bump", price: 2.99, durationDays: 1, viewsIncrease: 300 },
	{ id: "featured", price: 9.99, durationDays: 7, viewsIncrease: 500 },
	{ id: "premium", price: 19.99, durationDays: 14, viewsIncrease: 800 },
	{ id: "urgent", price: 4.99, durationDays: 7, viewsIncrease: 200 },
	{ id: "spotlight", price: 29.99, durationDays: 3, viewsIncrease: 1200 },
];

// ─── Loyalty Program ─────────────────────────────────────────────────────────

export const LOYALTY_CONFIG = {
	defaultTier: "Silver" as const,
	defaultPoints: 500,
	defaultWalletBalance: 50.0,
	defaultCredits: 10,
	rewards: [
		{ id: "r-1", name: "$2 Discount", pointsCost: 200 },
		{ id: "r-2", name: "$5 Discount", pointsCost: 450 },
		{ id: "r-3", name: "Free Shipping", pointsCost: 600 },
		{ id: "r-4", name: "$10 Discount", pointsCost: 850 },
	],
};

// ─── Auth / User Defaults ────────────────────────────────────────────────────

export const AUTH_CONFIG = {
	minPasswordLength: 6,
	demoUser: {
		id: "demo-user",
		email: "demo@nexamart.com",
		name: "Demo User",
		role: "admin" as const,
		loyaltyTier: "gold",
		loyaltyPoints: 2500,
		walletBalance: 150.0,
		aiCredits: 50,
		isVerified: true,
	},
	defaultNewUser: {
		role: "buyer" as const,
		loyaltyTier: LOYALTY_CONFIG.defaultTier,
		loyaltyPoints: LOYALTY_CONFIG.defaultPoints,
		walletBalance: LOYALTY_CONFIG.defaultWalletBalance,
		aiCredits: LOYALTY_CONFIG.defaultCredits,
		isVerified: false,
	},
};

// ─── Tax / VAT ───────────────────────────────────────────────────────────────

export const TAX_CONFIG = {
	defaultRate: 15,
	defaultLabel: "VAT",
	inclusivePricing: false,
	exemptCategories: "Books, Food",
};

// ─── Store Limits ────────────────────────────────────────────────────────────

export const STORE_LIMITS = {
	maxProductsPerStore: 500,
	maxImagesPerProduct: 10,
	maxOrderAmount: 50000,
	minOrderAmount: 1,
	escrowPeriodDays: 7,
	sessionTimeoutMinutes: 30,
	maxLoginAttempts: 5,
	rateLimitPerMinute: 100,
	apiRateLimitPerMinute: 1000,
	dataRetentionDays: 365,
	adminItemsPerPage: 8,
	maxRecentlyViewed: 20,
	maxCompareItems: 4,
	priceAlertExpiryDays: 90,
};

// ─── Email / SMTP ────────────────────────────────────────────────────────────

export const SMTP_CONFIG = {
	host: `smtp.${APP_DOMAIN}`,
	port: 587,
	encryption: "tls" as const,
	username: APP_NOREPLY_EMAIL,
};

// ─── Social / Sharing ────────────────────────────────────────────────────────

export const SOCIAL_SHARE = {
	whatsapp: (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`,
	whatsappDirect: (phone: string, text: string) =>
		`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`,
	twitter: (text: string, url: string) =>
		`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
	facebook: (url: string) =>
		`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
	telegram: (url: string, text: string) =>
		`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
	email: (subject: string, body: string) =>
		`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
};

// ─── Default Seller Phone ────────────────────────────────────────────────────
export const DEFAULT_SELLER_PHONE =
	process.env.NEXT_PUBLIC_DEFAULT_SELLER_PHONE || "+971501234567";

// ─── localStorage Keys ───────────────────────────────────────────────────────

export const LS_KEYS = {
	user: "nexamart_user",
	cart: "nexamart_cart",
	currency: "nexamart_currency",
	country: "nexamart_country",
	locale: "nexamart_locale",
	onboarded: "nexamart_onboarded",
	checkoutAddress: "nexamart_checkout_address",
	selectedCity: "nexamart_selected_city",
	recentSearches: "nexamart_recent_searches",
	savedSearches: "nexamart_saved_searches",
	followedStores: "nexamart_followed_stores",
	cookieConsent: "nexamart_cookie_consent",
	adminSettings: "nexamart_admin_settings",
} as const;

// ─── Default Timezone ────────────────────────────────────────────────────────

export const DEFAULT_TIMEZONE =
	process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || "Asia/Riyadh";

// ─── External Image Service ──────────────────────────────────────────────────

export const IMAGE_SERVICES = {
	/** Placeholder image service for demo/mock data */
	picsum: (seed: string, width = 400, height = 400) =>
		`https://picsum.photos/seed/${seed}/${width}/${height}`,
};

export const PAYMENT_METHODS = [
	{ name: "Visa", color: "bg-[#1A1F71] text-white" },
	{ name: "Mastercard", color: "bg-[#EB001B] text-white" },
	{ name: "PayPal", color: "bg-[#003087] text-white" },
	{ name: "Apple Pay", color: "bg-white text-black" },
	{ name: "COD", color: "bg-emerald-600 text-white" },
	{ name: "Tabby", color: "bg-[#3BFFC0] text-[#1a1a2e]" },
] as const;

// ─── UI Constants ──────────────────────────────────────────────────────────

export const UI_CONFIG = {
	carouselAutoAdvanceMs: 5000,
	socialProofAutoDismissMs: 5000,
	socialProofInitialDelayMs: 10000,
	productsPerPage: 12,
	maxProductPrice: 2000,
	scrollThresholdForFAB: 600,
	defaultCarYearTo: new Date().getFullYear() + 1,
};
