import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { decisionJournalSchema } from '@/lib/schemas';

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const { data, error } = await supabase.from('decision_journal').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const input = decisionJournalSchema.parse(await request.json());
    const { data, error } = await supabase.from('decision_journal').insert({ ...input, user_id: user.id } as never).select().single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) { return apiError(error); }
}
