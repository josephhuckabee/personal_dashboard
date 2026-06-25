'use client';

import { useMemo, useState } from 'react';

const steps = ['Identity', 'Health', 'Direction', 'Travel', 'Career', 'Preferences'];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    preferred_name: '', age: '', location: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', one_year_vision: '', year_success: '', biggest_concerns: '', biggest_opportunities: '',
    ideal_life_90_days: '', ideal_life_1_year: '', ideal_life_2_years: '', ideal_life_5_years: '', ideal_life_10_years: '',
    goals: '', habits: '', current_cash: '', monthly_income: '', currency: 'USD', travel_plans: '',
    height: '', weight: '', goal_weight: '', gender: '', activity_level: '', sleep_target: '', medications: '', supplements: '', dietary_restrictions: '', diet_style: 'Custom', weight_unit: 'lb', average_sleep_hours: '', workouts_per_week: '', work_style: '',
    countries_planned: '', passport_country: '', travel_style: '', budget_level: '', work_while_traveling: 'false', pet_sitting: 'false', digital_nomad: 'false',
    current_programs: '', degrees: '', certifications: '', current_career: '', desired_career: '', skills_being_developed: '',
    chief_of_staff_tone: 'executive', app_name: '', theme: 'default', accent_color: '#a7f3d0', font_style: 'default', density: 'comfortable',
  });
  const update = (name: string, value: string) => setForm((current) => ({ ...current, [name]: value }));
  const progress = useMemo(() => (step + 1) / steps.length * 100, [step]);
  const validateStep = (stepToValidate: number) => {
    if (stepToValidate === 0) {
      if (!form.preferred_name.trim()) return { valid: false, message: 'Preferred name is required.' };
      if (!form.timezone.trim()) return { valid: false, message: 'Timezone is required.' };
    }
    if (stepToValidate === 2 && form.one_year_vision.trim().length < 10) return { valid: false, message: 'What you are trying to achieve this year is required.' };
    if (stepToValidate === 5) {
      if (!form.currency.trim()) return { valid: false, message: 'Currency is required.' };
      if (Number(form.current_cash || 0) < 0) return { valid: false, message: 'Current cash cannot be negative.' };
      if (Number(form.monthly_income || 0) < 0) return { valid: false, message: 'Monthly income cannot be negative.' };
    }
    if (stepToValidate === 5 && !form.work_style.trim()) return { valid: false, message: 'Work style is required.' };
    return { valid: true, message: '' };
  };

  function continueToNextStep() {
    const validation = validateStep(step);
    const nextStep = Math.min(step + 1, steps.length - 1);
    console.info('Onboarding Continue clicked', { currentStep: step, validation, formData: form, nextStepTarget: nextStep });
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    setError('');
    setStep(nextStep);
  }

  function goBack() {
    const nextStep = Math.max(step - 1, 0);
    console.info('Onboarding Back clicked', { currentStep: step, nextStepTarget: nextStep });
    setError('');
    setStep(nextStep);
  }

  async function complete() {
    const validation = validateStep(step);
    console.info('Onboarding Create my OS clicked', { currentStep: step, validation, formData: form, nextStepTarget: step });
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
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
      preferred_name: form.preferred_name, age: form.age ? Number(form.age) : null, location: form.location, timezone: form.timezone, one_year_vision: form.one_year_vision,
      year_success: form.year_success, biggest_concerns: form.biggest_concerns, biggest_opportunities: form.biggest_opportunities,
      ideal_life_90_days: form.ideal_life_90_days, ideal_life_1_year: form.ideal_life_1_year, ideal_life_2_years: form.ideal_life_2_years, ideal_life_5_years: form.ideal_life_5_years, ideal_life_10_years: form.ideal_life_10_years,
      goals: goals.length ? goals : [{ title: form.year_success || form.one_year_vision, category: 'Life', target_date: null }], habits,
      finances: { current_cash: Number(form.current_cash || 0), monthly_income: Number(form.monthly_income || 0), currency: form.currency.toUpperCase() },
      travel_plans,
      travel_profile: { countries_planned: form.countries_planned, passport_country: form.passport_country, travel_style: form.travel_style, budget_level: form.budget_level, work_while_traveling: form.work_while_traveling === 'true', pet_sitting: form.pet_sitting === 'true', digital_nomad: form.digital_nomad === 'true' },
      education_profile: { current_programs: form.current_programs, degrees: form.degrees, certifications: form.certifications, current_career: form.current_career, desired_career: form.desired_career, skills_being_developed: form.skills_being_developed },
      health_baseline: { height: form.height ? Number(form.height) : null, weight: form.weight ? Number(form.weight) : null, goal_weight: form.goal_weight ? Number(form.goal_weight) : null, gender: form.gender, activity_level: form.activity_level, sleep_target: form.sleep_target ? Number(form.sleep_target) : null, medications: form.medications, supplements: form.supplements, dietary_restrictions: form.dietary_restrictions, diet_style: form.diet_style, weight_unit: form.weight_unit, average_sleep_hours: form.average_sleep_hours ? Number(form.average_sleep_hours) : null, workouts_per_week: form.workouts_per_week ? Number(form.workouts_per_week) : null },
      work_style: form.work_style, chief_of_staff_tone: form.chief_of_staff_tone,
      design: { app_name: form.app_name || `${form.preferred_name} OS`, theme: form.theme, accent_color: form.accent_color, font_style: form.font_style, density: form.density },
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

        {step === 0 && <div className="onboarding-fields"><label>Preferred name<input value={form.preferred_name} onChange={(event) => update('preferred_name', event.target.value)} placeholder="What should your OS call you?" required /></label><label>Age<input type="number" min="0" max="130" value={form.age} onChange={(event) => update('age', event.target.value)} /></label><label>Current location<input value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="City, country" /></label><label>Timezone<input value={form.timezone} onChange={(event) => update('timezone', event.target.value)} required /></label></div>}

        {step === 1 && <div className="onboarding-fields"><label>Height<input type="number" min="0" step=".1" value={form.height} onChange={(event) => update('height', event.target.value)} /></label><label>Current weight<input type="number" min="0" step=".1" value={form.weight} onChange={(event) => update('weight', event.target.value)} /></label><label>Goal weight<input type="number" min="0" step=".1" value={form.goal_weight} onChange={(event) => update('goal_weight', event.target.value)} /></label><label>Gender<input value={form.gender} onChange={(event) => update('gender', event.target.value)} /></label><label>Activity level<select value={form.activity_level} onChange={(event) => update('activity_level', event.target.value)}><option value="">Select</option><option>Sedentary</option><option>Light</option><option>Moderate</option><option>High</option><option>Athlete</option></select></label><label>Sleep target<input type="number" min="0" max="24" step=".25" value={form.sleep_target} onChange={(event) => update('sleep_target', event.target.value)} /></label><label className="full-field">Medications<textarea value={form.medications} onChange={(event) => update('medications', event.target.value)} placeholder="Name, dosage, frequency" /></label><label className="full-field">Supplements<textarea value={form.supplements} onChange={(event) => update('supplements', event.target.value)} placeholder="Name, dosage, purpose" /></label><label>Diet style<select value={form.diet_style} onChange={(event) => update('diet_style', event.target.value)}><option>High Protein</option><option>Mediterranean</option><option>Vegetarian</option><option>Vegan</option><option>Keto</option><option>Custom</option></select></label><label>Dietary restrictions<input value={form.dietary_restrictions} onChange={(event) => update('dietary_restrictions', event.target.value)} /></label></div>}

        {step === 2 && <div className="onboarding-fields"><label className="full-field">What are you trying to achieve this year?<textarea value={form.one_year_vision} onChange={(event) => update('one_year_vision', event.target.value)} required /></label><label className="full-field">What would make this year successful?<textarea value={form.year_success} onChange={(event) => update('year_success', event.target.value)} /></label><label className="full-field">Biggest concerns<textarea value={form.biggest_concerns} onChange={(event) => update('biggest_concerns', event.target.value)} /></label><label className="full-field">Biggest opportunities<textarea value={form.biggest_opportunities} onChange={(event) => update('biggest_opportunities', event.target.value)} /></label><label>Ideal life in 90 days<textarea value={form.ideal_life_90_days} onChange={(event) => update('ideal_life_90_days', event.target.value)} /></label><label>Ideal life in 1 year<textarea value={form.ideal_life_1_year} onChange={(event) => update('ideal_life_1_year', event.target.value)} /></label><label>Ideal life in 2 years<textarea value={form.ideal_life_2_years} onChange={(event) => update('ideal_life_2_years', event.target.value)} /></label><label>Ideal life in 5 years<textarea value={form.ideal_life_5_years} onChange={(event) => update('ideal_life_5_years', event.target.value)} /></label><label className="full-field">Ideal life in 10 years<textarea value={form.ideal_life_10_years} onChange={(event) => update('ideal_life_10_years', event.target.value)} /></label></div>}

        {step === 3 && <div className="onboarding-fields"><label className="full-field">Countries planned<textarea value={form.countries_planned} onChange={(event) => update('countries_planned', event.target.value)} /></label><label>Passport country<input value={form.passport_country} onChange={(event) => update('passport_country', event.target.value)} /></label><label>Travel style<input value={form.travel_style} onChange={(event) => update('travel_style', event.target.value)} placeholder="slow travel, city hopping, pet sits..." /></label><label>Budget level<input value={form.budget_level} onChange={(event) => update('budget_level', event.target.value)} /></label><label>Work while traveling?<select value={form.work_while_traveling} onChange={(event) => update('work_while_traveling', event.target.value)}><option value="false">No</option><option value="true">Yes</option></select></label><label>Pet sitting?<select value={form.pet_sitting} onChange={(event) => update('pet_sitting', event.target.value)}><option value="false">No</option><option value="true">Yes</option></select></label><label>Digital nomad?<select value={form.digital_nomad} onChange={(event) => update('digital_nomad', event.target.value)}><option value="false">No</option><option value="true">Yes</option></select></label><label className="full-field">Known travel plans<textarea value={form.travel_plans} onChange={(event) => update('travel_plans', event.target.value)} placeholder="One per line: Title | City | Country | Arrival | Departure | Budget" /></label></div>}

        {step === 4 && <div className="onboarding-fields"><label className="full-field">Current programs<textarea value={form.current_programs} onChange={(event) => update('current_programs', event.target.value)} /></label><label>Degrees<input value={form.degrees} onChange={(event) => update('degrees', event.target.value)} /></label><label>Certifications<input value={form.certifications} onChange={(event) => update('certifications', event.target.value)} /></label><label>Current career<input value={form.current_career} onChange={(event) => update('current_career', event.target.value)} /></label><label>Desired career<input value={form.desired_career} onChange={(event) => update('desired_career', event.target.value)} /></label><label className="full-field">Skills being developed<textarea value={form.skills_being_developed} onChange={(event) => update('skills_being_developed', event.target.value)} /></label><label className="full-field">Current habits<input value={form.habits} onChange={(event) => update('habits', event.target.value)} placeholder="Meditation, coding, lifting, running" /></label></div>}

        {step === 5 && <div className="onboarding-fields"><label>Current cash<input type="number" min="0" step=".01" value={form.current_cash} onChange={(event) => update('current_cash', event.target.value)} required /></label><label>Monthly income<input type="number" min="0" step=".01" value={form.monthly_income} onChange={(event) => update('monthly_income', event.target.value)} /></label><label>Currency<input maxLength={3} value={form.currency} onChange={(event) => update('currency', event.target.value)} required /></label><label>Weight unit<select value={form.weight_unit} onChange={(event) => update('weight_unit', event.target.value)}><option value="lb">lb</option><option value="kg">kg</option></select></label><label>Average sleep<input type="number" min="0" max="24" step=".25" value={form.average_sleep_hours} onChange={(event) => update('average_sleep_hours', event.target.value)} /></label><label>Workouts per week<input type="number" min="0" max="14" value={form.workouts_per_week} onChange={(event) => update('workouts_per_week', event.target.value)} /></label><label className="full-field">Work style<textarea value={form.work_style} onChange={(event) => update('work_style', event.target.value)} placeholder="When do you focus best? How do you prefer to plan and work?" required /></label><label>Chief of Staff tone<select value={form.chief_of_staff_tone} onChange={(event) => update('chief_of_staff_tone', event.target.value)}><option value="gentle">Gentle</option><option value="executive">Executive</option><option value="direct">Direct</option></select></label><label>App name<input value={form.app_name} onChange={(event) => update('app_name', event.target.value)} placeholder={`${form.preferred_name || 'Your Name'} OS`} /></label><label>Theme<select value={form.theme} onChange={(event) => update('theme', event.target.value)}><option value="default">Default</option><option value="midnight">Midnight</option><option value="soft">Soft</option></select></label><label>Accent color<input type="color" value={form.accent_color} onChange={(event) => update('accent_color', event.target.value)} /></label><label>Font style<select value={form.font_style} onChange={(event) => update('font_style', event.target.value)}><option value="default">Default</option><option value="editorial">Editorial</option><option value="system">System</option></select></label><label>Density<select value={form.density} onChange={(event) => update('density', event.target.value)}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label></div>}

        {error && <p className="system-notice">{error}</p>}
        <div className="onboarding-actions">{step > 0 && <button type="button" className="subtle-button" onClick={goBack}>Back</button>}<button type="button" className="primary-button" disabled={loading} onClick={() => step === steps.length - 1 ? complete() : continueToNextStep()}>{loading ? 'Building your OS…' : step === steps.length - 1 ? 'Create my OS' : 'Continue'}</button></div>
      </section>
    </main>
  );
}
