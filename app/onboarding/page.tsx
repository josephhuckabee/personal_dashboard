'use client';

import { useMemo, useState } from 'react';

const steps = ['Identity', 'Direction', 'Baseline', 'Preferences'];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    preferred_name: '', location: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', one_year_vision: '',
    goals: '', habits: '', current_cash: '', monthly_income: '', currency: 'USD', travel_plans: '',
    weight: '', weight_unit: 'lb', average_sleep_hours: '', workouts_per_week: '', work_style: '',
    chief_of_staff_tone: 'executive', app_name: '', theme: 'default', accent_color: '#a7f3d0', font_style: 'default', density: 'comfortable', motion: 'full',
  });
  const update = (name: string, value: string) => setForm((current) => ({ ...current, [name]: value }));
  const progress = useMemo(() => (step + 1) / steps.length * 100, [step]);

  async function complete() {
    setLoading(true); setError('');
    const goals = form.goals.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
      const [title, category = 'personal', target_date] = line.split('|').map((part) => part.trim());
      return { title, category, target_date: target_date || null };
    });
    const habits = form.habits.split(',').map((name) => name.trim()).filter(Boolean).map((name) => ({ name, target_per_week: 7 }));
    const travel_plans = form.travel_plans.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
      const [title, city = '', country = '', arrival = '', departure = '', budget = ''] = line.split('|').map((part) => part.trim());
      return { title, city, country, arrival_at: arrival ? new Date(arrival).toISOString() : null, departure_at: departure ? new Date(departure).toISOString() : null, budget: budget ? Number(budget) : null };
    });
    const payload = {
      preferred_name: form.preferred_name, location: form.location, timezone: form.timezone, one_year_vision: form.one_year_vision,
      goals, habits,
      finances: { current_cash: Number(form.current_cash || 0), monthly_income: Number(form.monthly_income || 0), currency: form.currency.toUpperCase() },
      travel_plans,
      health_baseline: { weight: form.weight ? Number(form.weight) : null, weight_unit: form.weight_unit, average_sleep_hours: form.average_sleep_hours ? Number(form.average_sleep_hours) : null, workouts_per_week: form.workouts_per_week ? Number(form.workouts_per_week) : null },
      work_style: form.work_style, chief_of_staff_tone: form.chief_of_staff_tone,
      design: { app_name: form.app_name || `${form.preferred_name} OS`, theme: form.theme, accent_color: form.accent_color, font_style: form.font_style, density: form.density, motion: form.motion },
    };
    try {
      const response = await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error('Onboarding submit failed', { status: response.status, error: result.error, issues: result.issues });
        setError(result.error || "We couldn't save your setup yet. Please try again in a moment.");
        setLoading(false);
        return;
      }
      window.location.href = '/';
    } catch (error) {
      console.error('Onboarding submit failed', error);
      setError("We couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell onboarding-shell">
      <section className="card onboarding-card">
        <div className="onboarding-heading"><span className="brand-mark">Y</span><div><p className="eyebrow">You OS · First setup</p><h1>{steps[step]}<span className="title-dot">.</span></h1></div><span>{step + 1} / {steps.length}</span></div>
        <div className="progress-track"><span className="progress-fill fill-green" style={{ width: `${progress}%` }} /></div>

        {step === 0 && <div className="onboarding-fields"><label>Preferred name<input value={form.preferred_name} onChange={(event) => update('preferred_name', event.target.value)} placeholder="What should your OS call you?" required /></label><label>Current location<input value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="City, country" /></label><label>Timezone<input value={form.timezone} onChange={(event) => update('timezone', event.target.value)} required /></label><label className="full-field">One-year life vision<textarea value={form.one_year_vision} onChange={(event) => update('one_year_vision', event.target.value)} placeholder="What should be materially different one year from now?" required /></label></div>}

        {step === 1 && <div className="onboarding-fields"><label className="full-field">Goals<textarea value={form.goals} onChange={(event) => update('goals', event.target.value)} placeholder={'One per line: Goal | Category | Target date\nBuild sustainable income | career | 2027-01-01'} required /></label><label className="full-field">Habits<input value={form.habits} onChange={(event) => update('habits', event.target.value)} placeholder="Meditation, coding, lifting, running" /></label><label className="full-field">Travel plans<textarea value={form.travel_plans} onChange={(event) => update('travel_plans', event.target.value)} placeholder="One per line: Title | City | Country | Arrival | Departure | Budget" /></label></div>}

        {step === 2 && <div className="onboarding-fields"><label>Current cash<input type="number" min="0" step=".01" value={form.current_cash} onChange={(event) => update('current_cash', event.target.value)} required /></label><label>Monthly income<input type="number" min="0" step=".01" value={form.monthly_income} onChange={(event) => update('monthly_income', event.target.value)} /></label><label>Currency<input maxLength={3} value={form.currency} onChange={(event) => update('currency', event.target.value)} required /></label><label>Weight<input type="number" min="0" step=".1" value={form.weight} onChange={(event) => update('weight', event.target.value)} /></label><label>Weight unit<select value={form.weight_unit} onChange={(event) => update('weight_unit', event.target.value)}><option value="lb">lb</option><option value="kg">kg</option></select></label><label>Average sleep<input type="number" min="0" max="24" step=".25" value={form.average_sleep_hours} onChange={(event) => update('average_sleep_hours', event.target.value)} /></label><label>Workouts per week<input type="number" min="0" max="14" value={form.workouts_per_week} onChange={(event) => update('workouts_per_week', event.target.value)} /></label></div>}

        {step === 3 && <div className="onboarding-fields"><label className="full-field">Work style<textarea value={form.work_style} onChange={(event) => update('work_style', event.target.value)} placeholder="When do you focus best? How do you prefer to plan and work?" required /></label><label>Chief of Staff tone<select value={form.chief_of_staff_tone} onChange={(event) => update('chief_of_staff_tone', event.target.value)}><option value="gentle">Gentle</option><option value="executive">Executive</option><option value="direct">Direct</option></select></label><label>App name<input value={form.app_name} onChange={(event) => update('app_name', event.target.value)} placeholder={`${form.preferred_name || 'Your Name'} OS`} /></label><label>Theme<select value={form.theme} onChange={(event) => update('theme', event.target.value)}><option value="default">Default</option><option value="midnight">Midnight</option><option value="soft">Soft</option></select></label><label>Accent color<input type="color" value={form.accent_color} onChange={(event) => update('accent_color', event.target.value)} /></label><label>Font style<select value={form.font_style} onChange={(event) => update('font_style', event.target.value)}><option value="default">Default</option><option value="editorial">Editorial</option><option value="system">System</option></select></label><label>Density<select value={form.density} onChange={(event) => update('density', event.target.value)}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label><label>Motion<select value={form.motion} onChange={(event) => update('motion', event.target.value)}><option value="full">Full</option><option value="reduced">Reduced</option></select></label></div>}

        {error && <p className="system-notice">{error}</p>}
        <div className="onboarding-actions">{step > 0 && <button className="subtle-button" onClick={() => setStep((value) => value - 1)}>Back</button>}<button className="primary-button" disabled={loading || (step === 0 && (!form.preferred_name || form.one_year_vision.length < 10)) || (step === 1 && !form.goals.trim()) || (step === 3 && !form.work_style.trim())} onClick={() => step === steps.length - 1 ? complete() : setStep((value) => value + 1)}>{loading ? 'Building your OS…' : step === steps.length - 1 ? 'Create my OS' : 'Continue'}</button></div>
      </section>
    </main>
  );
}
