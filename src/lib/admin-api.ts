/**
 * Admin API utility — wraps fetch with X-Admin-Key auth header.
 *
 * Client-side components use NEXT_PUBLIC_ADMIN_KEY (or localStorage override).
 * Server-side middleware uses ADMIN_SECRET_KEY (no NEXT_PUBLIC_ prefix).
 */

const LS_KEY = 'nexamart-admin-key';
const DEFAULT_KEY = 'nexamart-admin-secret-change-in-production';

/** Get the admin key: localStorage override → env var → default */
function getAdminKey(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) return stored;
    } catch {
      // localStorage unavailable
    }
  }
  return process.env.NEXT_PUBLIC_ADMIN_KEY || DEFAULT_KEY;
}

/** Set the admin key in localStorage (used by login gate) */
export function setAdminKey(key: string): void {
  try {
    localStorage.setItem(LS_KEY, key);
  } catch {
    // localStorage unavailable
  }
}

/** Remove the admin key from localStorage (logout) */
export function removeAdminKey(): void {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // localStorage unavailable
  }
}

/** Check if an admin key is stored in localStorage */
export function hasAdminKey(): boolean {
  try {
    return !!localStorage.getItem(LS_KEY);
  } catch {
    return false;
  }
}

/**
 * Drop-in replacement for `fetch()` that automatically attaches the
 * `X-Admin-Key` header to every request.
 */
export async function adminFetch(url: string, options?: RequestInit): Promise<Response> {
  const key = getAdminKey();
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'X-Admin-Key': key,
    },
  });
}
