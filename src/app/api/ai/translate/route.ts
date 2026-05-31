import { openrouterChat } from '@/lib/openrouter';

export async function POST(request: Request) {
  try {
    const { text, from, to } = await request.json();

    const translation = await openrouterChat([
      {
        role: 'system',
        content: `You are a professional translator. Translate the following text from ${from} to ${to}. Only return the translation, nothing else. Do not add explanations or notes.`,
      },
      { role: 'user', content: text },
    ], undefined, { temperature: 0.3 });

    return Response.json({ translation: translation || text });
  } catch (error) {
    console.error('Translate API error:', error);
    return Response.json({ translation: '' });
  }
}
