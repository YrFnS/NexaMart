'use client';

import { create } from 'zustand';
import type { CurrencyCode } from '@/lib/currency';
import { BASE_CURRENCY } from '@/lib/money';
import { LS_KEYS, STORE_LIMITS } from '@/lib/config';

/**
 * App Store — UI state only. Do NOT use this for navigation.
 * For navigation, use `useAppNavigation()` from `@/lib/use-app-navigation` or `<Link>` from `next/link`.
 */

interface AppState {
  selectedCategory: string | null;
  searchQuery: string;
  compareIds: string[];
  currency: CurrencyCode;

  selectCategory: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  setCurrency: (currency: CurrencyCode) => void;
}

function getInitialCurrency(): CurrencyCode {
  return BASE_CURRENCY;
}

export const useAppStore = create<AppState>((set) => ({
  selectedCategory: null,
  searchQuery: '',
  compareIds: [],
  currency: getInitialCurrency(),

  selectCategory: (id) => set({ selectedCategory: id }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  toggleCompare: (id) =>
    set((state) => ({
      compareIds: state.compareIds.includes(id)
        ? state.compareIds.filter((i) => i !== id)
        : state.compareIds.length < STORE_LIMITS.maxCompareItems
        ? [...state.compareIds, id]
        : state.compareIds,
    })),

  clearCompare: () => set({ compareIds: [] }),

  setCurrency: (_currency: CurrencyCode) => {
    set({ currency: BASE_CURRENCY });
    try {
      localStorage.setItem(LS_KEYS.currency, BASE_CURRENCY);
    } catch {
      // localStorage not available
    }
  },
}));
