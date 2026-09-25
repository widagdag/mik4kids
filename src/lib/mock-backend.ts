import type {
  AuthUser,
  Comment,
  PracticedRecord,
  QuizBest,
  QuizResult,
  QuizSummary,
  Recording,
  Surah,
} from "./types";
import fallbackSurahs from "./surah-fallback.json";

/**
 * Local mock backend implementing the exact API contract recovered from the
 * deployed app's Convex functions. Data is persisted to localStorage so the
 * app is fully usable offline; see src/lib/api.ts for how this is selected.
 */

type Listener = () => void;

interface StoreState {
  surahs: Surah[];
  practiced: PracticedRecord[];
  recordings: (Omit<Recording, "url" | "isMine" | "userName"> & {
    ownerKey: string;
    audio?: string; // data URL for locally recorded/uploaded audio
  })[];
  comments: (Omit<Comment, "isMine" | "userName"> & { ownerKey: string })[];
  quizResults: QuizResult[];
  users: Record<string, { name?: string; email?: string }>;
  pendingOtp: Record<string, string>; // email -> code
  otpCodes: Record<string, { email: string }>; // code -> email
}

const STORAGE_KEY = "mik4kids-mock-store-v1";

function todayAt(daysAgo = 0, hoursAgo = 0): number {
  return Date.now() - daysAgo * 86_400_000 - hoursAgo * 3_600_000;
}

function defaultState(): StoreState {
  const surahs: Surah[] = fallbackSurahs.map((s) => ({
    ...s,
    revelationType: s.revelationType as Surah["revelationType"],
  }));
  // A little demo activity so the dashboard shows something on first run.
  return {
    surahs,
    practiced: [
      { surahNumber: 1, ayahNumber: 1 },
      { surahNumber: 1, ayahNumber: 2 },
      { surahNumber: 112, ayahNumber: 1 },
      { surahNumber: 112, ayahNumber: 2 },
    ],
    recordings: [],
    comments: [
      {
        _id: "demo-comment-1",
        _creationTime: todayAt(2),
        targetType: "course",
        targetId: "112",
        text: "My daughter loves this surah — we practice it together every evening!",
        ownerKey: "demo-user",
      },
    ],
    quizResults: [
      { _id: "demo-quiz-1", _creationTime: todayAt(1), surahNumber: 112, score: 4, total: 5 },
    ],
    users: { "demo-user": { name: "Demo Learner" } },
    pendingOtp: {},
    otpCodes: {},
  };
}

function load(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreState;
      // Ensure newly-shipped surah fallbacks are merged in.
      if (Array.isArray(parsed.surahs) && parsed.surahs.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fall through to default
  }
  return defaultState();
}

let state: StoreState = typeof localStorage !== "undefined" ? load() : defaultState();
const listeners = new Set<Listener>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be full or unavailable (e.g. large audio blobs) — keep going in-memory.
  }
}

function notify() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Subscribe to store changes from outside the module (used by useApiQuery). */
export function subscribeToStore(listener: Listener): () => void {
  return subscribe(listener);
}

/** Notify subscribers from outside the store (used by the convex backend after mutations). */
export function notifyStoreChange(): void {
  listeners.forEach((l) => l());
}

function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

let currentOwnerKey: string | null =
  typeof localStorage !== "undefined" ? localStorage.getItem(`${STORAGE_KEY}:user`) : null;
let cachedUser: AuthUser | null = null;

function ownerKeyOrThrow(): string {
  if (!currentOwnerKey) throw new Error("Not signed in");
  return currentOwnerKey;
}

function authUserFor(ownerKey: string): AuthUser {
  const u = state.users[ownerKey];
  if (!u) return { isGuest: true };
  return { name: u.name, email: u.email, isGuest: ownerKey.startsWith("guest:") };
}

export const mockAuth = {
  async getUser(): Promise<AuthUser | null> {
    if (!currentOwnerKey) return null;
    if (!cachedUser) cachedUser = authUserFor(currentOwnerKey);
    return cachedUser;
  },

  async signInAnonymous(): Promise<AuthUser> {
    currentOwnerKey = `guest:${uid()}`;
    localStorage.setItem(`${STORAGE_KEY}:user`, currentOwnerKey);
    state.users[currentOwnerKey] = {};
    cachedUser = { isGuest: true };
    notify();
    return cachedUser;
  },

  async requestEmailOtp(email: string): Promise<void> {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    state.pendingOtp[email] = code;
    state.otpCodes[code] = { email };
    notify();
    // In mock mode the "email" is shown on screen by the Auth page.
    console.info(
      `[MIK mock auth] Verification code for ${email}: ${code} (any 6-digit code is also accepted in mock mode)`,
    );
  },

  async verifyEmailOtp(code: string): Promise<AuthUser> {
    const entry = state.otpCodes[code];
    const email =
      entry?.email ?? (/^\d{6}$/.test(code) ? `learner-${code}@mock.local` : null);
    if (!email) throw new Error("The verification code you entered is incorrect.");
    delete state.pendingOtp[email];
    delete state.otpCodes[code];
    const ownerKey = `email:${email}`;
    currentOwnerKey = ownerKey;
    localStorage.setItem(`${STORAGE_KEY}:user`, currentOwnerKey);
    if (!state.users[ownerKey]) {
      state.users[ownerKey] = { name: email.split("@")[0], email };
    }
    cachedUser = authUserFor(ownerKey);
    notify();
    return cachedUser;
  },

  async signOut(): Promise<void> {
    currentOwnerKey = null;
    cachedUser = null;
    localStorage.removeItem(`${STORAGE_KEY}:user`);
    notify();
  },
};

// ---------------------------------------------------------------------------
// Quran data
// ---------------------------------------------------------------------------

const AUDIO_CDN = "https://cdn.islamic.network/quran/audio/128/ar.alafasy";

/** Fetch a surah with all verses (Arabic + transliteration + translation + audio). */
async function fetchSurahFromApi(number: number): Promise<Surah> {
  const res = await fetch(`https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,en.transliteration,en.asad`);
  if (!res.ok) throw new Error(`alquran.cloud request failed: ${res.status}`);
  const json = await res.json();
  const [ar, tl, tr] = json.data as Array<{
    name?: string;
    englishName?: string;
    revelationType?: string;
    ayahs: Array<{
      number: number;
      numberInSurah: number;
      text: string;
    }>;
  }>;

  const ayahs = ar.ayahs.map((a, i) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    text: a.text,
    transliteration: tl.ayahs[i]?.text ?? "",
    translation: tr.ayahs[i]?.text ?? "",
    audioUrl: `${AUDIO_CDN}/${a.number}.mp3`,
  }));

  const meta = fallbackSurahs.find((s) => s.number === number);
  return {
    number,
    name: meta?.name ?? ar.name ?? "",
    englishName: meta?.englishName ?? ar.englishName ?? "",
    englishNameTranslation: meta?.englishNameTranslation ?? tr.name ?? "",
    numberOfAyahs: ayahs.length,
    revelationType: (meta?.revelationType ?? tr.revelationType ?? "Meccan") as Surah["revelationType"],
    ayahs,
  };
}

export const mockSurahs = {
  async list(): Promise<Surah[]> {
    return delay(state.surahs.map((s) => ({ ...s, ayahs: undefined })));
  },

  async getSurah(number: number): Promise<Surah | null> {
    const meta = state.surahs.find((s) => s.number === number);
    if (!meta) return null;
    if (meta.ayahs) return delay(meta);
    try {
      const full = await fetchSurahFromApi(number);
      meta.ayahs = full.ayahs;
      notify();
      return meta;
    } catch (err) {
      console.warn("[MIK mock] Could not fetch surah verses:", err);
      return null;
    }
  },

  /** Pre-fetch the catalog metadata (used on first load to warm the store). */
  async seedSurahList(): Promise<void> {
    if (state.surahs.length > 0) return;
    state.surahs = fallbackSurahs.map((s) => ({
      ...s,
      revelationType: s.revelationType as Surah["revelationType"],
    }));
    notify();
  },

  async seedSurah({ number }: { number: number }): Promise<void> {
    await this.getSurah(number);
  },
};

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export const mockProgress = {
  async list(): Promise<PracticedRecord[]> {
    ownerKeyOrThrow();
    return delay(
      state.practiced.filter((p) => p.surahNumber >= 1).map((p) => ({ ...p })),
    );
  },

  async toggle({ surahNumber, ayahNumber }: { surahNumber: number; ayahNumber: number }): Promise<void> {
    const owner = ownerKeyOrThrow();
    const idx = state.practiced.findIndex(
      (p) => p.surahNumber === surahNumber && p.ayahNumber === ayahNumber,
    );
    if (idx >= 0) state.practiced.splice(idx, 1);
    else state.practiced.push({ surahNumber, ayahNumber });
    void owner;
    notify();
  },
};

// ---------------------------------------------------------------------------
// Recordings
// ---------------------------------------------------------------------------

function recordingView(
  r: StoreState["recordings"][number],
  viewerKey: string | null,
): Recording {
  const mine = viewerKey !== null && r.ownerKey === viewerKey;
  return {
    _id: r._id,
    _creationTime: r._creationTime,
    title: r.title,
    description: r.description,
    surahNumber: r.surahNumber,
    surahName: r.surahName,
    ayahNumber: r.ayahNumber,
    url: r.audio,
    userName: mine ? "" : (state.users[r.ownerKey]?.name ?? "A young learner"),
    isMine: mine,
  };
}

export const mockContent = {
  async myRecordings(): Promise<Recording[]> {
    const owner = ownerKeyOrThrow();
    return delay(
      state.recordings
        .filter((r) => r.ownerKey === owner)
        .map((r) => recordingView(r, owner))
        .sort((a, b) => b._creationTime - a._creationTime),
    );
  },

  async courseRecordings({ surahNumber }: { surahNumber: number }): Promise<Recording[]> {
    const owner = currentOwnerKey;
    return delay(
      state.recordings
        .filter((r) => r.surahNumber === surahNumber)
        .map((r) => recordingView(r, owner))
        .sort((a, b) => b._creationTime - a._creationTime),
    );
  },

  async generateUploadUrl(): Promise<string> {
    ownerKeyOrThrow();
    // Mock "upload endpoint" — the audio is stored as a data URL in localStorage.
    return "mock://upload";
  },

  async saveRecording(input: {
    storageId?: string;
    title: string;
    description?: string;
    surahNumber?: number;
    ayahNumber?: number;
    audioDataUrl?: string;
  }): Promise<string> {
    const owner = ownerKeyOrThrow();
    const surah = input.surahNumber
      ? state.surahs.find((s) => s.number === input.surahNumber)
      : undefined;
    const id = uid();
    state.recordings.push({
      _id: id,
      _creationTime: Date.now(),
      title: input.title,
      description: input.description,
      surahNumber: input.surahNumber,
      surahName: surah?.englishName,
      ayahNumber: input.ayahNumber,
      ownerKey: owner,
      audio: input.audioDataUrl,
    });
    notify();
    return id;
  },

  async deleteRecording({ id }: { id: string }): Promise<void> {
    ownerKeyOrThrow();
    state.recordings = state.recordings.filter((r) => r._id !== id || r.ownerKey !== ownerKeyOrThrow());
    notify();
  },
};

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export const mockComments = {
  async list({ targetType, targetId }: { targetType: string; targetId: string }): Promise<Comment[]> {
    const owner = currentOwnerKey;
    return delay(
      state.comments
        .filter((c) => c.targetType === targetType && c.targetId === targetId)
        .map((c) => ({
          _id: c._id,
          _creationTime: c._creationTime,
          targetType: c.targetType,
          targetId: c.targetId,
          text: c.text,
          userName: c.ownerKey === owner ? "You" : (state.users[c.ownerKey]?.name ?? "A learner"),
          isMine: c.ownerKey === owner,
        }))
        .sort((a, b) => a._creationTime - b._creationTime),
    );
  },

  async addComment({ targetType, targetId, text }: { targetType: string; targetId: string; text: string }): Promise<void> {
    const owner = ownerKeyOrThrow();
    state.comments.push({
      _id: uid(),
      _creationTime: Date.now(),
      targetType,
      targetId,
      text,
      ownerKey: owner,
    });
    notify();
  },
};

// ---------------------------------------------------------------------------
// Quizzes
// ---------------------------------------------------------------------------

export const mockQuizzes = {
  async best({ surahNumber }: { surahNumber: number }): Promise<QuizBest | null> {
    ownerKeyOrThrow();
    const results = state.quizResults.filter((q) => q.surahNumber === surahNumber);
    if (results.length === 0) return null;
    const best = results.reduce((a, b) => (b.score / b.total > a.score / a.total ? b : a));
    return { score: best.score, total: best.total };
  },

  async summary(): Promise<QuizSummary> {
    ownerKeyOrThrow();
    const taken = state.quizResults.length;
    const best = taken
      ? state.quizResults.reduce((a, b) => (b.score / b.total > a.score / a.total ? b : a))
      : undefined;
    return {
      taken,
      best: best ? { score: best.score, total: best.total } : undefined,
    };
  },

  async save({ surahNumber, score, total }: { surahNumber: number; score: number; total: number }): Promise<void> {
    ownerKeyOrThrow();
    state.quizResults.push({
      _id: uid(),
      _creationTime: Date.now(),
      surahNumber,
      score,
      total,
    });
    notify();
  },
};

export function resetMockData(): void {
  state = defaultState();
  notify();
}

export function useMockStoreSubscribe(): (cb: () => void) => () => void {
  return subscribe;
}
