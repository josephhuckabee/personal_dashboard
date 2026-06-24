import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { entitySchemas } from '@/lib/schemas';

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const { data, error } = await supabase.from('calendar_events').select('*').eq('user_id', user.id).order('starts_at').limit(100);
    if (error) throw error;
    return NextResponse.json({ events: (data || []).map((event) => ({ ...event, start: event.starts_at, end: event.ends_at })) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const raw = await request.json();
    const input = entitySchemas.calendar_events.parse({ ...raw, starts_at: raw.starts_at || raw.start, ends_at: raw.ends_at || raw.end });
    const { data, error } = await supabase.from('calendar_events').insert({ ...input, user_id: user.id } as never).select().single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) { return apiError(error); }
}
