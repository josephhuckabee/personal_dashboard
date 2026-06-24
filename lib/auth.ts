import { createClient } from '@/lib/supabase/server';

export class UnauthorizedError extends Error {}

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new UnauthorizedError('Authentication required.');
  return { user, supabase };
}
