import { openrouterChat } from '@/lib/openrouter';

export async function POST(request: Request) {
  try {
    const { productName, category, features, language } = await request.json();

    if (!productName) {
      return Response.json({ error: 'Product name is required' }, { status: 400 });
    }

    const isArabic = language === 'ar';
    const targetLang = isArabic ? 'Arabic' : 'English';

    const description = await openrouterChat([
      {
        role: 'system',
        content: `You are an expert e-commerce product description writer. Write compelling, SEO-friendly product descriptions for a multi-vendor marketplace. The description should be in ${targetLang}. Include:
- A catchy headline
- Key features as bullet points
- Benefits for the buyer
- A call to action

Keep it concise but persuasive (150-250 words).`,
      },
      {
        role: 'user',
        content: `Write a product description for: ${productName}${category ? `, Category: ${category}` : ''}${features ? `, Features: ${features}` : ''}`,
      },
    ], undefined, { temperature: 0.7 });

    return Response.json({
      description: description || '',
      language: language || 'en',
    });
  } catch (error) {
    console.error('Product Description API error:', error);
    return Response.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}
