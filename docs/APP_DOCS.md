# NexaMart — AI-Powered Multi-Vendor Commerce Platform

## What Is NexaMart?

NexaMart is a full-featured, AI-powered multi-vendor commerce platform built for the MENA (Middle East & North Africa) region. It enables buyers to discover and purchase products, cars, properties, services, and more — while sellers can list and manage their inventory, and administrators can control the entire marketplace from a central dashboard.

### Key Differentiators

- **AI-First**: OpenRouter-powered AI tools for smart pricing, product descriptions, visual search, RFQ agents, review summaries, and translation
- **Multi-Vendor Marketplace**: Sellers have their own stores, products, and analytics dashboards
- **MENA-Optimized**: Full Arabic RTL support, 10 MENA currencies, country-specific VAT/tax, and regional reference data (car makes, cities, property types)
- **Multi-Category**: Not just products — also Cars, Properties, Jobs, Services, and Classifieds (like OpenSooq)
- **Bilingual**: English (LTR) and Arabic (RTL) with 1,800+ i18n keys

---

## Platform Overview

### Three User Roles

| Role | Description | Entry Point |
|------|-------------|-------------|
| **Buyer** | Browse, search, purchase, track orders, chat with sellers, use AI tools | `/` (homepage) |
| **Seller** | Manage store, products, orders, analytics, staff, promotions | `/seller/dashboard` |
| **Admin** | Full platform control: users, stores, orders, banners, categories, payouts, disputes, KYC, analytics | `/admin` |

### Buyer Pages (30+ pages)

| Route | Page |
|-------|------|
| `/` | Homepage with hero carousel, categories, products, stores |
| `/shop` | Product listing with filters, sorting, pagination |
| `/product/[id]` | Product detail with gallery, variations, reviews |
| `/cart` | Shopping cart |
| `/checkout` | Checkout with address, shipping, payment |
| `/orders` | Order history |
| `/wishlist` | Saved products |
| `/search` | Search with category filters, price range, sorting |
| `/deals` | Flash sales and deals |
| `/auctions` | Auction listings |
| `/wholesale` | B2B wholesale products |
| `/cars` | Car listings with make/model/year filters |
| `/properties` | Property listings (sale/rent) |
| `/jobs` | Job listings |
| `/services` | Service listings |
| `/stores` | Store directory |
| `/store/[id]` | Store profile page |
| `/compare` | Product comparison |
| `/chat` | Real-time chat with sellers |
| `/profile` | User profile |
| `/returns` | Return requests |
| `/order-tracking` | Order tracking |
| `/price-alerts` | Price drop alerts |
| `/near-me` | Nearby listings |
| `/help` | Help center |
| `/safety` | Safety tips |
| `/shipping` | Shipping info |
| `/loyalty` | Loyalty program & subscriptions |
| `/apps` | App marketplace |
| `/installments` | Installment plans |
| `/reels` | Video reels (shoppertainment) |
| `/saved-searches` | Saved search queries |
| `/my-reviews` | My reviews |
| `/ai-tools` | AI tools dashboard |
| `/ai/visual-search` | Visual search |
| `/ai/rfq` | RFQ agent |
| `/auth` | Login/register |
| `/post-ad` | Post classified ad |
| `/promote` | Promote a listing |

### Seller Dashboard Pages

| Route | Page |
|-------|------|
| `/seller/dashboard` | Overview (stats, charts) |
| `/seller/dashboard/products` | Product management |
| `/seller/dashboard/orders` | Order management |
| `/seller/dashboard/analytics` | Analytics & charts |
| `/seller/dashboard/marketing` | Marketing tools, coupons |
| `/seller/dashboard/staff` | Staff management |
| `/seller/dashboard/settings` | Store settings |
| `/seller/dashboard/ai-tools` | AI tools for sellers |
| `/seller/onboarding` | Seller onboarding flow |

### Admin Panel Pages

| Route | Page |
|-------|------|
| `/admin` | Admin dashboard (stats, charts) |
| `/admin/products` | Product management |
| `/admin/orders` | Order management |
| `/admin/stores` | Store management |
| `/admin/users` | User management |
| `/admin/categories` | Category management |
| `/admin/banners` | Banner management |
| `/admin/coupons` | Coupon management |
| `/admin/commission` | Commission settings |
| `/admin/payouts` | Financial payouts |
| `/admin/disputes` | Dispute center |
| `/admin/kyc` | KYC approval |
| `/admin/content` | Content moderation |
| `/admin/analytics` | Platform analytics |
| `/admin/push` | Push notifications |
| `/admin/settings` | Platform settings |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, SSR/SSG) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York style) |
| Database | SQLite via Prisma ORM |
| State Management | Zustand (client state) |
| AI | OpenRouter API (OpenAI-compatible) |
| Real-time Chat | Socket.IO (mini-service on port 3003) |
| Reverse Proxy | Caddy (port 81 → Next.js port 3000) |
| Icons | Lucide React |
| Charts | Recharts |
| Animations | Framer Motion |
| i18n | Custom Zustand-based (en.json + ar.json) |
| Theming | next-themes (light/dark/system) |

---

## How to Use

### For Buyers

1. **Browse**: Visit the homepage, browse categories, or use the mega-menu
2. **Search**: Use the search bar or the command palette (Cmd+K) for instant search
3. **Shop**: Filter products by category, price, rating, and more
4. **Purchase**: Add to cart → checkout → track order
5. **AI Tools**: Use visual search (upload an image), RFQ agent, or AI chat for assistance
6. **Chat**: Message sellers in real-time
7. **Language**: Switch between English and Arabic from the header

### For Sellers

1. **Onboard**: Complete the seller onboarding flow at `/seller/onboarding`
2. **Dashboard**: View sales stats, order summaries, and analytics
3. **Products**: Add, edit, and manage products with variations and tiered pricing
4. **Orders**: Process orders, update tracking, handle returns
5. **Marketing**: Create coupons, promote listings with ad products (bump, featured, premium)
6. **Staff**: Invite team members with role-based access (owner, manager, editor, viewer)
7. **AI Tools**: Auto-generate product descriptions, smart pricing suggestions

### For Administrators

1. **Dashboard**: Monitor platform health, revenue, user growth
2. **Banners**: Manage hero carousel and promotional banners (CRUD with scheduling)
3. **Users**: View, verify, or ban users
4. **Stores**: Approve, verify, or suspend stores
5. **Orders**: View all orders across the platform
6. **Categories**: Manage product categories (hierarchical)
7. **Coupons**: Create and manage discount coupons
8. **Payouts**: Review and process seller payout requests
9. **Disputes**: Mediate buyer-seller disputes
10. **KYC**: Review seller identity verification documents
11. **Content**: Moderate listings and reviews
12. **Settings**: Configure platform-wide settings (commission, shipping, tax, etc.)

### Demo Login

Click "Demo Login" in the header to sign in as a demo admin user. This creates a user with admin role and full access.

### Seeding the Database

Send a POST request to `/api/seed` to populate the database with realistic MENA-region sample data:

```bash
curl -X POST http://localhost:3000/api/seed
```

This creates: 10 users, 5 stores, 15 products, 8 orders, 7 cars, 6 properties, 6 classifieds, 6 jobs, 6 services, 5 auctions, 7 apps, 6 coupons, 4 flash sales, 5 banners, and more.

---

## AI Features

| Feature | API Route | Description |
|---------|-----------|-------------|
| AI Chat | `/api/ai/chat` | General AI assistant for shopping queries |
| Product Description | `/api/ai/product-description` | Auto-generate product descriptions from title/category |
| Smart Pricing | `/api/ai/smart-pricing` | AI-powered pricing suggestions |
| Visual Search | `/api/ai/visual-search` | Search by image using AI vision |
| RFQ Agent | `/api/ai/rfq` | Request for Quotation AI agent |
| Review Summary | `/api/ai/review-summary` | AI-generated review summaries |
| Translation | `/api/ai/translate` | Auto-translate content (EN ↔ AR) |

All AI features use OpenRouter API with the model specified in `OPENROUTER_MODEL` env var (default: `google/gemini-2.0-flash-001`).

---

## Currency & Tax

### Supported Currencies

USD, EUR, AED (UAE), SAR (Saudi), KWD (Kuwait), IQD (Iraq), JOD (Jordan), QAR (Qatar), OMR (Oman), EGP (Egypt)

Currency is auto-selected based on the user's country, or can be manually changed from the currency selector in the header.

### VAT/Tax

Tax rates are configured per country in `src/lib/tax.ts`:
- UAE: 5% VAT
- Saudi Arabia: 15% VAT
- Jordan: 16% VAT
- Egypt: 14% VAT
- Kuwait, Iraq, Qatar: 0% tax
- Oman, Bahrain: 5% VAT
- Lebanon: 11% VAT
- Morocco: 20% VAT
- Algeria, Tunisia: 19% VAT

Certain categories (food staples, education, healthcare, books, residential rent) are tax-exempt in specific countries.

---

## Real-Time Chat

The chat feature uses Socket.IO running as a mini-service on port 3003. Key features:

- **Real-time messaging** between buyers and sellers
- **Typing indicators** — see when the other party is typing
- **Read receipts** — know when messages have been read
- **Online status** — see who's currently online
- **Auto-reply bots** — simulated seller responses for demo purposes
- **Conversation rooms** — each buyer-seller pair has a unique room

Frontend connects via: `io("/?XTransformPort=3003")`

---

## Banners / Hero Carousel

The homepage hero carousel is fully admin-controllable:

- **Banner model** in Prisma with fields: title, titleAr, description, descriptionAr, image, link, ctaText, ctaTextAr, ctaLink, gradient, icon, position, sortOrder, isActive, startDate, endDate
- **Admin CRUD** at `/admin/banners` — create, edit, delete, reorder, activate/deactivate
- **API routes**: `GET/POST /api/admin/banners`, `PUT/DELETE /api/admin/banners/[id]`
- **Frontend** fetches active banners from `GET /api/banners` and renders them in the carousel
- **Scheduling**: Banners can have start/end dates for time-limited promotions
- **Position types**: hero, sidebar, category, footer, popup

---

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (buyer)/                  # Buyer route group (no URL prefix)
│   │   ├── page.tsx              # Homepage
│   │   ├── shop/page.tsx         # Shop page
│   │   ├── product/[id]/         # Product detail
│   │   ├── cart/                 # Cart
│   │   ├── checkout/             # Checkout
│   │   ├── ...                   # 30+ more buyer pages
│   │   ├── layout.tsx            # Buyer layout (AppShell)
│   │   ├── loading.tsx           # Loading skeleton
│   │   └── error.tsx             # Error boundary
│   ├── admin/                    # Admin route group
│   │   ├── page.tsx              # Admin dashboard
│   │   ├── banners/              # Banner management
│   │   ├── ...                   # 15+ more admin pages
│   │   └── layout.tsx            # Admin layout
│   ├── seller/                   # Seller route group
│   │   ├── dashboard/            # Seller dashboard
│   │   │   ├── page.tsx          # Overview
│   │   │   ├── products/         # Product management
│   │   │   ├── orders/           # Order management
│   │   │   ├── analytics/        # Analytics
│   │   │   ├── marketing/        # Marketing tools
│   │   │   ├── staff/            # Staff management
│   │   │   ├── settings/         # Store settings
│   │   │   └── ai-tools/         # AI tools
│   │   └── onboarding/           # Seller onboarding
│   ├── api/                      # API routes (50+)
│   │   ├── products/             # Product CRUD
│   │   ├── stores/               # Store data
│   │   ├── orders/               # Order data
│   │   ├── cars/                 # Car listings
│   │   ├── properties/           # Property listings
│   │   ├── jobs/                 # Job listings
│   │   ├── services/             # Service listings
│   │   ├── ai/                   # AI endpoints
│   │   ├── admin/                # Admin-specific routes
│   │   ├── seller/               # Seller-specific routes
│   │   ├── seed/                 # Database seed route
│   │   └── banners/              # Banner data
│   └── layout.tsx                # Root layout
├── components/
│   ├── buyer/                    # Buyer-facing components (30+)
│   ├── seller/                   # Seller dashboard components (12+)
│   ├── admin/                    # Admin panel components (16+)
│   ├── layout/                   # Header, Footer, MobileNav, AppShell
│   ├── common/                   # Shared components (25+)
│   ├── ai/                       # AI tool components
│   ├── auth/                     # Authentication
│   ├── classifieds/              # Classified posting
│   └── ui/                       # shadcn/ui base components (40+)
├── lib/
│   ├── config.ts                 # Centralized app configuration
│   ├── currency.ts               # Multi-currency support (10 currencies)
│   ├── db.ts                     # Prisma client singleton
│   ├── i18n.ts                   # i18n Zustand store
│   ├── locales/                  # Translation JSON files
│   │   ├── en.json               # English (1,847 keys)
│   │   └── ar.json               # Arabic (1,847 keys)
│   ├── openrouter.ts             # OpenRouter AI client
│   ├── reference-data.ts         # Reference/config data (car makes, cities, etc.)
│   ├── security.ts               # Security utilities
│   ├── tax.ts                    # VAT/tax calculation per country
│   ├── use-app-navigation.ts     # Navigation hook (view→URL mapping)
│   └── utils.ts                  # Utility functions
├── stores/
│   ├── app-store.ts              # UI state (currency, sidebar, compare)
│   ├── cart-store.ts             # Shopping cart state
│   ├── user-store.ts             # User authentication state
│   └── recently-viewed-store.ts  # Recently viewed products
├── hooks/
│   ├── use-toast.ts              # Toast notifications
│   └── use-mobile.ts             # Mobile detection
└── middleware.ts                  # Security headers, rate limiting, admin auth
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features | (required for AI) |
| `OPENROUTER_MODEL` | AI model to use | `google/gemini-2.0-flash-001` |
| `ADMIN_SECRET_KEY` | Admin API authentication secret | `nexamart-admin-secret-change-in-production` |
| `NEXT_PUBLIC_APP_DOMAIN` | App domain for URLs | `nexamart.com` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | (optional) |

---

## Development Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Next.js dev server on port 3000 |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run Prisma migrations |

---

## Architecture Decisions

### Why Not SPA?

NexaMart uses Next.js App Router with proper file-based routing. There is NO single-page application pattern. Each page is a separate route with its own `page.tsx` file. This enables:
- Proper SSR/SSG for SEO
- Code-splitting per route
- Browser back/forward navigation works correctly
- Deep linking to any page
- Proper accessibility (real page transitions, not DOM swaps)

### Why Dynamic Imports?

The `HomePage` component and layout shell components are dynamically imported to reduce initial bundle size and prevent OOM issues during development. This is a deliberate trade-off — slightly slower first paint for better dev stability.

### Why Zustand for i18n?

The i18n system is built on Zustand instead of next-intl (which is installed but not used for translations) because it provides:
- Simple `useI18n()` hook: `{ locale, t, dir, setLocale }`
- No server-side complexity — all translations are client-side
- Parameterized strings: `t('welcome', { name: 'John' })`
- Fallback chain: `ar[key] → en[key] → key`

### Why SQLite?

SQLite is used for development simplicity. The Prisma schema is compatible with PostgreSQL for production deployment — just change the `DATABASE_URL` and provider.

### Why Caddy?

Caddy acts as a reverse proxy on port 81, forwarding to Next.js on port 3000. It also handles cross-service requests via the `XTransformPort` query parameter, enabling the chat mini-service on port 3003.
