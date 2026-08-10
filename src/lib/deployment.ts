type Environment = Readonly<Record<string, string | undefined>>;

export type RateLimitMode =
  | 'redis'
  | 'memory-fallback'
  | 'unavailable';

function value(input: string | undefined): string | undefined {
  const trimmed = input?.trim();
  return trimmed || undefined;
}

export function getDeploymentEnvironment(
  environment: Environment = process.env,
): string {
  return (
    value(environment.DEPLOYMENT_ENV) ||
    value(environment.VERCEL_ENV) ||
    value(environment.NODE_ENV) ||
    'unknown'
  ).toLowerCase();
}

export function getReleaseSha(
  environment: Environment = process.env,
): string | null {
  // Provider-owned values describe the code that is actually executing. Keep a
  // manually configured RELEASE_SHA only as a fallback so stale project
  // settings cannot make health checks report an older commit.
  const release =
    value(environment.VERCEL_GIT_COMMIT_SHA) ||
    value(environment.RENDER_GIT_COMMIT) ||
    value(environment.RAILWAY_GIT_COMMIT_SHA) ||
    value(environment.SOURCE_VERSION) ||
    value(environment.GITHUB_SHA) ||
    value(environment.RELEASE_SHA);

  return release ? release.slice(0, 128) : null;
}

export function getRateLimitMode(
  environment: Environment = process.env,
): RateLimitMode {
  const redisConfigured = Boolean(
    value(environment.UPSTASH_REDIS_REST_URL) &&
      value(environment.UPSTASH_REDIS_REST_TOKEN),
  );
  if (redisConfigured) return 'redis';

  // Preview and staging deployments may use a process-local limiter so they
  // remain testable. Only the actual production environment fails closed
  // unless an operator explicitly enables the degraded fallback.
  const memoryFallbackAllowed =
    getDeploymentEnvironment(environment) !== 'production' ||
    environment.RATE_LIMIT_ALLOW_MEMORY_FALLBACK === 'true';

  return memoryFallbackAllowed ? 'memory-fallback' : 'unavailable';
}

export function isDeploymentReady(
  environment: Environment = process.env,
): boolean {
  const rateLimit = getRateLimitMode(environment);
  if (rateLimit === 'unavailable') return false;

  // A single-instance in-memory limiter is useful for previews, staging, and
  // the explicit browser harness, but it is not production-grade protection.
  return (
    getDeploymentEnvironment(environment) !== 'production' ||
    rateLimit === 'redis'
  );
}

export function isSearchIndexingAllowed(
  environment: Environment = process.env,
): boolean {
  return getDeploymentEnvironment(environment) === 'production';
}
