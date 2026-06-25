import { z } from 'zod';

const optionalText = z.string().trim().max(5000).optional().nullable();
const dateString = z.string().datetime().or(z.string().date()).optional().nullable();
const booleanField = z.preprocess((value) => value === true || value === 'true', z.boolean());

export const entitySchemas = {
  goals: z.object({ title: z.string().trim().min(1).max(200), description: optionalText, category: z.string().trim().min(1).max(50).default('personal'), progress: z.coerce.number().min(0).max(100).default(0), target_date: z.string().date().optional().nullable(), status: z.string().trim().max(40).optional() }),
  objectives: z.object({ title: z.string().trim().min(1).max(200), description: optionalText, category: z.string().trim().min(1).max(50).default('personal'), priority: z.enum(['low', 'medium', 'high']).optional(), progress: z.coerce.number().min(0).max(100).default(0), deadline: z.string().date().optional().nullable(), status: z.enum(['healthy', 'watch', 'at_risk', 'completed', 'paused']).optional(), target_value: z.coerce.number().optional().nullable(), current_value: z.coerce.number().optional().nullable(), metadata: z.record(z.unknown()).optional() }),
  tasks: z.object({ title: z.string().trim().min(1).max(250), description: optionalText, goal_id: z.string().uuid().optional().nullable(), objective_id: z.string().uuid().optional().nullable(), status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).optional(), priority: z.enum(['low', 'medium', 'high']).optional(), due_at: dateString, estimated_minutes: z.coerce.number().int().positive().max(1440).optional().nullable() }),
  habits: z.object({ name: z.string().trim().min(1).max(120), description: optionalText, objective_id: z.string().uuid().optional().nullable(), frequency: z.string().trim().max(30).optional(), target_per_week: z.coerce.number().int().min(1).max(7).optional(), active: booleanField.optional(), icon: optionalText, color: optionalText }),
  finance_accounts: z.object({ name: z.string().trim().min(1).max(120), account_type: z.string().trim().max(40).optional(), institution: optionalText, currency: z.string().length(3).optional(), current_balance: z.coerce.number().optional(), active: booleanField.optional() }),
  transactions: z.object({ account_id: z.string().uuid().optional().nullable(), type: z.enum(['expense', 'income', 'transfer']).optional(), merchant: optionalText, description: optionalText, amount: z.coerce.number().nonnegative(), currency: z.string().length(3).optional(), category: z.string().trim().max(80).optional(), payment_method: optionalText, transaction_date: z.string().date(), notes: optionalText }),
  income: z.object({ account_id: z.string().uuid().optional().nullable(), source: z.string().trim().min(1).max(200), amount: z.coerce.number().nonnegative(), currency: z.string().length(3).optional(), received_on: z.string().date(), recurring: booleanField.optional(), notes: optionalText }),
  travel_plans: z.object({ title: z.string().trim().min(1).max(200), plan_type: z.enum(['destination', 'flight', 'accommodation', 'pet_sit', 'visa', 'activity', 'transportation', 'insurance', 'passport', 'country_note']).optional(), city: optionalText, country: optionalText, provider: optionalText, arrival_at: dateString, departure_at: dateString, confirmation_number: optionalText, visa_deadline: z.string().date().optional().nullable(), budget: z.coerce.number().nonnegative().optional().nullable(), cost: z.coerce.number().nonnegative().optional().nullable(), currency: z.string().length(3).optional(), status: z.string().trim().max(40).optional(), notes: optionalText, transport_type: optionalText, passport_country: optionalText, travel_insurance: optionalText, packing_list: z.preprocess((value) => typeof value === 'string' ? value.split('\n').map((item) => item.trim()).filter(Boolean) : value, z.array(z.string()).optional()), country_notes: optionalText, language_notes: optionalText, important_contacts: z.preprocess((value) => typeof value === 'string' ? value.split('\n').map((item) => item.trim()).filter(Boolean) : value, z.array(z.string()).optional()), emergency_information: optionalText, travel_memories: optionalText }),
  content_items: z.object({ title: z.string().trim().min(1).max(250), content_type: z.string().trim().max(50).optional(), platform: optionalText, status: z.enum(['idea', 'script', 'draft', 'scheduled', 'published', 'archived']).optional(), body: optionalText, views: z.coerce.number().int().nonnegative().optional(), engagement: z.coerce.number().nonnegative().optional(), next_action: optionalText, publish_at: dateString }),
  content_projects: z.object({ title: z.string().trim().min(1).max(250), content_type: z.string().trim().max(50).optional(), platform: optionalText, status: z.enum(['idea', 'script', 'draft', 'scheduled', 'published', 'archived']).optional(), body: optionalText, views: z.coerce.number().int().nonnegative().optional(), engagement: z.coerce.number().nonnegative().optional(), next_action: optionalText, publish_at: dateString }),
  relationships: z.object({ name: z.string().trim().min(1).max(160), relationship_type: z.string().trim().max(50).optional(), email: z.string().email().optional().nullable(), last_contact_at: dateString, next_follow_up_at: dateString, health_score: z.coerce.number().int().min(0).max(100).optional().nullable(), notes: optionalText }),
  health_metrics: z.object({ metric_type: z.enum(['weight', 'body_fat', 'waist', 'neck', 'workout', 'strength', 'running', 'walking', 'yoga', 'mobility', 'meditation', 'sleep', 'energy', 'stress', 'mood', 'calories', 'protein', 'water']), value: z.coerce.number(), unit: z.string().trim().min(1).max(30), recorded_at: dateString, notes: optionalText }),
  health_profiles: z.object({ height: z.coerce.number().positive().optional().nullable(), weight: z.coerce.number().positive().optional().nullable(), goal_weight: z.coerce.number().positive().optional().nullable(), body_fat_pct: z.coerce.number().min(0).max(100).optional().nullable(), waist: z.coerce.number().positive().optional().nullable(), neck: z.coerce.number().positive().optional().nullable(), age: z.coerce.number().int().min(0).max(130).optional().nullable(), gender: optionalText, activity_level: optionalText, sleep_target: z.coerce.number().min(0).max(24).optional().nullable(), dietary_restrictions: optionalText, estimated_body_fat_pct: z.coerce.number().min(0).max(100).optional().nullable(), bmi: z.coerce.number().positive().optional().nullable(), diet_profile: z.enum(['High Protein', 'Mediterranean', 'Vegetarian', 'Vegan', 'Keto', 'Custom']).optional(), custom_diet: optionalText }),
  medications: z.object({ name: z.string().trim().min(1).max(160), dosage: optionalText, frequency: optionalText, start_date: z.string().date().optional().nullable(), end_date: z.string().date().optional().nullable(), notes: optionalText, active: booleanField.optional() }),
  supplements: z.object({ name: z.string().trim().min(1).max(160), dosage: optionalText, frequency: optionalText, purpose: optionalText, active: booleanField.optional() }),
  home_links: z.object({ section: z.enum(['Utilities', 'Travel', 'Devices', 'Smart Home', 'Quick Actions']).optional(), title: z.string().trim().min(1).max(160), url: z.string().trim().url().optional().nullable().or(z.literal('')), notes: optionalText, sort_order: z.coerce.number().int().optional() }),
  timeline_events: z.object({ event_date: z.string().date(), category: z.enum(['Career', 'Health', 'Finance', 'Education', 'Travel', 'Relationships']), title: z.string().trim().min(1).max(200), description: optionalText, source: z.string().trim().max(80).optional() }),
  finance_integrations: z.object({ provider: z.literal('plaid').optional(), status: z.enum(['planned', 'disabled']).optional(), planned_capabilities: z.array(z.string()).optional(), notes: optionalText }),
  life_benchmarks: z.object({ horizon: z.string().trim().min(1).max(40), target_date: z.string().date().optional().nullable(), title: z.string().trim().min(1).max(200), description: optionalText, category: z.string().trim().max(80).optional(), source: z.string().trim().max(80).optional(), status: z.enum(['recommended', 'accepted', 'adjusted', 'completed', 'archived']).optional(), evidence: z.record(z.unknown()).optional() }),
  journal_entries: z.object({ entry_date: z.string().date().optional(), title: optionalText, body: z.string().trim().min(1).max(12000), mood: z.coerce.number().int().min(1).max(10).optional().nullable(), tags: z.preprocess((value) => typeof value === 'string' ? value.split(',').map((item) => item.trim()).filter(Boolean) : value, z.array(z.string()).optional()), themes: z.array(z.string()).optional() }),
  adaptive_insights: z.object({ insight_date: z.string().date().optional(), title: z.string().trim().min(1).max(220), body: z.string().trim().min(1).max(5000), category: z.string().trim().max(80).optional(), evidence: z.record(z.unknown()).optional(), confidence: z.coerce.number().int().min(0).max(100).optional(), dismissed_at: dateString }),
  calendar_events: z.object({ title: z.string().trim().min(1).max(250), category: z.string().trim().max(50).optional(), starts_at: z.string().datetime(), ends_at: z.string().datetime(), location: optionalText, notes: optionalText, source: z.string().trim().max(50).optional(), external_id: optionalText }),
  ai_recommendations: z.object({ briefing_id: z.string().uuid().optional().nullable(), title: z.string().trim().min(1).max(200), reason: optionalText, category: optionalText, priority: z.enum(['low', 'medium', 'high']).optional(), recommended_action: z.string().trim().min(1).max(2000), accepted_at: dateString, dismissed_at: dateString }),
  daily_checkins: z.object({ checkin_date: z.string().date().optional(), mood: z.coerce.number().int().min(1).max(10), energy: z.coerce.number().int().min(1).max(10), stress: z.coerce.number().int().min(1).max(10), productivity: z.coerce.number().int().min(1).max(10), sleep_hours: z.coerce.number().min(0).max(24).optional().nullable(), biggest_win: optionalText, biggest_challenge: optionalText, what_was_avoided: optionalText, tomorrow_priority: optionalText, ai_summary: optionalText, notes: optionalText }),
  user_preferences: z.object({ app_name: optionalText, theme: z.enum(['default', 'midnight', 'soft']).optional(), accent_color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(), font_style: z.enum(['default', 'editorial', 'system']).optional(), density: z.enum(['comfortable', 'compact']).optional(), chief_of_staff_tone: z.enum(['gentle', 'executive', 'direct']).optional(), design_preferences: z.record(z.unknown()).optional() }),
  finance_categories: z.object({ name: z.string().trim().min(1).max(80), category_type: z.enum(['expense', 'income']), monthly_budget: z.coerce.number().nonnegative().optional().nullable(), color: optionalText }),
} as const;

export type EntityName = keyof typeof entitySchemas;
export const entityNames = Object.keys(entitySchemas) as EntityName[];

export const receiptExtractionSchema = z.object({
  merchant: z.string().nullable().default(null), date: z.string().date().nullable().default(null), total: z.coerce.number().nonnegative().nullable().default(null),
  category: z.string().nullable().default(null), payment_method: z.string().nullable().default(null), notes: z.string().nullable().default(null),
});

export const chiefOfStaffBriefingSchema = z.object({
  summary: z.string(),
  top_priorities: z.array(z.object({ title: z.string(), reason: z.string(), category: z.string(), estimated_minutes: z.number().int().nonnegative() })),
  risks: z.array(z.object({ title: z.string(), severity: z.enum(['low', 'medium', 'high']), reason: z.string(), recommended_action: z.string() })),
  opportunities: z.array(z.object({ title: z.string(), impact: z.enum(['low', 'medium', 'high']), reason: z.string(), recommended_action: z.string() })),
  recommended_focus: z.string(),
  recommended_avoidance: z.string(),
  execution_readiness_score: z.number().int().min(0).max(100),
  chief_of_staff_note: z.string(),
  memories_used: z.array(z.string()),
});

export const onboardingSchema = z.object({
  preferred_name: z.string().trim().min(1).max(100),
  age: z.coerce.number().int().min(0).max(130).optional().nullable(),
  location: z.string().trim().max(160).optional().default(''),
  timezone: z.string().trim().min(1).max(100),
  one_year_vision: z.string().trim().min(10).max(5000),
  year_success: optionalText,
  biggest_concerns: optionalText,
  biggest_opportunities: optionalText,
  ideal_life_90_days: optionalText,
  ideal_life_1_year: optionalText,
  ideal_life_2_years: optionalText,
  ideal_life_5_years: optionalText,
  ideal_life_10_years: optionalText,
  goals: z.array(z.object({ title: z.string().trim().min(1).max(200), category: z.string().trim().max(50).default('personal'), target_date: z.string().date().optional().nullable() })).min(1).max(12),
  habits: z.array(z.object({ name: z.string().trim().min(1).max(120), target_per_week: z.coerce.number().int().min(1).max(7).default(7) })).max(20),
  finances: z.object({ current_cash: z.coerce.number().nonnegative(), monthly_income: z.coerce.number().nonnegative().default(0), currency: z.string().length(3).default('USD') }),
  travel_plans: z.array(z.object({ title: z.string().trim().min(1).max(200), city: z.string().trim().max(100).optional(), country: z.string().trim().max(100).optional(), arrival_at: z.string().datetime().optional().nullable(), departure_at: z.string().datetime().optional().nullable(), budget: z.coerce.number().nonnegative().optional().nullable() })).max(12),
  travel_profile: z.object({ countries_planned: optionalText, passport_country: optionalText, travel_style: optionalText, budget_level: optionalText, work_while_traveling: z.preprocess((value) => value === true || value === 'true', z.boolean()).optional(), pet_sitting: z.preprocess((value) => value === true || value === 'true', z.boolean()).optional(), digital_nomad: z.preprocess((value) => value === true || value === 'true', z.boolean()).optional() }).optional(),
  education_profile: z.object({ current_programs: optionalText, degrees: optionalText, certifications: optionalText, current_career: optionalText, desired_career: optionalText, skills_being_developed: optionalText }).optional(),
  health_baseline: z.object({ height: z.coerce.number().positive().optional().nullable(), weight: z.coerce.number().positive().optional().nullable(), goal_weight: z.coerce.number().positive().optional().nullable(), gender: optionalText, activity_level: optionalText, sleep_target: z.coerce.number().min(0).max(24).optional().nullable(), medications: optionalText, supplements: optionalText, dietary_restrictions: optionalText, diet_style: z.enum(['High Protein', 'Mediterranean', 'Vegetarian', 'Vegan', 'Keto', 'Custom']).optional(), weight_unit: z.string().trim().max(20).default('lb'), average_sleep_hours: z.coerce.number().min(0).max(24).optional().nullable(), workouts_per_week: z.coerce.number().int().min(0).max(14).optional().nullable() }),
  work_style: z.string().trim().min(1).max(1000),
  chief_of_staff_tone: z.enum(['gentle', 'executive', 'direct']),
  design: z.object({ app_name: z.string().trim().max(100).optional(), theme: z.enum(['default', 'midnight', 'soft']), accent_color: z.string().regex(/^#[0-9a-f]{6}$/i), font_style: z.enum(['default', 'editorial', 'system']), density: z.enum(['comfortable', 'compact']) }),
});

export const chiefOfStaffDecisionSchema = z.object({
  top_priorities: z.array(z.object({ title: z.string(), reason: z.string(), priority: z.enum(['low', 'medium', 'high']), estimated_minutes: z.number().int().nonnegative().optional() })),
  risks: z.array(z.object({ title: z.string(), reason: z.string(), severity: z.enum(['low', 'medium', 'high']), recommended_action: z.string() })),
  opportunities: z.array(z.object({ title: z.string(), reason: z.string(), recommended_action: z.string() })),
  recommended_focus: z.string(),
  recommended_avoidance: z.string(),
  execution_readiness_score: z.number().int().min(0).max(100),
  chief_of_staff_note: z.string(),
});

export const memorySchema = z.object({
  type: z.enum(['fact', 'preference', 'goal', 'decision', 'lesson', 'behavior', 'pattern', 'risk', 'opportunity', 'warning', 'milestone']).optional(),
  category: z.enum(['Identity', 'Health', 'Travel', 'Career', 'Education', 'Finance', 'Relationships', 'Values', 'Preferences', 'Goals']).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().trim().min(1).max(5000).optional(),
  source: z.string().trim().max(80).optional(),
  importance_score: z.coerce.number().min(0).max(100).optional(),
  confidence_score: z.coerce.number().min(0).max(100).optional(),
  is_important: z.preprocess((value) => value === true || value === 'true', z.boolean()).optional(),
  inaccurate_at: dateString,
  archived_at: dateString,
});

export const weeklyReviewSchema = z.object({
  wins: z.array(z.string()),
  losses: z.array(z.string()),
  lessons: z.array(z.string()),
  risks: z.array(z.string()),
  opportunities: z.array(z.string()),
  habit_analysis: z.string(),
  finance_analysis: z.string(),
  goal_progress: z.string(),
  travel_summary: z.string().default('Travel data is missing.'),
  recommended_next_week_focus: z.string(),
  recommended_adjustments: z.array(z.string()).default([]),
  citations: z.array(z.record(z.unknown())).default([]),
  memories_created: z.array(z.string()).default([]),
});

export const decisionJournalSchema = z.object({
  title: z.string().trim().min(1).max(240).optional(),
  decision_date: z.string().date().optional(),
  decision: z.string().trim().min(1).max(2000),
  context: optionalText,
  options_considered: z.preprocess((value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split('\n').map((item) => item.trim()).filter(Boolean);
    return [];
  }, z.array(z.string()).default([])),
  reason_chosen: optionalText,
  reasoning: z.string().trim().min(1).max(5000),
  expected_outcome: z.string().trim().min(1).max(5000),
  confidence: z.coerce.number().int().min(0).max(100).optional().nullable(),
  review_date: z.string().date().optional().nullable(),
  actual_outcome: optionalText,
  outcome: optionalText,
  lessons_learned: optionalText,
  quality_score: z.coerce.number().int().min(0).max(100).optional().nullable(),
  reviewed_at: dateString,
});

export type ChiefOfStaffBriefing = z.infer<typeof chiefOfStaffBriefingSchema>;
export type ChiefOfStaffDecision = z.infer<typeof chiefOfStaffDecisionSchema>;
export type WeeklyReview = z.infer<typeof weeklyReviewSchema>;
