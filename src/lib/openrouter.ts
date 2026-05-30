import OpenAI from 'openai';
import { AI_CONFIG } from '@/lib/config';

// OpenRouter uses the OpenAI-compatible API format - lazy init to avoid build-time errors
let _openrouter: OpenAI | null = null;
function getOpenRouter(): OpenAI {
  if (!_openrouter) {
    _openrouter = new OpenAI({
      baseURL: AI_CONFIG.baseURL,
      apiKey: process.env.OPENROUTER_API_KEY || '',
      defaultHeaders: {
        'HTTP-Referer': AI_CONFIG.referer,
        'X-Title': AI_CONFIG.title,
      },
    });
  }
  return _openrouter;
}

const DEFAULT_MODEL = AI_CONFIG.defaultModel;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function openrouterChat(
  messages: ChatMessage[],
  model?: string,
  options?: { temperature?: number; max_tokens?: number }
): Promise<string> {
  try {
    const completion = await getOpenRouter().chat.completions.create({
      model: model || DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? AI_CONFIG.defaultTemperature,
      max_tokens: options?.max_tokens ?? AI_CONFIG.defaultMaxTokens,
    });

    return completion.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw error;
  }
}

export async function openrouterChatJSON(
  messages: ChatMessage[],
  model?: string,
  options?: { temperature?: number; max_tokens?: number }
): Promise<string> {
  try {
    const completion = await getOpenRouter().chat.completions.create({
      model: model || DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? AI_CONFIG.jsonTemperature,
      max_tokens: options?.max_tokens ?? AI_CONFIG.jsonMaxTokens,
    });

    return completion.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw error;
  }
}

export { getOpenRouter as openrouter, DEFAULT_MODEL };
