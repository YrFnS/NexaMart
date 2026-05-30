'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  X, ZoomIn, ChevronLeft, ChevronRight,
  Monitor, Shirt, Home, Sparkles, Dumbbell,
  Watch, Gamepad2, Camera, Smartphone, Laptop, Gem, Flower2,
  Lamp, Sofa, CookingPot, Footprints, Palette, Package, ShoppingBasket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  category?: string;
}

// Category-specific gradient config for image placeholders
const categoryGradients: Record<string, {
  gradient: string;
  darkGradient: string;
  icon: React.ElementType;
  textColor: string;
}> = {
  'electronics': { gradient: 'from-blue-100 via-cyan-100 to-teal-100', darkGradient: 'dark:from-blue-950 dark:via-cyan-950 dark:to-teal-950', icon: Monitor, textColor: 'text-blue-500' },
  'fashion': { gradient: 'from-pink-100 via-rose-100 to-fuchsia-100', darkGradient: 'dark:from-pink-950 dark:via-rose-950 dark:to-fuchsia-950', icon: Shirt, textColor: 'text-pink-500' },
  'home': { gradient: 'from-amber-100 via-orange-100 to-yellow-100', darkGradient: 'dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950', icon: Home, textColor: 'text-amber-500' },
  'home & garden': { gradient: 'from-amber-100 via-orange-100 to-yellow-100', darkGradient: 'dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950', icon: Home, textColor: 'text-amber-500' },
  'beauty': { gradient: 'from-purple-100 via-fuchsia-100 to-pink-100', darkGradient: 'dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950', icon: Flower2, textColor: 'text-purple-500' },
  'beauty & health': { gradient: 'from-purple-100 via-fuchsia-100 to-pink-100', darkGradient: 'dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950', icon: Flower2, textColor: 'text-purple-500' },
  'sports': { gradient: 'from-green-100 via-lime-100 to-emerald-100', darkGradient: 'dark:from-green-950 dark:via-lime-950 dark:to-emerald-950', icon: Dumbbell, textColor: 'text-green-500' },
  'sports & outdoors': { gradient: 'from-green-100 via-lime-100 to-emerald-100', darkGradient: 'dark:from-green-950 dark:via-lime-950 dark:to-emerald-950', icon: Dumbbell, textColor: 'text-green-500' },
  'jewelry': { gradient: 'from-yellow-100 via-amber-100 to-orange-100', darkGradient: 'dark:from-yellow-950 dark:via-amber-950 dark:to-orange-950', icon: Gem, textColor: 'text-yellow-500' },
  'jewelry & watches': { gradient: 'from-yellow-100 via-amber-100 to-orange-100', darkGradient: 'dark:from-yellow-950 dark:via-amber-950 dark:to-orange-950', icon: Gem, textColor: 'text-yellow-500' },
  'toys': { gradient: 'from-cyan-100 via-blue-100 to-sky-100', darkGradient: 'dark:from-cyan-950 dark:via-blue-950 dark:to-sky-950', icon: Gamepad2, textColor: 'text-cyan-500' },
  'toys & games': { gradient: 'from-cyan-100 via-blue-100 to-sky-100', darkGradient: 'dark:from-cyan-950 dark:via-blue-950 dark:to-sky-950', icon: Gamepad2, textColor: 'text-cyan-500' },
  'books': { gradient: 'from-teal-100 via-emerald-100 to-cyan-100', darkGradient: 'dark:from-teal-950 dark:via-emerald-950 dark:to-cyan-950', icon: Palette, textColor: 'text-teal-500' },
  'books & media': { gradient: 'from-teal-100 via-emerald-100 to-cyan-100', darkGradient: 'dark:from-teal-950 dark:via-emerald-950 dark:to-cyan-950', icon: Palette, textColor: 'text-teal-500' },
  'food': { gradient: 'from-red-100 via-orange-100 to-amber-100', darkGradient: 'dark:from-red-950 dark:via-orange-950 dark:to-amber-950', icon: ShoppingBasket, textColor: 'text-red-500' },
  'food & groceries': { gradient: 'from-red-100 via-orange-100 to-amber-100', darkGradient: 'dark:from-red-950 dark:via-orange-950 dark:to-amber-950', icon: ShoppingBasket, textColor: 'text-red-500' },
  'automotive': { gradient: 'from-slate-100 via-gray-100 to-zinc-100', darkGradient: 'dark:from-slate-950 dark:via-gray-950 dark:to-zinc-950', icon: Smartphone, textColor: 'text-slate-500' },
};

const defaultGradient = {
  gradient: 'from-emerald-100 via-teal-100 to-cyan-100',
  darkGradient: 'dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950',
  icon: Sparkles,
  textColor: 'text-emerald-500',
};

function getCategoryConfig(category: string) {
  const lower = category.toLowerCase();
  if (categoryGradients[lower]) return categoryGradients[lower];
  // Partial match
  for (const [key, config] of Object.entries(categoryGradients)) {
    if (lower.includes(key) || key.includes(lower)) return config;
  }
  return defaultGradient;
}

// Reusable gradient placeholder component for broken/missing images
function ImagePlaceholder({
  productName,
  category,
  size = 'full',
}: {
  productName: string;
  category: string;
  size?: 'full' | 'thumb';
}) {
  const config = getCategoryConfig(category);
  const CategoryIcon = config.icon;
  const initials = productName
    .split(/[-_\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  if (size === 'thumb') {
    return (
      <div className={`flex flex-col items-center justify-center h-full w-full bg-gradient-to-br ${config.gradient} ${config.darkGradient} relative overflow-hidden`}>
        <span className={`text-lg font-bold ${config.textColor} opacity-40 select-none`}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center h-full w-full bg-gradient-to-br ${config.gradient} ${config.darkGradient} relative overflow-hidden`}>
      {/* Decorative background circles */}
      <div className="absolute top-8 right-8 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute bottom-12 left-8 w-16 h-16 rounded-full bg-white/10" />
      <div className="absolute top-1/2 left-1/3 w-8 h-8 rounded-full bg-white/5" />

      {/* Large initial letter in background */}
      <span className={`text-8xl font-bold ${config.textColor} opacity-20 absolute inset-0 flex items-center justify-center select-none`}>
        {productName.charAt(0).toUpperCase()}
      </span>

      {/* Category icon */}
      <CategoryIcon className={`size-14 ${config.textColor} mb-3 opacity-60 relative z-[1]`} />

      {/* Product initials */}
      <span className={`text-2xl font-bold ${config.textColor} opacity-80 relative z-[1]`}>
        {initials}
      </span>

      {/* Category label */}
      <span className="mt-2 text-xs uppercase tracking-wider font-semibold px-3 py-1 rounded-full bg-white/20 text-muted-foreground/60 relative z-[1]">
        {category}
      </span>
    </div>
  );
}

export function ProductGallery({ images, productName, category = 'electronics' }: ProductGalleryProps) {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  const [internalSelectedIndex, setInternalSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const mainImageRef = useRef<HTMLDivElement>(null);

  const validImages = images.length > 0 ? images : [];
  const hasImages = validImages.length > 0;

  // Clamp selectedIndex when images change
  const selectedIndex = Math.min(internalSelectedIndex, Math.max(0, validImages.length - 1));
  const setSelectedIndex = setInternalSelectedIndex;

  const goToPrev = useCallback(() => {
    if (validImages.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 300);
    setSelectedIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  }, [validImages.length]);

  const goToNext = useCallback(() => {
    if (validImages.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 300);
    setSelectedIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  }, [validImages.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'ArrowLeft') {
        if (isRTL) { goToNext(); } else { goToPrev(); }
      } else if (e.key === 'ArrowRight') {
        if (isRTL) { goToPrev(); } else { goToNext(); }
      } else if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    },
    [isLightboxOpen, goToPrev, goToNext, isRTL]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleImageError = (index: number) => {
    setImgErrors((prev) => ({ ...prev, [index]: true }));
  };

  // Zoom lens mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImageRef.current) return;
    const rect = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsZooming(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsZooming(false);
  }, []);

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div
        ref={mainImageRef}
        className={`relative aspect-square rounded-xl overflow-hidden bg-muted group main-image-container ${
          hasImages && !imgErrors[selectedIndex] ? 'cursor-zoom-in' : 'cursor-default'
        }`}
        onClick={() => { if (hasImages && !imgErrors[selectedIndex]) setIsLightboxOpen(true); }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {hasImages ? (
          <>
            {/* Main image with smooth transition */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {!imgErrors[selectedIndex] && validImages[selectedIndex] ? (
                <Image
                  src={validImages[selectedIndex]}
                  alt={`${productName} - ${selectedIndex + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 ease-out"
                  style={isZooming ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`, transform: 'scale(1.5)' } : undefined}
                  priority
                  onError={() => handleImageError(selectedIndex)}
                />
              ) : (
                <ImagePlaceholder productName={productName} category={category} size="full" />
              )}
            </div>

            {/* Zoom lens indicator */}
            {isZooming && !imgErrors[selectedIndex] && (
              <div
                className="absolute pointer-events-none z-10 w-24 h-24 rounded-full border-2 border-white/70 shadow-lg"
                style={{
                  left: `calc(${zoomPosition.x}% - 48px)`,
                  top: `calc(${zoomPosition.y}% - 48px)`,
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 70%)',
                  backdropFilter: 'blur(1px)',
                }}
              />
            )}

            {/* Zoom Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center pointer-events-none">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white/90 dark:bg-gray-900/90 rounded-full p-2">
                  <ZoomIn className="size-5 text-gray-700 dark:text-gray-300" />
                </div>
              </div>
            </div>

            {/* Navigation Arrows on Main Image */}
            {validImages.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className={`absolute top-1/2 -translate-y-1/2 ${
                    isRTL ? 'right-2' : 'left-2'
                  } size-9 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 hover:scale-110`}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrev();
                  }}
                >
                  <PrevIcon className="size-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className={`absolute top-1/2 -translate-y-1/2 ${
                    isRTL ? 'left-2' : 'right-2'
                  } size-9 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 hover:scale-110`}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                >
                  <NextIcon className="size-4" />
                </Button>
              </>
            )}

            {/* Image Count Indicator */}
            {validImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium tracking-wide">
                {selectedIndex + 1}/{validImages.length}
              </div>
            )}
          </>
        ) : (
          /* Beautiful placeholder when no images at all */
          <ImagePlaceholder productName={productName} category={category} size="full" />
        )}
      </div>

      {/* Thumbnail Strip - horizontal scrollable */}
      {hasImages && validImages.length > 1 && (
        <div className="relative group/thumbs">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scroll-smooth thumbnail-strip">
            {validImages.map((img, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => setIsTransitioning(false), 300);
                  setSelectedIndex(index);
                }}
                className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  index === selectedIndex
                    ? 'border-emerald-500 shadow-md shadow-emerald-500/25 scale-105'
                    : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:scale-105'
                }`}
              >
                {!imgErrors[index] && img ? (
                  <Image
                    src={img}
                    alt={`${productName} thumb ${index + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                    onError={() => handleImageError(index)}
                  />
                ) : (
                  <ImagePlaceholder productName={productName} category={category} size="thumb" />
                )}
                {/* Active thumbnail indicator line */}
                {index === selectedIndex && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none overflow-hidden">
          <div className="relative aspect-square">
            {!imgErrors[selectedIndex] && validImages[selectedIndex] ? (
              <Image
                src={validImages[selectedIndex]}
                alt={`${productName} - ${selectedIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                onError={() => handleImageError(selectedIndex)}
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <ImagePlaceholder productName={productName} category={category} size="full" />
              </div>
            )}

            {/* Lightbox Navigation */}
            {validImages.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className={`absolute top-1/2 -translate-y-1/2 ${
                    isRTL ? 'right-4' : 'left-4'
                  } size-11 rounded-full bg-white/20 hover:bg-white/30 text-white border-none hover:scale-110 transition-transform`}
                  onClick={goToPrev}
                >
                  <PrevIcon className="size-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className={`absolute top-1/2 -translate-y-1/2 ${
                    isRTL ? 'left-4' : 'right-4'
                  } size-11 rounded-full bg-white/20 hover:bg-white/30 text-white border-none hover:scale-110 transition-transform`}
                  onClick={goToNext}
                >
                  <NextIcon className="size-5" />
                </Button>
              </>
            )}

            {/* Lightbox Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm text-white text-sm px-4 py-1.5 rounded-full font-medium">
              {selectedIndex + 1} / {validImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
