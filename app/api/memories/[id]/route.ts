import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { memorySchema } from '@/lib/schemas';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { user, supabase } = await requireUser();
    const body = await request.json();
    const action = typeof body.action === 'string' ? body.action : '';
    const input = action ? {} : memorySchema.partial().parse(body);
    const updates = action === 'important'
      ? { is_important: true, importance_score: 95 }
      : action === 'inaccurate'
        ? { inaccurate_at: new Date().toISOString(), confidence_score: 0 }
        : action === 'archive'
          ? { archived_at: new Date().toISOString() }
        : input;
    const { data, error } = await supabase.from('memories').update(updates as never).eq('id', params.id).eq('user_id', user.id).select().single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { user, supabase } = await requireUser();
    const { error } = await supabase.from('memories').delete().eq('id', params.id).eq('user_id', user.id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
