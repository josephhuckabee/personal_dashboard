create or replace function public.complete_onboarding(p_payload jsonb)
returns void language plpgsql security invoker set search_path = public as $$
declare
  uid uuid := auth.uid();
  item jsonb;
  account_id uuid;
  currency_code text := coalesce(p_payload #>> '{finances,currency}', 'USD');
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if exists(select 1 from public.profiles where user_id = uid and onboarding_completed) then return; end if;

  insert into public.profiles(user_id, preferred_name, location, current_city, timezone, onboarding_completed, one_year_vision, work_style)
  values (uid, p_payload->>'preferred_name', nullif(p_payload->>'location', ''), nullif(p_payload->>'location', ''), p_payload->>'timezone', false, p_payload->>'one_year_vision', p_payload->>'work_style')
  on conflict (user_id) do update set
    preferred_name = excluded.preferred_name,
    location = excluded.location,
    current_city = excluded.current_city,
    timezone = excluded.timezone,
    one_year_vision = excluded.one_year_vision,
    work_style = excluded.work_style;

  insert into public.user_preferences(user_id, app_name, theme, accent_color, font_style, density, motion, chief_of_staff_tone, design_preferences)
  values (uid, nullif(p_payload #>> '{design,app_name}', ''), p_payload #>> '{design,theme}', p_payload #>> '{design,accent_color}', p_payload #>> '{design,font_style}', p_payload #>> '{design,density}', p_payload #>> '{design,motion}', p_payload->>'chief_of_staff_tone', p_payload->'design')
  on conflict (user_id) do update set app_name=excluded.app_name, theme=excluded.theme, accent_color=excluded.accent_color, font_style=excluded.font_style, density=excluded.density, motion=excluded.motion, chief_of_staff_tone=excluded.chief_of_staff_tone, design_preferences=excluded.design_preferences;

  for item in select value from jsonb_array_elements(coalesce(p_payload->'goals', '[]'::jsonb)) loop
    insert into public.goals(user_id, title, category, target_date) values (uid, item->>'title', coalesce(item->>'category','personal'), nullif(item->>'target_date','')::date);
    insert into public.objectives(user_id, title, category, deadline) values (uid, item->>'title', coalesce(item->>'category','personal'), nullif(item->>'target_date','')::date);
  end loop;

  for item in select value from jsonb_array_elements(coalesce(p_payload->'habits', '[]'::jsonb)) loop
    insert into public.habits(user_id, name, target_per_week) values (uid, item->>'name', coalesce((item->>'target_per_week')::integer, 7));
  end loop;

  insert into public.finance_accounts(user_id, name, account_type, currency, current_balance)
  values (uid, 'Primary cash', 'cash', currency_code, coalesce((p_payload #>> '{finances,current_cash}')::numeric, 0)) returning id into account_id;
  if coalesce((p_payload #>> '{finances,monthly_income}')::numeric, 0) > 0 then
    insert into public.income(user_id, account_id, source, amount, currency, recurring, notes)
    values (uid, account_id, 'Starting monthly income', (p_payload #>> '{finances,monthly_income}')::numeric, currency_code, true, 'Onboarding baseline');
  end if;
  update public.finance_accounts set current_balance = coalesce((p_payload #>> '{finances,current_cash}')::numeric, 0) where id = account_id;

  for item in select value from jsonb_array_elements(coalesce(p_payload->'travel_plans', '[]'::jsonb)) loop
    insert into public.travel_plans(user_id, title, city, country, arrival_at, departure_at, budget, currency, status)
    values (uid, item->>'title', nullif(item->>'city',''), nullif(item->>'country',''), nullif(item->>'arrival_at','')::timestamptz, nullif(item->>'departure_at','')::timestamptz, nullif(item->>'budget','')::numeric, currency_code, 'planned');
  end loop;

  if nullif(p_payload #>> '{health_baseline,weight}', '') is not null then
    insert into public.health_metrics(user_id, metric_type, value, unit, notes) values (uid, 'weight', (p_payload #>> '{health_baseline,weight}')::numeric, p_payload #>> '{health_baseline,weight_unit}', 'Onboarding baseline');
  end if;
  if nullif(p_payload #>> '{health_baseline,average_sleep_hours}', '') is not null then
    insert into public.health_metrics(user_id, metric_type, value, unit, notes) values (uid, 'sleep', (p_payload #>> '{health_baseline,average_sleep_hours}')::numeric, 'hours', 'Onboarding baseline');
  end if;
  if nullif(p_payload #>> '{health_baseline,workouts_per_week}', '') is not null then
    insert into public.health_metrics(user_id, metric_type, value, unit, notes) values (uid, 'workout', (p_payload #>> '{health_baseline,workouts_per_week}')::numeric, 'per week', 'Onboarding baseline');
  end if;

  insert into public.ai_context_profiles(user_id, life_vision, work_style, health_baseline, finance_baseline, onboarding_snapshot, context_summary)
  values (uid, p_payload->>'one_year_vision', p_payload->>'work_style', p_payload->'health_baseline', p_payload->'finances', p_payload, concat('Preferred name: ', p_payload->>'preferred_name', '. One-year vision: ', p_payload->>'one_year_vision', '. Work style: ', p_payload->>'work_style'))
  on conflict (user_id) do update set life_vision=excluded.life_vision, work_style=excluded.work_style, health_baseline=excluded.health_baseline, finance_baseline=excluded.finance_baseline, onboarding_snapshot=excluded.onboarding_snapshot, context_summary=excluded.context_summary;

  insert into public.finance_categories(user_id, name, category_type) values
    (uid, 'Housing', 'expense'), (uid, 'Food', 'expense'), (uid, 'Transport', 'expense'), (uid, 'Travel', 'expense'),
    (uid, 'Health', 'expense'), (uid, 'Education', 'expense'), (uid, 'Content', 'expense'), (uid, 'Other', 'expense'),
    (uid, 'Salary', 'income'), (uid, 'Freelance', 'income')
  on conflict do nothing;

  update public.profiles set onboarding_completed = true where user_id = uid;
end $$;

notify pgrst, 'reload schema';
