'use client';

import React from 'react';
import { Check, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';

interface VariationOption {
  label: string;
  labelAr?: string;
  value: string;
  colorHex?: string; // For color swatches
  inStock?: boolean;
  priceAdjustment?: number; // +/- price change
}

export interface VariationType {
  type: string;
  typeAr?: string;
  options: VariationOption[];
  selected?: string;
}

interface VariationSelectorProps {
  variations: VariationType[];
  onVariationChange?: (type: string, value: string) => void;
  basePrice?: number;
  currency?: string;
}

export function VariationSelector({
  variations,
  onVariationChange,
  basePrice = 0,
  currency = '$',
}: VariationSelectorProps) {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';

  const renderColorSwatches = (variation: VariationType) => {
    return (
      <div className="flex flex-wrap gap-2">
        {variation.options.map((opt) => {
          const isSelected = variation.selected === opt.value;
          const isOOS = opt.inStock === false;
          return (
            <button
              key={opt.value}
              onClick={() => !isOOS && onVariationChange?.(variation.type, opt.value)}
              disabled={isOOS}
              className={`
                relative size-9 rounded-full border-2 transition-all duration-200
                ${isSelected
                  ? 'border-emerald-500 scale-110 shadow-md shadow-emerald-500/20'
                  : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                }
                ${isOOS ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
              `}
              style={{ backgroundColor: opt.colorHex || '#ccc' }}
              title={`${isRTL && opt.labelAr ? opt.labelAr : opt.label}${isOOS ? ` (${isRTL ? 'نفذ' : 'Out of stock'})` : ''}`}
            >
              {isSelected && (
                <Check
                  className={`size-4 absolute inset-0 m-auto ${
                    opt.colorHex && isLightColor(opt.colorHex)
                      ? 'text-gray-800'
                      : 'text-white'
                  }`}
                />
              )}
              {isOOS && (
                <Ban className="size-4 absolute inset-0 m-auto text-red-500" />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderSizeButtons = (variation: VariationType) => {
    return (
      <div className="flex flex-wrap gap-2">
        {variation.options.map((opt) => {
          const isSelected = variation.selected === opt.value;
          const isOOS = opt.inStock === false;
          return (
            <Button
              key={opt.value}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              className={`
                min-w-[40px] h-9 px-3 relative
                ${isSelected
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'hover:border-emerald-300 dark:hover:border-emerald-700'
                }
                ${isOOS ? 'opacity-40 cursor-not-allowed line-through' : ''}
              `}
              disabled={isOOS}
              onClick={() => !isOOS && onVariationChange?.(variation.type, opt.value)}
            >
              {isRTL && opt.labelAr ? opt.labelAr : opt.label}
              {opt.priceAdjustment && opt.priceAdjustment !== 0 && (
                <span className="text-[10px] ms-1 opacity-70">
                  {opt.priceAdjustment > 0 ? '+' : ''}{currency}{Math.abs(opt.priceAdjustment)}
                </span>
              )}
              {isOOS && (
                <Badge className="absolute -top-1.5 -end-1.5 bg-red-500 text-white text-[8px] px-1 py-0 border-0">
                  {isRTL ? 'نفذ' : 'OOS'}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    );
  };

  const renderDropdownSelect = (variation: VariationType) => {
    return (
      <Select
        value={variation.selected || ''}
        onValueChange={(v) => onVariationChange?.(variation.type, v)}
      >
        <SelectTrigger className="w-full max-w-xs h-9">
          <SelectValue placeholder={isRTL ? 'اختر...' : 'Select...'} />
        </SelectTrigger>
        <SelectContent>
          {variation.options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              disabled={opt.inStock === false}
            >
              <span className={opt.inStock === false ? 'opacity-40 line-through' : ''}>
                {isRTL && opt.labelAr ? opt.labelAr : opt.label}
              </span>
              {opt.priceAdjustment && opt.priceAdjustment !== 0 && (
                <span className="text-xs text-muted-foreground ms-2">
                  {opt.priceAdjustment > 0 ? '+' : ''}{currency}{Math.abs(opt.priceAdjustment)}
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const detectVariationUI = (variation: VariationType): 'color' | 'size' | 'select' => {
    const typeLower = variation.type.toLowerCase();
    if (typeLower.includes('color') || typeLower.includes('colour') || typeLower.includes('لون')) {
      if (variation.options.some((o) => o.colorHex)) return 'color';
    }
    if (typeLower.includes('size') || typeLower.includes('مقاس')) return 'size';
    return 'select';
  };

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {variations.map((variation) => {
        const uiType = detectVariationUI(variation);
        const typeLabel = isRTL && variation.typeAr ? variation.typeAr : variation.type;

        return (
          <div key={variation.type}>
            <h4 className="text-sm font-semibold mb-2 capitalize flex items-center gap-2">
              {typeLabel}
              {variation.selected && (
                <span className="text-muted-foreground font-normal text-xs">
                  : {(() => {
                    const selOpt = variation.options.find((o) => o.value === variation.selected);
                    return selOpt ? (isRTL && selOpt.labelAr ? selOpt.labelAr : selOpt.label) : variation.selected;
                  })()}
                </span>
              )}
            </h4>
            {uiType === 'color' && renderColorSwatches(variation)}
            {uiType === 'size' && renderSizeButtons(variation)}
            {uiType === 'select' && renderDropdownSelect(variation)}
          </div>
        );
      })}
    </div>
  );
}

// Helper to determine if a color is light (for contrast text)
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}
