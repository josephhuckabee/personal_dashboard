import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { generateChiefOfStaffDecisionEngine } from '@/lib/ai/decision-engine';
import { serverEnv } from '@/lib/env';

export async function POST() {
  try {
    const { user, supabase } = await requireUser();
    const env = serverEnv();
    const willUseAi = env.AI_PROVIDER === 'anthropic' ? Boolean(env.ANTHROPIC_API_KEY) : Boolean(env.OPENAI_API_KEY);
    if (willUseAi) {
      const { error } = await supabase.rpc('reserve_ai_request', { p_feature: 'prioritize_my_day' });
      if (error) return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json({ data: await generateChiefOfStaffDecisionEngine(user.id) });
  } catch (error) { return apiError(error); }
}
