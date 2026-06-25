import { createAdminClient } from '@/lib/supabase/admin';
import { weeklyReviewSchema, type WeeklyReview } from '@/lib/schemas';
import { createMemoriesFromCandidates, detectWeeklyPatterns, summarizeWeek } from '@/lib/ai/memory';

function cite(source: string, label: string, value: unknown) {
  return { source, label, value };
}

function weekBounds() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { weekStart: start.toISOString().slice(0, 10), weekEnd: end.toISOString().slice(0, 10) };
}

function deterministicReview(summary: ReturnType<typeof summarizeWeek>): WeeklyReview {
  const bestHabit = summary.habits.slice().sort((a, b) => Number(b.weekly_consistency || 0) - Number(a.weekly_consistency || 0))[0];
  const weakHabit = summary.habits.slice().sort((a, b) => Number(a.weekly_consistency || 0) - Number(b.weekly_consistency || 0))[0];
  const atRisk = summary.objectives.filter((item) => item.status === 'at_risk');
  const travelPlans = summary.travel || [];
  const nextTravel = travelPlans.find((item) => item.arrival_at && new Date(String(item.arrival_at)).getTime() >= Date.now());
  const adjustments = [
    ...(atRisk[0] ? [`Create one concrete recovery task for ${atRisk[0].title}.`] : []),
    ...(weakHabit && Number(weakHabit.weekly_consistency) < 50 ? [`Lower friction for ${weakHabit.name}; it is the weakest habit this week.`] : []),
    ...(summary.finance.risk_score >= 70 ? ['Review discretionary spending before adding new commitments.'] : []),
    ...(summary.missed_tasks[0] ? ['Move or close overdue tasks instead of carrying stale commitments.'] : []),
  ];
  return weeklyReviewSchema.parse({
    wins: summary.completed_tasks.length ? summary.completed_tasks.slice(0, 5) : ['No completed tasks were recorded this week.'],
    losses: summary.missed_tasks.length ? summary.missed_tasks.slice(0, 5) : ['No missed tasks were detected from recorded due dates.'],
    lessons: bestHabit ? [`${bestHabit.name} is the strongest recorded execution input this week.`] : ['Habit data is missing, so habit lessons are limited.'],
    risks: atRisk.length ? atRisk.map((item) => `${item.title} is at risk.`) : ['No at-risk objectives were detected from current records.'],
    opportunities: bestHabit ? [`Use ${bestHabit.name} as an anchor habit next week.`] : ['Add habit data to expose stronger opportunity patterns.'],
    habit_analysis: bestHabit && weakHabit ? `Strongest habit: ${bestHabit.name} at ${bestHabit.weekly_consistency}%. Weakest habit: ${weakHabit.name} at ${weakHabit.weekly_consistency}%.` : 'Habit data is missing.',
    finance_analysis: summary.finance.monthly_burn ? `Current cash is ${summary.finance.current_cash}; estimated monthly burn is ${summary.finance.monthly_burn}; runway is ${summary.finance.runway_months ?? 'unknown'} months.` : 'Spending data is missing, so runway cannot be calculated reliably.',
    goal_progress: summary.objectives.length ? summary.objectives.map((item) => `${item.title}: ${item.progress}% (${item.status})`).join(' ') : 'Goal and objective data is missing.',
    travel_summary: travelPlans.length ? `${travelPlans.length} travel plan${travelPlans.length === 1 ? '' : 's'} recorded.${nextTravel ? ` Next arrival: ${nextTravel.title}.` : ''}` : 'Travel data is missing.',
    recommended_next_week_focus: atRisk[0]?.title || summary.missed_tasks[0] || summary.completed_tasks[0] || 'Define one measurable priority for next week.',
    recommended_adjustments: adjustments.length ? adjustments : ['Keep recording tasks, check-ins, habits, finance, and travel so next week has stronger evidence.'],
    citations: [
      cite('tasks', 'completed_tasks', summary.completed_tasks.length),
      cite('tasks', 'missed_tasks', summary.missed_tasks.length),
      cite('habits', 'best_habit', bestHabit || null),
      cite('habits', 'weak_habit', weakHabit || null),
      cite('objectives', 'at_risk_count', atRisk.length),
      cite('finance', 'risk_score', summary.finance.risk_score),
      cite('travel_plans', 'count', travelPlans.length),
      cite('daily_checkins', 'count', summary.checkins.length),
    ],
    memories_created: [],
  });
}

export async function generateWeeklyReview(userId: string) {
  const supabase = createAdminClient();
  const { snapshot } = await detectWeeklyPatterns(supabase, userId);
  const summary = summarizeWeek(snapshot);
  const { weekStart, weekEnd } = weekBounds();
  const review = deterministicReview(summary);

  const memoryRows = await createMemoriesFromCandidates(supabase, userId, [
    ...review.lessons.map((lesson) => ({ type: 'lesson' as const, category: 'Goals' as const, title: `Weekly lesson: ${lesson.slice(0, 90)}`, content: lesson, source: 'weekly_review', importance_score: 72, confidence_score: 88 })),
    ...review.risks.map((risk) => ({ type: 'risk' as const, category: 'Goals' as const, title: `Weekly risk: ${risk.slice(0, 90)}`, content: risk, source: 'weekly_review', importance_score: 76, confidence_score: 88 })),
    ...review.opportunities.map((opportunity) => ({ type: 'opportunity' as const, category: 'Career' as const, title: `Weekly opportunity: ${opportunity.slice(0, 90)}`, content: opportunity, source: 'weekly_review', importance_score: 68, confidence_score: 86 })),
  ]);
  review.memories_created = memoryRows.map((memory) => String(memory.id));

  const { data, error } = await supabase.from('weekly_reviews').upsert({
    user_id: userId,
    week_start: weekStart,
    week_end: weekEnd,
    ...review,
    provider: 'deterministic',
    model: 'rules-v2',
    source_snapshot: summary,
  } as never, { onConflict: 'user_id,week_start' }).select().single();
  if (error) throw error;
  return data;
}
