'use client';

import React from 'react';
import { Coins, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { CURRENCIES, getCurrencyList, type CurrencyCode } from '@/lib/currency';

export function CurrencySelector() {
  const { locale, dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const { currency, setCurrency } = useAppStore();

  const currentCurrency = CURRENCIES[currency];
  const currencyList = getCurrencyList();

  const handleSelect = (code: CurrencyCode) => {
    setCurrency(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-sm">
          <Coins className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline font-medium">
            {isRTL ? currentCurrency.symbolAr : currentCurrency.symbol}
          </span>
          <span className="hidden md:inline text-muted-foreground text-xs">
            {currency}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-56 max-h-80 overflow-y-auto">
        {currencyList.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => handleSelect(curr.code)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold w-8 text-center">
                {isRTL ? curr.symbolAr : curr.symbol}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {isRTL ? curr.nameAr : curr.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {curr.code} · 1 USD = {curr.exchangeRate.toLocaleString()} {curr.code}
                </span>
              </div>
            </div>
            {currency === curr.code && (
              <Check className="size-4 text-emerald-500 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
