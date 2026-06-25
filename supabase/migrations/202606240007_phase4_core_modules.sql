alter table public.objectives
  add column if not exists priority text not null default 'medium' check (priority in ('low','medium','high'));

create index if not exists objectives_user_priority_idx on public.objectives(user_id, priority, status);
