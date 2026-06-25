import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import { serverEnv } from '@/lib/env';
import { weeklyReviewSchema, type WeeklyReview } from '@/lib/schemas';
import { createMemoriesFromCandidates, detectWeeklyPatterns, getMemoryContext, summarizeWeek } from '@/lib/ai/memory';

const systemPrompt = `You are the user's private weekly review engine inside You OS.
Use only the supplied user-scoped data and memories. Never invent missing facts.
Return JSON only. Medical, legal, and financial subjects are operational guidance, not professional certainty.
Focus on wins, losses, lessons, risks, opportunities, habit analysis, finance analysis, goal progress, and next-week focus.`;

const parseJson = (text: string) => JSON.parse(text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim());

function weekBounds() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { weekStart: start.toISOString().slice(0, 10), weekEnd: end.toISOString().slice(0, 10) };
}

function fallback(summary: ReturnType<typeof summarizeWeek>): WeeklyReview {
  const bestHabit = summary.habits.slice().sort((a, b) => Number(b.weekly_consistency || 0) - Number(a.weekly_consistency || 0))[0];
  const weakHabit = summary.habits.slice().sort((a, b) => Number(a.weekly_consistency || 0) - Number(b.weekly_consistency || 0))[0];
  const atRisk = summary.objectives.filter((item) => item.status === 'at_risk');
  return weeklyReviewSchema.parse({
    wins: summary.completed_tasks.length ? summary.completed_tasks.slice(0, 5) : ['No completed tasks were recorded this week.'],
    losses: summary.missed_tasks.length ? summary.missed_tasks.slice(0, 5) : ['No missed tasks were detected from recorded due dates.'],
    lessons: bestHabit ? [`${bestHabit.name} is the strongest recorded execution input this week.`] : ['Habit data is missing, so habit lessons are limited.'],
    risks: atRisk.length ? atRisk.map((item) => `${item.title} is at risk.`) : ['No at-risk objectives were detected from current records.'],
    opportunities: bestHabit ? [`Use ${bestHabit.name} as an anchor habit next week.`] : ['Add habit data to expose stronger opportunity patterns.'],
    habit_analysis: bestHabit && weakHabit ? `Strongest habit: ${bestHabit.name} at ${bestHabit.weekly_consistency}%. Weakest habit: ${weakHabit.name} at ${weakHabit.weekly_consistency}%.` : 'Habit data is missing.',
    finance_analysis: summary.finance.monthly_burn ? `Current cash is ${summary.finance.current_cash}; estimated monthly burn is ${summary.finance.monthly_burn}; runway is ${summary.finance.runway_months ?? 'unknown'} months.` : 'Spending data is missing, so runway cannot be calculated reliably.',
    goal_progress: summary.objectives.length ? summary.objectives.map((item) => `${item.title}: ${item.progress}% (${item.status})`).join(' ') : 'Goal and objective data is missing.',
    recommended_next_week_focus: atRisk[0]?.title || summary.missed_tasks[0] || summary.completed_tasks[0] || 'Define one measurable priority for next week.',
    memories_created: [],
  });
}

export async function generateWeeklyReview(userId: string) {
  const supabase = createAdminClient();
  const { snapshot } = await detectWeeklyPatterns(supabase, userId);
  const memoryContext = await getMemoryContext(supabase, userId);
  const summary = summarizeWeek(snapshot);
  const env = serverEnv();
  const { weekStart, weekEnd } = weekBounds();
  const schemaExample = { wins: ['string'], losses: ['string'], lessons: ['string'], risks: ['string'], opportunities: ['string'], habit_analysis: 'string', finance_analysis: 'string', goal_progress: 'string', recommended_next_week_focus: 'string', memories_created: ['string'] };
  const prompt = `${systemPrompt}\nRequired schema: ${JSON.stringify(schemaExample)}\nWeek: ${weekStart} to ${weekEnd}\nCompact week summary: ${JSON.stringify(summary)}\nRelevant memories: ${JSON.stringify(memoryContext.compact)}`;
  let review: WeeklyReview;
  let provider = 'deterministic';
  let model = 'rules-v1';
  let inputTokens = 0;
  let outputTokens = 0;
  try {
    if (env.AI_PROVIDER === 'anthropic' && env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({ model: env.AI_MODEL, max_tokens: 2400, system: systemPrompt, messages: [{ role: 'user', content: prompt }] });
      const block = response.content.find((item) => item.type === 'text');
      if (!block || block.type !== 'text') throw new Error('No weekly review output.');
      review = weeklyReviewSchema.parse(parseJson(block.text)); provider = 'anthropic'; model = env.AI_MODEL; inputTokens = response.usage.input_tokens; outputTokens = response.usage.output_tokens;
    } else if (env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
      const response = await openai.responses.create({ model: env.AI_MODEL, input: prompt, text: { format: { type: 'json_object' } } } as never);
      review = weeklyReviewSchema.parse(parseJson(response.output_text)); provider = 'openai'; model = env.AI_MODEL; inputTokens = response.usage?.input_tokens || 0; outputTokens = response.usage?.output_tokens || 0;
    } else review = fallback(summary);
  } catch (error) {
    console.error('Weekly review AI fallback:', error);
    review = fallback(summary);
    provider = 'deterministic'; model = 'rules-v1';
  }

  const memoryRows = await createMemoriesFromCandidates(supabase, userId, [
    ...review.lessons.map((lesson) => ({ type: 'lesson' as const, title: `Weekly lesson: ${lesson.slice(0, 90)}`, content: lesson, source: 'weekly_review', importance_score: 72, confidence_score: 78 })),
    ...review.risks.map((risk) => ({ type: 'risk' as const, title: `Weekly risk: ${risk.slice(0, 90)}`, content: risk, source: 'weekly_review', importance_score: 76, confidence_score: 78 })),
    ...review.opportunities.map((opportunity) => ({ type: 'opportunity' as const, title: `Weekly opportunity: ${opportunity.slice(0, 90)}`, content: opportunity, source: 'weekly_review', importance_score: 68, confidence_score: 76 })),
  ]);
  review.memories_created = memoryRows.map((memory) => String(memory.id));

  const { data, error } = await supabase.from('weekly_reviews').upsert({
    user_id: userId,
    week_start: weekStart,
    week_end: weekEnd,
    ...review,
    provider,
    model,
    source_snapshot: summary,
  } as never, { onConflict: 'user_id,week_start' }).select().single();
  if (error) throw error;

  if (provider !== 'deterministic') {
    const estimatedCost = provider === 'anthropic' ? inputTokens / 1_000_000 * 3 + outputTokens / 1_000_000 * 15 : inputTokens / 1_000_000 * 2 + outputTokens / 1_000_000 * 8;
    const { error: usageError } = await supabase.from('ai_usage_logs').insert({ user_id: userId, feature: 'weekly_review', provider, model, input_tokens: inputTokens, output_tokens: outputTokens, estimated_cost: estimatedCost } as never);
    if (usageError) console.error('Could not save AI usage log:', usageError);
  }

  return data;
}
