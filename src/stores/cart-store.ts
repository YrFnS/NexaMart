'use client';

import { create } from 'zustand';
import { canonicalizeVariation } from '@/lib/checkout-authority';
import { LS_KEYS } from '@/lib/config';

export interface CartItem {
  lineId: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  storeId: string;
  storeName: string;
  hasFreeShipping?: boolean;
  variation?: string | Record<string, string>;
}

export type NewCartItem = Omit<CartItem, 'lineId'> & { lineId?: string };

interface CartState {
  items: CartItem[];
  addItem: (item: NewCartItem) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

function serializeVariation(
  variation: string | Record<string, string> | undefined,
): string | undefined {
  if (!variation) return undefined;

  if (typeof variation === 'object') {
    const canonical = canonicalizeVariation(variation);
    return canonical === '{}' ? undefined : canonical;
  }

  const trimmed = variation.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const canonical = canonicalizeVariation(
        Object.fromEntries(
          Object.entries(parsed).map(([key, value]) => [key, String(value)]),
        ),
      );
      return canonical === '{}' ? undefined : canonical;
    }
  } catch {
    // Keep legacy one-dimensional string selections intact.
  }

  return trimmed;
}

export function createCartLineId(
  productId: string,
  variation?: string | Record<string, string>,
): string {
  const serializedVariation = serializeVariation(variation) || 'base';
  return `${productId}:${encodeURIComponent(serializedVariation)}`;
}

function normalizeCartItem(item: NewCartItem): CartItem {
  const variation = serializeVariation(item.variation);
  return {
    ...item,
    variation,
    lineId: item.lineId || createCartLineId(item.productId, variation),
  };
}

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(LS_KEYS.cart);
    if (!saved) return [];

    const parsed = JSON.parse(saved) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is NewCartItem =>
          Boolean(
            item &&
              typeof item === 'object' &&
              'productId' in item &&
              'quantity' in item,
          ),
      )
      .map(normalizeCartItem);
  } catch {
    // localStorage not available or invalid data
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEYS.cart, JSON.stringify(items));
  } catch {
    // localStorage not available
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: loadCart(),

  addItem: (item) =>
    set((state) => {
      const normalizedItem = normalizeCartItem(item);
      const existing = state.items.find(
        (current) => current.lineId === normalizedItem.lineId,
      );
      const newItems = existing
        ? state.items.map((current) =>
            current.lineId === normalizedItem.lineId
              ? {
                  ...current,
                  quantity: current.quantity + normalizedItem.quantity,
                }
              : current,
          )
        : [...state.items, normalizedItem];
      saveCart(newItems);
      return { items: newItems };
    }),

  removeItem: (lineId) =>
    set((state) => {
      const newItems = state.items.filter((item) => item.lineId !== lineId);
      saveCart(newItems);
      return { items: newItems };
    }),

  updateQuantity: (lineId, quantity) =>
    set((state) => {
      const newItems =
        quantity <= 0
          ? state.items.filter((item) => item.lineId !== lineId)
          : state.items.map((item) =>
              item.lineId === lineId ? { ...item, quantity } : item,
            );
      saveCart(newItems);
      return { items: newItems };
    }),

  clearCart: () => {
    saveCart([]);
    set({ items: [] });
  },

  getTotal: () => {
    const { items } = get();
    return items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  },

  getItemCount: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
