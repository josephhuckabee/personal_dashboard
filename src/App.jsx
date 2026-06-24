import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Activity,
  Apple,
  BadgeDollarSign,
  BedDouble,
  Bell,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDollarSign,
  Clapperboard,
  Clock3,
  Code2,
  Dumbbell,
  FileCheck2,
  Flame,
  Flower2,
  Footprints,
  Globe2,
  GraduationCap,
  Heart,
  HeartPulse,
  Hotel,
  Lightbulb,
  LayoutDashboard,
  Luggage,
  MapPin,
  MessageSquareText,
  Milestone,
  Moon,
  MoreHorizontal,
  NotebookPen,
  Plane,
  Play,
  Plus,
  Repeat2,
  ReceiptText,
  Radar,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  Sparkles,
  Settings,
  ShieldAlert,
  Sun,
  Target,
  TrendingUp,
  Utensils,
  Upload,
  Users,
  Wallet,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
  { id: 'goals', label: 'Objectives', icon: Target },
  { id: 'habits', label: 'Habits', icon: Repeat2 },
  { id: 'money', label: 'Finance', icon: Wallet },
  { id: 'mood', label: 'Health', icon: HeartPulse },
  { id: 'travel', label: 'Travel HQ', icon: Plane },
  { id: 'content', label: 'Content Studio', icon: Clapperboard },
  { id: 'relationships', label: 'Relationships', icon: Users },
  { id: 'insights', label: 'Insights', icon: Radar },
  { id: 'assistant', label: 'Chief of Staff', icon: Sparkles },
  { id: 'timeline', label: 'Timeline', icon: Milestone },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function toast(message, tone = 'success') {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('youos:toast', { detail: { message, tone } }));
}

function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function ToastCenter() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const handler = (event) => {
      const id = `${Date.now()}-${Math.random()}`;
      setItems((current) => [...current, { id, ...event.detail }]);
      window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3200);
    };
    window.addEventListener('youos:toast', handler);
    return () => window.removeEventListener('youos:toast', handler);
  }, []);
  return <div className="toast-stack" aria-live="polite">{items.map((item) => <div className={`toast toast-${item.tone}`} key={item.id}>{item.tone === 'error' ? <ShieldAlert size={15} /> : <Check size={15} />}{item.message}</div>)}</div>;
}

function Card({ children, className = '', tone = '' }) {
  return <section className={`card ${tone ? `card-${tone}` : ''} ${className}`}>{children}</section>;
}

function PageHeader({ eyebrow, title, copy, action }) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {copy && <p className="page-copy">{copy}</p>}
      </div>
      {action}
    </header>
  );
}

function SectionTitle({ title, meta, action }) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {meta && <p>{meta}</p>}
      </div>
      {action}
    </div>
  );
}

function Pill({ children, tone = 'neutral' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function ProgressBar({ value, tone = 'green' }) {
  return <div className="progress-track"><span className={`progress-fill fill-${tone}`} style={{ width: `${value}%` }} /></div>;
}

function MetricCard({ label, value, detail, icon: Icon, trend, tone = '' }) {
  return (
    <Card className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon size={18} /></div>
      <p className="metric-label">{label}</p>
      <strong className="metric-value">{value}</strong>
      <p className={trend ? 'metric-trend' : 'metric-detail'}>{trend && <TrendingUp size={13} />}{trend || detail}</p>
    </Card>
  );
}

function Donut({ value, label, sublabel, tone = 'mint' }) {
  return (
    <div className={`donut donut-${tone}`} style={{ '--value': `${value * 3.6}deg` }}>
      <div className="donut-inner"><strong>{label}</strong><span>{sublabel}</span></div>
    </div>
  );
}

function MiniBars({ values, tone = 'mint' }) {
  return <div className={`mini-bars bars-${tone}`}>{values.map((value, index) => <span key={index} style={{ height: `${value}%` }} />)}</div>;
}

function Sidebar({ page, setPage, profile }) {
  const chapterDay = profile?.chapter_started_at ? Math.max(1, Math.floor((Date.now() - new Date(profile.chapter_started_at).getTime()) / 86400000)) : null;
  const displayName = profile?.display_name || 'You';
  const appName = profile?.preferences?.app_name || (profile?.display_name ? `${profile.display_name} OS` : 'You OS');
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => setPage('dashboard')}>
        <span className="brand-mark">{displayName.slice(0, 1).toUpperCase()}</span>
        <span><strong>{appName}</strong><small>Life, by design</small></span>
      </button>
      <nav className="side-nav" aria-label="Main navigation">
        <span className="nav-label">Workspace</span>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>
            <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{page === id && <i />}
          </button>
        ))}
      </nav>
      <div className="journey-card">
        <div className="journey-art"><Globe2 size={34} strokeWidth={1.2} /></div>
        <p>Current chapter</p><strong>{[profile?.current_city, profile?.current_country].filter(Boolean).join(', ') || 'Not configured'}</strong>
        <span>{chapterDay ? `Day ${chapterDay}` : 'Start date not set'} · Year of Reinvention</span>
        <ProgressBar value={chapterDay ? Math.min(100, chapterDay / 365 * 100) : 0} tone="blue" />
      </div>
      <div className="profile-row">
        <span className="avatar">{displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>
        <span><strong>{displayName}</strong><small>CEO · Year of Reinvention</small></span>
        <MoreHorizontal size={18} />
      </div>
    </aside>
  );
}

function Topbar({ page, appName }) {
  const current = navItems.find((item) => item.id === page);
  const today = new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <div className="topbar">
      <div className="mobile-brand"><span className="brand-mark">Y</span><strong>{appName}</strong></div>
      <div className="breadcrumb"><span>{appName}</span><ChevronRight size={14} /><strong>{current?.label}</strong></div>
      <div className="top-actions">
        <button className="icon-button" aria-label="Search"><Search size={18} /></button>
        <button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button>
        <span className="date-chip"><CalendarDays size={15} /> {today}</span>
      </div>
    </div>
  );
}

function BottomNav({ page, setPage, onMore }) {
  const visible = navItems.slice(0, 4);
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {visible.map(({ id, label, icon: Icon }) => <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}><Icon size={19} /><span>{label}</span></button>)}
      <button className={['mood', 'travel', 'content', 'assistant'].includes(page) ? 'active' : ''} onClick={onMore}><Sparkles size={19} /><span>More</span></button>
    </nav>
  );
}

function MobileMoreMenu({ page, setPage, onClose, appName }) {
  return (
    <div className="mobile-more-backdrop" onClick={onClose}>
      <div className="mobile-more-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="mobile-more-title">
          <span><strong>Explore {appName}</strong><small>Every part of your operating system</small></span>
          <button onClick={onClose} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="mobile-more-grid">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => { setPage(id); onClose(); }}><Icon size={20} /><span>{label}</span></button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarPreview() {
  const [range, setRange] = useState(7);
  const [events, setEvents] = useState([]);
  useEffect(() => { fetch('/api/calendar/events').then((response) => response.json()).then((result) => setEvents(result.events || [])).catch(() => setEvents([])); }, []);
  const days = Array.from({ length: range }, (_, index) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() + index); return date; });
  const eventTone = { education: 'violet', income: 'amber', fitness: 'mint', content: 'blue', reflection: 'rose', travel: 'blue' };
  return (
    <Card className="calendar-card span-8">
      <SectionTitle title="Calendar" meta="Your OS · user-scoped events" />
      <div className="range-row" aria-label="Calendar range">
        {[5, 7, 10, 14, 21, 30].map((value) => <button key={value} className={range === value ? 'active' : ''} onClick={() => setRange(value)}>{value}d</button>)}
      </div>
      <div className="week-calendar" style={{ gridTemplateColumns: `repeat(${range}, minmax(92px, 1fr))` }}>
        {days.map((day, index) => {
          const dayEvents = events.filter((event) => new Date(event.start).toDateString() === day.toDateString());
          return (
          <div className={`calendar-column ${index === 0 ? 'today' : ''}`} key={day.toISOString()}>
            <span>{day.toLocaleDateString([], { weekday: 'short' })}</span><strong>{day.getDate()}</strong>
            <div className="calendar-slots">
              {dayEvents.map((event) => <i className={`event ${eventTone[event.category] || 'blue'}`} key={event.id}>{event.title}<br />{new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</i>)}
            </div>
          </div>
        ); })}
      </div>
      <p className="integration-note"><Apple size={14} /> Subscribe once to see new web and SMS plans across your Apple devices.</p>
    </Card>
  );
}

function Dashboard({ habits, toggleHabit }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/dashboard').then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error); return result; }).then(setData).catch((reason) => setError(reason.message)); }, []);
  const finance = data?.finance;
  const objectives = data?.objectives || [];
  const briefing = data?.briefing;
  const decision = data?.decision;
  const localSummary = data?.localSummary;
  const profile = data?.profile;
  const risks = decision?.risks || briefing?.current_risks || [...(localSummary?.overdue_tasks || []).map((item) => ({ title: item.title, reason: `Task was due ${new Date(item.due_at).toLocaleDateString()}.`, severity: 'high' })), ...objectives.filter((item) => item.calculated_status !== 'healthy' && item.calculated_status !== 'completed').map((item) => ({ title: item.title, reason: item.calculated_status === 'at_risk' ? 'Progress or recent activity is behind the required pace.' : 'This objective needs recent execution evidence.', severity: item.calculated_status === 'at_risk' ? 'high' : 'medium' }))];
  const opportunities = decision?.opportunities || briefing?.opportunities || [];
  const todayPlan = decision?.top_priorities?.map((item) => ({ task: item.title, ...item })) || briefing?.today_plan || (data?.tasks || []).filter((item) => item.status !== 'completed').slice(0, 3).map((item) => ({ task: item.title, priority: item.priority }));
  const dashboardMoney = (value = 0) => `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const currentTravel = (data?.travel || []).find((item) => item.status === 'active') || data?.travel?.[0];
  const currentCity = profile?.current_city || currentTravel?.city || 'Not set';
  const dayAbroad = profile?.chapter_started_at ? Math.max(1, Math.floor((Date.now() - new Date(profile.chapter_started_at).getTime()) / 86400000)) : null;
  const upcomingDeadlines = [...objectives.filter((item) => item.deadline).map((item) => ({ title: item.title, date: item.deadline })), ...(data?.tasks || []).filter((item) => item.due_at && item.status !== 'completed').map((item) => ({ title: item.title, date: item.due_at })), ...(data?.travel || []).filter((item) => item.visa_deadline).map((item) => ({ title: `${item.country || item.title} visa`, date: item.visa_deadline }))].filter((item) => new Date(item.date).getTime() >= Date.now()).sort((a, b) => new Date(a.date) - new Date(b.date));
  return (
    <>
      <PageHeader eyebrow={`${new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} · ${currentCity}`} title={<>Command Center<span className="title-dot">.</span></>} copy={`Year of Reinvention${dayAbroad ? ` · Day ${dayAbroad}` : ''}. Are you becoming the person you said you wanted to become?`} action={<Pill tone={error ? 'amber' : 'green'}><Activity size={12} /> {error ? 'Data unavailable' : 'Systems online'}</Pill>} />
      {error && <div className="system-notice"><ShieldAlert size={15} /> {error}</div>}
      <Card className="morning-brief-card">
        <div className="brief-intro"><Pill tone="blue">Morning brief · {currentCity}</Pill><h2>Good morning, {profile?.display_name || 'there'}.</h2><p>{briefing?.summary || (data ? 'Generate a Chief of Staff briefing to identify current risks, opportunities, and today’s highest-return plan.' : 'Loading your current operating picture…')}</p><div className="brief-status"><span><small>Overall status</small><strong>{risks.some((item) => item.severity === 'high') ? 'ATTENTION' : 'ON TRACK'}</strong></span><span><small>Day abroad</small><strong>{dayAbroad || '—'}</strong></span><span><small>Open tasks</small><strong>{(data?.tasks || []).filter((item) => item.status !== 'completed').length}</strong></span></div></div>
        <div className="life-score-ring"><Donut value={data?.executionReadiness || 0} label={data?.executionReadiness ?? '—'} sublabel="readiness" /><span><TrendingUp size={13} /> Live score</span></div>
        <div className="roi-actions"><p>Today’s highest ROI actions</p>{todayPlan.length ? todayPlan.slice(0, 3).map((item, index) => <div key={`${item.task}-${index}`}><b>{String(index + 1).padStart(2, '0')}</b><span><strong>{item.task}</strong><small>{item.priority || 'medium'} priority</small></span><Circle size={17} /></div>) : <p className="plan-empty">No open plan. Generate a briefing or add a task.</p>}</div>
      </Card>
      <div className="metric-grid">
        <MetricCard label="Current location" value={currentCity} detail={profile?.current_country || currentTravel?.country || 'Location not set'} icon={MapPin} tone="blue" />
        <MetricCard label="Objective health" value={`${objectives.filter((item) => item.calculated_status === 'healthy' || item.calculated_status === 'completed').length} / ${objectives.length}`} detail={upcomingDeadlines[0] ? `Next: ${upcomingDeadlines[0].title} · ${new Date(upcomingDeadlines[0].date).toLocaleDateString()}` : `${risks.length} require attention`} icon={Target} tone="violet" />
        <MetricCard label="Daily execution" value={data ? `${data.liveMetrics?.habitsCompletedToday || 0} / ${data.liveMetrics?.habitsDueToday || 0}` : '—'} detail={data ? `${data.liveMetrics?.tasksDueToday || 0} tasks due · ${data.liveMetrics?.overdueTasks || 0} overdue` : 'Habits and tasks'} icon={Activity} tone="green" />
        <MetricCard label="Travel runway" value={finance?.runwayMonths != null ? `${finance.runwayMonths.toFixed(1)} mo` : '—'} detail="Cash ÷ trailing 30-day burn" icon={Wallet} tone="amber" />
      </div>

      <div className="dashboard-grid">
        <Card className="executive-signal-card span-4"><SectionTitle title="Current risks" meta="Requires executive attention" action={<ShieldAlert size={19} />} /><div className="signal-list">{risks.length ? risks.slice(0, 3).map((item) => <div className={item.severity === 'high' ? 'risk' : ''} key={item.title}><b>{item.title}</b><span>{item.reason}</span><Pill tone={item.severity === 'high' ? 'amber' : 'neutral'}>{item.severity || 'watch'}</Pill></div>) : <p className="plan-empty">No risks identified from current data.</p>}</div></Card>
        <Card className="executive-signal-card span-4"><SectionTitle title="Opportunities" meta="High-leverage openings" action={<Lightbulb size={19} />} /><div className="signal-list">{opportunities.length ? opportunities.slice(0, 3).map((item) => <div key={item.title}><b>{item.title}</b><span>{item.reason}</span><Pill tone="blue">{item.category || 'Opportunity'}</Pill></div>) : <p className="plan-empty">Prioritize your day to identify opportunities.</p>}</div></Card>
        <Card className="runway-card span-4"><SectionTitle title="Finance posture" meta="Current cash + runway" /><div className="runway-content"><Donut value={Math.min(100, (finance?.runwayMonths || 0) / 12 * 100)} label={finance?.runwayMonths != null ? finance.runwayMonths.toFixed(1) : '—'} sublabel="months" /><div><Pill tone={(finance?.runwayMonths || 0) >= 6 ? 'green' : 'amber'}>{finance?.runwayMonths == null ? 'Needs data' : finance.runwayMonths >= 6 ? 'Sustainable' : 'Protect runway'}</Pill><strong>{finance ? dashboardMoney(finance.currentCash) : '—'}</strong><span>current cash</span></div></div><div className="runway-stats"><span><small>Monthly burn</small><b>{finance ? dashboardMoney(finance.monthlyBurn) : '—'}</b></span><span><small>Income · 30d</small><b>{finance ? dashboardMoney(finance.monthlyIncome) : '—'}</b></span></div></Card>

        <CalendarPreview />

        <Card className="habits-preview span-4">
          <SectionTitle title="Transformation inputs" meta="Habits powering objectives" action={<Flame size={20} className="flame" />} />
          <div className="habit-mini-list">
            {habits.slice(0, 5).map((habit) => { const Icon = habit.icon; return <button key={habit.id} onClick={() => toggleHabit(habit.id)}><span className={`habit-check ${habit.doneToday ? 'done' : ''}`}>{habit.doneToday ? <Check size={13} /> : <Icon size={15} />}</span><span><strong>{habit.name}</strong><small>{habit.streak} day streak</small></span><ProgressBar value={habit.rate} tone={habit.rate > 80 ? 'green' : 'violet'} /></button>; })}
          </div>
        </Card>

        <Card className="assistant-card span-12" tone="assistant">
          <div className="assistant-icon"><WandSparkles size={24} /></div>
          <div className="assistant-copy"><Pill tone="violet">Chief of Staff note</Pill><h2>{decision?.chief_of_staff_note || briefing?.chief_of_staff_note || localSummary?.today_best_focus || 'Add a task or habit to establish today’s focus.'}</h2><p>{decision ? `Focus: ${decision.recommended_focus} Avoid: ${decision.recommended_avoidance}` : `Focus: ${localSummary?.today_best_focus || 'Not enough data.'} Avoid: ${localSummary?.recommended_avoidance || 'Not enough data.'}`}</p><div className="assistant-actions"><button className="primary-button" onClick={() => fetch('/api/ai/prioritize', { method: 'POST' }).then(async (response) => { if (!response.ok) throw new Error((await response.json()).error); window.location.reload(); }).catch((error) => setError(error.message))}>Prioritize My Day</button></div></div>
          <div className="focus-score"><span>Execution readiness</span><strong>{decision?.execution_readiness_score ?? data?.executionReadiness ?? '—'}</strong><small>{(decision?.execution_readiness_score ?? data?.executionReadiness) >= 75 ? 'High-leverage day' : data ? 'Protect the basics' : 'Loading'}</small></div>
        </Card>
      </div>
    </>
  );
}

function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [items, setItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [adding, setAdding] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); return Promise.all([fetch('/api/goals').then((response) => response.json()), fetch('/api/objectives').then((response) => response.json()), fetch('/api/tasks').then((response) => response.json())]).then(([goalResult, objectiveResult, taskResult]) => { if (goalResult.error || objectiveResult.error || taskResult.error) throw new Error(goalResult.error || objectiveResult.error || taskResult.error); setGoals(goalResult.data || []); setItems(objectiveResult.data || []); setTasks(taskResult.data || []); }).finally(() => setLoading(false)); };
  useEffect(() => { load().catch((error) => setNotice(error.message)); }, []);
  const createObjective = async (event) => { event.preventDefault(); const form = event.currentTarget; const body = Object.fromEntries(new FormData(form)); body.progress = Number(body.progress || 0); if (!body.deadline) delete body.deadline; if (adding === 'goal' && body.deadline) { body.target_date = body.deadline; delete body.deadline; } const response = await fetch(`/api/${adding === 'goal' ? 'goals' : 'objectives'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); if (!response.ok) { setNotice(result.error); toast('Something went wrong', 'error'); return; } const label = adding === 'goal' ? 'Goal created' : 'Objective created'; form.reset(); setAdding(''); setNotice(label); toast(label); load(); };
  const editRecord = async (record, entity) => { const title = window.prompt(`${entity === 'goals' ? 'Goal' : 'Objective'} title`, record.title); if (!title) return; const progress = Number(window.prompt('Progress (0–100)', record.progress)); const response = await fetch(`/api/${entity}/${record.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, progress }) }); const result = await response.json(); setNotice(response.ok ? 'Progress updated.' : result.error); if (response.ok) load(); };
  const deleteRecord = async (record, entity) => { if (!window.confirm(`Delete “${record.title}”?`)) return; const response = await fetch(`/api/${entity}/${record.id}`, { method: 'DELETE' }); setNotice(response.ok ? 'Record deleted.' : 'Could not delete record.'); if (response.ok) load(); };
  const createTask = async (event) => { event.preventDefault(); const form = event.currentTarget; const body = Object.fromEntries(new FormData(form)); if (!body.objective_id) delete body.objective_id; if (!body.goal_id) delete body.goal_id; if (!body.due_at) delete body.due_at; else body.due_at = new Date(body.due_at).toISOString(); if (!body.estimated_minutes) delete body.estimated_minutes; const response = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); setNotice(response.ok ? 'Task created.' : result.error); toast(response.ok ? 'Task created' : 'Something went wrong', response.ok ? 'success' : 'error'); if (response.ok) { form.reset(); setAdding(''); load(); } };
  const toggleTask = async (task) => { const response = await fetch(`/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: task.status === 'completed' ? 'todo' : 'completed' }) }); toast(response.ok ? (task.status === 'completed' ? 'Task reopened' : 'Task completed') : 'Something went wrong', response.ok ? 'success' : 'error'); if (response.ok) load(); };
  const editTask = async (task) => { const title = window.prompt('Task title', task.title); if (!title) return; const priority = window.prompt('Priority: low, medium, or high', task.priority || 'medium'); if (!['low', 'medium', 'high'].includes(priority)) return; const due = window.prompt('Due date (YYYY-MM-DD), blank for none', task.due_at ? String(task.due_at).slice(0, 10) : ''); const response = await fetch(`/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, priority, due_at: due ? new Date(`${due}T23:59:00`).toISOString() : null }) }); toast(response.ok ? 'Task updated' : 'Something went wrong', response.ok ? 'success' : 'error'); if (response.ok) load(); };
  const weightedProgress = items.length ? Math.round(items.reduce((sum, item) => sum + Number(item.progress || 0), 0) / items.length) : 0;
  const iconFor = (category = '') => category.toLowerCase().includes('education') ? GraduationCap : category.toLowerCase().includes('health') ? Dumbbell : category.toLowerCase().includes('travel') ? Globe2 : category.toLowerCase().includes('career') || category.toLowerCase().includes('income') ? BriefcaseBusiness : Target;
  return (
    <><PageHeader eyebrow="Transformation portfolio" title={<>Goals & objectives<span className="title-dot">.</span></>} copy="Goals define direction. Objectives, tasks, habits, deadlines, and activity determine execution health." action={<div className="assistant-actions"><button className="text-button" onClick={() => setAdding('task')}><Plus size={17} /> Task</button><button className="subtle-button" onClick={() => setAdding('goal')}><Plus size={17} /> Goal</button><button className="primary-button" onClick={() => setAdding('objective')}><Plus size={17} /> Objective</button></div>} />
    {notice && <div className="system-notice">{notice}</div>}
    {loading && <div className="system-notice"><RefreshCw className="spin" size={15} /> Loading goals, objectives, and tasks…</div>}
    {adding && <Card>{adding === 'task' ? <form className="studio-add-form compact-form" onSubmit={createTask}><input name="title" placeholder="Task title" required /><select name="goal_id"><option value="">No goal</option>{goals.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><select name="objective_id"><option value="">No objective</option>{items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><select name="priority"><option value="medium">Medium priority</option><option value="high">High priority</option><option value="low">Low priority</option></select><input name="due_at" type="datetime-local" /><input name="estimated_minutes" type="number" min="1" placeholder="Minutes" /><button className="primary-button">Create task</button></form> : <form className="studio-add-form" onSubmit={createObjective}><input name="title" placeholder={`${adding === 'goal' ? 'Goal' : 'Objective'} title`} required /><input name="category" placeholder="Category" required /><input name="progress" type="number" min="0" max="100" defaultValue="0" /><input name="deadline" type="date" /><textarea name="description" placeholder="What does success mean?" /><button className="primary-button">Create {adding}</button></form>}</Card>}
    <div className="summary-strip"><span><strong>{goals.length}</strong> life goals</span><span><strong>{items.length}</strong> objectives</span><span><strong>{weightedProgress}%</strong> objective progress</span><span><strong>{items.filter((item) => item.calculated_status === 'at_risk').length}</strong> at risk</span></div>
    <div className="goals-grid objective-grid">{goals.length ? goals.map((goal) => <Card className="goal-card objective-card" key={goal.id}><div className="goal-top"><span className="goal-icon blue"><Target size={20} /></span><Pill tone={goal.status === 'completed' ? 'green' : 'blue'}>{goal.status}</Pill></div><p className="goal-category">Life goal · {goal.category}</p><h2>{goal.title}</h2><div className="progress-label"><span>Goal progress</span><strong>{Number(goal.progress)}%</strong></div><ProgressBar value={Number(goal.progress)} tone="blue" /><div className="goal-detail"><small>Vision</small><strong>{goal.description || 'No description recorded.'}</strong></div><div className="assistant-actions"><button className="subtle-button" onClick={() => editRecord(goal, 'goals')}>Edit</button><button className="text-button" onClick={() => deleteRecord(goal, 'goals')}>Delete</button></div></Card>) : <Card><p className="plan-empty">No life goals recorded.</p></Card>}</div>
    <div className="goals-grid objective-grid">{items.length ? items.map((goal) => { const Icon = iconFor(goal.category); const risk = goal.calculated_status || goal.status; const color = risk === 'at_risk' ? 'amber' : 'green'; return <Card className="goal-card objective-card" key={goal.id}><div className="goal-top"><span className={`goal-icon ${color}`}><Icon size={20} /></span><Pill tone={risk === 'at_risk' ? 'amber' : risk === 'watch' ? 'neutral' : 'green'}>{String(risk).replace('_', ' ')}</Pill></div><p className="goal-category">Objective · {goal.category}</p><h2>{goal.title}</h2><div className="progress-label"><span>Objective progress</span><strong>{Number(goal.progress)}%</strong></div><ProgressBar value={Number(goal.progress)} tone={color} /><div className="goal-detail"><small>Definition</small><strong>{goal.description || 'No description recorded.'}</strong></div><div className="objective-meta"><span><small>Deadline</small><b>{goal.deadline ? new Date(`${goal.deadline}T12:00:00`).toLocaleDateString() : 'No deadline'}</b></span><span><small>Risk analysis</small><b>{risk === 'at_risk' ? 'Progress or activity is behind pace' : risk === 'watch' ? 'Needs recent execution evidence' : 'Current pace is healthy'}</b></span></div><div className="assistant-actions"><button className="subtle-button" onClick={() => editRecord(goal, 'objectives')}>Edit</button><button className="text-button" onClick={() => deleteRecord(goal, 'objectives')}>Delete</button></div></Card>; }) : <Card><p className="plan-empty">No objectives yet. Create the first measurable outcome.</p></Card>}</div>
    <Card className="school-tasks"><SectionTitle title="Execution tasks" meta={`${tasks.filter((task) => task.status !== 'completed').length} open · ${tasks.filter((task) => task.status !== 'completed' && task.due_at && new Date(task.due_at).getTime() < Date.now()).length} overdue`} /><div className="school-task-list">{tasks.length ? tasks.map((task) => { const due = task.due_at ? new Date(task.due_at) : null; const timing = task.status === 'completed' ? 'Complete' : due && due.getTime() < Date.now() ? 'Overdue' : due && due.toDateString() === new Date().toDateString() ? 'Due today' : due ? 'Upcoming' : 'No due date'; return <div key={task.id} className={task.status === 'completed' ? 'done' : ''}><button onClick={() => toggleTask(task)}><span>{task.status === 'completed' ? <Check size={14} /> : <Circle size={14} />}</span><div><strong>{task.title}</strong><small>{task.priority} · {timing} {due ? `· ${due.toLocaleString()}` : ''}</small></div></button><button className="text-button" onClick={() => editTask(task)}>Edit</button><button className="text-button" onClick={() => deleteRecord(task, 'tasks')}>Delete</button></div>; }) : <p className="plan-empty">No execution tasks yet.</p>}</div></Card></>
  );
}

function HabitsPage({ habits, toggleHabit, reloadHabits }) {
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState('');
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIndex = (new Date().getDay() + 6) % 7;
  const createHabit = async (event) => { event.preventDefault(); const form = event.currentTarget; const body = Object.fromEntries(new FormData(form)); body.target_per_week = Number(body.target_per_week); const response = await fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); if (!response.ok) { setNotice(result.error); toast('Something went wrong', 'error'); return; } form.reset(); setAdding(false); setNotice('Habit created.'); toast('Habit added'); reloadHabits(); };
  const editHabit = async (habit) => { const name = window.prompt('Habit name', habit.name); if (!name) return; const response = await fetch(`/api/habits/${habit.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }); const result = await response.json(); setNotice(response.ok ? 'Habit updated.' : result.error); if (response.ok) reloadHabits(); };
  const deleteHabit = async (habit) => { if (!window.confirm(`Delete “${habit.name}” and its completion history?`)) return; const response = await fetch(`/api/habits/${habit.id}`, { method: 'DELETE' }); setNotice(response.ok ? 'Habit deleted.' : 'Could not delete habit.'); if (response.ok) reloadHabits(); };
  const weeklyRate = habits.length ? Math.round(habits.reduce((sum, habit) => sum + Number(habit.weeklyConsistency || 0), 0) / habits.length) : 0;
  return (
    <><PageHeader eyebrow="Consistency engine" title={<>Daily habits<span className="title-dot">.</span></>} copy={`Small proof, repeated. Your weekly completion rate is ${weeklyRate}%.`} action={<button className="primary-button" onClick={() => setAdding((value) => !value)}><Plus size={17} /> Add habit</button>} />
    {notice && <div className="system-notice">{notice}</div>}
    {adding && <Card><form className="studio-add-form compact-form" onSubmit={createHabit}><input name="name" placeholder="Habit name" required /><select name="target_per_week" defaultValue="7"><option value="7">Daily</option><option value="5">5× weekly</option><option value="3">3× weekly</option><option value="1">Weekly</option></select><button className="primary-button">Create habit</button></form></Card>}
    <div className="metric-grid compact"><MetricCard label="Current streak" value={`${Math.max(0, ...habits.map((item) => Number(item.streak || 0)))} days`} detail={habits.slice().sort((a, b) => b.streak - a.streak)[0]?.name || 'No habits'} icon={Flame} tone="amber" /><MetricCard label="Weekly rate" value={`${weeklyRate}%`} detail="Last seven days" icon={TrendingUp} tone="green" /><MetricCard label="Done today" value={`${habits.filter((h) => h.doneToday).length} / ${habits.length}`} detail="Keep the chain alive" icon={CircleCheck} tone="violet" /><MetricCard label="Monthly rate" value={`${habits.length ? Math.round(habits.reduce((sum, item) => sum + Number(item.monthlyConsistency || 0), 0) / habits.length) : 0}%`} detail="Trailing 30 days" icon={Sparkles} tone="blue" /></div>
    <Card className="habit-table-card"><SectionTitle title="This week" meta="Live completion history" />
      <div className="habit-table"><div className="habit-table-head"><span>Habit</span>{days.map((day, i) => <span key={`${day}${i}`}>{day}</span>)}<span>Streak</span><span>Rate</span></div>{habits.length ? habits.map((habit) => { const Icon = habit.icon; return <div className="habit-row" key={habit.id}><span className="habit-name"><i><Icon size={16} /></i><strong>{habit.name}</strong></span>{habit.week.map((done, index) => <button aria-label={`${habit.name} ${days[index]}`} onClick={() => index === todayIndex && toggleHabit(habit.id)} className={`${done ? 'complete' : ''} ${index === todayIndex ? 'today-cell' : ''}`} key={index}>{done ? <Check size={14} /> : <Circle size={14} />}</button>)}<span className="streak"><Flame size={14} /> {habit.streak}</span><span><button className="text-button" onClick={() => editHabit(habit)}>{habit.weeklyConsistency}%</button><button className="text-button" onClick={() => deleteHabit(habit)}>×</button></span></div>; }) : <p className="plan-empty">No habits yet. Add the first repeated input.</p>}</div>
    </Card></>
  );
}

function MoneyPage() {
  const [data, setData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const [entry, setEntry] = useState('');
  const load = async () => {
    const response = await fetch('/api/finance');
    setData(await response.json());
  };
  useEffect(() => { load().catch(() => setNotice('The finance service is not responding.')); }, []);
  const uploadReceipt = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setNotice('Reading the receipt and updating your budget…');
    const form = new FormData();
    form.append('receipt', file);
    try {
      const response = await fetch('/api/receipts', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setNotice(result.receipt.status === 'ready' ? `Tracked ${result.receipt.merchant} · $${Number(result.receipt.total).toFixed(2)}` : 'Receipt saved for manual review.');
      await load();
    } catch (error) { setNotice(error.message); }
    finally { setUploading(false); event.target.value = ''; }
  };
  const saveReview = async (event, receipt) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(`/api/receipts/${receipt.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
    const result = await response.json();
    setNotice(response.ok ? 'Receipt corrected. Your OS will use that pattern next time.' : result.error);
    if (response.ok) await load();
  };
  const snapshot = data?.snapshot;
  const receipts = data?.receipts || [];
  const accounts = data?.accounts || [];
  const categories = data?.categories || [];
  const recentTransactions = [...(data?.transactions || []).map((item) => ({ ...item, ledgerType: 'transaction', ledgerDate: item.transaction_date })), ...(data?.incomes || []).map((item) => ({ ...item, type: 'income', merchant: item.source, category: 'Income', ledgerType: 'income', ledgerDate: item.received_on }))].sort((a, b) => String(b.ledgerDate).localeCompare(String(a.ledgerDate))).slice(0, 12);
  const money = (value = 0) => `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const saveFinanceEntry = async (event, kind) => { event.preventDefault(); const form = event.currentTarget; const body = Object.fromEntries(new FormData(form)); body.amount = Number(body.amount); const endpoint = kind === 'income' ? '/api/finance/income' : '/api/finance/transaction'; const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); setNotice(response.ok ? `${kind === 'income' ? 'Income' : 'Transaction'} saved.` : result.error); toast(response.ok ? (kind === 'income' ? 'Income added' : 'Transaction added') : 'Something went wrong', response.ok ? 'success' : 'error'); if (response.ok) { form.reset(); setEntry(''); load(); } };
  const saveAccount = async (event) => { event.preventDefault(); const form = event.currentTarget; const body = Object.fromEntries(new FormData(form)); body.current_balance = Number(body.current_balance); const response = await fetch('/api/finance_accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); setNotice(response.ok ? 'Account created.' : result.error); if (response.ok) { form.reset(); setEntry(''); load(); } };
  const saveCategory = async (event) => { event.preventDefault(); const form = event.currentTarget; const body = Object.fromEntries(new FormData(form)); if (!body.monthly_budget) delete body.monthly_budget; const response = await fetch('/api/finance_categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); setNotice(response.ok ? 'Category created.' : result.error); if (response.ok) { form.reset(); setEntry(''); load(); } };
  const deleteLedgerItem = async (item) => { if (!window.confirm(`Delete ${item.merchant || item.source}?`)) return; const response = await fetch(`/api/finance/${item.ledgerType === 'income' ? 'income' : 'transaction'}/${item.id}`, { method: 'DELETE' }); if (response.ok) load(); else setNotice('Could not delete the entry.'); };
  const editLedgerItem = async (item) => { const label = window.prompt(item.ledgerType === 'income' ? 'Income source' : 'Merchant', item.merchant || item.source || ''); if (!label) return; const amount = Number(window.prompt('Amount', item.amount)); if (!Number.isFinite(amount) || amount < 0) return; const body = item.ledgerType === 'income' ? { source: label, amount } : { merchant: label, description: label, amount, category: window.prompt('Category', item.category || 'Other') || item.category || 'Other' }; const response = await fetch(`/api/finance/${item.ledgerType === 'income' ? 'income' : 'transaction'}/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); toast(response.ok ? 'Finance entry updated' : 'Something went wrong', response.ok ? 'success' : 'error'); if (response.ok) load(); };
  return (
    <><PageHeader eyebrow="Receipt intelligence" title={<>Money, without bookkeeping<span className="title-dot">.</span></>} copy="Record accounts, income, purchases, categories, or upload a receipt. Every entry updates cash, burn, runway, and financial risk." action={<div className="assistant-actions"><button className="subtle-button" onClick={() => setEntry('transaction')}>Transaction</button><button className="subtle-button" onClick={() => setEntry('income')}>Income</button><label className={`primary-button receipt-upload-button ${uploading ? 'disabled' : ''}`}><Upload size={17} /> {uploading ? 'Reading…' : 'Receipt'}<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" onChange={uploadReceipt} disabled={uploading} /></label></div>} />
    {notice && <div className="system-notice"><Sparkles size={15} /> {notice}</div>}
    {!data && !notice && <div className="system-notice"><RefreshCw className="spin" size={15} /> Loading finance data…</div>}
    {entry === 'transaction' && <Card><SectionTitle title="Manual transaction" meta="Expense entry" /><form className="studio-add-form" onSubmit={(event) => saveFinanceEntry(event, 'transaction')}><input name="merchant" placeholder="Merchant" required /><input name="amount" type="number" min="0" step=".01" placeholder="Amount" required /><select name="account_id" required><option value="">Account</option>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select><input name="type" type="hidden" value="expense" /><select name="category">{categories.filter((item) => item.category_type === 'expense').map((item) => <option key={item.id}>{item.name}</option>)}<option>Other</option></select><input name="transaction_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /><input name="currency" defaultValue={accounts[0]?.currency || 'USD'} maxLength="3" /><input name="payment_method" placeholder="Payment method" /><textarea name="notes" placeholder="Notes" /><button className="primary-button">Save transaction</button></form></Card>}
    {entry === 'income' && <Card><SectionTitle title="Income entry" meta="One-time or recurring" /><form className="studio-add-form" onSubmit={(event) => saveFinanceEntry(event, 'income')}><input name="source" placeholder="Income source" required /><input name="amount" type="number" min="0" step=".01" placeholder="Amount" required /><select name="account_id" required><option value="">Account</option>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select><input name="received_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /><input name="currency" defaultValue={accounts[0]?.currency || 'USD'} maxLength="3" /><select name="recurring"><option value="false">One-time</option><option value="true">Recurring</option></select><textarea name="notes" placeholder="Notes" /><button className="primary-button">Save income</button></form></Card>}
    {entry === 'account' && <Card><SectionTitle title="Finance account" meta="Cash, checking, savings, or wallet" /><form className="studio-add-form compact-form" onSubmit={saveAccount}><input name="name" placeholder="Account name" required /><select name="account_type"><option value="cash">Cash</option><option value="checking">Checking</option><option value="savings">Savings</option><option value="wallet">Wallet</option></select><input name="current_balance" type="number" step=".01" placeholder="Current balance" required /><input name="currency" defaultValue="USD" maxLength="3" /><button className="primary-button">Create account</button></form></Card>}
    {entry === 'category' && <Card><SectionTitle title="Finance category" meta="Budget and reporting classification" /><form className="studio-add-form compact-form" onSubmit={saveCategory}><input name="name" placeholder="Category name" required /><select name="category_type"><option value="expense">Expense</option><option value="income">Income</option></select><input name="monthly_budget" type="number" min="0" step=".01" placeholder="Monthly budget" /><input name="color" type="color" defaultValue="#a7f3d0" /><button className="primary-button">Create category</button></form></Card>}
    <div className="metric-grid"><MetricCard label="Available cash" value={snapshot ? money(snapshot.currentCash) : '—'} detail="Across active accounts" icon={Wallet} tone="green" /><MetricCard label="Monthly burn" value={snapshot ? money(snapshot.burnRate) : '—'} detail={`${snapshot ? money(snapshot.spent) : '—'} spent · ${snapshot ? money(snapshot.dailyAverageSpend) : '—'} daily`} icon={ReceiptText} tone="amber" /><MetricCard label="Income this month" value={snapshot ? money(snapshot.earned) : '—'} detail="Recorded income" icon={BadgeDollarSign} tone="blue" /><MetricCard label="Financial risk" value={snapshot ? `${snapshot.financialRiskScore}/100` : '—'} detail={snapshot?.runway != null ? `${snapshot.runway.toFixed(1)} months runway` : 'Runway needs spend data'} icon={ShieldAlert} tone="violet" /></div>
    <div className="two-col-layout receipt-layout"><Card className="receipt-drop-card"><SectionTitle title="Receipt inbox" meta={`${receipts.length} private uploads`} action={<button className="icon-button" onClick={load} aria-label="Refresh receipts"><RefreshCw size={16} /></button>} />
      {!receipts.length && <label className="receipt-drop-zone"><Upload size={27} /><strong>Drop your first receipt here</strong><span>Photo, screenshot, HEIC, PDF, PNG, or JPG · up to 12 MB</span><input type="file" accept="image/*,application/pdf" onChange={uploadReceipt} /></label>}
      <div className="receipt-grid">{receipts.slice(0, 8).map((receipt) => <article className="receipt-item" key={receipt.id}>{receipt.mime_type === 'application/pdf' ? <span className="transaction-icon"><ReceiptText size={18} /></span> : receipt.signed_url ? <img src={receipt.signed_url} alt={receipt.merchant || 'Uploaded receipt'} /> : null}<div><Pill tone={receipt.status === 'ready' ? 'green' : 'amber'}>{receipt.status === 'ready' ? 'Tracked' : 'Review'}</Pill><strong>{receipt.merchant || 'Unreviewed receipt'}</strong><span>{receipt.transaction_date || new Date(receipt.created_at).toLocaleDateString()} {receipt.total ? `· ${money(receipt.total)}` : ''}</span></div>{receipt.status !== 'ready' && <form className="receipt-review" onSubmit={(event) => saveReview(event, receipt)}><input name="merchant" placeholder="Merchant" required /><input name="total" type="number" step=".01" placeholder="Total" required /><input name="date" type="date" required /><select name="category"><option>Food</option><option>Travel</option><option>Transport</option><option>Health</option><option>Education</option><option>Other</option></select><input name="payment_method" placeholder="Payment method" /><input name="notes" placeholder="Notes" /><button>Track receipt</button></form>}</article>)}</div>
    </Card>
    <Card className="budget-brain-card"><Pill tone="blue"><Brain size={12} /> Budget intelligence</Pill><h2>{data?.insight || 'Building your financial baseline…'}</h2><p>Every receipt and manual correction updates transactions, cash, burn, runway, and future Chief of Staff briefings.</p><div className="budget-categories">{snapshot && Object.entries(snapshot.byCategory || {}).map(([category, spent]) => <div key={category}><span><b>{category}</b><small>{money(spent)} spent</small></span></div>)}</div></Card></div>
    <Card className="transactions-card"><SectionTitle title="Finance ledger" meta="Transactions and income" action={<div className="assistant-actions"><button className="text-button" onClick={() => setEntry('account')}>Add account</button><button className="text-button" onClick={() => setEntry('category')}>Add category</button></div>} /><div className="transaction-list">{recentTransactions.length ? recentTransactions.map((item) => <div key={`${item.ledgerType}-${item.id}`}><span className={`transaction-icon ${item.type === 'income' ? 'positive-bg' : ''}`}>{item.type === 'income' ? <ArrowUpRight size={17} /> : <ReceiptText size={17} />}</span><span><strong>{item.merchant || item.description}</strong><small>{item.category} · {new Date(`${item.ledgerDate}T12:00:00`).toLocaleDateString()}</small></span><b className={item.type === 'income' ? 'positive' : ''}>{item.type === 'income' ? '+' : '-'}{money(item.amount)}</b><button className="text-button" onClick={() => editLedgerItem(item)}>Edit</button><button className="text-button" onClick={() => deleteLedgerItem(item)}>×</button></div>) : <div className="empty-transaction"><ReceiptText size={18} /> Add an account, then record income or a transaction.</div>}</div></Card></>
  );
}

function MoodPage() {
  const [wellbeing, setWellbeing] = useState({ checkins: [], metrics: [], latest: {}, counts: {}, stats: { weekly: {}, monthly: {} }, trends: [] });
  const [saved, setSaved] = useState('');
  const [view, setView] = useState('checkin');
  const [search, setSearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [selected, setSelected] = useState(null);
  const load = (query = '', from = '', to = '') => { const params = new URLSearchParams(); if (query) params.set('q', query); if (from) params.set('from', from); if (to) params.set('to', to); return Promise.all([fetch(`/api/daily-checkin${params.size ? `?${params}` : ''}`).then((response) => response.json()), fetch('/api/health').then((response) => response.json())]).then(([checkins, health]) => setWellbeing({ checkins: checkins.data || [], metrics: health.data || [], latest: health.latest || {}, counts: health.counts || {}, stats: checkins.stats || { weekly: {}, monthly: {} }, trends: checkins.trends || [] })); };
  useEffect(() => { load().catch(() => {}); }, []);
  const saveCheckin = async (event) => { event.preventDefault(); const form = event.currentTarget; const body = Object.fromEntries(new FormData(form)); const response = await fetch('/api/daily-checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); setSaved(response.ok ? 'Today’s executive check-in is saved.' : result.error); toast(response.ok ? 'Check-in saved' : 'Something went wrong', response.ok ? 'success' : 'error'); if (response.ok) load(); };
  const saveMetric = async (event) => { event.preventDefault(); const form = event.currentTarget; const body = Object.fromEntries(new FormData(form)); const response = await fetch('/api/health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); setSaved(response.ok ? 'Health metric recorded.' : result.error); if (response.ok) { form.reset(); load(); } };
  const latest = wellbeing.checkins[0];
  const metric = (type) => wellbeing.latest[type] ? `${wellbeing.latest[type].value} ${wellbeing.latest[type].unit}` : '—';
  return (
    <><PageHeader eyebrow="Daily rhythms" title={<>Health & daily check-in<span className="title-dot">.</span></>} copy="Track objective health inputs and the honest context your Chief of Staff needs to guide tomorrow." action={<div className="studio-tabs"><button className={view === 'checkin' ? 'active' : ''} onClick={() => setView('checkin')}>Check-in</button><button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>History</button></div>} />
    <div className="metric-grid"><MetricCard label="Weekly mood" value={wellbeing.stats.weekly.mood != null ? `${wellbeing.stats.weekly.mood}/5` : '—'} detail="Seven-day average" icon={Sun} tone="amber" /><MetricCard label="Weekly energy" value={wellbeing.stats.weekly.energy != null ? `${wellbeing.stats.weekly.energy}/5` : '—'} detail={`Monthly ${wellbeing.stats.monthly.energy ?? '—'}`} icon={Zap} tone="blue" /><MetricCard label="Weekly stress" value={wellbeing.stats.weekly.stress != null ? `${wellbeing.stats.weekly.stress}/5` : '—'} detail={`Monthly ${wellbeing.stats.monthly.stress ?? '—'}`} icon={Activity} tone="violet" /><MetricCard label="Productivity" value={wellbeing.stats.weekly.productivity != null ? `${wellbeing.stats.weekly.productivity}/5` : '—'} detail="Seven-day average" icon={TrendingUp} tone="green" /></div>
    {view === 'checkin' && <div className="two-col-layout wellbeing-layout"><Card className="wellbeing-form-card"><SectionTitle title="Daily check-in" meta="One honest minute" /><form className="wellbeing-form" onSubmit={saveCheckin}><label>Date<input name="checkin_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label>Mood<select name="mood" defaultValue="3"><option value="1">1 · Heavy</option><option value="2">2 · Low</option><option value="3">3 · Neutral</option><option value="4">4 · Good</option><option value="5">5 · Strong</option></select></label><label>Energy<select name="energy" defaultValue="3"><option value="1">1 · Empty</option><option value="2">2</option><option value="3">3 · Steady</option><option value="4">4</option><option value="5">5 · Strong</option></select></label><label>Stress<select name="stress" defaultValue="2"><option value="1">1 · Calm</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5 · Overloaded</option></select></label><label>Productivity<select name="productivity" defaultValue="3"><option value="1">1 · Stalled</option><option value="2">2</option><option value="3">3 · Steady</option><option value="4">4</option><option value="5">5 · Exceptional</option></select></label><label>Sleep hours<input name="sleep_hours" type="number" min="0" max="24" step=".25" /></label><label className="full-field">Biggest win<textarea name="biggest_win" placeholder="What moved forward?" /></label><label className="full-field">Biggest challenge<textarea name="biggest_challenge" placeholder="What made execution harder?" /></label><label className="full-field">What was avoided?<textarea name="what_was_avoided" placeholder="Name the uncomfortable work honestly." /></label><label className="full-field">Tomorrow’s priority<textarea name="tomorrow_priority" placeholder="The one result that matters most." /></label><button className="primary-button full-field">Save daily check-in</button></form>{saved && <p className="form-success"><Check size={13} /> {saved}</p>}</Card>
    <Card className="gratitude-card"><SectionTitle title="Health metric" meta="Weight, training, mindfulness, sleep, and nutrition" /><form className="wellbeing-form" onSubmit={saveMetric}><label>Metric<select name="metric_type"><option value="weight">Weight</option><option value="workout">Workout</option><option value="running">Running</option><option value="yoga">Yoga</option><option value="meditation">Meditation</option><option value="sleep">Sleep</option><option value="calories">Calories</option><option value="protein">Protein</option></select></label><label>Value<input name="value" type="number" step=".01" required /></label><label>Unit<input name="unit" placeholder="lb, min, km, hours, kcal, g" required /></label><label className="full-field">Notes<textarea name="notes" placeholder="Optional context" /></label><button className="primary-button full-field">Record metric</button></form><div className="gratitude-history">{wellbeing.metrics.slice(0, 6).map((entry) => <blockquote key={entry.id}>{entry.metric_type}: {entry.value} {entry.unit}<small>{new Date(entry.recorded_at).toLocaleDateString()}</small></blockquote>)}</div></Card></div>}
    {view === 'history' && <><Card><SectionTitle title="Check-in trends" meta="Chronological mood, energy, stress, and productivity" /><form className="studio-add-form compact-form" onSubmit={(event) => { event.preventDefault(); load(search, historyFrom, historyTo); }}><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search wins, challenges, avoidance, or priorities" /><input type="date" value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} aria-label="From date" /><input type="date" value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} aria-label="To date" /><button className="primary-button">Filter history</button></form><div className="checkin-trends">{['mood', 'energy', 'stress', 'productivity'].map((field) => <div key={field}><span>{field}</span><MiniBars values={wellbeing.trends.slice(-14).map((item) => Number(item[field] || 0) * 20)} tone={field === 'stress' ? 'violet' : 'mint'} /></div>)}</div></Card><Card className="learning-timeline-card"><SectionTitle title="Daily check-in ledger" meta={`${wellbeing.checkins.length} entries`} /><div className="learning-timeline checkin-ledger">{wellbeing.checkins.length ? wellbeing.checkins.map((entry) => <button key={entry.id} onClick={() => setSelected(entry)}><span>{new Date(`${entry.checkin_date}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span><i /><strong>{entry.biggest_win || entry.tomorrow_priority || 'Daily check-in'}</strong><Pill tone={entry.productivity >= 4 ? 'green' : entry.stress >= 4 ? 'amber' : 'neutral'}>M{entry.mood} · E{entry.energy} · S{entry.stress} · P{entry.productivity}</Pill></button>) : <p className="plan-empty">No matching check-ins.</p>}</div></Card>{selected && <Card><SectionTitle title={new Date(`${selected.checkin_date}T12:00:00`).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} meta="Past check-in" action={<button className="text-button" onClick={() => setSelected(null)}>Close</button>} /><div className="signal-list"><div><b>Biggest win</b><span>{selected.biggest_win || 'Not recorded'}</span></div><div><b>Biggest challenge</b><span>{selected.biggest_challenge || 'Not recorded'}</span></div><div><b>Avoidance</b><span>{selected.what_was_avoided || 'Not recorded'}</span></div><div><b>Tomorrow priority</b><span>{selected.tomorrow_priority || 'Not recorded'}</span></div><div><b>AI summary</b><span>{selected.ai_summary || 'Not available'}</span></div></div></Card>}</>}
    </>
  );
}

function TravelPage() {
  const [items, setItems] = useState([]);
  const [notice, setNotice] = useState('');
  const [adding, setAdding] = useState(false);
  const load = () => fetch('/api/travel_plans').then((response) => response.json()).then((result) => setItems(result.data || []));
  useEffect(() => { load().catch(() => {}); }, []);
  const saveTravel = async (event) => { event.preventDefault(); const form = event.currentTarget; const body = Object.fromEntries(new FormData(form)); ['arrival_at', 'departure_at'].forEach((key) => { if (body[key]) body[key] = new Date(body[key]).toISOString(); else delete body[key]; }); ['visa_deadline', 'budget', 'cost'].forEach((key) => { if (!body[key]) delete body[key]; }); const response = await fetch('/api/travel_plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); setNotice(response.ok ? 'Travel plan saved.' : result.error); if (response.ok) { form.reset(); setAdding(false); load(); } };
  const removeTravel = async (item) => { if (!window.confirm(`Delete “${item.title}”?`)) return; const response = await fetch(`/api/travel_plans/${item.id}`, { method: 'DELETE' }); if (response.ok) load(); };
  const now = Date.now();
  const active = items.find((item) => item.status === 'active') || items.find((item) => item.arrival_at && new Date(item.arrival_at).getTime() <= now && (!item.departure_at || new Date(item.departure_at).getTime() >= now));
  const daysAbroad = active?.arrival_at ? Math.max(0, Math.floor((now - new Date(active.arrival_at).getTime()) / 86400000)) : null;
  const daysLeft = active?.departure_at ? Math.max(0, Math.ceil((new Date(active.departure_at).getTime() - now) / 86400000)) : null;
  const totalCost = items.reduce((sum, item) => sum + Number(item.cost || 0), 0);
  const travelBurn = daysAbroad ? totalCost / daysAbroad * 30 : null;
  const deadlines = items.filter((item) => item.visa_deadline && new Date(`${item.visa_deadline}T23:59:59`).getTime() >= now).sort((a, b) => a.visa_deadline.localeCompare(b.visa_deadline));
  return (
    <><PageHeader eyebrow="Travel operations" title={<>Every booking, in order<span className="title-dot">.</span></>} copy="Track cities, countries, flights, accommodations, pet sits, visas, budgets, arrivals, and departures." action={<button className="primary-button" onClick={() => setAdding((value) => !value)}><Plus size={17} /> Add travel plan</button>} />
    {notice && <div className="system-notice"><Sparkles size={15} /> {notice}</div>}
    {adding && <Card><form className="studio-add-form" onSubmit={saveTravel}><input name="title" placeholder="Plan or booking title" required /><select name="plan_type"><option value="destination">Destination</option><option value="flight">Flight</option><option value="accommodation">Accommodation</option><option value="pet_sit">Pet sit</option><option value="visa">Visa</option><option value="activity">Activity</option></select><input name="city" placeholder="City" /><input name="country" placeholder="Country" /><input name="provider" placeholder="Provider" /><input name="arrival_at" type="datetime-local" /><input name="departure_at" type="datetime-local" /><input name="visa_deadline" type="date" /><input name="budget" type="number" step=".01" placeholder="Budget" /><input name="cost" type="number" step=".01" placeholder="Cost" /><select name="status"><option value="planned">Planned</option><option value="booked">Booked</option><option value="active">Active</option><option value="complete">Complete</option></select><textarea name="notes" placeholder="Confirmation, visa, or arrival notes" /><button className="primary-button">Save travel plan</button></form></Card>}
    <div className="metric-grid compact"><MetricCard label="Current city" value={active?.city || '—'} detail={active?.country || 'No active destination'} icon={MapPin} tone="blue" /><MetricCard label="Days abroad" value={daysAbroad ?? '—'} detail={active?.title || 'No active chapter'} icon={Globe2} tone="green" /><MetricCard label="Days left" value={daysLeft ?? '—'} detail={active?.departure_at ? 'Until departure' : 'No departure recorded'} icon={CalendarDays} tone="violet" /><MetricCard label="Travel burn" value={travelBurn == null ? '—' : `$${Math.round(travelBurn)}/mo`} detail="Recorded cost ÷ days abroad" icon={Wallet} tone="amber" /></div>
    <Card className="travel-inbox-card"><SectionTitle title="Travel timeline" meta={`${items.length} plans and bookings`} />{!items.length && <div className="receipt-drop-zone"><Luggage size={28} /><strong>No travel plans recorded</strong><span>Add the current chapter or next booking.</span></div>}<div className="travel-timeline">{items.map((item) => <article key={item.id}><div className="timeline-date"><strong>{item.arrival_at ? new Date(item.arrival_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'TBD'}</strong><span>{item.departure_at ? `to ${new Date(item.departure_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : ''}</span></div><div className="travel-item-copy"><Pill tone={item.status === 'active' ? 'green' : 'blue'}>{item.plan_type}</Pill><h3>{item.title}</h3><p>{[item.city, item.country, item.provider, item.confirmation_number && `Confirmation ${item.confirmation_number}`].filter(Boolean).join(' · ') || 'No additional details recorded.'}</p>{item.cost != null && <strong>{item.currency} {item.cost}</strong>}</div><button className="text-button" onClick={() => removeTravel(item)}>Delete</button></article>)}</div></Card>
    <div className="travel-grid"><Card className="span-4"><SectionTitle title="Coming up" meta="Next arrival" /><div className="next-travel-item">{items.find((item) => item.arrival_at && new Date(item.arrival_at).getTime() > now) ? <><Plane size={24} /><strong>{items.find((item) => item.arrival_at && new Date(item.arrival_at).getTime() > now).title}</strong><span>{new Date(items.find((item) => item.arrival_at && new Date(item.arrival_at).getTime() > now).arrival_at).toLocaleDateString()}</span></> : <><Luggage size={24} /><strong>No upcoming arrival</strong><span>Add the next destination above</span></>}</div></Card><Card className="span-4"><SectionTitle title="Visa watch" meta="Upcoming deadlines" /><div className="visa-list">{deadlines.length ? deadlines.slice(0, 4).map((item) => <span key={item.id}><b>{item.country || item.title}</b><Pill tone="amber">{new Date(`${item.visa_deadline}T12:00:00`).toLocaleDateString()}</Pill></span>) : <p className="plan-empty">No visa deadlines recorded.</p>}</div></Card><Card className="span-4"><SectionTitle title="Travel budget" meta="Recorded plans" /><div className="next-travel-item"><Wallet size={24} /><strong>${items.reduce((sum, item) => sum + Number(item.budget || 0), 0).toLocaleString()}</strong><span>${totalCost.toLocaleString()} committed</span></div></Card></div></>
  );
}

function ContentPage() {
  const [active, setActive] = useState('all');
  const [items, setItems] = useState([]);
  const [notice, setNotice] = useState('');
  const load = () => fetch('/api/content_projects').then((response) => response.json()).then((result) => setItems(result.data || []));
  useEffect(() => { load().catch(() => {}); }, []);
  const addItem = async (event) => { event.preventDefault(); const form = event.currentTarget; const body = Object.fromEntries(new FormData(form)); body.views = Number(body.views || 0); body.engagement = Number(body.engagement || 0); const response = await fetch('/api/content_projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); setNotice(response.ok ? 'Content project saved.' : result.error); if (response.ok) { form.reset(); load(); } };
  const updateStatus = async (item, status) => { const response = await fetch(`/api/content_projects/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); if (response.ok) load(); };
  const filtered = active === 'all' ? items : items.filter((item) => item.status === active);
  return (
    <><PageHeader eyebrow="Creator operating system" title={<>Content studio<span className="title-dot">.</span></>} copy="Ideas, production checklists, UGC opportunities, brand contacts, and publishing work in one system." />
    {notice && <div className="system-notice">{notice}</div>}
    <div className="metric-grid compact"><MetricCard label="Ideas" value={items.filter((item) => item.status === 'idea').length} detail="Captured concepts" icon={Sparkles} tone="violet" /><MetricCard label="In production" value={items.filter((item) => ['script','draft','scheduled'].includes(item.status)).length} detail="Scripts, drafts, scheduled" icon={CircleCheck} tone="amber" /><MetricCard label="Published" value={items.filter((item) => item.status === 'published').length} detail="Assets shipped" icon={TrendingUp} tone="green" /><MetricCard label="Total views" value={items.reduce((sum, item) => sum + Number(item.views || 0), 0).toLocaleString()} detail="Published performance" icon={Play} tone="blue" /></div>
    <div className="studio-tabs">{[['all', 'All'], ['idea', 'Ideas'], ['script', 'Scripts'], ['draft', 'Drafts'], ['published', 'Published']].map(([id, label]) => <button className={active === id ? 'active' : ''} onClick={() => setActive(id)} key={id}>{label}</button>)}</div>
    <Card className="studio-workspace"><SectionTitle title="Content pipeline" meta="Idea to published performance" /><form className="studio-add-form" onSubmit={addItem}><input name="title" placeholder="Content title" required /><select name="content_type"><option value="short_form">Short form</option><option value="long_form">Long form</option><option value="carousel">Carousel</option><option value="ugc">UGC</option><option value="newsletter">Newsletter</option></select><input name="platform" placeholder="Platform" /><select name="status"><option value="idea">Idea</option><option value="script">Script</option><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="published">Published</option></select><input name="views" type="number" min="0" placeholder="Views" /><input name="engagement" type="number" min="0" step=".01" placeholder="Engagement %" /><input name="next_action" placeholder="Next action" /><textarea name="body" placeholder="Hook, script, draft, or notes…" /><button className="primary-button">Save item</button></form><div className="studio-card-grid">{filtered.length ? filtered.map((item) => <article key={item.id}><Pill tone={item.status === 'published' ? 'green' : 'violet'}>{item.status}</Pill><h3>{item.title}</h3><p>{item.body || 'No body recorded.'}</p><span>{item.platform || 'No platform'} · {Number(item.views || 0).toLocaleString()} views · {Number(item.engagement || 0)}% engagement</span><small>Next: {item.next_action || 'Not defined'}</small><select value={item.status} onChange={(event) => updateStatus(item, event.target.value)}><option value="idea">Idea</option><option value="script">Script</option><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="published">Published</option><option value="archived">Archived</option></select></article>) : <p className="plan-empty">No content items in this stage.</p>}</div></Card></>
  );
}

function RelationshipsPage() {
  const [people, setPeople] = useState([]);
  const [adding, setAdding] = useState(false);
  const load = () => fetch('/api/relationships').then((response) => response.json()).then((result) => setPeople(result.data || []));
  useEffect(() => { load().catch(() => {}); }, []);
  const add = async (event) => { event.preventDefault(); const form = event.currentTarget; const body = Object.fromEntries(new FormData(form)); body.health_score = body.health_score ? Number(body.health_score) : null; ['last_contact_at', 'next_follow_up_at'].forEach((key) => { if (body[key]) body[key] = new Date(body[key]).toISOString(); else delete body[key]; }); if (!body.email) delete body.email; const response = await fetch('/api/relationships', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (response.ok) { form.reset(); setAdding(false); load(); } };
  const now = Date.now();
  const due = people.filter((person) => person.next_follow_up_at && new Date(person.next_follow_up_at).getTime() <= now);
  const averageHealth = people.length ? Math.round(people.reduce((sum, person) => sum + Number(person.health_score || 0), 0) / people.length) : 0;
  const types = people.reduce((result, person) => { result[person.relationship_type] = (result[person.relationship_type] || 0) + 1; return result; }, {});
  return <><PageHeader eyebrow="Personal CRM" title={<>Relationships compound<span className="title-dot">.</span></>} copy="A life transformation needs people: friends, recruiters, clients, brands, collaborators, and the travel community around you." action={<button className="primary-button" onClick={() => setAdding((value) => !value)}><Plus size={16} /> Add relationship</button>} />
    {adding && <Card><form className="studio-add-form" onSubmit={add}><input name="name" placeholder="Name" required /><select name="relationship_type"><option value="personal">Personal</option><option value="career">Career</option><option value="client">Client</option><option value="brand">Brand</option><option value="creative">Creative</option><option value="travel">Travel</option></select><input name="email" type="email" placeholder="Email" /><input name="last_contact_at" type="datetime-local" /><input name="next_follow_up_at" type="datetime-local" /><input name="health_score" type="number" min="0" max="100" placeholder="Health score" /><textarea name="notes" placeholder="Context and next action" /><button className="primary-button">Save relationship</button></form></Card>}
    <div className="metric-grid"><MetricCard label="Active relationships" value={people.length} detail={`${Object.keys(types).length} relationship circles`} icon={Users} tone="blue" /><MetricCard label="Follow-ups due" value={due.length} detail="Based on recorded follow-up dates" icon={Bell} tone="amber" /><MetricCard label="Relationship health" value={averageHealth || '—'} detail="Average recorded score" icon={Heart} tone="green" /><MetricCard label="Recent contacts" value={people.filter((person) => person.created_at && new Date(person.created_at).getTime() >= now - 30 * 86400000).length} detail="Added in the last 30 days" icon={MapPin} tone="violet" /></div>
    <Card className="relationship-card"><SectionTitle title="Relationship radar" meta="Prioritized by follow-up date and relationship health" /><div className="relationship-list">{people.length ? people.map((person) => <article key={person.id}><span className="avatar large-avatar">{person.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><div><strong>{person.name}</strong><small>{person.relationship_type} · {person.last_contact_at ? `Last contact ${new Date(person.last_contact_at).toLocaleDateString()}` : 'No contact date'}</small><p>{person.notes || 'No context recorded.'}</p></div><div className="relationship-health"><span><i style={{ width: `${Number(person.health_score || 0)}%` }} /></span><b>{person.health_score ?? '—'}</b></div><Pill tone={person.next_follow_up_at && new Date(person.next_follow_up_at).getTime() <= now ? 'amber' : 'green'}>{person.next_follow_up_at ? new Date(person.next_follow_up_at).toLocaleDateString() : 'No follow-up'}</Pill></article>) : <p className="plan-empty">No relationships recorded yet.</p>}</div></Card>
    <div className="two-col-layout"><Card className="relationship-nudge"><Pill tone="amber">Chief of Staff nudge</Pill><h2>{due.length ? `${due.length} follow-up${due.length === 1 ? '' : 's'} require attention.` : 'No relationship follow-ups are overdue.'}</h2><p>{due.length ? 'Protect the relationships relevant to this chapter with a specific, low-friction next action.' : 'Add follow-up dates so relationship risk becomes visible.'}</p></Card><Card className="network-map"><SectionTitle title="Network mix" meta="Who surrounds the mission" /><div className="network-rings"><Donut value={Math.min(100, people.length * 2)} label={people.length} sublabel="people" /><div>{Object.entries(types).map(([type, count]) => <span key={type}><i className="green-dot" /> {type} · {count}</span>)}</div></div></Card></div></>;
}

function InsightsPage() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/dashboard').then((response) => response.json()).then(setData).catch(() => {}); }, []);
  const briefing = data?.briefing;
  const insights = [...(briefing?.current_risks || []).map((item) => ({ title: item.title, finding: item.reason, action: item.recommended_action, tone: item.severity === 'high' ? 'amber' : 'violet', kind: 'Risk' })), ...(briefing?.opportunities || []).map((item) => ({ title: item.title, finding: item.reason, action: item.recommended_action, tone: 'green', kind: item.category }))];
  return <><PageHeader eyebrow="Behavioral intelligence" title={<>Insights engine<span className="title-dot">.</span></>} copy="Your OS converts repeated behavior into evidence, forecasts, and recommendations you can act on." />
    <div className="insight-hero"><Card><div><Pill tone="green"><Radar size={12} /> Current briefing</Pill><h2>{briefing?.summary || 'No briefing has been generated.'}</h2><p>{briefing?.chief_of_staff_note || 'Generate a Chief of Staff briefing after recording objectives, tasks, habits, finance, health, travel, and today’s check-in.'}</p></div><Donut value={data?.executionReadiness || 0} label={data?.executionReadiness ?? '—'} sublabel="readiness" /></Card></div>
    <div className="insight-grid">{insights.length ? insights.map((insight) => <Card className="behavior-insight" key={`${insight.kind}-${insight.title}`}><Pill tone={insight.tone}>{insight.kind}</Pill><h2>{insight.title}</h2><p>{insight.finding}</p><div className="insight-action"><Lightbulb size={15} /><span><small>Recommended action</small><b>{insight.action}</b></span></div></Card>) : <Card><p className="plan-empty">No evidence-backed insights yet. Generate a briefing from the Chief of Staff screen.</p></Card>}</div>
    <Card className="learning-timeline-card"><SectionTitle title="Data coverage" meta="What the briefing can currently analyze" /><div className="learning-timeline">{[['Objectives', data?.objectives?.length || 0], ['Habits', data?.habits?.length || 0], ['Tasks', data?.tasks?.length || 0], ['Check-ins', data?.checkins?.length || 0], ['Health metrics', data?.health?.length || 0], ['Travel plans', data?.travel?.length || 0]].map(([title, count]) => <div key={title}><span>{count}</span><i /><strong>{title}</strong><Pill tone={count ? 'green' : 'neutral'}>{count ? 'Available' : 'Missing'}</Pill></div>)}</div></Card></>;
}

function TimelinePage() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/dashboard').then((response) => response.json()).then(setData).catch(() => {}); }, []);
  const now = Date.now();
  const chapters = (data?.travel || []).filter((item) => item.arrival_at).map((item) => ({ month: new Date(item.arrival_at).toLocaleDateString([], { month: 'short' }), place: [item.city, item.country].filter(Boolean).join(', ') || 'Location not set', title: item.title, status: item.status === 'active' ? 'current' : new Date(item.arrival_at).getTime() < now ? 'complete' : 'future', items: [item.plan_type, item.departure_at ? `Departure ${new Date(item.departure_at).toLocaleDateString()}` : 'No departure recorded', item.budget != null ? `Budget ${item.currency} ${item.budget}` : 'No budget recorded'] }));
  const started = data?.profile?.chapter_started_at ? new Date(data.profile.chapter_started_at).getTime() : null;
  const day = started ? Math.max(1, Math.floor((now - started) / 86400000)) : null;
  return <><PageHeader eyebrow="Year of Reinvention" title={<>Transformation timeline<span className="title-dot">.</span></>} copy="The year is not a blur. It is a sequence of deliberate chapters, evidence, transitions, and identity milestones." />
    <Card className="timeline-overview"><span><strong>{day ? `Day ${day}` : 'Day —'}</strong><small>of the current chapter</small></span><ProgressBar value={day ? Math.min(100, day / 365 * 100) : 0} tone="green" /><span><strong>{chapters.length}</strong><small>recorded chapters</small></span></Card>
    <div className="reinvention-timeline">{chapters.length ? chapters.map((chapter, index) => <article className={chapter.status} key={`${chapter.month}-${chapter.title}`}><div className="timeline-marker"><span>{chapter.status === 'complete' ? <Check size={14} /> : index + 1}</span><i /></div><Card><div className="chapter-heading"><span><small>{chapter.month}</small><b>{chapter.place}</b></span><Pill tone={chapter.status === 'complete' ? 'green' : chapter.status === 'current' ? 'blue' : 'neutral'}>{chapter.status === 'current' ? 'You are here' : chapter.status}</Pill></div><h2>{chapter.title}</h2><ul>{chapter.items.map((item) => <li key={item}>{item}</li>)}</ul></Card></article>) : <Card><p className="plan-empty">No transformation chapters recorded. Add a travel plan to establish the timeline.</p></Card>}</div></>;
}

function SettingsPage() {
  const [status, setStatus] = useState(null);
  const [profile, setProfile] = useState(null);
  const [notice, setNotice] = useState('');
  const load = () => Promise.all([fetch('/api/status').then((response) => response.json()), fetch('/api/profile').then((response) => response.json())]).then(([nextStatus, nextProfile]) => { setStatus(nextStatus); setProfile(nextProfile); });
  useEffect(() => { load().catch(() => {}); }, []);
  const save = async (event) => { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); if (!body.chapter_started_at) delete body.chapter_started_at; const response = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); setNotice(response.ok ? 'Profile settings saved.' : result.error); if (response.ok) load(); };
  const savePreferences = async (event) => { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); const response = await fetch('/api/preferences', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); setNotice(response.ok ? 'Personalization saved. Reloading your OS…' : result.error); if (response.ok) window.location.reload(); };
  const signOut = async () => { const response = await fetch('/api/auth/signout', { method: 'POST' }); if (response.ok) window.location.href = '/login'; else toast('Something went wrong', 'error'); };
  const integrations = [
    { name: 'Supabase', detail: 'Private database, auth, and receipt storage', icon: ShieldAlert, status: status?.supabase ? 'Connected' : 'Unavailable', tone: status?.supabase ? 'green' : 'amber' },
    { name: status?.provider === 'anthropic' ? 'Anthropic' : 'OpenAI', detail: 'Chief of Staff intelligence', icon: Sparkles, status: status?.openai ? 'Connected' : 'Deterministic mode', tone: status?.openai ? 'green' : 'amber' },
  ];
  return <><PageHeader eyebrow="System configuration" title={<>Settings & automations<span className="title-dot">.</span></>} copy="Control the operating cadence, integrations, reports, reminders, and how assertive your Chief of Staff should be." action={<button className="subtle-button" onClick={signOut}>Sign out</button>} />
    {notice && <div className="system-notice">{notice}</div>}
    <div className="settings-grid"><Card><SectionTitle title="Integrations" meta="Connected systems" /><div className="integration-list">{integrations.map(({ name, detail, icon: Icon, status, tone }) => <div key={name}><span className="goal-icon blue"><Icon size={18} /></span><span><strong>{name}</strong><small>{detail}</small></span><Pill tone={tone}>{status}</Pill></div>)}</div></Card>
    <Card><SectionTitle title="Profile & current chapter" meta={profile?.email || 'Authenticated user'} /><form className="wellbeing-form" onSubmit={save}><label>Name<input name="display_name" defaultValue={profile?.data?.display_name || ''} required /></label><label>Timezone<input name="timezone" defaultValue={profile?.data?.timezone || 'America/New_York'} required /></label><label>Current city<input name="current_city" defaultValue={profile?.data?.current_city || ''} /></label><label>Current country<input name="current_country" defaultValue={profile?.data?.current_country || ''} /></label><label>Chapter start<input name="chapter_started_at" type="date" defaultValue={profile?.data?.chapter_started_at || ''} /></label><label>Monthly AI budget<input name="monthly_ai_budget" type="number" min="0" step=".01" defaultValue={profile?.data?.monthly_ai_budget ?? 5} /></label><label>Monthly AI request limit<input name="monthly_ai_requests_limit" type="number" min="0" defaultValue={profile?.data?.monthly_ai_requests_limit ?? 30} /></label><label className="full-field">One-year vision<textarea name="one_year_vision" defaultValue={profile?.data?.one_year_vision || ''} /></label><label className="full-field">Work style<textarea name="work_style" defaultValue={profile?.data?.work_style || ''} /></label><p className="setting-help full-field">AI requests used this month: {profile?.data?.ai_requests_used_this_month ?? 0}</p><button className="primary-button full-field">Save profile</button></form></Card>
    <Card className="email-preview-card"><SectionTitle title="AI safety contract" meta="Applied to every generated briefing" /><div className="email-preview"><p>JOSEPH OS · OPERATING RULES</p><h2>Evidence before certainty.</h2><p>Briefings use only user-scoped Supabase data, identify missing evidence, return validated JSON, and frame medical, legal, and financial topics as operational guidance—not certainty.</p></div></Card>
    <Card><SectionTitle title="Personalization" meta="Your saved OS preferences" /><form className="wellbeing-form" onSubmit={savePreferences}><label>App name<input name="app_name" defaultValue={profile?.preferences?.app_name || `${profile?.data?.display_name || 'You'} OS`} /></label><label>Chief of Staff tone<select name="chief_of_staff_tone" defaultValue={profile?.preferences?.chief_of_staff_tone || 'executive'}><option value="gentle">Gentle</option><option value="executive">Executive</option><option value="direct">Direct</option></select></label><label>Theme<select name="theme" defaultValue={profile?.preferences?.theme || 'default'}><option value="default">Default</option><option value="midnight">Midnight</option><option value="soft">Soft</option></select></label><label>Accent<input name="accent_color" type="color" defaultValue={profile?.preferences?.accent_color || '#a7f3d0'} /></label><label>Font<select name="font_style" defaultValue={profile?.preferences?.font_style || 'default'}><option value="default">Default</option><option value="editorial">Editorial</option><option value="system">System</option></select></label><label>Density<select name="density" defaultValue={profile?.preferences?.density || 'comfortable'}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label><label>Motion<select name="motion" defaultValue={profile?.preferences?.motion || 'full'}><option value="full">Full</option><option value="reduced">Reduced</option></select></label><button className="primary-button full-field">Save personalization</button></form></Card></div></>;
}

function SchoolPage() {
  const [school, setSchool] = useState({ courses: [], tasks: [], sessions: [], graduationTarget: '' });
  const load = () => fetch('/api/school').then((response) => response.json()).then(setSchool);
  useEffect(() => { load().catch(() => {}); }, []);
  const addTask = async (event) => { event.preventDefault(); await fetch('/api/school/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); event.currentTarget.reset(); load(); };
  const toggleTask = async (task) => { await fetch(`/api/school/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !task.completed }) }); load(); };
  const logSession = async (event) => { event.preventDefault(); await fetch('/api/school/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); event.currentTarget.reset(); load(); };
  const totalMinutes = school.sessions.reduce((sum, session) => sum + Number(session.minutes), 0);
  const avgProgress = school.courses.length ? Math.round(school.courses.reduce((sum, course) => sum + course.progress, 0) / school.courses.length) : 0;
  return <><PageHeader eyebrow="WGU command center" title={<>School dashboard<span className="title-dot">.</span></>} copy="Courses, assessments, study time, deadlines, and graduation progress in one focused workspace." />
    <div className="metric-grid"><MetricCard label="Active courses" value={school.courses.length} detail="Current term" icon={BookOpen} tone="blue" /><MetricCard label="Course progress" value={`${avgProgress}%`} detail="Across active courses" icon={TrendingUp} tone="green" /><MetricCard label="Study time" value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`} detail="Logged sessions" icon={Clock3} tone="amber" /><MetricCard label="Open tasks" value={school.tasks.filter((task) => !task.completed).length} detail="Assignments + assessments" icon={FileCheck2} tone="violet" /></div>
    <div className="school-grid"><Card className="school-courses"><SectionTitle title="Current courses" meta={`Graduation target · ${school.graduationTarget || 'Set target'}`} /><div className="course-list">{school.courses.map((course) => <article key={course.id}><span className="course-code">{course.code}</span><div><strong>{course.title}</strong><small>{course.status}</small><ProgressBar value={course.progress} tone={course.progress > 70 ? 'green' : 'blue'} /></div><b>{course.progress}%</b></article>)}</div></Card>
    <Card className="school-tasks"><SectionTitle title="Assignments + tasks" meta="What moves graduation forward" /><form className="school-task-form" onSubmit={addTask}><input name="title" placeholder="Add an assessment or study task" required /><select name="courseId">{school.courses.map((course) => <option key={course.id} value={course.id}>{course.code}</option>)}</select><input name="dueDate" type="date" /><button><Plus size={16} /></button></form><div className="school-task-list">{school.tasks.map((task) => <button className={task.completed ? 'done' : ''} onClick={() => toggleTask(task)} key={task.id}><span>{task.completed ? <Check size={14} /> : <Circle size={14} />}</span><div><strong>{task.title}</strong><small>{task.courseId.toUpperCase()} {task.dueDate && `· due ${task.dueDate}`}</small></div></button>)}</div></Card>
    <Card className="study-log"><SectionTitle title="Study log" meta="Turn effort into evidence" /><form onSubmit={logSession}><select name="courseId">{school.courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.title}</option>)}</select><input name="minutes" type="number" min="5" step="5" placeholder="Minutes" required /><input name="note" placeholder="What did you finish?" /><button className="primary-button">Log study session</button></form><div className="session-list">{school.sessions.slice().reverse().slice(0, 5).map((session) => <span key={session.id}><b>{session.minutes} min</b><small>{session.courseId.toUpperCase()} · {session.note || 'Study session'}</small></span>)}</div></Card>
    <Card className="graduation-card"><Pill tone="green"><GraduationCap size={12} /> Graduation path</Pill><h2>Keep the degree moving while building the life.</h2><p>Your study sessions become part of your OS context, so planning can protect the right course blocks.</p><Donut value={avgProgress} label={`${avgProgress}%`} sublabel="courses" /></Card></div></>;
}

function AssistantPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ from: 'ai', text: 'Generate a briefing and I will evaluate only the evidence recorded in your OS.' }]);
  const [status, setStatus] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [thinking, setThinking] = useState(false);
  const load = () => Promise.all([fetch('/api/status').then((response) => response.json()), fetch('/api/dashboard').then((response) => response.json())]).then(([nextStatus, nextDashboard]) => { setStatus(nextStatus); setDashboard(nextDashboard); });
  useEffect(() => { load().catch(() => setStatus({ ready: false })); }, []);
  const submit = async (event) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || thinking) return;
    setMessages((current) => [...current, { from: 'user', text: message }]);
    setInput(''); setThinking(true);
    try {
      const response = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessages((current) => [...current, { from: 'ai', text: result.reply }]);
      await load();
    } catch (error) { setMessages((current) => [...current, { from: 'ai', text: `I couldn't reach the intelligence service: ${error.message}` }]); }
    finally { setThinking(false); }
  };
  const generateBriefing = async () => {
    setThinking(true);
    try {
      const response = await fetch('/api/ai/briefing', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessages((current) => [...current, { from: 'ai', text: `Focus: ${result.data.recommended_focus} Avoid: ${result.data.recommended_avoidance} ${result.data.chief_of_staff_note}` }]);
      await load();
    } catch (error) {
      setMessages((current) => [...current, { from: 'ai', text: `Briefing failed: ${error.message}` }]);
    } finally { setThinking(false); }
  };
  const briefing = dashboard?.briefing;
  const plan = briefing?.today_plan || [];
  const finance = briefing?.finance_analysis || dashboard?.finance;
  return (
    <><PageHeader eyebrow="AI executive office" title={<>Chief of Staff<span className="title-dot">.</span></>} copy="Planning, accountability, risk detection, and operational guidance based only on your recorded data." action={<Pill tone={status?.ready ? 'green' : 'amber'}><Activity size={12} /> {status?.ready ? 'User data connected' : 'Data unavailable'}</Pill>} />
    <div className="chief-report-grid"><Card><Pill tone="blue">Current state</Pill><h3>{briefing?.summary || 'No briefing generated.'}</h3><p>{briefing ? `Generated ${new Date(briefing.created_at).toLocaleString()}` : 'Record data, then generate the current briefing.'}</p></Card><Card><Pill tone="amber">Primary risk</Pill><h3>{briefing?.current_risks?.[0]?.title || 'No risk identified.'}</h3><p>{briefing?.current_risks?.[0]?.reason || 'The system will not invent a risk without supporting data.'}</p></Card><Card><Pill tone="violet">Finance posture</Pill><h3>{finance?.runway_months != null || finance?.runwayMonths != null ? `${Number(finance.runway_months ?? finance.runwayMonths).toFixed(1)} months runway` : 'Runway unavailable'}</h3><p>{finance?.warning || 'Runway requires current cash and recorded spending.'}</p></Card></div>
    <div className="assistant-layout"><Card className="chat-card executive-console"><div className="chat-header"><span className="assistant-icon"><Sparkles size={20} /></span><span><strong>Executive command line</strong><small><i /> {status?.openai ? 'Chief of Staff online' : 'Local mode · add OpenAI key for full intelligence'}</small></span><Pill tone={status?.ready ? 'green' : 'amber'}>{status?.ready ? 'Learning' : 'Offline'}</Pill></div><div className="messages">{messages.map((message, index) => <div className={`message ${message.from}`} key={index}>{message.from === 'ai' && <span className="mini-ai"><Sparkles size={14} /></span>}<p>{message.text}</p></div>)}{thinking && <div className="message ai"><span className="mini-ai"><RefreshCw className="spin" size={14} /></span><p>Reviewing objectives, behavior, calendar, and risk…</p></div>}</div><div className="prompt-chips">{['Build my CEO plan', 'Where am I avoiding reality?', 'Forecast December', 'Run weekly review'].map((prompt) => <button key={prompt} onClick={() => setInput(prompt)}>{prompt}</button>)}</div><form className="chat-input" onSubmit={submit}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Issue a command, request a decision, or run a review…" /><button aria-label="Send" disabled={thinking}><Send size={17} /></button></form></Card>
    <div className="assistant-side"><Card><SectionTitle title="Today’s plan" meta={plan.length ? `${plan.length} priority actions` : 'No generated plan'} /><div className="plan-list">{plan.slice(0, 5).map((item, index) => <div key={`${item.task}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><i /><span><strong>{item.task}</strong><small>{item.priority} · {item.estimated_minutes} minutes</small></span></div>)}{!plan.length && <p className="plan-empty">Generate a briefing to build today’s evidence-based plan.</p>}</div><button className="primary-button full" onClick={generateBriefing} disabled={thinking}><Sparkles size={15} /> Generate current briefing</button></Card>
    <Card className="apple-sync-card"><span className="sms-icon"><ShieldAlert size={20} /></span><div><Pill tone="blue">Safety boundary</Pill><h3>Only recorded data.</h3><p>Missing evidence stays missing. Recommendations are operational guidance and never medical, legal, or financial certainty.</p></div></Card>
    <Card className="sms-card"><span className="sms-icon"><Activity size={20} /></span><div><h3>Execution readiness</h3><p>Calculated from current habits, objectives, task completion, and the latest daily check-in.</p></div><Pill tone={(dashboard?.executionReadiness || 0) >= 75 ? 'green' : 'amber'}>{dashboard?.executionReadiness ?? '—'} / 100</Pill></Card></div></div></>
  );
}

function App() {
  const initialPage = typeof window !== 'undefined' && navItems.some((item) => item.id === window.location.hash.slice(1)) ? window.location.hash.slice(1) : 'dashboard';
  const [page, setPageState] = useState(initialPage);
  const setPage = (nextPage) => { setPageState(nextPage); window.location.hash = nextPage; window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [habits, setHabits] = useState([]);
  const loadHabits = () => fetch('/api/habits').then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error); const monday = new Date(); monday.setHours(0, 0, 0, 0); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); const today = dateKey(); const icons = { meditation: Flower2, coding: Code2, lifting: Dumbbell, running: Footprints, yoga: HeartPulse, create: Clapperboard, budget: CircleDollarSign }; setHabits((result.data || []).map((habit) => ({ ...habit, icon: Object.entries(icons).find(([key]) => habit.name.toLowerCase().includes(key))?.[1] || Repeat2, streak: habit.streak || 0, rate: habit.weeklyConsistency || 0, doneToday: (habit.logs || []).some((log) => log.logged_on === today && log.completed), week: Array.from({ length: 7 }, (_, index) => { const date = new Date(monday); date.setDate(date.getDate() + index); return Number((habit.logs || []).some((log) => log.logged_on === dateKey(date) && log.completed)); }) }))); });
  useEffect(() => { loadHabits().catch(() => setHabits([])); fetch('/api/profile').then((response) => response.json()).then((result) => setProfile(result.data ? { ...result.data, preferences: result.preferences || null } : null)).catch(() => setProfile(null)); }, []);
  const toggleHabit = async (id) => { const response = await fetch(`/api/habits/${id}/toggle`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logged_on: dateKey() }) }); const result = await response.json().catch(() => ({})); toast(response.ok ? (result.completed ? 'Habit completed today' : 'Habit completion removed') : 'Something went wrong', response.ok ? 'success' : 'error'); if (response.ok) loadHabits(); };
  const Page = useMemo(() => ({ dashboard: <Dashboard habits={habits} toggleHabit={toggleHabit} />, goals: <GoalsPage />, habits: <HabitsPage habits={habits} toggleHabit={toggleHabit} reloadHabits={loadHabits} />, money: <MoneyPage />, mood: <MoodPage />, travel: <TravelPage />, content: <ContentPage />, relationships: <RelationshipsPage />, insights: <InsightsPage />, assistant: <AssistantPage />, timeline: <TimelinePage />, settings: <SettingsPage />, school: <SchoolPage /> })[page], [page, habits]);

  return (
    <div className="app-shell" data-theme={profile?.preferences?.theme || 'default'} data-font={profile?.preferences?.font_style || 'default'} data-density={profile?.preferences?.density || 'comfortable'} data-motion={profile?.preferences?.motion || 'full'} style={{ '--mint': profile?.preferences?.accent_color || '#a7f3d0' }}>
      <div className="liquid-backdrop" aria-hidden="true">
        <span className="liquid-orb orb-one" />
        <span className="liquid-orb orb-two" />
        <span className="liquid-orb orb-three" />
        <span className="liquid-noise" />
      </div>
      <Sidebar page={page} setPage={setPage} profile={profile} />
      <div className="app-main">
        <Topbar page={page} appName={profile?.preferences?.app_name || (profile?.display_name ? `${profile.display_name} OS` : 'You OS')} />
        <main className="page-content" key={page}>{Page}</main>
      </div>
      <BottomNav page={page} setPage={setPage} onMore={() => setMobileMoreOpen(true)} />
      {mobileMoreOpen && <MobileMoreMenu page={page} setPage={setPage} onClose={() => setMobileMoreOpen(false)} appName={profile?.preferences?.app_name || (profile?.display_name ? `${profile.display_name} OS` : 'You OS')} />}
      <ToastCenter />
    </div>
  );
}

export default App;
