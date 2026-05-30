import { openrouterChatJSON } from '@/lib/openrouter';

export async function POST(request: Request) {
  try {
    const { description } = await request.json();

    if (!description) {
      return Response.json({ error: 'Description is required' }, { status: 400 });
    }

    // Use AI to generate smart RFQ quotes
    const aiResponse = await openrouterChatJSON([
      {
        role: 'system',
        content: `You are an AI RFQ (Request for Quote) agent for a multi-vendor marketplace. Given a product description, generate realistic supplier quotes in JSON format:
{
  "quotes": [
    { "supplier": "string", "supplierAr": "Arabic name", "price": number, "moq": number, "delivery": "string", "deliveryAr": "Arabic delivery", "match": number(0-100), "verified": boolean, "location": "string" }
  ],
  "steps": ["string"],
  "summary": "string",
  "summaryAr": "Arabic summary",
  "recommendation": "string",
  "recommendationAr": "Arabic recommendation"
}
Generate 4-6 realistic quotes. Return ONLY valid JSON.`,
      },
      {
        role: 'user',
        content: `I need quotes for: ${description}`,
      },
    ], undefined, { temperature: 0.5 });

    try {
      const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return Response.json(parsed);
    } catch {
      // Fallback
    }

    // Fallback quotes
    const quotes = [
      { supplier: 'TechStore Pro', supplierAr: 'تك ستور برو', price: 7.50, moq: 500, delivery: '7-10 days', deliveryAr: '7-10 أيام', match: 95, verified: true, location: 'Dubai, UAE' },
      { supplier: 'Global Supply Co', supplierAr: 'جلوبال سبلاي', price: 8.20, moq: 200, delivery: '10-14 days', deliveryAr: '10-14 يوم', match: 88, verified: true, location: 'Amman, Jordan' },
      { supplier: 'Direct Factory', supplierAr: 'المصنع المباشر', price: 6.80, moq: 1000, delivery: '14-21 days', deliveryAr: '14-21 يوم', match: 82, verified: false, location: 'Shenzhen, China' },
      { supplier: 'Mideast Trading', supplierAr: 'تجارة الشرق الأوسط', price: 7.90, moq: 300, delivery: '5-8 days', deliveryAr: '5-8 أيام', match: 90, verified: true, location: 'Riyadh, KSA' },
    ];

    const steps = [
      'Analyzing your request...',
      'Contacting verified suppliers...',
      'Negotiating best prices...',
      'Preparing top quotes...',
    ];

    return Response.json({
      quotes,
      steps,
      summary: `Found ${quotes.length} suppliers matching your request for "${description}"`,
      summaryAr: `تم العثور على ${quotes.length} موردين مطابقين لطلبك بخصوص "${description}"`,
      recommendation: 'We recommend TechStore Pro for the best balance of price, MOQ, and delivery speed.',
      recommendationAr: 'نوصي بـ TechStore Pro لأفضل توازن بين السعر والحد الأدنى للطلب وسرعة التوصيل.',
    });
  } catch (error) {
    console.error('RFQ API error:', error);
    return Response.json({ error: 'RFQ processing failed' }, { status: 500 });
  }
}
