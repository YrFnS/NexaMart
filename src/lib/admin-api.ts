/**
 * Same-origin admin API wrapper.
 *
 * Admin authorization is derived from the signed HTTP-only session cookie.
 * No credential is stored in localStorage or exposed through NEXT_PUBLIC_*.
 */
export async function adminFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...options?.headers,
    },
  });
}

/** @deprecated Admin keys are no longer accepted from browser code. */
export function setAdminKey(_key: string): void {
  // Intentionally empty for temporary import compatibility.
}

/** @deprecated Admin keys are no longer stored in the browser. */
export function removeAdminKey(): void {
  // Intentionally empty for temporary import compatibility.
}

/** @deprecated Authentication state is checked through /api/auth/session. */
export function hasAdminKey(): boolean {
  return false;
}
