'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  DollarSign,
  Search,
  PenTool,
  Zap,
  TrendingUp,
  Tag,
  FileText,
  Share2,
  Mail,
  Loader2,
  Copy,
  Check,
  ArrowRight,
  BarChart3,
  Target,
  Globe,
  ShoppingCart,
  Package,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/lib/i18n';
import { useUserStore } from '@/stores/user-store';

type AITool = 'auto-list' | 'smart-pricing' | 'seo-optimizer' | 'content-generator';

const aiTools: {
  id: AITool;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  icon: React.ElementType;
  credits: number;
  gradient: string;
}[] = [
  {
    id: 'auto-list',
    titleEn: 'Auto-List from Image',
    titleAr: 'إدراج تلقائي من الصورة',
    descEn: 'Upload a product image and AI generates title, description, category, price, and tags',
    descAr: 'ارفع صورة المنتج والذكاء الاصطناعي ينشئ العنوان والوصف والفئة والسعر والوسوم',
    icon: Camera,
    credits: 5,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'smart-pricing',
    titleEn: 'Smart Pricing',
    titleAr: 'التسعير الذكي',
    descEn: 'AI suggests optimal price based on market analysis and competitor comparison',
    descAr: 'الذكاء الاصطناعي يقترح السعر الأمثل بناءً على تحليل السوق ومقارنة المنافسين',
    icon: DollarSign,
    credits: 3,
    gradient: 'from-teal-500 to-cyan-600',
  },
  {
    id: 'seo-optimizer',
    titleEn: 'SEO Optimizer',
    titleAr: 'محسّن محركات البحث',
    descEn: 'Generate meta title, description, keywords, and URL slug for better search ranking',
    descAr: 'إنشاء عنوان التعريف والوصف والكلمات المفتاحية ورابط URL لتحسين ترتيب البحث',
    icon: Search,
    credits: 2,
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'content-generator',
    titleEn: 'Content Generator',
    titleAr: 'مولّد المحتوى',
    descEn: 'Generate marketing copy, social media posts, and email templates for your products',
    descAr: 'إنشاء نسخ تسويقية ومنشورات وسائل التواصل الاجتماعي وقوالب البريد الإلكتروني لمنتجاتك',
    icon: PenTool,
    credits: 4,
    gradient: 'from-emerald-600 to-green-700',
  },
];

interface AutoListResult {
  title: string;
  description: string;
  category: string;
  suggestedPrice: string;
  tags: string[];
}

interface SmartPricingResult {
  optimalPrice: string;
  minPrice: string;
  maxPrice: string;
  avgMarketPrice: string;
  competitors: { name: string; price: string; rating: number }[];
  recommendation: string;
}

interface SeoResult {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  urlSlug: string;
  seoScore: number;
}

interface ContentResult {
  marketingCopy: string;
  socialPost: string;
  emailSubject: string;
  emailBody: string;
}

/* Mock AI Results removed — generate from API or show CTA */

function CopyBtn({ text, field, copiedField, onCopy }: { text: string; field: string; copiedField: string | null; onCopy: (text: string, field: string) => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={() => onCopy(text, field)}
    >
      {copiedField === field ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}



export function SellerAITools() {
  const { t, dir } = useI18n();
  const { user } = useUserStore();
  const isRTL = dir() === 'rtl';

  const [activeTool, setActiveTool] = useState<AITool | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  /* AI Credits tracking */
  const totalCredits = user?.aiCredits || 150;
  const [usedCredits, setUsedCredits] = useState(23);
  const remainingCredits = totalCredits - usedCredits;

  /* Auto-List state */
  const [imageUploaded, setImageUploaded] = useState(false);
  const [autoListResult, setAutoListResult] = useState<AutoListResult | null>(null);

  /* Smart Pricing state */
  const [pricingProductName, setPricingProductName] = useState('');
  const [pricingCategory, setPricingCategory] = useState('');
  const [pricingCost, setPricingCost] = useState('');
  const [smartPricingResult, setSmartPricingResult] = useState<SmartPricingResult | null>(null);

  /* SEO state */
  const [seoProductName, setSeoProductName] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoCategory, setSeoCategory] = useState('');
  const [seoResult, setSeoResult] = useState<SeoResult | null>(null);

  /* Content state */
  const [contentCategory, setContentCategory] = useState('');
  const [contentProductName, setContentProductName] = useState('');
  const [contentResult, setContentResult] = useState<ContentResult | null>(null);

  const simulateAI = (callback: () => void, creditsCost: number) => {
    setIsGenerating(true);
    setTimeout(() => {
      callback();
      setUsedCredits(prev => prev + creditsCost);
      setIsGenerating(false);
    }, 2000);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (activeTool) {
    const tool = aiTools.find(aiTool => aiTool.id === activeTool)!;
    const Icon = tool.icon;

    return (
      <div className="p-4 md:p-6 space-y-6">
        {/* Back button */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveTool(null);
              setAutoListResult(null);
              setSmartPricingResult(null);
              setSeoResult(null);
              setContentResult(null);
            }}
            className="gap-1 text-muted-foreground"
          >
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 rotate-180" />}
            {t('s_back')}
          </Button>
        </div>

        {/* Tool Header */}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.gradient} text-white shadow-lg`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{isRTL ? tool.titleAr : tool.titleEn}</h2>
            <p className="text-sm text-muted-foreground">{isRTL ? tool.descAr : tool.descEn}</p>
          </div>
          <Badge className="ms-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            <Zap className="h-3 w-3 me-1" />
            {tool.credits} {t('s_credits')}
          </Badge>
        </div>

        {/* Tool Content */}
        {activeTool === 'auto-list' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-emerald-200 dark:border-emerald-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('s_uploadProductImage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <button
                  onClick={() => setImageUploaded(true)}
                  className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    imageUploaded
                      ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-border hover:border-emerald-400 dark:hover:border-emerald-600'
                  }`}
                >
                  {imageUploaded ? (
                    <div className="space-y-2">
                      <div className="h-32 w-full rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
                        <Package className="h-12 w-12 text-emerald-400" />
                      </div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {t('s_imageUploaded')}
                      </p>
                    </div>
                  ) : (
                    <>
                      <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">{t('s_clickUploadProductImage')}</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </button>
                <Button
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!imageUploaded || isGenerating}
                  onClick={() => simulateAI(() => setAutoListResult({ title: '', description: '', category: '', suggestedPrice: '', tags: [] }), 5)}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      {t('s_analyzing')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 me-2" />
                      {t('s_analyzeWithAI')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {autoListResult && (
              <Card className="border-emerald-200 dark:border-emerald-800/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    {t('s_aiResult')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground">{t('s_title')}</Label>
                      <CopyBtn copiedField={copiedField} onCopy={copyToClipboard} text={autoListResult.title} field="title" />
                    </div>
                    <p className="text-sm bg-muted/50 rounded-lg p-3">{autoListResult.title}</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground">{t('description')}</Label>
                      <CopyBtn copiedField={copiedField} onCopy={copyToClipboard} text={autoListResult.description} field="desc" />
                    </div>
                    <p className="text-xs bg-muted/50 rounded-lg p-3 leading-relaxed">{autoListResult.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">{t('s_category')}</Label>
                      <p className="text-sm bg-muted/50 rounded-lg p-2">{autoListResult.category}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">{t('s_suggestedPrice')}</Label>
                      <p className="text-sm bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2 font-bold text-emerald-600 dark:text-emerald-400">{autoListResult.suggestedPrice}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{t('s_tags')}</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {autoListResult.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                          <Tag className="h-3 w-3 me-1" />{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2">
                    {t('s_useThisListing')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTool === 'smart-pricing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-emerald-200 dark:border-emerald-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('s_productDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">{t('s_productName')}</Label>
                  <Input
                    value={pricingProductName}
                    onChange={(e) => setPricingProductName(e.target.value)}
                    placeholder={t('s_productNamePh')}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{t('s_category')}</Label>
                  <Select value={pricingCategory} onValueChange={setPricingCategory}>
                    <SelectTrigger className="h-10"><SelectValue placeholder={t('s_selectCategory')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">{t('s_electronics')}</SelectItem>
                      <SelectItem value="fashion">{t('s_fashion')}</SelectItem>
                      <SelectItem value="home">{t('s_homeGarden')}</SelectItem>
                      <SelectItem value="beauty">{t('s_beauty')}</SelectItem>
                      <SelectItem value="sports">{t('s_sports')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{t('s_productCost')}</Label>
                  <Input
                    type="number"
                    value={pricingCost}
                    onChange={(e) => setPricingCost(e.target.value)}
                    placeholder={t('s_productCostPh')}
                    className="h-10"
                  />
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!pricingProductName || isGenerating}
                  onClick={() => simulateAI(() => setSmartPricingResult({ optimalPrice: '', minPrice: '', maxPrice: '', avgMarketPrice: '', competitors: [], recommendation: '' }), 3)}
                >
                  {isGenerating ? (
                    <><Loader2 className="h-4 w-4 me-2 animate-spin" />{t('s_analyzing')}</>
                  ) : (
                    <><TrendingUp className="h-4 w-4 me-2" />{t('s_analyzeMarket')}</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {smartPricingResult && (
              <Card className="border-emerald-200 dark:border-emerald-800/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    {t('s_pricingAnalysis')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-[11px] text-muted-foreground">{t('s_optimalPrice')}</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{smartPricingResult.optimalPrice}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[11px] text-muted-foreground">{t('s_marketAverage')}</p>
                      <p className="text-xl font-bold">{smartPricingResult.avgMarketPrice}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-[10px] text-muted-foreground">{t('s_minPrice')}</p>
                      <p className="text-sm font-semibold">{smartPricingResult.minPrice}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-[10px] text-muted-foreground">{t('s_maxPrice')}</p>
                      <p className="text-sm font-semibold">{smartPricingResult.maxPrice}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium">{t('s_competitorComparison')}</p>
                    {smartPricingResult.competitors.map((comp, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-xs font-medium">{comp.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">★ {comp.rating}</span>
                          <span className="text-xs font-semibold">{comp.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-xs leading-relaxed">{smartPricingResult.recommendation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTool === 'seo-optimizer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-emerald-200 dark:border-emerald-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('s_productDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">{t('s_productName')}</Label>
                  <Input
                    value={seoProductName}
                    onChange={(e) => setSeoProductName(e.target.value)}
                    placeholder={t('s_productName')}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{t('s_currentDescription')}</Label>
                  <Textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder={t('s_currentDescPh')}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{t('s_category')}</Label>
                  <Select value={seoCategory} onValueChange={setSeoCategory}>
                    <SelectTrigger className="h-10"><SelectValue placeholder={t('s_selectCategory')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">{t('s_electronics')}</SelectItem>
                      <SelectItem value="fashion">{t('s_fashion')}</SelectItem>
                      <SelectItem value="home">{t('s_homeGarden')}</SelectItem>
                      <SelectItem value="beauty">{t('s_beauty')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!seoProductName || isGenerating}
                  onClick={() => simulateAI(() => setSeoResult({ metaTitle: '', metaDescription: '', keywords: [], urlSlug: '', seoScore: 0 }), 2)}
                >
                  {isGenerating ? (
                    <><Loader2 className="h-4 w-4 me-2 animate-spin" />{t('s_optimizing')}</>
                  ) : (
                    <><Search className="h-4 w-4 me-2" />{t('s_optimizeSEO')}</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {seoResult && (
              <Card className="border-emerald-200 dark:border-emerald-800/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-emerald-500" />
                      {t('s_seoOptimization')}
                    </span>
                    <Badge className={`text-xs ${seoResult.seoScore >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-amber-100 text-amber-700'}`}>
                      {t('s_score')}: {seoResult.seoScore}/100
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Progress value={seoResult.seoScore} className="h-2 mb-4" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground">{t('s_metaTitle')}</Label>
                      <CopyBtn copiedField={copiedField} onCopy={copyToClipboard} text={seoResult.metaTitle} field="metaTitle" />
                    </div>
                    <p className="text-sm bg-muted/50 rounded-lg p-2.5">{seoResult.metaTitle}</p>
                    <p className="text-[10px] text-muted-foreground">{seoResult.metaTitle.length}/60 {t('s_characters')}</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground">{t('s_metaDescription')}</Label>
                      <CopyBtn copiedField={copiedField} onCopy={copyToClipboard} text={seoResult.metaDescription} field="metaDesc" />
                    </div>
                    <p className="text-xs bg-muted/50 rounded-lg p-2.5 leading-relaxed">{seoResult.metaDescription}</p>
                    <p className="text-[10px] text-muted-foreground">{seoResult.metaDescription.length}/160 {t('s_characters')}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{t('s_urlSlug')}</Label>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2.5">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-mono">{seoResult.urlSlug}</span>
                      <CopyBtn copiedField={copiedField} onCopy={copyToClipboard} text={seoResult.urlSlug} field="slug" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{t('s_keywords')}</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {seoResult.keywords.map(kw => (
                        <Badge key={kw} variant="secondary" className="text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTool === 'content-generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-emerald-200 dark:border-emerald-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('s_productDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">{t('s_productName')}</Label>
                  <Input
                    value={contentProductName}
                    onChange={(e) => setContentProductName(e.target.value)}
                    placeholder={t('s_productName')}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{t('s_category')}</Label>
                  <Select value={contentCategory} onValueChange={setContentCategory}>
                    <SelectTrigger className="h-10"><SelectValue placeholder={t('s_selectCategory')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">{t('s_electronics')}</SelectItem>
                      <SelectItem value="fashion">{t('s_fashion')}</SelectItem>
                      <SelectItem value="home">{t('s_homeGarden')}</SelectItem>
                      <SelectItem value="beauty">{t('s_beauty')}</SelectItem>
                      <SelectItem value="sports">{t('s_sports')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!contentProductName || isGenerating}
                  onClick={() => simulateAI(() => setContentResult({ marketingCopy: '', socialPost: '', emailSubject: '', emailBody: '' }), 4)}
                >
                  {isGenerating ? (
                    <><Loader2 className="h-4 w-4 me-2 animate-spin" />{t('s_generating')}</>
                  ) : (
                    <><PenTool className="h-4 w-4 me-2" />{t('s_generateContent')}</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {contentResult && (
              <Card className="border-emerald-200 dark:border-emerald-800/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-emerald-500" />
                    {t('s_generatedContent')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="marketing">
                    <TabsList className="w-full grid grid-cols-4 h-9">
                      <TabsTrigger value="marketing" className="text-xs">
                        <FileText className="h-3 w-3 me-1 hidden sm:inline" />
                        {t('s_marketing')}
                      </TabsTrigger>
                      <TabsTrigger value="social" className="text-xs">
                        <Share2 className="h-3 w-3 me-1 hidden sm:inline" />
                        {t('s_social')}
                      </TabsTrigger>
                      <TabsTrigger value="email" className="text-xs">
                        <Mail className="h-3 w-3 me-1 hidden sm:inline" />
                        {t('s_email')}
                      </TabsTrigger>
                      <TabsTrigger value="all" className="text-xs">
                        {t('s_all')}
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="marketing" className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-muted-foreground">{t('s_marketingCopy')}</Label>
                        <CopyBtn copiedField={copiedField} onCopy={copyToClipboard} text={contentResult.marketingCopy} field="marketing" />
                      </div>
                      <pre className="text-xs bg-muted/50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">{contentResult.marketingCopy}</pre>
                    </TabsContent>
                    <TabsContent value="social" className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-muted-foreground">{t('s_socialMediaPost')}</Label>
                        <CopyBtn copiedField={copiedField} onCopy={copyToClipboard} text={contentResult.socialPost} field="social" />
                      </div>
                      <pre className="text-xs bg-muted/50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">{contentResult.socialPost}</pre>
                    </TabsContent>
                    <TabsContent value="email" className="mt-3 space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground">{t('s_emailSubject')}</Label>
                          <CopyBtn copiedField={copiedField} onCopy={copyToClipboard} text={contentResult.emailSubject} field="emailSubject" />
                        </div>
                        <p className="text-sm bg-muted/50 rounded-lg p-2.5 font-medium">{contentResult.emailSubject}</p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground">{t('s_emailBody')}</Label>
                          <CopyBtn copiedField={copiedField} onCopy={copyToClipboard} text={contentResult.emailBody} field="emailBody" />
                        </div>
                        <pre className="text-xs bg-muted/50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">{contentResult.emailBody}</pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="all" className="mt-3 space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3" /> {t('s_marketingCopyShort')}</Label>
                          <CopyBtn copiedField={copiedField} onCopy={copyToClipboard} text={contentResult.marketingCopy} field="marketing2" />
                        </div>
                        <pre className="text-[11px] bg-muted/50 rounded-lg p-2.5 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">{contentResult.marketingCopy}</pre>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Share2 className="h-3 w-3" /> {t('s_socialPost')}</Label>
                          <CopyBtn copiedField={copiedField} onCopy={copyToClipboard} text={contentResult.socialPost} field="social2" />
                        </div>
                        <pre className="text-[11px] bg-muted/50 rounded-lg p-2.5 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">{contentResult.socialPost}</pre>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {t('s_emailTemplate')}</Label>
                          <CopyBtn copiedField={copiedField} onCopy={copyToClipboard} text={contentResult.emailBody} field="emailBody2" />
                        </div>
                        <pre className="text-[11px] bg-muted/50 rounded-lg p-2.5 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">{contentResult.emailSubject}{'\n\n'}{contentResult.emailBody}</pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── Tool Selection View ── */
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{t('s_aiTools')}</h2>
          <p className="text-sm text-muted-foreground">{t('s_superchargeStore')}</p>
        </div>
      </div>

      {/* AI Credits Card */}
      <Card className="border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium">{t('s_aiCreditsLabel')}</span>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              {remainingCredits} {t('s_remaining')}
            </Badge>
          </div>
          <Progress value={(remainingCredits / totalCredits) * 100} className="h-2 mb-2" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{usedCredits} / {totalCredits} {t('s_used')}</span>
            <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <Zap className="h-3 w-3 me-1" />
              {t('s_buyMore')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tool Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {aiTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card
              key={tool.id}
              className="group cursor-pointer hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 overflow-hidden"
              onClick={() => setActiveTool(tool.id)}
            >
              <CardContent className="p-0">
                {/* Gradient top bar */}
                <div className={`h-2 bg-gradient-to-r ${tool.gradient}`} />
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.gradient} text-white shadow-md group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold">{isRTL ? tool.titleAr : tool.titleEn}</h3>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          <Zap className="h-2.5 w-2.5 me-0.5" />
                          {tool.credits}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {isRTL ? tool.descAr : tool.descEn}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end">
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                      onClick={(e) => { e.stopPropagation(); setActiveTool(tool.id); }}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {t('tryNow')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Package, labelEn: 'Products Listed', labelAr: 'منتجات مدرجة', value: '24', color: 'text-emerald-600 dark:text-emerald-400' },
          { icon: Eye, labelEn: 'SEO Optimized', labelAr: 'محسن SEO', value: '18', color: 'text-teal-600 dark:text-teal-400' },
          { icon: BarChart3, labelEn: 'Prices Analyzed', labelAr: 'أسعار محللة', value: '32', color: 'text-cyan-600 dark:text-cyan-400' },
          { icon: FileText, labelEn: 'Content Generated', labelAr: 'محتوى منشأ', value: '15', color: 'text-amber-600 dark:text-amber-400' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{isRTL ? stat.labelAr : stat.labelEn}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
