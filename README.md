# You OS — AI Chief of Staff

You OS is a private, user-scoped executive operating system built with Next.js, TypeScript, Tailwind, Supabase, Zod, and OpenAI or Anthropic. Every user receives a personalized `[Preferred Name] OS` while the approved dashboard design remains the default visual system.

## Local setup

1. Create a Supabase project.
2. Run both SQL files in `supabase/migrations/` in filename order, or apply them with the Supabase CLI.
3. Copy `.env.example` to `.env.local` and fill in the Supabase values.
4. Add either `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`. Set `AI_PROVIDER` and a compatible `AI_MODEL`.
5. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Email/password authentication protects the application routes. New users are routed through onboarding before entering the dashboard.

## Environment variables

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
AI_PROVIDER=openai
AI_MODEL=gpt-4.1
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the browser-safe Supabase key. The older `NEXT_PUBLIC_SUPABASE_ANON_KEY` name is still accepted as a fallback. `SUPABASE_SERVICE_ROLE_KEY` is server-only and is used by server APIs after they verify the signed-in user. Never expose it to the browser or any `NEXT_PUBLIC_` variable.

## Database and privacy

The migration creates the requested core tables, auth-profile trigger, indexes, private receipt bucket, update triggers, and row-level security. Every application record has a `user_id`, and all browser/server session queries remain user-scoped. Receipts are private and are exposed to the owner through short-lived signed URLs.

## Optional development seed

The development-only seed function is in `supabase/seed.sql`. After creating an auth user, run it explicitly with that user UUID:

```sql
set app.environment = 'development';
select public.seed_demo_user('YOUR_AUTH_USER_UUID');
```

It adds Joseph as an explicit demo user with a $12,000 cash account, Seoul chapter, WGU and remote-income objectives, five core habits, and a travel plan. No Joseph-specific data is used by the product runtime, and production never loads seed data.

## AI safety boundary

`generateChiefOfStaffDecisionEngine(userId)` reads only the authenticated user's Supabase snapshot, requests strict JSON, validates it with Zod, and stores the result in `ai_decisions`. Missing data remains explicitly missing. Medical, legal, and financial topics are framed as operational guidance, not certainty. If the configured AI provider fails, the server produces a deterministic evidence-only decision.

## Verification

```bash
npm run typecheck
npm run build
```

Deploy to Vercel after adding the same environment variables and configuring the Supabase authentication redirect URL as `https://YOUR_DOMAIN/auth/callback`.
