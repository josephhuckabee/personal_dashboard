import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { onboardingSchema } from '@/lib/schemas';
import type { Json } from '@/lib/supabase/database.types';

export async function POST(request: Request) {
  try {
    const { supabase } = await requireUser();
    const input = onboardingSchema.parse(await request.json());
    const { error } = await supabase.rpc('complete_onboarding', { p_payload: input as unknown as Json });
    if (error) throw error;
    return NextResponse.json({ completed: true });
  } catch (error) { return apiError(error); }
}
