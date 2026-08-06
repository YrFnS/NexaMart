'use client';

import { create } from 'zustand';

export interface WishlistProduct {
  id: string;
  name: string;
  nameAr?: string | null;
  price: number;
  originalPrice?: number | null;
  images: string;
  stock: number;
  rating: number;
  reviewCount: number;
  storeId: string;
  variations?: string;
  hasFreeShipping?: boolean;
  store?: {
    id: string;
    name: string;
    nameAr?: string | null;
    logo?: string | null;
  } | null;
}

export interface WishlistEntry {
  id: string;
  productId: string;
  createdAt: string;
  product: WishlistProduct;
}

type ToggleResult = 'added' | 'removed' | 'auth-required' | 'unchanged';

interface WishlistState {
  activeUserId: string | null;
  items: WishlistEntry[];
  productIds: Record<string, string>;
  pendingProductIds: Record<string, boolean>;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  hydrate: (userId: string | null, force?: boolean) => Promise<void>;
  toggle: (
    userId: string | null,
    product: WishlistProduct,
  ) => Promise<ToggleResult>;
  remove: (
    userId: string | null,
    itemId: string,
    productId: string,
  ) => Promise<boolean>;
  removeAll: (userId: string | null) => Promise<boolean>;
  reset: () => void;
}

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeProduct(value: unknown, fallbackId: string): WishlistProduct {
  const product =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};
  const storeValue =
    product.store && typeof product.store === 'object'
      ? (product.store as Record<string, unknown>)
      : null;

  return {
    id: String(product.id || fallbackId),
    name: String(product.name || 'Product'),
    nameAr:
      typeof product.nameAr === 'string' ? product.nameAr : null,
    price: numberValue(product.price),
    originalPrice:
      product.originalPrice === null || product.originalPrice === undefined
        ? null
        : numberValue(product.originalPrice),
    images: typeof product.images === 'string' ? product.images : '[]',
    stock: Math.max(0, Math.trunc(numberValue(product.stock))),
    rating: numberValue(product.rating),
    reviewCount: Math.max(0, Math.trunc(numberValue(product.reviewCount))),
    storeId: String(product.storeId || storeValue?.id || ''),
    variations:
      typeof product.variations === 'string' ? product.variations : '{}',
    hasFreeShipping: Boolean(product.hasFreeShipping),
    store: storeValue
      ? {
          id: String(storeValue.id || product.storeId || ''),
          name: String(storeValue.name || 'Store'),
          nameAr:
            typeof storeValue.nameAr === 'string' ? storeValue.nameAr : null,
          logo: typeof storeValue.logo === 'string' ? storeValue.logo : null,
        }
      : null,
  };
}

function normalizeEntry(value: unknown): WishlistEntry | null {
  if (!value || typeof value !== 'object') return null;
  const entry = value as Record<string, unknown>;
  const id = typeof entry.id === 'string' ? entry.id : '';
  const productId =
    typeof entry.productId === 'string'
      ? entry.productId
      : typeof (entry.product as Record<string, unknown> | undefined)?.id ===
          'string'
        ? String((entry.product as Record<string, unknown>).id)
        : '';
  if (!id || !productId) return null;

  return {
    id,
    productId,
    createdAt:
      typeof entry.createdAt === 'string'
        ? entry.createdAt
        : new Date().toISOString(),
    product: normalizeProduct(entry.product, productId),
  };
}

function indexEntries(items: WishlistEntry[]): Record<string, string> {
  return Object.fromEntries(items.map((item) => [item.productId, item.id]));
}

function updatePending(
  pending: Record<string, boolean>,
  productId: string,
  value: boolean,
) {
  const next = { ...pending };
  if (value) next[productId] = true;
  else delete next[productId];
  return next;
}

const initialState = {
  activeUserId: null,
  items: [] as WishlistEntry[],
  productIds: {} as Record<string, string>,
  pendingProductIds: {} as Record<string, boolean>,
  loading: false,
  loaded: false,
  error: null as string | null,
};

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ...initialState,

  reset: () => set({ ...initialState }),

  hydrate: async (userId, force = false) => {
    if (!userId) {
      get().reset();
      return;
    }

    const current = get();
    if (
      !force &&
      current.activeUserId === userId &&
      (current.loaded || current.loading)
    ) {
      return;
    }

    set({
      activeUserId: userId,
      items: current.activeUserId === userId ? current.items : [],
      productIds:
        current.activeUserId === userId ? current.productIds : {},
      pendingProductIds: {},
      loading: true,
      loaded: false,
      error: null,
    });

    try {
      const response = await fetch('/api/wishlist?limit=100', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const payload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        const message =
          payload && typeof payload === 'object' && 'error' in payload
            ? String((payload as { error?: unknown }).error)
            : 'Failed to load wishlist.';
        throw new Error(message);
      }

      const items = Array.isArray(payload)
        ? payload
            .map(normalizeEntry)
            .filter((item): item is WishlistEntry => Boolean(item))
        : [];
      if (get().activeUserId !== userId) return;
      set({
        items,
        productIds: indexEntries(items),
        loading: false,
        loaded: true,
        error: null,
      });
    } catch (error) {
      if (get().activeUserId !== userId) return;
      set({
        loading: false,
        loaded: true,
        error:
          error instanceof Error ? error.message : 'Failed to load wishlist.',
      });
    }
  },

  toggle: async (userId, product) => {
    if (!userId) return 'auth-required';
    if (get().pendingProductIds[product.id]) return 'unchanged';
    if (get().activeUserId !== userId || !get().loaded) {
      await get().hydrate(userId);
    }

    const beforeItems = get().items;
    const existing = beforeItems.find((item) => item.productId === product.id);
    const optimisticItems = existing
      ? beforeItems.filter((item) => item.productId !== product.id)
      : [
          {
            id: `optimistic:${product.id}`,
            productId: product.id,
            createdAt: new Date().toISOString(),
            product,
          },
          ...beforeItems,
        ];

    set((state) => ({
      items: optimisticItems,
      productIds: indexEntries(optimisticItems),
      pendingProductIds: updatePending(
        state.pendingProductIds,
        product.id,
        true,
      ),
      error: null,
    }));

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', productId: product.id }),
      });
      const payload = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (!response.ok) {
        throw new Error(
          typeof payload.error === 'string'
            ? payload.error
            : 'Failed to update wishlist.',
        );
      }

      if (payload.removed === true || existing) {
        const items = get().items.filter(
          (item) => item.productId !== product.id,
        );
        set({ items, productIds: indexEntries(items) });
        return 'removed';
      }

      const createdId =
        typeof payload.id === 'string' ? payload.id : `wishlist:${product.id}`;
      const items = get().items.map((item) =>
        item.productId === product.id ? { ...item, id: createdId } : item,
      );
      set({ items, productIds: indexEntries(items) });
      return 'added';
    } catch (error) {
      if (get().activeUserId === userId) {
        set({
          items: beforeItems,
          productIds: indexEntries(beforeItems),
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update wishlist.',
        });
      }
      return 'unchanged';
    } finally {
      set((state) => ({
        pendingProductIds: updatePending(
          state.pendingProductIds,
          product.id,
          false,
        ),
      }));
    }
  },

  remove: async (userId, itemId, productId) => {
    if (!userId || get().pendingProductIds[productId]) return false;
    const beforeItems = get().items;
    const items = beforeItems.filter((item) => item.id !== itemId);
    set((state) => ({
      items,
      productIds: indexEntries(items),
      pendingProductIds: updatePending(
        state.pendingProductIds,
        productId,
        true,
      ),
      error: null,
    }));

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', itemId }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error || 'Failed to remove wishlist item.');
      }
      return true;
    } catch (error) {
      if (get().activeUserId === userId) {
        set({
          items: beforeItems,
          productIds: indexEntries(beforeItems),
          error:
            error instanceof Error
              ? error.message
              : 'Failed to remove wishlist item.',
        });
      }
      return false;
    } finally {
      set((state) => ({
        pendingProductIds: updatePending(
          state.pendingProductIds,
          productId,
          false,
        ),
      }));
    }
  },

  removeAll: async (userId) => {
    if (!userId) return false;
    const entries = [...get().items];
    if (entries.length === 0) return true;
    const results = await Promise.all(
      entries.map((item) => get().remove(userId, item.id, item.productId)),
    );
    return results.every(Boolean);
  },
}));
