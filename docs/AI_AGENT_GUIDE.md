# NexaMart — AI Agent Developer Guide

> **This document is for AI agents (and developers) who need to work on the NexaMart codebase.** It provides architectural context, coding patterns, gotchas, and rules that are critical to follow when making changes.

---

## Quick Start

1. Read `/home/z/my-project/worklog.md` to understand what previous agents have done
2. Read `prisma/schema.prisma` to understand the data model
3. Read `src/lib/config.ts` for centralized constants
4. Read this document end-to-end before making any changes

---

## Critical Rules

### 1. Next.js App Router — NOT SPA

This app uses **Next.js 16 App Router with file-based routing**. There is NO single-page app pattern.

- Each page has its own `page.tsx` file under `src/app/`
- Route groups: `(buyer)/`, `admin/`, `seller/`
- `(buyer)` is a route group (parentheses = no URL segment), so `src/app/(buyer)/page.tsx` maps to `/`
- **NEVER** create a root `src/app/page.tsx` — it will shadow the `(buyer)` route group
- **NEVER** use `useAppStore().currentView` or `setView()` for navigation — use `useAppNavigation()` or `<Link>`

### 2. Navigation Pattern

```tsx
// CORRECT: Use Link for navigation
import Link from 'next/link';
import { getViewUrl } from '@/lib/use-app-navigation';

<Link href={getViewUrl('shop')}>Shop</Link>
<Link href={`/product/${product.id}`}>View Product</Link>

// CORRECT: Use useAppNavigation for programmatic navigation
const nav = useAppNavigation();
nav.setView('shop');         // → router.push('/shop')
nav.selectProduct(id);       // → router.push('/product/{id}')
nav.selectStore(id);         // → router.push('/store/{id}')

// WRONG: Never use onClick + router.push for simple links
<Button onClick={() => router.push('/shop')}>Shop</Button>
```

### 3. Button + Link Pattern

When wrapping a `Button` with a `Link`, ALWAYS use `asChild`:

```tsx
// CORRECT
<Button asChild variant="ghost">
  <Link href="/shop">Shop</Link>
</Button>

// WRONG — creates <button> inside <a> (invalid HTML)
<Link href="/shop">
  <Button variant="ghost">Shop</Button>
</Link>
```

### 4. API Routes — Use Prisma, Not Mock Data

ALL API routes must use Prisma to query the database. Never hardcode mock data.

```tsx
// CORRECT
import { db } from '@/lib/db';

export async function GET() {
  const products = await db.product.findMany({ where: { status: 'active' } });
  return NextResponse.json({ products });
}

// WRONG
export async function GET() {
  const products = [{ name: 'Fake Product', price: 99 }]; // NO!
  return NextResponse.json({ products });
}
```

### 5. Database Access

```tsx
import { db } from '@/lib/db';
```

The `db` singleton is in `src/lib/db.ts`. It always creates a fresh PrismaClient to avoid stale SQLite connections.

- **Schema changes**: Edit `prisma/schema.prisma`, then run `bun run db:push`
- **Seed data**: POST to `/api/seed` (idempotent — deletes all data then recreates)
- **SQLite limitations**: No array fields — use JSON strings (`String @default("[]")`) and parse them

### 6. z-ai-web-dev-sdk — Backend Only

The `z-ai-web-dev-sdk` package MUST only be used in API routes or server-side code. NEVER import it in client components.

```tsx
// CORRECT: In src/app/api/some-route/route.ts
import { someFeature } from 'z-ai-web-dev-sdk';

// WRONG: In src/components/buyer/some-page.tsx
import { someFeature } from 'z-ai-web-dev-sdk'; // ❌ Client bundle!
```

### 7. Cross-Service Requests via Caddy

When making API requests to other services (like the chat service on port 3003), use the `XTransformPort` query parameter:

```tsx
// CORRECT
fetch('/api/chat?XTransformPort=3003')
const socket = io('/?XTransformPort=3003')

// WRONG — never use absolute URLs with ports
fetch('http://localhost:3003/api/chat')  // ❌
const socket = io('http://localhost:3003')  // ❌
```

### 8. No Root page.tsx

**NEVER** create `src/app/page.tsx`. The root page is `src/app/(buyer)/page.tsx`. Creating a root page.tsx will shadow the buyer route group and break the entire app.

---

## Architecture Deep Dive

### Route Structure

```
src/app/
├── layout.tsx              # Root layout (ThemeProvider, DirectionProvider, Toaster)
├── (buyer)/                # Route group — no URL prefix
│   ├── layout.tsx          # Buyer layout (AppShell with Header/Footer)
│   ├── page.tsx            # Homepage (/)
│   ├── shop/page.tsx       # /shop
│   ├── product/[id]/       # /product/:id (dynamic segment)
│   ├── store/[id]/         # /store/:id (dynamic segment)
│   └── ...                 # 30+ more pages
├── admin/
│   ├── layout.tsx          # Admin layout (sidebar navigation)
│   ├── page.tsx            # /admin (dashboard)
│   └── ...                 # 15+ more pages
└── seller/
    ├── layout.tsx          # Seller layout (sidebar navigation)
    └── dashboard/
        ├── page.tsx        # /seller/dashboard
        └── ...             # 8 more pages
```

### Component Architecture

Each route's `page.tsx` typically:
1. Dynamically imports the corresponding component from `src/components/`
2. Passes route params (like `id`) as props
3. The component itself is a `'use client'` component that handles its own data fetching

Example:

```tsx
// src/app/(buyer)/product/[id]/page.tsx
import dynamic from 'next/dynamic';

const ProductDetailPage = dynamic(
  () => import('@/components/buyer/product-detail-page').then(m => ({ default: m.ProductDetailPage })),
  { ssr: false }
);

export default function ProductPage({ params }: { params: { id: string } }) {
  return <ProductDetailPage productId={params.id} />;
}
```

### State Management

| Store | File | Purpose |
|-------|------|---------|
| `useAppStore` | `src/stores/app-store.ts` | UI state: currency, sidebar, compare IDs, search query, selected category |
| `useUserStore` | `src/stores/user-store.ts` | User auth: current user, login/logout, credits |
| `useCartStore` | `src/stores/cart-store.ts` | Shopping cart: items, totals, add/remove |
| `useRecentlyViewedStore` | `src/stores/recently-viewed-store.ts` | Recently viewed products |
| `useI18n` | `src/lib/i18n.ts` | Locale, translations, direction |

**IMPORTANT**: `useAppStore` is for UI state ONLY. It does NOT handle navigation. Use `useAppNavigation()` or `<Link>` for navigation.

### Data Fetching Pattern

All buyer/seller/admin components follow this pattern:

```tsx
'use client';

export function SomePage() {
  const [items, setItems] = useState<SomeType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/some-endpoint')
      .then(res => res.json())
      .then(data => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (items.length === 0) return <EmptyState />;

  return (
    <div>
      {items.map(item => <ItemCard key={item.id} item={item} />)}
    </div>
  );
}
```

### i18n Pattern

```tsx
import { useI18n } from '@/lib/i18n';

function MyComponent() {
  const { t, dir, locale } = useI18n();
  const isRTL = dir() === 'rtl';

  return (
    <div className={isRTL ? 'text-right' : 'text-left'}>
      <h1>{t('shopTitle')}</h1>
      <p>{t('welcome', { name: user.name })}</p>
    </div>
  );
}
```

Translation files are at:
- `src/lib/locales/en.json` — English (1,847 keys)
- `src/lib/locales/ar.json` — Arabic (1,847 keys)

When adding new UI text:
1. Add the key to both `en.json` and `ar.json`
2. Use `t('yourKey')` in components
3. Fallback: if key missing in current locale → falls back to English → falls back to the key itself

### Currency & Price Formatting

```tsx
import { formatPrice, formatPriceLocal } from '@/lib/currency';
import { useAppStore } from '@/stores/app-store';

function PriceDisplay({ price }: { price: number }) {
  const currency = useAppStore(s => s.currency);

  // price is in USD — formatPrice converts to target currency
  return <span>{formatPrice(price, currency)}</span>;

  // If price is already in target currency:
  // return <span>{formatPriceLocal(price, currency)}</span>;
}
```

Always use `formatPrice()` for displaying prices. It handles:
- Currency conversion from USD
- Proper symbol placement (before/after amount)
- Arabic-Indic digits for Arabic locale
- Thousands separators

### Reference Data

Use `src/lib/reference-data.ts` for dropdown options, filter values, and display labels:

```tsx
import { CAR_MAKES, MENA_CITIES, getRefLabel } from '@/lib/reference-data';
import { useI18n } from '@/lib/i18n';

function CarFilters() {
  const { dir, locale } = useI18n();
  const isRTL = dir() === 'rtl';

  return (
    <select>
      {CAR_MAKES.map(make => (
        <option key={make.value} value={make.value}>
          {isRTL ? make.labelAr : make.label}
        </option>
      ))}
    </select>
  );
}
```

Available reference data:
- `CAR_MAKES`, `CAR_MAKE_MODELS`, `FUEL_TYPES`, `TRANSMISSIONS`, `BODY_TYPES`, `CAR_CONDITIONS`, `CAR_COLORS`
- `MENA_CITIES`
- `PROPERTY_TYPES`, `PROPERTY_TYPE_GRADIENTS`
- `SERVICE_CATEGORIES`, `SERVICE_CATEGORY_GRADIENTS`, `PRICE_UNIT_LABELS`
- `JOB_TYPES`, `JOB_CATEGORY_ICONS`, `EXPERIENCE_LEVELS`
- `DEAL_CATEGORIES`, `AUCTION_CATEGORIES`, `WHOLESALE_CATEGORIES`
- `BODY_TYPE_GRADIENTS`
- `getRefLabel(items, value, isRTL)` — helper to get label from reference array

### Centralized Configuration

All app-wide constants are in `src/lib/config.ts`:

- `APP_NAME`, `APP_TAGLINE`, `APP_DESCRIPTION` — Branding
- `AI_CONFIG` — OpenRouter settings
- `SHIPPING_CONFIG` — Shipping rates and methods
- `COMMISSION_CONFIG` — Seller commission rates
- `AI_CREDIT_PACKAGES` — AI credit pricing tiers
- `AD_PRODUCTS` — Promoted listing products
- `LOYALTY_CONFIG` — Loyalty program config
- `AUTH_CONFIG` — Auth defaults, demo user
- `TAX_CONFIG` — Default tax settings
- `STORE_LIMITS` — Max products, images, order amounts
- `LS_KEYS` — localStorage key names
- `SOCIAL_SHARE` — Social sharing URL builders
- `DEFAULT_TIMEZONE` — `Asia/Riyadh`

**When adding new constants**, add them to `config.ts`, NOT scattered across components.

---

## Database Schema

### Core Models

| Model | Description | Key Fields |
|-------|-------------|------------|
| `User` | All users (buyers, sellers, admins) | email, role, loyaltyTier, aiCredits, locale |
| `Store` | Seller stores | name, nameAr, slug, ownerId, tier, commission |
| `Product` | Products for sale | name, nameAr, price, originalPrice, images (JSON), categoryId, storeId, variations (JSON), tieredPricing (JSON) |
| `Category` | Product categories (hierarchical) | name, nameAr, slug, parentId |
| `Order` / `OrderItem` | Purchase orders | orderNumber, status, subtotal, shipping, tax, total |
| `Review` | Product reviews | rating, comment, helpful |
| `StoreReview` | Store reviews | rating, comment |

### Marketplace Models

| Model | Description | Key Fields |
|-------|-------------|------------|
| `Car` | Car listings | title, make, model, year, fuelType, transmission, bodyType, condition, city, images (JSON) |
| `Property` | Real estate listings | title, listingType (sale/rent), propertyType, bedrooms, bathrooms, area, city, isFurnished |
| `Classified` | General classifieds | title, categoryId, condition, city, expiresAt |
| `Job` | Job listings | title, company, type (full-time/part-time/etc.), salaryMin, salaryMax, experienceLevel, skills (JSON) |
| `Service` | Service listings | title, price, priceUnit, category, providerName, city, isAvailableToday |

### Commerce Models

| Model | Description | Key Fields |
|-------|-------------|------------|
| `Wishlist` | User wishlists | userId, productId (unique pair) |
| `Address` | User addresses | city, country, isDefault |
| `Coupon` | Discount coupons | code, discount, type (percentage/fixed), usageLimit, expiresAt |
| `FlashSale` | Time-limited sales | discount, startDate, endDate, isActive |
| `Auction` | Product auctions | startPrice, currentPrice, reservePrice, startTime, endTime, status |
| `App` | App marketplace | name, category, developer, price, isFree |

### Operational Models

| Model | Description | Key Fields |
|-------|-------------|------------|
| `Return` | Return/refund requests | reason, resolution (refund/exchange/store_credit), status, evidencePhotos (JSON), timeline (JSON) |
| `PriceAlert` | Price drop alerts | targetPrice, currentPrice, isActive, isNotified |
| `Invoice` | Order invoices | invoiceNumber, status (paid/unpaid/overdue), dueDate |
| `Payout` | Seller payouts | amount, method (bank_transfer/wallet/check), status |
| `Dispute` | Order disputes | reason, status (open/under_review/resolved/closed), aiSummary |
| `Staff` | Store staff members | role (owner/manager/editor/viewer), status (active/pending/revoked) |
| `Banner` | Hero/promo banners | title, titleAr, ctaText, ctaLink, gradient, icon, position, sortOrder, isActive, startDate, endDate |
| `HelpTicket` | Support tickets | subject, category, priority |
| `AuditLog` | Admin action audit trail | action, targetType, targetId, details (JSON) |
| `Notification` | User notifications | title, titleAr, message, type, isRead |
| `ChatMessage` | Chat messages | senderId, receiverId, message, isRead |

### JSON String Fields

SQLite doesn't support array/object fields. These fields use `String @default("[]")` or `String @default("{}")` and must be parsed:

```tsx
// Parsing JSON fields
const images = JSON.parse(product.images);      // string[] 
const variations = JSON.parse(product.variations); // object
const tieredPricing = JSON.parse(product.tieredPricing); // array
const tags = JSON.parse(product.tags);           // string[]
const timeline = JSON.parse(return_.timeline);    // array
```

---

## API Routes

### Route Convention

API routes are organized in `src/app/api/`:

- **Public routes**: `/api/products`, `/api/stores`, `/api/cars`, etc.
- **Admin routes**: `/api/admin/*` — protected by admin auth middleware
- **Seller routes**: `/api/seller/*` — for seller-specific data
- **AI routes**: `/api/ai/*` — use OpenRouter

### Creating a New API Route

```tsx
// src/app/api/my-resource/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkApiRateLimit, validatePagination } from '@/lib/security';

export async function GET(request: NextRequest) {
  // 1. Rate limit check
  const rateResult = checkApiRateLimit(request);
  if (!rateResult.allowed && rateResult.response) {
    return rateResult.response;
  }

  // 2. Parse query params
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const { page: validPage, limit: validLimit } = validatePagination(page, limit);

  // 3. Query database
  const items = await db.myModel.findMany({
    where: { status: 'active' },
    skip: (validPage - 1) * validLimit,
    take: validLimit,
    orderBy: { createdAt: 'desc' },
  });

  // 4. Return JSON
  return NextResponse.json({ items });
}
```

### Admin Route Protection

Admin routes are protected by the middleware in `src/middleware.ts`. In development mode, admin auth is bypassed. In production, requests must include `Authorization: Bearer <token>` or `X-Admin-Key` header.

You can also use the helper:

```tsx
import { validateAdminRequest } from '@/lib/security';

export async function POST(request: NextRequest) {
  const error = validateAdminRequest(request);
  if (error) return error; // Returns 401 or 429

  // ... proceed with admin operation
}
```

---

## Common Tasks

### Adding a New Page

1. Create the route file: `src/app/(buyer)/my-new-page/page.tsx`
2. Create the component: `src/components/buyer/my-new-page.tsx`
3. Add the view mapping in `src/lib/use-app-navigation.ts`:
   - Add to `AppView` type
   - Add to `viewToUrl` map
   - Add to `getCurrentView()` switch
4. Add i18n keys to both `en.json` and `ar.json`
5. Add navigation links in header, mobile nav, footer, etc.

### Adding a New Prisma Model

1. Edit `prisma/schema.prisma` — add the model
2. Run `bun run db:push`
3. Create API routes in `src/app/api/`
4. Add seed data in `src/app/api/seed/route.ts`
5. Create frontend components

### Adding a New Admin Management Page

1. Create component: `src/components/admin/my-feature-management.tsx`
2. Create route: `src/app/admin/my-feature/page.tsx`
3. Create API route: `src/app/api/admin/my-feature/route.ts`
4. Add navigation item in `src/components/admin/admin-panel.tsx`
5. Add i18n keys

### Adding i18n Keys

1. Add key to `src/lib/locales/en.json`
2. Add key to `src/lib/locales/ar.json`
3. Use in component: `t('myNewKey')` or `t('myNewKey', { param: value })`

---

## Gotchas & Pitfalls

### 1. Root page.tsx Shadow

**NEVER create `src/app/page.tsx`**. It shadows the `(buyer)` route group. The homepage is at `src/app/(buyer)/page.tsx`.

### 2. Dynamic Imports for Heavy Components

Import heavy components (like `HomePage`) using `next/dynamic` to prevent OOM:

```tsx
const HomePage = dynamic(
  () => import('@/components/buyer/home-page').then(m => ({ default: m.HomePage })),
  { loading: () => <LoadingSpinner /> }
);
```

### 3. toFixed() Crashes

Always guard against null/undefined numbers before calling `.toFixed()`:

```tsx
// WRONG — crashes if rating is null
product.rating.toFixed(1)

// CORRECT
(product.rating ?? 0).toFixed(1)
typeof product.rating === 'number' ? product.rating.toFixed(1) : '0.0'
```

### 4. JSON Field Parsing

Prisma returns JSON fields as strings. You must parse them:

```tsx
const images = typeof product.images === 'string' 
  ? JSON.parse(product.images) 
  : product.images;
```

### 5. Arabic Field Fallback

Many models have `nameAr`/`titleAr`/`descriptionAr` fields that may be null. Always fallback:

```tsx
const displayName = isRTL ? (product.nameAr || product.name) : product.name;
```

### 6. `formatPrice` Assumes USD Input

`formatPrice(amount, currency)` expects `amount` to be in USD and converts it. If your amount is already in the target currency, use `formatPriceLocal()` instead.

### 7. CSS: No Indigo or Blue

Per design guidelines, avoid using indigo or blue as primary colors unless explicitly requested. Use emerald/teal (the app's accent colors) instead.

### 8. Footer Must Be Sticky

The footer must always stick to the bottom of the viewport. Use `min-h-screen flex flex-col` on the root wrapper and `mt-auto` on the footer.

### 9. No `use server` Actions

Use API routes (`src/app/api/`) instead of Next.js Server Actions. All backend logic goes in API routes.

### 10. No Test Files

Do not write test files. The project uses `agent-browser` for E2E testing.

---

## Security Architecture

### Middleware (`src/middleware.ts`)

Runs on ALL `/api/*` routes:

1. **Security headers**: X-Content-Type-Options, X-Frame-Options, CSP, HSTS
2. **Rate limiting**: In-memory sliding window
   - General API: 60 req/min
   - Admin API: 30 req/min
   - Auth API: 5 req/min
   - Seed API: 3 req per 5 min
3. **Admin auth**: Bearer token or X-Admin-Key header (bypassed in development)
4. **Seed route protection**: POST only, requires admin auth in production

### Security Module (`src/lib/security.ts`)

Provides reusable security utilities:

- `checkRateLimit(identifier, config)` — In-memory rate limiting
- `validateAdminAuth(request)` — Check admin auth headers
- `requireAdminAuth(request)` — Returns 401 if unauthorized
- `sanitizeString(input)` — XSS prevention
- `validatePagination(page, limit)` — Clamp pagination params
- `isValidId(id)` — Validate CUID/UUID/custom IDs
- `validateSearchParam(search)` — Prevent injection in search
- `validateCsrf(request)` — CSRF protection for state-changing operations
- `secureJsonResponse(data, options)` — Response with security headers

---

## AI Integration

### OpenRouter Client (`src/lib/openrouter.ts`)

```tsx
import { openrouterChat, openrouterChatJSON } from '@/lib/openrouter';

// Standard chat completion
const response = await openrouterChat([
  { role: 'system', content: 'You are a helpful shopping assistant.' },
  { role: 'user', content: 'Find me a laptop under $500' },
]);

// JSON-structured response (lower temperature, higher max_tokens)
const jsonResponse = await openrouterChatJSON([
  { role: 'system', content: 'Return JSON with price suggestions.' },
  { role: 'user', content: 'Price this product: ...' },
]);
```

### AI API Routes

All AI routes follow this pattern:

```tsx
// src/app/api/ai/my-feature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { openrouterChat } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await openrouterChat([
      { role: 'system', content: 'System prompt...' },
      { role: 'user', content: `User input: ${body.input}` },
    ]);

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: 'AI processing failed' },
      { status: 500 }
    );
  }
}
```

### AI Credits

Users have `aiCredits` that decrement with each AI call. Check and deduct credits in the API route:

```tsx
// In API route, after successful AI call:
await db.user.update({
  where: { id: userId },
  data: { aiCredits: { decrement: 1 } },
});
```

---

## Real-Time Chat

### Architecture

- **Server**: `mini-services/chat-service/index.ts` — Socket.IO server on port 3003
- **Client**: `src/components/buyer/chat-page.tsx` — connects via `io('/?XTransformPort=3003')`

### Socket Events

| Event | Direction | Data |
|-------|-----------|------|
| `user:join` | Client → Server | `{ userId, username, avatar, role }` |
| `room:join` | Client → Server | `{ conversationId }` |
| `room:leave` | Client → Server | `{ conversationId }` |
| `room:history` | Server → Client | `{ conversationId, messages[] }` |
| `message:send` | Client → Server | `{ conversationId, text, sender, senderName }` |
| `message:new` | Server → Client | `ChatMessage` object |
| `message:sent` | Server → Client | `{ messageId, conversationId }` |
| `typing:start` | Bidirectional | `{ conversationId, userId, username }` |
| `typing:stop` | Bidirectional | `{ conversationId, userId }` |
| `messages:read` | Bidirectional | `{ conversationId, readBy }` |
| `user:online` | Server → Client | `{ userId, username }` |
| `user:offline` | Server → Client | `{ userId, username }` |

### Auto-Reply Bots

The chat service includes simulated seller bots that auto-reply after a 1.5-4.5 second delay. These are defined in the `sellerBots` object and are for demo purposes only.

---

## Styling Guide

### Color System

- Use Tailwind CSS built-in variables: `bg-primary`, `text-primary-foreground`, `bg-background`
- Accent color: Emerald/Teal (`emerald-500`, `teal-600`)
- **No indigo or blue** as primary colors
- Dark mode supported via `next-themes`

### Component Library

- Use shadcn/ui components from `src/components/ui/` — do NOT create custom base components
- All shadcn/ui components already exist (40+ components installed)

### Responsive Design

- Mobile-first: design for mobile, then enhance for desktop
- Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`
- Touch targets: minimum 44px for interactive elements

### RTL Support

```tsx
const { dir } = useI18n();
const isRTL = dir() === 'rtl';

// For layout direction
<div className={isRTL ? 'flex-row-reverse' : 'flex-row'}>

// For text alignment
<div className={isRTL ? 'text-right' : 'text-left'}>

// For margin/padding flipping
<div className={isRTL ? 'ml-4' : 'mr-4'}>
```

---

## Troubleshooting

### `initFromUrl is not a function`

This error means an old SPA root page exists at `src/app/page.tsx`. **Delete it.** The `(buyer)` route group handles the homepage.

### ChunkLoadError

This happens when too many components are eagerly imported. Use `next/dynamic` for heavy components.

### Horizontal Overflow

Check for:
- Elements with `w-max` or negative margins
- Missing `overflow-x-hidden` on body/root
- Unconstrained carousels or scrollable sections

### Cars/Properties Page Empty

Ensure the API returns data matching the component's TypeScript interface exactly. Check for:
- Field name mismatches (e.g., `city` vs `location`)
- Null handling (e.g., `titleAr` may be null)
- API response wrapping (e.g., `{ cars: [...] }` not `[...]`)

### Memory Issues (OOM)

- Use dynamic imports for heavy components
- Don't eagerly import all components in a single file
- Restart the dev server if it grows beyond 1.5GB

---

## File Change Checklist

When making changes, verify:

- [ ] `bun run lint` passes with 0 errors
- [ ] Dev server runs without compilation errors
- [ ] No hardcoded mock data — all data comes from API/DB
- [ ] New i18n keys added to both `en.json` and `ar.json`
- [ ] New config constants added to `src/lib/config.ts` (not scattered)
- [ ] Navigation uses `<Link>` or `useAppNavigation()` — not `useAppStore()`
- [ ] Button+Link uses `asChild` pattern
- [ ] JSON fields parsed before use
- [ ] Null safety on `.toFixed()` calls
- [ ] Arabic fallback: `nameAr || name`
- [ ] Price display uses `formatPrice()`
- [ ] Footer is sticky with `mt-auto`
- [ ] No `src/app/page.tsx` created (root page shadow)
- [ ] Work logged in `/home/z/my-project/worklog.md`

---

## Worklog Protocol

After completing work, append to `/home/z/my-project/worklog.md`:

```markdown
---
Task ID: <task id>
Agent: <your agent name>
Task: <what you were asked to do>

Work Log:
- <step 1>
- <step 2>
- ...

Stage Summary:
- <key results / decisions / artifacts>
```
