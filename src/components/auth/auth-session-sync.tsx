'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/stores/cart-store';
import { useUserStore, type User } from '@/stores/user-store';

const CART_OWNER_KEY = 'nexamart_cart_owner';

export function AuthSessionSync() {
  const setUser = useUserStore((state) => state.setUser);
  const setHydrated = useUserStore((state) => state.setHydrated);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    const controller = new AbortController();

    async function hydrateSession() {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal,
        });
        const data = (await response.json()) as { user?: User | null };
        const nextUser = response.ok ? data.user || null : null;

        try {
          const previousOwner = localStorage.getItem(CART_OWNER_KEY);
          const nextOwner = nextUser?.id || 'guest';
          if (previousOwner && previousOwner !== nextOwner) {
            clearCart();
          }
          localStorage.setItem(CART_OWNER_KEY, nextOwner);
        } catch {
          // Storage can be disabled. The session remains authoritative.
        }

        setUser(nextUser, { syncLogout: false });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setUser(null, { syncLogout: false });
        }
      } finally {
        setHydrated(true);
      }
    }

    void hydrateSession();
    return () => controller.abort();
  }, [clearCart, setHydrated, setUser]);

  return null;
}
