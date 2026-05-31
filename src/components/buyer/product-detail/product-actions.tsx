'use client';

import React from 'react';
import {
  ShoppingCart,
  Zap,
  Heart,
  GitCompare,
  Share2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { APP_NAME } from '@/lib/config';

import { useAppStore } from '@/stores/app-store';
import { RippleButton } from './ripple-button';

interface ProductActionsProps {
  productId: string;
  productName: string;
  displayName: string;
  stock: number;
  isWishlisted: boolean;
  setIsWishlisted: (v: boolean) => void;
  shareOpen: boolean;
  setShareOpen: (v: boolean) => void;
  copied: boolean;
  setCopied: (v: boolean) => void;
  shareWebSuccess: boolean;
  setShareWebSuccess: (v: boolean) => void;
  handleAddToCart: () => void;
  handleBuyNow: () => void;
  isRTL: boolean;
  listingTitle?: string;
  t: (key: string, params?: Record<string, unknown>) => string;
}

export function ProductActions(props: ProductActionsProps) {
  const {
    productId, productName, displayName, stock,
    isWishlisted, setIsWishlisted,
    shareOpen, setShareOpen, copied, setCopied, shareWebSuccess, setShareWebSuccess,
    handleAddToCart, handleBuyNow,
    isRTL,
  } = props;

  const { t } = useI18n();
  const { toggleCompare, compareIds } = useAppStore();
  const isComparing = compareIds.includes(productId);

  return (
    <>
      {/* Action Buttons */}
      <div className="relative p-[2px] rounded-xl action-buttons-gradient-border">
        <div className="flex flex-col sm:flex-row gap-3 rounded-xl bg-background p-1">
          <RippleButton
            size="lg"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-base h-12 rounded-lg"
            onClick={handleAddToCart}
            disabled={stock === 0}
          >
            <ShoppingCart className="size-5 me-2" />
            {t('addToCart')}
          </RippleButton>
          <RippleButton
            size="lg"
            variant="outline"
            className="flex-1 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-base h-12 rounded-lg"
            onClick={handleBuyNow}
            disabled={stock === 0}
          >
            <Zap className="size-5 me-2" />
            {t('buyNow')}
          </RippleButton>
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 ${isWishlisted ? 'text-red-500 border-red-300' : ''}`}
          onClick={() => setIsWishlisted(!isWishlisted)}
        >
          <Heart className={`size-4 ${isWishlisted ? 'fill-red-500' : ''}`} />
          {isWishlisted ? t('wishlisted') : t('wishlist')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 ${isComparing ? 'text-emerald-600 border-emerald-300' : ''}`}
          onClick={() => toggleCompare(productId)}
        >
          <GitCompare className="size-4" />
          {t('compare')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={async () => {
            if (navigator.share) {
              try {
                await navigator.share({
                  title: displayName,
                  text: `${productName} - ${APP_NAME}`,
                  url: window.location.href,
                });
                setShareWebSuccess(true);
                setTimeout(() => setShareWebSuccess(false), 2000);
              } catch {
                setShareOpen(true);
              }
            } else {
              setShareOpen(true);
            }
          }}
        >
          {shareWebSuccess ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
          {shareWebSuccess ? t('copied') : t('shareProduct')}
        </Button>
      </div>
    </>
  );
}
