'use client';

import Link from 'next/link';
import { BellOff, Bookmark, Search, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

export function SavedSearchesPage() {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';

  return (
    <main
      className="container mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-10"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Card className="w-full overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-amber-700 via-amber-500 to-orange-500" />
        <CardContent className="flex flex-col items-center px-6 py-12 text-center md:px-10">
          <span className="flex size-20 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <Bookmark className="size-9" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold">
            {isRTL ? 'عمليات البحث المحفوظة غير متاحة بعد' : 'Saved searches are not available yet'}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {isRTL
              ? 'لا يحفظ NexaMart عمليات البحث أو ينشئ تنبيهات نتائج في هذا الإصدار. أزلنا عناصر التحكم المؤقتة حتى لا تبدو كأنها تحفظ شيئاً ثم تختفي بعد التحديث.'
              : 'NexaMart does not persist searches or create result alerts in this release. The temporary controls were removed so the interface does not claim that a search was saved when it would disappear after refresh.'}
          </p>

          <div className="mt-6 grid w-full gap-3 text-start sm:grid-cols-2">
            <div className="rounded-xl border bg-muted/30 p-4">
              <Search className="size-5 text-amber-600" aria-hidden="true" />
              <h2 className="mt-2 font-semibold">
                {isRTL ? 'ابحث الآن' : 'Search now'}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {isRTL
                  ? 'استخدم البحث الحالي للوصول إلى المنتجات والمتاجر النشطة.'
                  : 'Use the current search to find active products and stores.'}
              </p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <BellOff className="size-5 text-amber-600" aria-hidden="true" />
              <h2 className="mt-2 font-semibold">
                {isRTL ? 'لا توجد تنبيهات وهمية' : 'No simulated alerts'}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {isRTL
                  ? 'لن يعرض التطبيق عدادات نتائج جديدة أو مفاتيح إشعار غير متصلة بخدمة فعلية.'
                  : 'The app will not show new-result counters or notification switches without a real service behind them.'}
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild className="bg-amber-600 text-white hover:bg-amber-700">
              <Link href="/search">
                <Search className="me-2 size-4" aria-hidden="true" />
                {isRTL ? 'فتح البحث' : 'Open search'}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/shop">
                <ShoppingBag className="me-2 size-4" aria-hidden="true" />
                {isRTL ? 'تصفح المنتجات' : 'Browse products'}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
