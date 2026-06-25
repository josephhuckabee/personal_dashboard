alter table public.profiles
  add column if not exists age integer check (age between 0 and 130),
  add column if not exists gender text,
  add column if not exists passport_country text,
  add column if not exists adaptive_profile jsonb not null default '{}'::jsonb;

alter table public.health_profiles
  add column if not exists age integer check (age between 0 and 130),
  add column if not exists gender text,
  add column if not exists activity_level text,
  add column if not exists sleep_target numeric,
  add column if not exists dietary_restrictions text,
  add column if not exists estimated_body_fat_pct numeric,
  add column if not exists bmi numeric;

alter table public.travel_plans
  add column if not exists transport_type text,
  add column if not exists passport_country text,
  add column if not exists travel_insurance text,
  add column if not exists packing_list jsonb not null default '[]'::jsonb,
  add column if not exists country_notes text,
  add column if not exists language_notes text,
  add column if not exists important_contacts jsonb not null default '[]'::jsonb,
  add column if not exists emergency_information text,
  add column if not exists travel_memories text;

alter table public.memories drop constraint if exists memories_category_check;
alter table public.memories
  add constraint memories_category_check check (category in ('Identity','Health','Travel','Career','Education','Finance','Relationships','Values','Preferences','Goals'));

create table if not exists public.life_benchmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  horizon text not null,
  target_date date,
  title text not null,
  description text,
  category text not null default 'Life',
  source text not null default 'system',
  status text not null default 'recommended' check (status in ('recommended','accepted','adjusted','completed','archived')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  entry_date date not null default current_date,
  title text,
  body text not null,
  mood integer check (mood between 1 and 10),
  tags jsonb not null default '[]'::jsonb,
  themes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.adaptive_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  insight_date date not null default current_date,
  title text not null,
  body text not null,
  category text not null default 'System',
  evidence jsonb not null default '{}'::jsonb,
  confidence integer not null default 70 check (confidence between 0 and 100),
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists life_benchmarks_user_horizon_idx on public.life_benchmarks(user_id, target_date, horizon);
create index if not exists journal_entries_user_date_idx on public.journal_entries(user_id, entry_date desc, created_at desc);
create index if not exists journal_entries_search_idx on public.journal_entries using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, '')));
create index if not exists adaptive_insights_user_date_idx on public.adaptive_insights(user_id, insight_date desc, dismissed_at);

do $$ declare t text; begin
  foreach t in array array['life_benchmarks','journal_entries','adaptive_insights']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "adaptive os owner select" on public.%I', t);
    execute format('drop policy if exists "adaptive os owner insert" on public.%I', t);
    execute format('drop policy if exists "adaptive os owner update" on public.%I', t);
    execute format('drop policy if exists "adaptive os owner delete" on public.%I', t);
    execute format('create policy "adaptive os owner select" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy "adaptive os owner insert" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "adaptive os owner update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "adaptive os owner delete" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['life_benchmarks','journal_entries','adaptive_insights']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;
