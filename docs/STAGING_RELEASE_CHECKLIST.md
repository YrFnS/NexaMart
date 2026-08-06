# NexaMart staging release checklist

This checklist is the final gate between the automated hardening work and marking the production-hardening pull request ready for review. It is designed for a dedicated staging deployment and must not be run against the production database.

## 1. Staging prerequisites

Provision resources isolated from production:

- A dedicated PostgreSQL database.
- A dedicated Upstash Redis REST database.
- Separate authentication, administrator automation, and AI credentials.
- At least one active public product and one public store.
- Dedicated buyer, seller, and administrator test accounts.
- A delivered test order owned by the buyer and store used for document printing.

Required staging variables:

```env
DEPLOYMENT_ENV="staging"
RELEASE_SHA="<full commit SHA>"
DATABASE_URL="postgresql://..."
AUTH_SECRET="<staging-only secret with at least 32 characters>"
NEXT_PUBLIC_APP_URL="https://staging.example.com"
NEXTAUTH_URL="https://staging.example.com"
UPSTASH_REDIS_REST_URL="https://...upstash.io"
UPSTASH_REDIS_REST_TOKEN="<staging-only token>"
RATE_LIMIT_ALLOW_MEMORY_FALLBACK="false"
ENABLE_DEMO_LOGIN="false"
ORDER_CONFIRMATION_TTL_HOURS="24"
```

A supported platform-provided commit variable may replace `RELEASE_SHA`; `/api/health` resolves the known provider variables and reports the selected release identity.

Deploy in this order:

```bash
npm ci
npm run db:deploy
npm run build
npm start
```

Do not run `prisma db push`, `prisma migrate reset`, or the demo seed against shared staging data.

## 2. Automated deployed verification

The staging workflow performs read-only checks. It does not log in successfully, create orders, change inventory, or alter staging data.

Configure this repository variable:

```text
STAGING_BASE_URL=https://staging.example.com
```

A protected staging deployment may also use these optional repository secrets:

```text
STAGING_AUTH_HEADER_NAME=<provider header name>
STAGING_AUTH_HEADER_VALUE=<provider bypass value>
```

The workflow verifies:

- `/api/health` returns HTTP 200 and is not cacheable.
- The deployed release SHA matches the pull-request head.
- PostgreSQL is reachable.
- The distributed Redis rate limiter is configured.
- Staging reports search indexing as blocked.
- `robots.txt` disallows crawling.
- Required security headers are present.
- Public homepage, shop, stores, authentication, product, and store pages render.
- English and Arabic/RTL layouts remain inside desktop and mobile viewports.
- No serious or critical Axe violations are detected by the automated ruleset.
- Responsive screenshots and navigation/resource metrics are retained as evidence.

The workflow uploads `staging-evidence-*` for 30 days. Attach or reference that artifact in the sign-off issue.

## 3. Physical-print sign-off

Record the printer model, operating system, browser, paper source, and print-dialog settings.

### English buyer order document

- [ ] Open an order owned by the dedicated staging buyer.
- [ ] Print on A4 portrait at normal/default scale.
- [ ] Confirm all margins remain inside the printable area.
- [ ] Confirm the order number, dates, address, SKU, quantities, prices, and totals are legible.
- [ ] Confirm the document states that NexaMart does not process payment.
- [ ] Confirm there is no clipping, overlap, unexpected blank page, or missing background/border needed for comprehension.

### Arabic seller packing slip

- [ ] Sign in as the authorized seller or store staff member.
- [ ] Print the Arabic packing slip on A4 portrait.
- [ ] Confirm Arabic glyph shaping and RTL reading order are correct.
- [ ] Confirm mixed Arabic/Latin order numbers, SKUs, phone numbers, and option values are readable.
- [ ] Confirm the packing slip contains quantities and fulfilment details but no prices or totals.
- [ ] Confirm there is no clipping, overlap, unexpected blank page, or missing content.

## 4. Real assistive-technology sign-off

Record the device, operating system, browser, screen reader, language, and tester for every walkthrough.

### English buyer journey

- [ ] Keyboard-only navigation reaches the skip link and main content.
- [ ] Product search, filtering, product options, cart, and checkout have a logical focus order.
- [ ] Dialogs announce their names, contain focus, close with Escape where appropriate, and restore focus.
- [ ] Form labels, required fields, validation errors, and order confirmation are announced.
- [ ] Order status and return/exchange history are understandable without visual layout.

### Arabic buyer journey

- [ ] The document language and direction are announced as Arabic/RTL.
- [ ] Arabic labels, form errors, buttons, product options, and order status are pronounced and ordered correctly.
- [ ] Mixed-direction identifiers and phone numbers remain understandable.
- [ ] Focus order follows the visual RTL flow without trapping or skipping controls.

### Seller fulfilment journey

- [ ] Order confirmation, preparation, shipping, tracking, delivery, rejection, and cancellation controls are named.
- [ ] Status changes and errors are announced.
- [ ] Return disposition and replacement-shipment controls expose clear names, state, and confirmation.
- [ ] Private seller notes are not exposed in the buyer experience.

## 5. Staging performance and operations sign-off

### Responsive and performance evidence

- [ ] Review the workflow screenshots at desktop and Pixel 7 breakpoints.
- [ ] Test at least one representative lower-powered mobile device.
- [ ] Record LCP, INP, CLS, transferred bytes, and request counts for homepage, shop, product, and store pages.
- [ ] Repeat measurements on a throttled mobile network and after a warm-cache navigation.
- [ ] Confirm optimized images are used and off-screen catalogue images are lazy-loaded.
- [ ] Confirm no unexpected client request waterfall replaces server-rendered content.

### Cache and security behavior

- [ ] Confirm private account, order, document, seller, and administrator responses are not publicly cacheable.
- [ ] Confirm public assets and safe public responses use the intended CDN/browser caching behavior.
- [ ] Confirm security headers are present on HTML and API responses where applicable.
- [ ] Confirm staging remains non-indexable before sharing its URL outside the test group.

### Redis and rate limiting

- [ ] `/api/health` reports `checks.rateLimit` as `redis`.
- [ ] Repeated requests share counters across at least two application instances when staging is horizontally scaled.
- [ ] During a controlled staging-only test, confirm loss of Redis does not silently fall back to per-process memory when fallback is disabled.
- [ ] Restore and recheck the staging Redis credentials immediately after the controlled failure test.

### Scheduled order expiration

- [ ] Create a staging-only pending order with a known confirmation deadline.
- [ ] Run the trusted expiration job or scheduler using the staging administrator automation identity.
- [ ] Confirm only eligible unconfirmed orders expire.
- [ ] Confirm exact product and SKU inventory is restored once.
- [ ] Confirm the lifecycle event and audit identity are recorded once.

### PostgreSQL behavior

- [ ] Monitor connection count, query latency, locks, and slow queries during the walkthrough.
- [ ] Repeat the existing concurrent checkout, cancellation, return-restock, and replacement tests against disposable staging data.
- [ ] Confirm expected serialization retries do not leak HTTP 500 responses.
- [ ] Confirm one-time inventory and lifecycle invariants remain intact after concurrency tests.

## 6. Launch-scope decision

Record one explicit decision:

- [ ] First release includes only the hardened product marketplace and its order/fulfilment flows.
- [ ] Additional verticals are included only after separate authorization, money, UI, SEO, and browser verification.

Optional verticals requiring a separate release decision include cars, properties, classifieds, jobs, services, auctions, and app listings.

## 7. Evidence and approval

| Gate | Tester | Date | Evidence | Result |
|---|---|---|---|---|
| Automated deployed workflow |  |  |  |  |
| English physical print |  |  |  |  |
| Arabic physical print |  |  |  |  |
| English assistive technology |  |  |  |  |
| Arabic assistive technology |  |  |  |  |
| Seller fulfilment walkthrough |  |  |  |  |
| Performance and responsive review |  |  |  |  |
| Redis and cache behavior |  |  |  |  |
| Scheduled expiration |  |  |  |  |
| PostgreSQL/concurrency review |  |  |  |  |
| Launch-scope decision |  |  |  |  |

The pull request may be marked ready for review only when all required rows have evidence and no unresolved release blocker remains. Do not merge solely because repository CI is green.
