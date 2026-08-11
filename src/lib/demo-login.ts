type Environment = Readonly<Record<string, string | undefined>>;

function normalized(value: string | undefined): string | undefined {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || undefined;
}

export function isProductionRuntime(
  environment: Environment = process.env,
): boolean {
  const explicitEnvironment =
    normalized(environment.DEPLOYMENT_ENV) ||
    normalized(environment.VERCEL_ENV);

  if (explicitEnvironment) return explicitEnvironment === 'production';
  return normalized(environment.NODE_ENV) === 'production';
}

export function isDemoLoginEnabled(
  environment: Environment = process.env,
): boolean {
  // Demo sessions must never be enabled in the real production runtime, even
  // when a stale hosting variable still says ENABLE_DEMO_LOGIN=true.
  if (isProductionRuntime(environment)) return false;

  return (
    normalized(environment.ENABLE_DEMO_LOGIN) === 'true' ||
    normalized(environment.VERCEL_ENV) === 'preview' ||
    normalized(environment.NODE_ENV) !== 'production'
  );
}
