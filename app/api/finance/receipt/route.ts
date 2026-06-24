import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { extractReceipt } from '@/lib/ai/receipt';

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']);

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const form = await request.formData();
    const file = form.get('receipt');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a receipt image or PDF.' }, { status: 400 });
    if (!allowed.has(file.type)) return NextResponse.json({ error: 'Use a JPG, PNG, WebP, HEIC, HEIF, or PDF receipt.' }, { status: 415 });
    if (file.size > 12 * 1024 * 1024) return NextResponse.json({ error: 'Receipt files must be 12 MB or smaller.' }, { status: 413 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
    const receiptId = crypto.randomUUID();
    const storagePath = `${user.id}/${receiptId}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('receipts').upload(storagePath, bytes, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data: receipt, error: insertError } = await supabase.from('receipt_uploads').insert({
      id: receiptId, user_id: user.id, storage_path: storagePath, original_filename: file.name, mime_type: file.type,
      status: process.env.OPENAI_API_KEY ? 'processing' : 'needs_review',
    } as never).select().single();
    if (insertError) throw insertError;
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ receipt, aiConfigured: false }, { status: 201 });
    try {
      const { error: budgetError } = await supabase.rpc('reserve_ai_request', { p_feature: 'receipt_extraction' });
      if (budgetError) {
        const { data } = await supabase.from('receipt_uploads').update({ status: 'needs_review', error: budgetError.message } as never).eq('id', receiptId).eq('user_id', user.id).select().single();
        return NextResponse.json({ receipt: data, aiConfigured: true, aiSkipped: true }, { status: 201 });
      }
      const result = await extractReceipt(bytes, file.type, file.name);
      const extraction = result?.extraction;
      if (result) {
        const estimatedCost = result.inputTokens / 1_000_000 * 2 + result.outputTokens / 1_000_000 * 8;
        await supabase.from('ai_usage_logs').insert({ user_id: user.id, feature: 'receipt_extraction', provider: 'openai', model: result.model, input_tokens: result.inputTokens, output_tokens: result.outputTokens, estimated_cost: estimatedCost } as never);
      }
      if (!extraction?.total) {
        const { data } = await supabase.from('receipt_uploads').update({ status: 'needs_review', extraction: extraction || null } as never).eq('id', receiptId).eq('user_id', user.id).select().single();
        return NextResponse.json({ receipt: data, aiConfigured: true }, { status: 201 });
      }
      const { data: account } = await supabase.from('finance_accounts').select('*').eq('user_id', user.id).eq('active', true).order('created_at').limit(1).maybeSingle();
      const { error: transactionError } = await supabase.from('transactions').insert({
        user_id: user.id, account_id: account?.id || null, receipt_upload_id: receiptId, type: 'expense',
        merchant: extraction.merchant || 'Receipt purchase', description: extraction.merchant || 'Receipt purchase', amount: extraction.total,
        category: extraction.category || 'Other', payment_method: extraction.payment_method, transaction_date: extraction.date || new Date().toISOString().slice(0, 10), notes: extraction.notes,
      } as never);
      if (transactionError) throw transactionError;
      const { data: ready, error: updateError } = await supabase.from('receipt_uploads').update({ ...extraction, transaction_date: extraction.date, extraction, status: 'ready' } as never).eq('id', receiptId).eq('user_id', user.id).select().single();
      if (updateError) throw updateError;
      return NextResponse.json({ receipt: ready, aiConfigured: true }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Receipt extraction failed.';
      await supabase.from('receipt_uploads').update({ status: 'needs_review', error: message } as never).eq('id', receiptId).eq('user_id', user.id);
      return NextResponse.json({ receipt: { ...receipt, status: 'needs_review', error: message }, aiConfigured: true }, { status: 201 });
    }
  } catch (error) { return apiError(error); }
}
