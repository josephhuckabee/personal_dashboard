import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/supabase/database.types';

const horizons = [
  ['3 days', 3],
  ['7 days', 7],
  ['14 days', 14],
  ['30 days', 30],
  ['45 days', 45],
  ['60 days', 60],
  ['90 days', 90],
  ['120 days', 120],
  ['180 days', 180],
  ['365 days', 365],
  ['2 years', 730],
  ['5 years', 1825],
  ['10 years', 3650],
] as const;

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

function inferCategory(text: string) {
  const value = text.toLowerCase();
  if (/school|degree|wgu|course|cert|education|graduate/.test(value)) return 'Education';
  if (/health|weight|fitness|sleep|workout|run|strength/.test(value)) return 'Health';
  if (/travel|country|city|nomad|passport|visa/.test(value)) return 'Travel';
  if (/career|job|work|income|business|skill/.test(value)) return 'Career';
  if (/cash|finance|debt|money|runway/.test(value)) return 'Finance';
  return 'Life';
}

function benchmarkTitle(vision: string, horizon: string, category: string) {
  const shortVision = vision.split(/[.!?]/)[0].slice(0, 90);
  if (category === 'Education') {
    if (horizon === '7 days') return 'Complete the next course milestone';
    if (horizon === '30 days') return 'Complete three education milestones';
    if (horizon === '90 days') return 'Reach visible graduation momentum';
    if (horizon === '180 days') return 'Complete the majority of the graduation path';
  }
  if (category === 'Health') {
    if (horizon === '7 days') return 'Establish the weekly health baseline';
    if (horizon === '30 days') return 'Show a measurable health trend';
    if (horizon === '90 days') return 'Lock in the target health rhythm';
  }
  if (category === 'Travel') {
    if (horizon === '30 days') return 'Confirm next travel logistics';
    if (horizon === '90 days') return 'Stabilize the next travel chapter';
  }
  return `${horizon}: ${shortVision}`;
}

export function buildAdaptivePlan(input: {
  vision: string;
  success?: string | null;
  concerns?: string | null;
  opportunities?: string | null;
}) {
  const category = inferCategory(`${input.vision} ${input.success || ''}`);
  const objectives = [
    {
      title: input.success || input.vision.split(/[.!?]/)[0].slice(0, 180),
      category,
      priority: 'high',
      progress: 0,
      deadline: addDays(180),
      description: `Generated from life direction: ${input.vision}`,
      metadata: { source: 'adaptive_plan', concerns: input.concerns || null, opportunities: input.opportunities || null },
    },
    input.concerns ? {
      title: `Reduce risk: ${input.concerns.split(/[.!?]/)[0].slice(0, 150)}`,
      category,
      priority: 'medium',
      progress: 0,
      deadline: addDays(90),
      description: 'Generated from onboarding concerns.',
      metadata: { source: 'adaptive_plan' },
    } : null,
  ].filter(Boolean);
  const goals = [
    { title: benchmarkTitle(input.vision, '30 days', category), category, target_date: addDays(30), description: 'Generated 30-day milestone.' },
    { title: benchmarkTitle(input.vision, '90 days', category), category, target_date: addDays(90), description: 'Generated 90-day milestone.' },
    { title: benchmarkTitle(input.vision, '180 days', category), category, target_date: addDays(180), description: 'Generated 180-day milestone.' },
  ];
  const tasks = [
    { title: 'Review generated plan and accept the next milestone', priority: 'high', due_at: new Date(Date.now() + 86400000).toISOString(), estimated_minutes: 20 },
    { title: `Take one concrete action toward ${goals[0].title}`, priority: 'high', due_at: new Date(Date.now() + 3 * 86400000).toISOString(), estimated_minutes: 45 },
    { title: 'Log a check-in after completing the action', priority: 'medium', due_at: new Date(Date.now() + 4 * 86400000).toISOString(), estimated_minutes: 10 },
  ];
  const benchmarks = horizons.map(([horizon, days]) => ({
    horizon,
    target_date: addDays(days),
    title: benchmarkTitle(input.vision, horizon, category),
    description: `Adaptive benchmark generated from stated life direction and current context.`,
    category,
    source: 'adaptive_plan',
    evidence: { vision: input.vision, success: input.success || null } as Json,
  }));
  return { category, objectives, goals, tasks, benchmarks };
}

export async function generateAdaptivePlanForUser(supabase: SupabaseClient<Database>, userId: string) {
  const [{ data: profile, error: profileError }, { data: context, error: contextError }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).single(),
    supabase.from('ai_context_profiles').select('*').eq('user_id', userId).maybeSingle(),
  ]);
  if (profileError) throw profileError;
  if (contextError) throw contextError;
  const snapshot = (context?.onboarding_snapshot || {}) as Record<string, unknown>;
  const plan = buildAdaptivePlan({
    vision: String(profile?.one_year_vision || snapshot.one_year_vision || 'Build a clearer life operating system.'),
    success: String(snapshot.year_success || ''),
    concerns: String(snapshot.biggest_concerns || ''),
    opportunities: String(snapshot.biggest_opportunities || ''),
  });
  const { error: archiveBenchmarksError } = await supabase.from('life_benchmarks').update({ status: 'archived' } as never).eq('user_id', userId).neq('status', 'completed');
  if (archiveBenchmarksError) throw archiveBenchmarksError;
  const [{ data: objectiveRows, error: objectiveError }, { data: goalRows, error: goalError }, benchmarkResult] = await Promise.all([
    supabase.from('objectives').insert(plan.objectives.map((item) => ({ ...item, user_id: userId })) as never).select('*'),
    supabase.from('goals').insert(plan.goals.map((item) => ({ ...item, user_id: userId })) as never).select('*'),
    supabase.from('life_benchmarks').insert(plan.benchmarks.map((item) => ({ ...item, user_id: userId })) as never).select('*'),
  ]);
  if (objectiveError) throw objectiveError;
  if (goalError) throw goalError;
  if (benchmarkResult.error) throw benchmarkResult.error;
  const firstObjectiveId = objectiveRows?.[0]?.id;
  const firstGoalId = goalRows?.[0]?.id;
  const { data: taskRows, error: taskError } = await supabase.from('tasks').insert(plan.tasks.map((task) => ({
    ...task,
    user_id: userId,
    objective_id: firstObjectiveId || null,
    goal_id: firstGoalId || null,
    status: 'todo',
  })) as never).select('*');
  if (taskError) throw taskError;
  return { ...plan, objectives: objectiveRows || [], goals: goalRows || [], tasks: taskRows || [], benchmarks: benchmarkResult.data || [] };
}
