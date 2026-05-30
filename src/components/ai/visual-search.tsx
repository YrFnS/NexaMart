'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Camera, Upload, X, Search, RefreshCw, Sparkles, ArrowLeft, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { ProductCard, Product } from '@/components/buyer/product-card';

export function VisualSearchPage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const isRTL = locale === 'ar';

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [results, setResults] = useState<Product[]>([]);
  const [searchComplete, setSearchComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setResults([]);
      setSearchComplete(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSearch = useCallback(() => {
    if (!uploadedImage) return;
    setIsSearching(true);
    setSearchProgress(0);
    setSearchComplete(false);

    const interval = setInterval(() => {
      setSearchProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSearching(false);
          setSearchComplete(true);
          // No fake results — search complete, show CTA
          return 100;
        }
        return prev + 2;
      });
    }, 60);
  }, [uploadedImage]);

  const handleNewSearch = () => {
    setUploadedImage(null);
    setResults([]);
    setSearchProgress(0);
    setSearchComplete(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => nav.setView('ai-tools')} className="rounded-full">
            <ArrowLeft className={`size-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Camera className="size-6 text-violet-600" />
              {t('visualSearch')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'ابحث عن المنتجات باستخدام الصور' : 'Search by image to find similar products'}
            </p>
          </div>
        </div>

        {!results.length && !searchComplete ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Area */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : uploadedImage
                      ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-muted-foreground/25 hover:border-emerald-400 hover:bg-muted/30'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />

                  {uploadedImage ? (
                    <div className="relative">
                      <Image
                        src={uploadedImage}
                        alt="Uploaded image"
                        width={300}
                        height={300}
                        className="mx-auto rounded-lg max-h-64 object-contain"
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 end-2 size-8 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedImage(null);
                        }}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      <div className="mx-auto size-16 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                        <Upload className="size-7 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <p className="font-medium text-base">
                          {isRTL ? 'اسحب وأفلت الصورة هنا' : 'Drag & drop your image here'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isRTL ? 'أو انقر للتصفح' : 'or click to browse'}
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        <span>JPG</span>
                        <span>PNG</span>
                        <span>WebP</span>
                        <span>•</span>
                        <span>{isRTL ? 'حتى 10 ميجا' : 'Up to 10MB'}</span>
                      </div>
                      <Button variant="outline" className="gap-2">
                        <ImagePlus className="size-4" />
                        {isRTL ? 'اختر صورة' : 'Choose Image'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Camera Capture Button */}
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="size-4" />
                    {isRTL ? 'التقاط صورة' : 'Capture from Camera'}
                  </Button>
                </div>

                {/* Search Button */}
                {uploadedImage && !isSearching && (
                  <Button
                    className="w-full mt-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 text-white h-11 rounded-xl"
                    onClick={handleSearch}
                  >
                    <Search className="size-4 me-2" />
                    {t('searchByImage')}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Right Panel - Info / Loading */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[400px]">
                {isSearching ? (
                  <div className="text-center space-y-6">
                    <div className="relative">
                      <div className="size-24 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mx-auto">
                        <Sparkles className="size-10 text-violet-600 dark:text-violet-400 animate-pulse" />
                      </div>
                      <div className="absolute inset-0 size-24 mx-auto rounded-full border-4 border-violet-200 dark:border-violet-800 border-t-violet-500 animate-spin" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {isRTL ? 'الذكاء الاصطناعي يفحص صورتك...' : 'AI is scanning your image...'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isRTL ? 'البحث عن منتجات مشابهة' : 'Finding similar products'}
                      </p>
                    </div>
                    <Progress value={searchProgress} className="h-2 max-w-xs" />
                    <p className="text-sm text-violet-600 dark:text-violet-400">{searchProgress}%</p>
                  </div>
                ) : (
                  <div className="text-center space-y-4 text-muted-foreground">
                    <Camera className="size-16 mx-auto opacity-20" />
                    <p className="text-base font-medium">
                      {isRTL ? 'ارفع صورة للبحث عن منتجات مشابهة' : 'Upload an image to find similar products'}
                    </p>
                    <p className="text-sm max-w-sm">
                      {isRTL
                        ? 'يدعم JPG و PNG و WebP حتى 10 ميجابايت. ستجد أقرب المنتجات المطابقة.'
                        : 'Supports JPG, PNG, and WebP up to 10MB. We\'ll find the closest matching products.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : searchComplete && results.length === 0 ? (
          /* Search complete but no results — show CTA */
          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center">
                <Search className="size-12 text-violet-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">
                  {isRTL ? 'اكتمل البحث' : 'Search Complete'}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {isRTL
                    ? 'لم يتم العثور على منتجات مشابهة. جرّب صورة مختلفة أو عد للبحث يدوياً.'
                    : 'No similar products found. Try a different image or go back to search manually.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={handleNewSearch}>
                    <RefreshCw className="size-3.5" />
                    {isRTL ? 'بحث جديد' : 'New Search'}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => nav.setView('ai-tools')}>
                    <ArrowLeft className={`size-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                    {isRTL ? 'العودة لأدوات الذكاء' : 'Back to AI Tools'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Results */
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {uploadedImage && (
                  <Image
                    src={uploadedImage}
                    alt="Search image"
                    width={48}
                    height={48}
                    className="rounded-lg border-2 border-emerald-400 object-cover"
                  />
                )}
                <div>
                  <h2 className="font-semibold text-lg">
                    {isRTL ? 'المنتجات المشابهة' : 'Similar Products'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? `${results.length} منتج مشابه تم العثور عليه` : `${results.length} similar products found`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleNewSearch}>
                  <RefreshCw className="size-3.5" />
                  {isRTL ? 'بحث جديد' : 'New Search'}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setResults([]); setSearchProgress(0); setSearchComplete(false); }}>
                  {isRTL ? 'تحسين البحث' : 'Refine Search'}
                </Button>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
              {results.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
