create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  type text not null check (type in ('fact','preference','goal','decision','lesson','behavior','pattern','risk','opportunity','warning','milestone')),
  title text not null,
  content text not null,
  source text not null default 'system',
  importance_score integer not null default 50 check (importance_score between 0 and 100),
  confidence_score integer not null default 70 check (confidence_score between 0 and 100),
  is_important boolean not null default false,
  inaccurate_at timestamptz,
  last_used_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memory_relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  memory_id uuid not null references public.memories(id) on delete cascade,
  related_memory_id uuid references public.memories(id) on delete cascade,
  related_entity_type text,
  related_entity_id uuid,
  relationship_type text not null default 'related',
  strength numeric(5,2) not null default 0.50 check (strength between 0 and 1),
  created_at timestamptz not null default now(),
  constraint memory_relationship_target check (related_memory_id is not null or (related_entity_type is not null and related_entity_id is not null))
);

create table if not exists public.memory_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  memory_id uuid references public.memories(id) on delete set null,
  event_type text not null,
  source text not null default 'system',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ai_briefings
  add column if not exists top_priorities jsonb not null default '[]'::jsonb,
  add column if not exists risks jsonb not null default '[]'::jsonb,
  add column if not exists recommended_focus text,
  add column if not exists recommended_avoidance text,
  add column if not exists memories_used jsonb not null default '[]'::jsonb;

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  week_start date not null,
  week_end date not null,
  wins jsonb not null default '[]'::jsonb,
  losses jsonb not null default '[]'::jsonb,
  lessons jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  habit_analysis text not null,
  finance_analysis text not null,
  goal_progress text not null,
  recommended_next_week_focus text not null,
  memories_created jsonb not null default '[]'::jsonb,
  provider text,
  model text,
  source_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, week_start)
);

create index if not exists memories_user_created_idx on public.memories(user_id, created_at desc);
create index if not exists memories_user_importance_idx on public.memories(user_id, importance_score desc, created_at desc);
create index if not exists memories_user_type_idx on public.memories(user_id, type, created_at desc);
create index if not exists memories_search_idx on public.memories using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));
create index if not exists memory_relationships_user_memory_idx on public.memory_relationships(user_id, memory_id);
create index if not exists memory_events_user_created_idx on public.memory_events(user_id, created_at desc);
create index if not exists weekly_reviews_user_week_idx on public.weekly_reviews(user_id, week_start desc);

do $$ declare t text; begin
  foreach t in array array['memories','memory_relationships','memory_events','weekly_reviews']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "memory engine owner select" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy "memory engine owner insert" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "memory engine owner update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "memory engine owner delete" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['memories','weekly_reviews']
  loop execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t); end loop;
end $$;
