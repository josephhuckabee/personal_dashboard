# Joseph OS — AI Chief of Staff

A private, sign-in-free personal operating system for executing Joseph's Year of Reinvention. Joseph is the CEO; the software acts as Chief of Staff—tracking transformation, detecting risk, forecasting outcomes, and recommending the highest-return actions.

Joseph OS also includes:

- Full wellbeing tracking: wake mood, bedtime mood, sleep, diet, energy, and stress
- Randomized daily gratitude SMS prompts with long-term memory resurfacing
- AI-assisted travel screenshot organization for stays, pet sits, transit, and activities
- Content ideas, production checklists, and contacts/UGC CRM
- A dedicated WGU school dashboard with courses, tasks, study sessions, and graduation progress

## Executive workspaces

Command Center, Objectives, Habits, Finance, Health, Travel HQ, Content Studio, Relationships, Insights, Chief of Staff, Timeline, and Settings.

The Command Center combines a daily Morning Brief, Life Score, objective health, runway, risks, opportunities, calendar, habits, and Chief of Staff guidance. The system also includes Weekly CEO Reports, completion forecasts, behavioral confidence scores, a transformation timeline, relationship health, and automation previews.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Data and receipt images stay in the local `data/` directory.

## Intelligence setup

Add `OPENAI_API_KEY` to `.env` to enable:

- Automatic reading of receipt photos and screenshots
- Merchant, total, tax, date, and category extraction
- Personalized assistant responses
- Weekly plans informed by Joseph OS history

Without a key, receipt uploads, manual review, budgets, calendar sync, and deterministic weekly planning still work.

## Apple Calendar

Use **Subscribe in Apple Calendar** inside the Assistant section. Joseph OS publishes one live calendar at:

```text
webcal://YOUR_HOST/calendar/joseph-os.ics
```

For syncing away from the home network, deploy Joseph OS at a private HTTPS address and set `PUBLIC_BASE_URL`. Apple Calendar refreshes subscribed calendars automatically across devices signed into the same Apple account.

## Smart SMS setup

Add the Twilio and phone values from `.env.example`, then set the Twilio number’s incoming-message webhook to:

```text
https://YOUR_PUBLIC_HOST/api/sms/incoming
```

Joseph OS will:

- Send a Sunday 9 AM planning prompt
- Turn a `PLAN` reply plus constraints into a weekly calendar
- Send a Friday budget pulse
- Send category threshold alerts after tracked receipts

Twilio webhooks need a publicly reachable HTTPS address; a tunnel works while developing.

## Storage and privacy

- No user account or authentication is required during development.
- Data is persisted in `data/joseph-os.json`.
- Receipt images are stored in `data/receipts/`.
- Personal files and `.env` are gitignored.
- Add authentication before exposing the app directly to the public internet.

## Production

```bash
npm run build
npm start
```
