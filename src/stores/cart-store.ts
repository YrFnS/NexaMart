'use client';

import { create } from 'zustand';
import { LS_KEYS } from '@/lib/config';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  storeId: string;
  storeName: string;
  variation?: string | Record<string, string>;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(LS_KEYS.cart);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // localStorage not available or invalid data
  }
  return [];
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
      // Serialize variation object to string if needed
      const serializedItem = {
        ...item,
        variation:
          item.variation && typeof item.variation === 'object'
            ? JSON.stringify(item.variation)
            : item.variation,
      };
      const existing = state.items.find((i) => i.productId === serializedItem.productId);
      const newItems = existing
        ? state.items.map((i) =>
            i.productId === serializedItem.productId
              ? { ...i, quantity: i.quantity + serializedItem.quantity }
              : i
          )
        : [...state.items, serializedItem];
      saveCart(newItems);
      return { items: newItems };
    }),

  removeItem: (productId) =>
    set((state) => {
      const newItems = state.items.filter((i) => i.productId !== productId);
      saveCart(newItems);
      return { items: newItems };
    }),

  updateQuantity: (productId, quantity) =>
    set((state) => {
      const newItems = quantity <= 0
        ? state.items.filter((i) => i.productId !== productId)
        : state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
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
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getItemCount: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
