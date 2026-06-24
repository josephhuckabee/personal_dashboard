import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

export async function syncParentProgress(supabase: SupabaseClient<Database>, userId: string, parent: Record<string, unknown> | null | undefined) {
  if (!parent) return;
  if (parent.goal_id) {
    const { data, error } = await supabase.from('tasks').select('status').eq('user_id', userId).eq('goal_id', String(parent.goal_id)).neq('status', 'cancelled');
    if (error) throw error;
    const progress = data?.length ? Math.round(data.filter((task) => task.status === 'completed').length / data.length * 100) : 0;
    const { error: updateError } = await supabase.from('goals').update({ progress, status: progress === 100 ? 'completed' : 'active' } as never).eq('id', String(parent.goal_id)).eq('user_id', userId);
    if (updateError) throw updateError;
  }
  if (parent.objective_id) {
    const { data, error } = await supabase.from('tasks').select('status').eq('user_id', userId).eq('objective_id', String(parent.objective_id)).neq('status', 'cancelled');
    if (error) throw error;
    const progress = data?.length ? Math.round(data.filter((task) => task.status === 'completed').length / data.length * 100) : 0;
    const { error: updateError } = await supabase.from('objectives').update({ progress, status: progress === 100 ? 'completed' : 'healthy', last_activity_at: new Date().toISOString() } as never).eq('id', String(parent.objective_id)).eq('user_id', userId);
    if (updateError) throw updateError;
  }
}
