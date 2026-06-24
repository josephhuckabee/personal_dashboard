import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDashboardSnapshot } from '@/lib/dashboard';
import { chiefOfStaffDecisionSchema, type ChiefOfStaffDecision } from '@/lib/schemas';
import { serverEnv } from '@/lib/env';
import { buildLocalChiefOfStaffSummary } from '@/lib/local-chief-of-staff';

const safety = `You are the user's private AI Chief of Staff inside You OS.
Analyze only the supplied user-scoped Supabase snapshot. Never invent missing facts.
Follow the user's saved Chief of Staff tone preference without becoming abusive or falsely certain.
Return JSON only. Medical, legal, and financial subjects are operational guidance, not professional certainty.`;

const parseJson = (text: string) => JSON.parse(text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim());

function fallback(snapshot: Awaited<ReturnType<typeof getDashboardSnapshot>>): ChiefOfStaffDecision {
  const openTasks = (snapshot.tasks as Array<Record<string, unknown>>).filter((task) => !['completed', 'cancelled'].includes(String(task.status)));
  const objectives = snapshot.objectives as Array<Record<string, unknown> & { calculated_status: string }>;
  const risks = objectives.filter((item) => item.calculated_status === 'at_risk').slice(0, 4).map((item) => ({ title: String(item.title), reason: 'Recorded progress, deadline, or recent activity is outside the healthy range.', severity: 'high' as const, recommended_action: 'Complete and log the next measurable task.' }));
  if (snapshot.finance.financialRiskScore >= 70) risks.push({ title: 'Financial runway', reason: `Financial risk is ${snapshot.finance.financialRiskScore}/100 based on current cash and trailing spend.`, severity: 'high', recommended_action: 'Review discretionary spending and the next income action.' });
  const strongestHabit = snapshot.habits.slice().sort((a, b) => b.weeklyConsistency - a.weeklyConsistency)[0];
  return {
    top_priorities: openTasks.slice().sort((a, b) => String(b.priority).localeCompare(String(a.priority))).slice(0, 3).map((task) => ({ title: String(task.title), reason: task.due_at ? `Due ${new Date(String(task.due_at)).toLocaleDateString()}.` : 'This is an open recorded task.', priority: ['low','medium','high'].includes(String(task.priority)) ? task.priority as 'low' | 'medium' | 'high' : 'medium', estimated_minutes: Number(task.estimated_minutes || 45) })),
    risks,
    opportunities: strongestHabit ? [{ title: `${String((strongestHabit as Record<string, unknown>).name)} momentum`, reason: `${strongestHabit.weeklyConsistency}% seven-day consistency.`, recommended_action: 'Use this established routine as the anchor for today’s plan.' }] : [],
    recommended_focus: openTasks[0] ? String(openTasks[0].title) : 'Define one measurable task before adding more work.',
    recommended_avoidance: 'Avoid adding unrecorded work that displaces the highest-priority committed task.',
    execution_readiness_score: snapshot.executionReadiness,
    chief_of_staff_note: openTasks.length ? 'Finish the highest-priority recorded commitment before expanding scope.' : 'No open tasks are recorded. Convert the most important objective into a concrete next action.',
  };
}

export async function generateChiefOfStaffDecisionEngine(userId: string) {
  const supabase = createAdminClient();
  const snapshot = await getDashboardSnapshot(supabase, userId);
  const env = serverEnv();
  const localSummary = buildLocalChiefOfStaffSummary(snapshot);
  const profile = snapshot.profile as Record<string, unknown> | null;
  const objectives = snapshot.objectives as Array<Record<string, unknown> & { calculated_status: string }>;
  const compactSnapshot = {
    profile: profile ? { preferred_name: profile.preferred_name, timezone: profile.timezone, one_year_vision: profile.one_year_vision, work_style: profile.work_style } : null,
    preferences: snapshot.preferences ? { chief_of_staff_tone: snapshot.preferences.chief_of_staff_tone } : null,
    goals: snapshot.goals.map((item) => ({ title: item.title, progress: item.progress, target_date: item.target_date, status: item.status })),
    objectives: objectives.map((item) => ({ title: item.title, progress: item.progress, deadline: item.deadline, status: item.calculated_status })),
    open_tasks: (snapshot.tasks as Array<Record<string, unknown>>).filter((item) => !['completed','cancelled'].includes(String(item.status))).slice(0, 20).map((item) => ({ title: item.title, priority: item.priority, due_at: item.due_at })),
    habits: snapshot.habits.map((item) => ({ name: (item as Record<string, unknown>).name, streak: item.streak, weekly_consistency: item.weeklyConsistency })),
    finance: { current_cash: snapshot.finance.currentCash, monthly_burn: snapshot.finance.monthlyBurn, monthly_income: snapshot.finance.monthlyIncome, runway_months: snapshot.finance.runwayMonths, risk_score: snapshot.finance.financialRiskScore },
    travel: snapshot.travel.slice(0, 8), health: snapshot.health.slice(0, 12), latest_checkin: snapshot.checkins[0] || null, content: snapshot.content.slice(0, 8), deterministic_summary: localSummary,
  };
  const schemaExample = { top_priorities: [{ title: 'string', reason: 'string', priority: 'low|medium|high', estimated_minutes: 30 }], risks: [{ title: 'string', reason: 'string', severity: 'low|medium|high', recommended_action: 'string' }], opportunities: [{ title: 'string', reason: 'string', recommended_action: 'string' }], recommended_focus: 'string', recommended_avoidance: 'string', execution_readiness_score: 0, chief_of_staff_note: 'string' };
  const prompt = `${safety}\nSaved tone: ${String(snapshot.preferences?.chief_of_staff_tone || 'executive')}\nRequired schema: ${JSON.stringify(schemaExample)}\nCompact user-scoped summary: ${JSON.stringify(compactSnapshot)}`;
  let decision: ChiefOfStaffDecision;
  let provider = 'deterministic';
  let model = 'rules-v1';
  let inputTokens = 0;
  let outputTokens = 0;
  try {
    if (env.AI_PROVIDER === 'anthropic' && env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({ model: env.AI_MODEL, max_tokens: 2200, system: safety, messages: [{ role: 'user', content: prompt }] });
      const block = response.content.find((item) => item.type === 'text');
      if (!block || block.type !== 'text') throw new Error('No decision output.');
      decision = chiefOfStaffDecisionSchema.parse(parseJson(block.text)); provider = 'anthropic'; model = env.AI_MODEL; inputTokens = response.usage.input_tokens; outputTokens = response.usage.output_tokens;
    } else if (env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
      const response = await openai.responses.create({ model: env.AI_MODEL, input: prompt, text: { format: { type: 'json_object' } } } as never);
      decision = chiefOfStaffDecisionSchema.parse(parseJson(response.output_text)); provider = 'openai'; model = env.AI_MODEL; inputTokens = response.usage?.input_tokens || 0; outputTokens = response.usage?.output_tokens || 0;
    } else decision = chiefOfStaffDecisionSchema.parse(fallback(snapshot));
  } catch (error) {
    console.error('Decision engine AI fallback:', error);
    decision = chiefOfStaffDecisionSchema.parse(fallback(snapshot));
    provider = 'deterministic'; model = 'rules-v1';
  }
  const { data, error } = await supabase.from('ai_decisions').insert({ user_id: userId, decision_date: new Date().toISOString().slice(0, 10), ...decision, provider, model, source_snapshot: snapshot } as never).select().single();
  if (error) throw error;
  if (provider !== 'deterministic') {
    const estimatedCost = provider === 'anthropic' ? inputTokens / 1_000_000 * 3 + outputTokens / 1_000_000 * 15 : inputTokens / 1_000_000 * 2 + outputTokens / 1_000_000 * 8;
    const { error: usageError } = await supabase.from('ai_usage_logs').insert({ user_id: userId, feature: 'prioritize_my_day', provider, model, input_tokens: inputTokens, output_tokens: outputTokens, estimated_cost: estimatedCost } as never);
    if (usageError) console.error('Could not save AI usage log:', usageError);
  }
  return data;
}
