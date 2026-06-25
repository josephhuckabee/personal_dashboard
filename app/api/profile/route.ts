import { NextResponse } from 'next/server';
import { ensureProfile, requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { z } from 'zod';

const schema = z.object({ display_name: z.string().trim().min(1).max(100).optional(), timezone: z.string().trim().min(1).max(100).optional(), current_city: z.string().trim().max(100).optional().nullable(), current_country: z.string().trim().max(100).optional().nullable(), chapter_started_at: z.string().date().optional().nullable(), one_year_vision: z.string().trim().max(5000).optional().nullable(), work_style: z.string().trim().max(1000).optional().nullable(), monthly_ai_budget: z.coerce.number().min(0).max(1000).optional(), monthly_ai_requests_limit: z.coerce.number().int().min(0).max(10000).optional() });

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    await ensureProfile(supabase, user);
    const [{ data, error }, { data: preferences, error: preferenceError }] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    ]);
    if (error || preferenceError) throw error || preferenceError;
    return NextResponse.json({ data: data ? { ...data, display_name: data.preferred_name } : null, preferences, email: user.email });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    await ensureProfile(supabase, user);
    const input = schema.parse(await request.json());
    const { display_name, ...rest } = input;
    const { data, error } = await supabase.from('profiles').update({ ...rest, preferred_name: display_name } as never).eq('user_id', user.id).select().single();
    if (error) throw error;
    return NextResponse.json({ data: { ...data, display_name: data.preferred_name } });
  } catch (error) { return apiError(error); }
}
