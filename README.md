# NexaMart — AI-Powered Multi-Vendor Commerce Platform

NexaMart is a multi-vendor commerce platform for the MENA region. It includes product commerce, auctions, classifieds, cars, properties, jobs, services, seller tooling, administration, Arabic localization, and AI-assisted features.

## Current production foundation

The application uses server-verified identities, signed HttpOnly sessions, ownership checks for private data, transactional checkout, idempotent payout processing, PostgreSQL migrations, and CI-enforced lint/type/build checks.

Wallet checkout is processed transactionally. Card, Apple Pay, Google Pay, Zain Cash, and STC Pay orders are created with a **pending and uncharged** payment state until a real payment-provider adapter confirms the transaction.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| State | Zustand and TanStack Query |
| Database | PostgreSQL |
| ORM | Prisma 6.19 |
| Authentication | Signed HttpOnly sessions and scrypt password hashes |
| Internationalization | next-intl, English/Arabic, RTL |
| AI | OpenRouter-compatible models |
| Runtime/package manager | Node.js 20.9+ and Bun 1.3.4 |

## Prerequisites

- Node.js 20.9 or newer
- Bun 1.3.4
- PostgreSQL 15 or newer

## Install

```bash
git clone <repo-url> nexa-mart
cd nexa-mart
bun install --frozen-lockfile
cp .env.example .env
```

Generate a session secret and place it in `.env`:

```bash
openssl rand -hex 32
```

At minimum, configure:

```env
DATABASE_URL="postgresql://nexamart:change-me@localhost:5432/nexamart?schema=public"
AUTH_SECRET="replace-with-at-least-32-random-characters"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ALLOW_DEMO_LOGIN="false"
ALLOW_LEGACY_ADMIN_KEY="false"
```

Never expose `AUTH_SECRET` through a `NEXT_PUBLIC_*` variable.

## Database

For a new database:

```bash
bunx prisma migrate deploy
bunx prisma generate
```

For a database that was previously created with `prisma db push` and has no Prisma migration history, baseline the old migration before deploying the completion migration:

```bash
bunx prisma migrate status
bunx prisma migrate resolve --applied init
bunx prisma migrate deploy
```

The completion migration is idempotent so it can safely reconcile databases that already contain the newer marketplace tables.

Optional demo data:

```bash
bun prisma/seed.ts
```

## Provision a real account

Registration creates buyer accounts only. Provision or reset a trusted seller/admin account from the server or a secure operator machine:

```bash
bun run auth:provision -- admin@nexamart.com "use-a-long-random-password" admin "NexaMart Admin"
```

The command stores only a salted scrypt hash. It does not create a public bootstrap endpoint.

## Run

```bash
bun run dev
```

Production verification:

```bash
bun run check
```

Production server:

```bash
bun run build
bun run start
```

## Security behavior

- User identity and roles come from a signed HttpOnly cookie, never localStorage.
- Admin APIs require an authenticated admin session. The old shared browser key is disabled unless `ALLOW_LEGACY_ADMIN_KEY=true` is deliberately enabled for a short migration window.
- Orders, addresses, notifications, and invoices are scoped to the authenticated account.
- Checkout recalculates prices, coupons, tax, shipping, and stock on the server.
- Order creation, stock changes, wallet charging, invoices, coupon usage, and idempotency records commit in one serializable transaction.
- Payout status changes, wallet deductions, and audit logging commit in one serializable transaction.
- Demo login is disabled in production unless explicitly enabled.

## Quality gates

Pull requests run PostgreSQL schema validation, ESLint, TypeScript checking, and a production build through GitHub Actions. Production builds no longer ignore TypeScript failures.

## Project structure

```text
src/
├── app/                    # Next.js routes and REST endpoints
├── components/             # Buyer, seller, admin, layout, and UI components
├── lib/                    # Auth, database, security, configuration, utilities
├── stores/                 # Client presentation state
└── hooks/                  # Shared React hooks
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
scripts/
└── provision-user.ts
```

## License

Proprietary — NexaMart by ZOO.
