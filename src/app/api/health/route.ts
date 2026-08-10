import { db } from '@/lib/db';
import {
  getDeploymentEnvironment,
  getRateLimitMode,
  getReleaseSha,
  isDeploymentReady,
  isSearchIndexingAllowed,
} from '@/lib/deployment';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const responseHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
};

export async function GET() {
  const startedAt = Date.now();
  const environment = getDeploymentEnvironment();
  const releaseSha = getReleaseSha();
  const rateLimit = getRateLimitMode();
  const indexing = isSearchIndexingAllowed() ? 'allowed' : 'blocked';

  try {
    await db.$queryRaw`SELECT 1`;

    const ready = isDeploymentReady();
    return Response.json(
      {
        service: 'nexamart',
        status: ready ? 'ok' : 'degraded',
        environment,
        release: { sha: releaseSha },
        indexing,
        checks: {
          database: 'ok',
          rateLimit,
        },
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
      {
        status: ready ? 200 : 503,
        headers: responseHeaders,
      },
    );
  } catch (error) {
    console.error('Deployment health check failed:', error);

    return Response.json(
      {
        service: 'nexamart',
        status: 'unavailable',
        environment,
        release: { sha: releaseSha },
        indexing,
        checks: {
          database: 'unavailable',
          rateLimit,
        },
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
      {
        status: 503,
        headers: responseHeaders,
      },
    );
  }
}
