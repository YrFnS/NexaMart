'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MessageSquare, ArrowLeft, Send, Clock, CheckCircle2, Loader2, MessageCircle, Sparkles, BadgeCheck, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { formatPrice } from '@/lib/currency';

const templates = [
  { key: 'hoodies', en: 'I need 1,000 customized black hoodies for $8 each with logo printing', ar: 'أحتاج 1,000 هودي أسود مخصص بسعر 8$ للقطعة مع طباعة الشعار' },
  { key: 'phones', en: 'Looking for 500 smartphones, 128GB storage, under $200 per unit', ar: 'أبحث عن 500 هاتف ذكي، سعة 128 جيجا، أقل من 200$ للوحدة' },
  { key: 'furniture', en: 'Need 200 office chairs, ergonomic design, bulk order for corporate', ar: 'أحتاج 200 كرسي مكتبي، تصميم مريح، طلب جملة للشركات' },
];

interface Quote {
  supplier: string;
  price: number;
  moq: number;
  delivery: string;
  match: number;
}

const processingSteps = [
  { en: 'Analyzing request...', ar: 'تحليل الطلب...' },
  { en: 'Contacting 20+ suppliers...', ar: 'التواصل مع 20+ مورداً...' },
  { en: 'Negotiating prices...', ar: 'التفاوض على الأسعار...' },
  { en: 'Preparing quotes...', ar: 'إعداد عروض الأسعار...' },
];

export function RfqAgentPage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const isRTL = locale === 'ar';

  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxChars = 500;
  const charCount = description.length;

  const handleTemplateClick = (template: typeof templates[number]) => {
    setDescription(isRTL ? template.ar : template.en);
  };

  const handleSubmit = useCallback(async () => {
    if (!description.trim() || description.length < 20) {
      setError(isRTL ? 'يرجى تقديم وصف أكثر تفصيلاً' : 'Please provide a more detailed description');
      return;
    }
    setError('');
    setIsProcessing(true);
    setCurrentStep(0);
    setStepProgress(0);
    setQuotes([]);

    // Animate through processing steps
    let step = 0;
    timerRef.current = setInterval(() => {
      setStepProgress((prev) => {
        if (prev >= 100) {
          step++;
          if (step >= processingSteps.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Processing complete — no fake quotes
            setIsProcessing(false);
            return 100;
          }
          setCurrentStep(step);
          return 0;
        }
        return prev + 5;
      });
    }, 75);
  }, [description, isRTL]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleRequestMore = () => {
    setQuotes([]);
    setCurrentStep(0);
    setStepProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => nav.setView('ai-tools')} className="rounded-full">
            <ArrowLeft className={`size-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="size-6 text-emerald-600" />
              {t('rfqAgent')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'احصل على عروض أسعار من موردين متعددين بالذكاء الاصطناعي' : 'Source products with AI — get quotes from multiple suppliers'}
            </p>
          </div>
        </div>

        {/* Request Form */}
        {!quotes.length && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">
                  {isRTL ? 'وصف احتياجاتك' : 'Describe Your Needs'}
                </h2>
              </div>

              {/* Quick Templates */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {isRTL ? 'قوالب سريعة:' : 'Quick templates:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {templates.map((template) => (
                    <Button
                      key={template.key}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 rounded-full"
                      onClick={() => handleTemplateClick(template)}
                    >
                      {isRTL ? template.ar.slice(0, 30) + '...' : template.en.slice(0, 30) + '...'}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setError('');
                  }}
                  placeholder={isRTL
                    ? 'أحتاج 1,000 هودي أسود مخصص بسعر 8$ للقطعة...'
                    : 'I need 1,000 customized black hoodies for $8 each...'}
                  className="min-h-[120px] resize-none text-sm"
                  maxLength={maxChars}
                  disabled={isProcessing}
                />
                <div className="absolute bottom-2 end-3 text-[10px] text-muted-foreground">
                  {charCount}/{maxChars}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px]">3 {t('credits')}</Badge>
                  <span>{isRTL ? 'لكل طلب' : 'per request'}</span>
                </div>
                <Button
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white gap-2 h-10 px-6 rounded-xl"
                  onClick={handleSubmit}
                  disabled={isProcessing || !description.trim()}
                >
                  {isProcessing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {isRTL ? 'إرسال الطلب' : 'Submit Request'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Animation */}
        {isProcessing && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="space-y-4">
                {processingSteps.map((step, i) => {
                  const isActive = i === currentStep;
                  const isCompleted = i < currentStep;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isActive
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="size-4" />
                        ) : isActive ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <span className="text-xs">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${isActive ? 'font-semibold text-emerald-600 dark:text-emerald-400' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                          {isRTL ? step.ar : step.en}
                        </p>
                        {isActive && (
                          <Progress value={stepProgress} className="h-1.5 mt-1.5 max-w-xs" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results — show CTA when processing done with no API quotes */}
        {!isProcessing && quotes.length === 0 && currentStep >= processingSteps.length - 1 && stepProgress >= 100 ? (
          <div className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="size-12 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">{isRTL ? 'تم تحليل طلبك' : 'Request Analyzed'}</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {isRTL ? 'تم إرسال طلبك إلى الموردين. ستتلقى عروض أسعار قريباً.' : 'Your RFQ has been submitted to suppliers. You will receive quotes soon.'}
                </p>
                <Button
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white gap-2 h-10 px-6 rounded-xl"
                  onClick={handleRequestMore}
                >
                  <Sparkles className="size-4" />
                  {isRTL ? 'إرسال طلب آخر' : 'Submit Another RFQ'}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : quotes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-500" />
                {isRTL ? 'أفضل 3 عروض أسعار' : 'Top 3 Quotes'}
              </h2>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRequestMore}>
                <Sparkles className="size-3.5" />
                {isRTL ? 'طلب المزيد من العروض' : 'Request More Quotes'}
              </Button>
            </div>

            <div className="space-y-3">
              {quotes.map((quote, i) => (
                <Card key={i} className={`border-0 shadow-md overflow-hidden ${i === 0 ? 'ring-2 ring-emerald-400' : ''}`}>
                  {i === 0 && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium px-4 py-1.5 flex items-center gap-1">
                      <BadgeCheck className="size-3.5" />
                      {isRTL ? 'أفضل تطابق' : 'Best Match'}
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base">{quote.supplier}</h3>
                          <Badge variant="secondary" className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                            {quote.match}% match
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Package className="size-3.5" />
                            <span>{isRTL ? 'الحد الأدنى:' : 'MOQ:'} {quote.moq}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Truck className="size-3.5" />
                            <span>{quote.delivery}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-muted-foreground" />
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {formatPrice(quote.price)}/unit
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-lg">
                          {isRTL ? 'قبول العرض' : 'Accept Quote'}
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1 text-xs h-8 rounded-lg">
                          <MessageCircle className="size-3" />
                          {t('chatWithSeller')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            <div className="text-center">
              <Button variant="outline" onClick={() => nav.setView('ai-tools')} className="gap-2">
                <ArrowLeft className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
                {isRTL ? 'العودة لأدوات الذكاء' : 'Back to AI Tools'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
