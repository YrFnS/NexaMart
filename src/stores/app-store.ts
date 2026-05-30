'use client';

import { create } from 'zustand';
import type { CurrencyCode } from '@/lib/currency';
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
  if (typeof window === 'undefined') return 'USD';
  try {
    const saved = localStorage.getItem(LS_KEYS.currency);
    if (saved && ['USD', 'EUR', 'AED', 'SAR', 'KWD', 'IQD', 'JOD', 'QAR', 'OMR', 'EGP'].includes(saved)) {
      return saved as CurrencyCode;
    }
  } catch {
    // localStorage not available
  }
  return 'USD';
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

  setCurrency: (currency: CurrencyCode) => {
    set({ currency });
    try {
      localStorage.setItem(LS_KEYS.currency, currency);
    } catch {
      // localStorage not available
    }
  },
}));
