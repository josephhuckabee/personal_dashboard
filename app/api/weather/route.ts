import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/api';
import { serverEnv } from '@/lib/env';

function weatherWarning(payload: Record<string, unknown>) {
  const condition = String(payload.condition || '').toLowerCase();
  const humidity = Number(payload.humidity || 0);
  const temp = Number(payload.temperature || 0);
  if (/storm|thunder/.test(condition)) return 'Storm risk';
  if (/snow|sleet/.test(condition)) return 'Snow';
  if (/rain|drizzle/.test(condition)) return 'Rain';
  if (humidity >= 75) return 'High humidity';
  if (temp >= 95) return 'Extreme heat';
  return null;
}

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const { data: profile, error } = await supabase.from('profiles').select('current_city,current_country,location').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    const location = [profile?.current_city || profile?.location, profile?.current_country].filter(Boolean).join(', ').trim();
    if (!location) return NextResponse.json({ status: 'missing_location', message: 'Set location to enable weather.' });
    const env = serverEnv();
    if (!env.WEATHER_API_KEY) return NextResponse.json({ status: 'unavailable', message: 'Weather unavailable.', location });

    const locationKey = location.toLowerCase();
    const { data: cached } = await supabase.from('weather_cache').select('*').eq('location_key', locationKey).gt('expires_at', new Date().toISOString()).maybeSingle();
    if (cached?.payload) return NextResponse.json({ status: 'cached', location, weather: cached.payload });

    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${env.WEATHER_API_KEY}&units=imperial`, { cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ status: 'unavailable', message: 'Weather unavailable.', location });
    const raw = await response.json();
    const weather = {
      temperature: Math.round(Number(raw.main?.temp)),
      high: raw.main?.temp_max != null ? Math.round(Number(raw.main.temp_max)) : null,
      low: raw.main?.temp_min != null ? Math.round(Number(raw.main.temp_min)) : null,
      humidity: raw.main?.humidity ?? null,
      condition: raw.weather?.[0]?.main || 'Unknown',
      description: raw.weather?.[0]?.description || null,
    };
    const payload = { ...weather, warning: weatherWarning(weather) };
    await supabase.from('weather_cache').upsert({
      location_key: locationKey,
      location_label: location,
      payload,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    } as never, { onConflict: 'location_key' });
    return NextResponse.json({ status: 'live', location, weather: payload });
  } catch (error) { return apiError(error); }
}
