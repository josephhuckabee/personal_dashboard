import { z } from 'zod';

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

const optionalSecret = z.preprocess((value) => value === '' ? undefined : value, z.string().min(1).optional());

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  OPENAI_API_KEY: optionalSecret,
  ANTHROPIC_API_KEY: optionalSecret,
  WEATHER_API_KEY: optionalSecret,
  AI_PROVIDER: z.enum(['openai', 'anthropic']).default('openai'),
  AI_MODEL: z.string().default('gpt-4.1'),
});

export function publicEnv() {
  const env = publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  const supabasePublicKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabasePublicKey) throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required.');
  return {
    ...env,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabasePublicKey,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabasePublicKey,
  };
}

export function serverEnv() {
  return serverSchema.parse({
    ...publicEnv(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    WEATHER_API_KEY: process.env.WEATHER_API_KEY,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
  });
}

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
}
