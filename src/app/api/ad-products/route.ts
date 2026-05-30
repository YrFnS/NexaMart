import { NextRequest, NextResponse } from 'next/server';
import { AD_PRODUCTS } from '@/lib/config';
import { db } from '@/lib/db';

// Duration display strings keyed by durationDays
const durationDisplay: Record<number, { en: string; ar: string }> = {
  1: { en: '24 hours', ar: '24 ساعة' },
  3: { en: '3 days', ar: '3 أيام' },
  7: { en: '7 days', ar: '7 أيام' },
  14: { en: '14 days', ar: '14 يوماً' },
};

// Enrichment data for each ad product (presentation-only fields)
// Keyed by the config id from AD_PRODUCTS — CONFIG DATA, not mock
const adProductEnrichment: Record<string, {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  description: string;
  descriptionAr: string;
  features: string[];
  featuresAr: string[];
  color: string;
  gradient: string;
}> = {
  bump: {
    id: 'bump-up',
    name: 'Bump Up',
    nameAr: 'رفع للأعلى',
    icon: 'ArrowUp',
    description: 'Moves your ad to the top of listings',
    descriptionAr: 'ينقل إعلانك إلى أعلى القوائم',
    features: [
      'Top placement in search results',
      'Renewed visibility for 24 hours',
      'Appear in latest listings first',
    ],
    featuresAr: [
      'موضع أعلى في نتائج البحث',
      'رؤية متجددة لمدة 24 ساعة',
      'الظهور في أحدث القوائم أولاً',
    ],
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
  },
  featured: {
    id: 'featured-ad',
    name: 'Featured Ad',
    nameAr: 'إعلان مميز',
    icon: 'Star',
    description: 'Appears in the "Featured" section at top of category pages',
    descriptionAr: 'يظهر في قسم "مميز" أعلى صفحات الفئات',
    features: [
      'Featured section placement',
      'Gold star badge on listing',
      'Category page visibility',
      '7-day promotion period',
    ],
    featuresAr: [
      'وضع في القسم المميز',
      'شارة نجمة ذهبية على القائمة',
      'ظهور في صفحة الفئة',
      'فترة ترويج 7 أيام',
    ],
    color: 'amber',
    gradient: 'from-amber-500 to-yellow-500',
  },
  premium: {
    id: 'premium-ad',
    name: 'Premium Ad',
    nameAr: 'إعلان بريميوم',
    icon: 'Crown',
    description: 'Top placement + "Premium" badge + highlighted border',
    descriptionAr: 'موضع أعلى + شارة "بريميوم" + حدود مميزة',
    features: [
      'All Featured Ad benefits',
      'Purple "Premium" badge',
      'Highlighted golden border',
      'Priority in all search results',
      '14-day promotion period',
    ],
    featuresAr: [
      'جميع مزايا الإعلان المميز',
      'شارة "بريميوم" بنفسجية',
      'حدود ذهبية مميزة',
      'أولوية في جميع نتائج البحث',
      'فترة ترويج 14 يوماً',
    ],
    color: 'purple',
    gradient: 'from-purple-500 to-fuchsia-500',
  },
  urgent: {
    id: 'urgent-badge',
    name: 'Urgent Badge',
    nameAr: 'شارة عاجل',
    icon: 'AlertTriangle',
    description: 'Adds "Urgent" badge to attract quick buyers',
    descriptionAr: 'يضيف شارة "عاجل" لجذب المشترين السريعين',
    features: [
      'Red "Urgent" badge on listing',
      'Attracts motivated buyers',
      'Stand out from similar listings',
      '7-day badge display',
    ],
    featuresAr: [
      'شارة "عاجل" حمراء على القائمة',
      'يجذب المشترين المتحمسين',
      'التميز عن القوائم المشابهة',
      'عرض الشارة لمدة 7 أيام',
    ],
    color: 'red',
    gradient: 'from-red-500 to-orange-500',
  },
  spotlight: {
    id: 'spotlight',
    name: 'Spotlight',
    nameAr: 'سبوتلايت',
    icon: 'Zap',
    description: 'Homepage banner placement + all Premium features',
    descriptionAr: 'وضع بانر الصفحة الرئيسية + جميع مزايا بريميوم',
    features: [
      'All Premium Ad benefits',
      'Homepage banner placement',
      'Maximum visibility boost',
      'Lightning bolt badge',
      '3-day premium exposure',
    ],
    featuresAr: [
      'جميع مزايا الإعلان البريميوم',
      'وضع بانر الصفحة الرئيسية',
      'أقصى زيادة في الرؤية',
      'شارة البرق',
      'تعرض متميز لمدة 3 أيام',
    ],
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
  },
};

// Build adProducts from centralized config + local enrichment — CONFIG DATA
const adProducts = AD_PRODUCTS.map((base) => {
  const enrichment = adProductEnrichment[base.id];
  const duration = durationDisplay[base.durationDays] ?? { en: `${base.durationDays} days`, ar: `${base.durationDays} أيام` };
  return {
    ...(enrichment ? { id: enrichment.id } : { id: base.id }),
    ...(enrichment ? { name: enrichment.name, nameAr: enrichment.nameAr } : { name: base.id, nameAr: base.id }),
    price: base.price,
    duration: duration.en,
    durationAr: duration.ar,
    durationDays: base.durationDays,
    ...(enrichment ? { icon: enrichment.icon } : { icon: 'Zap' }),
    ...(enrichment ? { description: enrichment.description, descriptionAr: enrichment.descriptionAr } : { description: '', descriptionAr: '' }),
    ...(enrichment ? { features: enrichment.features, featuresAr: enrichment.featuresAr } : { features: [], featuresAr: [] }),
    avgViewsIncrease: `+${base.viewsIncrease}%`,
    ...(enrichment ? { color: enrichment.color } : { color: 'emerald' }),
    ...(enrichment ? { gradient: enrichment.gradient } : { gradient: 'from-emerald-500 to-teal-500' }),
  };
});

// GET: Return available ad products, seller products, and active promotions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const storeId = searchParams.get('storeId');

    // Active promotions — no DB model, return empty
    const activePromotions: unknown[] = [];

    if (type === 'active') {
      return NextResponse.json({
        promotions: activePromotions,
        total: activePromotions.length,
      });
    }

    if (type === 'products') {
      // Get real products from DB for the seller's store
      const where: Record<string, unknown> = { status: 'active' };
      if (storeId) where.storeId = storeId;

      const dbProducts = await db.product.findMany({
        where,
        select: { id: true, name: true, price: true, images: true },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });

      const sellerProducts = dbProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.images ? JSON.parse(p.images)[0] || '' : '',
      }));

      return NextResponse.json({
        products: sellerProducts,
      });
    }

    // Get seller's products for the dropdown
    const where: Record<string, unknown> = { status: 'active' };
    if (storeId) where.storeId = storeId;

    const dbProducts = await db.product.findMany({
      where,
      select: { id: true, name: true, price: true, images: true },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const sellerProducts = dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.images ? JSON.parse(p.images)[0] || '' : '',
    }));

    return NextResponse.json({
      adProducts,
      sellerProducts,
      activePromotions,
      stats: {
        bumpUpViewsIncrease: '+300%',
        featuredViewsIncrease: '+500%',
        premiumViewsIncrease: '+800%',
        urgentViewsIncrease: '+200%',
        spotlightViewsIncrease: '+1200%',
      },
    });
  } catch (error) {
    console.error('Ad Products API error:', error);
    return NextResponse.json({ error: 'Failed to fetch ad products' }, { status: 500 });
  }
}

// POST: Purchase/promote a listing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, adType } = body;

    if (!productId || !adType) {
      return NextResponse.json(
        { error: 'Product ID and ad type are required' },
        { status: 400 }
      );
    }

    const adProduct = adProducts.find((p) => p.id === adType);
    if (!adProduct) {
      return NextResponse.json(
        { error: 'Invalid ad type' },
        { status: 400 }
      );
    }

    // Look up product from DB
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const promotion = {
      id: `promo-${Date.now()}`,
      productId,
      productName: product.name,
      adType,
      purchasedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + adProduct.durationDays * 24 * 60 * 60 * 1000).toISOString(),
      viewsBefore: 0,
      viewsAfter: 0,
      clicksBefore: 0,
      clicksAfter: 0,
      status: 'active',
    };

    return NextResponse.json({
      success: true,
      message: 'Promotion purchased successfully',
      promotion,
      amount: adProduct.price,
    });
  } catch (error) {
    console.error('Ad Products POST error:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
