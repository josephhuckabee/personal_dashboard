export function scoreHealthSamples(samples: Array<Record<string, unknown>>, workouts: Array<Record<string, unknown>>) {
  const latest = (type: string) => samples.find((sample) => sample.sample_type === type);
  const steps = Number(latest('steps')?.value || 0);
  const sleep = Number(latest('sleep_duration')?.value || 0);
  const restingHr = Number(latest('resting_heart_rate')?.value || 0);
  const workoutCount = workouts.filter((workout) => workout.started_at && new Date(String(workout.started_at)) >= new Date(Date.now() - 7 * 86400000)).length;
  const parts = [
    steps ? Math.min(100, steps / 10000 * 100) : null,
    sleep ? Math.min(100, sleep / 8 * 100) : null,
    restingHr ? Math.max(0, Math.min(100, 120 - restingHr)) : null,
    workoutCount ? Math.min(100, workoutCount / 4 * 100) : null,
  ].filter((value): value is number => value !== null);
  return parts.length ? Math.round(parts.reduce((sum, value) => sum + value, 0) / parts.length) : null;
}
