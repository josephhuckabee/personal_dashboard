import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { entitySchemas } from '@/lib/schemas';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { user, supabase } = await requireUser();
    const { data: previous, error: findError } = await supabase.from('transactions').select('*').eq('id', id).eq('user_id', user.id).single();
    if (findError) throw findError;
    const input = entitySchemas.transactions.parse({ ...previous, ...await request.json() });
    if (input.account_id) {
      const { error } = await supabase.from('finance_accounts').select('id').eq('id', input.account_id).eq('user_id', user.id).single();
      if (error) throw error;
    }
    const { data, error } = await supabase.from('transactions').update(input as never).eq('id', id).eq('user_id', user.id).select().single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { user, supabase } = await requireUser();
    const { error: findError } = await supabase.from('transactions').select('id').eq('id', id).eq('user_id', user.id).single();
    if (findError) throw findError;
    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
