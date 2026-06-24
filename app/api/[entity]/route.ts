import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { entityNames, entitySchemas, type EntityName } from '@/lib/schemas';
import { syncParentProgress } from '@/lib/progress';

function assertEntity(value: string): asserts value is EntityName {
  if (!entityNames.includes(value as EntityName)) throw new Error('Unknown entity.');
}

export async function GET(request: Request, context: { params: Promise<{ entity: string }> }) {
  try {
    const params = await context.params;
    assertEntity(params.entity);
    const { user, supabase } = await requireUser();
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit') || 100), 250);
    const { data, error } = await supabase.from(params.entity).select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request, context: { params: Promise<{ entity: string }> }) {
  try {
    const params = await context.params;
    assertEntity(params.entity);
    const { user, supabase } = await requireUser();
    const input = entitySchemas[params.entity].parse(await request.json());
    const { data, error } = await supabase.from(params.entity).insert({ ...input, user_id: user.id } as never).select().single();
    if (error) throw error;
    if (params.entity === 'tasks') await syncParentProgress(supabase, user.id, data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) { return apiError(error); }
}
