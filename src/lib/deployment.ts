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
  const release =
    value(environment.RELEASE_SHA) ||
    value(environment.VERCEL_GIT_COMMIT_SHA) ||
    value(environment.RENDER_GIT_COMMIT) ||
    value(environment.RAILWAY_GIT_COMMIT_SHA) ||
    value(environment.SOURCE_VERSION) ||
    value(environment.GITHUB_SHA);

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

  const memoryFallbackAllowed =
    getDeploymentEnvironment(environment) !== 'production' ||
    environment.RATE_LIMIT_ALLOW_MEMORY_FALLBACK === 'true';

  return memoryFallbackAllowed ? 'memory-fallback' : 'unavailable';
}

export function isSearchIndexingAllowed(
  environment: Environment = process.env,
): boolean {
  return getDeploymentEnvironment(environment) === 'production';
}
