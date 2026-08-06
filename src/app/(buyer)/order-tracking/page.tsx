import { OrderTrackingPage } from '@/components/buyer/order-tracking-page';

export default async function OrderTrackingRoute({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = await searchParams;
  return <OrderTrackingPage orderId={params.orderId} />;
}
