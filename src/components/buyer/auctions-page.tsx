'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Gavel, Clock, Eye, Heart, Users, TrendingUp, ArrowUp,
  Monitor, Shirt, Palette, Trophy, Gem, Sparkles, Star,
  ChevronRight, Bell, BellRing, Play, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useUserStore } from '@/stores/user-store';
import { formatPrice } from '@/lib/currency';
import { AUCTION_CATEGORIES, AUCTION_CATEGORY_ICONS, AUCTION_CATEGORY_GRADIENTS } from '@/lib/reference-data';

// --- Types ---
interface BidEntry {
  user: string;
  userAr: string;
  amount: number;
  time: string;
  timeAr: string;
}

interface AuctionItem {
  id: string;
  name: string;
  nameAr: string;
  currentBid: number;
  startingBid: number;
  bidCount: number;
  watcherCount: number;
  endTime: number; // seconds from now
  category: string;
  condition: string;
  conditionAr: string;
  isLive: boolean;
  isUpcoming: boolean;
  sellerName: string;
  sellerNameAr: string;
  bidHistory: BidEntry[];
  isWatched?: boolean;
}

// --- Category Config ---
const auctionCategories = AUCTION_CATEGORIES;

// Icon mapping (client-side only)

const categoryIconMap: Record<string, React.ElementType> = {
  Monitor,
  Shirt,
  Palette,
  Trophy,
  Gem,
};

const categoryIcons: Record<string, React.ElementType> = Object.fromEntries(
  Object.entries(AUCTION_CATEGORY_ICONS).map(([k, v]) => [k, categoryIconMap[v] || Sparkles])
);

const categoryGradients = AUCTION_CATEGORY_GRADIENTS;



// --- Countdown Component ---
function AuctionCountdown({ seconds, compact }: { seconds: number; compact?: boolean }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const { t } = useI18n();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const d = Math.floor(timeLeft / 86400);
  const h = Math.floor((timeLeft % 86400) / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;

  if (compact) {
    return (
      <span className="text-xs font-mono tabular-nums text-red-500 dark:text-red-400 font-medium">
        {d > 0 && <>{d}d </>}{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {d > 0 && (
        <div className="bg-red-600 text-white rounded-lg px-2.5 py-1.5 text-center w-12">
          <span className="text-lg font-bold block leading-none tabular-nums">{d}</span>
          <span className="text-[10px] text-red-200">{t('auction_days')}</span>
        </div>
      )}
      <div className="bg-red-600 text-white rounded-lg px-2.5 py-1.5 text-center w-12">
        <span className="text-lg font-bold block leading-none tabular-nums">{String(h).padStart(2, '0')}</span>
        <span className="text-[10px] text-red-200">{t('auction_hours')}</span>
      </div>
      <div className="bg-red-600 text-white rounded-lg px-2.5 py-1.5 text-center w-12">
        <span className="text-lg font-bold block leading-none tabular-nums">{String(m).padStart(2, '0')}</span>
        <span className="text-[10px] text-red-200">{t('auction_minutes')}</span>
      </div>
      <div className="bg-red-600 text-white rounded-lg px-2.5 py-1.5 text-center w-12">
        <span className="text-lg font-bold block leading-none tabular-nums">{String(s).padStart(2, '0')}</span>
        <span className="text-[10px] text-red-200">{t('auction_seconds')}</span>
      </div>
    </div>
  );
}

// --- Placeholder ---
function AuctionPlaceholder({ category, name, nameAr, locale }: { category: string; name: string; nameAr: string; locale: string }) {
  const config = categoryGradients[category] || categoryGradients.electronics;
  const Icon = categoryIcons[category] || Sparkles;
  const displayName = locale === 'ar' ? nameAr : name;

  return (
    <div className={`flex flex-col items-center justify-center h-full bg-gradient-to-br ${config.light} ${config.dark} relative overflow-hidden`}>
      <div className="absolute top-3 end-3 w-12 h-12 rounded-full bg-white/10" />
      <div className="absolute bottom-4 start-3 w-8 h-8 rounded-full bg-white/10" />
      <Icon className={`size-12 ${config.iconColor} mb-2 opacity-60`} />
      <p className="text-xs font-medium text-center px-3 leading-tight max-w-[85%] text-muted-foreground/80 line-clamp-2">{displayName}</p>
    </div>
  );
}

// --- Main Component ---
export function AuctionsPage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const { user } = useUserStore();
  const isRTL = locale === 'ar';

  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [auctionsLoading, setAuctionsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');
  const [activeCategory, setActiveCategory] = useState('all');
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [selectedAuction, setSelectedAuction] = useState<AuctionItem | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidPlaced, setBidPlaced] = useState(false);

  useEffect(() => {
    const fetchAuctions = async () => {
      setAuctionsLoading(true);
      try {
        const res = await fetch('/api/auctions');
        if (res.ok) {
          const data = await res.json();
          setAuctions(Array.isArray(data) ? data : data.items || data.auctions || []);
        } else {
          setAuctions([]);
        }
      } catch {
        setAuctions([]);
      } finally {
        setAuctionsLoading(false);
      }
    };
    fetchAuctions();
  }, []);

  const toggleWatch = useCallback((id: string) => {
    setWatchedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredAuctions = auctions.filter((a) => {
    const catMatch = activeCategory === 'all' || a.category === activeCategory;
    if (activeTab === 'live') return catMatch && a.isLive;
    if (activeTab === 'ending-soon') return catMatch && a.isLive && a.endTime <= 7200;
    if (activeTab === 'upcoming') return catMatch && a.isUpcoming;
    return catMatch;
  });

  const featuredAuction = auctions.length > 0 ? auctions.find((a) => a.isLive) || auctions[0] : null;

  const handlePlaceBid = () => {
    if (!bidAmount || parseFloat(bidAmount) <= (selectedAuction?.currentBid || 0)) return;
    setBidPlaced(true);
    setTimeout(() => setBidPlaced(false), 3000);
  };

  const renderBidHistory = (auction: AuctionItem) => (
    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
      {auction.bidHistory.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t('auction_noBidsYet')}</p>
      ) : (
        auction.bidHistory.map((bid, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                {(isRTL ? bid.userAr : bid.user).charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium">{isRTL ? bid.userAr : bid.user}</p>
                <p className="text-[10px] text-muted-foreground">{isRTL ? bid.timeAr : bid.time}</p>
              </div>
            </div>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(bid.amount)}</span>
          </div>
        ))
      )}
    </div>
  );

  // Loading state
  if (auctionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-20 bg-muted rounded-full animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-[4/3] bg-muted animate-pulse" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (auctions.length === 0 && !auctionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Gavel className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">{t('noResults')}</p>
            <p className="text-sm">{t('auction_noAuctionsAvailable')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        {/* Featured Auction Hero */}
        {featuredAuction && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="relative bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white">
              <div className="absolute inset-0 bg-black/10" />
              {/* Decorative mesh gradient */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 end-0 w-64 h-64 rounded-full bg-white/10 blur-3xl -translate-y-1/3" />
                <div className="absolute bottom-0 start-0 w-48 h-48 rounded-full bg-white/10 blur-3xl translate-y-1/3" />
              </div>
              <div className="relative grid md:grid-cols-2 gap-6 p-6 md:p-8 items-center">
                <div className="space-y-4">
                  <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold animate-pulse gap-1">
                    <Play className="size-3" />
                    {t('auction_liveAuction')}
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {isRTL ? featuredAuction.nameAr : featuredAuction.name}
                  </h2>
                  <div className="flex items-center gap-3 text-emerald-100">
                    <Users className="size-4" />
                    <span className="text-sm">{featuredAuction.bidCount} {t('bidders')}</span>
                    <span className="text-emerald-300">•</span>
                    <Eye className="size-4" />
                    <span className="text-sm">{featuredAuction.watcherCount} {t('watching')}</span>
                  </div>
                  <div>
                    <p className="text-emerald-200 text-sm">{t('currentBid')}</p>
                    <p className="text-4xl font-bold animate-pulse">{formatPrice(featuredAuction.currentBid)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="size-4 text-emerald-200" />
                    <span className="text-sm text-emerald-100">{t('auction_endsIn')}</span>
                  </div>
                  <AuctionCountdown seconds={featuredAuction.endTime} />
                  <Button
                    className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold h-11 rounded-xl gap-2 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                    onClick={() => setSelectedAuction(featuredAuction)}
                  >
                    <Gavel className="size-4" />
                    {t('placeBid')}
                  </Button>
                </div>
                <div className="relative aspect-square max-h-64 mx-auto rounded-xl overflow-hidden">
                  <AuctionPlaceholder
                    category={featuredAuction.category}
                    name={featuredAuction.name}
                    nameAr={featuredAuction.nameAr}
                    locale={locale}
                  />
                  <Badge className="absolute top-3 start-3 bg-red-500 text-white animate-pulse">
                    <Zap className="size-3 me-1" />
                    {t('auction_live')}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs & Categories */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="live" className="gap-1.5">
                  <Zap className="size-3.5 text-red-500" />
                  {t('liveNow')}
                </TabsTrigger>
                <TabsTrigger value="ending-soon" className="gap-1.5">
                  <Clock className="size-3.5 text-amber-500" />
                  {t('endingSoon')}
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="gap-1.5">
                  <TrendingUp className="size-3.5 text-blue-500" />
                  {t('upcoming')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {auctionCategories.map((cat) => (
              <Button
                key={cat.value}
                variant={activeCategory === cat.value ? 'default' : 'outline'}
                size="sm"
                className={`rounded-full text-xs ${activeCategory === cat.value ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                onClick={() => setActiveCategory(cat.value)}
              >
                {isRTL ? cat.labelAr : cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Auction Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAuctions.map((auction) => {
            const config = categoryGradients[auction.category] || categoryGradients.electronics;
            const Icon = categoryIcons[auction.category] || Sparkles;
            const isWatched = watchedIds.has(auction.id);

            return (
              <Card
                key={auction.id}
                className="group border border-border/60 shadow-sm hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] cursor-pointer overflow-hidden h-full flex flex-col backdrop-blur-md bg-card/80"
                onClick={() => setSelectedAuction(auction)}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <AuctionPlaceholder
                    category={auction.category}
                    name={auction.name}
                    nameAr={auction.nameAr}
                    locale={locale}
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                  {/* Live Badge */}
                  {auction.isLive && (
                    <Badge className="absolute top-3 start-3 bg-red-500 text-white animate-pulse gap-1 shadow-lg shadow-red-500/30">
                      <Zap className="size-3" />
                      {t('auction_live')}
                    </Badge>
                  )}
                  {auction.isUpcoming && (
                    <Badge className="absolute top-3 start-3 bg-blue-500 text-white gap-1 shadow-lg shadow-blue-500/30">
                      <Clock className="size-3" />
                      {t('auction_upcoming')}
                    </Badge>
                  )}

                  {/* Watchlist Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 end-3 size-8 bg-black/30 hover:bg-black/50 text-white rounded-full"
                    onClick={(e) => { e.stopPropagation(); toggleWatch(auction.id); }}
                  >
                    {isWatched ? <Heart className="size-4 fill-red-400 text-red-400" /> : <Heart className="size-4" />}
                  </Button>

                  {/* Countdown */}
                  <div className="absolute bottom-3 start-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/10">
                    <AuctionCountdown seconds={auction.endTime} compact />
                  </div>

                  {/* Bidder count */}
                  <div className="absolute bottom-3 end-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
                    <Users className="size-3 text-white" />
                    <span className="text-[10px] text-white font-medium">{auction.bidCount}</span>
                  </div>
                </div>

                <CardContent className="p-4 space-y-2 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {isRTL ? auction.nameAr : auction.name}
                    </h3>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {isRTL ? auction.conditionAr : auction.condition}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{isRTL ? auction.sellerNameAr : auction.sellerName}</span>
                  </div>

                  <div className="flex-1" />

                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">{t('currentBid')}</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(auction.currentBid)}
                        {auction.isLive && <span className="inline-block size-2 rounded-full bg-red-500 ms-1.5 animate-pulse align-middle" />}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-[10px] text-muted-foreground">{t('auction_starting')}</p>
                      <p className="text-xs text-muted-foreground line-through">{formatPrice(auction.startingBid)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs h-8 rounded-lg gap-1 shadow-md shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30"
                      onClick={(e) => { e.stopPropagation(); setSelectedAuction(auction); }}
                    >
                      <Gavel className="size-3" />
                      {t('placeBid')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="size-8 p-0 rounded-lg"
                      onClick={(e) => { e.stopPropagation(); toggleWatch(auction.id); }}
                    >
                      {isWatched ? <Heart className="size-3.5 fill-red-400 text-red-400" /> : <Heart className="size-3.5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredAuctions.length === 0 && (
          <div className="text-center py-16">
            <Gavel className="size-16 mx-auto text-muted-foreground/20" />
            <h3 className="text-lg font-medium mt-4">{t('noResults')}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t('auction_noAuctionsInCategory')}
            </p>
          </div>
        )}
      </div>

      {/* Bid Dialog */}
      <Dialog open={!!selectedAuction} onOpenChange={() => { setSelectedAuction(null); setBidAmount(''); setBidPlaced(false); }}>
        <DialogContent className="max-w-lg">
          {selectedAuction && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gavel className="size-5 text-emerald-600" />
                  {isRTL ? selectedAuction.nameAr : selectedAuction.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Auction Image */}
                <div className="relative aspect-video rounded-xl overflow-hidden">
                  <AuctionPlaceholder
                    category={selectedAuction.category}
                    name={selectedAuction.name}
                    nameAr={selectedAuction.nameAr}
                    locale={locale}
                  />
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t('currentBid')}</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(selectedAuction.currentBid)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t('timeRemaining')}</p>
                    <AuctionCountdown seconds={selectedAuction.endTime} compact />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="size-3.5" /> {selectedAuction.bidCount} {t('bidders')}</span>
                  <span className="flex items-center gap-1"><Eye className="size-3.5" /> {selectedAuction.watcherCount} {t('watching')}</span>
                </div>

                <Separator />

                {/* Bid Input */}
                {selectedAuction.isLive && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">{t('auction_placeYourBid')}</p>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          placeholder={t('enterBidAmount')}
                          className="ps-7"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          min={selectedAuction.currentBid + 1}
                        />
                      </div>
                      <Button
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-1 shadow-md shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5"
                        onClick={handlePlaceBid}
                        disabled={!bidAmount || parseFloat(bidAmount) <= selectedAuction.currentBid}
                      >
                        <ArrowUp className="size-4" />
                        {t('auction_bidButton')}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {t('auction_minimumBidValue', { amount: formatPrice(selectedAuction.currentBid + 1) })}
                    </p>

                    {bidPlaced && (
                      <div className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 p-3 rounded-lg text-sm text-center font-medium">
                        {t('auction_bidSuccess')}
                      </div>
                    )}
                  </div>
                )}

                {selectedAuction.isUpcoming && (
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-sm text-center">
                    <BellRing className="size-5 mx-auto mb-1 text-blue-500" />
                    <p className="font-medium text-blue-700 dark:text-blue-300">
                      {t('auctionNotStarted')}
                    </p>
                    <Button variant="outline" size="sm" className="mt-2 gap-1 text-blue-600 border-blue-300">
                      <Bell className="size-3.5" />
                      {t('notifyMe')}
                    </Button>
                  </div>
                )}

                <Separator />

                {/* Bid History */}
                <div>
                  <p className="text-sm font-medium mb-2">{t('bidHistory')}</p>
                  {renderBidHistory(selectedAuction)}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
