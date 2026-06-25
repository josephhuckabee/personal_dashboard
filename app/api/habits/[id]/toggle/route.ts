import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { createMemoriesFromCandidates } from '@/lib/ai/memory';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { user, supabase } = await requireUser();
    const body = await request.json().catch(() => ({}));
    const loggedOn = typeof body.logged_on === 'string' ? body.logged_on : new Date().toISOString().slice(0, 10);
    const { data: habit, error: habitError } = await supabase.from('habits').select('*').eq('id', params.id).eq('user_id', user.id).single();
    if (habitError || !habit) throw habitError || new Error('Habit not found.');
    const { data: existing, error: findError } = await supabase.from('habit_logs').select('*').eq('habit_id', params.id).eq('user_id', user.id).eq('logged_on', loggedOn).maybeSingle();
    if (findError) throw findError;
    if (existing) {
      const { error } = await supabase.from('habit_logs').delete().eq('id', existing.id).eq('user_id', user.id);
      if (error) throw error;
      await createMemoriesFromCandidates(supabase, user.id, [{
        type: 'warning',
        title: `Broken habit streak: ${String(habit.name)}`,
        content: `User removed completion for ${String(habit.name)} on ${loggedOn}. This may indicate a broken or corrected habit streak.`,
        source: 'habit_streak',
        importance_score: 48,
        confidence_score: 70,
        related_entity_type: 'habits',
        related_entity_id: params.id,
      }]).catch((memoryError) => console.error('Could not create habit memory:', memoryError));
      return NextResponse.json({ completed: false, logged_on: loggedOn });
    }
    const { data, error } = await supabase.from('habit_logs').insert({ user_id: user.id, habit_id: params.id, logged_on: loggedOn, completed: true } as never).select().single();
    if (error) throw error;
    const { count } = await supabase.from('habit_logs').select('id', { count: 'exact', head: true }).eq('habit_id', params.id).eq('user_id', user.id).gte('logged_on', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
    if ((count || 0) >= Number(habit.target_per_week || 7)) {
      await createMemoriesFromCandidates(supabase, user.id, [{
        type: 'behavior',
        title: `Habit streak: ${String(habit.name)}`,
        content: `${String(habit.name)} hit its weekly target with ${count} completions in the last seven days.`,
        source: 'habit_streak',
        importance_score: 58,
        confidence_score: 86,
        related_entity_type: 'habits',
        related_entity_id: params.id,
      }]).catch((memoryError) => console.error('Could not create habit memory:', memoryError));
    }
    return NextResponse.json({ completed: true, log: data });
  } catch (error) { return apiError(error); }
}
