# Routina

Personal habit & task tracker. Make every day count.

Routina is **local-first**: accounts, habits, tasks, and notification marks live in **IndexedDB on this browser** (`routina_db`). There is no cloud sync — signing in on another device will not open the same account. Export a JSON backup before switching browsers or machines.

## Features

- **Habits** — recurring check-ins, streaks, colors & icons, drag reorder
- **Tasks** — one-off work with start/due, priority, and status
- **Today** — combined view for today’s habits and due work
- **Calendar & insights** — heatmap and simple charts
- **Local accounts** — register / sign in on this device only (Dexie)
- **Reminders (2-5-8)** — for each task, checkpoints at **20% / 50% / 80%** of that task’s own start→due window (e.g. a 24h task reminds at ~4.8h, 12h, 19.2h). Marks are stored in IndexedDB per user/day. Browser notifications fire only while Routina is open
- **i18n** — English and Vietnamese
- **Backup** — Settings → Export / Import JSON

## Stack

- Next.js (App Router) and React
- TypeScript (strict)
- Tailwind CSS
- Zustand, Dexie.js (IndexedDB), React Hook Form, Zod
- Recharts, date-fns, Lucide, Sonner
- Vitest

## Scripts

```bash
npm install
npm run dev
npm run test
npm run typecheck
npm run lint
npm run build
```

Open [http://localhost:3000](http://localhost:3000).

## Data

| What | Where |
| --- | --- |
| Users, sessions, habits, tasks, check-ins | IndexedDB `routina_db` |
| Notification read / browser-shown marks | IndexedDB `notificationDays` (per user + date) |

Clearing site data in the browser removes Routina accounts and workspaces for that origin. Use **Settings → Export JSON** before switching devices.

Demo / sample habits are optional and never overwrite an existing workspace.
