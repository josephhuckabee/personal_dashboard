import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { decisionJournalSchema } from '@/lib/schemas';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { user, supabase } = await requireUser();
    const input = decisionJournalSchema.partial().parse(await request.json());
    const updates = input.actual_outcome && !input.reviewed_at ? { ...input, reviewed_at: new Date().toISOString() } : input;
    const { data, error } = await supabase.from('decision_journal').update(updates as never).eq('id', params.id).eq('user_id', user.id).select().single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { user, supabase } = await requireUser();
    const { error } = await supabase.from('decision_journal').delete().eq('id', params.id).eq('user_id', user.id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
