import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { UnauthorizedError } from '@/lib/auth';

export function apiError(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ZodError) return NextResponse.json({ error: 'Invalid request.', issues: error.flatten() }, { status: 400 });
  console.error(error);
  const raw = error instanceof Error ? error.message : '';
  const message = raw.includes('profiles') ? 'Profile not found yet.'
    : raw.includes('dashboard') ? 'Could not load dashboard data.'
      : raw.includes('receipt') || raw.includes('storage') ? 'Receipt file unavailable.'
        : 'This feature is not connected yet.';
  return NextResponse.json({ error: message }, { status: 500 });
}
