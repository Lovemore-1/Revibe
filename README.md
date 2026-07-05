# ReVIBE — Recovery Companion

**Full-stack mobile + web app that helps people recovering from physical injuries (ACL tears, post-surgery rehab) stay consistent through recovery.**

🌐 **Live demo:** [revibe-iota.vercel.app](https://revibe-iota.vercel.app)

Rehab fails quietly: exercises get skipped, motivation dips on bad-pain days, and nobody notices until progress stalls. ReVIBE is built around one behavioral idea — make daily recovery check-ins as habit-forming as a language-learning streak, and surround them with people going through the same thing.

## Features

- **Rehab streak tracker** — daily mood / pain / energy check-ins with milestone progression, designed to drive daily retention
- **AI Recovery Coach** — chat interface for recovery questions and encouragement
- **Community feed** — six recovery communities with posts, likes, comments, and mood tags
- **Recovery buddies** — direct messaging with people on a similar recovery path
- **Journal** — check-in history with stats and trends
- **Tough-day flow** — guided breathing and support sequence for high-pain days
- **Auth** — Google, Apple, email/password, and anonymous guest via Convex Auth
- **ReVIBE Pro** — subscription tier (advanced analytics, unlimited DMs), backend ready for RevenueCat

## Architecture

Turborepo monorepo — one codebase serving iOS, Android, and web:

```
├── apps/
│   └── default/          # Expo app (Expo Router) — iOS, Android, Web
├── packages/
│   └── backend/          # Convex backend
│       └── convex/       # Schema, queries/mutations, auth config
├── assets/               # Shared images & fonts
├── .env.example          # Template — copy to .env
└── turbo.json            # Turborepo task pipeline
```

Design decisions worth noting:

- **Convex as the realtime backend.** Queries are reactive subscriptions, so feeds, messages, and streaks update live without hand-rolled websocket plumbing or cache invalidation. Schema and server functions are TypeScript end-to-end — one type system from database to UI.
- **Monorepo with a shared backend package.** The Expo app and web build consume the same Convex functions, so mobile and web can't drift apart.
- **One React Native codebase for three platforms** via Expo Router; the web build deploys to Vercel from the same code that ships to phones.
- **Auth handled server-side** by `@convex-dev/auth` (OAuth + password + anonymous), so no tokens are managed by hand in the client.

## Tech stack

| Layer | Tech |
|---|---|
| Mobile / Web | Expo Router, React Native 0.83, React 19 |
| Backend | Convex (reactive DB, server functions, file storage) |
| Auth | Convex Auth — Google, Apple, GitHub, password, anonymous |
| Animations | react-native-reanimated v4 |
| Monorepo | Turborepo + Bun workspaces |
| Deployment | Vercel (web), Expo (mobile) |

## Getting started

Prerequisites: [Bun](https://bun.sh), [Expo Go](https://expo.dev/go) on your phone, a free [Convex](https://convex.dev) account.

```bash
# 1. Install
bun install

# 2. Provision the backend (first terminal)
cd packages/backend
bunx convex dev            # creates a free Convex project, prints your URLs

# 3. Configure
cp .env.example .env       # fill in the values printed in step 2

# 4. Run the app (second terminal, keep convex dev running)
cd apps/default
bun start                  # scan the QR code with Expo Go
```

`.env`:

```
CONVEX_DEPLOYMENT=dev:your-deployment-name
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
EXPO_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
```

## Future improvements

- Wire the ReVIBE Pro purchase flow to RevenueCat (backend is ready; the mock call lives in `apps/default/app/subscription.tsx`)
- Physio-assigned exercise plans with per-exercise completion tracking
- Push-notification streak reminders
- Wearable integration (HealthKit / Health Connect) to correlate activity with pain scores
