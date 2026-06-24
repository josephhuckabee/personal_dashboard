import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { user, supabase } = await requireUser();
    const body = await request.json().catch(() => ({}));
    const loggedOn = typeof body.logged_on === 'string' ? body.logged_on : new Date().toISOString().slice(0, 10);
    const { data: habit, error: habitError } = await supabase.from('habits').select('id').eq('id', params.id).eq('user_id', user.id).single();
    if (habitError || !habit) throw habitError || new Error('Habit not found.');
    const { data: existing, error: findError } = await supabase.from('habit_logs').select('*').eq('habit_id', params.id).eq('user_id', user.id).eq('logged_on', loggedOn).maybeSingle();
    if (findError) throw findError;
    if (existing) {
      const { error } = await supabase.from('habit_logs').delete().eq('id', existing.id).eq('user_id', user.id);
      if (error) throw error;
      return NextResponse.json({ completed: false, logged_on: loggedOn });
    }
    const { data, error } = await supabase.from('habit_logs').insert({ user_id: user.id, habit_id: params.id, logged_on: loggedOn, completed: true } as never).select().single();
    if (error) throw error;
    return NextResponse.json({ completed: true, log: data });
  } catch (error) { return apiError(error); }
}
