import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { UnauthorizedError } from '@/lib/auth';

export function apiError(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ZodError) return NextResponse.json({ error: 'Invalid request.', issues: error.flatten() }, { status: 400 });
  const message = error instanceof Error ? error.message : 'Unexpected server error.';
  console.error(error);
  return NextResponse.json({ error: message }, { status: 500 });
}
