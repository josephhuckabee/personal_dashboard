'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [preferredName, setPreferredName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { data: { preferred_name: preferredName }, emailRedirectTo: `${window.location.origin}/auth/callback` } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setMessage(result.error.message);
    else if (mode === 'signup' && !result.data.session) setMessage('Check your email to confirm your account, then sign in.');
    else window.location.href = '/';
    setLoading(false);
  }

  return (
    <main className="auth-shell">
      <section className="card auth-card">
        <span className="brand-mark">Y</span>
        <p className="eyebrow">You OS</p>
        <h1>{mode === 'signup' ? 'Build your operating system' : 'Enter your operating system'}<span className="title-dot">.</span></h1>
        <p className="page-copy">Your journal, finances, health, travel, and memories remain private and user-scoped.</p>
        <div className="accountability-options"><button className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>Sign in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Create account</button></div>
        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && <label>Preferred name<input value={preferredName} onChange={(event) => setPreferredName(event.target.value)} required /></label>}
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <button className="primary-button" disabled={loading}>{loading ? 'Working…' : mode === 'signup' ? 'Create You OS' : 'Sign in'}</button>
        </form>
        {message && <p className="system-notice">{message}</p>}
      </section>
    </main>
  );
}
