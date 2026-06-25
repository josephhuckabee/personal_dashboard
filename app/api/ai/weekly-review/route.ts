import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { generateWeeklyReview } from '@/lib/ai/weekly-review';

export async function POST() {
  try {
    const { user } = await requireUser();
    return NextResponse.json({ data: await generateWeeklyReview(user.id) });
  } catch (error) { return apiError(error); }
}
