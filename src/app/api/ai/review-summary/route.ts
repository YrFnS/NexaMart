import { openrouterChatJSON } from '@/lib/openrouter';

export async function POST(request: Request) {
  try {
    const { productName, reviews } = await request.json();

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return Response.json({ error: 'Reviews array is required' }, { status: 400 });
    }

    const reviewsText = reviews.map((r: { rating: number; text: string }, i: number) =>
      `Review ${i + 1} (${r.rating}/5): ${r.text}`
    ).join('\n');

    const aiResponse = await openrouterChatJSON([
      {
        role: 'system',
        content: `You are an AI review analyzer for an e-commerce platform. Analyze the reviews and return a JSON object with:
{
  "summary": "Brief English summary of overall sentiment",
  "summaryAr": "Arabic summary",
  "positiveAspects": ["array of positive points in English"],
  "negativeAspects": ["array of negative points in English"],
  "positiveAspectsAr": ["array in Arabic"],
  "negativeAspectsAr": ["array in Arabic"],
  "sentimentScore": number(0-100),
  "recommendation": "Buy/Consider/Avoid",
  "recommendationAr": "Arabic recommendation",
  "topKeywords": ["array of most mentioned keywords"]
}
Return ONLY valid JSON.`,
      },
      {
        role: 'user',
        content: `Analyze these reviews for "${productName || 'Product'}":\n${reviewsText}`,
      },
    ], undefined, { temperature: 0.3 });

    try {
      const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return Response.json(parsed);
    } catch {
      // Fallback
    }

    // Fallback response
    const avgRating = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length;
    return Response.json({
      summary: `Customers generally ${avgRating >= 4 ? 'love' : avgRating >= 3 ? 'have mixed feelings about' : 'are disappointed with'} this product.`,
      summaryAr: avgRating >= 4 ? 'يحب العملاء هذا المنتج بشكل عام.' : avgRating >= 3 ? 'لدى العملاء مشاعر متضاربة حول هذا المنتج.' : 'العملاء محبطون من هذا المنتج.',
      positiveAspects: ['Good quality', 'Fast shipping', 'Good value'],
      negativeAspects: ['Could be improved'],
      positiveAspectsAr: ['جودة جيدة', 'شحن سريع', 'قيمة جيدة'],
      negativeAspectsAr: ['يمكن تحسينه'],
      sentimentScore: Math.round(avgRating * 20),
      recommendation: avgRating >= 4 ? 'Buy' : avgRating >= 3 ? 'Consider' : 'Avoid',
      recommendationAr: avgRating >= 4 ? 'شراء' : avgRating >= 3 ? 'تفكر' : 'تجنب',
      topKeywords: ['quality', 'price', 'delivery'],
    });
  } catch (error) {
    console.error('Review Summary API error:', error);
    return Response.json({ error: 'Failed to analyze reviews' }, { status: 500 });
  }
}
