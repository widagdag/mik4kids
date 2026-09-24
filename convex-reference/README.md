# Recovered backend functions

These files document the exact backend contract recovered from the production
bundle (see `src/lib/api.ts` consumers + function references). They are **not
compiled** while the app runs in mock mode.

When you regain access to a Convex deployment (see README → "Reconnecting
Convex"):

1. Copy these files into a `convex/` folder at the project root (alongside
   `src/`).
2. Run `npx convex dev` — it generates `convex/_generated/api` and syncs the
   functions to your deployment.
3. Point `src/lib/api.ts` at the generated module and set:

   ```
   VITE_BACKEND=convex
   VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
   ```

## Recovered function contract

| Module    | Function             | Type     | Args                                  | Returns |
| --------- | -------------------- | -------- | ------------------------------------- | ------- |
| `surahs`  | `list`               | query    | `{}`                                  | `Surah[]` (with per-user practicedCount) |
| `surahs`  | `getSurah`           | query    | `{ number }`                          | `null` or `{ surah, practiced }` |
| `surahs`  | `seedSurahList`      | mutation | `{}`                                  | `void` (populates catalog from alquran.cloud) |
| `surahs`  | `seedSurah`          | mutation | `{ number }`                          | `void` (fetches full surah w/ ayahs) |
| `surahs`  | `toggleAyahPracticed`| mutation | `{ surahNumber, ayahNumber }`         | `void` |
| `content` | `myRecordings`       | query    | `{}`                                  | `Recording[]` |
| `content` | `courseRecordings`   | query    | `{ surahNumber }`                     | `Recording[]` (with `isMine`, `userName`) |
| `content` | `generateUploadUrl`  | mutation | `{}`                                  | upload URL string |
| `content` | `saveRecording`      | mutation | `{ storageId, title, description?, surahNumber?, ayahNumber? }` | id |
| `content` | `deleteRecording`    | mutation | `{ id }`                              | `void` |
| `content` | `quizBest`           | query    | `{ surahNumber }`                     | `{ score, total } \| null` |
| `content` | `quizSummary`        | query    | `{}`                                  | `{ taken, best? }` |
| `content` | `saveQuizResult`     | mutation | `{ surahNumber, score, total }`       | `void` |
| `content` | `comments`           | query    | `{ targetType, targetId }`            | `Comment[]` |
| `content` | `addComment`         | mutation | `{ targetType, targetId, text }`      | `void` |

Auth was Convex Auth with `email-otp` and `anonymous` providers.

The mock backend in `src/lib/mock-backend.ts` implements this same contract
for offline/demo use.
