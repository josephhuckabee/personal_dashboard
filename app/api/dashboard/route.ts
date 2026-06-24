import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { getDashboardSnapshot } from '@/lib/dashboard';
import { buildLocalChiefOfStaffSummary } from '@/lib/local-chief-of-staff';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const snapshot = await getDashboardSnapshot(supabase, user.id);
    return NextResponse.json({ ...snapshot, localSummary: buildLocalChiefOfStaffSummary(snapshot) });
  } catch (error) { return apiError(error); }
}
