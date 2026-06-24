import OpenAI from 'openai';
import { receiptExtractionSchema } from '@/lib/schemas';
import { serverEnv } from '@/lib/env';

function jsonFromText(text: string) {
  return JSON.parse(text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim());
}

export async function extractReceipt(bytes: Uint8Array, mimeType: string, filename: string) {
  const env = serverEnv();
  if (!env.OPENAI_API_KEY) return null;
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const encoded = Buffer.from(bytes).toString('base64');
  const fileContent = mimeType === 'application/pdf'
    ? { type: 'input_file', filename, file_data: `data:application/pdf;base64,${encoded}` }
    : { type: 'input_image', image_url: `data:${mimeType};base64,${encoded}`, detail: 'high' };
  const response = await openai.responses.create({
    model: env.AI_MODEL,
    input: [{ role: 'user', content: [
      { type: 'input_text', text: 'Read this receipt. Return JSON only with merchant, date (YYYY-MM-DD), total, category, payment_method, and notes. Use null when missing. Do not infer values that are not visible.' },
      fileContent,
    ] }],
  } as never);
  return {
    extraction: receiptExtractionSchema.parse(jsonFromText(response.output_text)),
    model: env.AI_MODEL,
    inputTokens: response.usage?.input_tokens || 0,
    outputTokens: response.usage?.output_tokens || 0,
  };
}
