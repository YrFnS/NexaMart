'use client';

import Link from 'next/link';
import { Banknote, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

export default function InstallmentsRoute() {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card>
        <CardContent className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Banknote className="size-8" />
          </div>
          <h1 className="text-2xl font-bold">
            {isRTL ? 'الأقساط غير متاحة في هذا الإصدار' : 'Installments are not available in this release'}
          </h1>
          <p className="mt-3 max-w-lg text-muted-foreground">
            {isRTL
              ? 'NexaMart لا يعالج المدفوعات أو الأقساط حالياً. يمكن إنشاء الطلب والدفع للبائع عند الاستلام.'
              : 'NexaMart does not process payments or installment plans at this stage. You can place an order and pay the seller on delivery.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild className="bg-amber-600 text-white hover:bg-amber-700">
              <Link href="/shop">
                <ShoppingBag className="me-2 size-4" />
                {isRTL ? 'تصفح المنتجات' : 'Browse products'}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/orders">{isRTL ? 'طلباتي' : 'My orders'}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
