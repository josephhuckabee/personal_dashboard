-- Development only. Run with a real auth user UUID:
-- set app.environment = 'development';
-- select public.seed_demo_user('00000000-0000-0000-0000-000000000000');
create or replace function public.seed_demo_user(p_user_id uuid) returns void language plpgsql security definer as $$
declare wgu_id uuid; income_id uuid; content_id uuid;
begin
  if current_setting('app.environment', true) is distinct from 'development' then
    raise exception 'Development seed is disabled outside development';
  end if;
  insert into public.users(id, display_name, current_city, current_country, chapter_started_at, onboarding_completed, one_year_vision, work_style)
  values (p_user_id, 'Joseph', 'Seoul', 'South Korea', current_date - 17, true, 'Build a portable, healthy, financially sustainable life while completing WGU.', 'Protect mornings for deep work and use direct operational guidance.')
  on conflict (id) do update set current_city='Seoul', current_country='South Korea', onboarding_completed=true;
  insert into public.user_preferences(user_id, app_name, chief_of_staff_tone) values (p_user_id, 'Joseph OS', 'executive') on conflict (user_id) do update set app_name='Joseph OS';
  insert into public.finance_accounts(user_id, name, account_type, current_balance) values (p_user_id, 'Operating cash', 'cash', 12000);
  insert into public.objectives(user_id, title, category, progress, deadline) values (p_user_id, 'Graduate from WGU', 'education', 68, '2026-12-15') returning id into wgu_id;
  insert into public.objectives(user_id, title, category, progress) values (p_user_id, 'Build sustainable remote income', 'career', 42) returning id into income_id;
  insert into public.objectives(user_id, title, category, progress) values (p_user_id, 'Publish the Year of Reinvention', 'content', 20) returning id into content_id;
  insert into public.habits(user_id, objective_id, name, icon) values
    (p_user_id, null, 'Meditation', 'flower'), (p_user_id, wgu_id, 'Coding', 'code'),
    (p_user_id, null, 'Lifting', 'dumbbell'), (p_user_id, null, 'Running', 'footprints'), (p_user_id, null, 'Yoga', 'heart');
  insert into public.travel_plans(user_id, title, plan_type, city, country, arrival_at, departure_at, budget, status)
  values (p_user_id, 'Seoul chapter', 'destination', 'Seoul', 'South Korea', now() - interval '17 days', now() + interval '43 days', 2960, 'active');
end $$;
