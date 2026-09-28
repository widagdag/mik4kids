/**
 * The API surface used by the UI. Implemented twice:
 *
 *  1. `mock`  (default): localStorage-backed backend (src/lib/mock-backend.ts)
 *  2. `convex`: real Convex queries/mutations (src/lib/convex-backend.ts)
 *
 * Select with VITE_BACKEND=convex and VITE_CONVEX_URL=https://<deployment>.convex.cloud
 */
import type {
  AuthUser,
  Comment,
  PracticedRecord,
  QuizBest,
  QuizSummary,
  Recording,
  Surah,
} from "./types";

export interface MikApi {
  // auth
  getUser(): Promise<AuthUser | null>;
  signInAnonymous(): Promise<AuthUser>;
  requestEmailOtp(email: string): Promise<void>;
  verifyEmailOtp(code: string, email?: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  // quran
  listSurahs(): Promise<Surah[]>;
  getSurah(number: number): Promise<Surah | null>;
  seedSurahList(): Promise<void>;
  seedSurah(args: { number: number }): Promise<void>;
  // progress
  listPracticed(): Promise<PracticedRecord[]>;
  togglePracticed(args: {
    surahNumber: number;
    ayahNumber: number;
  }): Promise<void>;
  // recordings
  myRecordings(): Promise<Recording[]>;
  courseRecordings(args: { surahNumber: number }): Promise<Recording[]>;
  generateUploadUrl(): Promise<string>;
  saveRecording(input: {
    storageId?: string;
    title: string;
    description?: string;
    surahNumber?: number;
    ayahNumber?: number;
    audioDataUrl?: string;
  }): Promise<string>;
  deleteRecording(args: { id: string }): Promise<void>;
  // comments
  listComments(args: {
    targetType: string;
    targetId: string;
  }): Promise<Comment[]>;
  addComment(args: {
    targetType: string;
    targetId: string;
    text: string;
  }): Promise<void>;
  // quizzes
  quizBest(args: { surahNumber: number }): Promise<QuizBest | null>;
  quizSummary(): Promise<QuizSummary>;
  saveQuizResult(args: {
    surahNumber: number;
    score: number;
    total: number;
  }): Promise<void>;
}
