import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { getDashboardSnapshot } from '@/lib/dashboard';
import { buildLocalChiefOfStaffSummary } from '@/lib/local-chief-of-staff';
import { getWeeklyTrend, persistDailyExecutiveIntelligence } from '@/lib/executive-intelligence';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const snapshot = await getDashboardSnapshot(supabase, user.id);
    const executive = await persistDailyExecutiveIntelligence(supabase, user.id, snapshot);
    const weeklyTrend = await getWeeklyTrend(supabase, user.id);
    return NextResponse.json({ ...snapshot, localSummary: buildLocalChiefOfStaffSummary(snapshot), executive, weeklyTrend });
  } catch (error) { return apiError(error); }
}
