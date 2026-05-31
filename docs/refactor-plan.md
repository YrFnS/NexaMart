# Refactor Plan — God Files (>200 lines)

## Audit Summary

**39 files exceed 200 lines** (total: 69,544 lines across all TS/TSX files).

The largest files (>700 lines) are the highest priority for splitting.

## Priority 1: Critical (900+ lines)

| File | Lines | Plan |
|------|-------|------|
| `buyer/home-page.tsx` | 1395 | Split into: HeroSection, CategoryGrid, FeaturedProducts, FlashSaleBanner, RecentlyViewed, DealsSection |
| `buyer/product-detail-page.tsx` | 1328 | Split into: ProductInfo, ProductGallery, ReviewsSection, SellerCard, ShippingInfo, TieredPricing, VariationSelector |
| `buyer/checkout-page.tsx` | 1178 | Split into: CheckoutForm, PaymentSelector, OrderSummary, ShippingAddress, CouponInput |
| `admin/admin-banners-manager.tsx` | 1013 | Split into: BannerList, BannerEditor, BannerPreview, BannerScheduling |

## Priority 2: High (800-900 lines)

| File | Lines | Plan |
|------|-------|------|
| `layout/header.tsx` | 982 | Split into: MainNav, SearchBar, UserMenu, CartIcon, MobileMenu, LocaleToggle |
| `buyer/cars-page.tsx` | 959 | Split into: CarFilters, CarList, CarCard, CarMap |
| `seller/seller-onboarding.tsx` | 952 | Split into: OnboardingSteps, StoreSetup, PaymentSetup, ProductImport |
| `seller/seller-dashboard.tsx` | 928 | Split into: DashboardStats, RecentOrders, RevenueChart, TopProducts, QuickActions |
| `buyer/shop-page.tsx` | 925 | Split into: ShopFilters, ProductGrid, SortBar, CategorySidebar, ActiveFilters |
| `buyer/returns-page.tsx` | 892 | Split into: ReturnList, ReturnCard, ReturnDetail, ReturnForm |
| `buyer/profile-page.tsx` | 852 | Split into: ProfileHeader, ProfileTabs, OrderHistory, AddressBook, SettingsPanel |
| `seller/seller-ai-tools.tsx` | 801 | Split into: AIDescriptionGenerator, AITranslation, AIPricingSuggestion, AIReviewModifier |

## Priority 3: Medium (700-800 lines)

| File | Lines | Plan |
|------|-------|------|
| `buyer/shipping-page.tsx` | 796 | Split into: ShippingOptions, TrackingInfo, DeliveryEstimator |
| `buyer/product-card.tsx` | 769 | Split into: ProductCardImage, ProductCardInfo, ProductCardActions, ProductCardBadges |
| `admin/coupon-management.tsx` | 761 | Split into: CouponList, CouponEditor, CouponStats |
| `buyer/deals-page.tsx` | 749 | Split into: DealsHeader, DealGrid, DealCountdown |
| `admin/order-management.tsx` | 748 | Split into: OrderTable, OrderFilters, OrderDetailModal |
| `admin/store-management.tsx` | 746 | Split into: StoreTable, StoreApprovalPanel, StoreDetail |
| `buyer/properties-page.tsx` | 742 | Split into: PropertyFilters, PropertyGrid, PropertyCard |
| `buyer/wishlist-page.tsx` | 741 | Split into: WishlistGrid, WishlistItem, WishlistActions |
| `ui/sidebar.tsx` | 726 | Split into: SidebarNav, SidebarSection, SidebarFooter |
| `buyer/search-page.tsx` | 722 | Split into: SearchFilters, SearchResults, SearchSuggestions, SearchHistory |
| `buyer/help-center-page.tsx` | 715 | Split into: FAQSection, HelpCategories, ContactForm |
| `buyer/price-alerts-page.tsx` | 698 | Split into: AlertList, AlertCard, AlertForm |
| `seller/staff-management.tsx` | 691 | Split into: StaffList, StaffInvite, StaffPermissions |
| `admin/admin-settings.tsx` | 687 | Split into: GeneralSettings, PaymentSettings, EmailSettings, ShippingSettings |
| `admin/product-management.tsx` | 686 | Split into: ProductTable, ProductFilters, ProductModeration |

## Priority 4: Standard (600-700 lines)

| File | Lines | Plan |
|------|-------|------|
| `buyer/orders-page.tsx` | 665 | Split into: OrderList, OrderCard, OrderTimeline |
| `buyer/cart-page.tsx` | 650 | Split into: CartItems, CartSummary, CartCoupon |
| `admin/category-management.tsx` | 635 | Split into: CategoryTree, CategoryEditor, CategoryReorder |
| `buyer/wholesale-page.tsx` | 619 | Split into: WholesaleCatalog, TierPricing |
| `seller/promote-listing-page.tsx` | 612 | Split into: AdPackages, PromotionPreview |
| `admin/analytics-page.tsx` | 610 | Split into: AnalyticsCharts, AnalyticsFilters, AnalyticsExport |
| `buyer/subscriptions-loyalty-page.tsx` | 608 | Split into: LoyaltyStatus, SubscriptionPlans |
| `seller/seller-returns.tsx` | 600 | Split into: ReturnRequests, ReturnResolution |

## Splitting Convention

1. **One component per file** — no multi-component files
2. **Folder per feature** — e.g., `buyer/home/`, `buyer/product-detail/`
3. **Shared subcomponents** — extract repeated UI into `components/common/`
4. **Max 300 lines** per component after split
5. **Keep pages thin** — pages should only compose sub-components

## Target Outcome

- Longest file: ~300 lines
- Total component count: ~120 → ~200+
- All shared UI centralized
- Faster build times, easier code review
