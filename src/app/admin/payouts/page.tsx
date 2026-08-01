'use client';

import { Banknote, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

export default function AdminPayoutsRoute() {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  return (
    <div className="p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card>
        <CardContent className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Banknote className="size-8" />
          </div>
          <h1 className="text-2xl font-bold">
            {isRTL ? 'معالجة الدفعات معطلة' : 'Payout processing is disabled'}
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            {isRTL
              ? 'هذا الإصدار لا يستلم أموال العملاء ولا يحوّل أرباحاً للبائعين. الطلبات هي دفع عند الاستلام مباشرة للبائع.'
              : 'This release does not collect customer funds or transfer seller earnings. Orders are paid directly to sellers on delivery.'}
          </p>
          <Button asChild className="mt-6 bg-amber-600 text-white hover:bg-amber-700">
            <Link href="/admin/orders">
              <ShoppingCart className="me-2 size-4" />
              {isRTL ? 'إدارة الطلبات' : 'Manage orders'}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
