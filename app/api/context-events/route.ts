import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { parseContextInput } from '@/lib/context-parser';

function startFor(event: { event_date: string; event_time?: string | null }) {
  return new Date(`${event.event_date}T${event.event_time || '09:00:00'}`).toISOString();
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const { text } = await request.json();
    const parsed = parseContextInput(String(text || ''));
    if (!parsed.length) return NextResponse.json({ events: [] });
    const created = [];
    for (const event of parsed) {
      const startsAt = startFor(event);
      const endsAt = new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString();
      const { data: calendarEvent, error: calendarError } = await supabase.from('calendar_events').insert({
        user_id: user.id,
        title: event.title,
        category: event.category,
        starts_at: startsAt,
        ends_at: endsAt,
        location: event.location,
        notes: event.notes || event.raw_input,
        source: 'context_input',
        confidence_score: event.confidence_score,
        generated_from: 'natural_language',
      } as never).select().single();
      if (calendarError) throw calendarError;
      const { data: contextEvent, error: contextError } = await supabase.from('context_events').insert({
        ...event,
        user_id: user.id,
        calendar_event_id: calendarEvent?.id,
      } as never).select().single();
      if (contextError) throw contextError;
      if (event.category === 'Travel') {
        await supabase.from('travel_plans').insert({
          user_id: user.id,
          title: event.title,
          city: event.location,
          country: event.location,
          arrival_at: startsAt,
          status: 'planned',
          plan_type: 'destination',
          notes: `Created from context input: ${event.raw_input}`,
        } as never);
      }
      created.push({ ...contextEvent, calendar_event: calendarEvent });
    }
    return NextResponse.json({ events: created }, { status: 201 });
  } catch (error) { return apiError(error); }
}
