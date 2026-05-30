'use client';

import { Suspense } from 'react';
import { ShopPage } from '@/components/buyer/shop-page';

export default function ShopRoute() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>}>
      <ShopPage />
    </Suspense>
  );
}
