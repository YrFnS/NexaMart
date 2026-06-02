import {
  Sparkles,
  Zap,
  TrendingUp,
  Flame,
  ShoppingBag,
  Star,
} from "lucide-react";

export interface BannerData {
  id: string;
  title: string;
  titleAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  image: string | null;
  link: string | null;
  ctaText: string | null;
  ctaTextAr: string | null;
  ctaLink: string | null;
  gradient: string | null;
  icon: string | null;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface BannerFormData {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  image: string;
  link: string;
  ctaText: string;
  ctaTextAr: string;
  ctaLink: string;
  gradient: string;
  icon: string;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export const GRADIENT_PRESETS = [
  { key: "emerald-teal-cyan", value: "from-emerald-600 via-teal-600 to-cyan-600", i18nKey: "adminBannerGradientEmeraldTealCyan" },
  { key: "teal-emerald-green", value: "from-teal-600 via-emerald-600 to-green-600", i18nKey: "adminBannerGradientTealEmeraldGreen" },
  { key: "cyan-teal-emerald", value: "from-cyan-600 via-teal-600 to-emerald-600", i18nKey: "adminBannerGradientCyanTealEmerald" },
  { key: "amber-orange-red", value: "from-amber-500 via-orange-500 to-red-500", i18nKey: "adminBannerGradientAmberOrangeRed" },
  { key: "violet-purple-pink", value: "from-violet-600 via-purple-600 to-pink-600", i18nKey: "adminBannerGradientVioletPurplePink" },
  { key: "rose-pink-purple", value: "from-rose-500 via-pink-500 to-purple-500", i18nKey: "adminBannerGradientRosePinkPurple" },
];

export const ICON_OPTIONS = [
  { key: "Sparkles", i18nKey: "adminBannerIconSparkles" },
  { key: "Zap", i18nKey: "adminBannerIconZap" },
  { key: "TrendingUp", i18nKey: "adminBannerIconTrendingUp" },
  { key: "Flame", i18nKey: "adminBannerIconFlame" },
  { key: "ShoppingBag", i18nKey: "adminBannerIconShoppingBag" },
  { key: "Star", i18nKey: "adminBannerIconStar" },
];

export const POSITION_OPTIONS = ["hero", "sidebar", "footer"];

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Zap,
  TrendingUp,
  Flame,
  ShoppingBag,
  Star,
};

export const EMPTY_FORM: BannerFormData = {
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  image: "",
  link: "",
  ctaText: "",
  ctaTextAr: "",
  ctaLink: "",
  gradient: "emerald-teal-cyan",
  icon: "Sparkles",
  position: "hero",
  sortOrder: 0,
  isActive: true,
  startDate: "",
  endDate: "",
};
