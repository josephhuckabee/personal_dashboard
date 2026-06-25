alter table public.daily_checkins
  add column if not exists checked_in_at timestamptz not null default now(),
  add column if not exists local_date date,
  add column if not exists timezone text,
  add column if not exists time_of_day text check (time_of_day in ('morning','afternoon','evening','night'));

update public.daily_checkins
set
  local_date = coalesce(local_date, checkin_date),
  timezone = coalesce(timezone, 'America/New_York'),
  time_of_day = coalesce(time_of_day, 'morning')
where local_date is null or timezone is null or time_of_day is null;

alter table public.daily_checkins
  alter column local_date set not null,
  alter column timezone set not null;

create index if not exists daily_checkins_user_checked_in_idx on public.daily_checkins(user_id, checked_in_at desc);

create table if not exists public.weather_cache (
  id uuid primary key default gen_random_uuid(),
  location_key text not null unique,
  location_label text not null,
  payload jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.health_samples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  sample_type text not null check (sample_type in ('steps','active_calories','resting_heart_rate','sleep_duration','stand_hours','vo2_max','weight','heart_rate_variability')),
  value numeric not null,
  unit text not null,
  sampled_at timestamptz not null default now(),
  source text not null default 'manual',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  workout_type text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes numeric,
  active_calories numeric,
  distance numeric,
  source text not null default 'manual',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.context_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  calendar_event_id uuid references public.calendar_events(id) on delete set null,
  raw_input text not null,
  title text not null,
  event_date date not null,
  event_time time,
  category text not null default 'Personal',
  location text,
  notes text,
  confidence_score integer not null default 70 check (confidence_score between 0 and 100),
  needs_confirmation boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.calendar_events
  add column if not exists confidence_score integer check (confidence_score between 0 and 100),
  add column if not exists generated_from text;

create index if not exists weather_cache_location_idx on public.weather_cache(location_key, expires_at);
create index if not exists health_samples_user_type_time_idx on public.health_samples(user_id, sample_type, sampled_at desc);
create index if not exists workout_sessions_user_started_idx on public.workout_sessions(user_id, started_at desc);
create index if not exists context_events_user_date_idx on public.context_events(user_id, event_date, created_at desc);

alter table public.health_samples enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.context_events enable row level security;

do $$ declare t text; begin
  foreach t in array array['health_samples','workout_sessions','context_events']
  loop
    execute format('drop policy if exists "phase8 owner select" on public.%I', t);
    execute format('drop policy if exists "phase8 owner insert" on public.%I', t);
    execute format('drop policy if exists "phase8 owner update" on public.%I', t);
    execute format('drop policy if exists "phase8 owner delete" on public.%I', t);
    execute format('create policy "phase8 owner select" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy "phase8 owner insert" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "phase8 owner update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "phase8 owner delete" on public.%I for delete using (auth.uid() = user_id)', t);
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

drop trigger if exists set_updated_at on public.weather_cache;
create trigger set_updated_at before update on public.weather_cache for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';
