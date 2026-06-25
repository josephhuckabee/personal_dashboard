import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export class UnauthorizedError extends Error {}

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new UnauthorizedError('Authentication required.');
  return { user, supabase };
}

export async function ensureProfile(supabase: Awaited<ReturnType<typeof createClient>>, user: User) {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  if (data) return data;

  const preferredName = user.user_metadata?.preferred_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'You';
  const timezone = user.user_metadata?.timezone || 'America/New_York';
  const { data: created, error: createError } = await supabase.from('profiles').insert({
    user_id: user.id,
    preferred_name: preferredName,
    timezone,
    onboarding_completed: false,
  } as never).select().single();
  if (createError) throw createError;
  return created;
}
