import { NextResponse } from 'next/server';

const installmentPlans = [
  {
    id: 'tamara-3',
    provider: 'Tamara',
    providerAr: 'تمارا',
    months: 3,
    interestRate: 0,
    maxAmount: 5000,
    minAmount: 50,
    processingFee: 0,
    descriptionEn: 'Pay in 3 interest-free installments',
    descriptionAr: 'ادفع على 3 أقساط بدون فوائد',
  },
  {
    id: 'tamara-6',
    provider: 'Tamara',
    providerAr: 'تمارا',
    months: 6,
    interestRate: 0,
    maxAmount: 5000,
    minAmount: 100,
    processingFee: 0,
    descriptionEn: 'Pay in 6 interest-free installments',
    descriptionAr: 'ادفع على 6 أقساط بدون فوائد',
  },
  {
    id: 'tabby-3',
    provider: 'Tabby',
    providerAr: 'تابي',
    months: 3,
    interestRate: 0,
    maxAmount: 10000,
    minAmount: 50,
    processingFee: 0,
    descriptionEn: 'Split into 4 payments with Tabby',
    descriptionAr: 'قسّط على 4 دفعات مع تابي',
  },
  {
    id: 'tabby-6',
    provider: 'Tabby',
    providerAr: 'تابي',
    months: 6,
    interestRate: 0,
    maxAmount: 10000,
    minAmount: 100,
    processingFee: 0,
    descriptionEn: '6 months, 0% interest with Tabby',
    descriptionAr: '6 أشهر بدون فوائد مع تابي',
  },
  {
    id: 'sc-12',
    provider: 'Standard Chartered',
    providerAr: 'ستاندرد تشارترد',
    months: 12,
    interestRate: 0,
    maxAmount: 25000,
    minAmount: 500,
    processingFee: 0,
    descriptionEn: '12 months interest-free with Standard Chartered',
    descriptionAr: '12 شهر بدون فوائد مع ستاندرد تشارترد',
  },
  {
    id: 'sc-24',
    provider: 'Standard Chartered',
    providerAr: 'ستاندرد تشارترد',
    months: 24,
    interestRate: 2.5,
    maxAmount: 25000,
    minAmount: 1000,
    processingFee: 50,
    descriptionEn: '24 months with low interest from Standard Chartered',
    descriptionAr: '24 شهر بفائدة منخفضة من ستاندرد تشارترد',
  },
];

export async function GET() {
  return NextResponse.json({ plans: installmentPlans });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { price, months } = body;

    if (!price || price <= 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    // Find eligible plans
    const eligible = installmentPlans.filter(
      (plan) => price >= plan.minAmount && price <= plan.maxAmount && plan.months === months
    );

    if (eligible.length === 0) {
      // Return best available plan
      const available = installmentPlans.filter(
        (plan) => price >= plan.minAmount && price <= plan.maxAmount
      );
      if (available.length === 0) {
        return NextResponse.json({
          eligible: false,
          message: 'No eligible plans for this amount',
        });
      }
      // Calculate for all available plans
      const calculations = available.map((plan) => {
        const totalInterest = (price * plan.interestRate * plan.months) / 100;
        const totalAmount = price + totalInterest + plan.processingFee;
        return {
          planId: plan.id,
          provider: plan.provider,
          months: plan.months,
          monthlyPayment: parseFloat((totalAmount / plan.months).toFixed(2)),
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          interestRate: plan.interestRate,
          processingFee: plan.processingFee,
        };
      });
      return NextResponse.json({ eligible: true, calculations });
    }

    const calculations = eligible.map((plan) => {
      const totalInterest = (price * plan.interestRate * plan.months) / 100;
      const totalAmount = price + totalInterest + plan.processingFee;
      return {
        planId: plan.id,
        provider: plan.provider,
        months: plan.months,
        monthlyPayment: parseFloat((totalAmount / plan.months).toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        interestRate: plan.interestRate,
        processingFee: plan.processingFee,
      };
    });

    return NextResponse.json({ eligible: true, calculations });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
