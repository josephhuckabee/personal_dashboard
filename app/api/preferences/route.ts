import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { entitySchemas } from '@/lib/schemas';

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const { data, error } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const input = entitySchemas.user_preferences.parse(await request.json());
    const { data, error } = await supabase.from('user_preferences').upsert({ ...input, user_id: user.id } as never, { onConflict: 'user_id' }).select().single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) { return apiError(error); }
}
