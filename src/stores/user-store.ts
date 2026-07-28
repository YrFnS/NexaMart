'use client';

import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'buyer' | 'seller' | 'admin';
  loyaltyTier: string;
  loyaltyPoints: number;
  walletBalance: number;
  aiCredits: number;
  isVerified: boolean;
}

interface UserState {
  user: User | null;
  hydrated: boolean;
  isHydrating: boolean;
  setUser: (user: User | null) => void;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

let refreshPromise: Promise<void> | null = null;

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  hydrated: false,
  isHydrating: false,

  // Kept for compatibility with existing components, but arbitrary browser data
  // is never accepted as identity. Non-null values trigger a server session refresh.
  setUser: (user) => {
    if (user === null) {
      void get().logout();
      return;
    }
    void get().refreshSession();
  },

  refreshSession: async () => {
    if (typeof window === 'undefined') return;
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      set({ isHydrating: true });
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!response.ok) {
          set({ user: null });
          return;
        }
        const data = (await response.json()) as { user?: User | null };
        set({ user: data.user || null });
      } catch {
        set({ user: null });
      } finally {
        set({ hydrated: true, isHydrating: false });
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Clear local presentation state even if the network is unavailable.
    } finally {
      set({ user: null, hydrated: true, isHydrating: false });
    }
  },
}));
