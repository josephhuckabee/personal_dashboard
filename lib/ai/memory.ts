import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/supabase/database.types';
import { getDashboardSnapshot, habitStats } from '@/lib/dashboard';

export type MemoryType = 'fact' | 'preference' | 'goal' | 'decision' | 'lesson' | 'behavior' | 'pattern' | 'risk' | 'opportunity' | 'warning' | 'milestone';

type MemoryCandidate = {
  type: MemoryType;
  category?: 'Identity' | 'Health' | 'Travel' | 'Career' | 'Education' | 'Finance' | 'Relationships' | 'Values' | 'Preferences' | 'Goals';
  title: string;
  content: string;
  source: string;
  importance_score?: number;
  confidence_score?: number;
  metadata?: Json;
  related_entity_type?: string;
  related_entity_id?: string | null;
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));
const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

function categoryFor(candidate: MemoryCandidate) {
  if (candidate.category) return candidate.category;
  if (candidate.type === 'goal' || candidate.source.includes('task')) return 'Goals';
  if (candidate.source.includes('journal') && /value|important|matter|believe|principle/i.test(candidate.content)) return 'Values';
  if (/school|wgu|course|degree|certification|education/i.test(candidate.content)) return 'Education';
  if (candidate.source.includes('finance') || candidate.title.toLowerCase().includes('expense')) return 'Finance';
  if (candidate.source.includes('travel') || candidate.title.toLowerCase().includes('travel')) return 'Travel';
  if (candidate.type === 'preference') return 'Preferences';
  if (candidate.source.includes('checkin') || candidate.source.includes('habit')) return 'Health';
  if (candidate.title.toLowerCase().includes('work') || candidate.title.toLowerCase().includes('career')) return 'Career';
  return 'Identity';
}

async function insertMemory(supabase: SupabaseClient<Database>, userId: string, candidate: MemoryCandidate) {
  const title = normalize(candidate.title).slice(0, 200);
  const content = normalize(candidate.content);
  if (!title || content.length < 12) return null;

  const { data: existing, error: existingError } = await supabase
    .from('memories')
    .select('id, importance_score, confidence_score')
    .eq('user_id', userId)
    .eq('type', candidate.type)
    .eq('title', title)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    const { data, error } = await supabase.from('memories').update({
      content,
      source: candidate.source,
      importance_score: clamp(Math.max(Number(existing.importance_score || 0), candidate.importance_score ?? 50)),
      confidence_score: clamp(Math.max(Number(existing.confidence_score || 0), candidate.confidence_score ?? 70)),
      is_important: (candidate.importance_score ?? 0) >= 80,
      category: categoryFor(candidate),
      metadata: candidate.metadata || {},
    } as never).eq('id', existing.id).eq('user_id', userId).select().single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from('memories').insert({
    user_id: userId,
    type: candidate.type,
    title,
    content,
    source: candidate.source,
    importance_score: clamp(candidate.importance_score ?? 50),
    confidence_score: clamp(candidate.confidence_score ?? 70),
    is_important: (candidate.importance_score ?? 0) >= 80,
    category: categoryFor(candidate),
    metadata: candidate.metadata || {},
  } as never).select().single();
  if (error) throw error;

  await supabase.from('memory_events').insert({
    user_id: userId,
    memory_id: data.id,
    event_type: 'created',
    source: candidate.source,
    payload: { title, type: candidate.type } as Json,
  } as never);
  if (candidate.related_entity_type && candidate.related_entity_id) {
    await supabase.from('memory_relationships').insert({
      user_id: userId,
      memory_id: data.id,
      related_entity_type: candidate.related_entity_type,
      related_entity_id: candidate.related_entity_id,
      relationship_type: 'source',
      strength: 0.9,
    } as never);
  }
  return data;
}

export async function createMemoriesFromCandidates(supabase: SupabaseClient<Database>, userId: string, candidates: MemoryCandidate[]) {
  const meaningful = candidates.filter((candidate) => (candidate.importance_score ?? 50) >= 45 || ['goal', 'decision', 'risk', 'pattern', 'lesson', 'milestone'].includes(candidate.type));
  const created = [];
  for (const candidate of meaningful) {
    const memory = await insertMemory(supabase, userId, candidate);
    if (memory) created.push(memory);
  }
  return created;
}

export async function createOnboardingMemories(supabase: SupabaseClient<Database>, userId: string, input: {
  preferred_name: string;
  age?: number | null;
  one_year_vision: string;
  year_success?: string | null;
  biggest_concerns?: string | null;
  biggest_opportunities?: string | null;
  ideal_life_90_days?: string | null;
  ideal_life_1_year?: string | null;
  ideal_life_2_years?: string | null;
  ideal_life_5_years?: string | null;
  ideal_life_10_years?: string | null;
  work_style: string;
  chief_of_staff_tone: string;
  goals: Array<{ title: string; category?: string; target_date?: string | null }>;
  habits: Array<{ name: string; target_per_week?: number }>;
  finances: { current_cash: number; monthly_income?: number; currency: string };
  travel_plans: Array<{ title: string; city?: string; country?: string; arrival_at?: string | null }>;
  travel_profile?: Record<string, unknown>;
  education_profile?: Record<string, unknown>;
  health_baseline?: Record<string, unknown>;
}) {
  const candidates: MemoryCandidate[] = [
    { type: 'fact', category: 'Identity', title: 'User identity baseline', content: `${input.preferred_name}${input.age ? ` is ${input.age}` : ''}.`, source: 'onboarding', importance_score: 70, confidence_score: 95 },
    { type: 'fact', category: 'Values', title: 'User one-year vision', content: input.one_year_vision, source: 'onboarding', importance_score: 92, confidence_score: 95 },
    ...(input.year_success ? [{ type: 'goal' as const, category: 'Values' as const, title: 'Definition of a successful year', content: input.year_success, source: 'onboarding', importance_score: 90, confidence_score: 92 }] : []),
    ...(input.biggest_concerns ? [{ type: 'risk' as const, category: 'Values' as const, title: 'Current biggest concerns', content: input.biggest_concerns, source: 'onboarding', importance_score: 84, confidence_score: 90 }] : []),
    ...(input.biggest_opportunities ? [{ type: 'opportunity' as const, category: 'Values' as const, title: 'Current biggest opportunities', content: input.biggest_opportunities, source: 'onboarding', importance_score: 82, confidence_score: 90 }] : []),
    ...(['ideal_life_90_days','ideal_life_1_year','ideal_life_2_years','ideal_life_5_years','ideal_life_10_years'] as const).filter((key) => input[key]).map((key) => ({ type: 'goal' as const, category: 'Values' as const, title: `Ideal life ${key.replace('ideal_life_', '').replaceAll('_', ' ')}`, content: String(input[key]), source: 'onboarding', importance_score: 80, confidence_score: 88 })),
    { type: 'preference', title: 'Preferred recommendation style', content: `User prefers ${input.chief_of_staff_tone} Chief of Staff recommendations. Work style: ${input.work_style}`, source: 'onboarding', importance_score: 85, confidence_score: 95 },
    { type: 'fact', title: 'Finance baseline', content: `Starting cash is ${input.finances.currency} ${input.finances.current_cash}. Monthly income baseline is ${input.finances.monthly_income || 0}.`, source: 'onboarding', importance_score: 70, confidence_score: 90 },
    ...(input.health_baseline ? [{ type: 'fact' as const, category: 'Health' as const, title: 'Health baseline', content: JSON.stringify(input.health_baseline), source: 'onboarding', importance_score: 72, confidence_score: 86 }] : []),
    ...(input.travel_profile ? [{ type: 'preference' as const, category: 'Travel' as const, title: 'Travel profile', content: JSON.stringify(input.travel_profile), source: 'onboarding', importance_score: 72, confidence_score: 86 }] : []),
    ...(input.education_profile ? [{ type: 'fact' as const, category: 'Education' as const, title: 'Education and career profile', content: JSON.stringify(input.education_profile), source: 'onboarding', importance_score: 76, confidence_score: 86 }] : []),
    ...input.goals.map((goal) => ({ type: 'goal' as const, title: `Stated goal: ${goal.title}`, content: `User stated this goal during onboarding. Category: ${goal.category || 'personal'}. Target date: ${goal.target_date || 'not recorded'}.`, source: 'onboarding', importance_score: 88, confidence_score: 95 })),
    ...input.habits.map((habit) => ({ type: 'behavior' as const, title: `Intended habit: ${habit.name}`, content: `User wants to track ${habit.name} ${habit.target_per_week || 7} times per week.`, source: 'onboarding', importance_score: 58, confidence_score: 90 })),
    ...input.travel_plans.map((plan) => ({ type: 'milestone' as const, title: `Travel plan: ${plan.title}`, content: `Travel plan recorded for ${[plan.city, plan.country].filter(Boolean).join(', ') || 'location not recorded'}${plan.arrival_at ? ` arriving ${plan.arrival_at}` : ''}.`, source: 'onboarding', importance_score: 65, confidence_score: 90 })),
  ];
  return createMemoriesFromCandidates(supabase, userId, candidates);
}

export async function createCheckinMemories(supabase: SupabaseClient<Database>, userId: string, checkin: Record<string, unknown>) {
  const candidates: MemoryCandidate[] = [];
  const challenge = String(checkin.biggest_challenge || '').trim();
  const avoided = String(checkin.what_was_avoided || '').trim();
  const win = String(checkin.biggest_win || '').trim();
  if (avoided.length >= 20) candidates.push({ type: 'behavior', title: `Avoidance noted ${checkin.checkin_date}`, content: `User reported avoiding: ${avoided}`, source: 'daily_checkin', importance_score: 62, confidence_score: 88, related_entity_type: 'daily_checkins', related_entity_id: String(checkin.id || '') });
  if (challenge.length >= 24 || Number(checkin.stress || 0) >= 8) candidates.push({ type: 'risk', title: `Execution friction ${checkin.checkin_date}`, content: `Stress ${checkin.stress}/10. Challenge: ${challenge || 'not specified'}.`, source: 'daily_checkin', importance_score: Number(checkin.stress || 0) >= 8 ? 72 : 58, confidence_score: 85, related_entity_type: 'daily_checkins', related_entity_id: String(checkin.id || '') });
  if (win.length >= 24 && Number(checkin.productivity || 0) >= 8) candidates.push({ type: 'lesson', title: `Productive day evidence ${checkin.checkin_date}`, content: `Productivity ${checkin.productivity}/10. Win: ${win}`, source: 'daily_checkin', importance_score: 55, confidence_score: 82, related_entity_type: 'daily_checkins', related_entity_id: String(checkin.id || '') });
  return createMemoriesFromCandidates(supabase, userId, candidates);
}

export async function createJournalMemories(supabase: SupabaseClient<Database>, userId: string, entry: Record<string, unknown>) {
  const body = String(entry.body || '').trim();
  if (body.length < 20) return [];
  const lower = body.toLowerCase();
  const candidates: MemoryCandidate[] = [];
  const titleDate = String(entry.entry_date || isoDate(new Date()));
  if (/worried|concern|afraid|risk|stuck|behind|stress|problem/.test(lower)) {
    candidates.push({ type: 'risk', category: 'Values', title: `Journal concern ${titleDate}`, content: body.slice(0, 1000), source: 'journal', importance_score: 72, confidence_score: 74, related_entity_type: 'journal_entries', related_entity_id: String(entry.id || '') });
  }
  if (/want|trying|motivat|goal|dream|ideal|future|become/.test(lower)) {
    candidates.push({ type: 'goal', category: 'Values', title: `Journal motivation ${titleDate}`, content: body.slice(0, 1000), source: 'journal', importance_score: 76, confidence_score: 74, related_entity_type: 'journal_entries', related_entity_id: String(entry.id || '') });
  }
  if (/value|matter|important|principle|identity|person i want/.test(lower)) {
    candidates.push({ type: 'fact', category: 'Values', title: `Stated value ${titleDate}`, content: body.slice(0, 1000), source: 'journal', importance_score: 82, confidence_score: 72, related_entity_type: 'journal_entries', related_entity_id: String(entry.id || '') });
  }
  if (/friend|family|partner|relationship|mother|father|client|team|mentor/.test(lower)) {
    candidates.push({ type: 'fact', category: 'Relationships', title: `Relationship context ${titleDate}`, content: body.slice(0, 1000), source: 'journal', importance_score: 62, confidence_score: 68, related_entity_type: 'journal_entries', related_entity_id: String(entry.id || '') });
  }
  if (/win|worked|progress|finished|completed|proud/.test(lower)) {
    candidates.push({ type: 'lesson', title: `Journal win ${titleDate}`, content: body.slice(0, 1000), source: 'journal', importance_score: 60, confidence_score: 72, related_entity_type: 'journal_entries', related_entity_id: String(entry.id || '') });
  }
  if (/failed|missed|avoided|didn't|did not|slipped/.test(lower)) {
    candidates.push({ type: 'lesson', title: `Journal failure pattern ${titleDate}`, content: body.slice(0, 1000), source: 'journal', importance_score: 68, confidence_score: 72, related_entity_type: 'journal_entries', related_entity_id: String(entry.id || '') });
  }
  return createMemoriesFromCandidates(supabase, userId, candidates);
}

export async function createTaskMemory(supabase: SupabaseClient<Database>, userId: string, task: Record<string, unknown>) {
  if (task.status !== 'completed') return [];
  return createMemoriesFromCandidates(supabase, userId, [{
    type: 'milestone',
    title: `Completed task: ${String(task.title)}`,
    content: `User completed the task "${String(task.title)}"${task.objective_id ? ' tied to an objective' : ''}.`,
    source: 'completed_task',
    importance_score: String(task.priority) === 'high' ? 62 : 48,
    confidence_score: 95,
    related_entity_type: 'tasks',
    related_entity_id: String(task.id || ''),
  }]);
}

export async function createFinanceMemory(supabase: SupabaseClient<Database>, userId: string, transaction: Record<string, unknown>) {
  if (Number(transaction.amount || 0) < 100 || transaction.type !== 'expense') return [];
  return createMemoriesFromCandidates(supabase, userId, [{
    type: 'warning',
    title: `Notable expense: ${String(transaction.category || transaction.merchant || 'uncategorized')}`,
    content: `A ${String(transaction.currency || 'USD')} ${Number(transaction.amount).toFixed(2)} expense was recorded for ${String(transaction.merchant || transaction.description || 'no merchant')}.`,
    source: 'finance_change',
    importance_score: Number(transaction.amount || 0) >= 500 ? 72 : 52,
    confidence_score: 92,
    related_entity_type: 'transactions',
    related_entity_id: String(transaction.id || ''),
  }]);
}

export async function getMemoryContext(supabase: SupabaseClient<Database>, userId: string) {
  const [latest, important, goalRelated] = await Promise.all([
    supabase.from('memories').select('id,type,category,title,content,importance_score,confidence_score,source,created_at').eq('user_id', userId).is('inaccurate_at', null).is('archived_at', null).order('created_at', { ascending: false }).limit(20),
    supabase.from('memories').select('id,type,category,title,content,importance_score,confidence_score,source,created_at').eq('user_id', userId).is('inaccurate_at', null).is('archived_at', null).order('importance_score', { ascending: false }).limit(20),
    supabase.from('memories').select('id,type,category,title,content,importance_score,confidence_score,source,created_at').eq('user_id', userId).is('inaccurate_at', null).is('archived_at', null).in('type', ['goal', 'pattern', 'risk', 'lesson']).order('updated_at', { ascending: false }).limit(20),
  ]);
  const failures = [latest, important, goalRelated].filter((result) => result.error);
  if (failures.length) throw failures[0].error;
  const byId = new Map<string, Record<string, unknown>>();
  [...(latest.data || []), ...(important.data || []), ...(goalRelated.data || [])].forEach((memory) => byId.set(String(memory.id), memory));
  const memories = [...byId.values()];
  if (memories.length) {
    await supabase.from('memories').update({ last_used_at: new Date().toISOString() } as never).in('id', memories.map((memory) => String(memory.id))).eq('user_id', userId);
  }
  return {
    latest: latest.data || [],
    important: important.data || [],
    goal_related: goalRelated.data || [],
    compact: memories.map((memory) => ({
      id: memory.id,
      type: memory.type,
      category: memory.category,
      title: memory.title,
      content: memory.content,
      importance: memory.importance_score,
      confidence: memory.confidence_score,
    })),
  };
}

export async function detectWeeklyPatterns(supabase: SupabaseClient<Database>, userId: string) {
  const snapshot = await getDashboardSnapshot(supabase, userId);
  const candidates: MemoryCandidate[] = [];
  const habits = snapshot.habits as Array<Record<string, unknown> & { weeklyConsistency: number; monthlyConsistency: number; streak: number }>;
  const strongest = habits.slice().sort((a, b) => b.weeklyConsistency - a.weeklyConsistency)[0];
  const weakest = habits.slice().sort((a, b) => a.weeklyConsistency - b.weeklyConsistency)[0];
  if (strongest && strongest.weeklyConsistency >= 70) candidates.push({ type: 'pattern', title: `Strongest habit: ${String(strongest.name)}`, content: `${String(strongest.name)} is currently the strongest habit at ${strongest.weeklyConsistency}% seven-day consistency and ${strongest.streak} day streak.`, source: 'weekly_pattern_detection', importance_score: 70, confidence_score: 82 });
  if (weakest && weakest.weeklyConsistency <= 35) candidates.push({ type: 'risk', title: `Weak habit: ${String(weakest.name)}`, content: `${String(weakest.name)} is under target at ${weakest.weeklyConsistency}% seven-day consistency.`, source: 'weekly_pattern_detection', importance_score: 68, confidence_score: 82 });

  const checkins = snapshot.checkins as Array<Record<string, unknown>>;
  const avoidance = checkins.filter((item) => String(item.what_was_avoided || '').trim().length > 0);
  if (avoidance.length >= 2) candidates.push({ type: 'pattern', title: 'Recurring avoidance reported', content: `Avoidance appeared in ${avoidance.length} recent check-ins. Recent themes: ${avoidance.slice(0, 3).map((item) => item.what_was_avoided).join(' | ')}`, source: 'weekly_pattern_detection', importance_score: 78, confidence_score: 76 });
  if (snapshot.finance.financialRiskScore >= 70) candidates.push({ type: 'risk', title: 'Recurring financial runway risk', content: `Financial risk score is ${snapshot.finance.financialRiskScore}/100. Current cash, spending, or income data indicates runway needs attention.`, source: 'weekly_pattern_detection', importance_score: 82, confidence_score: 80 });

  const openTasks = (snapshot.tasks as Array<Record<string, unknown>>).filter((task) => !['completed', 'cancelled'].includes(String(task.status)));
  const overdue = openTasks.filter((task) => task.due_at && new Date(String(task.due_at)).getTime() < Date.now());
  if (overdue.length >= 2) candidates.push({ type: 'warning', title: 'Recurring schedule slippage', content: `${overdue.length} open tasks are overdue. This suggests planning load or follow-through needs adjustment.`, source: 'weekly_pattern_detection', importance_score: 76, confidence_score: 84 });

  await createMemoriesFromCandidates(supabase, userId, candidates);
  return { snapshot, patterns: candidates };
}

export function summarizeWeek(snapshot: Awaited<ReturnType<typeof getDashboardSnapshot>>) {
  const habits = snapshot.habits as Array<Record<string, unknown> & ReturnType<typeof habitStats>>;
  const tasks = snapshot.tasks as Array<Record<string, unknown>>;
  const completedTasks = tasks.filter((task) => task.status === 'completed' && task.completed_at && new Date(String(task.completed_at)) >= new Date(Date.now() - 7 * 86400000));
  const missedTasks = tasks.filter((task) => !['completed', 'cancelled'].includes(String(task.status)) && task.due_at && new Date(String(task.due_at)).getTime() < Date.now());
  return {
    period_end: isoDate(new Date()),
    goals: snapshot.goals.map((goal) => ({ title: goal.title, progress: goal.progress, status: goal.status })),
    objectives: (snapshot.objectives as Array<Record<string, unknown> & { calculated_status: string }>).map((objective) => ({ title: objective.title, progress: objective.progress, status: objective.calculated_status })),
    completed_tasks: completedTasks.map((task) => task.title).slice(0, 12),
    missed_tasks: missedTasks.map((task) => task.title).slice(0, 12),
    habits: habits.map((habit) => ({ name: habit.name, streak: habit.streak, weekly_consistency: habit.weeklyConsistency })),
    finance: { current_cash: snapshot.finance.currentCash, monthly_burn: snapshot.finance.monthlyBurn, runway_months: snapshot.finance.runwayMonths, risk_score: snapshot.finance.financialRiskScore },
    travel: snapshot.travel.map((item) => ({ title: item.title, city: item.city, country: item.country, arrival_at: item.arrival_at, departure_at: item.departure_at, visa_deadline: item.visa_deadline, status: item.status })),
    checkins: snapshot.checkins.map((item) => ({ date: item.checkin_date, mood: item.mood, energy: item.energy, stress: item.stress, productivity: item.productivity, avoided: item.what_was_avoided, win: item.biggest_win, challenge: item.biggest_challenge })),
    health: snapshot.health.slice(0, 20),
  };
}
