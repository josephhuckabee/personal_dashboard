import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { entitySchemas } from '@/lib/schemas';
import { createJournalMemories } from '@/lib/ai/memory';

const themesFromText = (text: string) => [
  /wgu|course|degree|school|study|cert/i.test(text) && 'Education',
  /weight|sleep|health|fitness|workout|stress/i.test(text) && 'Health',
  /money|cash|finance|runway|spend/i.test(text) && 'Finance',
  /travel|country|city|visa|flight|passport/i.test(text) && 'Travel',
  /career|job|work|skill|business/i.test(text) && 'Career',
  /friend|family|relationship|partner|client/i.test(text) && 'Relationships',
  /value|identity|meaning|important|ideal/i.test(text) && 'Values',
].filter(Boolean);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { user, supabase } = await requireUser();
    const input = entitySchemas.journal_entries.partial().parse(await request.json());
    const updates = { ...input, ...(input.body ? { themes: themesFromText(input.body) } : {}) };
    const { data, error } = await supabase.from('journal_entries').update(updates as never).eq('id', params.id).eq('user_id', user.id).select().single();
    if (error) throw error;
    if (input.body) await createJournalMemories(supabase, user.id, data as Record<string, unknown>).catch((memoryError) => console.error('Could not create journal memories:', memoryError));
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { user, supabase } = await requireUser();
    const { error } = await supabase.from('journal_entries').delete().eq('id', params.id).eq('user_id', user.id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
