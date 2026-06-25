alter table public.daily_checkins drop constraint if exists daily_checkins_mood_check;
alter table public.daily_checkins drop constraint if exists daily_checkins_energy_check;
alter table public.daily_checkins drop constraint if exists daily_checkins_stress_check;
alter table public.daily_checkins drop constraint if exists daily_checkins_productivity_check;

alter table public.daily_checkins
  add constraint daily_checkins_mood_check check (mood between 1 and 10),
  add constraint daily_checkins_energy_check check (energy between 1 and 10),
  add constraint daily_checkins_stress_check check (stress between 1 and 10),
  add constraint daily_checkins_productivity_check check (productivity between 1 and 10);

alter table public.decision_journal
  add column if not exists title text,
  add column if not exists decision_date date not null default current_date,
  add column if not exists context text,
  add column if not exists options_considered jsonb not null default '[]'::jsonb,
  add column if not exists reason_chosen text,
  add column if not exists confidence integer check (confidence between 0 and 100),
  add column if not exists outcome text,
  add column if not exists lessons_learned text;

create table if not exists public.health_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  height numeric,
  weight numeric,
  goal_weight numeric,
  body_fat_pct numeric,
  waist numeric,
  neck numeric,
  diet_profile text not null default 'Custom' check (diet_profile in ('High Protein','Mediterranean','Vegetarian','Vegan','Keto','Custom')),
  custom_diet text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null,
  dosage text,
  frequency text,
  start_date date,
  end_date date,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null,
  dosage text,
  frequency text,
  purpose text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  section text not null default 'Utilities' check (section in ('Utilities','Travel','Devices','Smart Home','Quick Actions')),
  title text not null,
  url text,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  event_date date not null,
  category text not null check (category in ('Career','Health','Finance','Education','Travel','Relationships')),
  title text not null,
  description text,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  provider text not null default 'plaid',
  status text not null default 'planned' check (status in ('planned','disabled')),
  planned_capabilities jsonb not null default '["transaction imports","cash flow analysis","spending trends","runway forecasting"]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, provider)
);

create index if not exists medications_user_active_idx on public.medications(user_id, active, start_date);
create index if not exists supplements_user_active_idx on public.supplements(user_id, active);
create index if not exists home_links_user_section_idx on public.home_links(user_id, section, sort_order);
create index if not exists timeline_events_user_date_idx on public.timeline_events(user_id, event_date desc, category);

do $$ declare t text; begin
  foreach t in array array['health_profiles','medications','supplements','home_links','timeline_events','finance_integrations']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "youos foundation owner select" on public.%I', t);
    execute format('drop policy if exists "youos foundation owner insert" on public.%I', t);
    execute format('drop policy if exists "youos foundation owner update" on public.%I', t);
    execute format('drop policy if exists "youos foundation owner delete" on public.%I', t);
    execute format('create policy "youos foundation owner select" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy "youos foundation owner insert" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "youos foundation owner update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "youos foundation owner delete" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['health_profiles','medications','supplements','home_links','timeline_events','finance_integrations']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;
