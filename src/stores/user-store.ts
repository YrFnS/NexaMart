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

interface SetUserOptions {
  syncLogout?: boolean;
}

interface UserState {
  user: User | null;
  isHydrated: boolean;
  setUser: (user: User | null, options?: SetUserOptions) => void;
  setHydrated: (value: boolean) => void;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isHydrated: false,

  setUser: (user, options) => {
    const previousUser = get().user;
    set({ user });

    if (
      !user &&
      previousUser &&
      options?.syncLogout !== false &&
      typeof window !== 'undefined'
    ) {
      void fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    }
  },

  setHydrated: (value) => set({ isHydrated: value }),

  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } finally {
      set({ user: null, isHydrated: true });
    }
  },
}));
