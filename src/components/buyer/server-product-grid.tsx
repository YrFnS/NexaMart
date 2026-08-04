'use client';

import { useCallback, useState } from 'react';
import {
  ProductCard,
  type Product,
} from '@/components/buyer/product-card';
import { ProductQuickView } from '@/components/buyer/product-quick-view';
import type { StorefrontProduct } from '@/lib/storefront-types';

export function ServerProductGrid({
  products,
}: {
  products: StorefrontProduct[];
}) {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const openQuickView = useCallback((product: Product) => {
    setQuickViewProduct(product);
    setQuickViewOpen(true);
  }, []);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            onQuickView={openQuickView}
            preload={index < 2}
          />
        ))}
      </div>
      <ProductQuickView
        product={quickViewProduct}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  );
}
