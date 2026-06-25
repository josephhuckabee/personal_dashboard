import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { entitySchemas } from '@/lib/schemas';
import { scoreHealthSamples } from '@/lib/health-scoring';

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const [{ data: samples, error: sampleError }, { data: workouts, error: workoutError }] = await Promise.all([
      supabase.from('health_samples').select('*').eq('user_id', user.id).order('sampled_at', { ascending: false }).limit(120),
      supabase.from('workout_sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(60),
    ]);
    if (sampleError || workoutError) throw sampleError || workoutError;
    return NextResponse.json({ samples: samples || [], workouts: workouts || [], score: scoreHealthSamples(samples || [], workouts || []) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const raw = await request.json();
    if (raw.kind === 'workout') {
      const input = entitySchemas.workout_sessions.parse(raw);
      const { data, error } = await supabase.from('workout_sessions').insert({ ...input, user_id: user.id, source: input.source || 'manual' } as never).select().single();
      if (error) throw error;
      return NextResponse.json({ data }, { status: 201 });
    }
    const input = entitySchemas.health_samples.parse(raw);
    const { data, error } = await supabase.from('health_samples').insert({ ...input, user_id: user.id, source: input.source || 'manual', sampled_at: input.sampled_at || new Date().toISOString() } as never).select().single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) { return apiError(error); }
}
