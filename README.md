# MIK for Kids — recovered codebase

A calm, friendly space where children learn the Quran surah by surah, quiz
what they know, and share their own recitations.

This project was **rebuilt from its own production deployment**
(mik4kids.freebuff.app) after the original source and Convex access were
lost. Every page, component, design token, and the full backend API contract
were recovered from the deployed bundles (archived in `_reference/`).

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

No accounts, no environment variables, no backend needed — the app ships
with a **mock backend** (localStorage) that implements the exact API the
original Convex backend exposed. Try the guest sign-in, mark verses learned,
take quizzes, record/upload recitations (stored locally), and post comments.

```bash
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build
```

## Routes

| Route                | Page                                                        |
| -------------------- | ----------------------------------------------------------- |
| `/`                  | Landing                                                     |
| `/auth?returnTo=…`   | Sign-in (email OTP + guest)                                 |
| `/dashboard`         | Stats, continue-learning, recent recordings                 |
| `/catalog`           | 38 surah courses (Al-Fatiha + Juz Amma), with search        |
| `/learn/:surahNumber`| Verse-by-verse course: audio, repeat, mark learned, share recordings, comments |
| `/quiz/:surahNumber` | 5 generated questions, scoring, best-score saving           |
| `/my-content`        | All of your recordings                                      |

## Architecture

```
src/
  lib/
    api.ts             API surface + mock/convex selection (VITE_BACKEND)
    mock-backend.ts    localStorage backend implementing the recovered contract
    auth.tsx           Auth context (email-otp + anonymous, like Convex Auth)
    surah-fallback.json  Catalog metadata for all 38 surahs
    types.ts           Domain types
  hooks/use-quran.ts   Catalog/surah hooks with auto-seed + retry
  pages/               One file per route
  components/          UI primitives (shadcn-style) + brand + header
convex-reference/      Reference Convex functions/schema for reconnection
_reference/            Archived production bundles from the original site
```

- Verse text, transliteration, translation, and per-verse audio come from
  [alquran.cloud](https://alquran.cloud) and the islamic.network CDN
  (recitation by Mishary Rashid Alafasy) — exactly as the original did.
- Audio in "recordings" is stored as data URLs in mock mode.

## Reconnecting Convex (when you regain access)

The original backend was Convex (deployment `small-aardvark-320.convex.cloud`)
with Convex Auth (`email-otp` + `anonymous` providers). If you can sign in at
[dashboard.convex.dev](https://dashboard.convex.dev) you may find the original
project there — its data (users, practiced verses, recordings, comments, quiz
results) is still stored server-side.

To wire this frontend to a Convex deployment:

1. Install Convex dev dependencies:

   ```bash
   npm install -D convex @convex-dev/auth
   ```

2. Copy the reference functions into a `convex/` folder:

   ```bash
   cp convex-reference/*.ts convex/
   ```

   Adjust imports (the files reference `./_generated/server`, which `npx
   convex dev` generates). `convex-reference/README.md` documents the
   complete recovered function contract.

3. Start the dev loop and generate the API:

   ```bash
   npx convex dev
   ```

   This creates `convex/_generated/` and syncs the schema. Replace the stub
   at `src/convex/_generated/api.ts` with the generated one, and set the
   path alias so `src/lib/api.ts` imports it.

4. Create `.env.local`:

   ```
   VITE_BACKEND=convex
   VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
   ```

5. `npm run dev` — the app now reads/writes the real backend. The auth
   context currently always uses the mock; swap `mockAuth` calls in
   `src/lib/api.ts` for the Convex Auth React client (`ConvexAuthProvider`)
   when you reconnect.

## Deploying

The original site was a static SPA on Vercel. `npm run build` produces a
fully static `dist/`. For SPA routing, rewrites are needed (Vercel handles
this automatically for Vite projects; on other hosts, rewrite all paths to
`/index.html`).

## Data sources & credits

- Quran text, transliteration, translation (Muhammad Asad): alquran.cloud
- Recitation: Mishary Rashid Alafasy via cdn.islamic.network
- Fonts: Inter (UI) + Amiri (Arabic) via Google Fonts
