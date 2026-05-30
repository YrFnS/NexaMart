import { openrouterChat } from '@/lib/openrouter';
import { APP_NAME } from '@/lib/config';
import { sanitizeString, validateSearchParam } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Sanitize and validate the message input
    const safeMessage = sanitizeString(validateSearchParam(message, 2000));

    const reply = await openrouterChat([
      {
        role: 'system',
        content: `You are ${APP_NAME} AI Shopping Assistant. Help users find products, track orders, compare items, and answer questions about the multi-vendor marketplace. Be helpful, concise, and friendly. Respond in the same language the user writes in (English or Arabic). If asked about products, suggest relevant categories or features to look for.`,
      },
      { role: 'user', content: safeMessage },
    ]);

    if (reply) {
      return Response.json({ reply });
    }

    // Fallback
    const replies: Record<string, string> = {
      default: `I'm your ${APP_NAME} AI assistant! I can help you find products, compare prices, track orders, and more. What would you like help with?`,
      gift: "I'd love to help you find the perfect gift! What's the occasion and who is it for? Our popular gift categories include Electronics, Fashion, and Jewelry.",
      order: "I can help you track your order! Please provide your order number, or I can look up your recent orders.",
      bulk: "For bulk pricing, I recommend checking our B2B section or using the RFQ Agent for custom quotes. Many sellers offer tiered pricing for larger quantities!",
    };

    const lowerMsg = message.toLowerCase();
    let fallback = replies.default;
    if (lowerMsg.includes('gift')) fallback = replies.gift;
    else if (lowerMsg.includes('order') || lowerMsg.includes('track')) fallback = replies.order;
    else if (lowerMsg.includes('bulk') || lowerMsg.includes('wholesale')) fallback = replies.bulk;

    return Response.json({ reply: fallback });
  } catch (error) {
    console.error('AI Chat error:', error);
    return Response.json({ reply: "I'm having trouble connecting. Please try again!" }, { status: 500 });
  }
}
