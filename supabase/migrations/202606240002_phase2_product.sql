alter table public.users
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists one_year_vision text,
  add column if not exists work_style text;

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  app_name text,
  theme text not null default 'default',
  accent_color text not null default '#a7f3d0',
  font_style text not null default 'default',
  density text not null default 'comfortable',
  motion text not null default 'full',
  chief_of_staff_tone text not null default 'executive',
  design_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'personal',
  progress numeric(5,2) not null default 0 check (progress between 0 and 100),
  target_date date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.objectives add column if not exists goal_id uuid references public.goals(id) on delete set null;

create table if not exists public.ai_context_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  life_vision text,
  work_style text,
  health_baseline jsonb not null default '{}'::jsonb,
  finance_baseline jsonb not null default '{}'::jsonb,
  onboarding_snapshot jsonb not null default '{}'::jsonb,
  context_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  category_type text not null default 'expense' check (category_type in ('expense','income')),
  monthly_budget numeric(14,2),
  color text,
  created_at timestamptz not null default now(),
  unique(user_id, name, category_type)
);

create table if not exists public.content_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  content_type text not null default 'project',
  platform text,
  status public.content_status not null default 'idea',
  body text,
  views integer not null default 0,
  engagement numeric(8,4) not null default 0,
  next_action text,
  publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daily_checkins
  add column if not exists productivity integer check (productivity between 1 and 5),
  add column if not exists biggest_win text,
  add column if not exists biggest_challenge text,
  add column if not exists ai_summary text;

update public.daily_checkins set biggest_win = win_of_day where biggest_win is null and win_of_day is not null;

create table if not exists public.ai_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  decision_date date not null default current_date,
  top_priorities jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  recommended_focus text not null,
  recommended_avoidance text not null,
  execution_readiness_score integer not null check (execution_readiness_score between 0 and 100),
  chief_of_staff_note text not null,
  provider text,
  model text,
  source_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists goals_user_status_idx on public.goals(user_id, status);
create index if not exists checkins_user_date_idx on public.daily_checkins(user_id, checkin_date desc);
create index if not exists decisions_user_date_idx on public.ai_decisions(user_id, created_at desc);

do $$ declare t text; begin
  foreach t in array array['user_preferences','goals','ai_context_profiles','finance_categories','content_projects','ai_decisions']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "phase2 user scoped select" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy "phase2 user scoped insert" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "phase2 user scoped update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "phase2 user scoped delete" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['user_preferences','goals','ai_context_profiles','content_projects']
  loop execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t); end loop;
end $$;

create or replace function public.handle_new_user() returns trigger security definer set search_path = public language plpgsql as $$
begin
  insert into public.users(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'preferred_name', new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  insert into public.user_preferences(user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;

insert into public.user_preferences(user_id)
select id from public.users
on conflict (user_id) do nothing;

create or replace function public.complete_onboarding(p_payload jsonb)
returns void language plpgsql security invoker set search_path = public as $$
declare
  uid uuid := auth.uid();
  item jsonb;
  account_id uuid;
  currency_code text := coalesce(p_payload #>> '{finances,currency}', 'USD');
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if exists(select 1 from public.users where id = uid and onboarding_completed) then return; end if;

  update public.users set
    display_name = p_payload->>'preferred_name',
    current_city = nullif(p_payload->>'location', ''),
    timezone = p_payload->>'timezone',
    one_year_vision = p_payload->>'one_year_vision',
    work_style = p_payload->>'work_style'
  where id = uid;

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

  update public.users set onboarding_completed = true where id = uid;
end $$;
