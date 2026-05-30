'use client';

import React from 'react';
import {
  Shield,
  MapPin,
  CreditCard,
  BadgeCheck,
  MessageCircle,
  Star,
  AlertTriangle,
  KeyRound,
  Flag,
  Lock,
  Eye,
  Phone,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';

const safetyTips = [
  {
    icon: MapPin,
    titleKey: 'meetInPublic',
    descEn: 'Always meet in a public, well-lit place when buying or selling in person. Coffee shops and shopping malls are ideal.',
    descAr: 'التقِ دائماً في مكان عام ومضاء جيداً عند الشراء أو البيع شخصياً. المقاهي ومراكز التسوق مثالية.',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
  },
  {
    icon: CreditCard,
    titleKey: 'dontShareBanking',
    descEn: 'Never share your banking details, PIN codes, or card numbers with anyone on the platform.',
    descAr: 'لا تشارك تفاصيلك البنكية أو رمز PIN أو أرقام بطاقتك مع أي شخص على المنصة.',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950',
  },
  {
    icon: BadgeCheck,
    titleKey: 'verifySeller',
    descEn: 'Always check the seller\'s verification badge, ratings, and reviews before making a purchase.',
    descAr: 'تحقق دائماً من شارة توثيق البائع وتقييماته ومراجعاته قبل الشراء.',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    icon: MessageCircle,
    titleKey: 'usePlatformChat',
    descEn: 'Keep all communications within NexaMart\'s chat. Avoid moving to external messaging apps.',
    descAr: 'ابقَ داخل محادثة نيكسا مارت. تجنب الانتقال لتطبيقات مراسنة خارجية.',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-950',
  },
  {
    icon: Star,
    titleKey: 'checkReviews',
    descEn: 'Read product and seller reviews carefully. Look for verified purchase reviews for the most reliable feedback.',
    descAr: 'اقرأ تقييمات المنتج والبائع بعناية. ابحث عن تقييمات الشراء الموثقة للحصول على أرخص ملاحظات.',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950',
  },
  {
    icon: AlertTriangle,
    titleKey: 'bewareTooGood',
    descEn: 'If a deal seems too good to be true, it probably is. Be wary of prices significantly below market value.',
    descAr: 'إذا بدا العرض جيداً أكثر من اللازم، فهو غالباً كذلك. احذر من الأسعار المنخفضة بشكل كبير عن السوق.',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950',
  },
  {
    icon: KeyRound,
    titleKey: 'neverShareOTP',
    descEn: 'Never share one-time passwords (OTP) or verification codes with anyone, even if they claim to be from NexaMart.',
    descAr: 'لا تشارك كلمات المرور لمرة واحدة (OTP) أو رموز التحقق مع أي شخص، حتى لو ادعوا أنهم من نيكسا مارت.',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950',
  },
  {
    icon: Flag,
    titleKey: 'reportSuspicious',
    descEn: 'Report any suspicious activity, scam attempts, or fraud immediately using the Report button on listings.',
    descAr: 'أبلغ عن أي نشاط مشبوه أو محاولات احتيال فوراً باستخدام زر الإبلاغ على الإعلانات.',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950',
  },
];

const commonScams = [
  {
    titleEn: 'Phishing Messages',
    titleAr: 'رسائل تصيد',
    descEn: 'Fake messages claiming your account will be suspended. NexaMart will never ask for your password via message.',
    descAr: 'رسائل مزيفة تدّعي أن حسابك سيُعلّق. نيكسا مارت لن تطلب كلمة مرورك عبر الرسائل.',
  },
  {
    titleEn: 'Advance Fee Fraud',
    titleAr: 'احتيال الدفع المسبق',
    descEn: 'Sellers asking for upfront payment outside the platform. Always pay through NexaMart\'s secure checkout.',
    descAr: 'بائعون يطلبون الدفع مقدماً خارج المنصة. ادفع دائماً عبر نظام الدفع الآمن لنيكسا مارت.',
  },
  {
    titleEn: 'Counterfeit Products',
    titleAr: 'منتجات مقلدة',
    descEn: 'Listings selling fake brand-name products at suspiciously low prices. Check for verified seller badges.',
    descAr: 'إعلانات تبيع منتجات مقلدة بأسماء علامات تجارية بأسعار مشبوهة. تحقق من شارات البائع الموثق.',
  },
  {
    titleEn: 'Overpayment Scam',
    titleAr: 'احتيال الدفع الزائد',
    descEn: 'Buyers sending more money than asked and requesting a refund for the difference. This is always a scam.',
    descAr: 'مشترون يرسلون مبلغاً أكبر من المطلوب ويطلبون استرداد الفرق. هذا دائماً احتيال.',
  },
  {
    titleEn: 'Identity Theft',
    titleAr: 'سرقة الهوية',
    descEn: 'Requests for personal documents like ID copies or utility bills. Never share these through chat.',
    descAr: 'طلبات مستندات شخصية كنسخ الهوية أو فواتير الخدمات. لا تشاركها أبداً عبر المحادثة.',
  },
];

const protectionFeatures = [
  {
    icon: Wallet,
    titleKey: 'escrowPayments',
    descEn: 'Your payment is held securely until you confirm delivery of your order.',
    descAr: 'يُحفظ دفعك بأمان حتى تأكيد استلام طلبك.',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950',
  },
  {
    icon: BadgeCheck,
    titleKey: 'verifiedSellers',
    descEn: 'All sellers go through a verification process to ensure they are legitimate businesses.',
    descAr: 'جميع البائعين يمرون بعملية توثيق لضمان أنهم أعمال تجارية شرعية.',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950',
  },
  {
    icon: ShieldCheck,
    titleKey: 'buyerProtection',
    descEn: 'Full refund guaranteed if your order doesn\'t arrive or doesn\'t match the description.',
    descAr: 'استرداد كامل مضمون إذا لم يصل طلبك أو لم يطابق الوصف.',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950 dark:to-fuchsia-950',
  },
  {
    icon: Lock,
    titleKey: 'secureChat',
    descEn: 'End-to-end encrypted messaging ensures your conversations stay private and secure.',
    descAr: 'المراسلة المشفرة من طرف لطرف تضمن بقاء محادثاتك خاصة وآمنة.',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950',
  },
];

const emergencyContacts = [
  { country: 'Jordan', countryAr: 'الأردن', police: '911', antiFraud: '+962-6-560-4444' },
  { country: 'UAE', countryAr: 'الإمارات', police: '999', antiFraud: '+971-800-444-44' },
  { country: 'Saudi Arabia', countryAr: 'السعودية', police: '999', antiFraud: '+966-800-246-0000' },
  { country: 'Egypt', countryAr: 'مصر', police: '122', antiFraud: '+20-2-2794-2222' },
  { country: 'Iraq', countryAr: 'العراق', police: '130', antiFraud: '+964-770-444-0000' },
  { country: 'Kuwait', countryAr: 'الكويت', police: '112', antiFraud: '+965-2484-6666' },
];

export function SafetyTipsPage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        <div className="relative container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-6 shadow-lg">
              <Shield className="size-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('shopSafely')}
            </h1>
            <p className="text-emerald-100 text-lg max-w-xl mx-auto">
              {isRTL
                ? 'سلامتك هي أولويتنا. تعلم كيف تحمي نفسك أثناء التسوق والبيع على نيكسا مارت.'
                : 'Your safety is our priority. Learn how to protect yourself while shopping and selling on NexaMart.'}
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
              <Badge className="bg-white/20 text-white border-0 text-sm px-4 py-1.5">
                <Shield className="size-3.5 me-1.5" />
                {isRTL ? 'حماية المشتري' : 'Buyer Protection'}
              </Badge>
              <Badge className="bg-white/20 text-white border-0 text-sm px-4 py-1.5">
                <Lock className="size-3.5 me-1.5" />
                {isRTL ? 'دفع آمن' : 'Secure Payments'}
              </Badge>
              <Badge className="bg-white/20 text-white border-0 text-sm px-4 py-1.5">
                <Eye className="size-3.5 me-1.5" />
                {isRTL ? 'بائعون موثقون' : 'Verified Sellers'}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 space-y-12">
        {/* Safety Tips Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950">
              <Shield className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold">{t('safetyTips')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safetyTips.map((tip, idx) => {
              const Icon = tip.icon;
              return (
                <Card key={idx} className="group hover:shadow-md transition-all duration-200 border-border/50">
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <div className={`shrink-0 flex items-center justify-center size-11 rounded-xl ${tip.bg}`}>
                        <Icon className={`size-5 ${tip.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1.5">
                          {t(tip.titleKey)}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {isRTL ? tip.descAr : tip.descEn}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <Separator />

        {/* Common Scams Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center size-10 rounded-xl bg-amber-100 dark:bg-amber-950">
              <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold">{t('commonScams')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {commonScams.map((scam, idx) => (
              <Card key={idx} className="border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/20 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                    <h3 className="font-semibold text-sm text-red-700 dark:text-red-400">
                      {isRTL ? scam.titleAr : scam.titleEn}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isRTL ? scam.descAr : scam.descEn}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* How NexaMart Protects You Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center size-10 rounded-xl bg-teal-100 dark:bg-teal-950">
              <ShieldCheck className="size-5 text-teal-600 dark:text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold">{t('howWeProtect')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {protectionFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Card key={idx} className={`border-0 ${feat.bg} hover:shadow-md transition-shadow`}>
                  <CardContent className="p-5 text-center">
                    <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-white/50 dark:bg-black/20 mb-3">
                      <Icon className={`size-6 ${feat.color}`} />
                    </div>
                    <h3 className="font-semibold text-sm mb-2">{t(feat.titleKey)}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isRTL ? feat.descAr : feat.descEn}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <Separator />

        {/* Emergency Contacts Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center size-10 rounded-xl bg-red-100 dark:bg-red-950">
              <Phone className="size-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold">
              {isRTL ? 'أرقام الطوارئ' : 'Emergency Contacts'}
            </h2>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-start px-5 py-3 text-sm font-semibold">
                        {isRTL ? 'الدولة' : 'Country'}
                      </th>
                      <th className="text-start px-5 py-3 text-sm font-semibold">
                        {isRTL ? 'الشرطة' : 'Police'}
                      </th>
                      <th className="text-start px-5 py-3 text-sm font-semibold">
                        {isRTL ? 'خط مكافحة الاحتيال' : 'Anti-Fraud Hotline'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {emergencyContacts.map((contact, idx) => (
                      <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium">
                          {isRTL ? contact.countryAr : contact.country}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant="secondary" className="font-mono">
                            {contact.police}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-sm font-mono text-muted-foreground">
                          {contact.antiFraud}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center py-8">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-8">
              <Shield className="size-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">
                {isRTL ? 'هل واجهت نشاطاً مشبوهاً؟' : 'Encountered Suspicious Activity?'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                {isRTL
                  ? 'أبلغنا فوراً وسنتخذ الإجراءات اللازمة لحمايتك وحماية المجتمع.'
                  : 'Report it immediately and we\'ll take the necessary actions to protect you and the community.'}
              </p>
              <Button
                onClick={() => nav.setView('home')}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
              >
                {isRTL ? 'العودة للتسوق الآمن' : 'Back to Safe Shopping'}
                <ArrowIcon className="size-4 ms-1.5" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
