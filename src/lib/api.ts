/**
 * API layer for MIK for Kids.
 *
 * The app was rebuilt from its deployed frontend after the original Convex
 * project access was lost. The full API contract was recovered from the
 * production bundles, and is implemented twice:
 *
 *  1. `mock` (default): a localStorage-backed backend so the app runs with no
 *     infrastructure at all. Ideal for local development and demos.
 *  2. `convex`: thin adapters wired to `api.surahs.*`, `api.progress.*`,
 *     `api.content.*`, `api.comments.*` and `api.quiz.*` for when you regain
 *     access to a Convex deployment (see convex/ and the README).
 *
 * Select with VITE_BACKEND=convex and VITE_CONVEX_URL=https://<deployment>.convex.cloud
 */

import { ConvexHttpClient } from "convex/browser";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../convex/_generated/api"; // stub in mock mode; real one from `npx convex dev`
import {
  mockAuth,
  mockComments,
  mockContent,
  mockProgress,
  mockQuizzes,
  mockSurahs,
  useMockStoreSubscribe,
} from "./mock-backend";
import type {
  AuthUser,
  Comment,
  PracticedRecord,
  QuizBest,
  QuizSummary,
  Recording,
  Surah,
} from "./types";

export type BackendKind = "mock" | "convex";

export const backendKind: BackendKind =
  (import.meta.env.VITE_BACKEND as BackendKind | undefined) ?? "mock";

const convex =
  backendKind === "convex" && import.meta.env.VITE_CONVEX_URL
    ? new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL)
    : null;

function convexClient(): ConvexHttpClient {
  if (!convex) {
    throw new Error(
      "VITE_BACKEND=convex but VITE_CONVEX_URL is not set — add it to .env.local",
    );
  }
  return convex;
}

// ---------------------------------------------------------------------------
// The API surface used by the UI
// ---------------------------------------------------------------------------

export interface MikApi {
  // auth
  getUser(): Promise<AuthUser | null>;
  signInAnonymous(): Promise<AuthUser>;
  requestEmailOtp(email: string): Promise<void>;
  verifyEmailOtp(code: string): Promise<AuthUser>;
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
    storageId: string;
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

const convexApi: MikApi = {
  // Auth is served by the mock in both modes for now: reconnecting Convex Auth
  // requires the original deployment (see README "Reconnecting Convex").
  async getUser() {
    return mockAuth.getUser();
  },
  async signInAnonymous() {
    return mockAuth.signInAnonymous();
  },
  async requestEmailOtp(email) {
    return mockAuth.requestEmailOtp(email);
  },
  async verifyEmailOtp(code) {
    return mockAuth.verifyEmailOtp(code);
  },
  async signOut() {
    return mockAuth.signOut();
  },

  async listSurahs() {
    return convexClient().query(api.surahs.list, {});
  },
  async getSurah(number) {
    return convexClient().query(api.surahs.getSurah, { number });
  },
  async seedSurahList() {
    return convexClient().mutation(api.surahs.seedSurahList, {});
  },
  async seedSurah(args) {
    return convexClient().mutation(api.surahs.seedSurah, args);
  },

  async listPracticed() {
    return convexClient().query(api.progress.list, {});
  },
  async togglePracticed(args) {
    return convexClient().mutation(api.progress.toggle, args);
  },

  async myRecordings() {
    return convexClient().query(api.content.myRecordings, {});
  },
  async courseRecordings(args) {
    return convexClient().query(api.content.courseRecordings, args);
  },
  async generateUploadUrl() {
    return convexClient().mutation(api.content.generateUploadUrl, {});
  },
  async saveRecording(input) {
    return convexClient().mutation(api.content.saveRecording, input);
  },
  async deleteRecording(args) {
    return convexClient().mutation(api.content.deleteRecording, args);
  },

  async listComments(args) {
    return convexClient().query(api.comments.list, args);
  },
  async addComment(args) {
    return convexClient().mutation(api.comments.addComment, args);
  },

  async quizBest(args) {
    return convexClient().query(api.quiz.best, args);
  },
  async quizSummary() {
    return convexClient().query(api.quiz.summary, {});
  },
  async saveQuizResult(args) {
    return convexClient().mutation(api.quiz.save, args);
  },
};

const mockApi: MikApi = {
  getUser: () => mockAuth.getUser(),
  signInAnonymous: () => mockAuth.signInAnonymous(),
  requestEmailOtp: (email) => mockAuth.requestEmailOtp(email),
  verifyEmailOtp: (code) => mockAuth.verifyEmailOtp(code),
  signOut: () => mockAuth.signOut(),

  listSurahs: () => mockSurahs.list(),
  getSurah: (number) => mockSurahs.getSurah(number),
  seedSurahList: () => mockSurahs.seedSurahList(),
  seedSurah: (args) => mockSurahs.seedSurah(args),

  listPracticed: () => mockProgress.list(),
  togglePracticed: (args) => mockProgress.toggle(args),

  myRecordings: () => mockContent.myRecordings(),
  courseRecordings: (args) => mockContent.courseRecordings(args),
  generateUploadUrl: () => mockContent.generateUploadUrl(),
  saveRecording: (input) => mockContent.saveRecording(input),
  deleteRecording: (args) => mockContent.deleteRecording(args),

  listComments: (args) => mockComments.list(args),
  addComment: (args) => mockComments.addComment(args),

  quizBest: (args) => mockQuizzes.best(args),
  quizSummary: () => mockQuizzes.summary(),
  saveQuizResult: (args) => mockQuizzes.save(args),
};

export const backend: MikApi = backendKind === "convex" ? convexApi : mockApi;

// ---------------------------------------------------------------------------
// Tiny React binding helpers (useQuery/useMutation analogues that work in
// either backend mode without depending on the Convex provider).
// ---------------------------------------------------------------------------

/** Subscribe to a query, re-fetching whenever the mock store notifies or deps change. */
export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  depsKey: string,
): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refetch = useCallback(() => {
    fetcherRef
      .current()
      .then((d) => setData(() => d))
      .catch(() => setData(undefined));
  }, []);

  useEffect(() => {
    refetch();
    if (backendKind !== "mock") return;
    return useMockStoreSubscribe()(refetch);
  }, [refetch, depsKey]);

  return data;
}

/** Stable mutation wrapper (the fn may be recreated on each render). */
export function useApiMutation<Args, R = unknown>(
  fn: (args: Args) => Promise<R>,
): (args: Args) => Promise<R> {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback((args: Args) => fnRef.current(args), []);
}
