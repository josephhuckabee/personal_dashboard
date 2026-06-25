import { NextResponse } from 'next/server';
import { UnauthorizedError, requireUser } from '@/lib/auth';
import { onboardingSchema } from '@/lib/schemas';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import type { Json } from '@/lib/supabase/database.types';
import { ZodError } from 'zod';
import { createOnboardingMemories } from '@/lib/ai/memory';
import { generateAdaptivePlanForUser } from '@/lib/adaptive-plan';

const FRIENDLY_ERROR = "We couldn't save your setup yet. Please try again in a moment.";

function logOnboardingError(message: string, details: Record<string, unknown>) {
  console.error('[onboarding]', message, details);
}

type OnboardingInput = ReturnType<typeof onboardingSchema.parse>;

function isMissingRpc(error: { code?: string; message?: string }) {
  return error.code === 'PGRST202' || /Could not find the function public\.complete_onboarding/i.test(error.message || '');
}

function isMissingTable(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'PGRST205');
}

async function persistStep<T>(name: string, userId: string, action: () => PromiseLike<{ data: T | null; error: unknown }>) {
  const result = await action();
  if (result.error) {
    logOnboardingError(`${name} failed`, { userId, error: result.error });
    throw result.error;
  }
  return result.data;
}

async function completeOnboardingDirect(supabase: SupabaseClient<Database>, userId: string, input: OnboardingInput) {
  const location = input.location || null;
  const currency = input.finances.currency;
  const height = Number(input.health_baseline.height || 0);
  const weight = Number(input.health_baseline.weight || 0);
  const bmi = height && weight ? Number((weight * 703 / (height * height)).toFixed(1)) : null;
  const genderAdjustment = String(input.health_baseline.gender || '').toLowerCase().startsWith('m') ? -16.2 : -5.4;
  const estimatedBodyFat = bmi && input.age ? Number((1.2 * bmi + 0.23 * input.age + genderAdjustment).toFixed(1)) : null;

  const legacyUser = await supabase.from('users').upsert({
    id: userId,
    display_name: input.preferred_name,
    current_city: location,
    timezone: input.timezone,
    one_year_vision: input.one_year_vision,
    work_style: input.work_style,
    onboarding_completed: false,
  } as never, { onConflict: 'id' });
  if (legacyUser.error && !isMissingTable(legacyUser.error)) {
    logOnboardingError('legacy users upsert failed', { userId, error: legacyUser.error });
  }

  await persistStep('profiles upsert', userId, () => supabase.from('profiles').upsert({
    user_id: userId,
    preferred_name: input.preferred_name,
    age: input.age || null,
    location,
    current_city: location,
    timezone: input.timezone,
    passport_country: input.travel_profile?.passport_country || null,
    one_year_vision: input.one_year_vision,
    work_style: input.work_style,
    adaptive_profile: {
      year_success: input.year_success || null,
      biggest_concerns: input.biggest_concerns || null,
      biggest_opportunities: input.biggest_opportunities || null,
      ideal_life: {
        '90_days': input.ideal_life_90_days || null,
        '1_year': input.ideal_life_1_year || null,
        '2_years': input.ideal_life_2_years || null,
        '5_years': input.ideal_life_5_years || null,
        '10_years': input.ideal_life_10_years || null,
      },
      travel_profile: input.travel_profile || {},
      education_profile: input.education_profile || {},
    } as Json,
    onboarding_completed: false,
  } as never, { onConflict: 'user_id' }));

  await persistStep('preferences upsert', userId, () => supabase.from('user_preferences').upsert({
    user_id: userId,
    app_name: input.design.app_name || `${input.preferred_name} OS`,
    theme: input.design.theme,
    accent_color: input.design.accent_color,
    font_style: input.design.font_style,
    density: input.design.density,
    chief_of_staff_tone: input.chief_of_staff_tone,
    design_preferences: input.design as unknown as Json,
  } as never, { onConflict: 'user_id' }));

  if (input.habits.length) {
    await persistStep('habits insert', userId, () => supabase.from('habits').insert(input.habits.map((habit) => ({
      user_id: userId,
      name: habit.name,
      target_per_week: habit.target_per_week || 7,
    })) as never));
  }

  const account = await persistStep<Record<string, unknown>>('finance account insert', userId, () => supabase.from('finance_accounts').insert({
    user_id: userId,
    name: 'Primary cash',
    account_type: 'cash',
    currency,
    current_balance: input.finances.current_cash,
  } as never).select('id').single());
  const accountId = account?.id as string | undefined;

  if (accountId && input.finances.monthly_income > 0) {
    await persistStep('income insert', userId, () => supabase.from('income').insert({
      user_id: userId,
      account_id: accountId,
      source: 'Starting monthly income',
      amount: input.finances.monthly_income,
      currency,
      recurring: true,
      notes: 'Onboarding baseline',
    } as never));
    await persistStep('finance account balance reset', userId, () => supabase.from('finance_accounts').update({
      current_balance: input.finances.current_cash,
    } as never).eq('id', accountId).eq('user_id', userId));
  }

  if (input.travel_plans.length) {
    await persistStep('travel plans insert', userId, () => supabase.from('travel_plans').insert(input.travel_plans.map((plan) => ({
      user_id: userId,
      title: plan.title,
      city: plan.city || null,
      country: plan.country || null,
      arrival_at: plan.arrival_at || null,
      departure_at: plan.departure_at || null,
      budget: plan.budget || null,
      currency,
      status: 'planned',
    })) as never));
  }

  const healthRows = [
    input.health_baseline.weight ? { user_id: userId, metric_type: 'weight', value: input.health_baseline.weight, unit: input.health_baseline.weight_unit, notes: 'Onboarding baseline' } : null,
    input.health_baseline.average_sleep_hours ? { user_id: userId, metric_type: 'sleep', value: input.health_baseline.average_sleep_hours, unit: 'hours', notes: 'Onboarding baseline' } : null,
    input.health_baseline.workouts_per_week ? { user_id: userId, metric_type: 'workout', value: input.health_baseline.workouts_per_week, unit: 'per week', notes: 'Onboarding baseline' } : null,
  ].filter(Boolean);
  if (healthRows.length) await persistStep('health metrics insert', userId, () => supabase.from('health_metrics').insert(healthRows as never));

  await persistStep('health profile upsert', userId, () => supabase.from('health_profiles').upsert({
    user_id: userId,
    age: input.age || null,
    gender: input.health_baseline.gender || null,
    height: input.health_baseline.height || null,
    weight: input.health_baseline.weight || null,
    goal_weight: input.health_baseline.goal_weight || null,
    activity_level: input.health_baseline.activity_level || null,
    sleep_target: input.health_baseline.sleep_target || input.health_baseline.average_sleep_hours || null,
    dietary_restrictions: input.health_baseline.dietary_restrictions || null,
    bmi,
    estimated_body_fat_pct: estimatedBodyFat,
    diet_profile: input.health_baseline.diet_style || 'Custom',
  } as never, { onConflict: 'user_id' }));

  await persistStep('ai context upsert', userId, () => supabase.from('ai_context_profiles').upsert({
    user_id: userId,
    life_vision: input.one_year_vision,
    work_style: input.work_style,
    health_baseline: input.health_baseline as unknown as Json,
    finance_baseline: input.finances as unknown as Json,
    onboarding_snapshot: input as unknown as Json,
    context_summary: `Preferred name: ${input.preferred_name}. One-year vision: ${input.one_year_vision}. Successful year: ${input.year_success || 'not specified'}. Concerns: ${input.biggest_concerns || 'not specified'}. Opportunities: ${input.biggest_opportunities || 'not specified'}. Work style: ${input.work_style}`,
  } as never, { onConflict: 'user_id' }));

  await persistStep('finance categories insert', userId, () => supabase.from('finance_categories').upsert([
    ['Housing', 'expense'], ['Food', 'expense'], ['Transport', 'expense'], ['Travel', 'expense'], ['Health', 'expense'],
    ['Education', 'expense'], ['Content', 'expense'], ['Other', 'expense'], ['Salary', 'income'], ['Freelance', 'income'],
    ].map(([name, category_type]) => ({ user_id: userId, name, category_type })) as never, { onConflict: 'user_id,name,category_type', ignoreDuplicates: true }));

  await persistStep('profiles completion update', userId, () => supabase.from('profiles').update({ onboarding_completed: true } as never).eq('user_id', userId));
  await generateAdaptivePlanForUser(supabase, userId);
  const legacyCompletion = await supabase.from('users').update({ onboarding_completed: true } as never).eq('id', userId);
  if (legacyCompletion.error && !isMissingTable(legacyCompletion.error)) {
    logOnboardingError('legacy users completion update failed', { userId, error: legacyCompletion.error });
  }
}

export async function POST(request: Request) {
  let userId: string | undefined;
  let input: OnboardingInput | undefined;

  try {
    const { user, supabase } = await requireUser();
    userId = user.id;
    input = onboardingSchema.parse(await request.json());

    console.info('[onboarding] submit started', {
      userId,
      goalCount: input.goals.length,
      habitCount: input.habits.length,
      travelPlanCount: input.travel_plans.length,
      hasHealthBaseline: Boolean(input.health_baseline.weight || input.health_baseline.average_sleep_hours || input.health_baseline.workouts_per_week),
      hasFinanceBaseline: Boolean(input.finances),
    });

    const { error } = await supabase.rpc('complete_onboarding', { p_payload: input as unknown as Json });
    if (error) {
      if (isMissingRpc(error)) {
        console.warn('[onboarding] complete_onboarding rpc missing; using direct persistence fallback', {
          userId,
          code: error.code,
          message: error.message,
        });
        await completeOnboardingDirect(supabase, user.id, input);
      } else {
        logOnboardingError('complete_onboarding rpc failed', {
          userId,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          payloadSummary: {
            goalCount: input.goals.length,
            habitCount: input.habits.length,
            travelPlanCount: input.travel_plans.length,
            currency: input.finances.currency,
          },
        });
        console.warn('[onboarding] using direct persistence fallback after rpc failure', { userId, code: error.code });
        await completeOnboardingDirect(supabase, user.id, input);
      }
    }

    const [{ data: profile, error: profileError }, { data: preferences, error: preferencesError }, { count: goalCount, error: goalsError }, { count: habitCount, error: habitsError }] = await Promise.all([
      supabase.from('profiles').select('user_id,onboarding_completed', { count: 'exact' }).eq('user_id', user.id).maybeSingle(),
      supabase.from('user_preferences').select('user_id', { count: 'exact' }).eq('user_id', user.id).maybeSingle(),
      supabase.from('goals').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('habits').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);
    const verificationErrors = [profileError, preferencesError, goalsError, habitsError].filter(Boolean);
    const verificationFailed = verificationErrors.length > 0 || !profile?.onboarding_completed || !preferences || (goalCount ?? 0) < 1 || (habitCount ?? 0) < input.habits.length;

    if (verificationFailed) {
      logOnboardingError('post-submit verification failed', {
        userId,
        profile,
        hasPreferences: Boolean(preferences),
        goalCount,
        expectedGoalCount: 'generated adaptive milestones',
        habitCount,
        expectedHabitCount: input.habits.length,
        verificationErrors,
      });
      return NextResponse.json({ error: FRIENDLY_ERROR }, { status: 500 });
    }

    await createOnboardingMemories(supabase, user.id, input).catch((memoryError) => {
      logOnboardingError('onboarding memory creation failed', { userId, error: memoryError });
    });

    console.info('[onboarding] submit completed', { userId, goalCount, habitCount });
    return NextResponse.json({ completed: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ZodError) {
      logOnboardingError('payload validation failed', { userId, issues: error.flatten() });
      return NextResponse.json({ error: 'Some setup details need to be corrected.', issues: error.flatten() }, { status: 400 });
    }
    logOnboardingError('unexpected route failure', {
      userId,
      error,
      payloadSummary: input ? {
        goalCount: input.goals.length,
        habitCount: input.habits.length,
        travelPlanCount: input.travel_plans.length,
        currency: input.finances.currency,
      } : null,
    });
    return NextResponse.json({ error: FRIENDLY_ERROR }, { status: 500 });
  }
}
