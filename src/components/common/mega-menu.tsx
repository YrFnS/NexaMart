'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Smartphone,
  Laptop,
  Camera,
  Gamepad2,
  Headphones,
  Cable,
  Shirt,
  ShoppingBag,
  Baby,
  Footprints,
  Briefcase,
  Gem,
  Watch,
  Sofa,
  Refrigerator,
  Lamp,
  CookingPot,
  Flower2,
  Wrench,
  Car,
  Bike,
  Cog,
  Ship,
  Tractor,
  Building2,
  Landmark,
  Map,
  Store,
  DoorOpen,
  Key,
  Monitor,
  Megaphone,
  Banknote,
  HardHat,
  HeartPulse,
  GraduationCap,
  Droplets,
  Settings2,
  BookOpen,
  Stethoscope,
  Scale,
  Cpu,
  PawPrint,
  Dumbbell,
  BabyIcon,
  BookOpenCheck,
  Palette,
  Trophy,
  ChevronRight,
  Sparkles,
  Zap,
  TrendingUp,
  X,
  Grid3X3,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import type { LucideIcon } from 'lucide-react';

interface CategoryItem {
  key: string;
  icon: LucideIcon;
  view?: string;
  category?: string;
}

interface CategoryGroup {
  key: string;
  icon: LucideIcon;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  hoverBg: string;
  items: CategoryItem[];
}

const categoryGroups: CategoryGroup[] = [
  {
    key: 'megaElectronics',
    icon: Smartphone,
    color: 'text-blue-500',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-600',
    borderColor: 'border-blue-400',
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-950/30',
    items: [
      { key: 'megaPhonesTablets', icon: Smartphone, category: 'phones-tablets' },
      { key: 'megaLaptops', icon: Laptop, category: 'laptops' },
      { key: 'megaCameras', icon: Camera, category: 'cameras' },
      { key: 'megaGaming', icon: Gamepad2, category: 'gaming' },
      { key: 'megaAudio', icon: Headphones, category: 'audio' },
      { key: 'megaAccessories', icon: Cable, category: 'accessories' },
    ],
  },
  {
    key: 'megaFashion',
    icon: Shirt,
    color: 'text-pink-500',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-rose-500',
    borderColor: 'border-pink-400',
    hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-950/30',
    items: [
      { key: 'megaMensClothing', icon: Shirt, category: 'mens-clothing' },
      { key: 'megaWomensClothing', icon: ShoppingBag, category: 'womens-clothing' },
      { key: 'megaKids', icon: Baby, category: 'kids-clothing' },
      { key: 'megaShoes', icon: Footprints, category: 'shoes' },
      { key: 'megaBags', icon: Briefcase, category: 'bags' },
      { key: 'megaJewelry', icon: Gem, category: 'jewelry' },
      { key: 'megaWatches', icon: Watch, category: 'watches' },
    ],
  },
  {
    key: 'megaHomeGarden',
    icon: Sofa,
    color: 'text-amber-500',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-500',
    borderColor: 'border-amber-400',
    hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-950/30',
    items: [
      { key: 'megaFurniture', icon: Sofa, category: 'furniture' },
      { key: 'megaAppliances', icon: Refrigerator, category: 'appliances' },
      { key: 'megaDecor', icon: Lamp, category: 'decor' },
      { key: 'megaKitchen', icon: CookingPot, category: 'kitchen' },
      { key: 'megaGarden', icon: Flower2, category: 'garden' },
      { key: 'megaTools', icon: Wrench, category: 'tools' },
    ],
  },
  {
    key: 'megaMotors',
    icon: Car,
    color: 'text-red-500',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-red-600',
    borderColor: 'border-red-400',
    hoverBg: 'hover:bg-red-50 dark:hover:bg-red-950/30',
    items: [
      { key: 'megaCars', icon: Car, view: 'cars' },
      { key: 'megaMotorcycles', icon: Bike, category: 'motorcycles' },
      { key: 'megaPartsAccessories', icon: Cog, category: 'parts-accessories' },
      { key: 'megaBoats', icon: Ship, category: 'boats' },
      { key: 'megaHeavyMachinery', icon: Tractor, category: 'heavy-machinery' },
    ],
  },
  {
    key: 'megaProperty',
    icon: Building2,
    color: 'text-emerald-500',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-500',
    borderColor: 'border-emerald-400',
    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
    items: [
      { key: 'megaApartments', icon: Building2, view: 'properties' },
      { key: 'megaVillas', icon: Landmark, view: 'properties' },
      { key: 'megaLand', icon: Map, view: 'properties' },
      { key: 'megaCommercialProp', icon: Store, view: 'properties' },
      { key: 'megaOffices', icon: DoorOpen, view: 'properties' },
      { key: 'megaForRent', icon: Key, view: 'properties' },
    ],
  },
  {
    key: 'megaJobsCategory',
    icon: Monitor,
    color: 'text-violet-500',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-500',
    borderColor: 'border-violet-400',
    hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-950/30',
    items: [
      { key: 'megaIT', icon: Monitor, view: 'jobs' },
      { key: 'megaMarketing', icon: Megaphone, view: 'jobs' },
      { key: 'megaFinance', icon: Banknote, view: 'jobs' },
      { key: 'megaEngineering', icon: HardHat, view: 'jobs' },
      { key: 'megaHealthcare', icon: HeartPulse, view: 'jobs' },
      { key: 'megaEducationJobs', icon: GraduationCap, view: 'jobs' },
    ],
  },
  {
    key: 'megaServices',
    icon: Droplets,
    color: 'text-cyan-500',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-cyan-600',
    borderColor: 'border-cyan-400',
    hoverBg: 'hover:bg-cyan-50 dark:hover:bg-cyan-950/30',
    items: [
      { key: 'megaCleaning', icon: Droplets, view: 'services' },
      { key: 'megaMaintenance', icon: Settings2, view: 'services' },
      { key: 'megaEducationService', icon: BookOpen, view: 'services' },
      { key: 'megaHealthService', icon: Stethoscope, view: 'services' },
      { key: 'megaLegal', icon: Scale, view: 'services' },
      { key: 'megaITTech', icon: Cpu, view: 'services' },
    ],
  },
  {
    key: 'megaClassifieds',
    icon: PawPrint,
    color: 'text-orange-500',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-amber-500',
    borderColor: 'border-orange-400',
    hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-950/30',
    items: [
      { key: 'megaPets', icon: PawPrint, category: 'pets' },
      { key: 'megaSports', icon: Dumbbell, category: 'sports' },
      { key: 'megaBabyKids', icon: BabyIcon, category: 'baby-kids' },
      { key: 'megaBooks', icon: BookOpenCheck, category: 'books' },
      { key: 'megaArt', icon: Palette, category: 'art' },
      { key: 'megaCollectibles', icon: Trophy, category: 'collectibles' },
    ],
  },
];

const featuredCategories = [
  {
    key: 'megaPopularElectronics',
    icon: Smartphone,
    color: 'from-blue-500 to-cyan-500',
    view: 'shop',
    category: 'electronics',
  },
  {
    key: 'megaPopularFashion',
    icon: Shirt,
    color: 'from-pink-500 to-rose-500',
    view: 'shop',
    category: 'fashion',
  },
  {
    key: 'megaPopularHome',
    icon: Sofa,
    color: 'from-amber-500 to-orange-500',
    view: 'shop',
    category: 'home-garden',
  },
];

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  headerRef?: React.RefObject<HTMLElement | null>;
  onEnter?: () => void;
  onLeave?: () => void;
}

export function MegaMenu({ isOpen, onClose, headerRef, onEnter, onLeave }: MegaMenuProps) {
  const { t, dir, locale } = useI18n();
  const { selectCategory } = useAppStore();
  const nav = useAppNavigation();
  const isRTL = dir() === 'rtl';

  const [menuTop, setMenuTop] = useState<number>(0);

  // Calculate the top position based on the header's bounding rect
  const updatePosition = useCallback(() => {
    if (headerRef?.current) {
      const rect = headerRef.current.getBoundingClientRect();
      setMenuTop(rect.bottom);
    } else {
      // Fallback: find the header element
      const header = document.querySelector('header');
      if (header) {
        const rect = header.getBoundingClientRect();
        setMenuTop(rect.bottom);
      }
    }
  }, [headerRef]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      // Update position on scroll/resize
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition, { passive: true });
    }
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCategoryClick = (item: CategoryItem) => {
    const view = item.view || 'shop';
    if (item.category) {
      selectCategory(item.category);
    }
    nav.setView(view as Parameters<typeof nav.setView>[0]);
    onClose();
  };

  const handleFeaturedClick = (featured: typeof featuredCategories[number]) => {
    if (featured.category) {
      selectCategory(featured.category);
    }
    nav.setView(featured.view as Parameters<typeof nav.setView>[0]);
    onClose();
  };

  const handleViewAll = () => {
    selectCategory(null);
    nav.setView('shop');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - full screen overlay with enhanced blur */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />

      {/* Mega Menu Panel - fixed positioned to avoid header overflow clipping */}
      <div
        dir={dir()}
        className="fixed start-0 w-full shadow-2xl mega-menu-panel rounded-b-2xl overflow-hidden animate-mega-menu"
        style={{ top: menuTop, zIndex: 9999 }}
        onMouseEnter={() => onEnter?.()}
        onMouseLeave={() => onLeave?.()}
      >
        {/* Subtle top gradient overlay */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400/30 via-teal-400/20 to-emerald-400/30 pointer-events-none" />

        {/* Decorative mesh gradient background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -start-20 w-60 h-60 rounded-full bg-emerald-500/5 dark:bg-emerald-500/3 blur-3xl" />
          <div className="absolute -bottom-20 -end-20 w-72 h-72 rounded-full bg-blue-500/5 dark:bg-blue-500/3 blur-3xl" />
          <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-teal-500/3 dark:bg-teal-500/2 blur-3xl" />
        </div>

        {/* Shimmer sweep on open */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="mega-menu-shimmer absolute inset-0" />
        </div>

        <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-700/60">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row items-start gap-6">
              {/* Featured Categories - Side Panel */}
              <div className="hidden lg:flex flex-col gap-3 w-56 shrink-0 relative">
                {/* Gradient border separator on the end side */}
                <div className="absolute -end-3 top-0 bottom-0 w-px">
                  <div className="w-full h-full bg-gradient-to-b from-transparent via-emerald-400/40 to-transparent dark:via-emerald-500/30" />
                </div>
                <div className="pe-6">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-3">
                    <Sparkles className="size-3.5 text-emerald-500" />
                    {t('megaFeaturedCategories')}
                  </h3>
                  <div className="space-y-2">
                    {featuredCategories.map((featured, index) => (
                      <button
                        key={featured.key}
                        onClick={() => handleFeaturedClick(featured)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all duration-200 group w-full text-start relative hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/30 border border-transparent hover:border-gray-100 dark:hover:border-gray-700/50"
                      >
                        {/* Featured icon with pulse on hover */}
                        <div className={`size-11 rounded-xl bg-gradient-to-br ${featured.color} flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                          <featured.icon className="size-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                              {t(featured.key)}
                            </p>
                            {/* Popular badge on first featured item */}
                            {index === 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-500/20 dark:to-amber-500/20 text-[9px] font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap border border-orange-200/50 dark:border-orange-800/30">
                                <Flame className="size-2.5" />
                                {locale === 'ar' ? 'رائج' : 'Popular'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                            {t('megaExploreCategory')}
                          </p>
                        </div>
                        <ArrowRight className={`size-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 ${isRTL ? 'rotate-180' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Featured Categories (shown below lg) */}
              <div className="lg:hidden w-full">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-3">
                  <Sparkles className="size-3.5 text-emerald-500" />
                  {t('megaFeaturedCategories')}
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {featuredCategories.map((featured, index) => (
                    <button
                      key={featured.key}
                      onClick={() => handleFeaturedClick(featured)}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 shrink-0 transition-all duration-200 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800/50 min-h-[44px]"
                    >
                      <div className={`size-9 rounded-lg bg-gradient-to-br ${featured.color} flex items-center justify-center shadow-sm`}>
                        <featured.icon className="size-4 text-white" />
                      </div>
                      <div className="text-start">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            {t(featured.key)}
                          </p>
                          {index === 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-orange-500/10 dark:bg-orange-500/20 text-[8px] font-bold text-orange-600 dark:text-orange-400">
                              <Flame className="size-2" />
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider for mobile between featured and categories */}
              <div className="lg:hidden w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />

              {/* Category Groups Grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
                {categoryGroups.map((group, groupIndex) => (
                  <div
                    key={group.key}
                    className="mega-menu-item"
                    style={{
                      animation: `mega-menu-stagger-in 0.4s ease-out ${0.05 + groupIndex * 0.05}s forwards`,
                    }}
                  >
                    {/* Group Header */}
                    <button
                      onClick={() => {
                        const firstItemWithView = group.items.find(i => i.view);
                        if (firstItemWithView) {
                          handleCategoryClick(firstItemWithView);
                        } else {
                          selectCategory(group.items[0]?.category || null);
                          nav.setView('shop');
                          onClose();
                        }
                      }}
                      className="flex items-center gap-2.5 mb-3 group relative"
                    >
                      {/* Gradient icon container with hover scale */}
                      <div className={`size-9 rounded-xl bg-gradient-to-br ${group.gradientFrom} ${group.gradientTo} flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                        <group.icon className="size-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {t(group.key)}
                      </span>
                      <ChevronRight className={`size-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 ${isRTL ? '-scale-x-100' : ''}`} />
                      {/* Animated underline on hover */}
                      <div className="absolute -bottom-1 start-0 h-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 w-0 group-hover:w-full transition-all duration-300" />
                    </button>
                    {/* Items */}
                    <ul className="space-y-0.5 ps-11">
                      {group.items.map((item, itemIndex) => (
                        <li
                          key={item.key}
                          className="mega-menu-item"
                          style={{
                            animation: `mega-menu-stagger-in 0.35s ease-out ${0.1 + groupIndex * 0.05 + itemIndex * 0.03}s forwards`,
                          }}
                        >
                          <button
                            onClick={() => handleCategoryClick(item)}
                            className={`text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 flex items-center gap-1.5 group w-full text-start py-1.5 px-2 -mx-2 rounded-lg ${group.hoverBg} min-h-[36px] border-s-2 border-transparent hover:border-s-current`}
                            style={{
                              borderLeftColor: 'transparent',
                            }}
                          >
                            {/* Left border accent with group color - visible on hover via CSS */}
                            <span className="absolute start-0 top-1/2 -translate-y-1/2 w-0.5 h-0 rounded-full bg-gradient-to-b from-emerald-400 to-teal-400 group-hover:h-3/5 transition-all duration-300 opacity-0 group-hover:opacity-100 -ms-2" />
                            <item.icon className="size-3.5 text-gray-400 group-hover:text-emerald-500 transition-all duration-200 shrink-0" />
                            <span className="group-hover:font-medium transition-all duration-200 group-hover:ps-1">{t(item.key)}</span>
                            {/* Dot/arrow indicator on hover */}
                            <ChevronRight className={`size-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 -translate-x-1 ${isRTL ? 'rotate-180' : ''}`} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Close button - improved with circular background */}
              <button
                onClick={onClose}
                className="lg:hidden absolute top-3 end-3 p-2 rounded-full bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 backdrop-blur-sm shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X className="size-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* View All Categories Link */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
              <button
                onClick={handleViewAll}
                className="group relative flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all duration-300 px-4 py-2.5 -mx-4 rounded-xl min-h-[44px]"
              >
                {/* Gradient hover background */}
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/10 group-hover:to-teal-500/10 dark:group-hover:from-emerald-500/15 dark:group-hover:to-teal-500/15 transition-all duration-300" />
                <Grid3X3 className="size-4 relative z-10" />
                <span className="relative z-10">{t('megaViewAllCategories')}</span>
                <ChevronRight className={`size-3.5 relative z-10 transition-transform duration-200 group-hover:translate-x-0.5 ${isRTL ? '-scale-x-100' : ''}`} />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                <Zap className="size-3 text-amber-500" />
                <span>{locale === 'ar' ? 'أكثر من ٥٠ فئة للتصفح' : '50+ categories to browse'}</span>
                <TrendingUp className="size-3 text-emerald-500 ms-2" />
                <span>{locale === 'ar' ? 'محدث باستمرار' : 'Updated regularly'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
