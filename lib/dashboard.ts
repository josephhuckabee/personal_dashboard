import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

const n = (value: unknown) => Number(value || 0);
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export function calculateObjectiveRisk(objective: Record<string, unknown>, recentActivity = 0) {
  const progress = n(objective.progress);
  if (progress >= 100) return 'completed';
  if (!objective.deadline) return recentActivity > 0 ? 'healthy' : 'watch';
  const totalDays = Math.max(1, Math.ceil((new Date(String(objective.deadline)).getTime() - new Date(String(objective.created_at)).getTime()) / 86400000));
  const daysLeft = Math.ceil((new Date(String(objective.deadline)).getTime() - Date.now()) / 86400000);
  const expectedProgress = Math.min(100, Math.max(0, (1 - daysLeft / totalDays) * 100));
  if (daysLeft < 0 || progress + 15 < expectedProgress || (recentActivity === 0 && daysLeft < 30)) return 'at_risk';
  if (progress + 5 < expectedProgress || recentActivity === 0) return 'watch';
  return 'healthy';
}

export function habitStats(logs: Array<Record<string, unknown>>) {
  const completed = new Set(logs.filter((log) => log.completed).map((log) => String(log.logged_on)));
  let streak = 0;
  const cursor = new Date();
  if (!completed.has(isoDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (completed.has(isoDate(cursor))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  const countSince = (days: number) => {
    const start = new Date(); start.setDate(start.getDate() - days + 1);
    return [...completed].filter((date) => new Date(date) >= new Date(isoDate(start))).length;
  };
  return { streak, weeklyConsistency: Math.round(countSince(7) / 7 * 100), monthlyConsistency: Math.round(countSince(30) / 30 * 100) };
}

export async function getDashboardSnapshot(supabase: SupabaseClient<Database>, userId: string) {
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString().slice(0, 10);
  const [profileResult, preferencesResult, goalsResult, objectivesResult, tasksResult, habitsResult, logsResult, accountsResult, transactionsResult, incomeResult, travelResult, contentResult, healthResult, checkinResult, briefingResult, decisionResult, contextResult, memoriesResult, reviewResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).single(),
    supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('goals').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('objectives').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('tasks').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('habits').select('*').eq('user_id', userId).eq('active', true).order('created_at'),
    supabase.from('habit_logs').select('*').eq('user_id', userId).gte('logged_on', isoDate(new Date(Date.now() - 30 * 86400000))),
    supabase.from('finance_accounts').select('*').eq('user_id', userId).eq('active', true),
    supabase.from('transactions').select('*').eq('user_id', userId).gte('transaction_date', monthStart),
    supabase.from('income').select('*').eq('user_id', userId).gte('received_on', monthStart),
    supabase.from('travel_plans').select('*').eq('user_id', userId).order('arrival_at'),
    supabase.from('content_projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('health_metrics').select('*').eq('user_id', userId).gte('recorded_at', since30),
    supabase.from('daily_checkins').select('*').eq('user_id', userId).order('checkin_date', { ascending: false }).limit(7),
    supabase.from('ai_briefings').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('ai_decisions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('ai_context_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('memories').select('*').eq('user_id', userId).is('inaccurate_at', null).order('importance_score', { ascending: false }).order('created_at', { ascending: false }).limit(40),
    supabase.from('weekly_reviews').select('*').eq('user_id', userId).order('week_start', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const failures = [profileResult, preferencesResult, goalsResult, objectivesResult, tasksResult, habitsResult, logsResult, accountsResult, transactionsResult, incomeResult, travelResult, contentResult, healthResult, checkinResult, briefingResult, decisionResult, contextResult, memoriesResult, reviewResult].filter((result) => result.error);
  if (failures.length) throw failures[0].error;
  const objectives = (objectivesResult.data || []) as Array<Record<string, unknown>>;
  const tasks = (tasksResult.data || []) as Array<Record<string, unknown>>;
  const habits = (habitsResult.data || []) as Array<Record<string, unknown>>;
  const logs = (logsResult.data || []) as Array<Record<string, unknown>>;
  const transactions = (transactionsResult.data || []) as Array<Record<string, unknown>>;
  const accounts = (accountsResult.data || []) as Array<Record<string, unknown>>;
  const currentCash = accounts.reduce((sum, account) => sum + n(account.current_balance), 0);
  const monthlySpend = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + n(item.amount), 0);
  const monthlyIncome = (incomeResult.data || []).reduce((sum, item) => sum + n(item.amount), 0);
  const daysElapsed = Math.max(1, new Date().getUTCDate());
  const dailyAverageSpend = monthlySpend / daysElapsed;
  const monthlyBurn = dailyAverageSpend * 30;
  const runwayMonths = monthlyBurn > 0 ? currentCash / monthlyBurn : null;
  const financialRiskScore = Math.round(Math.min(100, monthlyBurn === 0 ? 20 : runwayMonths === null ? 60 : runwayMonths < 1 ? 95 : runwayMonths < 3 ? 75 : runwayMonths < 6 ? 45 : 15));
  const objectivesWithRisk = objectives.map((objective) => {
    const activity = tasks.filter((task) => task.objective_id === objective.id && new Date(String(task.updated_at || task.created_at)) >= new Date(since7)).length + logs.filter((log) => habits.some((habit) => habit.id === log.habit_id && habit.objective_id === objective.id)).length;
    return { ...objective, calculated_status: calculateObjectiveRisk(objective, activity) };
  });
  const habitRows = habits.map((habit) => ({ ...habit, ...habitStats(logs.filter((log) => log.habit_id === habit.id)), logs: logs.filter((log) => log.habit_id === habit.id) }));
  const today = isoDate(new Date());
  const todayStart = new Date(`${today}T00:00:00`).getTime();
  const tomorrowStart = todayStart + 86400000;
  const openTasks = tasks.filter((task) => !['completed', 'cancelled'].includes(String(task.status)));
  const tasksDueToday = openTasks.filter((task) => task.due_at && new Date(String(task.due_at)).getTime() >= todayStart && new Date(String(task.due_at)).getTime() < tomorrowStart);
  const overdueTasks = openTasks.filter((task) => task.due_at && new Date(String(task.due_at)).getTime() < todayStart);
  const upcomingTasks = openTasks.filter((task) => task.due_at && new Date(String(task.due_at)).getTime() >= tomorrowStart).sort((a, b) => new Date(String(a.due_at)).getTime() - new Date(String(b.due_at)).getTime());
  const habitsCompletedToday = logs.filter((log) => log.completed && log.logged_on === today).length;
  const readinessInputs = [
    habitRows.length ? habitRows.reduce((sum, habit) => sum + habit.weeklyConsistency, 0) / habitRows.length : null,
    objectives.length ? objectives.reduce((sum, objective) => sum + n(objective.progress), 0) / objectives.length : null,
    tasks.length ? tasks.filter((task) => task.status === 'completed').length / tasks.length * 100 : null,
    checkinResult.data?.[0] ? (n(checkinResult.data[0].energy) * 12 + (6 - n(checkinResult.data[0].stress)) * 8) : null,
  ].filter((value): value is number => value !== null);
  const executionReadiness = readinessInputs.length ? Math.round(readinessInputs.reduce((sum, value) => sum + value, 0) / readinessInputs.length) : 0;
  return {
    profile: profileResult.data ? { ...profileResult.data, display_name: profileResult.data.preferred_name } : null,
    preferences: preferencesResult.data,
    aiContext: contextResult.data,
    goals: goalsResult.data || [],
    objectives: objectivesWithRisk,
    tasks,
    habits: habitRows,
    finance: { currentCash, monthlySpend, monthlyBurn, monthlyIncome, runwayMonths, dailyAverageSpend, financialRiskScore, accounts: accountsResult.data || [], transactions, income: incomeResult.data || [] },
    travel: travelResult.data || [], content: contentResult.data || [], health: healthResult.data || [], checkins: checkinResult.data || [],
    briefing: briefingResult.data,
    decision: decisionResult.data,
    memories: memoriesResult.data || [],
    weeklyReview: reviewResult.data,
    liveMetrics: { habitsDueToday: habitRows.length, habitsCompletedToday, tasksDueToday: tasksDueToday.length, overdueTasks: overdueTasks.length, upcomingTasks: upcomingTasks.slice(0, 10) },
    executionReadiness,
  };
}
