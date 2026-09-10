# JONARAI Frontend

Next.js 14 (App Router) + TypeScript + Tailwind. **Scaffold only — Phase A.1.**

Renders exactly one page today: a holding page that states what JONARAI
is and refuses to fabricate a dashboard. When the backend endpoints
come online (Phase D+), this app will grow into the iPad-first dashboard
described in the Master Spec Phase Z roadmap — but not before there is
real data to display.

## Setup

```bash
cd jonarai/frontend
pnpm install       # or: npm install
pnpm dev           # or: npm run dev
open http://localhost:3000
```

The backend URL is read from `NEXT_PUBLIC_JONARAI_API_URL`. Leave it
unset for pure static rendering; set it to `http://localhost:8000` when
running the FastAPI dev server locally.

## What you can and cannot do here

- ✅ Improve the holding page's copy / accessibility.
- ✅ Add shared layout primitives (buttons, panels) once they'd be
  reused.
- ❌ Add trading widgets with placeholder numbers — fabricated data
  is a spec violation.
- ❌ Add a "score gauge" or "signal list" component before the
  backend actually emits scores.
