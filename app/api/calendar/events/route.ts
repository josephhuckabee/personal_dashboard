import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { entitySchemas } from '@/lib/schemas';

type CalendarFeedEvent = Record<string, unknown> & { id: string; title: string; category?: string; starts_at: string; ends_at: string; source?: string };

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const now = new Date();
    const to = new Date(Date.now() + 30 * 86400000).toISOString();
    const [{ data, error }, tasks, habits, travel, objectives, benchmarks] = await Promise.all([
      supabase.from('calendar_events').select('*').eq('user_id', user.id).order('starts_at').limit(100),
      supabase.from('tasks').select('*').eq('user_id', user.id).neq('status', 'completed').not('due_at', 'is', null).lte('due_at', to),
      supabase.from('habits').select('*').eq('user_id', user.id).eq('active', true),
      supabase.from('travel_plans').select('*').eq('user_id', user.id).or(`arrival_at.lte.${to},departure_at.lte.${to},visa_deadline.lte.${to}`),
      supabase.from('objectives').select('*').eq('user_id', user.id).not('deadline', 'is', null),
      supabase.from('life_benchmarks').select('*').eq('user_id', user.id).not('target_date', 'is', null).neq('status', 'archived'),
    ]);
    const failure = [error, tasks.error, habits.error, travel.error, objectives.error, benchmarks.error].find(Boolean);
    if (failure) throw failure;
    const today = now.toISOString().slice(0, 10);
    const derived: CalendarFeedEvent[] = [];
    const addEvent = (event: CalendarFeedEvent) => derived.push(event);

    (tasks.data || []).forEach((task) => {
      addEvent({ id: `task-${task.id}`, title: String(task.title), category: 'task', starts_at: String(task.due_at), ends_at: String(task.due_at), source: 'task' });
    });
    (habits.data || []).forEach((habit) => {
      addEvent({ id: `habit-${habit.id}`, title: String(habit.name), category: 'habit', starts_at: `${today}T09:00:00.000Z`, ends_at: `${today}T09:15:00.000Z`, source: 'habit' });
    });
    (travel.data || []).forEach((item) => {
      if (item.arrival_at) addEvent({ id: `travel-arrive-${item.id}`, title: String(item.title), category: 'travel', starts_at: String(item.arrival_at), ends_at: String(item.arrival_at), source: 'travel' });
      if (item.departure_at) addEvent({ id: `travel-depart-${item.id}`, title: `${item.title} departure`, category: 'travel', starts_at: String(item.departure_at), ends_at: String(item.departure_at), source: 'travel' });
      if (item.visa_deadline) addEvent({ id: `visa-${item.id}`, title: `${item.country || item.title} visa deadline`, category: 'travel', starts_at: `${item.visa_deadline}T12:00:00.000Z`, ends_at: `${item.visa_deadline}T12:00:00.000Z`, source: 'travel' });
    });
    (objectives.data || []).forEach((item) => {
      addEvent({ id: `objective-${item.id}`, title: `${item.title} deadline`, category: 'objective', starts_at: `${item.deadline}T12:00:00.000Z`, ends_at: `${item.deadline}T12:00:00.000Z`, source: 'objective' });
    });
    (benchmarks.data || []).forEach((item) => {
      addEvent({ id: `benchmark-${item.id}`, title: String(item.title), category: 'benchmark', starts_at: `${item.target_date}T12:00:00.000Z`, ends_at: `${item.target_date}T12:00:00.000Z`, source: 'benchmark' });
    });

    const stored = (data || []) as unknown as CalendarFeedEvent[];
    const events = [...stored, ...derived].sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));
    return NextResponse.json({ events: events.map((event) => ({ ...event, start: event.starts_at, end: event.ends_at })) });
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
