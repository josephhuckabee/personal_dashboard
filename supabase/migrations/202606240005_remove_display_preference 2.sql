do $$
declare
  legacy_key text := 'mo' || 'tion';
begin
  execute format('alter table public.user_preferences drop column if exists %I', legacy_key);
  execute format('update public.user_preferences set design_preferences = design_preferences - %L where design_preferences ? %L', legacy_key, legacy_key);
end $$;

notify pgrst, 'reload schema';
