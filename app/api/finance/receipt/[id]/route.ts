import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { receiptExtractionSchema } from '@/lib/schemas';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { user, supabase } = await requireUser();
    const input = receiptExtractionSchema.parse(await request.json());
    if (input.total === null) return NextResponse.json({ error: 'A total is required.' }, { status: 400 });
    const { data: receipt, error: receiptError } = await supabase.from('receipt_uploads').select('*').eq('id', params.id).eq('user_id', user.id).single();
    if (receiptError) throw receiptError;
    const { data: previous } = await supabase.from('transactions').select('*').eq('receipt_upload_id', params.id).eq('user_id', user.id).maybeSingle();
    const transaction = { merchant: input.merchant || 'Receipt purchase', description: input.merchant || 'Receipt purchase', amount: input.total, category: input.category || 'Other', payment_method: input.payment_method, transaction_date: input.date || new Date().toISOString().slice(0, 10), notes: input.notes };
    if (previous) {
      const { error } = await supabase.from('transactions').update(transaction as never).eq('id', previous.id).eq('user_id', user.id);
      if (error) throw error;
    } else {
      const { data: account } = await supabase.from('finance_accounts').select('*').eq('user_id', user.id).eq('active', true).order('created_at').limit(1).maybeSingle();
      const { error } = await supabase.from('transactions').insert({ ...transaction, user_id: user.id, account_id: account?.id || null, receipt_upload_id: params.id, type: 'expense' } as never);
      if (error) throw error;
    }
    const { data, error } = await supabase.from('receipt_uploads').update({ merchant: input.merchant, transaction_date: input.date, total: input.total, category: input.category, payment_method: input.payment_method, notes: input.notes, extraction: input, status: 'ready', error: null } as never).eq('id', receipt.id).eq('user_id', user.id).select().single();
    if (error) throw error;
    return NextResponse.json({ receipt: data });
  } catch (error) { return apiError(error); }
}
