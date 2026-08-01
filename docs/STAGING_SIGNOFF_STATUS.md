# Staging sign-off status

This status file tracks the repository-controlled portion of the release gate. Human and environment-dependent results belong in the dedicated GitHub sign-off issue and must include evidence.

## Repository-controlled preparation

- [x] Deployment environment and release identity policy.
- [x] Database and rate-limit readiness endpoint.
- [x] Non-production `robots.txt` blocking.
- [x] Non-production `X-Robots-Tag` header.
- [x] HTTPS staging readiness verifier.
- [x] Optional protected-staging request header support.
- [x] Non-mutating deployed Playwright suite.
- [x] Desktop Chromium, Pixel 7 Chromium, and Firefox staging projects.
- [x] Responsive screenshots and runtime metrics retained as evidence.
- [x] Manual-dispatch staging workflow.
- [x] Optional automatic PR staging workflow through `STAGING_BASE_URL`.
- [x] Detailed manual release checklist.
- [x] Reusable staging sign-off issue template.

## External staging state

- [ ] A staging URL for the current pull-request head is available.
- [ ] Dedicated staging PostgreSQL and Upstash Redis resources are configured.
- [ ] The deployed staging workflow passes for the current head SHA.
- [ ] Physical-print evidence is recorded.
- [ ] Real assistive-technology evidence is recorded.
- [ ] Performance, cache, Redis, scheduler, and PostgreSQL evidence is recorded.
- [ ] Launch scope is decided.

The production-hardening pull request must remain a draft until all external staging items are complete and linked from the sign-off issue.
