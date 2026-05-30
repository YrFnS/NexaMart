'use client';

import { useParams } from 'next/navigation';
import { ProductDetailPage } from '@/components/buyer/product-detail-page';

export default function ProductRoute() {
  const params = useParams();
  const id = params.id as string;

  return <ProductDetailPage productId={id} />;
}
