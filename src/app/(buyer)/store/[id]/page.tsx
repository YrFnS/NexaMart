'use client';

import { useParams } from 'next/navigation';
import { StoreProfilePage } from '@/components/buyer/store-profile-page';

export default function StoreRoute() {
  const params = useParams();
  const id = params.id as string;

  return <StoreProfilePage storeId={id} />;
}
