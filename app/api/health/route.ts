import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { entitySchemas } from '@/lib/schemas';

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const { data, error } = await supabase.from('health_metrics').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(180);
    if (error) throw error;
    const latest = Object.fromEntries(['weight','workout','running','yoga','meditation','sleep','calories','protein'].map((type) => [type, (data || []).find((item) => item.metric_type === type) || null]));
    const last30 = (data || []).filter((item) => new Date(String(item.recorded_at)) >= new Date(Date.now() - 30 * 86400000));
    const counts = last30.reduce<Record<string, number>>((result, item) => { const type = String(item.metric_type); result[type] = (result[type] || 0) + 1; return result; }, {});
    return NextResponse.json({ data, latest, counts });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const input = entitySchemas.health_metrics.parse(await request.json());
    const { data, error } = await supabase.from('health_metrics').insert({ ...input, user_id: user.id, recorded_at: input.recorded_at || new Date().toISOString() } as never).select().single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) { return apiError(error); }
}
