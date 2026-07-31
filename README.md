# NexaMart — AI-Powered Multi-Vendor Commerce Platform

NexaMart is a multi-vendor marketplace designed for the MENA region. It includes product commerce, auctions, classifieds, cars, properties, jobs, services, seller tooling, administration, Arabic localization, and AI-assisted features.

## Technology

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| State | Zustand and React Query |
| Database | PostgreSQL |
| ORM | Prisma 6.19.3 |
| Authentication | Signed HTTP-only sessions with scrypt password hashing |
| Rate limiting | Upstash Redis REST with atomic fixed-window counters |
| Localization | English and Arabic with RTL support |
| AI | OpenRouter-compatible API |

## Requirements

- Node.js 22
- npm 10 or newer
- PostgreSQL 15 or newer
- Upstash Redis REST credentials for production API traffic

SQLite is not supported by the current Prisma schema.

## Local setup

```bash
git clone <repo-url> nexa-mart
cd nexa-mart
npm ci
cp .env.example .env
```

Create a PostgreSQL database, then update `DATABASE_URL` in `.env`. Generate a strong session secret:

```bash
openssl rand -base64 48
```

Place the result in `AUTH_SECRET`, then deploy the checked-in migrations:

```bash
npm run db:deploy
npm run db:generate
SEED_DEMO_PASSWORD='choose-a-development-password' npm run db:seed
npm run dev
```

The application starts at `http://localhost:3000`. Development uses a per-process rate-limit fallback when Redis credentials are absent. This fallback is not suitable for production or horizontally scaled previews.

## Production deployment

Use the same immutable migration history in every environment:

```bash
npm ci
npm run db:deploy
npm run build
npm start
```

Do not use `prisma db push` for production deployments. It bypasses the reviewed migration history.

Required production variables:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="a-long-random-secret-with-at-least-32-characters"
NEXT_PUBLIC_APP_URL="https://your-domain.example"
NEXTAUTH_URL="https://your-domain.example"
UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-server-only-rest-token"
RATE_LIMIT_ALLOW_MEMORY_FALLBACK="false"
```

The API limiter uses an atomic Redis script so all application instances share the same counters. Production requests fail closed with `503` if the distributed limiter is missing or unavailable. `RATE_LIMIT_ALLOW_MEMORY_FALLBACK=true` is intended only for isolated development or preview environments.

`ADMIN_SECRET_KEY` is optional and intended only for trusted server-to-server automation. It must never use a `NEXT_PUBLIC_` prefix or be stored in a browser. Audited automation must also set `ADMIN_AUTOMATION_USER_ID` to the ID of an existing administrator account.

Existing users created before this authentication migration have no password hash. Initialize each account deliberately after deployment; use a mounted secret file in production so the password is not written into shell history:

```bash
AUTH_BOOTSTRAP_EMAIL="admin@nexamart.com" \
AUTH_BOOTSTRAP_PASSWORD_FILE="/run/secrets/nexamart-admin-password" \
npm run auth:set-password
```

## Product and SKU model

Simple products keep their price, stock, and optional SKU on the parent `Product` record. Configurable products use first-class `ProductVariant` rows, with one active row for each purchasable option combination.

Each variant owns:

- A globally unique SKU.
- Canonical option attributes such as `color=Black` and `size=M`.
- Its own selling price and optional original price.
- Its own inventory balance and activation state.

The parent product stores the minimum active SKU price and aggregate active SKU stock for catalogue sorting and summaries. Checkout does not trust those summary values for configurable products: it resolves the active SKU from the submitted `variantId` and canonical option snapshot, verifies they match, and reserves that SKU's inventory atomically.

Seller product management is backed by `/api/seller/products`. Seller and administrator sessions can create, edit, archive, and search products and SKUs only in stores they are authorized to manage. Removing a SKU from an edit deactivates it rather than deleting historical order references.

After deploying the product-variant migration, run the normal seed only in isolated development environments. The seed creates deterministic demo SKU combinations and distributes each demo product's aggregate stock across them.

## Demo accounts

The seed contains buyer, seller, and administrator records. Demo login is intentionally disabled in production unless this variable is explicitly set:

```env
ENABLE_DEMO_LOGIN="true"
```

Use demo login only for isolated development or preview environments. Real accounts must use the registration and login endpoints.

## Paymentless order model

This release does not process cards, wallets, transfers, seller payouts, or online refunds. Checkout creates cash-on-delivery orders only. Each seller must explicitly confirm, prepare, ship, and deliver their own marketplace order. Buyer cancellation is allowed only before seller confirmation. Cancellation and rejection restore the exact product and SKU inventory once.

Pending orders receive a confirmation deadline controlled by `ORDER_CONFIRMATION_TTL_HOURS`. A trusted administrator or scheduled server job can call `POST /api/admin/orders/expire` using the server-only administrator bearer token to cancel expired unconfirmed orders and restore inventory.

## Verification commands

```bash
npm audit --omit=dev --audit-level=high
npm test
npm run lint
npm run typecheck
npm run build
```

The CI workflow also starts a clean PostgreSQL service, applies all migrations, and runs these checks for every pull request.

## Security model

- Browser identity is hydrated from a signed HTTP-only cookie; roles and balances are not trusted from local storage.
- User APIs derive ownership from the authenticated session rather than caller-provided IDs.
- Administrative writes require an administrator session and same-origin request validation.
- Seller product and variant writes require an authorized seller-store relationship or an administrator role.
- API rate limits are enforced through shared Redis counters rather than process-local memory in production.
- Rate-limit identifiers are SHA-256 hashed before they are used as Redis keys.
- Checkout recalculates SKU prices, variant inventory, coupon discounts, tax, per-seller shipping, invoices, and wallet deductions inside one serializable database transaction.
- Order items preserve both an immutable option snapshot and an optional relational SKU reference.
- Payout completion is transactional and idempotent.
- Unsupported payment methods are not presented as successful payments.

## Project structure

```text
src/
├── app/
│   ├── api/          # Route handlers
│   ├── (buyer)/      # Buyer routes
│   ├── auth/         # Authentication routes
│   ├── admin/        # Administration routes
│   └── seller/       # Seller routes
├── components/
├── hooks/
├── lib/
└── stores/
prisma/
├── migrations/
├── schema.prisma
└── seed.ts
```

## License

Proprietary — NexaMart by ZOO.
