/**
 * NexaMart - Centralized Theme Constants
 *
 * Shared visual constants used across components (gradients, colors, etc.)
 * to avoid duplication and ensure consistency.
 */

// ─── Avatar Gradients ────────────────────────────────────────────────────────
// Used for store/brand/seller avatar circles when no logo is available.
// Replaces duplicated gradient arrays in home-page.tsx and other components.

export const AVATAR_GRADIENTS = [
  'from-blue-500 to-cyan-500',
  'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',
  'from-green-500 to-emerald-500',
  'from-violet-500 to-purple-500',
  'from-teal-500 to-cyan-500',
  'from-yellow-500 to-amber-500',
  'from-red-500 to-rose-500',
];

// ─── Color Map ──────────────────────────────────────────────────────────────
// Maps common color names to hex values for product color swatches.

export const COLOR_MAP: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
  gray: '#6b7280',
  grey: '#6b7280',
  silver: '#9ca3af',
  gold: '#d4a017',
  brown: '#92400e',
  beige: '#d2b48c',
  navy: '#1e3a5f',
  teal: '#14b8a6',
  coral: '#ff7f50',
  maroon: '#800000',
  olive: '#808000',
  cyan: '#06b6d4',
  magenta: '#d946ef',
  lavender: '#a78bfa',
  burgundy: '#7f1d1d',
  ivory: '#fffff0',
  khaki: '#c3b091',
  turquoise: '#40e0d0',
  copper: '#b87333',
  charcoal: '#36454f',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  bronze: '#cd7f32',
  cream: '#fffdd0',
  tan: '#d2b48c',
  peach: '#ffcba4',
  mint: '#3eb489',
  rust: '#b7410e',
  plum: '#8e4585',
  slate: '#64748b',
  sky: '#0ea5e9',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  lime: '#84cc16',
};

// ─── Status Colors ──────────────────────────────────────────────────────────
// Used for order status badges, dispute status, and chart cells.
// Each status has: chart (hex for recharts), bg (Tailwind bg), text (Tailwind text)

export const STATUS_COLORS: Record<string, { chart: string; bg: string; text: string }> = {
  Pending: { chart: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  pending: { chart: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  Processing: { chart: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  processing: { chart: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  Shipped: { chart: '#8b5cf6', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300' },
  shipped: { chart: '#8b5cf6', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300' },
  Delivered: { chart: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  delivered: { chart: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  Cancelled: { chart: '#ef4444', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  cancelled: { chart: '#ef4444', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  Disputed: { chart: '#f97316', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  disputed: { chart: '#f97316', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  Refunded: { chart: '#06b6d4', bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300' },
  refunded: { chart: '#06b6d4', bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300' },
  open: { chart: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  resolved: { chart: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  closed: { chart: '#6b7280', bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-300' },
  active: { chart: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  inactive: { chart: '#6b7280', bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-300' },
};

// ─── Chart Colors ───────────────────────────────────────────────────────────
// Hex color palette for charts (pie charts, bar charts, etc.)

export const CHART_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#a855f7', // purple
  '#84cc16', // lime
  '#e11d48', // rose
];

// ─── Brand Colors ───────────────────────────────────────────────────────────
// Hex colors for external brand buttons (WhatsApp, etc.)

export const BRAND_COLORS: Record<string, string> = {
  whatsapp: '#25D366',
  telegram: '#0088cc',
  messenger: '#0084FF',
  viber: '#7360F2',
  phone: '#10b981',
};

// ─── Loyalty Tier Colors ───────────────────────────────────────────────────
// Hex colors for loyalty tier badges

export const LOYALTY_TIER_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#d4a017',
  platinum: '#e5e4e2',
  diamond: '#b9f2ff',
};
