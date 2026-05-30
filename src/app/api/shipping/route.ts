import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MENA_CITIES_EXTENDED, MENA_CITY_DISTANCES, MENA_SHIPPING_CARRIERS } from '@/lib/reference-data';

// ─── CONFIG/REFERENCE DATA (not mock) ─────────────────────────────────────────
const MENA_CITIES = MENA_CITIES_EXTENDED.map(c => ({
  id: c.key,
  name: c.name,
  nameAr: c.nameAr,
  country: c.country,
  countryAr: c.countryAr,
}));

const DISTANCES = MENA_CITY_DISTANCES;

const CARRIERS = MENA_SHIPPING_CARRIERS.map(c => ({ ...c }));

function getDistance(origin: string, destination: string): number {
  if (origin === destination) return 0;
  return DISTANCES[origin]?.[destination] ?? 1500;
}

function isLocal(origin: string, destination: string): boolean {
  return origin === destination;
}

function isSameCountry(origin: string, destination: string): boolean {
  const originCity = MENA_CITIES.find(c => c.id === origin);
  const destCity = MENA_CITIES.find(c => c.id === destination);
  return originCity?.country === destCity?.country;
}

interface ShippingRate {
  carrierId: string;
  carrierName: string;
  carrierNameAr: string;
  carrierLogo: string;
  type: 'standard' | 'express' | 'same_day';
  typeName: string;
  typeNameAr: string;
  estimatedDays: string;
  estimatedDaysAr: string;
  minDays: number;
  maxDays: number;
  price: number;
  currency: string;
  trackingIncluded: boolean;
  insuranceIncluded: boolean;
}

function calculateRates(
  origin: string,
  destination: string,
  weight: number,
  length: number,
  width: number,
  height: number
): ShippingRate[] {
  const distance = getDistance(origin, destination);
  const local = isLocal(origin, destination);
  const sameCountry = isSameCountry(origin, destination);
  const volumetricWeight = (length * width * height) / 5000;
  const chargeableWeight = Math.max(weight, volumetricWeight);

  const rates: ShippingRate[] = [];

  const baseRatePerKg = sameCountry ? 2.5 : 4.5;
  const distanceFactor = distance / 1000;

  for (const carrier of CARRIERS) {
    if (!local) {
      const standardPrice = Math.round((baseRatePerKg * chargeableWeight * distanceFactor * (carrier.id === 'aramex' ? 0.9 : carrier.id === 'dhl' ? 1.2 : 1.0)) * 100) / 100;
      const standardDays = sameCountry ? '3-5' : '5-8';
      const standardMinDays = sameCountry ? 3 : 5;
      const standardMaxDays = sameCountry ? 5 : 8;
      rates.push({
        carrierId: carrier.id,
        carrierName: carrier.name,
        carrierNameAr: carrier.nameAr,
        carrierLogo: carrier.logo,
        type: 'standard',
        typeName: 'Standard Delivery',
        typeNameAr: 'توصيل عادي',
        estimatedDays: standardDays + ' days',
        estimatedDaysAr: standardDays + ' أيام',
        minDays: standardMinDays,
        maxDays: standardMaxDays,
        price: Math.max(standardPrice, 5.99),
        currency: 'USD',
        trackingIncluded: true,
        insuranceIncluded: chargeableWeight > 10,
      });

      const expressPrice = Math.round((standardPrice * 1.8) * 100) / 100;
      const expressDays = sameCountry ? '1-2' : '2-4';
      rates.push({
        carrierId: carrier.id,
        carrierName: carrier.name,
        carrierNameAr: carrier.nameAr,
        carrierLogo: carrier.logo,
        type: 'express',
        typeName: 'Express Delivery',
        typeNameAr: 'توصيل سريع',
        estimatedDays: expressDays + ' days',
        estimatedDaysAr: expressDays + ' أيام',
        minDays: sameCountry ? 1 : 2,
        maxDays: sameCountry ? 2 : 4,
        price: Math.max(expressPrice, 12.99),
        currency: 'USD',
        trackingIncluded: true,
        insuranceIncluded: true,
      });
    } else {
      const standardPrice = Math.round((1.5 * chargeableWeight) * 100) / 100;
      rates.push({
        carrierId: carrier.id,
        carrierName: carrier.name,
        carrierNameAr: carrier.nameAr,
        carrierLogo: carrier.logo,
        type: 'standard',
        typeName: 'Standard Delivery',
        typeNameAr: 'توصيل عادي',
        estimatedDays: '3-5 days',
        estimatedDaysAr: '3-5 أيام',
        minDays: 3,
        maxDays: 5,
        price: Math.max(standardPrice, 3.99),
        currency: 'USD',
        trackingIncluded: true,
        insuranceIncluded: false,
      });

      const expressPrice = Math.round((standardPrice * 1.6) * 100) / 100;
      rates.push({
        carrierId: carrier.id,
        carrierName: carrier.name,
        carrierNameAr: carrier.nameAr,
        carrierLogo: carrier.logo,
        type: 'express',
        typeName: 'Express Delivery',
        typeNameAr: 'توصيل سريع',
        estimatedDays: '1-2 days',
        estimatedDaysAr: '1-2 أيام',
        minDays: 1,
        maxDays: 2,
        price: Math.max(expressPrice, 8.99),
        currency: 'USD',
        trackingIncluded: true,
        insuranceIncluded: true,
      });

      if (['aramex', 'smsa', 'fetchr'].includes(carrier.id)) {
        const sameDayPrice = Math.round((standardPrice * 3.0) * 100) / 100;
        rates.push({
          carrierId: carrier.id,
          carrierName: carrier.name,
          carrierNameAr: carrier.nameAr,
          carrierLogo: carrier.logo,
          type: 'same_day',
          typeName: 'Same-Day Delivery',
          typeNameAr: 'توصيل في نفس اليوم',
          estimatedDays: 'Today',
          estimatedDaysAr: 'اليوم',
          minDays: 0,
          maxDays: 0,
          price: Math.max(sameDayPrice, 15.99),
          currency: 'USD',
          trackingIncluded: true,
          insuranceIncluded: true,
        });
      }
    }
  }

  const typeOrder = { standard: 0, express: 1, same_day: 2 };
  rates.sort((a, b) => typeOrder[a.type] - typeOrder[b.type] || a.price - b.price);

  return rates;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'cities') {
    return NextResponse.json({ cities: MENA_CITIES });
  }

  if (action === 'shipments') {
    // Get real order tracking from DB
    try {
      const orders = await db.order.findMany({
        where: {
          status: { in: ['shipped', 'processing'] },
          trackingNumber: { not: null },
        },
        include: {
          store: { select: { name: true } },
          user: { select: { name: true } },
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });

      const shipments = orders.map((order) => {
        const isShipped = order.status === 'shipped';
        const steps = [
          { key: 'picked_up', label: 'Picked Up', labelAr: 'تم الاستلام', completed: true, date: order.createdAt.toISOString().split('T')[0] },
          { key: 'in_transit', label: 'In Transit', labelAr: 'في الطريق', completed: isShipped, date: '' },
          { key: 'out_for_delivery', label: 'Out for Delivery', labelAr: 'خرج للتوصيل', completed: false, date: '' },
          { key: 'delivered', label: 'Delivered', labelAr: 'تم التسليم', completed: false, date: '' },
        ];

        return {
          id: `SHP-${order.id.substring(0, 6)}`,
          orderId: order.orderNumber,
          carrier: order.carrier || 'N/A',
          carrierAr: '',
          trackingNumber: order.trackingNumber || '',
          origin: '',
          originAr: '',
          destination: '',
          destinationAr: '',
          status: isShipped ? 'in_transit' : 'processing',
          statusAr: isShipped ? 'في الطريق' : 'قيد المعالجة',
          currentStep: isShipped ? 2 : 1,
          totalSteps: 4,
          steps,
          estimatedDelivery: '',
          weight: '',
        };
      });

      return NextResponse.json({ shipments });
    } catch {
      return NextResponse.json({ shipments: [] });
    }
  }

  return NextResponse.json({ cities: MENA_CITIES });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, weight, length, width, height } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      );
    }

    const pkgWeight = Number(weight) || 1;
    const pkgLength = Number(length) || 30;
    const pkgWidth = Number(width) || 20;
    const pkgHeight = Number(height) || 15;

    if (pkgWeight <= 0 || pkgLength <= 0 || pkgWidth <= 0 || pkgHeight <= 0) {
      return NextResponse.json(
        { error: 'All package dimensions and weight must be positive' },
        { status: 400 }
      );
    }

    const rates = calculateRates(origin, destination, pkgWeight, pkgLength, pkgWidth, pkgHeight);

    return NextResponse.json({
      rates,
      origin: MENA_CITIES.find(c => c.id === origin),
      destination: MENA_CITIES.find(c => c.id === destination),
      package: { weight: pkgWeight, length: pkgLength, width: pkgWidth, height: pkgHeight },
      isLocal: isLocal(origin, destination),
      isSameCountry: isSameCountry(origin, destination),
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
