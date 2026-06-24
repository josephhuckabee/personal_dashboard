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

// Starter profile values; live finance, receipts, calendar, learning, and assistant data come from the local API.
const goals = [
  { title: 'Graduate from WGU', category: 'Career', progress: 68, status: 'On Track', color: 'violet', icon: GraduationCap, focus: 'Complete Data Management Applications', milestone: '14 of 21 courses complete', forecast: 'December 8, 2026', risk: 'Assessment pace is the main variable' },
  { title: 'Build sustainable remote income', category: 'Finance', progress: 42, status: 'At Risk', color: 'amber', icon: BriefcaseBusiness, focus: 'Five qualified outreach messages', milestone: '$2,100 / $5,000 monthly', forecast: 'February 2027', risk: 'Pipeline activity is 22% below plan' },
  { title: 'Improve physical health', category: 'Health', progress: 76, status: 'On Track', color: 'green', icon: Dumbbell, focus: '3 lifts + 2 runs', milestone: '16 week consistency streak', forecast: 'Target weight by November', risk: 'Sleep drops after travel transitions' },
  { title: 'Build inner peace', category: 'Mind', progress: 84, status: 'On Track', color: 'rose', icon: Flower2, focus: '20 minutes before screens', milestone: '46 consecutive meditation days', forecast: '100-day streak in August', risk: 'Evening practice has lower adherence' },
  { title: 'Explore the world', category: 'Adventure', progress: 35, status: 'On Track', color: 'blue', icon: Globe2, focus: 'Confirm Vietnam route', milestone: '2 of 7 Wonders visited', forecast: 'One year abroad · May 2027', risk: 'Visa timing needs review' },
];

const initialHabits = [
  { id: 1, name: 'Meditation', icon: Flower2, streak: 46, rate: 93, week: [1, 1, 1, 1, 1, 1, 0] },
  { id: 2, name: 'Coding', icon: Code2, streak: 18, rate: 86, week: [1, 1, 1, 0, 1, 1, 0] },
  { id: 3, name: 'Lifting', icon: Dumbbell, streak: 4, rate: 71, week: [1, 0, 1, 0, 1, 0, 0] },
  { id: 4, name: 'Running', icon: Footprints, streak: 2, rate: 64, week: [0, 1, 0, 0, 1, 0, 0] },
  { id: 5, name: 'Yoga', icon: HeartPulse, streak: 7, rate: 79, week: [1, 0, 1, 1, 0, 1, 0] },
  { id: 6, name: 'Create', icon: Clapperboard, streak: 3, rate: 57, week: [1, 0, 0, 1, 1, 0, 0] },
  { id: 7, name: 'Budget check', icon: CircleDollarSign, streak: 12, rate: 88, week: [1, 1, 1, 1, 1, 1, 0] },
];

const transactions = [
  { name: 'Client retainer', category: 'Remote income', amount: 1200, date: 'Today', positive: true },
  { name: 'Seoul guesthouse deposit', category: 'Travel', amount: -342, date: 'Yesterday' },
  { name: 'Whole Foods Market', category: 'Food', amount: -76.42, date: 'Jun 22' },
  { name: 'WGU tuition reserve', category: 'Education', amount: -210, date: 'Jun 20' },
  { name: 'Video editing project', category: 'Freelance', amount: 650, date: 'Jun 19', positive: true },
];

const contentIdeas = [
  { title: 'Why I’m leaving NYC for Seoul', pillar: 'reinvention', status: 'editing', date: 'Jun 27' },
  { title: 'My $3k/month travel runway system', pillar: 'remote income', status: 'filming', date: 'Jun 29' },
  { title: 'Training for a year on the road', pillar: 'fitness', status: 'script', date: 'Jul 02' },
  { title: 'A quiet morning in Seoul', pillar: 'peace', status: 'idea', date: 'Jul 05' },
  { title: 'The honest cost of starting over', pillar: 'travel', status: 'posted', date: 'Jun 21' },
];

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

function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => setPage('dashboard')}>
        <span className="brand-mark">J</span>
        <span><strong>Joseph OS</strong><small>Life, by design</small></span>
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
        <p>Current chapter</p><strong>Seoul, South Korea</strong>
        <span>Day 17 · Year of Reinvention</span>
        <ProgressBar value={5} tone="blue" />
      </div>
      <div className="profile-row">
        <span className="avatar">JH</span>
        <span><strong>Joseph</strong><small>CEO · Year of Reinvention</small></span>
        <MoreHorizontal size={18} />
      </div>
    </aside>
  );
}

function Topbar({ page }) {
  const current = navItems.find((item) => item.id === page);
  return (
    <div className="topbar">
      <div className="mobile-brand"><span className="brand-mark">J</span><strong>Joseph OS</strong></div>
      <div className="breadcrumb"><span>Joseph OS</span><ChevronRight size={14} /><strong>{current?.label}</strong></div>
      <div className="top-actions">
        <button className="icon-button" aria-label="Search"><Search size={18} /></button>
        <button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button>
        <span className="date-chip"><CalendarDays size={15} /> Mon, Jun 24</span>
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

function MobileMoreMenu({ page, setPage, onClose }) {
  return (
    <div className="mobile-more-backdrop" onClick={onClose}>
      <div className="mobile-more-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="mobile-more-title">
          <span><strong>Explore Joseph OS</strong><small>Every part of your operating system</small></span>
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
  const calendarUrl = typeof window === 'undefined' ? '' : `webcal://${window.location.host}/calendar/joseph-os.ics`;
  return (
    <Card className="calendar-card span-8">
      <SectionTitle title="Calendar" meta="Joseph OS · synced plan" action={<a className="text-button" href={calendarUrl}><Apple size={14} /> Apple Calendar</a>} />
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
  const [finance, setFinance] = useState(null);
  useEffect(() => { fetch('/api/finance').then((response) => response.json()).then((result) => setFinance(result.snapshot)).catch(() => setFinance(null)); }, []);
  const dashboardMoney = (value = 0) => `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return (
    <>
      <PageHeader eyebrow="Monday, June 24 · Seoul · 9:42 AM" title={<>Command Center<span className="title-dot">.</span></>} copy="Year of Reinvention · Day 17 of 365. Are you becoming the person you said you wanted to become?" action={<Pill tone="green"><Activity size={12} /> Systems online</Pill>} />
      <Card className="morning-brief-card">
        <div className="brief-intro"><Pill tone="blue">Morning brief · Seoul</Pill><h2>Good morning, Joseph.</h2><p>You’re building momentum in health and school. Remote income is the constraint. Today is not about doing more—it’s about protecting the three actions with the highest return.</p><div className="brief-status"><span><small>Overall status</small><strong>ON TRACK</strong></span><span><small>Day abroad</small><strong>17 / 365</strong></span><span><small>Days remaining</small><strong>348</strong></span></div></div>
        <div className="life-score-ring"><Donut value={78} label="78" sublabel="life score" /><span><TrendingUp size={13} /> +4 this week</span></div>
        <div className="roi-actions"><p>Today’s highest ROI actions</p>{[['01', 'Complete WGU data module', 'Career'], ['02', 'Send 5 income outreach messages', 'Income'], ['03', 'Strength session + 8k steps', 'Health']].map(([number, title, area]) => <div key={number}><b>{number}</b><span><strong>{title}</strong><small>{area}</small></span><Circle size={17} /></div>)}</div>
      </Card>
      <div className="metric-grid">
        <MetricCard label="Current location" value="Seoul" detail="South Korea · 26°C" icon={MapPin} tone="blue" />
        <MetricCard label="Objective health" value="3 / 5" detail="2 objectives at risk" icon={Target} tone="violet" />
        <MetricCard label="Daily score" value="84" detail="Study · workout · budget" icon={Activity} tone="green" />
        <MetricCard label="Travel runway" value={finance ? `${finance.runway.toFixed(1)} mo` : '—'} detail="Live from receipt tracking" icon={Wallet} tone="amber" />
      </div>

      <div className="dashboard-grid">
        <Card className="executive-signal-card span-4"><SectionTitle title="Current risks" meta="Requires executive attention" action={<ShieldAlert size={19} />} /><div className="signal-list"><div className="risk"><b>Remote income</b><span>22% behind June target</span><Pill tone="amber">At risk</Pill></div><div className="risk"><b>Travel burn</b><span>Food spend trending 12% high</span><Pill tone="amber">Watch</Pill></div><div><b>WGU pace</b><span>7-day buffer remains</span><Pill tone="green">Healthy</Pill></div></div></Card>
        <Card className="executive-signal-card span-4"><SectionTitle title="Opportunities" meta="High-leverage openings" action={<Lightbulb size={19} />} /><div className="signal-list"><div><b>Seoul creator meetup</b><span>Thursday · 18 relevant contacts</span><Pill tone="blue">Network</Pill></div><div><b>UGC travel brief</b><span>$650 potential campaign</span><Pill tone="green">Income</Pill></div><div><b>Morning study window</b><span>31% higher completion before noon</span><Pill tone="violet">Pattern</Pill></div></div></Card>
        <Card className="runway-card span-4"><SectionTitle title="Finance posture" meta="Current cash + runway" /><div className="runway-content"><Donut value={Math.min(100, (finance?.runway || 0) / 12 * 100)} label={finance ? finance.runway.toFixed(1) : '—'} sublabel="months" /><div><Pill tone={(finance?.runway || 0) >= 6 ? 'green' : 'amber'}>{(finance?.runway || 0) >= 6 ? 'Sustainable' : 'Protect runway'}</Pill><strong>{finance ? dashboardMoney(finance.currentCash) : '$12,000'}</strong><span>current cash</span></div></div><div className="runway-stats"><span><small>Monthly burn</small><b>{finance ? dashboardMoney(finance.burnRate) : '$1,875'}</b></span><span><small>Exhaustion forecast</small><b>January</b></span></div></Card>

        <CalendarPreview />

        <Card className="habits-preview span-4">
          <SectionTitle title="Transformation inputs" meta="Habits powering objectives" action={<Flame size={20} className="flame" />} />
          <div className="habit-mini-list">
            {habits.slice(0, 5).map((habit) => { const Icon = habit.icon; return <button key={habit.id} onClick={() => toggleHabit(habit.id)}><span className={`habit-check ${habit.week[6] ? 'done' : ''}`}>{habit.week[6] ? <Check size={13} /> : <Icon size={15} />}</span><span><strong>{habit.name}</strong><small>{habit.streak} day streak</small></span><ProgressBar value={habit.rate} tone={habit.rate > 80 ? 'green' : 'violet'} /></button>; })}
          </div>
        </Card>

        <Card className="assistant-card span-12" tone="assistant">
          <div className="assistant-icon"><WandSparkles size={24} /></div>
          <div className="assistant-copy"><Pill tone="violet">Chief of Staff note</Pill><h2>You are ahead on fitness and behind on income.</h2><p>Do not reward healthy momentum by avoiding the uncomfortable work. Finish the WGU module, then use your best cognitive window for direct income outreach. Content comes after the pipeline.</p><div className="assistant-actions"><button className="primary-button">Accept today’s plan</button><button className="subtle-button">Adjust priorities</button></div></div>
          <div className="focus-score"><span>Execution readiness</span><strong>86</strong><small>High-leverage day</small></div>
        </Card>
      </div>
    </>
  );
}

function GoalsPage() {
  return (
    <><PageHeader eyebrow="Transformation portfolio" title={<>Objectives & key results<span className="title-dot">.</span></>} copy="Five outcomes define the Year of Reinvention. Habits, calendar blocks, and evidence update their health over time." action={<button className="primary-button"><Plus size={17} /> New objective</button>} />
    <div className="summary-strip"><span><strong>5</strong> primary objectives</span><span><strong>61%</strong> weighted progress</span><span><strong>4</strong> on track</span><span><strong>1</strong> at risk</span></div>
    <div className="goals-grid objective-grid">{goals.map((goal) => { const Icon = goal.icon; return <Card className="goal-card objective-card" key={goal.title}><div className="goal-top"><span className={`goal-icon ${goal.color}`}><Icon size={20} /></span><Pill tone={goal.status === 'At Risk' ? 'amber' : 'green'}>{goal.status}</Pill></div><p className="goal-category">{goal.category}</p><h2>{goal.title}</h2><div className="progress-label"><span>Objective progress</span><strong>{goal.progress}%</strong></div><ProgressBar value={goal.progress} tone={goal.color} /><div className="goal-detail"><small>Key result</small><strong>{goal.milestone}</strong></div><div className="objective-meta"><span><small>Completion forecast</small><b>{goal.forecast}</b></span><span><small>Risk analysis</small><b>{goal.risk}</b></span></div><div className="weekly-focus"><Zap size={14} /><span><small>Chief of Staff recommendation</small><strong>{goal.focus}</strong></span></div></Card>; })}</div>
    <Card className="goal-health-card"><SectionTitle title="Portfolio health" meta="Transformation is balanced, but income is the bottleneck" /><div className="health-layout"><Donut value={74} label="74" sublabel="health" /><div className="health-copy"><h3>Your identity change is ahead of your financial transition.</h3><p>Fitness and meditation prove your consistency. Apply the same repetition to income activity: five high-quality outreaches before content work, three days this week.</p><button className="text-button">Accept recommendation <ArrowUpRight size={15} /></button></div><MiniBars values={[58, 62, 61, 66, 69, 72, 74]} /></div></Card></>
  );
}

function HabitsPage({ habits, toggleHabit }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <><PageHeader eyebrow="Consistency engine" title={<>Daily habits<span className="title-dot">.</span></>} copy="Small proof, repeated. Your weekly completion rate is 77%." action={<button className="primary-button"><Plus size={17} /> Add habit</button>} />
    <div className="metric-grid compact"><MetricCard label="Current streak" value="46 days" detail="Meditation" icon={Flame} tone="amber" /><MetricCard label="Weekly rate" value="77%" trend="+8% vs last week" icon={TrendingUp} tone="green" /><MetricCard label="Done today" value={`${habits.filter((h) => h.week[6]).length} / 7`} detail="Keep the chain alive" icon={CircleCheck} tone="violet" /><MetricCard label="Perfect days" value="12" detail="This month" icon={Sparkles} tone="blue" /></div>
    <Card className="habit-table-card"><SectionTitle title="This week" meta="June 24–30" action={<div className="date-arrows"><button><ChevronLeft size={17} /></button><button>Today</button><button><ChevronRight size={17} /></button></div>} />
      <div className="habit-table"><div className="habit-table-head"><span>Habit</span>{days.map((day, i) => <span key={`${day}${i}`}>{day}</span>)}<span>Streak</span><span>Rate</span></div>{habits.map((habit) => { const Icon = habit.icon; return <div className="habit-row" key={habit.id}><span className="habit-name"><i><Icon size={16} /></i><strong>{habit.name}</strong></span>{habit.week.map((done, index) => <button aria-label={`${habit.name} ${days[index]}`} onClick={() => index === 6 && toggleHabit(habit.id)} className={`${done ? 'complete' : ''} ${index === 6 ? 'today-cell' : ''}`} key={index}>{done ? <Check size={14} /> : <Circle size={14} />}</button>)}<span className="streak"><Flame size={14} /> {habit.streak}</span><span>{habit.rate}%</span></div>; })}</div>
    </Card></>
  );
}

function MoneyPage() {
  const [data, setData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const load = async () => {
    const response = await fetch('/api/finance');
    setData(await response.json());
  };
  useEffect(() => { load().catch(() => setNotice('The local finance service is not responding.')); }, []);
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
      setNotice(result.receipt.status === 'ready' ? `Tracked ${result.receipt.merchant} · $${Number(result.receipt.total).toFixed(2)}` : 'Receipt saved. Add your OpenAI key for automatic reading, or review it below.');
      await load();
    } catch (error) { setNotice(error.message); }
    finally { setUploading(false); event.target.value = ''; }
  };
  const saveReview = async (event, receipt) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(`/api/receipts/${receipt.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
    const result = await response.json();
    setNotice(response.ok ? 'Receipt corrected. Joseph OS will use that pattern next time.' : result.error);
    if (response.ok) await load();
  };
  const snapshot = data?.snapshot;
  const receipts = data?.receipts || [];
  const recentTransactions = (data?.transactions || []).slice(0, 7);
  const money = (value = 0) => `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return (
    <><PageHeader eyebrow="Receipt intelligence" title={<>Money, without bookkeeping<span className="title-dot">.</span></>} copy="Drop in a receipt photo or screenshot. Joseph OS reads it, categorizes it, updates your runway, and learns from every correction." action={<label className={`primary-button receipt-upload-button ${uploading ? 'disabled' : ''}`}><Upload size={17} /> {uploading ? 'Reading…' : 'Upload receipt'}<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={uploadReceipt} disabled={uploading} /></label>} />
    {notice && <div className="system-notice"><Sparkles size={15} /> {notice}</div>}
    <div className="metric-grid"><MetricCard label="Available cash" value={snapshot ? money(snapshot.currentCash) : '—'} detail="Updates with every receipt" icon={Wallet} tone="green" /><MetricCard label="Spent this month" value={snapshot ? money(snapshot.spent) : '—'} detail="From real receipt data" icon={ReceiptText} tone="amber" /><MetricCard label="Income this month" value={snapshot ? money(snapshot.earned) : '—'} detail="Add income by text soon" icon={BadgeDollarSign} tone="blue" /><MetricCard label="Travel runway" value={snapshot ? `${snapshot.runway.toFixed(1)} months` : '—'} detail="Live cash ÷ monthly burn" icon={Plane} tone="violet" /></div>
    <div className="two-col-layout receipt-layout"><Card className="receipt-drop-card"><SectionTitle title="Receipt inbox" meta={`${receipts.length} stored locally`} action={<button className="icon-button" onClick={load} aria-label="Refresh receipts"><RefreshCw size={16} /></button>} />
      {!receipts.length && <label className="receipt-drop-zone"><Upload size={27} /><strong>Drop your first receipt here</strong><span>Photo, screenshot, HEIC, PNG, or JPG · up to 12 MB</span><input type="file" accept="image/*" onChange={uploadReceipt} /></label>}
      <div className="receipt-grid">{receipts.slice(0, 8).map((receipt) => <article className="receipt-item" key={receipt.id}><img src={`/receipt-files/${receipt.file}`} alt={receipt.merchant || 'Uploaded receipt'} /><div><Pill tone={receipt.status === 'ready' ? 'green' : 'amber'}>{receipt.status === 'ready' ? 'Tracked' : 'Review'}</Pill><strong>{receipt.merchant || 'Unreviewed receipt'}</strong><span>{receipt.date || new Date(receipt.uploadedAt).toLocaleDateString()} {receipt.total ? `· ${money(receipt.total)}` : ''}</span></div>{receipt.status !== 'ready' && <form className="receipt-review" onSubmit={(event) => saveReview(event, receipt)}><input name="merchant" placeholder="Merchant" required /><input name="total" type="number" step=".01" placeholder="Total" required /><input name="date" type="date" required /><select name="category"><option>Food</option><option>Travel</option><option>Transport</option><option>Health</option><option>Education</option><option>Other</option></select><button>Track receipt</button></form>}</article>)}</div>
    </Card>
    <Card className="budget-brain-card"><Pill tone="blue"><Brain size={12} /> Budget intelligence</Pill><h2>{data?.insight || 'Building your financial baseline…'}</h2><p>Friday budget pulses and threshold alerts are sent by SMS when Twilio is connected. Every receipt and correction improves categorization.</p><div className="budget-categories">{snapshot && Object.entries(snapshot.categoryBudgets).map(([category, budget]) => { const spent = snapshot.byCategory[category] || 0; return <div key={category}><span><b>{category}</b><small>{money(spent)} / {money(budget)}</small></span><ProgressBar value={Math.min(100, spent / budget * 100)} tone={spent > budget ? 'amber' : 'green'} /></div>; })}</div></Card></div>
    <Card className="transactions-card"><SectionTitle title="Tracked transactions" meta="Created from your uploads" /><div className="transaction-list">{recentTransactions.length ? recentTransactions.map((item) => <div key={item.id}><span className={`transaction-icon ${item.type === 'income' ? 'positive-bg' : ''}`}>{item.type === 'income' ? <ArrowUpRight size={17} /> : <ReceiptText size={17} />}</span><span><strong>{item.merchant || item.description}</strong><small>{item.category} · {new Date(item.date).toLocaleDateString()}</small></span><b className={item.type === 'income' ? 'positive' : ''}>{item.type === 'income' ? '+' : '-'}{money(item.amount)}</b></div>) : <div className="empty-transaction"><ReceiptText size={18} /> Your uploaded receipts will appear here.</div>}</div></Card></>
  );
}

function MoodPage() {
  const [wellbeing, setWellbeing] = useState({ moodEntries: [], gratitude: [] });
  const [saved, setSaved] = useState('');
  const load = () => fetch('/api/wellbeing').then((response) => response.json()).then(setWellbeing);
  useEffect(() => { load().catch(() => {}); }, []);
  const saveMood = async (event) => { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); await fetch('/api/wellbeing/mood', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); setSaved('Today’s full rhythm is saved.'); load(); };
  const saveGratitude = async (event) => { event.preventDefault(); const form = event.currentTarget; const text = new FormData(form).get('text'); await fetch('/api/wellbeing/gratitude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }); form.reset(); load(); };
  const latest = wellbeing.moodEntries[0];
  return (
    <><PageHeader eyebrow="Daily rhythms" title={<>Mood, sleep & fuel<span className="title-dot">.</span></>} copy="Track the inputs around your mood—not just the mood itself. Joseph OS learns which routines actually change how your days feel." />
    <div className="metric-grid"><MetricCard label="Wake mood" value={latest ? `${latest.wakeMood}/5` : '—'} detail="How the day began" icon={Sun} tone="amber" /><MetricCard label="Bed mood" value={latest ? `${latest.bedMood}/5` : '—'} detail="How the day landed" icon={Moon} tone="violet" /><MetricCard label="Sleep" value={latest ? `${latest.sleepHours}h` : '—'} detail={latest ? `${latest.sleepQuality}/5 quality` : 'Hours + quality'} icon={BedDouble} tone="blue" /><MetricCard label="Diet" value={latest?.diet || '—'} detail="Food quality + consistency" icon={Utensils} tone="green" /></div>
    <div className="two-col-layout wellbeing-layout"><Card className="wellbeing-form-card"><SectionTitle title="Daily check-in" meta="One honest minute" /><form className="wellbeing-form" onSubmit={saveMood}><label>Date<input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label>Wake mood<select name="wakeMood" defaultValue="3"><option value="1">1 · Heavy</option><option value="2">2 · Low</option><option value="3">3 · Neutral</option><option value="4">4 · Good</option><option value="5">5 · Strong</option></select></label><label>Bed mood<select name="bedMood" defaultValue="4"><option value="1">1 · Heavy</option><option value="2">2 · Low</option><option value="3">3 · Neutral</option><option value="4">4 · Good</option><option value="5">5 · Strong</option></select></label><label>Sleep hours<input name="sleepHours" type="number" min="0" max="14" step=".25" defaultValue="7.5" required /></label><label>Sleep quality<select name="sleepQuality" defaultValue="4"><option value="1">1 · Poor</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5 · Restorative</option></select></label><label>Diet<select name="diet" defaultValue="balanced"><option value="clean">Clean</option><option value="balanced">Balanced</option><option value="mixed">Mixed</option><option value="off-plan">Off plan</option></select></label><label>Energy<input name="energy" type="range" min="1" max="5" defaultValue="4" /></label><label>Stress<input name="stress" type="range" min="1" max="5" defaultValue="2" /></label><label className="full-field">What affected you today?<textarea name="note" placeholder="Training, people, food, work, travel, sleep…" /></label><button className="primary-button full-field">Save daily rhythm</button></form>{saved && <p className="form-success"><Check size={13} /> {saved}</p>}</Card>
    <Card className="gratitude-card"><SectionTitle title="Gratitude memory" meta="A different text time every day" /><div className="gratitude-prompt"><Sparkles size={23} /><h2>What is one thing you’re grateful for right now?</h2><p>Not the polished answer. The first true thing.</p><form onSubmit={saveGratitude}><input name="text" placeholder="In this moment, I’m grateful for…" required /><button><Send size={15} /></button></form></div><div className="gratitude-history">{wellbeing.gratitude.slice(0, 5).map((entry) => <blockquote key={entry.id}>“{entry.text}”<small>{new Date(entry.createdAt).toLocaleDateString()}</small></blockquote>)}</div><p className="integration-note"><MessageSquareText size={14} /> Daily SMS time is randomized; past answers return later as grounded reminders.</p></Card></div></>
  );
}

function TravelPage() {
  const [items, setItems] = useState([]);
  const [notice, setNotice] = useState('');
  const [uploading, setUploading] = useState(false);
  const load = () => fetch('/api/travel').then((response) => response.json()).then((result) => setItems(result.items || []));
  useEffect(() => { load().catch(() => {}); }, []);
  const uploadBooking = async (event) => { const file = event.target.files?.[0]; if (!file) return; setUploading(true); const form = new FormData(); form.append('travel', file); const response = await fetch('/api/travel/upload', { method: 'POST', body: form }); const result = await response.json(); setNotice(response.ok ? (result.item.status === 'ready' ? 'Booking read and filed by date.' : 'Screenshot saved. Review the details below.') : result.error); setUploading(false); event.target.value = ''; load(); };
  const saveTravel = async (event, item) => { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); await fetch(`/api/travel/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); setNotice('Travel item organized.'); load(); };
  return (
    <><PageHeader eyebrow="Travel operations" title={<>Every booking, in order<span className="title-dot">.</span></>} copy="Upload hotel, Airbnb, pet sit, flight, train, taxi, and activity screenshots. Joseph OS extracts the details and builds one dated trip timeline." action={<label className="primary-button receipt-upload-button"><Upload size={17} /> {uploading ? 'Reading…' : 'Upload booking'}<input type="file" accept="image/*" onChange={uploadBooking} disabled={uploading} /></label>} />
    {notice && <div className="system-notice"><Sparkles size={15} /> {notice}</div>}
    <Card className="travel-inbox-card"><SectionTitle title="Travel inbox" meta={`${items.length} organized items`} />{!items.length && <label className="receipt-drop-zone"><Hotel size={28} /><strong>Drop a travel confirmation</strong><span>Hotels, Airbnb, pet sits, flights, taxis, trains, or activities</span><input type="file" accept="image/*" onChange={uploadBooking} /></label>}<div className="travel-timeline">{items.map((item) => <article key={item.id}><div className="timeline-date"><strong>{item.startDate ? new Date(`${item.startDate}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Review'}</strong><span>{item.endDate ? `to ${new Date(`${item.endDate}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : ''}</span></div><img src={`/travel-files/${item.file}`} alt="Travel confirmation" /><div className="travel-item-copy"><Pill tone={item.status === 'ready' ? 'blue' : 'amber'}>{item.type || 'Unfiled'}</Pill><h3>{item.title || item.provider || 'Review this booking'}</h3><p>{[item.location, item.provider, item.confirmationNumber && `Confirmation ${item.confirmationNumber}`].filter(Boolean).join(' · ') || 'Add the details once; Joseph OS learns the pattern.'}</p>{item.cost && <strong>{item.currency || '$'} {item.cost}</strong>}</div>{item.status !== 'ready' && <form className="travel-review-form" onSubmit={(event) => saveTravel(event, item)}><input name="title" placeholder="Booking title" required /><select name="type"><option value="hotel">Hotel</option><option value="airbnb">Airbnb</option><option value="pet-sit">Pet sit</option><option value="flight">Flight</option><option value="train">Train</option><option value="taxi">Taxi</option><option value="activity">Activity</option><option value="other">Other</option></select><input name="location" placeholder="Location" /><input name="provider" placeholder="Provider" /><input name="startDate" type="date" required /><input name="endDate" type="date" /><input name="confirmationNumber" placeholder="Confirmation #" /><input name="cost" type="number" step=".01" placeholder="Cost" /><button>Organize booking</button></form>}</article>)}</div></Card>
    <div className="travel-grid"><Card className="span-4"><SectionTitle title="Coming up" meta="Next confirmed item" /><div className="next-travel-item">{items.find((item) => item.status === 'ready') ? <><Plane size={24} /><strong>{items.find((item) => item.status === 'ready').title}</strong><span>{items.find((item) => item.status === 'ready').startDate}</span></> : <><Luggage size={24} /><strong>No confirmed bookings yet</strong><span>Upload one above</span></>}</div></Card><Card className="span-4"><SectionTitle title="Visa watch" meta="Know before you go" /><div className="visa-list"><span><b>🇰🇷 South Korea</b><Pill tone="green">90 days</Pill></span><span><b>🇯🇵 Japan</b><Pill tone="green">90 days</Pill></span><span><b>🇹🇭 Thailand</b><Pill tone="amber">60 days</Pill></span></div></Card><Card className="span-4"><SectionTitle title="Seven Wonders" meta="2 of 7 experienced" /><div className="wonders"><span className="visited">Machu Picchu <Check size={13} /></span><span className="visited">Colosseum <Check size={13} /></span><span>Petra</span><span>Taj Mahal</span><span>Great Wall</span></div></Card></div></>
  );
}

function ContentPage() {
  const [active, setActive] = useState('ideas');
  const [studio, setStudio] = useState({ ideas: [], checklist: [], contacts: [] });
  const load = () => fetch('/api/content').then((response) => response.json()).then(setStudio);
  useEffect(() => { load().catch(() => {}); }, []);
  const addItem = async (event, collection) => { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); if (collection === 'checklist') body.completed = false; await fetch(`/api/content/${collection}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); event.currentTarget.reset(); load(); };
  const toggleChecklist = async (item) => { await fetch(`/api/content/checklist/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !item.completed }) }); load(); };
  return (
    <><PageHeader eyebrow="Creator operating system" title={<>Content studio<span className="title-dot">.</span></>} copy="Ideas, production checklists, UGC opportunities, brand contacts, and publishing work in one system." />
    <div className="metric-grid compact"><MetricCard label="Ideas" value={studio.ideas.length} detail="Captured concepts" icon={Sparkles} tone="violet" /><MetricCard label="Open tasks" value={studio.checklist.filter((item) => !item.completed).length} detail="Production checklist" icon={CircleCheck} tone="amber" /><MetricCard label="Contacts" value={studio.contacts.length} detail="Brands + creators" icon={BriefcaseBusiness} tone="blue" /><MetricCard label="Completed" value={studio.checklist.filter((item) => item.completed).length} detail="Assets shipped" icon={TrendingUp} tone="green" /></div>
    <div className="studio-tabs">{[['ideas', 'Ideas'], ['checklist', 'Production checklist'], ['contacts', 'Contacts + UGC']].map(([id, label]) => <button className={active === id ? 'active' : ''} onClick={() => setActive(id)} key={id}>{label}</button>)}</div>
    <Card className="studio-workspace">{active === 'ideas' && <><SectionTitle title="Idea vault" meta="Capture before you judge" /><form className="studio-add-form" onSubmit={(event) => addItem(event, 'ideas')}><input name="title" placeholder="Video or campaign idea" required /><select name="pillar"><option>Reinvention</option><option>Travel</option><option>Remote income</option><option>Fitness</option><option>Peace</option><option>UGC</option></select><select name="format"><option>Short form</option><option>Long form</option><option>Carousel</option><option>UGC ad</option><option>Newsletter</option></select><textarea name="hook" placeholder="Hook, angle, or rough notes…" /><button className="primary-button">Save idea</button></form><div className="studio-card-grid">{studio.ideas.map((item) => <article key={item.id}><Pill tone="violet">{item.format || 'Idea'}</Pill><h3>{item.title}</h3><p>{item.hook || 'No notes yet.'}</p><span>{item.pillar}</span></article>)}</div></>}
    {active === 'checklist' && <><SectionTitle title="Production checklist" meta="Reusable execution queue" /><form className="studio-add-form compact-form" onSubmit={(event) => addItem(event, 'checklist')}><input name="title" placeholder="Script hook, film B-roll, send invoice…" required /><select name="stage"><option>Pre-production</option><option>Filming</option><option>Editing</option><option>Publishing</option><option>Admin</option></select><input name="dueDate" type="date" /><button className="primary-button">Add task</button></form><div className="studio-checklist">{studio.checklist.map((item) => <button className={item.completed ? 'done' : ''} onClick={() => toggleChecklist(item)} key={item.id}><span>{item.completed ? <Check size={14} /> : <Circle size={14} />}</span><strong>{item.title}</strong><small>{item.stage} {item.dueDate && `· ${item.dueDate}`}</small></button>)}</div></>}
    {active === 'contacts' && <><SectionTitle title="Contacts + UGC CRM" meta="Relationships, pitches, and paid opportunities" /><form className="studio-add-form" onSubmit={(event) => addItem(event, 'contacts')}><input name="name" placeholder="Brand or contact name" required /><input name="email" type="email" placeholder="Email" /><select name="type"><option>Brand</option><option>Creator</option><option>Agency</option><option>UGC lead</option><option>Client</option></select><select name="status"><option>Researching</option><option>Ready to pitch</option><option>Pitched</option><option>Negotiating</option><option>Active</option></select><textarea name="notes" placeholder="Rates, relationship, campaign idea…" /><button className="primary-button">Save contact</button></form><div className="contact-list">{studio.contacts.map((item) => <article key={item.id}><span className="avatar">{item.name?.slice(0, 2).toUpperCase()}</span><div><strong>{item.name}</strong><small>{item.type} · {item.email || 'No email'}</small></div><Pill tone={item.status === 'Active' ? 'green' : 'blue'}>{item.status}</Pill><p>{item.notes}</p></article>)}</div></>}</Card></>
  );
}

function RelationshipsPage() {
  const people = [
    { name: 'Sarah Kim', type: 'Travel friend', last: '72 days ago', health: 58, note: 'Met in Lisbon · now in Busan', action: 'Reach out' },
    { name: 'Marcus Reed', type: 'Recruiter', last: '14 days ago', health: 71, note: 'Software engineering roles', action: 'Follow up' },
    { name: 'Mina Park', type: 'Creator', last: '3 days ago', health: 91, note: 'Seoul collaboration idea', action: 'Schedule' },
    { name: 'Northstar Travel', type: 'Brand', last: '21 days ago', health: 64, note: 'UGC campaign · $650 brief', action: 'Pitch' },
    { name: 'Daniel Ortiz', type: 'Client', last: '8 days ago', health: 84, note: 'Retainer renewal in July', action: 'Check in' },
  ];
  return <><PageHeader eyebrow="Personal CRM" title={<>Relationships compound<span className="title-dot">.</span></>} copy="A life transformation needs people: friends, recruiters, clients, brands, collaborators, and the travel community around you." action={<button className="primary-button"><Plus size={16} /> Add relationship</button>} />
    <div className="metric-grid"><MetricCard label="Active relationships" value="42" detail="Across six circles" icon={Users} tone="blue" /><MetricCard label="Follow-ups due" value="6" detail="Two high priority" icon={Bell} tone="amber" /><MetricCard label="Relationship health" value="78" detail="+5 this month" icon={Heart} tone="green" /><MetricCard label="New in Seoul" value="9" detail="Contacts this month" icon={MapPin} tone="violet" /></div>
    <Card className="relationship-card"><SectionTitle title="Relationship radar" meta="Prioritized by time, relevance, and reciprocity" action={<div className="filter-row"><button className="active">All</button><button>Personal</button><button>Career</button><button>Brands</button></div>} /><div className="relationship-list">{people.map((person) => <article key={person.name}><span className="avatar large-avatar">{person.name.split(' ').map((part) => part[0]).join('')}</span><div><strong>{person.name}</strong><small>{person.type} · Last contact {person.last}</small><p>{person.note}</p></div><div className="relationship-health"><span><i style={{ width: `${person.health}%` }} /></span><b>{person.health}</b></div><button className="subtle-button">{person.action}</button></article>)}</div></Card>
    <div className="two-col-layout"><Card className="relationship-nudge"><Pill tone="amber">Chief of Staff nudge</Pill><h2>Two relationships are quietly going cold.</h2><p>Sarah supported your travel decision, and Marcus has current market context. Fifteen intentional minutes would restore both threads.</p><button className="primary-button">Draft both messages</button></Card><Card className="network-map"><SectionTitle title="Network mix" meta="Who surrounds the mission" /><div className="network-rings"><Donut value={68} label="42" sublabel="people" /><div><span><i className="green-dot" /> Personal · 16</span><span><i className="violet-dot" /> Career · 14</span><span><i className="blue-dot" /> Creative · 12</span></div></div></Card></div></>;
}

function InsightsPage() {
  const insights = [
    { title: 'Meditation lifts your mood', finding: 'Mood averages 18% higher on days you meditate before 9 AM.', confidence: 91, evidence: '34 matched days', action: 'Protect a 20-minute morning block', tone: 'green' },
    { title: 'Poor sleep increases spending', finding: 'Food and convenience spend rises 23% after nights below 6.5 hours.', confidence: 84, evidence: '19 low-sleep days', action: 'Use a tired-day spending guardrail', tone: 'amber' },
    { title: 'Study works best before noon', finding: 'WGU completion is 31% higher between 10 AM and 1 PM.', confidence: 94, evidence: '27 study sessions', action: 'Move hard modules into the morning', tone: 'blue' },
    { title: 'Travel transitions reduce output', finding: 'Creative and income work drop for roughly 48 hours after changing cities.', confidence: 76, evidence: '5 city transitions', action: 'Schedule arrival recovery buffers', tone: 'violet' },
  ];
  return <><PageHeader eyebrow="Behavioral intelligence" title={<>Insights engine<span className="title-dot">.</span></>} copy="Joseph OS converts repeated behavior into evidence, forecasts, and recommendations you can act on." />
    <div className="insight-hero"><Card><div><Pill tone="green"><Radar size={12} /> High confidence pattern</Pill><h2>Your best days begin with stillness, then hard work.</h2><p>When meditation happens before 9 AM and deep work begins before 11 AM, your Daily Score averages 87—twelve points above baseline.</p></div><MiniBars values={[62, 68, 71, 66, 78, 82, 87]} /><strong>+12</strong></Card></div>
    <div className="insight-grid">{insights.map((insight) => <Card className="behavior-insight" key={insight.title}><div className="insight-confidence"><span><i style={{ width: `${insight.confidence}%` }} /></span><b>{insight.confidence}%</b></div><Pill tone={insight.tone}>{insight.confidence > 88 ? 'High' : insight.confidence > 79 ? 'Medium-high' : 'Medium'} confidence</Pill><h2>{insight.title}</h2><p>{insight.finding}</p><div className="supporting-data"><small>Supporting data</small><strong>{insight.evidence}</strong></div><div className="insight-action"><Lightbulb size={15} /><span><small>Recommendation</small><b>{insight.action}</b></span></div><div className="feedback-row"><button>Helpful</button><button>Not helpful</button><button>Later</button></div></Card>)}</div>
    <Card className="learning-timeline-card"><SectionTitle title="Learning timeline" meta="How Joseph OS is becoming more personal" /><div className="learning-timeline">{[['Jun 24', 'Detected morning study advantage', 'Study'], ['Jun 18', 'Connected low sleep to convenience spend', 'Finance'], ['Jun 12', 'Adjusted workout plan after travel day', 'Health'], ['Jun 04', 'Learned that evening reminders are ignored', 'Behavior']].map(([date, title, tag]) => <div key={title}><span>{date}</span><i /><strong>{title}</strong><Pill tone="neutral">{tag}</Pill></div>)}</div></Card></>;
}

function TimelinePage() {
  const chapters = [
    { month: 'May', place: 'New York City', title: 'The decision', status: 'complete', items: ['Committed to Year of Reinvention', 'Booked Seoul', 'Finished WGU term plan'] },
    { month: 'June', place: 'Seoul', title: 'Build the new identity', status: 'current', items: ['Meditation streak · 46 days', 'Remote income pipeline', 'Data Management Applications'] },
    { month: 'July', place: 'Seoul → Vietnam', title: 'Prove portability', status: 'future', items: ['First recurring remote client', 'Publish 8 reinvention videos', 'Travel transition system'] },
    { month: 'August', place: 'Vietnam', title: 'Deepen the system', status: 'future', items: ['WGU term acceleration', 'Fitness milestone', 'Visit Hạ Long Bay'] },
    { month: 'September', place: 'Thailand', title: 'Expand the world', status: 'future', items: ['Chiang Mai base', 'Income at $4k/month', 'Pet sit experience'] },
    { month: 'December', place: 'TBD', title: 'Graduate & choose again', status: 'future', items: ['Graduate WGU', 'Seven-month review', '2027 operating plan'] },
  ];
  return <><PageHeader eyebrow="Year of Reinvention" title={<>Transformation timeline<span className="title-dot">.</span></>} copy="The year is not a blur. It is a sequence of deliberate chapters, evidence, transitions, and identity milestones." />
    <Card className="timeline-overview"><span><strong>Day 17</strong><small>of 365</small></span><ProgressBar value={5} tone="green" /><span><strong>348</strong><small>days remaining</small></span></Card>
    <div className="reinvention-timeline">{chapters.map((chapter, index) => <article className={chapter.status} key={`${chapter.month}-${chapter.title}`}><div className="timeline-marker"><span>{chapter.status === 'complete' ? <Check size={14} /> : index + 1}</span><i /></div><Card><div className="chapter-heading"><span><small>{chapter.month}</small><b>{chapter.place}</b></span><Pill tone={chapter.status === 'complete' ? 'green' : chapter.status === 'current' ? 'blue' : 'neutral'}>{chapter.status === 'current' ? 'You are here' : chapter.status}</Pill></div><h2>{chapter.title}</h2><ul>{chapter.items.map((item) => <li key={item}>{item}</li>)}</ul></Card></article>)}</div></>;
}

function SettingsPage() {
  const integrations = [
    { name: 'Apple Calendar', detail: 'Weekly plans + travel events', icon: Apple, status: 'Ready', tone: 'green' },
    { name: 'OpenAI', detail: 'Chief of Staff intelligence', icon: Sparkles, status: 'Needs key', tone: 'amber' },
    { name: 'Twilio SMS', detail: 'Briefs, gratitude, accountability', icon: Smartphone, status: 'Needs setup', tone: 'amber' },
    { name: 'Weather', detail: 'Location-aware daily brief', icon: Sun, status: 'Planned', tone: 'neutral' },
  ];
  return <><PageHeader eyebrow="System configuration" title={<>Settings & automations<span className="title-dot">.</span></>} copy="Control the operating cadence, integrations, reports, reminders, and how assertive your Chief of Staff should be." />
    <div className="settings-grid"><Card><SectionTitle title="Integrations" meta="Connected systems" /><div className="integration-list">{integrations.map(({ name, detail, icon: Icon, status, tone }) => <div key={name}><span className="goal-icon blue"><Icon size={18} /></span><span><strong>{name}</strong><small>{detail}</small></span><Pill tone={tone}>{status}</Pill></div>)}</div></Card>
    <Card><SectionTitle title="Chief of Staff cadence" meta="When guidance arrives" /><div className="settings-list">{[['Morning brief', 'Every day · 8:00 AM', true], ['Evening review', 'Every day · 9:00 PM', true], ['Weekly CEO report', 'Sunday · 6:00 PM', true], ['Monthly review', 'Last day · 7:00 PM', true], ['Quarterly reset', 'Every 90 days', false]].map(([label, detail, active]) => <div key={label}><span><strong>{label}</strong><small>{detail}</small></span><button className={`toggle ${active ? 'active' : ''}`}><i /></button></div>)}</div></Card>
    <Card className="email-preview-card"><SectionTitle title="Morning brief preview" meta="Email + SMS automation" /><div className="email-preview"><p>JOSEPH OS · MORNING BRIEF</p><h2>Good morning from Seoul.</h2><div><span><small>Life Score</small><strong>78</strong></span><span><small>Cash</small><strong>$11,842</strong></span><span><small>Runway</small><strong>6.4 mo</strong></span></div><p>Your highest-return move is the WGU module before noon. Remote income gets the second block.</p></div></Card>
    <Card><SectionTitle title="Accountability style" meta="How hard should the system push?" /><div className="accountability-options"><button>Gentle</button><button className="active">Executive</button><button>Uncompromising</button></div><p className="setting-help">Executive mode is direct, evidence-based, and calm. It distinguishes a real constraint from an excuse.</p></Card></div></>;
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
    <Card className="graduation-card"><Pill tone="green"><GraduationCap size={12} /> Graduation path</Pill><h2>Keep the degree moving while building the life.</h2><p>Your study sessions become part of Joseph OS context, so weekly plans can protect the right course blocks automatically.</p><Donut value={68} label="68%" sublabel="degree" /></Card></div></>;
}

function AssistantPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ from: 'ai', text: 'I’m connected to your real receipts, budget, calendar, and learning profile. Ask a question—or tell me to plan next week.' }]);
  const [status, setStatus] = useState(null);
  const [latestPlan, setLatestPlan] = useState(null);
  const [thinking, setThinking] = useState(false);
  useEffect(() => { fetch('/api/status').then((response) => response.json()).then(setStatus).catch(() => setStatus({ ready: false })); }, []);
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
      if (result.plan) setLatestPlan(result.plan);
    } catch (error) { setMessages((current) => [...current, { from: 'ai', text: `I couldn't reach the local intelligence service: ${error.message}` }]); }
    finally { setThinking(false); }
  };
  const buildPlan = async () => {
    setThinking(true);
    try {
      const response = await fetch('/api/weekly-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context: 'Build my best balanced week ahead.' }) });
      const plan = await response.json();
      setLatestPlan(plan);
      setMessages((current) => [...current, { from: 'ai', text: `${plan.summary} I saved ${plan.events.length} blocks to the website and Apple Calendar feed.` }]);
    } finally { setThinking(false); }
  };
  const calendarUrl = typeof window === 'undefined' ? '' : `webcal://${window.location.host}/calendar/joseph-os.ics`;
  return (
    <><PageHeader eyebrow="AI executive office" title={<>Chief of Staff<span className="title-dot">.</span></>} copy="Planning, forecasting, accountability, risk detection, and strategic advice for the Year of Reinvention." action={<Pill tone="green"><Activity size={12} /> Monitoring 11 systems</Pill>} />
    <div className="chief-report-grid"><Card><Pill tone="blue">Morning brief</Pill><h3>Protect the morning.</h3><p>WGU before noon. Income outreach before content. Training at 5 PM.</p><button className="text-button">Open brief <ArrowUpRight size={14} /></button></Card><Card><Pill tone="amber">Weekly CEO report</Pill><h3>Execution is improving.</h3><p>Fitness +12%. Study on pace. Income activity remains the primary risk.</p><button className="text-button">Read report <ArrowUpRight size={14} /></button></Card><Card><Pill tone="violet">Forecast</Pill><h3>Graduation: on track.</h3><p>Current course velocity forecasts completion by December 8, 2026.</p><button className="text-button">View assumptions <ArrowUpRight size={14} /></button></Card></div>
    <div className="assistant-layout"><Card className="chat-card executive-console"><div className="chat-header"><span className="assistant-icon"><Sparkles size={20} /></span><span><strong>Executive command line</strong><small><i /> {status?.openai ? 'Chief of Staff online' : 'Local mode · add OpenAI key for full intelligence'}</small></span><Pill tone={status?.ready ? 'green' : 'amber'}>{status?.ready ? 'Learning' : 'Offline'}</Pill></div><div className="messages">{messages.map((message, index) => <div className={`message ${message.from}`} key={index}>{message.from === 'ai' && <span className="mini-ai"><Sparkles size={14} /></span>}<p>{message.text}</p></div>)}{thinking && <div className="message ai"><span className="mini-ai"><RefreshCw className="spin" size={14} /></span><p>Reviewing objectives, behavior, calendar, and risk…</p></div>}</div><div className="prompt-chips">{['Build my CEO plan', 'Where am I avoiding reality?', 'Forecast December', 'Run weekly review'].map((prompt) => <button key={prompt} onClick={() => setInput(prompt)}>{prompt}</button>)}</div><form className="chat-input" onSubmit={submit}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Issue a command, request a decision, or run a review…" /><button aria-label="Send" disabled={thinking}><Send size={17} /></button></form></Card>
    <div className="assistant-side"><Card><SectionTitle title="Week ahead" meta={latestPlan ? `${latestPlan.events.length} blocks saved` : 'Sunday planning system'} /><div className="plan-list">{(latestPlan?.events || []).slice(0, 5).map((item) => <div key={item.id}><span>{new Date(item.start).toLocaleDateString([], { weekday: 'short' })}</span><i /><span><strong>{item.title}</strong><small>{new Date(item.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small></span></div>)}{!latestPlan && <p className="plan-empty">Text PLAN on Sunday—or build the week here. It saves to the website and your subscribed Apple Calendar.</p>}</div><button className="primary-button full" onClick={buildPlan} disabled={thinking}><CalendarDays size={15} /> Build + save my week</button></Card>
    <Card className="apple-sync-card"><span className="sms-icon"><Apple size={20} /></span><div><Pill tone="blue">Apple ecosystem</Pill><h3>One calendar, everywhere.</h3><p>Subscribe once in Apple Calendar. Plans created here or by text will flow to iPhone, Mac, iPad, and Apple Watch.</p><a className="subtle-button full" href={calendarUrl}><Apple size={14} /> Subscribe in Apple Calendar</a></div></Card>
    <Card className="sms-card"><span className="sms-icon"><Smartphone size={20} /></span><div><h3>Sunday planning texts</h3><p>At 9 AM, Joseph OS asks what changed. Reply PLAN plus any constraints; your week is created and synced.</p></div><Pill tone={status?.sms ? 'green' : 'amber'}>{status?.sms ? 'Ready' : 'Needs Twilio'}</Pill><p className="integration-note"><MessageSquareText size={14} /> Friday budget pulse included</p></Card></div></div></>
  );
}

function App() {
  const initialPage = typeof window !== 'undefined' && navItems.some((item) => item.id === window.location.hash.slice(1)) ? window.location.hash.slice(1) : 'dashboard';
  const [page, setPageState] = useState(initialPage);
  const setPage = (nextPage) => { setPageState(nextPage); window.location.hash = nextPage; window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [habits, setHabits] = useState(initialHabits);
  const toggleHabit = (id) => setHabits((current) => current.map((habit) => habit.id === id ? { ...habit, week: habit.week.map((value, index) => index === 6 ? Number(!value) : value) } : habit));
  const Page = useMemo(() => ({ dashboard: <Dashboard habits={habits} toggleHabit={toggleHabit} />, goals: <GoalsPage />, habits: <HabitsPage habits={habits} toggleHabit={toggleHabit} />, money: <MoneyPage />, mood: <MoodPage />, travel: <TravelPage />, content: <ContentPage />, relationships: <RelationshipsPage />, insights: <InsightsPage />, assistant: <AssistantPage />, timeline: <TimelinePage />, settings: <SettingsPage />, school: <SchoolPage /> })[page], [page, habits]);

  return (
    <div className="app-shell">
      <div className="liquid-backdrop" aria-hidden="true">
        <span className="liquid-orb orb-one" />
        <span className="liquid-orb orb-two" />
        <span className="liquid-orb orb-three" />
        <span className="liquid-noise" />
      </div>
      <Sidebar page={page} setPage={setPage} />
      <div className="app-main">
        <Topbar page={page} />
        <main className="page-content" key={page}>{Page}</main>
      </div>
      <BottomNav page={page} setPage={setPage} onMore={() => setMobileMoreOpen(true)} />
      {mobileMoreOpen && <MobileMoreMenu page={page} setPage={setPage} onClose={() => setMobileMoreOpen(false)} />}
    </div>
  );
}

export default App;
