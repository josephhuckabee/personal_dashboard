import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { entitySchemas } from '@/lib/schemas';
import { createJournalMemories } from '@/lib/ai/memory';

function themesFromText(text: string) {
  const lower = text.toLowerCase();
  return [
    /wgu|course|degree|school|study|cert/.test(lower) && 'Education',
    /weight|sleep|health|fitness|workout|stress/.test(lower) && 'Health',
    /money|cash|finance|runway|spend/.test(lower) && 'Finance',
    /travel|country|city|visa|flight|passport/.test(lower) && 'Travel',
    /career|job|work|skill|business/.test(lower) && 'Career',
    /friend|family|relationship|partner|client/.test(lower) && 'Relationships',
    /value|identity|meaning|important|ideal/.test(lower) && 'Values',
  ].filter(Boolean);
}

export async function GET(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim().toLowerCase() || '';
    const { data, error } = await supabase.from('journal_entries').select('*').eq('user_id', user.id).order('entry_date', { ascending: false }).order('created_at', { ascending: false }).limit(150);
    if (error) throw error;
    const filtered = q ? (data || []).filter((entry) => [entry.title, entry.body, JSON.stringify(entry.themes || [])].some((value) => String(value || '').toLowerCase().includes(q))) : data || [];
    return NextResponse.json({ data: filtered });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const input = entitySchemas.journal_entries.parse(await request.json());
    const themes = themesFromText(input.body);
    const { data, error } = await supabase.from('journal_entries').insert({ ...input, themes, user_id: user.id } as never).select().single();
    if (error) throw error;
    await createJournalMemories(supabase, user.id, data as Record<string, unknown>).catch((memoryError) => console.error('Could not create journal memories:', memoryError));
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
