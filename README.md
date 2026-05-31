# NexaMart — AI-Powered Multi-Vendor Commerce Platform

NexaMart is a full-featured, AI-powered e-commerce marketplace built for the MENA region. It supports multi-vendor product listings, auctions, classifieds, cars, properties, jobs, services, and more — all in a modern, responsive web application.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19, Tailwind CSS 4, shadcn/ui |
| **State** | Zustand (client), React Query (server) |
| **Database** | SQLite (dev) / Neon PostgreSQL (prod) |
| **ORM** | Prisma 6 |
| **Auth** | NextAuth.js 4 |
| **i18n** | next-intl (EN/AR with RTL support) |
| **AI** | OpenRouter (Gemini, etc.) |
| **Animations** | Framer Motion |

## Features

- **Multi-Vendor Marketplace** — Sellers manage stores, products, orders
- **Product Catalog** — Categories, variations, tiered pricing, flash sales
- **Auctions** — Real-time bidding on products
- **Classifieds, Cars, Properties, Jobs, Services** — Vertical marketplaces
- **AI-Powered** — Review summaries, price suggestions, smart search
- **Buyer Features** — Wishlist, cart, checkout, returns, loyalty program, price alerts
- **Seller Dashboard** — Orders, analytics, AI tools, staff management
- **Admin Panel** — User/store/product management, banners, coupons, disputes
- **RTL Support** — Full Arabic localization

## Setup

### Prerequisites
- Node.js 18+
- npm or bun

### Install
```bash
git clone <repo-url> nexa-mart
cd nexa-mart
npm install
```

### Environment
Copy `.env.example` to `.env` and configure:
```env
DATABASE_URL="file:./dev.db"         # SQLite for local dev
NEXTAUTH_SECRET="your-secret-here"    # Generate with: openssl rand -hex 32
NEXTAUTH_URL="http://localhost:3000"
OPENROUTER_API_KEY="sk-or-..."        # Optional: for AI features
```

### Database
```bash
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to DB
npx prisma db seed       # Seed demo data
```

### Run
```bash
npm run dev              # http://localhost:3000
npm run build            # Production build
npm start                # Production server
```

### Seed Data (Demo Accounts)
| Email | Role |
|-------|------|
| `demo@nexamart.com` | Buyer (Gold tier) |
| `seller@nexamart.com` | Seller (Platinum) |
| `admin@nexamart.com` | Admin |

## Project Structure
```
src/
├── app/              # Next.js App Router pages & API routes
│   ├── api/          # REST API endpoints
│   ├── (buyer)/      # Buyer-facing pages
│   ├── auth/         # Authentication pages
│   ├── admin/        # Admin panel pages
│   └── seller/       # Seller dashboard pages
├── components/
│   ├── buyer/        # Buyer UI components
│   ├── seller/       # Seller dashboard components
│   ├── admin/        # Admin panel components
│   ├── layout/       # Header, footer, navigation
│   ├── ui/           # shadcn/ui components
│   └── common/       # Shared components
├── lib/              # Utilities, configs, Prisma client
├── stores/           # Zustand state stores
└── hooks/            # Custom React hooks
prisma/
├── schema.prisma     # Database schema
└── seed.ts           # Demo data seeder
```

## License

Proprietary — NexaMart by ZOO.
