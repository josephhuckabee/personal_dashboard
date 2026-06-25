import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { entityNames, entitySchemas, type EntityName } from '@/lib/schemas';
import { syncParentProgress } from '@/lib/progress';
import { createTaskMemory } from '@/lib/ai/memory';

function entity(value: string): EntityName {
  if (!entityNames.includes(value as EntityName)) throw new Error('Unknown entity.');
  return value as EntityName;
}

export async function PATCH(request: Request, context: { params: Promise<{ entity: string; id: string }> }) {
  try {
    const params = await context.params;
    const name = entity(params.entity);
    const { user, supabase } = await requireUser();
    const input = entitySchemas[name].partial().parse(await request.json());
    const updates: Record<string, unknown> = { ...input };
    const { data: previous } = name === 'tasks' ? await supabase.from('tasks').select('*').eq('id', params.id).eq('user_id', user.id).maybeSingle() : { data: null };
    if (name === 'tasks' && (input as Record<string, unknown>).status) updates.completed_at = (input as Record<string, unknown>).status === 'completed' ? new Date().toISOString() : null;
    if ((name === 'goals' || name === 'objectives') && Number((input as Record<string, unknown>).progress) >= 100) updates.status = 'completed';
    const { data, error } = await supabase.from(name).update(updates as never).eq('id', params.id).eq('user_id', user.id).select().single();
    if (error) throw error;
    if (name === 'tasks') {
      await syncParentProgress(supabase, user.id, previous);
      await syncParentProgress(supabase, user.id, data);
      await createTaskMemory(supabase, user.id, data as Record<string, unknown>).catch((memoryError) => console.error('Could not create task memory:', memoryError));
    }
    return NextResponse.json({ data });
  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ entity: string; id: string }> }) {
  try {
    const params = await context.params;
    const name = entity(params.entity);
    const { user, supabase } = await requireUser();
    const { data: previous } = name === 'tasks' ? await supabase.from('tasks').select('*').eq('id', params.id).eq('user_id', user.id).maybeSingle() : { data: null };
    const { error } = await supabase.from(name).delete().eq('id', params.id).eq('user_id', user.id);
    if (error) throw error;
    if (name === 'tasks') await syncParentProgress(supabase, user.id, previous);
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
