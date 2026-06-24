import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json({ ready: true, openai: Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY), provider: process.env.AI_PROVIDER || 'openai', supabase: true });
  } catch (error) { return apiError(error); }
}
