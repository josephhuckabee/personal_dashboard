'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';
import { publicEnv } from '@/lib/env';

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  const env = publicEnv();
  client ??= createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return client;
}
