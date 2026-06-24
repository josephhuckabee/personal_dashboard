import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cron from 'node-cron';
import twilio from 'twilio';
import OpenAI from 'openai';
import sharp from 'sharp';
import { createServer as createViteServer } from 'vite';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const timezone = process.env.APP_TIMEZONE || 'America/New_York';
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(dataDir, 'receipts');
const travelUploadsDir = path.join(dataDir, 'travel');
const databaseFile = path.join(dataDir, 'joseph-os.json');

fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(travelUploadsDir, { recursive: true });

const defaultDatabase = {
  receipts: [],
  transactions: [],
  events: [],
  conversations: [],
  weeklyPlans: [],
  moodEntries: [],
  gratitude: [],
  travelItems: [],
  contentStudio: { ideas: [], checklist: [], contacts: [] },
  school: {
    courses: [
      { id: 'd197', code: 'D197', title: 'Version Control', progress: 82, status: 'active' },
      { id: 'd426', code: 'D426', title: 'Data Management Foundations', progress: 64, status: 'active' },
      { id: 'd427', code: 'D427', title: 'Data Management Applications', progress: 41, status: 'active' },
    ],
    tasks: [], sessions: [], graduationTarget: '2026-12-15',
  },
  learning: {
    homebase: 'NYC',
    currentLocation: 'Seoul',
    mission: 'Year of Reinvention',
    priorities: ['WGU graduation', 'remote income', 'long-term solo travel', 'fitness', 'meditation'],
    preferredWorkStart: '09:00',
    observations: [],
    categoryPatterns: {},
    updatedAt: null,
  },
  finance: {
    currentCash: 12000,
    monthlyIncomeTarget: 5000,
    monthlyTravelBudget: 2960,
    categoryBudgets: { Food: 600, Travel: 900, Transport: 260, Health: 180, Education: 400, Other: 350 },
    alertedThresholds: [],
  },
  settings: { calendarName: 'Joseph OS', sundayPromptHour: 9, gratitudeSchedule: null, gratitudePromptPending: false },
};

function loadDatabase() {
  try {
    if (!fs.existsSync(databaseFile)) return structuredClone(defaultDatabase);
    const saved = JSON.parse(fs.readFileSync(databaseFile, 'utf8'));
    const merged = {
      ...structuredClone(defaultDatabase),
      ...saved,
      finance: { ...defaultDatabase.finance, ...(saved.finance || {}) },
      learning: { ...defaultDatabase.learning, ...(saved.learning || {}) },
      settings: { ...defaultDatabase.settings, ...(saved.settings || {}) },
      contentStudio: { ...defaultDatabase.contentStudio, ...(saved.contentStudio || {}) },
      school: { ...defaultDatabase.school, ...(saved.school || {}) },
    };
    if (!merged.transactions.length && merged.finance.currentCash === 24860) merged.finance.currentCash = 12000;
    return merged;
  } catch (error) {
    console.error('Could not read Joseph OS data:', error.message);
    return structuredClone(defaultDatabase);
  }
}

function saveDatabase(database) {
  fs.mkdirSync(dataDir, { recursive: true });
  const temporaryFile = `${databaseFile}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(database, null, 2));
  fs.renameSync(temporaryFile, databaseFile);
}

let database = loadDatabase();

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_request, file, callback) => callback(null, `${Date.now()}-${randomUUID()}${path.extname(file.originalname).toLowerCase() || '.jpg'}`),
  }),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
    callback(allowed.has(file.mimetype) ? null : new Error('Upload a JPG, PNG, WebP, HEIC, or HEIF receipt image.'), allowed.has(file.mimetype));
  },
});

const travelUpload = multer({
  storage: multer.diskStorage({ destination: travelUploadsDir, filename: (_request, file, callback) => callback(null, `${Date.now()}-${randomUUID()}${path.extname(file.originalname).toLowerCase() || '.jpg'}`) }),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
    callback(allowed.has(file.mimetype) ? null : new Error('Upload a travel screenshot or photo.'), allowed.has(file.mimetype));
  },
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));
app.use('/receipt-files', express.static(uploadsDir, { fallthrough: false }));
app.use('/travel-files', express.static(travelUploadsDir, { fallthrough: false }));

function monthKey(value = new Date()) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function financeSnapshot() {
  const thisMonth = monthKey();
  const expenses = database.transactions.filter((item) => item.type === 'expense' && monthKey(item.date) === thisMonth);
  const income = database.transactions.filter((item) => item.type === 'income' && monthKey(item.date) === thisMonth);
  const spent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const earned = income.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const byCategory = expenses.reduce((result, item) => {
    result[item.category] = (result[item.category] || 0) + Number(item.amount || 0);
    return result;
  }, {});
  const burnRate = spent || database.finance.monthlyTravelBudget;
  const runway = burnRate > 0 ? database.finance.currentCash / burnRate : 0;
  return { currentCash: database.finance.currentCash, spent, earned, burnRate, runway, byCategory, categoryBudgets: database.finance.categoryBudgets };
}

function budgetInsight(snapshot = financeSnapshot()) {
  const comparisons = Object.entries(snapshot.categoryBudgets).map(([category, budget]) => ({
    category,
    budget,
    spent: snapshot.byCategory[category] || 0,
    ratio: (snapshot.byCategory[category] || 0) / budget,
  })).sort((a, b) => b.ratio - a.ratio);
  const highest = comparisons[0];
  if (highest?.ratio >= 1) return `${highest.category} is $${Math.round(highest.spent - highest.budget)} over its monthly target. Your runway is ${snapshot.runway.toFixed(1)} months.`;
  if (highest?.ratio >= .75) return `${highest.category} has used ${Math.round(highest.ratio * 100)}% of its monthly budget. You still have ${snapshot.runway.toFixed(1)} months of runway.`;
  return `Spending is inside your targets. At the current burn rate, you have ${snapshot.runway.toFixed(1)} months of travel runway.`;
}

function cleanJson(text) {
  return JSON.parse(text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim());
}

async function analyzeReceipt(file) {
  if (!openai) return null;
  const normalizedImage = await sharp(file.path).rotate().jpeg({ quality: 88 }).toBuffer();
  const base64 = normalizedImage.toString('base64');
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
    input: [{
      role: 'user',
      content: [
        { type: 'input_text', text: 'Read this receipt. Return JSON only with merchant, date (YYYY-MM-DD), subtotal, tax, total, currency, category (one of Food, Travel, Transport, Health, Education, Other), and confidence (0-1). Use null for unreadable values.' },
        { type: 'input_image', image_url: `data:image/jpeg;base64,${base64}` },
      ],
    }],
  });
  return cleanJson(response.output_text);
}

async function analyzeTravelDocument(file) {
  if (!openai) return null;
  const normalizedImage = await sharp(file.path).rotate().jpeg({ quality: 88 }).toBuffer();
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
    input: [{ role: 'user', content: [
      { type: 'input_text', text: 'Extract this travel booking screenshot. Return JSON only with title, provider, type (hotel|airbnb|pet-sit|flight|train|taxi|activity|other), location, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD or null), confirmationNumber, cost, currency, and notes. Use null when unknown.' },
      { type: 'input_image', image_url: `data:image/jpeg;base64,${normalizedImage.toString('base64')}` },
    ] }],
  });
  return cleanJson(response.output_text);
}

function zonedNow() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

function ensureGratitudeSchedule() {
  const now = zonedNow();
  const date = `${now.year}-${now.month}-${now.day}`;
  if (database.settings.gratitudeSchedule?.date !== date) {
    database.settings.gratitudeSchedule = { date, hour: 9 + Math.floor(Math.random() * 12), minute: Math.floor(Math.random() * 60), sent: false };
    saveDatabase(database);
  }
  return database.settings.gratitudeSchedule;
}

function gratitudeReframe() {
  if (!database.gratitude.length) return '';
  const entry = database.gratitude[Math.floor(Math.random() * database.gratitude.length)];
  return ` A past reminder: you were grateful for “${entry.text}.”`;
}

function recordLearning(observation) {
  database.learning.observations.unshift({ id: randomUUID(), text: observation, createdAt: new Date().toISOString() });
  database.learning.observations = database.learning.observations.slice(0, 80);
  database.learning.updatedAt = new Date().toISOString();
}

async function maybeSendBudgetAlert(snapshot) {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER || !process.env.JOSEPH_PHONE_NUMBER) return;
  const alert = Object.entries(snapshot.categoryBudgets)
    .map(([category, budget]) => ({ category, ratio: (snapshot.byCategory[category] || 0) / budget }))
    .sort((a, b) => b.ratio - a.ratio)[0];
  if (!alert || alert.ratio < .8) return;
  const key = `${monthKey()}-${alert.category}-${alert.ratio >= 1 ? 100 : 80}`;
  if (database.finance.alertedThresholds.includes(key)) return;
  database.finance.alertedThresholds.push(key);
  saveDatabase(database);
  await sendSms(`Joseph OS budget pulse: ${budgetInsight(snapshot)}`);
}

async function sendSms(body) {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER || !process.env.JOSEPH_PHONE_NUMBER) return null;
  return twilioClient.messages.create({ body, from: process.env.TWILIO_PHONE_NUMBER, to: process.env.JOSEPH_PHONE_NUMBER });
}

function nextMonday() {
  const date = new Date();
  const days = (8 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function fallbackWeeklyPlan() {
  const monday = nextMonday();
  const templates = [
    [0, '09:00', 90, 'WGU deep work', 'education'],
    [0, '15:00', 60, 'Remote income sprint', 'income'],
    [1, '08:00', 45, 'Lift · upper body', 'fitness'],
    [1, '13:00', 75, 'Content production', 'content'],
    [2, '09:00', 90, 'WGU deep work', 'education'],
    [2, '16:00', 35, 'Zone 2 run', 'fitness'],
    [3, '10:00', 60, 'Client pipeline', 'income'],
    [3, '15:00', 60, 'Content edit + publish', 'content'],
    [4, '09:00', 90, 'WGU weekly finish', 'education'],
    [5, '10:00', 60, 'Long run + mobility', 'fitness'],
    [6, '18:00', 45, 'Weekly review + budget', 'reflection'],
  ];
  return templates.map(([dayOffset, time, duration, title, category]) => {
    const start = new Date(monday);
    start.setDate(start.getDate() + dayOffset);
    const [hours, minutes] = time.split(':').map(Number);
    start.setHours(hours, minutes, 0, 0);
    return { title, category, start: start.toISOString(), end: new Date(start.getTime() + duration * 60000).toISOString(), notes: 'Planned by Joseph OS' };
  });
}

async function buildWeeklyPlan(userContext = '') {
  let events = fallbackWeeklyPlan();
  let summary = 'A balanced week protecting WGU, income, fitness, content, and your Sunday reset.';
  if (openai) {
    try {
      const response = await openai.responses.create({
        model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
        input: `Create Joseph's plan for next Monday through Sunday. Return JSON only: {"summary":"...","events":[{"title":"...","category":"education|income|fitness|content|reflection|travel","start":"ISO timestamp with timezone","end":"ISO timestamp with timezone","notes":"..."}]}. Use 8-12 realistic calendar blocks. Home timezone: ${timezone}. Personal context: ${JSON.stringify(database.learning)}. Finance: ${JSON.stringify(financeSnapshot())}. Existing future events: ${JSON.stringify(database.events.filter((event) => new Date(event.start) > new Date()).slice(0, 20))}. Joseph's text: ${userContext}`,
      });
      const result = cleanJson(response.output_text);
      if (Array.isArray(result.events) && result.events.length) {
        events = result.events;
        summary = result.summary || summary;
      }
    } catch (error) {
      console.error('AI weekly plan fallback:', error.message);
    }
  }
  const planId = randomUUID();
  const savedEvents = events.map((event) => ({ ...event, id: randomUUID(), source: 'weekly-plan', planId, createdAt: new Date().toISOString() }));
  database.events.push(...savedEvents);
  database.weeklyPlans.unshift({ id: planId, summary, createdAt: new Date().toISOString(), eventIds: savedEvents.map((event) => event.id) });
  recordLearning(`Weekly plan requested. Context: ${userContext || 'standard Sunday plan'}`);
  saveDatabase(database);
  return { id: planId, summary, events: savedEvents };
}

function escapeIcs(value = '') {
  return String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function icsDate(value) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function calendarFeed() {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Joseph OS//Apple Calendar//EN', `X-WR-CALNAME:${escapeIcs(database.settings.calendarName)}`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  database.events.forEach((event) => {
    lines.push('BEGIN:VEVENT', `UID:${event.id}@joseph-os`, `DTSTAMP:${icsDate(event.createdAt || new Date())}`, `DTSTART:${icsDate(event.start)}`, `DTEND:${icsDate(event.end)}`, `SUMMARY:${escapeIcs(event.title)}`, `DESCRIPTION:${escapeIcs(event.notes || 'Created by Joseph OS')}`, `CATEGORIES:${escapeIcs(event.category || 'Joseph OS')}`, 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

app.get('/api/status', (_request, response) => response.json({
  ready: true,
  openai: Boolean(openai),
  sms: Boolean(twilioClient && process.env.TWILIO_PHONE_NUMBER && process.env.JOSEPH_PHONE_NUMBER),
  appleCalendar: true,
}));

app.get('/api/wellbeing', (_request, response) => response.json({ moodEntries: database.moodEntries.slice().reverse(), gratitude: database.gratitude.slice().reverse(), gratitudeSchedule: ensureGratitudeSchedule() }));
app.post('/api/wellbeing/mood', (request, response) => {
  const entry = { id: randomUUID(), date: request.body.date || new Date().toISOString().slice(0, 10), wakeMood: Number(request.body.wakeMood), bedMood: Number(request.body.bedMood), sleepHours: Number(request.body.sleepHours), sleepQuality: Number(request.body.sleepQuality), diet: request.body.diet || 'balanced', energy: Number(request.body.energy), stress: Number(request.body.stress), note: request.body.note || '', createdAt: new Date().toISOString() };
  database.moodEntries.push(entry);
  recordLearning(`Wellbeing check-in: wake mood ${entry.wakeMood}/5, bed mood ${entry.bedMood}/5, ${entry.sleepHours}h sleep, diet ${entry.diet}.`);
  saveDatabase(database); response.status(201).json(entry);
});
app.post('/api/wellbeing/gratitude', (request, response) => {
  const text = String(request.body.text || '').trim();
  if (!text) return response.status(400).json({ error: 'Write one thing you are grateful for.' });
  const entry = { id: randomUUID(), text, source: request.body.source || 'website', createdAt: new Date().toISOString() };
  database.gratitude.push(entry); database.settings.gratitudePromptPending = false;
  recordLearning(`Gratitude: ${text}`); saveDatabase(database); response.status(201).json(entry);
});

app.get('/api/travel', (_request, response) => response.json({ items: database.travelItems.slice().sort((a, b) => String(a.startDate).localeCompare(String(b.startDate))) }));
app.post('/api/travel/upload', travelUpload.single('travel'), async (request, response, next) => {
  try {
    if (!request.file) return response.status(400).json({ error: 'Choose a travel screenshot.' });
    const item = { id: randomUUID(), file: request.file.filename, uploadedAt: new Date().toISOString(), status: openai ? 'analyzing' : 'needs-review' };
    try { const analysis = await analyzeTravelDocument(request.file); if (analysis?.startDate) Object.assign(item, analysis, { status: 'ready' }); } catch (error) { item.error = error.message; }
    database.travelItems.push(item);
    if (item.status === 'ready') recordLearning(`Travel booking: ${item.type} with ${item.provider || 'unknown provider'} in ${item.location || 'unknown location'} on ${item.startDate}.`);
    saveDatabase(database); response.status(201).json({ item, aiConfigured: Boolean(openai) });
  } catch (error) { next(error); }
});
app.patch('/api/travel/:id', (request, response) => {
  const item = database.travelItems.find((entry) => entry.id === request.params.id);
  if (!item) return response.status(404).json({ error: 'Travel item not found.' });
  Object.assign(item, request.body, { status: 'ready', corrected: true }); recordLearning(`Travel item corrected: ${item.title}, ${item.startDate}.`); saveDatabase(database); response.json(item);
});

app.get('/api/content', (_request, response) => response.json(database.contentStudio));
app.post('/api/content/:collection', (request, response) => {
  const collection = request.params.collection;
  if (!['ideas', 'checklist', 'contacts'].includes(collection)) return response.status(404).json({ error: 'Unknown content collection.' });
  const item = { id: randomUUID(), ...request.body, createdAt: new Date().toISOString() };
  database.contentStudio[collection].push(item); saveDatabase(database); response.status(201).json(item);
});
app.patch('/api/content/:collection/:id', (request, response) => {
  const list = database.contentStudio[request.params.collection]; const item = list?.find((entry) => entry.id === request.params.id);
  if (!item) return response.status(404).json({ error: 'Content item not found.' }); Object.assign(item, request.body); saveDatabase(database); response.json(item);
});

app.get('/api/school', (_request, response) => response.json(database.school));
app.post('/api/school/tasks', (request, response) => { const task = { id: randomUUID(), title: request.body.title, courseId: request.body.courseId || '', dueDate: request.body.dueDate || '', completed: false, createdAt: new Date().toISOString() }; database.school.tasks.push(task); saveDatabase(database); response.status(201).json(task); });
app.patch('/api/school/tasks/:id', (request, response) => { const task = database.school.tasks.find((entry) => entry.id === request.params.id); if (!task) return response.status(404).json({ error: 'Task not found.' }); Object.assign(task, request.body); saveDatabase(database); response.json(task); });
app.post('/api/school/sessions', (request, response) => { const session = { id: randomUUID(), minutes: Number(request.body.minutes || 0), courseId: request.body.courseId || '', note: request.body.note || '', createdAt: new Date().toISOString() }; database.school.sessions.push(session); recordLearning(`WGU study session: ${session.minutes} minutes for ${session.courseId}.`); saveDatabase(database); response.status(201).json(session); });

app.get('/api/finance', (_request, response) => response.json({
  snapshot: financeSnapshot(),
  insight: budgetInsight(),
  receipts: database.receipts.slice().reverse(),
  transactions: database.transactions.slice().reverse(),
}));

app.post('/api/receipts', upload.single('receipt'), async (request, response, next) => {
  try {
    if (!request.file) return response.status(400).json({ error: 'Choose a receipt photo or screenshot.' });
    const receipt = { id: randomUUID(), file: request.file.filename, originalName: request.file.originalname, uploadedAt: new Date().toISOString(), status: openai ? 'analyzing' : 'needs-review' };
    database.receipts.push(receipt);
    saveDatabase(database);
    let analysis = null;
    try { analysis = await analyzeReceipt(request.file); } catch (error) { receipt.error = error.message; }
    if (analysis?.total) {
      Object.assign(receipt, analysis, { status: 'ready' });
      const transaction = { id: randomUUID(), receiptId: receipt.id, type: 'expense', merchant: analysis.merchant || 'Receipt purchase', description: analysis.merchant || 'Receipt purchase', amount: Number(analysis.total), category: analysis.category || 'Other', date: analysis.date || new Date().toISOString().slice(0, 10), createdAt: new Date().toISOString() };
      database.transactions.push(transaction);
      database.finance.currentCash = Math.max(0, database.finance.currentCash - transaction.amount);
      database.learning.categoryPatterns[transaction.category] = (database.learning.categoryPatterns[transaction.category] || 0) + 1;
      recordLearning(`Receipt learned: ${transaction.merchant}, $${transaction.amount.toFixed(2)}, ${transaction.category}.`);
    } else {
      receipt.status = 'needs-review';
    }
    saveDatabase(database);
    const snapshot = financeSnapshot();
    maybeSendBudgetAlert(snapshot).catch((error) => console.error('Budget SMS:', error.message));
    response.status(201).json({ receipt, snapshot, insight: budgetInsight(snapshot), aiConfigured: Boolean(openai) });
  } catch (error) { next(error); }
});

app.patch('/api/receipts/:id', (request, response) => {
  const receipt = database.receipts.find((item) => item.id === request.params.id);
  if (!receipt) return response.status(404).json({ error: 'Receipt not found.' });
  const previousTransaction = database.transactions.find((item) => item.receiptId === receipt.id);
  const amount = Number(request.body.total);
  Object.assign(receipt, { merchant: request.body.merchant || 'Receipt purchase', total: amount, date: request.body.date || new Date().toISOString().slice(0, 10), category: request.body.category || 'Other', status: 'ready', corrected: true });
  if (previousTransaction) {
    database.finance.currentCash += previousTransaction.amount;
    Object.assign(previousTransaction, { merchant: receipt.merchant, description: receipt.merchant, amount, date: receipt.date, category: receipt.category });
  } else {
    database.transactions.push({ id: randomUUID(), receiptId: receipt.id, type: 'expense', merchant: receipt.merchant, description: receipt.merchant, amount, date: receipt.date, category: receipt.category, createdAt: new Date().toISOString() });
  }
  database.finance.currentCash = Math.max(0, database.finance.currentCash - amount);
  recordLearning(`Joseph corrected a receipt to ${receipt.merchant}, $${amount.toFixed(2)}, ${receipt.category}. Prefer this pattern next time.`);
  saveDatabase(database);
  response.json({ receipt, snapshot: financeSnapshot(), insight: budgetInsight() });
});

app.get('/api/calendar/events', (_request, response) => response.json({ events: database.events.slice().sort((a, b) => new Date(a.start) - new Date(b.start)) }));
app.post('/api/calendar/events', (request, response) => {
  const event = { id: randomUUID(), title: request.body.title, start: request.body.start, end: request.body.end, category: request.body.category || 'personal', notes: request.body.notes || '', source: 'website', createdAt: new Date().toISOString() };
  database.events.push(event); saveDatabase(database); response.status(201).json(event);
});
app.get('/calendar/joseph-os.ics', (_request, response) => response.type('text/calendar').set('Cache-Control', 'no-cache').send(calendarFeed()));

app.post('/api/weekly-plan', async (request, response) => response.json(await buildWeeklyPlan(request.body.context || '')));

app.post('/api/assistant', async (request, response) => {
  const message = String(request.body.message || '').trim();
  if (!message) return response.status(400).json({ error: 'Write a message first.' });
  if (/\b(plan|schedule).*(week)|\bweek.*(plan|schedule)\b/i.test(message)) {
    const plan = await buildWeeklyPlan(message);
    return response.json({ reply: `${plan.summary} I saved ${plan.events.length} blocks to Joseph OS and your Apple Calendar feed.`, plan });
  }
  let reply = `I’m learning from your receipts, plans, and corrections. ${budgetInsight()} Ask me to plan your week whenever you’re ready.`;
  if (openai) {
    try {
      const result = await openai.responses.create({ model: process.env.OPENAI_MODEL || 'gpt-5.4-mini', input: `You are Joseph OS, Joseph's concise personal operating system. Be direct, calm, masculine, practical, and personalized. Never pretend to have data not included. Learning profile: ${JSON.stringify(database.learning)}. Finance: ${JSON.stringify(financeSnapshot())}. Upcoming calendar: ${JSON.stringify(database.events.filter((event) => new Date(event.start) > new Date()).slice(0, 20))}. Joseph says: ${message}` });
      reply = result.output_text;
    } catch (error) { console.error('Assistant fallback:', error.message); }
  }
  database.conversations.push({ id: randomUUID(), message, reply, createdAt: new Date().toISOString() });
  recordLearning(`Joseph asked: ${message.slice(0, 180)}`);
  saveDatabase(database);
  response.json({ reply, learned: true });
});

app.post('/api/sms/incoming', async (request, response) => {
  const body = String(request.body.Body || '').trim();
  const twiml = new twilio.twiml.MessagingResponse();
  if (/\b(plan|schedule|week)\b/i.test(body)) {
    const plan = await buildWeeklyPlan(body);
    twiml.message(`${plan.summary} ${plan.events.length} blocks are now in Joseph OS + your subscribed Apple Calendar. Open the dashboard for details.`);
  } else if (database.settings.gratitudePromptPending) {
    const entry = { id: randomUUID(), text: body, source: 'sms', createdAt: new Date().toISOString() };
    database.gratitude.push(entry); database.settings.gratitudePromptPending = false;
    recordLearning(`Gratitude: ${body}`); saveDatabase(database);
    twiml.message(`Saved. Hold onto that: “${body}.” I’ll bring it back when it can help you reconnect or reset.`);
  } else {
    let reply = `Got it. ${budgetInsight()} Text PLAN when you want next week scheduled.`;
    if (openai) {
      try {
        const result = await openai.responses.create({ model: process.env.OPENAI_MODEL || 'gpt-5.4-mini', input: `Reply as Joseph OS by SMS in under 420 characters. Learn Joseph over time and be direct. Profile: ${JSON.stringify(database.learning)}. Finance: ${JSON.stringify(financeSnapshot())}. Message: ${body}` });
        reply = result.output_text;
      } catch { /* use the deterministic reply */ }
    }
    recordLearning(`Joseph texted: ${body.slice(0, 180)}`);
    saveDatabase(database);
    twiml.message(reply);
  }
  response.type('text/xml').send(twiml.toString());
});

cron.schedule('0 9 * * 0', () => {
  sendSms('Sunday reset. Reply PLAN with anything fixed or unusual this week, and I’ll build your schedule in Joseph OS + Apple Calendar.').catch((error) => console.error('Sunday SMS:', error.message));
}, { timezone });

cron.schedule('0 17 * * 5', () => {
  sendSms(`Friday budget pulse: ${budgetInsight()}`).catch((error) => console.error('Budget SMS:', error.message));
}, { timezone });

cron.schedule('* * * * *', () => {
  const schedule = ensureGratitudeSchedule(); const now = zonedNow();
  if (!schedule.sent && Number(now.hour) === schedule.hour && Number(now.minute) === schedule.minute) {
    sendSms(`Quick pause: what is one thing you’re grateful for in this exact moment? Reply with the first honest thing that comes up.${gratitudeReframe()}`)
      .then(() => { schedule.sent = true; database.settings.gratitudePromptPending = true; saveDatabase(database); })
      .catch((error) => console.error('Gratitude SMS:', error.message));
  }
}, { timezone });

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(error.status || 500).json({ error: error.message || 'Something went wrong.' });
});

if (isProduction) {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.use((request, response, next) => request.method === 'GET' ? response.sendFile(path.join(__dirname, 'dist', 'index.html')) : next());
} else {
  const vite = await createViteServer({ server: { middlewareMode: true, hmr: false }, appType: 'spa' });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Joseph OS running at http://localhost:${port}`);
  console.log(`OpenAI intelligence: ${openai ? 'ready' : 'add OPENAI_API_KEY'}`);
  console.log(`SMS automation: ${twilioClient ? 'credentials found' : 'add Twilio credentials'}`);
});
