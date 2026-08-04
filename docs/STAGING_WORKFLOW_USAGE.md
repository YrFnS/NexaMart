# Running the staging verification workflow

## Automatic pull-request mode

Set the repository variable:

```text
STAGING_BASE_URL=https://staging.example.com
```

For each pull-request update, the workflow waits for `/api/health` to report the pull-request head SHA and then runs the non-mutating browser suite. Without this variable the staging job is intentionally skipped rather than reporting a false pass.

## Manual mode

Open **Actions → Staging verification → Run workflow** and provide:

- The HTTPS staging origin.
- The expected full or abbreviated release SHA.
- Whether the environment must report the Redis limiter.
- Whether the environment must remain non-indexable.

The default release settings require both Redis and no-index protection.

## Protected staging

A provider-protected deployment can set these repository secrets:

```text
STAGING_AUTH_HEADER_NAME
STAGING_AUTH_HEADER_VALUE
```

The values are added to readiness and browser requests but are not written to the readiness report or Playwright attachments.

## Evidence

Every run retains:

- `staging-test-results/readiness.json`
- Playwright HTML report
- Chromium desktop and Pixel 7 screenshots
- Navigation and resource metrics
- Failure traces, screenshots, and videos

The `staging-evidence-*` artifact is retained for 30 days. Reference its workflow run and artifact in the staging sign-off issue.
