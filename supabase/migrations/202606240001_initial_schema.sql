create extension if not exists "pgcrypto";

create type public.objective_status as enum ('healthy', 'watch', 'at_risk', 'completed', 'paused');
create type public.task_status as enum ('todo', 'in_progress', 'completed', 'cancelled');
create type public.transaction_type as enum ('expense', 'income', 'transfer');
create type public.receipt_status as enum ('uploaded', 'processing', 'needs_review', 'ready', 'failed');
create type public.content_status as enum ('idea', 'script', 'draft', 'scheduled', 'published', 'archived');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'America/New_York',
  current_city text,
  current_country text,
  chapter_started_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.objectives (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  title text not null, description text, category text not null default 'personal', status public.objective_status not null default 'healthy',
  progress numeric(5,2) not null default 0 check (progress between 0 and 100), target_value numeric, current_value numeric,
  deadline date, last_activity_at timestamptz, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.habits (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  objective_id uuid references public.objectives(id) on delete set null, name text not null, description text,
  frequency text not null default 'daily', target_per_week integer not null default 7 check (target_per_week between 1 and 7),
  active boolean not null default true, icon text, color text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  objective_id uuid references public.objectives(id) on delete set null, title text not null, description text,
  status public.task_status not null default 'todo', priority text not null default 'medium' check (priority in ('low','medium','high')),
  due_at timestamptz, estimated_minutes integer, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade, logged_on date not null default current_date,
  completed boolean not null default true, value numeric, note text, created_at timestamptz not null default now(),
  unique (habit_id, logged_on)
);

create table public.finance_accounts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  name text not null, account_type text not null default 'cash', institution text, currency text not null default 'USD',
  current_balance numeric(14,2) not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.receipt_uploads (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  storage_path text not null, original_filename text, mime_type text, status public.receipt_status not null default 'uploaded',
  merchant text, transaction_date date, total numeric(14,2), category text, payment_method text, notes text,
  extraction jsonb, error text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid references public.finance_accounts(id) on delete set null, receipt_upload_id uuid references public.receipt_uploads(id) on delete set null,
  type public.transaction_type not null default 'expense', merchant text, description text, amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'USD', category text not null default 'Other', payment_method text, transaction_date date not null default current_date,
  notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.income (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid references public.finance_accounts(id) on delete set null, source text not null, amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'USD', received_on date not null default current_date, recurring boolean not null default false, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.travel_plans (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  title text not null, plan_type text not null default 'destination', city text, country text, provider text,
  arrival_at timestamptz, departure_at timestamptz, confirmation_number text, visa_deadline date,
  budget numeric(14,2), cost numeric(14,2), currency text not null default 'USD', status text not null default 'planned', notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.content_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  title text not null, content_type text not null default 'idea', platform text, status public.content_status not null default 'idea',
  body text, views integer not null default 0, engagement numeric(8,4) not null default 0, next_action text, publish_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.relationships (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  name text not null, relationship_type text not null default 'personal', email text, last_contact_at timestamptz,
  next_follow_up_at timestamptz, health_score integer check (health_score between 0 and 100), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.health_metrics (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  metric_type text not null, value numeric not null, unit text not null, recorded_at timestamptz not null default now(), notes text,
  created_at timestamptz not null default now()
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  title text not null, category text not null default 'personal', starts_at timestamptz not null, ends_at timestamptz not null,
  location text, notes text, source text not null default 'you-os', external_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  checkin_date date not null default current_date, mood integer check (mood between 1 and 5), energy integer check (energy between 1 and 5),
  stress integer check (stress between 1 and 5), sleep_hours numeric(4,1), win_of_day text, what_was_avoided text, tomorrow_priority text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, checkin_date)
);

create table public.ai_briefings (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  briefing_date date not null default current_date, summary text not null, current_risks jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb, today_plan jsonb not null default '[]'::jsonb,
  finance_analysis jsonb not null default '{}'::jsonb, execution_readiness_score integer not null check (execution_readiness_score between 0 and 100),
  chief_of_staff_note text not null, provider text, model text, source_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  briefing_id uuid references public.ai_briefings(id) on delete cascade, title text not null, reason text,
  category text, priority text check (priority in ('low','medium','high')), recommended_action text not null,
  accepted_at timestamptz, dismissed_at timestamptz, created_at timestamptz not null default now()
);

create index on public.objectives(user_id, status);
create index on public.tasks(user_id, status, due_at);
create index on public.habit_logs(user_id, logged_on desc);
create index on public.transactions(user_id, transaction_date desc);
create index on public.travel_plans(user_id, arrival_at);
create index on public.health_metrics(user_id, metric_type, recorded_at desc);
create index on public.calendar_events(user_id, starts_at);
create index on public.ai_briefings(user_id, created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array['users','objectives','habits','tasks','finance_accounts','receipt_uploads','transactions','income','travel_plans','content_items','relationships','calendar_events','daily_checkins']
  loop execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t); end loop;
end $$;

create or replace function public.handle_new_user() returns trigger security definer set search_path = public language plpgsql as $$
begin insert into public.users(id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

do $$ declare t text; begin
  foreach t in array array['objectives','tasks','habits','habit_logs','finance_accounts','transactions','income','receipt_uploads','travel_plans','content_items','relationships','health_metrics','calendar_events','ai_briefings','ai_recommendations','daily_checkins']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "user scoped select" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy "user scoped insert" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "user scoped update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "user scoped delete" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

alter table public.users enable row level security;
create policy "user scoped select" on public.users for select using (auth.uid() = id);
create policy "user scoped insert" on public.users for insert with check (auth.uid() = id);
create policy "user scoped update" on public.users for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "user scoped delete" on public.users for delete using (auth.uid() = id);

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 12582912, array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf'])
on conflict (id) do nothing;
create policy "receipt owner select" on storage.objects for select using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "receipt owner insert" on storage.objects for insert with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "receipt owner update" on storage.objects for update using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "receipt owner delete" on storage.objects for delete using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
