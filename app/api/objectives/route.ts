import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { entitySchemas } from '@/lib/schemas';
import { calculateObjectiveRisk } from '@/lib/dashboard';

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const [{ data, error }, { data: tasks, error: taskError }] = await Promise.all([
      supabase.from('objectives').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('tasks').select('objective_id, updated_at').eq('user_id', user.id).gte('updated_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    ]);
    if (error || taskError) throw error || taskError;
    return NextResponse.json({ data: (data || []).map((objective) => ({ ...objective, calculated_status: calculateObjectiveRisk(objective, (tasks || []).filter((task) => task.objective_id === objective.id).length) })) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const input = entitySchemas.objectives.parse(await request.json());
    const { data, error } = await supabase.from('objectives').insert({ ...input, user_id: user.id } as never).select().single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) { return apiError(error); }
}
