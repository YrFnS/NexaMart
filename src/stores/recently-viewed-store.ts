'use client';

import { create } from 'zustand';
import { STORE_LIMITS } from '@/lib/config';

const LS_KEY = 'nexamart_recently_viewed';

function loadFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.filter((id: unknown) => typeof id === 'string');
    }
  } catch {
    // localStorage not available
  }
  return [];
}

function saveToStorage(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
  } catch {
    // localStorage not available
  }
}

interface RecentlyViewedState {
  productIds: string[];
  addProduct: (id: string) => void;
  clearHistory: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>((set) => ({
  productIds: loadFromStorage(),

  addProduct: (id) =>
    set((state) => {
      const newIds = [id, ...state.productIds.filter((p) => p !== id)].slice(0, STORE_LIMITS.maxRecentlyViewed);
      saveToStorage(newIds);
      return { productIds: newIds };
    }),

  clearHistory: () => {
    saveToStorage([]);
    set({ productIds: [] });
  },
}));
