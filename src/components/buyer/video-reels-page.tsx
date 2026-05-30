'use client';

import React, { useState } from 'react';
import {
  Play,
  Heart,
  Share2,
  MessageCircle,
  ShoppingCart,
  ChevronUp,
  ChevronDown,
  BadgeCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';

interface Reel {
  id: string;
  productNameEn: string;
  productNameAr: string;
  price: number;
  originalPrice?: number;
  sellerNameEn: string;
  sellerNameAr: string;
  sellerInitials: string;
  isVerified: boolean;
  likes: number;
  comments: number;
  shares: number;
  gradient: string;
  categoryEn: string;
  categoryAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

const reels: Reel[] = [
  {
    id: '1',
    productNameEn: 'iPhone 15 Pro Max',
    productNameAr: 'آيفون 15 برو ماكس',
    price: 1199,
    originalPrice: 1399,
    sellerNameEn: 'TechZone Official',
    sellerNameAr: 'تيك زون الرسمي',
    sellerInitials: 'TZ',
    isVerified: true,
    likes: 2340,
    comments: 189,
    shares: 67,
    gradient: 'from-blue-600 via-indigo-600 to-violet-700',
    categoryEn: 'Electronics',
    categoryAr: 'إلكترونيات',
    descriptionEn: 'Unbox the new iPhone 15 Pro Max! 📱✨ Camera test inside',
    descriptionAr: 'فتح صندوق آيفون 15 برو ماكس الجديد! 📱✨ اختبار الكاميرا بالداخل',
  },
  {
    id: '2',
    productNameEn: 'Designer Handbag Collection',
    productNameAr: 'مجموعة حقائب يد أنيقة',
    price: 299,
    originalPrice: 499,
    sellerNameEn: 'Fashion Palace',
    sellerNameAr: 'قصر الأزياء',
    sellerInitials: 'FP',
    isVerified: true,
    likes: 1890,
    comments: 234,
    shares: 112,
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-600',
    categoryEn: 'Fashion',
    categoryAr: 'أزياء',
    descriptionEn: 'Stunning designer bags just arrived! 👜🔥 Limited stock',
    descriptionAr: 'حقائب أنيقة وصلت للتو! 👜🔥 الكمية محدودة',
  },
  {
    id: '3',
    productNameEn: 'Gaming Setup RTX 4080',
    productNameAr: 'إعداد جيمنج RTX 4080',
    price: 2499,
    sellerNameEn: 'GamerHub Store',
    sellerNameAr: 'جيمر هب',
    sellerInitials: 'GH',
    isVerified: false,
    likes: 3450,
    comments: 423,
    shares: 89,
    gradient: 'from-emerald-500 via-green-600 to-teal-700',
    categoryEn: 'Gaming',
    categoryAr: 'ألعاب',
    descriptionEn: 'Ultimate gaming setup tour! 🎮💨 RTX 4080 + i9 build',
    descriptionAr: 'جولة إعداد جيمنج خارق! 🎮💨 RTX 4080 + i9',
  },
  {
    id: '4',
    productNameEn: 'Smart Home Bundle',
    productNameAr: 'باقة المنزل الذكي',
    price: 599,
    originalPrice: 799,
    sellerNameEn: 'SmartLife Co',
    sellerNameAr: 'سمارت لايف',
    sellerInitials: 'SL',
    isVerified: true,
    likes: 1245,
    comments: 98,
    shares: 45,
    gradient: 'from-amber-500 via-orange-500 to-red-600',
    categoryEn: 'Home',
    categoryAr: 'المنزل',
    descriptionEn: 'Transform your home into a smart home! 🏠💡 Voice control everything',
    descriptionAr: 'حوّل منزلك لمنزل ذكي! 🏠💡 تحكم صوتي لكل شيء',
  },
  {
    id: '5',
    productNameEn: 'Sports Wear Pro Kit',
    productNameAr: 'طقم رياضي احترافي',
    price: 149,
    originalPrice: 249,
    sellerNameEn: 'FitGear Official',
    sellerNameAr: 'فيت جير الرسمي',
    sellerInitials: 'FG',
    isVerified: true,
    likes: 987,
    comments: 76,
    shares: 34,
    gradient: 'from-cyan-500 via-sky-500 to-blue-600',
    categoryEn: 'Sports',
    categoryAr: 'رياضة',
    descriptionEn: 'Get fit in style! 🏃‍♂️💪 Premium sportswear at amazing prices',
    descriptionAr: 'تمرن بأناقة! 🏃‍♂️💪 ملابس رياضية فاخرة بأسعار مذهلة',
  },
  {
    id: '6',
    productNameEn: 'Organic Skincare Set',
    productNameAr: 'مجموعة العناية بالبشرة العضوية',
    price: 89,
    originalPrice: 129,
    sellerNameEn: 'GlowUp Beauty',
    sellerNameAr: 'جلوب أب بيوتي',
    sellerInitials: 'GU',
    isVerified: true,
    likes: 1567,
    comments: 201,
    shares: 78,
    gradient: 'from-purple-500 via-fuchsia-500 to-pink-600',
    categoryEn: 'Beauty',
    categoryAr: 'تجميل',
    descriptionEn: 'Glow up naturally! ✨🌿 100% organic skincare routine',
    descriptionAr: 'تألقي طبيعياً! ✨🌿 روتين عناية بالبشرة عضوي 100%',
  },
];

function formatCount(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function VideoReelsPage() {
  const { dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const nav = useAppNavigation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState(true);

  const currentReel = reels[currentIndex];

  const handleLike = (id: string) => {
    setLikedReels(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const handleNext = () => {
    if (currentIndex < reels.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handleShopProduct = (id: string) => {
    nav.selectProduct(id);
    nav.setView('product');
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-3 max-w-6xl">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Play className="size-5 text-emerald-400 fill-emerald-400" />
              {isRTL ? 'ريلز المنتجات' : 'Product Reels'}
            </h1>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              {currentIndex + 1} / {reels.length}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main Reel Viewer */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-full max-w-sm">
              {/* Reel container - 9:16 aspect ratio */}
              <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-gradient-to-b from-gray-900 to-black">
                {/* Video placeholder gradient */}
                <div className={`absolute inset-0 bg-gradient-to-b ${currentReel.gradient} opacity-80`} />

                {/* Decorative circles */}
                <div className="absolute top-20 start-10 w-32 h-32 bg-white/5 rounded-full" />
                <div className="absolute bottom-40 end-5 w-24 h-24 bg-white/5 rounded-full" />

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="flex items-center justify-center size-20 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors group">
                    <Play className="size-10 text-white fill-white group-hover:scale-110 transition-transform" />
                  </button>
                </div>

                {/* Top overlay info */}
                <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-red-500 text-white border-0 text-xs">
                      {isRTL ? 'مباشر' : 'LIVE'}
                    </Badge>
                    <button
                      onClick={() => setMuted(!muted)}
                      className="size-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
                    >
                      {muted ? (
                        <VolumeX className="size-4 text-white" />
                      ) : (
                        <Volume2 className="size-4 text-white" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom overlay - Product info */}
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  {/* Seller info */}
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar className="size-8 border-2 border-emerald-400">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs">
                        {currentReel.sellerInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-white text-xs font-medium truncate">
                          {isRTL ? currentReel.sellerNameAr : currentReel.sellerNameEn}
                        </span>
                        {currentReel.isVerified && (
                          <BadgeCheck className="size-3.5 text-emerald-400 fill-emerald-400/20" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Product name & price */}
                  <h3 className="text-white font-bold text-sm mb-1">
                    {isRTL ? currentReel.productNameAr : currentReel.productNameEn}
                  </h3>
                  <p className="text-white/70 text-xs mb-2 line-clamp-2">
                    {isRTL ? currentReel.descriptionAr : currentReel.descriptionEn}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-emerald-400 font-bold text-lg">${currentReel.price}</span>
                    {currentReel.originalPrice && (
                      <span className="text-white/40 line-through text-sm">${currentReel.originalPrice}</span>
                    )}
                    {currentReel.originalPrice && (
                      <Badge className="bg-red-500/80 text-white border-0 text-[10px]">
                        -{Math.round((1 - currentReel.price / currentReel.originalPrice) * 100)}%
                      </Badge>
                    )}
                  </div>

                  {/* Shop button */}
                  <Button
                    onClick={() => handleShopProduct(currentReel.id)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg"
                  >
                    <ShoppingCart className="size-4 me-2" />
                    {isRTL ? 'تسوق هذا المنتج' : 'Shop This Product'}
                  </Button>
                </div>
              </div>

              {/* Navigation arrows */}
              <div className="absolute top-1/2 -translate-y-1/2 start-0 ms-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="size-10 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
                >
                  <ChevronUp className="size-5" />
                </Button>
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 end-0 me-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={currentIndex === reels.length - 1}
                  className="size-10 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
                >
                  <ChevronDown className="size-5" />
                </Button>
              </div>

              {/* Side action buttons */}
              <div className="absolute end-3 top-1/3 flex flex-col gap-3">
                <button
                  onClick={() => handleLike(currentReel.id)}
                  className="flex flex-col items-center gap-0.5"
                >
                  <div className={`size-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-colors ${
                    likedReels.has(currentReel.id) ? 'bg-red-500/80' : 'hover:bg-black/60'
                  }`}>
                    <Heart className={`size-5 ${likedReels.has(currentReel.id) ? 'text-white fill-white' : 'text-white'}`} />
                  </div>
                  <span className="text-white text-[10px]">
                    {formatCount(currentReel.likes + (likedReels.has(currentReel.id) ? 1 : 0))}
                  </span>
                </button>
                <button className="flex flex-col items-center gap-0.5">
                  <div className="size-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60">
                    <MessageCircle className="size-5 text-white" />
                  </div>
                  <span className="text-white text-[10px]">{formatCount(currentReel.comments)}</span>
                </button>
                <button className="flex flex-col items-center gap-0.5">
                  <div className="size-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60">
                    <Share2 className="size-5 text-white" />
                  </div>
                  <span className="text-white text-[10px]">{formatCount(currentReel.shares)}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reels list / sidebar */}
          <div className="lg:w-80 w-full">
            <h3 className="text-white font-semibold mb-3 text-sm">
              {isRTL ? 'الريلز التالية' : 'Up Next'}
            </h3>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto scrollbar-thin">
              {reels.map((reel, idx) => (
                <button
                  key={reel.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all text-start ${
                    idx === currentIndex
                      ? 'bg-emerald-500/20 border border-emerald-500/40'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className={`size-14 rounded-lg bg-gradient-to-br ${reel.gradient} flex items-center justify-center shrink-0 relative`}>
                    <Play className="size-5 text-white fill-white opacity-80" />
                    {idx === currentIndex && (
                      <div className="absolute -top-1 -end-1 size-3 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">
                      {isRTL ? reel.productNameAr : reel.productNameEn}
                    </div>
                    <div className="text-white/50 text-[10px] truncate">
                      {isRTL ? reel.sellerNameAr : reel.sellerNameEn}
                      {reel.isVerified && ' ✓'}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-emerald-400 text-xs font-semibold">${reel.price}</span>
                      <span className="text-white/30 text-[10px]">
                        ❤️ {formatCount(reel.likes)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
