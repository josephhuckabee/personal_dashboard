import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { getDashboardSnapshot } from '@/lib/dashboard';
import { buildLocalChiefOfStaffSummary } from '@/lib/local-chief-of-staff';

export async function POST() {
  try {
    const { user, supabase } = await requireUser();
    const summary = buildLocalChiefOfStaffSummary(await getDashboardSnapshot(supabase, user.id));
    return NextResponse.json({ reply: `Focus: ${summary.today_best_focus} Avoid: ${summary.recommended_avoidance}`, summary });
  } catch (error) { return apiError(error); }
}
