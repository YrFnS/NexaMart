'use client';

import { FulfillmentOperations } from '@/components/seller/fulfillment-operations';
import { OrderManagement } from '@/components/seller/order-management';

export default function SellerOrdersRoute() {
  return (
    <>
      <OrderManagement />
      <FulfillmentOperations />
    </>
  );
}
