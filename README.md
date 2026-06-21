# Revibe — Recovery Together

A mobile-first recovery community app built with Expo + Convex.

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) — `curl -fsSL https://bun.sh/install | bash`
- [Expo Go](https://expo.dev/go) on your phone (iOS or Android)
- A free [Convex](https://convex.dev) account

### 1. Install dependencies
```bash
bun install
```

### 2. Set up your Convex backend
```bash
cd packages/backend
bunx convex dev
```
Follow the prompts — it will create a free Convex project and print your deployment URLs.

### 3. Create your `.env` file
Copy `.env.example` to `.env` at the root and fill in the values from step 2:
```
CONVEX_DEPLOYMENT=dev:your-deployment-name
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
EXPO_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
```

### 4. Run the app
In a **second terminal** (keep `convex dev` running in the first):
```bash
cd apps/default
bun start
```
Scan the QR code with Expo Go on your phone.

---

## Project Structure
```
├── apps/
│   └── default/          # Expo app (iOS, Android, Web)
├── packages/
│   └── backend/          # Convex backend
│       └── convex/       # Schema, functions, auth
├── assets/               # Shared images & fonts
├── .env                  # Your local env vars (git-ignored)
├── .env.example          # Template — copy to .env
└── turbo.json            # Turborepo task config
```

## Features
- 🔐 Auth — Google, Apple, email/password, anonymous guest
- 📱 Home feed — posts with likes, comments, mood tags
- 👥 Communities — 6 recovery communities with dedicated feeds
- 📓 Journal — daily mood/pain/energy check-ins with stats
- 💬 Messages — direct messaging with recovery buddies
- 👤 Profile — progress tracking, goals, edit profile
- ⭐ Revibe Pro — subscription with advanced analytics, unlimited DMs, Pro badge

## Subscription (Revibe Pro)
The subscription backend is ready. To go live:
1. Install [RevenueCat](https://www.revenuecat.com) SDK: `bun add react-native-purchases`
2. Replace the mock purchase call in `apps/default/app/subscription.tsx` with the real RevenueCat SDK call (instructions in the file)

## Tech Stack
| Layer | Tech |
|---|---|
| Mobile | Expo Router v55, React Native 0.83, React 19 |
| Backend | Convex 1.38, @convex-dev/auth |
| Auth | Google, Apple, GitHub, Password, Anonymous |
| Styling | React Native StyleSheet, expo-linear-gradient |
| Animations | react-native-reanimated v4 |
| Monorepo | Turborepo + Bun workspaces |
