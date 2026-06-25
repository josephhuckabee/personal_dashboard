import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/supabase/database.types';
import { getDashboardSnapshot } from '@/lib/dashboard';
import { buildLocalChiefOfStaffSummary } from '@/lib/local-chief-of-staff';

type Snapshot = Awaited<ReturnType<typeof getDashboardSnapshot>>;

const n = (value: unknown) => Number(value || 0);
const today = () => new Date().toISOString().slice(0, 10);
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const riskLevel = (score: number) => score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

function citation(source: string, label: string, value: unknown) {
  return { source, label, value };
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function buildExecutiveIntelligence(snapshot: Snapshot) {
  const local = buildLocalChiefOfStaffSummary(snapshot);
  const objectives = snapshot.objectives as Array<Record<string, unknown> & { calculated_status: string }>;
  const tasks = snapshot.tasks as Array<Record<string, unknown>>;
  const habits = snapshot.habits as Array<Record<string, unknown> & { weeklyConsistency: number; monthlyConsistency: number; streak: number }>;
  const checkins = snapshot.checkins as Array<Record<string, unknown>>;
  const travel = snapshot.travel as Array<Record<string, unknown>>;
  const journal = (snapshot.journal || []) as Array<Record<string, unknown>>;
  const benchmarks = (snapshot.benchmarks || []) as Array<Record<string, unknown>>;
  const openTasks = tasks.filter((task) => !['completed', 'cancelled'].includes(String(task.status)));
  const overdueTasks = local.overdue_tasks || [];
  const latestCheckin = checkins[0] || null;
  const strongestHabit = local.strongest_habit;
  const weakestHabit = local.weakest_habit;
  const atRiskObjectives = objectives.filter((objective) => objective.calculated_status === 'at_risk');
  const watchObjectives = objectives.filter((objective) => objective.calculated_status === 'watch');
  const brokenStreaks = habits.filter((habit) => habit.streak === 0 && habit.weeklyConsistency < 50);
  const missedCheckins = checkins.length === 0 || String(checkins[0]?.checkin_date) !== today();
  const monthExpenses = snapshot.finance.transactions.filter((item) => item.type === 'expense');
  const averageExpense = average(monthExpenses.map((item) => n(item.amount)));
  const spendingAnomalies = monthExpenses.filter((item) => averageExpense > 0 && n(item.amount) >= averageExpense * 2 && n(item.amount) >= 100);
  const activeTravel = travel.find((item) => item.status === 'active') || travel.find((item) => item.arrival_at && new Date(String(item.arrival_at)).getTime() <= Date.now() && (!item.departure_at || new Date(String(item.departure_at)).getTime() >= Date.now()));
  const travelDeadlines = travel.filter((item) => item.visa_deadline && new Date(`${item.visa_deadline}T23:59:59`).getTime() >= Date.now()).sort((a, b) => String(a.visa_deadline).localeCompare(String(b.visa_deadline)));

  const objectiveHealth = objectives.length ? clamp(100 - atRiskObjectives.length / objectives.length * 60 - watchObjectives.length / objectives.length * 25) : 0;
  const financeHealth = clamp(100 - snapshot.finance.financialRiskScore);
  const executionHealth = clamp(100 - Math.min(80, overdueTasks.length * 18) + (openTasks.length ? tasks.filter((task) => task.status === 'completed').length / tasks.length * 20 : 0));
  const habitHealth = habits.length ? clamp(average(habits.map((habit) => habit.weeklyConsistency))) : 0;
  const healthScore = latestCheckin ? clamp(n(latestCheckin.energy) * 7 + (11 - n(latestCheckin.stress)) * 5 + n(latestCheckin.mood) * 4 + n(latestCheckin.productivity) * 4) : habitHealth;
  const growthScore = objectives.length ? clamp(average(objectives.map((objective) => n(objective.progress)))) : 0;
  const operatingScore = clamp(average([executionHealth, healthScore, financeHealth, growthScore]));

  const highestLeverage = overdueTasks[0]?.title
    ? `Complete overdue task: ${overdueTasks[0].title}`
    : local.highest_risk_objective?.title
      ? `Move highest-risk objective: ${local.highest_risk_objective.title}`
      : strongestHabit?.name
        ? `Protect strongest system: ${strongestHabit.name}`
        : 'Create one concrete task tied to the highest-priority objective.';
  const biggestRisk = atRiskObjectives[0]?.title
    ? `${String(atRiskObjectives[0].title)} is at risk`
    : local.financial_warning || (overdueTasks[0] ? `${overdueTasks.length} overdue task${overdueTasks.length === 1 ? '' : 's'}` : 'No high risk detected from current data.');
  const biggestOpportunity = strongestHabit?.name
    ? `${strongestHabit.name} is compounding at ${strongestHabit.consistency}% weekly consistency`
    : watchObjectives[0]?.title
      ? `${String(watchObjectives[0].title)} can be stabilized with one logged action`
      : 'More data will expose stronger opportunity patterns.';
  const latestJournalTheme = Array.isArray(journal[0]?.themes) ? (journal[0].themes as unknown[]).join(', ') : '';

  const warnings = [
    ...overdueTasks.map((task) => ({ title: `Overdue: ${task.title}`, level: 'high', citation: citation('tasks', 'due_at', task.due_at) })),
    ...brokenStreaks.map((habit) => ({ title: `Broken or weak streak: ${String(habit.name)}`, level: 'medium', citation: citation('habits', 'weeklyConsistency', habit.weeklyConsistency) })),
    ...spendingAnomalies.slice(0, 5).map((item) => ({ title: `Spending anomaly: ${String(item.merchant || item.category || 'expense')}`, level: 'medium', citation: citation('transactions', 'amount', item.amount) })),
    ...(missedCheckins ? [{ title: 'Daily check-in missing today', level: 'medium', citation: citation('daily_checkins', 'latest', checkins[0]?.checkin_date || null) }] : []),
  ];

  const risks = [
    { system: 'objectives', level: riskLevel(100 - objectiveHealth), reason: `${atRiskObjectives.length} at risk, ${watchObjectives.length} on watch`, citation: citation('objectives', 'risk_counts', { at_risk: atRiskObjectives.length, watch: watchObjectives.length }) },
    { system: 'finances', level: riskLevel(snapshot.finance.financialRiskScore), reason: local.financial_warning || 'Financial risk is based on cash, burn, income, and runway.', citation: citation('finance', 'financialRiskScore', snapshot.finance.financialRiskScore) },
    { system: 'habits', level: riskLevel(100 - habitHealth), reason: weakestHabit ? `${weakestHabit.name} is weakest at ${weakestHabit.consistency}%` : 'Habit data is missing.', citation: citation('habits', 'weekly_average', habitHealth) },
    { system: 'travel', level: travelDeadlines.length ? 'medium' : 'low', reason: travelDeadlines[0] ? `Next visa deadline: ${String(travelDeadlines[0].visa_deadline)}` : 'No upcoming visa deadline recorded.', citation: citation('travel_plans', 'visa_deadline', travelDeadlines[0]?.visa_deadline || null) },
  ];

  const opportunities = [
    ...(atRiskObjectives.length ? [{ title: 'Recover a slipping goal', reason: `${String(atRiskObjectives[0].title)} is behind pace.`, citation: citation('objectives', 'calculated_status', atRiskObjectives[0].calculated_status) }] : []),
    ...(strongestHabit ? [{ title: 'Use an emerging strength', reason: `${strongestHabit.name} is the strongest habit.`, citation: citation('habits', 'weeklyConsistency', strongestHabit.consistency) }] : []),
    ...(weakestHabit && weakestHabit.consistency < 50 ? [{ title: 'Fix recurring obstacle', reason: `${weakestHabit.name} is the weakest habit.`, citation: citation('habits', 'weeklyConsistency', weakestHabit.consistency) }] : []),
    ...(snapshot.finance.financialRiskScore >= 70 ? [{ title: 'Protect runway', reason: 'Financial concern detected from current cash and burn.', citation: citation('finance', 'runwayMonths', snapshot.finance.runwayMonths) }] : []),
    ...(openTasks.length === 0 ? [{ title: 'Unused planning capacity', reason: 'No open tasks are recorded.', citation: citation('tasks', 'open_count', openTasks.length) }] : []),
  ];

  const citations = [
    citation('tasks', 'open_tasks', openTasks.length),
    citation('tasks', 'overdue_tasks', overdueTasks.length),
    citation('objectives', 'objective_health', objectiveHealth),
    citation('finance', 'monthly_burn', snapshot.finance.monthlyBurn),
    citation('finance', 'runway_months', snapshot.finance.runwayMonths),
    citation('habits', 'habit_health', habitHealth),
    citation('daily_checkins', 'latest_checkin', latestCheckin ? { date: latestCheckin.checkin_date, mood: latestCheckin.mood, energy: latestCheckin.energy, stress: latestCheckin.stress, productivity: latestCheckin.productivity } : null),
    citation('journal_entries', 'latest_themes', latestJournalTheme || null),
    citation('life_benchmarks', 'active_benchmarks', benchmarks.length),
    citation('travel_plans', 'active_location', activeTravel ? { city: activeTravel.city, country: activeTravel.country } : null),
  ];

  return {
    briefing: {
      today: { highest_leverage_action: highestLeverage, biggest_risk: biggestRisk, biggest_opportunity: biggestOpportunity, recommended_focus: local.today_best_focus },
      status: { objective_health: objectiveHealth, financial_health: financeHealth, execution_health: executionHealth, habit_health: habitHealth },
      warnings,
      opportunities,
      risks,
      citations,
    },
    executiveScore: { execution: executionHealth, health: healthScore, finance: financeHealth, growth: growthScore, operating_score: operatingScore, citations },
    strongestSystem: [
      ['Execution', executionHealth],
      ['Health', healthScore],
      ['Finance', financeHealth],
      ['Growth', growthScore],
    ].sort((a, b) => Number(b[1]) - Number(a[1]))[0][0],
    weakestSystem: [
      ['Execution', executionHealth],
      ['Health', healthScore],
      ['Finance', financeHealth],
      ['Growth', growthScore],
    ].sort((a, b) => Number(a[1]) - Number(b[1]))[0][0],
  };
}

export async function persistDailyExecutiveIntelligence(supabase: SupabaseClient<Database>, userId: string, snapshot: Snapshot) {
  const intelligence = buildExecutiveIntelligence(snapshot);
  const scoreDate = today();
  const [briefingResult, scoreResult] = await Promise.all([
    supabase.from('morning_briefings').upsert({
      user_id: userId,
      briefing_date: scoreDate,
      ...intelligence.briefing,
    } as never, { onConflict: 'user_id,briefing_date' }).select().single(),
    supabase.from('executive_scores').upsert({
      user_id: userId,
      score_date: scoreDate,
      ...intelligence.executiveScore,
    } as never, { onConflict: 'user_id,score_date' }).select().single(),
  ]);
  if (briefingResult.error) throw briefingResult.error;
  if (scoreResult.error) throw scoreResult.error;
  return {
    ...intelligence,
    briefingRecord: briefingResult.data,
    scoreRecord: scoreResult.data,
  };
}

export async function getWeeklyTrend(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.from('executive_scores').select('*').eq('user_id', userId).order('score_date', { ascending: false }).limit(7);
  if (error) throw error;
  const rows = data || [];
  const latest = rows[0] ? n(rows[0].operating_score) : null;
  const previous = rows[1] ? n(rows[1].operating_score) : null;
  return { scores: rows, direction: latest == null || previous == null ? 'flat' : latest > previous ? 'up' : latest < previous ? 'down' : 'flat', delta: latest != null && previous != null ? latest - previous : 0 };
}
