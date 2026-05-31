import { db } from '@/lib/db';
import { LOYALTY_TIER_COLORS } from '@/lib/theme';

// ─── Tier definitions — CONFIG/REFERENCE DATA (not mock) ────────────────────────
const tiers = [
  {
    id: 'bronze',
    name: 'Bronze',
    nameAr: 'برونزي',
    minPoints: 0,
    maxPoints: 499,
    pointMultiplier: 1.0,
    color: LOYALTY_TIER_COLORS.bronze,
    icon: '🥉',
    benefits: [
      '1x points on all purchases',
      'Standard customer support',
      'Birthday bonus (50 points)',
    ],
    benefitsAr: [
      'نقاط ١x على جميع المشتريات',
      'دعم عملاء قياسي',
      'مكافأة عيد ميلاد (٥٠ نقطة)',
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    nameAr: 'فضي',
    minPoints: 500,
    maxPoints: 1499,
    pointMultiplier: 1.25,
    color: LOYALTY_TIER_COLORS.silver,
    icon: '🥈',
    benefits: [
      '1.25x points on all purchases',
      'Priority customer support',
      'Birthday bonus (100 points)',
      'Free shipping on orders $25+',
      'Early access to sales',
    ],
    benefitsAr: [
      'نقاط ١.٢٥x على جميع المشتريات',
      'دعم عملاء ذو أولوية',
      'مكافأة عيد ميلاد (١٠٠ نقطة)',
      'شحن مجاني للطلبات فوق ٢٥$',
      'وصول مبكر للتخفيضات',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    nameAr: 'ذهبي',
    minPoints: 1500,
    maxPoints: 2999,
    pointMultiplier: 1.5,
    color: LOYALTY_TIER_COLORS.gold,
    icon: '🥇',
    benefits: [
      '1.5x points on all purchases',
      'VIP customer support',
      'Birthday bonus (200 points)',
      'Free shipping on all orders',
      'Exclusive deals & discounts',
      'Monthly reward box',
    ],
    benefitsAr: [
      'نقاط ١.٥x على جميع المشتريات',
      'دعم عملاء VIP',
      'مكافأة عيد ميلاد (٢٠٠ نقطة)',
      'شحن مجاني على جميع الطلبات',
      'عروض وتخفيضات حصرية',
      'صندوق مكافآت شهري',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    nameAr: 'بلاتيني',
    minPoints: 3000,
    maxPoints: 5999,
    pointMultiplier: 2.0,
    color: LOYALTY_TIER_COLORS.platinum,
    icon: '💎',
    benefits: [
      '2x points on all purchases',
      'Dedicated account manager',
      'Birthday bonus (500 points)',
      'Free express shipping',
      'Exclusive deals & discounts',
      'Monthly reward box',
      'Priority access to new products',
      'Annual loyalty bonus',
    ],
    benefitsAr: [
      'نقاط ٢x على جميع المشتريات',
      'مدير حساب مخصص',
      'مكافأة عيد ميلاد (٥٠٠ نقطة)',
      'شحن سريع مجاني',
      'عروض وتخفيضات حصرية',
      'صندوق مكافآت شهري',
      'وصول ذو أولوية للمنتجات الجديدة',
      'مكافأة ولاء سنوية',
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond',
    nameAr: 'ألماسي',
    minPoints: 6000,
    maxPoints: null,
    pointMultiplier: 3.0,
    color: LOYALTY_TIER_COLORS.diamond,
    icon: '👑',
    benefits: [
      '3x points on all purchases',
      '24/7 dedicated concierge',
      'Birthday bonus (1000 points)',
      'Free same-day shipping',
      'All exclusive deals & discounts',
      'Premium monthly reward box',
      'First access to new products',
      'Annual luxury loyalty bonus',
      'Personal shopping assistant',
      'Invitation to VIP events',
    ],
    benefitsAr: [
      'نقاط ٣x على جميع المشتريات',
      'كونسيرج مخصص ٢٤/٧',
      'مكافأة عيد ميلاد (١٠٠٠ نقطة)',
      'شحن في نفس اليوم مجاناً',
      'جميع العروض والتخفيضات الحصرية',
      'صندوق مكافآت متميز شهري',
      'أول وصول للمنتجات الجديدة',
      'مكافأة ولاء فاخرة سنوية',
      'مساعد تسوق شخصي',
      'دعوة لفعاليات VIP',
    ],
  },
];

// ─── Reward definitions — CONFIG/REFERENCE DATA (not mock) ─────────────────────
const availableRewards = [
  { id: 'r-1', name: '$2 Discount', nameAr: 'خصم ٢$', pointsCost: 200 },
  { id: 'r-2', name: '$5 Discount', nameAr: 'خصم ٥$', pointsCost: 450 },
  { id: 'r-3', name: 'Free Shipping', nameAr: 'شحن مجاني', pointsCost: 150 },
  { id: 'r-4', name: '$10 Discount', nameAr: 'خصم ١٠$', pointsCost: 850 },
  { id: 'r-5', name: 'Mystery Box', nameAr: 'صندوق غامض', pointsCost: 1200 },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let userData: {
      userId: string;
      userName: string | null;
      currentTier: string;
      points: number;
      pointsToNextTier: number;
      nextTier: string | null;
      pointMultiplier: number;
      recentPointsHistory: never[];
      availableRewards: { id: string; name: string; nameAr: string; pointsCost: number }[];
    } | null = null;
    if (userId) {
      try {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            loyaltyTier: true,
            loyaltyPoints: true,
          },
        });

        if (user) {
          const currentTier = tiers.find(t => t.id === user.loyaltyTier) || tiers[0];
          const currentTierIndex = tiers.findIndex(t => t.id === user.loyaltyTier);
          const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;

          userData = {
            userId: user.id,
            userName: user.name,
            currentTier: user.loyaltyTier,
            points: user.loyaltyPoints,
            pointsToNextTier: nextTier ? Math.max(0, nextTier.minPoints - user.loyaltyPoints) : 0,
            nextTier: nextTier?.id || null,
            pointMultiplier: currentTier.pointMultiplier,
            recentPointsHistory: [],
            availableRewards,
          };
        }
      } catch {
        // DB query failed, return no user data
      }
    }

    return Response.json({
      tiers,
      user: userData,
    });
  } catch (error) {
    console.error('Loyalty API error:', error);
    return Response.json({ error: 'Failed to fetch loyalty data' }, { status: 500 });
  }
}
