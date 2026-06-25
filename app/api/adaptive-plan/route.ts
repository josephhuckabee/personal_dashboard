import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { generateAdaptivePlanForUser } from '@/lib/adaptive-plan';

export async function POST() {
  try {
    const { user, supabase } = await requireUser();
    const data = await generateAdaptivePlanForUser(supabase, user.id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
