---
name: Staging release sign-off
description: Record deployed automation, physical print, assistive technology, and production-like operations evidence.
title: "Staging release sign-off: "
labels: []
assignees: []
---

## Release identity

- Pull request:
- Branch:
- Expected commit SHA:
- Staging URL:
- Deployment provider:
- Staging workflow run:
- `staging-evidence-*` artifact:

## Deployment readiness

- [ ] Dedicated staging PostgreSQL database is configured.
- [ ] Dedicated Upstash Redis REST database is configured.
- [ ] `DEPLOYMENT_ENV=staging` and the expected release SHA are reported by `/api/health`.
- [ ] `RATE_LIMIT_ALLOW_MEMORY_FALLBACK=false` and `/api/health` reports `rateLimit=redis`.
- [ ] Demo login is disabled.
- [ ] Staging is protected from search indexing.
- [ ] The deployed staging verification workflow passes.

## Required manual evidence

- [ ] English buyer order document printed successfully on A4.
- [ ] Arabic seller packing slip printed successfully on A4 without prices.
- [ ] English keyboard and real screen-reader buyer walkthrough passed.
- [ ] Arabic/RTL keyboard and real screen-reader buyer walkthrough passed.
- [ ] Seller fulfilment and return/exchange screen-reader walkthrough passed.
- [ ] Responsive and Core Web Vitals evidence recorded.
- [ ] Private/public cache behavior reviewed.
- [ ] Distributed rate limiting and controlled Redis failure behavior reviewed.
- [ ] Scheduled unconfirmed-order expiration verified.
- [ ] PostgreSQL and concurrency behavior monitored and verified.
- [ ] First-launch vertical scope recorded.

## Evidence

Use the detailed repository checklist at `docs/STAGING_RELEASE_CHECKLIST.md` and attach or link the evidence for every required row.

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

## Release decision

- [ ] All required gates have evidence.
- [ ] No unresolved release blocker remains.
- [ ] The hardening pull request may be marked ready for review.

Do not merge solely because repository CI is green.
