# MIK for Kids — recovered codebase

A calm, friendly space where children learn the Quran surah by surah, quiz
what they know, and share their own recitations.

This project was **rebuilt from its own production deployment**
(mik4kids.freebuff.app) after the original source and backend access were
lost. Every page, component, design token, and the full API contract were
recovered from the deployed bundles (archived in `_reference/`) — and a new
**Convex backend** is now live (see "Convex backend" below), with a
zero-setup localStorage mock available for offline development.

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
convex/               Live Convex backend (auth, catalog, progress, content)
convex-reference/      Original contract recovered from the production bundle
_reference/            Archived production bundles from the original site
```

- Verse text, transliteration, translation, and per-verse audio come from
  [alquran.cloud](https://alquran.cloud) and the islamic.network CDN
  (recitation by Mishary Rashid Alafasy) — exactly as the original did.
- Audio in "recordings" is stored as data URLs in mock mode.

## Convex backend

A live Convex deployment backs the app (guest + email-OTP sign-in via
Convex Auth, catalog/progress/recordings/comments/quiz data). `.env.local`
selects it:

```
VITE_BACKEND=convex
VITE_CONVEX_URL=https://<deployment>.convex.cloud
```

Backend essentials (`convex/`):

- `auth.ts` — Convex Auth with an `email-otp` provider (6-digit codes via
  Resend when `RESEND_API_KEY` is set on the deployment, otherwise logged to
  deployment logs) and the `anonymous` guest provider. JWTs are signed with
  the deployment's `JWT_PRIVATE_KEY` (PKCS#8 PEM); the matching public set
  lives in `JWKS`. Both were provisioned with `npx convex env set NAME < file`
  (stdin, not argv — multiline values break as CLI arguments on Windows).
- `auth.config.ts` — OIDC provider pointing at the deployment's own
  `convex.site` URL (hardcoded; update it if you swap deployments).
- `http.ts` — exposes `/.well-known/jwks.json` + `/api/auth/*`.
- `surahs.ts` — catalog + progress. Seeds run as **actions** (fetch from
  api.alquran.cloud) that write through internal mutations, and store verse
  audio as a flat `audioUrls` array (derivable from the global ayah number)
  to keep documents small.
- `content.ts` — recordings (Convex file storage), comments, quiz results.

Local development loop:

```bash
npx convex dev        # push functions + regenerate convex/_generated
npm run dev           # frontend against the deployment
```

> The original backend (Convex project `small-aardvark-320`) may still exist
> if you regain access to its dashboard login — its data (users, practiced
> verses, recordings, comments, quiz results) would be there. This repo now
> runs on its own deployment (`optimistic-possum-22`), so nothing depends on
> the original account.

## Deploying

The original site was a static SPA on Vercel. `npm run build` produces a
fully static `dist/`. For SPA routing, rewrites are needed (Vercel handles
this automatically for Vite projects; on other hosts, rewrite all paths to
`/index.html`).

## Data sources & credits

- Quran text, transliteration, translation (Muhammad Asad): alquran.cloud
- Recitation: Mishary Rashid Alafasy via cdn.islamic.network
- Fonts: Inter (UI) + Amiri (Arabic) via Google Fonts
