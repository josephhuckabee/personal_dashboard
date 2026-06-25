alter table public.user_preferences
  drop column if exists motion;

update public.user_preferences
set design_preferences = design_preferences - 'motion'
where design_preferences ? 'motion';

alter table public.profiles
  add column if not exists age integer check (age between 0 and 130),
  add column if not exists gender text,
  add column if not exists passport_country text,
  add column if not exists adaptive_profile jsonb not null default '{}'::jsonb;

create or replace function public.complete_onboarding(p_payload jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  item jsonb;
  account_id uuid;
  currency_code text := coalesce(p_payload #>> '{finances,currency}', 'USD');
  height_value numeric := nullif(p_payload #>> '{health_baseline,height}', '')::numeric;
  weight_value numeric := nullif(p_payload #>> '{health_baseline,weight}', '')::numeric;
  bmi_value numeric := case when nullif(p_payload #>> '{health_baseline,height}', '') is not null and nullif(p_payload #>> '{health_baseline,weight}', '') is not null then round((weight_value * 703 / (height_value * height_value))::numeric, 1) else null end;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if exists(select 1 from public.profiles where user_id = uid and onboarding_completed) then return; end if;

  insert into public.profiles(
    user_id,
    preferred_name,
    age,
    location,
    current_city,
    timezone,
    passport_country,
    onboarding_completed,
    one_year_vision,
    work_style,
    adaptive_profile
  )
  values (
    uid,
    p_payload->>'preferred_name',
    nullif(p_payload->>'age', '')::integer,
    nullif(p_payload->>'location', ''),
    nullif(p_payload->>'location', ''),
    p_payload->>'timezone',
    nullif(p_payload #>> '{travel_profile,passport_country}', ''),
    false,
    p_payload->>'one_year_vision',
    p_payload->>'work_style',
    jsonb_build_object(
      'year_success', nullif(p_payload->>'year_success', ''),
      'biggest_concerns', nullif(p_payload->>'biggest_concerns', ''),
      'biggest_opportunities', nullif(p_payload->>'biggest_opportunities', ''),
      'ideal_life', jsonb_build_object(
        '90_days', nullif(p_payload->>'ideal_life_90_days', ''),
        '1_year', nullif(p_payload->>'ideal_life_1_year', ''),
        '2_years', nullif(p_payload->>'ideal_life_2_years', ''),
        '5_years', nullif(p_payload->>'ideal_life_5_years', ''),
        '10_years', nullif(p_payload->>'ideal_life_10_years', '')
      ),
      'travel_profile', coalesce(p_payload->'travel_profile', '{}'::jsonb),
      'education_profile', coalesce(p_payload->'education_profile', '{}'::jsonb)
    )
  )
  on conflict (user_id) do update set
    preferred_name = excluded.preferred_name,
    age = excluded.age,
    location = excluded.location,
    current_city = excluded.current_city,
    timezone = excluded.timezone,
    passport_country = excluded.passport_country,
    one_year_vision = excluded.one_year_vision,
    work_style = excluded.work_style,
    adaptive_profile = excluded.adaptive_profile;

  insert into public.user_preferences(
    user_id,
    app_name,
    theme,
    accent_color,
    font_style,
    density,
    chief_of_staff_tone,
    design_preferences
  )
  values (
    uid,
    nullif(p_payload #>> '{design,app_name}', ''),
    coalesce(p_payload #>> '{design,theme}', 'default'),
    coalesce(p_payload #>> '{design,accent_color}', '#a7f3d0'),
    coalesce(p_payload #>> '{design,font_style}', 'default'),
    coalesce(p_payload #>> '{design,density}', 'comfortable'),
    coalesce(p_payload->>'chief_of_staff_tone', 'executive'),
    coalesce(p_payload->'design', '{}'::jsonb) - 'motion'
  )
  on conflict (user_id) do update set
    app_name = excluded.app_name,
    theme = excluded.theme,
    accent_color = excluded.accent_color,
    font_style = excluded.font_style,
    density = excluded.density,
    chief_of_staff_tone = excluded.chief_of_staff_tone,
    design_preferences = excluded.design_preferences;

  for item in select value from jsonb_array_elements(coalesce(p_payload->'goals', '[]'::jsonb)) loop
    insert into public.goals(user_id, title, category, target_date)
    values (uid, item->>'title', coalesce(item->>'category','personal'), nullif(item->>'target_date','')::date);

    insert into public.objectives(user_id, title, category, deadline)
    values (uid, item->>'title', coalesce(item->>'category','personal'), nullif(item->>'target_date','')::date);
  end loop;

  for item in select value from jsonb_array_elements(coalesce(p_payload->'habits', '[]'::jsonb)) loop
    insert into public.habits(user_id, name, target_per_week)
    values (uid, item->>'name', coalesce(nullif(item->>'target_per_week','')::integer, 7));
  end loop;

  insert into public.finance_accounts(user_id, name, account_type, currency, current_balance)
  values (uid, 'Primary cash', 'cash', currency_code, coalesce(nullif(p_payload #>> '{finances,current_cash}', '')::numeric, 0))
  returning id into account_id;

  if account_id is not null and coalesce(nullif(p_payload #>> '{finances,monthly_income}', '')::numeric, 0) > 0 then
    insert into public.income(user_id, account_id, source, amount, currency, recurring, notes)
    values (uid, account_id, 'Starting monthly income', nullif(p_payload #>> '{finances,monthly_income}', '')::numeric, currency_code, true, 'Onboarding baseline');
  end if;

  for item in select value from jsonb_array_elements(coalesce(p_payload->'travel_plans', '[]'::jsonb)) loop
    insert into public.travel_plans(user_id, title, city, country, arrival_at, departure_at, budget, currency, status)
    values (uid, item->>'title', nullif(item->>'city',''), nullif(item->>'country',''), nullif(item->>'arrival_at','')::timestamptz, nullif(item->>'departure_at','')::timestamptz, nullif(item->>'budget','')::numeric, currency_code, 'planned');
  end loop;

  if weight_value is not null then
    insert into public.health_metrics(user_id, metric_type, value, unit, notes)
    values (uid, 'weight', weight_value, coalesce(p_payload #>> '{health_baseline,weight_unit}', 'lb'), 'Onboarding baseline');
  end if;

  if nullif(p_payload #>> '{health_baseline,average_sleep_hours}', '') is not null then
    insert into public.health_metrics(user_id, metric_type, value, unit, notes)
    values (uid, 'sleep', nullif(p_payload #>> '{health_baseline,average_sleep_hours}', '')::numeric, 'hours', 'Onboarding baseline');
  end if;

  if nullif(p_payload #>> '{health_baseline,workouts_per_week}', '') is not null then
    insert into public.health_metrics(user_id, metric_type, value, unit, notes)
    values (uid, 'workout', nullif(p_payload #>> '{health_baseline,workouts_per_week}', '')::numeric, 'per week', 'Onboarding baseline');
  end if;

  insert into public.health_profiles(
    user_id,
    age,
    gender,
    height,
    weight,
    goal_weight,
    activity_level,
    sleep_target,
    dietary_restrictions,
    bmi,
    estimated_body_fat_pct,
    diet_profile
  )
  values (
    uid,
    nullif(p_payload->>'age', '')::integer,
    nullif(p_payload #>> '{health_baseline,gender}', ''),
    height_value,
    weight_value,
    nullif(p_payload #>> '{health_baseline,goal_weight}', '')::numeric,
    nullif(p_payload #>> '{health_baseline,activity_level}', ''),
    coalesce(nullif(p_payload #>> '{health_baseline,sleep_target}', '')::numeric, nullif(p_payload #>> '{health_baseline,average_sleep_hours}', '')::numeric),
    nullif(p_payload #>> '{health_baseline,dietary_restrictions}', ''),
    bmi_value,
    case when bmi_value is not null and nullif(p_payload->>'age', '') is not null then round((1.2 * bmi_value + 0.23 * nullif(p_payload->>'age', '')::numeric + case when lower(coalesce(p_payload #>> '{health_baseline,gender}', '')) like 'm%' then -16.2 else -5.4 end)::numeric, 1) else null end,
    coalesce(nullif(p_payload #>> '{health_baseline,diet_style}', ''), 'Custom')
  )
  on conflict (user_id) do update set
    age = excluded.age,
    gender = excluded.gender,
    height = excluded.height,
    weight = excluded.weight,
    goal_weight = excluded.goal_weight,
    activity_level = excluded.activity_level,
    sleep_target = excluded.sleep_target,
    dietary_restrictions = excluded.dietary_restrictions,
    bmi = excluded.bmi,
    estimated_body_fat_pct = excluded.estimated_body_fat_pct,
    diet_profile = excluded.diet_profile;

  insert into public.ai_context_profiles(user_id, life_vision, work_style, health_baseline, finance_baseline, onboarding_snapshot, context_summary)
  values (uid, p_payload->>'one_year_vision', p_payload->>'work_style', p_payload->'health_baseline', p_payload->'finances', p_payload, concat('Preferred name: ', p_payload->>'preferred_name', '. One-year vision: ', p_payload->>'one_year_vision', '. Work style: ', p_payload->>'work_style'))
  on conflict (user_id) do update set
    life_vision = excluded.life_vision,
    work_style = excluded.work_style,
    health_baseline = excluded.health_baseline,
    finance_baseline = excluded.finance_baseline,
    onboarding_snapshot = excluded.onboarding_snapshot,
    context_summary = excluded.context_summary;

  insert into public.finance_categories(user_id, name, category_type) values
    (uid, 'Housing', 'expense'), (uid, 'Food', 'expense'), (uid, 'Transport', 'expense'), (uid, 'Travel', 'expense'),
    (uid, 'Health', 'expense'), (uid, 'Education', 'expense'), (uid, 'Content', 'expense'), (uid, 'Other', 'expense'),
    (uid, 'Salary', 'income'), (uid, 'Freelance', 'income')
  on conflict do nothing;

  update public.profiles set onboarding_completed = true where user_id = uid;
end;
$$;

notify pgrst, 'reload schema';
