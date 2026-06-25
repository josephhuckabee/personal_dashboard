alter table public.memories
  add column if not exists category text not null default 'Identity' check (category in ('Identity','Goals','Health','Career','Finance','Travel','Relationships','Preferences')),
  add column if not exists archived_at timestamptz;

create table if not exists public.morning_briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  briefing_date date not null default current_date,
  today jsonb not null default '{}'::jsonb,
  status jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, briefing_date)
);

create table if not exists public.executive_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  score_date date not null default current_date,
  execution integer not null check (execution between 0 and 100),
  health integer not null check (health between 0 and 100),
  finance integer not null check (finance between 0 and 100),
  growth integer not null check (growth between 0 and 100),
  operating_score integer not null check (operating_score between 0 and 100),
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, score_date)
);

create table if not exists public.decision_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  decision text not null,
  reasoning text not null,
  expected_outcome text not null,
  review_date date,
  actual_outcome text,
  quality_score integer check (quality_score between 0 and 100),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.weekly_reviews
  add column if not exists travel_summary text,
  add column if not exists recommended_adjustments jsonb not null default '[]'::jsonb,
  add column if not exists citations jsonb not null default '[]'::jsonb;

create index if not exists memories_user_category_idx on public.memories(user_id, category, archived_at);
create index if not exists morning_briefings_user_date_idx on public.morning_briefings(user_id, briefing_date desc);
create index if not exists executive_scores_user_date_idx on public.executive_scores(user_id, score_date desc);
create index if not exists decision_journal_user_review_idx on public.decision_journal(user_id, review_date, created_at desc);

do $$ declare t text; begin
  foreach t in array array['morning_briefings','executive_scores','decision_journal']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "executive intelligence owner select" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy "executive intelligence owner insert" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "executive intelligence owner update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "executive intelligence owner delete" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['morning_briefings','executive_scores','decision_journal']
  loop execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t); end loop;
end $$;
