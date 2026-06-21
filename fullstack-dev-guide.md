# Full-Stack Production Dev Guide
### From Zero to Deployed App

---

## PHASE 0 — SET UP YOUR MACHINE

### 1. Install VS Code
1. Go to https://code.visualstudio.com and download for your OS
2. Install it, open it
3. Install these extensions (Ctrl+Shift+X → search each):
   - **ESLint** — catches JS/TS errors
   - **Prettier** — auto-formats your code
   - **GitLens** — shows who changed what and when
   - **Thunder Client** — test APIs without leaving VS Code
   - **Tailwind CSS IntelliSense** — autocomplete for Tailwind classes
   - **Prisma** — syntax highlighting for DB schema (if using Prisma)
   - **DotENV** — highlights `.env` files

### 2. Install Node.js
1. Go to https://nodejs.org — download the **LTS** version
2. Verify: open a terminal in VS Code (Ctrl+`) and run:
   ```
   node -v
   npm -v
   ```
   Both should print version numbers.

### 3. Install Git
1. Go to https://git-scm.com and download for your OS
2. Verify: `git --version`
3. Set your identity (run once):
   ```
   git config --global user.name "Your Name"
   git config --global user.email "you@email.com"
   ```

### 4. Create a GitHub Account
- Go to https://github.com and sign up
- This is where your code lives remotely

---

## PHASE 1 — COPY & UNDERSTAND THE CODE

### How to Copy Someone's Code (Fork or Clone)

**If you have a GitHub repo URL:**
```bash
git clone https://github.com/username/repo-name.git
cd repo-name
```

**If you want your own copy to modify freely (fork first on GitHub):**
1. Go to the repo on GitHub → click **Fork** (top right)
2. Now clone YOUR fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/repo-name.git
   ```

### Open the Project in VS Code
```bash
code .
```
(Run this inside the project folder — opens VS Code there)

### Understanding the Code — What to Look For

| File/Folder | What it does |
|---|---|
| `package.json` | Lists all dependencies and scripts (`npm run dev`, `npm run build`) |
| `.env` or `.env.local` | Secret keys and config — **never commit this to GitHub** |
| `src/` or `app/` | Where the actual app code lives |
| `components/` | Reusable UI pieces |
| `pages/` or `routes/` | Each file = a URL route |
| `lib/` or `utils/` | Helper functions |
| `prisma/schema.prisma` | Database structure (if using Prisma) |
| `README.md` | Read this first — setup instructions |

### Install Dependencies
After cloning, always run:
```bash
npm install
```
This downloads all the packages listed in `package.json`.

### Run the App Locally
```bash
npm run dev
```
Then open `http://localhost:3000` in your browser.

---

## PHASE 2 — FRONTEND

The **frontend** is what users see — buttons, forms, pages.

### Tech Stack Options
- **React + Vite** — most popular, fast
- **Next.js** — React but with routing and backend built in (recommended)
- **Expo (React Native)** — for mobile apps

### Start a New Next.js Project
```bash
npx create-next-app@latest my-app
cd my-app
npm run dev
```

### Basic File Structure (Next.js App Router)
```
app/
  layout.tsx        ← wraps every page (navbar, fonts, providers)
  page.tsx          ← the homepage (/)
  about/page.tsx    ← the /about route
  api/
    users/route.ts  ← your backend API at /api/users
components/
  Button.tsx        ← reusable components
public/             ← images, icons
```

### How to Edit a Page
Open `app/page.tsx`, change the JSX, save — browser auto-refreshes.

### Styling with Tailwind CSS
Add classes directly on elements:
```tsx
<button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
  Click me
</button>
```
No separate CSS file needed.

---

## PHASE 3 — APIs & BACKEND LOGIC

An **API** (Application Programming Interface) is code that handles requests from the frontend and returns data.

### How APIs Work
```
Browser → sends request to /api/users
Server  → runs code, queries database
Server  → returns JSON { users: [...] }
Browser → displays the data
```

### Create an API Route (Next.js)
File: `app/api/users/route.ts`
```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  const users = await db.user.findMany()  // query your database
  return NextResponse.json({ users })
}

export async function POST(req: Request) {
  const body = await req.json()
  const newUser = await db.user.create({ data: body })
  return NextResponse.json(newUser, { status: 201 })
}
```

### HTTP Methods — What Each Does
| Method | Use for |
|---|---|
| `GET` | Read data |
| `POST` | Create new data |
| `PUT` / `PATCH` | Update existing data |
| `DELETE` | Remove data |

### Test Your API
Use **Thunder Client** in VS Code:
1. Click the Thunder Client icon in the sidebar
2. New Request → set method to GET
3. URL: `http://localhost:3000/api/users`
4. Send → see the response

Or use **Postman** (free at https://postman.com).

---

## PHASE 4 — DATABASE & STORAGE

The **database** is where your data lives permanently.

### Choose a Database
| Option | Best for | Free tier |
|---|---|---|
| **Supabase** (PostgreSQL) | Most apps — full-featured | Yes |
| **PlanetScale** | MySQL, scales easily | Yes |
| **MongoDB Atlas** | Flexible/unstructured data | Yes |
| **Neon** | Serverless Postgres | Yes |
| **Convex** | Real-time apps | Yes |

### Using Supabase (Recommended for Beginners)
1. Sign up at https://supabase.com
2. Create a new project
3. Go to **Table Editor** → create tables visually
4. Get your connection string from **Settings → Database**

### Using Prisma (ORM — makes DB queries easy)
Install:
```bash
npm install prisma @prisma/client
npx prisma init
```

Define your schema in `prisma/schema.prisma`:
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  posts     Post[]
}

model Post {
  id      String @id @default(cuid())
  title   String
  body    String
  userId  String
  user    User   @relation(fields: [userId], references: [id])
}
```

Push to your database:
```bash
npx prisma db push
npx prisma studio   # opens a GUI to browse your data
```

Query data in your API:
```typescript
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const users = await db.user.findMany()
const user = await db.user.findUnique({ where: { id: '123' } })
const newUser = await db.user.create({ data: { email: 'a@b.com', name: 'Al' } })
await db.user.update({ where: { id: '123' }, data: { name: 'Bob' } })
await db.user.delete({ where: { id: '123' } })
```

### File/Image Storage
Use **Supabase Storage** or **Cloudinary**:
```bash
npm install @supabase/supabase-js
```
```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('user123.png', file)
```

---

## PHASE 5 — AUTH & PERMISSIONS

**Auth** = who you are (login). **Permissions** = what you're allowed to do.

### Option 1: Clerk (Easiest — recommended)
1. Sign up at https://clerk.com
2. Create an app → copy your API keys
3. Install:
   ```bash
   npm install @clerk/nextjs
   ```
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...
   ```
5. Wrap your app in `ClerkProvider`, add `<SignIn />` and `<SignUp />` components — done.

### Option 2: NextAuth.js
```bash
npm install next-auth
```
Supports Google, GitHub, email/password, and 50+ providers.

### Option 3: Supabase Auth
Built into Supabase — free, supports email, OAuth, magic links.

### Protecting Routes (Next.js middleware)
```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: ['/', '/sign-in', '/sign-up'],
})
```

### Row-Level Security (RLS)
In Supabase, RLS lets the database enforce "users can only see their own data":
```sql
-- In Supabase SQL editor:
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own posts"
ON posts FOR SELECT
USING (auth.uid() = user_id);
```

---

## PHASE 6 — ENVIRONMENT VARIABLES & API KEYS

**Never hardcode secrets in your code.** Use `.env` files.

### Create `.env.local`
```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
CLERK_SECRET_KEY=sk_...
STRIPE_SECRET_KEY=sk_live_...
```

Rules:
- Variables starting with `NEXT_PUBLIC_` are exposed to the browser — safe for public keys only
- All others are server-side only — keep secret keys here
- Add `.env.local` to `.gitignore` so it never gets committed

### Access in Code
```typescript
const dbUrl = process.env.DATABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
```

---

## PHASE 7 — VERSION CONTROL (GIT)

Git tracks every change you make so you can undo mistakes and collaborate.

### Daily Git Workflow
```bash
git status              # see what changed
git add .               # stage all changes
git commit -m "Add login page"   # save a snapshot
git push                # push to GitHub
```

### Branches — Work Without Breaking Things
```bash
git checkout -b feature/add-dashboard   # create + switch to new branch
# ... make your changes ...
git add . && git commit -m "Add dashboard"
git push origin feature/add-dashboard
# Then on GitHub: open a Pull Request to merge into main
```

### Undo Mistakes
```bash
git restore filename.tsx        # undo unsaved changes to one file
git restore .                   # undo all unsaved changes
git revert HEAD                 # undo the last commit (safe)
```

---

## PHASE 8 — HOSTING & DEPLOYMENT

### Frontend / Full-Stack Apps

**Vercel (Best for Next.js — free tier)**
1. Push your code to GitHub
2. Go to https://vercel.com → New Project
3. Import your GitHub repo
4. Add your environment variables (same as `.env.local`)
5. Click Deploy — done. Your app is live in ~2 minutes.

Every `git push` auto-deploys. Preview deployments for every PR.

**Netlify** — similar to Vercel, also free tier.

### Backend / APIs

**Railway** (https://railway.app)
- Deploy Node.js, Python, Go backends
- Auto-detects your stack
- Free tier available

**Render** (https://render.com)
- Similar to Railway
- Free tier for web services (sleeps after inactivity)

### Mobile Apps (Expo)
```bash
npx eas build --platform ios
npx eas build --platform android
npx eas submit          # submit to App Store / Play Store
```
Requires Expo account at https://expo.dev

---

## PHASE 9 — CI/CD (AUTOMATED TESTING & DEPLOYMENT)

CI/CD means your code is automatically tested and deployed on every push.

### GitHub Actions (Free, built into GitHub)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run test
      - run: npm run build
```

Vercel automatically handles deployment via GitHub integration — you don't need a separate deploy step for Next.js apps.

---

## PHASE 10 — SECURITY

### Basic Security Checklist
- [ ] All secrets in `.env`, never in code
- [ ] `.env` files in `.gitignore`
- [ ] Input validation on ALL API routes (use **Zod**)
- [ ] Authentication on protected routes
- [ ] RLS enabled on database tables
- [ ] HTTPS only (Vercel handles this automatically)
- [ ] HTTP security headers (Vercel handles most of these)

### Input Validation with Zod
```bash
npm install zod
```
```typescript
import { z } from 'zod'

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  age: z.number().min(13).max(120),
})

export async function POST(req: Request) {
  const body = await req.json()
  const result = CreateUserSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // safe to use result.data now
}
```

---

## PHASE 11 — RATE LIMITING

Prevents abuse — limits how many requests one user can make.

### With Upstash Rate Limit (Free)
1. Sign up at https://upstash.com → create a Redis database
2. Install:
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```
3. Add to `.env.local`:
   ```
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```
4. Use in your API route:
   ```typescript
   import { Ratelimit } from '@upstash/ratelimit'
   import { Redis } from '@upstash/redis'

   const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
   })

   export async function POST(req: Request) {
     const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
     const { success } = await ratelimit.limit(ip)

     if (!success) {
       return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
     }
     // ... rest of handler
   }
   ```

---

## PHASE 12 — CACHING & CDN

**Caching** = storing data so you don't re-fetch it every time.
**CDN** = serving your files from servers close to your users.

### Built-in Next.js Caching
```typescript
// Cache this API response for 60 seconds
export async function GET() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 },
  })
  return NextResponse.json(await data.json())
}
```

### Vercel Edge Network
Vercel automatically puts your static assets (images, JS, CSS) on a global CDN. No configuration needed.

### Redis Caching (for expensive DB queries)
```bash
npm install ioredis
```
```typescript
const redis = new Redis(process.env.REDIS_URL)

async function getUsers() {
  const cached = await redis.get('users')
  if (cached) return JSON.parse(cached)

  const users = await db.user.findMany()
  await redis.setex('users', 300, JSON.stringify(users))  // cache 5 min
  return users
}
```

---

## PHASE 13 — ERROR TRACKING & LOGS

You need to know when your app crashes in production.

### Sentry (Free tier — industry standard)
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```
Sign up at https://sentry.io — every error in production gets captured with the full stack trace and user context.

### Logging with Axiom or Logtail
```bash
npm install @axiomhq/pino pino
```
Structured logs you can search and filter in production.

### Vercel Logs
Vercel has built-in log streaming — go to your project dashboard → **Logs** tab.

---

## PHASE 14 — LOAD BALANCING & SCALING

The good news: if you deploy on **Vercel**, this is handled for you automatically.

- Vercel uses **serverless functions** — each request spins up independently
- No server to manage, scales to zero when idle, scales to millions automatically
- For databases, **PlanetScale** and **Neon** scale automatically too

For custom backends on Railway/Render:
- Start with one instance
- Add horizontal scaling (more instances) when CPU > 70%
- Add a load balancer when you have multiple instances

---

## PHASE 15 — AVAILABILITY & RECOVERY

### Uptime Monitoring
- **UptimeRobot** (free) — pings your site every 5 minutes, emails you if it's down
  - Sign up at https://uptimerobot.com
  - Add monitor → set your URL

### Database Backups
- **Supabase** — automatic daily backups on paid plan; manual on free
- **PlanetScale** — automatic backups
- Run manual backup with Prisma:
  ```bash
  npx prisma db pull   # saves current schema
  ```

### Disaster Recovery Checklist
- [ ] Code is on GitHub (if your laptop dies, code survives)
- [ ] Database has automated backups
- [ ] Environment variables are saved somewhere safe (1Password, Doppler)
- [ ] You can redeploy from scratch in < 30 minutes

---

## QUICK REFERENCE: TOOLS BY LAYER

| Layer | Tool | Free? |
|---|---|---|
| Frontend | Next.js + Tailwind | ✅ |
| UI Components | shadcn/ui | ✅ |
| Backend API | Next.js API Routes | ✅ |
| Database | Supabase (Postgres) | ✅ |
| Auth | Clerk or Supabase Auth | ✅ |
| File Storage | Supabase Storage | ✅ |
| Payments | Stripe | ✅ (% fee) |
| Deployment | Vercel | ✅ |
| CI/CD | GitHub Actions | ✅ |
| Rate Limiting | Upstash | ✅ |
| Caching | Upstash Redis | ✅ |
| Error Tracking | Sentry | ✅ |
| Uptime Monitor | UptimeRobot | ✅ |
| Email | Resend | ✅ |

---

## THE FULL WORKFLOW — START TO DEPLOYED

```
1. npx create-next-app@latest my-app
2. cd my-app && code .
3. Set up GitHub repo: git init, git remote add origin ...
4. Set up Supabase + Prisma (database)
5. Set up Clerk (auth)
6. Build your pages and API routes
7. Test locally: npm run dev
8. Push to GitHub: git add . && git commit -m "init" && git push
9. Deploy on Vercel: import repo → add env vars → deploy
10. Set up Sentry (error tracking)
11. Set up UptimeRobot (uptime monitoring)
12. Ship 🚀
```

---

## LEARNING RESOURCES

- **Next.js docs**: https://nextjs.org/docs
- **Supabase docs**: https://supabase.com/docs
- **Prisma docs**: https://www.prisma.io/docs
- **Clerk docs**: https://clerk.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Fireship on YouTube**: best short video explanations of every concept
- **theodore.io / Josh Tried Coding**: real-world Next.js tutorials
