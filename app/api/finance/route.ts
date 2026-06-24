import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const since = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString().slice(0, 10);
    const [{ data: accounts, error: accountsError }, { data: transactions, error: transactionError }, { data: incomes, error: incomeError }, { data: categories, error: categoryError }, { data: receipts, error: receiptError }] = await Promise.all([
      supabase.from('finance_accounts').select('*').eq('user_id', user.id).eq('active', true),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('transaction_date', { ascending: false }).limit(100),
      supabase.from('income').select('*').eq('user_id', user.id).order('received_on', { ascending: false }).limit(100),
      supabase.from('finance_categories').select('*').eq('user_id', user.id).order('name'),
      supabase.from('receipt_uploads').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    ]);
    if (accountsError || transactionError || incomeError || categoryError || receiptError) throw accountsError || transactionError || incomeError || categoryError || receiptError;
    const currentCash = (accounts || []).reduce((sum, account) => sum + Number(account.current_balance || 0), 0);
    const recent = (transactions || []).filter((item) => String(item.transaction_date) >= since);
    const spent = recent.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
    const earned = (incomes || []).filter((item) => String(item.received_on) >= since).reduce((sum, item) => sum + Number(item.amount), 0);
    const byCategory = recent.filter((item) => item.type === 'expense').reduce<Record<string, number>>((result, item) => { result[String(item.category)] = (result[String(item.category)] || 0) + Number(item.amount); return result; }, {});
    const dailyAverageSpend = spent / Math.max(1, new Date().getUTCDate());
    const monthlyBurn = dailyAverageSpend * 30;
    const runway = monthlyBurn > 0 ? currentCash / monthlyBurn : null;
    const receiptRows = await Promise.all((receipts || []).map(async (receipt) => {
      const { data } = await supabase.storage.from('receipts').createSignedUrl(String(receipt.storage_path), 3600);
      return { ...receipt, signed_url: data?.signedUrl || null };
    }));
    return NextResponse.json({
      snapshot: { currentCash, spent, earned, burnRate: monthlyBurn, runway, dailyAverageSpend, financialRiskScore: Math.round(Math.min(100, spent === 0 ? 20 : runway === null ? 60 : runway < 1 ? 95 : runway < 3 ? 75 : runway < 6 ? 45 : 15)), byCategory, categoryBudgets: Object.fromEntries((categories || []).filter((item) => item.category_type === 'expense' && item.monthly_budget != null).map((item) => [item.name, Number(item.monthly_budget)])) },
      insight: spent === 0 ? 'Upload receipts to establish your monthly burn.' : runway !== null && runway < 3 ? 'Runway is below three months. Treat discretionary spend as a constraint.' : 'Current spend is inside the available cash position.',
      receipts: receiptRows,
      transactions: transactions || [],
      accounts: accounts || [],
      incomes: incomes || [],
      categories: categories || [],
    });
  } catch (error) { return apiError(error); }
}
