import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { entitySchemas } from '@/lib/schemas';
import { habitStats } from '@/lib/dashboard';

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const start = new Date(); start.setDate(start.getDate() - 30);
    const [{ data: habits, error }, { data: logs, error: logsError }] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('habit_logs').select('*').eq('user_id', user.id).gte('logged_on', start.toISOString().slice(0, 10)),
    ]);
    if (error || logsError) throw error || logsError;
    return NextResponse.json({ data: (habits || []).map((habit) => ({ ...habit, ...habitStats((logs || []).filter((log) => log.habit_id === habit.id)), logs: (logs || []).filter((log) => log.habit_id === habit.id) })) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const input = entitySchemas.habits.parse(await request.json());
    const { data, error } = await supabase.from('habits').insert({ ...input, user_id: user.id } as never).select().single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) { return apiError(error); }
}
