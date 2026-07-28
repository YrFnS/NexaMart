# NexaMart — AI-Powered Multi-Vendor Commerce Platform

NexaMart is a multi-vendor marketplace designed for the MENA region. It includes product commerce, auctions, classifieds, cars, properties, jobs, services, seller tooling, administration, Arabic localization, and AI-assisted features.

## Technology

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| State | Zustand and React Query |
| Database | PostgreSQL |
| ORM | Prisma 6.19.2 |
| Authentication | Signed HTTP-only sessions with scrypt password hashing |
| Localization | English and Arabic with RTL support |
| AI | OpenRouter-compatible API |

## Requirements

- Node.js 22
- npm 10 or newer
- PostgreSQL 15 or newer

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

The application starts at `http://localhost:3000`.

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
```

`ADMIN_SECRET_KEY` is optional and intended only for trusted server-to-server automation. It must never use a `NEXT_PUBLIC_` prefix or be stored in a browser. Audited automation must also set `ADMIN_AUTOMATION_USER_ID` to the ID of an existing administrator account.


Existing users created before this authentication migration have no password hash. Initialize each account deliberately after deployment; use a mounted secret file in production so the password is not written into shell history:

```bash
AUTH_BOOTSTRAP_EMAIL="admin@nexamart.com" \
AUTH_BOOTSTRAP_PASSWORD_FILE="/run/secrets/nexamart-admin-password" \
npm run auth:set-password
```

## Demo accounts

The seed contains buyer, seller, and administrator records. Demo login is intentionally disabled in production unless this variable is explicitly set:

```env
ENABLE_DEMO_LOGIN="true"
```

Use demo login only for isolated development or preview environments. Real accounts must use the registration and login endpoints.

## Verification commands

```bash
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
- Checkout recalculates product prices, stock, coupon discounts, tax, shipping, invoices, and wallet deductions inside one serializable database transaction.
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
