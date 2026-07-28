/**
 * Admin API utility.
 *
 * Admin authorization is now derived from the signed HttpOnly session cookie.
 * No secret is stored in localStorage or exposed through NEXT_PUBLIC_* variables.
 */

/** @deprecated Shared browser admin keys are intentionally disabled. */
export function setAdminKey(_key: string): void {
  // Kept as a compatibility no-op for any stale imports.
}

/** @deprecated Shared browser admin keys are intentionally disabled. */
export function removeAdminKey(): void {
  // Kept as a compatibility no-op for any stale imports.
}

/** @deprecated Shared browser admin keys are intentionally disabled. */
export function hasAdminKey(): boolean {
  return false;
}

export async function adminFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include',
    cache: options?.cache ?? 'no-store',
    headers: {
      ...options?.headers,
    },
  });
}
