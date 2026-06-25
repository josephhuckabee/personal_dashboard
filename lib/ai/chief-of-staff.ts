import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDashboardSnapshot } from '@/lib/dashboard';
import { chiefOfStaffBriefingSchema, type ChiefOfStaffBriefing } from '@/lib/schemas';
import { serverEnv } from '@/lib/env';
import { getMemoryContext } from '@/lib/ai/memory';

const systemPrompt = `You are the user's private operational AI Chief of Staff inside You OS.
Use only facts in the supplied Supabase snapshot. Never invent missing facts; explicitly say when required data is missing.
Return JSON only matching the requested schema. No markdown.
Recommendations are operational guidance, never medical, legal, or financial certainty.
Prioritize what matters now, what is at risk, the next concrete action, and whether behavior is moving toward stated objectives.`;

function extractJson(text: string) {
  return JSON.parse(text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim());
}

function deterministicBriefing(snapshot: Awaited<ReturnType<typeof getDashboardSnapshot>>): ChiefOfStaffBriefing {
  const objectives = snapshot.objectives as Array<Record<string, unknown> & { calculated_status: string }>;
  const habits = snapshot.habits as Array<Record<string, unknown> & { weeklyConsistency: number }>;
  const atRisk = objectives.filter((objective) => objective.calculated_status === 'at_risk');
  const openTasks = snapshot.tasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled');
  const strongestHabit = habits.slice().sort((a, b) => b.weeklyConsistency - a.weeklyConsistency)[0];
  const missing = snapshot.objectives.length === 0 ? ' Objective data is missing.' : '';
  return {
    summary: `Execution readiness is ${snapshot.executionReadiness}/100.${missing}`,
    top_priorities: openTasks.slice(0, 4).map((task) => ({ title: String(task.title), reason: task.due_at ? `Due ${new Date(String(task.due_at)).toLocaleDateString()}.` : 'This is an open recorded task.', category: String(task.priority || 'medium'), estimated_minutes: Number(task.estimated_minutes || 45) })),
    risks: atRisk.map((objective) => ({ title: String(objective.title), reason: 'Deadline, progress, or recent activity is outside the healthy range.', severity: 'high' as const, recommended_action: 'Define and complete the next measurable task.' })),
    opportunities: habits.filter((habit) => habit.weeklyConsistency >= 70).slice(0, 3).map((habit) => ({ title: `${String(habit.name)} momentum`, reason: `${habit.weeklyConsistency}% consistency over the last seven days.`, impact: 'medium' as const, recommended_action: 'Protect the next scheduled repetition.' })),
    recommended_focus: openTasks[0] ? String(openTasks[0].title) : 'Record one concrete next action for the most important goal.',
    recommended_avoidance: strongestHabit ? `Avoid letting lower-value work displace ${String(strongestHabit.name)} momentum.` : 'Avoid adding unrecorded work before defining the next task.',
    execution_readiness_score: snapshot.executionReadiness,
    chief_of_staff_note: openTasks.length ? 'Complete the highest-priority open task before adding new work.' : 'Task data is missing or no open work is recorded. Define the next concrete action.',
    memories_used: [],
  };
}

export async function generateChiefOfStaffBriefing(userId: string) {
  const supabase = createAdminClient();
  const snapshot = await getDashboardSnapshot(supabase, userId);
  const memoryContext = await getMemoryContext(supabase, userId);
  const env = serverEnv();
  let briefing: ChiefOfStaffBriefing;
  let provider = 'deterministic';
  let model = 'rules-v1';
  let inputTokens = 0;
  let outputTokens = 0;
  const compactSnapshot = {
    profile: snapshot.profile,
    preferences: snapshot.preferences ? { chief_of_staff_tone: snapshot.preferences.chief_of_staff_tone } : null,
    goals: snapshot.goals.map((goal) => ({ title: goal.title, progress: goal.progress, status: goal.status, target_date: goal.target_date })),
    objectives: (snapshot.objectives as Array<Record<string, unknown> & { calculated_status: string }>).map((objective) => ({ title: objective.title, progress: objective.progress, deadline: objective.deadline, status: objective.calculated_status })),
    active_tasks: snapshot.tasks.filter((task) => !['completed', 'cancelled'].includes(String(task.status))).slice(0, 20).map((task) => ({ title: task.title, priority: task.priority, due_at: task.due_at, estimated_minutes: task.estimated_minutes })),
    habits: (snapshot.habits as Array<Record<string, unknown> & { streak: number; weeklyConsistency: number; monthlyConsistency: number }>).map((habit) => ({ name: habit.name, streak: habit.streak, weekly_consistency: habit.weeklyConsistency, monthly_consistency: habit.monthlyConsistency })),
    finance: { current_cash: snapshot.finance.currentCash, monthly_burn: snapshot.finance.monthlyBurn, monthly_income: snapshot.finance.monthlyIncome, runway_months: snapshot.finance.runwayMonths, risk_score: snapshot.finance.financialRiskScore },
    travel: snapshot.travel.slice(0, 8),
    recent_checkins: snapshot.checkins.slice(0, 7),
    recent_briefings: snapshot.briefing ? [{ summary: snapshot.briefing.summary, chief_of_staff_note: snapshot.briefing.chief_of_staff_note, created_at: snapshot.briefing.created_at }] : [],
    memories: memoryContext.compact,
  };
  const schemaExample = { summary: 'string', top_priorities: [{ title: 'string', reason: 'string', category: 'string', estimated_minutes: 30 }], risks: [{ title: 'string', severity: 'low|medium|high', reason: 'string', recommended_action: 'string' }], opportunities: [{ title: 'string', impact: 'low|medium|high', reason: 'string', recommended_action: 'string' }], recommended_focus: 'string', recommended_avoidance: 'string', execution_readiness_score: 0, chief_of_staff_note: 'string', memories_used: ['memory uuid'] };
  const input = `${systemPrompt}\n\nRequired JSON schema:\n${JSON.stringify(schemaExample)}\n\nCompact user-scoped context:\n${JSON.stringify(compactSnapshot)}`;
  try {
    if (env.AI_PROVIDER === 'anthropic' && env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({ model: env.AI_MODEL, max_tokens: 2500, system: systemPrompt, messages: [{ role: 'user', content: input }] });
      const text = response.content.find((block) => block.type === 'text');
      if (!text || text.type !== 'text') throw new Error('Anthropic returned no briefing text.');
      briefing = chiefOfStaffBriefingSchema.parse(extractJson(text.text)); provider = 'anthropic'; model = env.AI_MODEL; inputTokens = response.usage.input_tokens; outputTokens = response.usage.output_tokens;
    } else if (env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
      const response = await openai.responses.create({ model: env.AI_MODEL, input, text: { format: { type: 'json_object' } } } as never);
      briefing = chiefOfStaffBriefingSchema.parse(extractJson(response.output_text)); provider = 'openai'; model = env.AI_MODEL; inputTokens = response.usage?.input_tokens || 0; outputTokens = response.usage?.output_tokens || 0;
    } else {
      briefing = chiefOfStaffBriefingSchema.parse(deterministicBriefing(snapshot));
    }
  } catch (error) {
    console.error('Chief of Staff briefing AI fallback:', error);
    briefing = chiefOfStaffBriefingSchema.parse(deterministicBriefing(snapshot));
    provider = 'deterministic'; model = 'rules-v1'; inputTokens = 0; outputTokens = 0;
  }
  const { data, error } = await supabase.from('ai_briefings').insert({
    user_id: userId,
    briefing_date: new Date().toISOString().slice(0, 10),
    ...briefing,
    current_risks: briefing.risks,
    today_plan: briefing.top_priorities.map((item) => ({ task: item.title, priority: item.category, estimated_minutes: item.estimated_minutes })),
    finance_analysis: { current_cash: snapshot.finance.currentCash || null, monthly_burn: snapshot.finance.monthlyBurn || null, runway_months: snapshot.finance.runwayMonths, warning: snapshot.finance.monthlyBurn === 0 ? 'Spending data is missing; runway cannot be calculated reliably.' : null },
    provider,
    model,
    source_snapshot: compactSnapshot,
  } as never).select().single();
  if (error) throw error;
  if (provider !== 'deterministic') {
    const estimatedCost = provider === 'anthropic' ? inputTokens / 1_000_000 * 3 + outputTokens / 1_000_000 * 15 : inputTokens / 1_000_000 * 2 + outputTokens / 1_000_000 * 8;
    const { error: usageError } = await supabase.from('ai_usage_logs').insert({ user_id: userId, feature: 'generate_briefing', provider, model, input_tokens: inputTokens, output_tokens: outputTokens, estimated_cost: estimatedCost } as never);
    if (usageError) console.error('Could not save AI usage log:', usageError);
  }
  return data;
}
