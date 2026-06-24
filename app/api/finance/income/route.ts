import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { entitySchemas } from '@/lib/schemas';

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const input = entitySchemas.income.parse(await request.json());
    if (input.account_id) {
      const { error: accountError } = await supabase.from('finance_accounts').select('id').eq('id', input.account_id).eq('user_id', user.id).single();
      if (accountError) throw accountError;
    }
    const { data, error } = await supabase.from('income').insert({ ...input, user_id: user.id } as never).select().single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) { return apiError(error); }
}
