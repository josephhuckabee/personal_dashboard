import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { memorySchema } from '@/lib/schemas';

export async function GET(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim().toLowerCase() || '';
    const type = url.searchParams.get('type');
    const limit = Math.min(Number(url.searchParams.get('limit') || 100), 250);
    let query = supabase.from('memories').select('*').eq('user_id', user.id).order('importance_score', { ascending: false }).order('created_at', { ascending: false }).limit(limit);
    if (type) query = query.eq('type', type);
    const { data, error } = await query;
    if (error) throw error;
    const filtered = q ? (data || []).filter((memory) => [memory.title, memory.content, memory.source, memory.type].some((value) => String(value || '').toLowerCase().includes(q))) : (data || []);
    return NextResponse.json({ data: filtered });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const input = memorySchema.required({ type: true, title: true, content: true }).parse(await request.json());
    const { data, error } = await supabase.from('memories').insert({
      ...input,
      user_id: user.id,
      source: input.source || 'user',
      importance_score: input.importance_score ?? 70,
      confidence_score: input.confidence_score ?? 100,
      is_important: input.is_important ?? Number(input.importance_score ?? 70) >= 80,
    } as never).select().single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) { return apiError(error); }
}
