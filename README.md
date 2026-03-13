# Quit Smoking Tracker

## Overview
Web app to help track and reduce smoking through awareness.
Before each cigarette: rate craving (1-5) + select reason.
After: rate enjoyment (1-5).
The gap between craving and enjoyment is the core insight.

Hebrew RTL, dark theme, mobile-first.

## Live URL
https://quit-smoking-app-alpha.vercel.app

## GitHub
https://github.com/Ariestainfeld/quit-smoking-tracker

## Tech Stack
- Vite + React 19 + TypeScript
- Tailwind CSS v4
- Zustand (persist middleware) — state in localStorage
- Recharts — charts
- react-router-dom (HashRouter)
- No backend — all data in localStorage

## Data Storage
localStorage only. Each device stores its own data independently.
Keys: `qst_cigarettes`, `qst_app`, `qst_achievements`
Export/import available in Settings page.

## Data Model

### CigaretteEntry
```typescript
{
  id: string;              // crypto.randomUUID()
  startedAt: string;       // ISO UTC — moment of lighting
  finishedAt: string|null; // ISO UTC — moment finished (null = in progress)
  craving: number;         // 1-5
  reason: SmokingReason;   // from predefined list
  reasonCustom?: string;   // free text if "other"
  enjoyment: number|null;  // 1-5 (null = in progress)
}
```

### SmokingReason (7 options)
`'קפה' | 'אחרי אוכל' | 'צריך להתרכז' | 'עצבני/לא רגוע' | 'עם חברים' | 'הפסקה' | 'אחר'`

### UserProfile
```typescript
{ name: string; baseline: number; createdAt: string; }
```

### AchievementState
```typescript
{ points: number; level: number; unlockedBadges: [...]; streakDays: number; longestStreak: number; }
```

## Features

### Pages (5 + onboarding)
1. **Dashboard** — greeting, daily counter vs baseline, "light up" button, today's log, quick stats
2. **History** — expandable day cards with all entries
3. **Analytics** — 6 charts + period selector (7d / 30d / all)
4. **Achievements** — 15 badges, 10 levels, XP bar, points
5. **Settings** — profile edit, stats, export/import JSON, reset
6. **Onboarding** — 2-step wizard (name + baseline)

### Logging Flow (LogModal — 5 steps)
1. Craving rating (1-5 with emoji faces)
2. Reason selection (7 chips)
3. Confirm + smart feedback message
4. Enjoyment rating (after finishing)
5. Post-smoke feedback + points earned

### Analytics (6 charts)
1. Daily trend (LineChart) — cigarettes/day + baseline reference line
2. Reason breakdown (PieChart)
3. Craving vs Enjoyment by reason (BarChart)
4. Unnecessary cigarettes % (metric card)
5. Hourly heatmap (6:00-23:00)
6. Week vs last week comparison (3 metrics)

### Auto-Close (Unfinished Cigarettes)
- 5 min after lighting → push notification: "עברו 5 דקות — סיימת?"
- 10 min → second notification: "עוד 5 דקות תיסגר אוטומטית"
- 15 min → auto-closes entry (enjoyment=null, marked `autoFinished`)
- Uses browser Notification API (requests permission on first visit)
- Timers survive page refresh (recalculates remaining time from startedAt)

### Retroactive Logging
- "שכחתי לרשום סיגריה" button on Dashboard
- Pick date (today or yesterday) + time
- "זוכר איך היה?" — Yes/No choice:
  - **No**: logs minimal entry (timestamp + default craving 3 + reason "לא זוכר"), +2 points
  - **Yes**: full flow — craving (1-5) → reason → enjoyment (1-5), full points
- Entries marked `retroactive: true`, sorted chronologically into history

### Smart Feedback
- Pace-based: today vs historical average at same hour
- Baseline proximity warning
- Pattern-based: low enjoyment for specific reasons
- Gap-based post-smoke: craving vs enjoyment analysis
- Time-based: late night smoking notice
- Streak encouragement

### Gamification
- **Points**: 5 base + 3 first-of-day + 5 awareness gap + day-end bonuses
- **10 Levels**: matikhil -> aluf (0-8000 pts)
- **15 Badges**: milestones, reduction, consistency, awareness, special
- **Streaks**: day = count < yesterday OR count < overall average

## File Structure
```
src/
  types/index.ts              — all TypeScript interfaces
  constants/
    reasons.ts                — smoking reasons, craving/enjoyment labels
    levels.ts                 — 10 level definitions
    badges.ts                 — 15 badge definitions with evaluate functions
  stores/
    useAppStore.ts            — profile + isOnboarded (key: qst_app)
    useCigaretteStore.ts      — entries + CRUD (key: qst_cigarettes)
    useAchievementStore.ts    — points, level, badges (key: qst_achievements)
  lib/
    dateUtils.ts              — todayStr, toLocalDate, formatDateHebrew, formatTime, etc.
    analytics.ts              — groupByDate, dailyStats, paceComparison, reasonAnalysis, etc.
    feedback.ts               — pre-smoke + post-smoke feedback generation
    gamification.ts           — points calc, streak calc, badge evaluation
  components/
    layout/AppShell.tsx       — Outlet + BottomNav wrapper
    layout/BottomNav.tsx      — 5-tab bottom nav (z-50)
    shared/RatingScale.tsx    — reusable 1-5 emoji rating
    logging/LogModal.tsx      — 5-step cigarette logging flow (z-[60])
  pages/
    Onboarding.tsx            — 2-step wizard
    Dashboard.tsx             — main dashboard
    History.tsx               — day-by-day expandable history
    Analytics.tsx             — 6 charts
    Achievements.tsx          — badges + level progress
    Settings.tsx              — profile, stats, export/import
```

## New Files (this update)
```
src/lib/useAutoClose.ts                    — auto-close hook + notification helpers
src/components/logging/RetroactiveModal.tsx — retroactive entry modal (5 steps)
```

## Bugs Fixed
1. **Modal z-index overlap** — LogModal and BottomNav both at z-50, click hit nav instead of modal button. Fix: raised modal to z-[60], added pb-8.
2. **Timezone bug** — startedAt stored as UTC ISO but compared against local date. At night in Israel (UTC+3), dates mismatched. Fix: `toLocalDate()` helper in dateUtils.ts, updated 13 files.

## Development
```bash
npm install
npm run dev      # localhost:5173 (+ network access via host:true)
npm run build    # production build to dist/
```

## Deployment
Vercel auto-deploys on push to master branch.
Project: ariestainfelds-projects/quit-smoking-app

## Design Decisions
- No financial tracking (explicitly excluded by requirement)
- No backend/push notifications — pure client-side app
- HashRouter for static file compatibility
- Baseline = estimated daily cigarettes at start of tracking (for comparison only)
- Dark theme + RTL throughout
- Emoji-rich UI (navigation, ratings, badges, messages)
