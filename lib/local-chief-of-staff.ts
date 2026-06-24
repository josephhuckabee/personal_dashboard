import { createAdminClient } from '@/lib/supabase/admin';
import { getDashboardSnapshot } from '@/lib/dashboard';

export function buildLocalChiefOfStaffSummary(snapshot: Awaited<ReturnType<typeof getDashboardSnapshot>>) {
  const habits = (snapshot.habits as Array<Record<string, unknown> & { weeklyConsistency: number }>).slice().sort((a, b) => a.weeklyConsistency - b.weeklyConsistency);
  const tasks = snapshot.tasks as Array<Record<string, unknown>>;
  const now = Date.now();
  const open = tasks.filter((task) => !['completed', 'cancelled'].includes(String(task.status)));
  const overdueTasks = open.filter((task) => task.due_at && new Date(String(task.due_at)).getTime() < now).sort((a, b) => new Date(String(a.due_at)).getTime() - new Date(String(b.due_at)).getTime());
  const goalsAtRisk = (snapshot.objectives as Array<Record<string, unknown> & { calculated_status: string }>).filter((goal) => goal.calculated_status === 'at_risk');
  const highPriority = open.filter((task) => task.priority === 'high').sort((a, b) => Number(Boolean(a.due_at)) - Number(Boolean(b.due_at)))[0];
  const focusTask = overdueTasks[0] || highPriority || open[0];
  return {
    weakest_habit: habits[0] ? { id: habits[0].id, name: habits[0].name, consistency: habits[0].weeklyConsistency } : null,
    strongest_habit: habits.at(-1) ? { id: habits.at(-1)?.id, name: habits.at(-1)?.name, consistency: habits.at(-1)?.weeklyConsistency } : null,
    overdue_tasks: overdueTasks.map((task) => ({ id: task.id, title: task.title, due_at: task.due_at, priority: task.priority })),
    goals_at_risk: goalsAtRisk.map((goal) => ({ id: goal.id, title: goal.title, progress: goal.progress })),
    finance_risk: { score: snapshot.finance.financialRiskScore, runway_months: snapshot.finance.runwayMonths, current_cash: snapshot.finance.currentCash },
    today_best_focus: focusTask ? `Complete ${String(focusTask.title)}.` : habits[0] ? `Protect today’s ${String(habits[0].name)} habit.` : 'Define one concrete priority for today.',
    recommended_avoidance: overdueTasks.length ? 'Avoid adding new goals before completing today’s existing overdue work.' : 'Avoid adding new commitments before completing the current highest-priority task.',
  };
}

export async function generateLocalChiefOfStaffSummary(userId: string) {
  const supabase = createAdminClient();
  return buildLocalChiefOfStaffSummary(await getDashboardSnapshot(supabase, userId));
}
