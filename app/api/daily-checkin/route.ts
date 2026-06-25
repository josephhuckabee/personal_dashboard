import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { entitySchemas } from '@/lib/schemas';
import { createCheckinMemories } from '@/lib/ai/memory';

const average = (items: Array<Record<string, unknown>>, field: string) => items.length ? Number((items.reduce((sum, item) => sum + Number(item[field] || 0), 0) / items.length).toFixed(1)) : null;

export async function GET(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const q = url.searchParams.get('q')?.trim().toLowerCase() || '';
    let query = supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('checkin_date', { ascending: false }).limit(366);
    if (from) query = query.gte('checkin_date', from);
    if (to) query = query.lte('checkin_date', to);
    const { data, error } = await query;
    if (error) throw error;
    const filtered = q ? (data || []).filter((item) => [item.biggest_win, item.biggest_challenge, item.what_was_avoided, item.tomorrow_priority, item.ai_summary].some((value) => String(value || '').toLowerCase().includes(q))) : (data || []);
    const now = Date.now();
    const weekly = filtered.filter((item) => new Date(`${item.checkin_date}T12:00:00`).getTime() >= now - 7 * 86400000);
    const monthly = filtered.filter((item) => new Date(`${item.checkin_date}T12:00:00`).getTime() >= now - 30 * 86400000);
    const metrics = (items: Array<Record<string, unknown>>) => ({ mood: average(items, 'mood'), energy: average(items, 'energy'), stress: average(items, 'stress'), productivity: average(items, 'productivity') });
    return NextResponse.json({ data: filtered, stats: { weekly: metrics(weekly as Array<Record<string, unknown>>), monthly: metrics(monthly as Array<Record<string, unknown>>) }, trends: filtered.slice().reverse().slice(-30).map((item) => ({ date: item.checkin_date, mood: item.mood, energy: item.energy, stress: item.stress, productivity: item.productivity })) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const input = entitySchemas.daily_checkins.parse(await request.json());
    const aiSummary = input.ai_summary || `Mood ${input.mood}/10, energy ${input.energy}/10, stress ${input.stress}/10, productivity ${input.productivity}/10. ${input.biggest_win ? `Win: ${input.biggest_win}` : 'No win recorded.'} ${input.tomorrow_priority ? `Tomorrow: ${input.tomorrow_priority}` : 'No tomorrow priority recorded.'}`;
    const { data, error } = await supabase.from('daily_checkins').upsert({ ...input, ai_summary: aiSummary, user_id: user.id } as never, { onConflict: 'user_id,checkin_date' }).select().single();
    if (error) throw error;
    await createCheckinMemories(supabase, user.id, data as Record<string, unknown>).catch((memoryError) => console.error('Could not create check-in memories:', memoryError));
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) { return apiError(error); }
}
