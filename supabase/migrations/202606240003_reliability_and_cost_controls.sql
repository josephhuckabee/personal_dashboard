create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_name text,
  location text,
  current_city text,
  current_country text,
  chapter_started_at date,
  timezone text not null default 'UTC',
  onboarding_completed boolean not null default false,
  one_year_vision text,
  work_style text,
  monthly_ai_budget numeric(10,2) not null default 5.00,
  monthly_ai_requests_limit integer not null default 30,
  ai_requests_used_this_month integer not null default 0,
  ai_usage_month date not null default date_trunc('month', current_date)::date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.profiles(user_id, preferred_name, location, current_city, current_country, chapter_started_at, timezone, onboarding_completed, one_year_vision, work_style, created_at, updated_at)
select id, display_name, concat_ws(', ', current_city, current_country), current_city, current_country, chapter_started_at, timezone, onboarding_completed, one_year_vision, work_style, created_at, updated_at from public.users
on conflict (user_id) do update set preferred_name=excluded.preferred_name, location=excluded.location, current_city=excluded.current_city, current_country=excluded.current_country, chapter_started_at=excluded.chapter_started_at, timezone=excluded.timezone, onboarding_completed=excluded.onboarding_completed, one_year_vision=excluded.one_year_vision, work_style=excluded.work_style, updated_at=excluded.updated_at;

alter table public.profiles enable row level security;
create policy "profile owner select" on public.profiles for select using (auth.uid() = user_id);
create policy "profile owner insert" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profile owner update" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "profile owner delete" on public.profiles for delete using (auth.uid() = user_id);
create trigger set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.sync_user_to_profile() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(user_id, preferred_name, location, current_city, current_country, chapter_started_at, timezone, onboarding_completed, one_year_vision, work_style, created_at, updated_at)
  values (new.id, new.display_name, concat_ws(', ', new.current_city, new.current_country), new.current_city, new.current_country, new.chapter_started_at, new.timezone, new.onboarding_completed, new.one_year_vision, new.work_style, new.created_at, new.updated_at)
  on conflict (user_id) do update set preferred_name=excluded.preferred_name, location=excluded.location, current_city=excluded.current_city, current_country=excluded.current_country, chapter_started_at=excluded.chapter_started_at, timezone=excluded.timezone, onboarding_completed=excluded.onboarding_completed, one_year_vision=excluded.one_year_vision, work_style=excluded.work_style, updated_at=excluded.updated_at;
  return new;
end $$;
create trigger sync_user_profile after insert or update on public.users for each row execute function public.sync_user_to_profile();

alter table public.tasks add column if not exists goal_id uuid references public.goals(id) on delete set null;

create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  feature text not null,
  provider text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost numeric(12,6) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ai_usage_user_month_idx on public.ai_usage_logs(user_id, created_at desc);
alter table public.ai_usage_logs enable row level security;
create policy "usage owner select" on public.ai_usage_logs for select using (auth.uid() = user_id);
create policy "usage owner insert" on public.ai_usage_logs for insert with check (auth.uid() = user_id);
create trigger set_updated_at before update on public.ai_usage_logs for each row execute function public.set_updated_at();

alter table public.habit_logs add column if not exists updated_at timestamptz not null default now();
alter table public.health_metrics add column if not exists updated_at timestamptz not null default now();
alter table public.ai_briefings add column if not exists updated_at timestamptz not null default now();
alter table public.ai_recommendations add column if not exists updated_at timestamptz not null default now();
alter table public.ai_decisions add column if not exists updated_at timestamptz not null default now();
alter table public.finance_categories add column if not exists updated_at timestamptz not null default now();
do $$ declare t text; begin
  foreach t in array array['habit_logs','health_metrics','ai_briefings','ai_recommendations','ai_decisions','finance_categories']
  loop execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t); end loop;
end $$;

create or replace function public.transaction_balance_effect(p_type public.transaction_type, p_amount numeric) returns numeric language sql immutable as $$
  select case when p_type = 'expense' then -p_amount when p_type = 'income' then p_amount else 0 end
$$;

create or replace function public.sync_transaction_account_balance() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE','DELETE') and old.account_id is not null then
    update public.finance_accounts set current_balance = current_balance - public.transaction_balance_effect(old.type, old.amount) where id = old.account_id and user_id = old.user_id;
  end if;
  if tg_op in ('INSERT','UPDATE') and new.account_id is not null then
    update public.finance_accounts set current_balance = current_balance + public.transaction_balance_effect(new.type, new.amount) where id = new.account_id and user_id = new.user_id;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger sync_transaction_balance after insert or update or delete on public.transactions for each row execute function public.sync_transaction_account_balance();

create or replace function public.sync_income_account_balance() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE','DELETE') and old.account_id is not null then
    update public.finance_accounts set current_balance = current_balance - old.amount where id = old.account_id and user_id = old.user_id;
  end if;
  if tg_op in ('INSERT','UPDATE') and new.account_id is not null then
    update public.finance_accounts set current_balance = current_balance + new.amount where id = new.account_id and user_id = new.user_id;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger sync_income_balance after insert or update or delete on public.income for each row execute function public.sync_income_account_balance();

create or replace function public.reserve_ai_request(p_feature text) returns public.profiles language plpgsql security definer set search_path = public as $$
declare p public.profiles;
begin
  select * into p from public.profiles where user_id = auth.uid() for update;
  if p.user_id is null then raise exception 'Profile not found'; end if;
  if p.ai_usage_month < date_trunc('month', current_date)::date then
    update public.profiles set ai_usage_month=date_trunc('month', current_date)::date, ai_requests_used_this_month=0 where user_id=p.user_id returning * into p;
  end if;
  if p.ai_requests_used_this_month >= p.monthly_ai_requests_limit then raise exception 'Monthly AI request limit reached'; end if;
  if coalesce((select sum(estimated_cost) from public.ai_usage_logs where user_id=p.user_id and created_at >= date_trunc('month', now())), 0) >= p.monthly_ai_budget then raise exception 'Monthly AI budget reached'; end if;
  update public.profiles set ai_requests_used_this_month=ai_requests_used_this_month+1 where user_id=p.user_id returning * into p;
  return p;
end $$;
