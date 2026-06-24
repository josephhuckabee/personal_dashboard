import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDashboardSnapshot } from '@/lib/dashboard';
import { chiefOfStaffBriefingSchema, type ChiefOfStaffBriefing } from '@/lib/schemas';
import { serverEnv } from '@/lib/env';

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
  const missing = snapshot.objectives.length === 0 ? ' Objective data is missing.' : '';
  return {
    summary: `Execution readiness is ${snapshot.executionReadiness}/100.${missing}`,
    current_risks: atRisk.map((objective) => ({ title: String(objective.title), reason: 'Deadline, progress, or recent activity is outside the healthy range.', severity: 'high' as const, recommended_action: 'Define and complete the next measurable task.' })),
    opportunities: habits.filter((habit) => habit.weeklyConsistency >= 70).slice(0, 3).map((habit) => ({ title: `${String(habit.name)} momentum`, reason: `${habit.weeklyConsistency}% consistency over the last seven days.`, category: 'health' as const, recommended_action: 'Protect the next scheduled repetition.' })),
    today_plan: openTasks.slice(0, 3).map((task) => ({ task: String(task.title), priority: (task.priority === 'high' || task.priority === 'low' ? task.priority : 'medium') as 'low' | 'medium' | 'high', estimated_minutes: Number(task.estimated_minutes || 45) })),
    finance_analysis: { current_cash: snapshot.finance.currentCash || null, monthly_burn: snapshot.finance.monthlyBurn || null, runway_months: snapshot.finance.runwayMonths, warning: snapshot.finance.monthlyBurn === 0 ? 'Spending data is missing; runway cannot be calculated reliably.' : null },
    execution_readiness_score: snapshot.executionReadiness,
    chief_of_staff_note: openTasks.length ? 'Complete the highest-priority open task before adding new work.' : 'Task data is missing or no open work is recorded. Define the next concrete action.',
  };
}

export async function generateChiefOfStaffBriefing(userId: string) {
  const supabase = createAdminClient();
  const snapshot = await getDashboardSnapshot(supabase, userId);
  const env = serverEnv();
  let briefing: ChiefOfStaffBriefing;
  let provider = 'deterministic';
  let model = 'rules-v1';
  const input = `${systemPrompt}\n\nRequired JSON schema:\n${JSON.stringify({ summary: 'string', current_risks: [{ title: 'string', reason: 'string', severity: 'low|medium|high', recommended_action: 'string' }], opportunities: [{ title: 'string', reason: 'string', category: 'income|travel|health|education|content|career', recommended_action: 'string' }], today_plan: [{ task: 'string', priority: 'low|medium|high', estimated_minutes: 30 }], finance_analysis: { current_cash: null, monthly_burn: null, runway_months: null, warning: null }, execution_readiness_score: 0, chief_of_staff_note: 'string' })}\n\nSupabase snapshot:\n${JSON.stringify(snapshot)}`;
  if (env.AI_PROVIDER === 'anthropic' && env.ANTHROPIC_API_KEY) {
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({ model: env.AI_MODEL, max_tokens: 2500, system: systemPrompt, messages: [{ role: 'user', content: input }] });
    const text = response.content.find((block) => block.type === 'text');
    if (!text || text.type !== 'text') throw new Error('Anthropic returned no briefing text.');
    briefing = chiefOfStaffBriefingSchema.parse(extractJson(text.text)); provider = 'anthropic'; model = env.AI_MODEL;
  } else if (env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await openai.responses.create({ model: env.AI_MODEL, input, text: { format: { type: 'json_object' } } } as never);
    briefing = chiefOfStaffBriefingSchema.parse(extractJson(response.output_text)); provider = 'openai'; model = env.AI_MODEL;
  } else {
    briefing = chiefOfStaffBriefingSchema.parse(deterministicBriefing(snapshot));
  }
  const { data, error } = await supabase.from('ai_briefings').insert({
    user_id: userId, briefing_date: new Date().toISOString().slice(0, 10), ...briefing, provider, model, source_snapshot: snapshot,
  } as never).select().single();
  if (error) throw error;
  return data;
}
