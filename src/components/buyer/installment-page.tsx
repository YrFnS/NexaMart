'use client';

import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Calculator,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  Check,
  Star,
  ArrowRight,
  BadgePercent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';

const providers = [
  {
    id: 'tamara',
    nameEn: 'Tamara',
    nameAr: 'تمارا',
    color: 'from-rose-500 to-pink-600',
    plans: [3, 6, 12],
    icon: '💳',
    maxAmount: 5000,
  },
  {
    id: 'tabby',
    nameEn: 'Tabby',
    nameAr: 'تابي',
    color: 'from-violet-500 to-purple-600',
    plans: [3, 6, 12],
    icon: '🛍️',
    maxAmount: 10000,
  },
  {
    id: 'standard-chartered',
    nameEn: 'Standard Chartered',
    nameAr: 'ستاندرد تشارترد',
    color: 'from-blue-500 to-indigo-600',
    plans: [3, 6, 12, 24],
    icon: '🏦',
    maxAmount: 25000,
  },
];

const eligibleProducts = [
  { id: '1', nameEn: 'iPhone 15 Pro', nameAr: 'آيفون 15 برو', price: 1199, category: 'Electronics' },
  { id: '2', nameEn: 'Samsung Galaxy S24', nameAr: 'سامسونج جالكسي S24', price: 999, category: 'Electronics' },
  { id: '3', nameEn: 'MacBook Air M3', nameAr: 'ماك بوك اير M3', price: 1299, category: 'Electronics' },
  { id: '4', nameEn: 'Sony 65" 4K TV', nameAr: 'سوني 65 بوصة 4K', price: 1499, category: 'Electronics' },
  { id: '5', nameEn: 'Gaming Laptop RTX 4070', nameAr: 'لابتوب جيمنج RTX 4070', price: 1799, category: 'Electronics' },
  { id: '6', nameEn: 'Dyson V15 Vacuum', nameAr: 'دايسون V15', price: 749, category: 'Home' },
];

const faqItems = [
  {
    qEn: 'What is Buy Now, Pay Later?',
    qAr: 'ما هو اشتر الآن وادفع لاحقاً؟',
    aEn: 'Buy Now, Pay Later (BNPL) allows you to purchase items immediately and pay for them in equal installments over time, with no interest or hidden fees.',
    aAr: 'اشتر الآن وادفع لاحقاً يتيح لك شراء المنتجات فوراً والدفع على أقساط متساوية عبر فترة زمنية، بدون فوائد أو رسوم خفية.',
  },
  {
    qEn: 'Am I eligible for installment payments?',
    qAr: 'هل أنا مؤهل للدفع بالأقساط؟',
    aEn: 'Most customers with a valid ID and a debit/credit card are eligible. Approval is instant and based on a quick assessment.',
    aAr: 'معظم العملاء الذين يملكون هوية صالحة وبطاقة خصم/ائتمان مؤهلون. الموافقة فورية بناءً على تقييم سريع.',
  },
  {
    qEn: 'Are there any hidden fees?',
    qAr: 'هل هناك رسوم خفية؟',
    aEn: 'No! All installment plans are interest-free. You only pay the product price divided by the number of months. Late payment fees may apply.',
    aAr: 'لا! جميع خطط الأقساط بدون فوائد. تدفع فقط سعر المنتج مقسماً على عدد الأشهر. قد تطبق رسوم التأخر في السداد.',
  },
  {
    qEn: 'What happens if I miss a payment?',
    qAr: 'ماذا يحدث إذا فاتني قسط؟',
    aEn: 'If you miss a payment, a reminder will be sent. After a grace period, a late fee may be charged. Contact the provider for assistance.',
    aAr: 'إذا فاتك قسط، سيتم إرسال تذكير. بعد فترة سماح، قد يتم فرض رسوم تأخير. تواصل مع مقدم الخدمة للمساعدة.',
  },
  {
    qEn: 'Can I pay off my installments early?',
    qAr: 'هل يمكنني سداد الأقساط مبكراً؟',
    aEn: 'Yes! You can pay off your remaining balance at any time without any penalty or additional fees.',
    aAr: 'نعم! يمكنك سداد الرصيد المتبقي في أي وقت بدون أي غرامة أو رسوم إضافية.',
  },
];

export function InstallmentPage() {
  const { dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const nav = useAppNavigation();

  const [price, setPrice] = useState<string>('1000');
  const [selectedProvider, setSelectedProvider] = useState<string>('tamara');

  const numericPrice = parseFloat(price) || 0;

  const calculations = useMemo(() => {
    const provider = providers.find(p => p.id === selectedProvider);
    if (!provider || numericPrice <= 0) return [];

    return provider.plans.map(months => ({
      months,
      monthly: (numericPrice / months).toFixed(2),
      total: numericPrice.toFixed(2),
    }));
  }, [numericPrice, selectedProvider]);

  const handleShopProduct = (id: string) => {
    nav.selectProduct(id);
    nav.setView('product');
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="relative rounded-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 md:p-12">
            <div className="absolute top-0 end-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 start-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
            <div className="relative z-10">
              <Badge className="bg-white/20 text-white border-0 mb-4 hover:bg-white/30">
                <BadgePercent className="size-3 me-1" />
                {isRTL ? '0% فائدة' : '0% Interest'}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                {isRTL ? 'اشتر الآن، ادفع لاحقاً' : 'Buy Now, Pay Later'}
              </h1>
              <p className="text-emerald-100 text-lg max-w-2xl mb-6">
                {isRTL
                  ? 'قسّط مشترياتك على 3، 6، أو 12 شهر بدون فوائد مع شركائنا الموثوقين'
                  : 'Split your purchases into 3, 6, or 12 months with 0% interest from our trusted partners'}
              </p>
              <div className="flex flex-wrap gap-3">
                {providers.map(p => (
                  <div key={p.id} className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2">
                    <span className="text-lg">{p.icon}</span>
                    <span className="text-white text-sm font-medium">{isRTL ? p.nameAr : p.nameEn}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 mb-12">
          {/* EMI Calculator */}
          <div className="lg:col-span-3">
            <Card className="border-emerald-200 dark:border-emerald-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="size-5 text-emerald-500" />
                  {isRTL ? 'حاسبة الأقساط' : 'EMI Calculator'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isRTL ? 'سعر المنتج' : 'Product Price'} (USD)
                  </label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="50"
                    className="text-lg font-semibold h-12"
                    placeholder={isRTL ? 'أدخل السعر' : 'Enter price'}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">
                    {isRTL ? 'اختر مزود الخدمة' : 'Select Provider'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {providers.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProvider(p.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          selectedProvider === p.id
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50'
                            : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                        }`}
                      >
                        <span className="text-2xl">{p.icon}</span>
                        <div className="text-start">
                          <div className="font-medium text-sm">{isRTL ? p.nameAr : p.nameEn}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {isRTL ? `حتى ${p.maxAmount.toLocaleString()}$` : `Up to $${p.maxAmount.toLocaleString()}`}
                          </div>
                        </div>
                        {selectedProvider === p.id && (
                          <Check className="size-4 text-emerald-500 ms-auto shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {calculations.length > 0 && numericPrice > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      {isRTL ? 'خيارات الأقساط' : 'Installment Options'}
                    </h4>
                    {calculations.map(calc => (
                      <div
                        key={calc.months}
                        className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center size-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-sm">
                            {calc.months}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">
                              {isRTL ? `${calc.months} أقساط` : `${calc.months} months`}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {isRTL ? 'بدون فوائد' : '0% interest'}
                            </div>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            ${calc.monthly}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {isRTL ? '/ شهرياً' : '/ month'}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-center text-xs text-muted-foreground mt-2">
                      {isRTL ? `المبلغ الإجمالي: $${numericPrice.toFixed(2)}` : `Total amount: $${numericPrice.toFixed(2)}`}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* How it works + Quick info */}
          <div className="lg:col-span-2 space-y-6">
            {/* How it works */}
            <Card className="border-emerald-200 dark:border-emerald-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-5 text-emerald-500" />
                  {isRTL ? 'كيف تعمل؟' : 'How It Works'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      titleEn: 'Choose Your Product',
                      titleAr: 'اختر منتجك',
                      descEn: 'Browse and add items to your cart',
                      descAr: 'تصفح وأضف المنتجات لسلتك',
                    },
                    {
                      step: 2,
                      titleEn: 'Select Installments',
                      titleAr: 'اختر الأقساط',
                      descEn: 'Choose a BNPL provider and plan at checkout',
                      descAr: 'اختر مزود وخطة أقساط عند الدفع',
                    },
                    {
                      step: 3,
                      titleEn: 'Pay Over Time',
                      titleAr: 'ادفع بالتقسيط',
                      descEn: 'Enjoy your purchase and pay in easy installments',
                      descAr: 'استمتع بمشترياتك وادفع بأقساط مريحة',
                    },
                  ].map((step) => (
                    <div key={step.step} className="flex gap-3">
                      <div className="flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-sm shrink-0">
                        {step.step}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {isRTL ? step.titleAr : step.titleEn}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isRTL ? step.descAr : step.descEn}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="border-emerald-200 dark:border-emerald-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-500" />
                  {isRTL ? 'لماذا الأقساط؟' : 'Why Installments?'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { icon: '✅', textEn: '0% interest — No hidden fees', textAr: '0% فائدة — بدون رسوم خفية' },
                    { icon: '⚡', textEn: 'Instant approval — Shop now', textAr: 'موافقة فورية — تسوق الآن' },
                    { icon: '🔒', textEn: 'Secure payments protected', textAr: 'مدفوعات آمنة ومحمية' },
                    { icon: '📱', textEn: 'Manage via provider app', textAr: 'إدارة عبر تطبيق المزود' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-sm">{isRTL ? item.textAr : item.textEn}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Eligible Products */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Star className="size-6 text-emerald-500" />
              {isRTL ? 'منتجات مؤهلة للأقساط' : 'Eligible for Installments'}
            </h2>
            <Button variant="outline" size="sm" onClick={() => nav.setView('shop')}>
              {isRTL ? 'عرض الكل' : 'View All'}
              <ArrowRight className={`size-4 ${isRTL ? 'rotate-180' : ''} ms-1`} />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {eligibleProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-all hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer" onClick={() => handleShopProduct(product.id)}>
                <CardContent className="p-4">
                  <div className="aspect-video rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-3">
                    <CreditCard className="size-8 text-emerald-500/50" />
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-1">
                        {isRTL ? product.nameAr : product.nameEn}
                      </h3>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 shrink-0 text-[10px]">
                      {isRTL ? 'أقساط' : 'BNPL'}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      ${product.price}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isRTL ? `من $${(product.price / 3).toFixed(0)}/شهر` : `From $${(product.price / 3).toFixed(0)}/mo`}
                    </span>
                  </div>
                  <Button size="sm" className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
                    {isRTL ? 'تسوق بالأقساط' : 'Shop with Installments'}
                    <ChevronRight className={`size-4 ${isRTL ? 'rotate-180' : ''} ms-1`} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="border-emerald-200 dark:border-emerald-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="size-5 text-emerald-500" />
              {isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`}>
                  <AccordionTrigger className="text-sm text-start">
                    {isRTL ? item.qAr : item.qEn}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    {isRTL ? item.aAr : item.aEn}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
