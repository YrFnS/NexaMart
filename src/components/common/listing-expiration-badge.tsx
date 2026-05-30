'use client';

import React, { useState } from 'react';
import { Clock, RefreshCw, Zap, AlertTriangle, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useI18n } from '@/lib/i18n';

interface ListingExpirationBadgeProps {
  createdAt: string;
  expiresAt?: string;
  onRepost?: () => void;
  onBoost?: () => void;
}

type Freshness = 'fresh' | 'aging' | 'expiring';

function getDaysSince(dateStr: string): number {
  const created = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getDaysUntil(dateStr: string): number {
  const expires = new Date(dateStr);
  const now = new Date();
  const diffMs = expires.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getFreshness(daysSinceCreated: number): Freshness {
  if (daysSinceCreated < 3) return 'fresh';
  if (daysSinceCreated <= 14) return 'aging';
  return 'expiring';
}

const freshnessConfig: Record<Freshness, {
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  labelKey: string;
}> = {
  fresh: {
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-500',
    labelKey: 'fresh',
  },
  aging: {
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50',
    borderColor: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-500',
    labelKey: 'aging',
  },
  expiring: {
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-950/50',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-500',
    labelKey: 'expiringSoon',
  },
};

export function ListingExpirationBadge({
  createdAt,
  expiresAt,
  onRepost,
  onBoost,
}: ListingExpirationBadgeProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const daysSince = getDaysSince(createdAt);
  const freshness = getFreshness(daysSince);
  const config = freshnessConfig[freshness];

  const daysUntilExpiry = expiresAt ? getDaysUntil(expiresAt) : 30 - daysSince;
  const isExpired = daysUntilExpiry <= 0;

  const [isReposting, setIsReposting] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);

  const handleRepost = () => {
    setIsReposting(true);
    setTimeout(() => {
      setIsReposting(false);
      onRepost?.();
    }, 800);
  };

  const handleBoost = () => {
    setIsBoosting(true);
    setTimeout(() => {
      setIsBoosting(false);
      onBoost?.();
    }, 800);
  };

  const freshnessLabel = t(config.labelKey);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Freshness/Expiration Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.borderColor} ${config.color}`}
            >
              {freshness === 'fresh' ? (
                <Clock className={`size-3 ${config.iconColor}`} />
              ) : freshness === 'aging' ? (
                <Timer className={`size-3 ${config.iconColor}`} />
              ) : (
                <AlertTriangle className={`size-3 ${config.iconColor} animate-pulse`} />
              )}
              {isExpired
                ? isRTL
                  ? 'منتهي الصلاحية'
                  : 'Expired'
                : freshness === 'fresh'
                ? isRTL
                  ? `${daysSince === 0 ? 'اليوم' : 'منذ ' + daysSince + ' يوم'}`
                  : daysSince === 0
                  ? 'Today'
                  : `${daysSince}d ago`
                : expiresAt
                ? isRTL
                  ? `${daysUntilExpiry} يوم متبقي`
                  : `${daysUntilExpiry}d left`
                : isRTL
                ? `منذ ${daysSince} يوم`
                : `${daysSince}d ago`}
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            {isExpired
              ? isRTL
                ? 'انتهت صلاحية هذا الإعلان'
                : 'This listing has expired'
              : freshness === 'fresh'
              ? isRTL
                ? 'إعلان جديد - نُشر مؤخراً'
                : 'Fresh listing - recently posted'
              : freshness === 'aging'
              ? isRTL
                ? 'إعلان قديم - فكر في تعزيزه'
                : 'Aging listing - consider boosting'
              : isRTL
              ? 'إعلان على وشك الانتهاء - أعد نشره'
              : 'Expiring soon - consider reposting'}
          </TooltipContent>
        </Tooltip>

        {/* Freshness Status Label */}
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${config.color} ${config.borderColor}`}
        >
          {freshnessLabel}
        </Badge>

        {/* Action Buttons */}
        {(freshness === 'aging' || freshness === 'expiring' || isExpired) && onRepost && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] gap-1 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
            onClick={handleRepost}
            disabled={isReposting}
          >
            <RefreshCw className={`size-3 ${isReposting ? 'animate-spin' : ''}`} />
            {t('repost')}
          </Button>
        )}

        {freshness === 'fresh' && onBoost && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] gap-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            onClick={handleBoost}
            disabled={isBoosting}
          >
            <Zap className={`size-3 ${isBoosting ? 'animate-pulse' : ''}`} />
            {t('boost')}
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}
