/**
 * API layer for MIK for Kids.
 *
 * The app was rebuilt from its deployed frontend after the original Convex
 * project access was lost. The full API contract was recovered from the
 * production bundles, and is implemented twice:
 *
 *  1. `mock` (default): a localStorage-backed backend so the app runs with no
 *     infrastructure at all. Ideal for local development and demos.
 *  2. `convex`: real Convex queries/mutations against the functions in
 *     `convex/` (surahs + content modules), with auth served by Convex Auth
 *     (guest + email-OTP).
 *
 * Select with VITE_BACKEND=convex and VITE_CONVEX_URL=https://<deployment>.convex.cloud
 *
 * Neither backend implementation is imported statically: both live in lazily
 * loaded chunks (they drag in the Convex client libraries / seed data), and
 * `backend` below defers every call until the right chunk has loaded. This
 * keeps the entry bundle small, which the Lighthouse budget depends on.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { backendKind } from "./backend-mode";
import { subscribeToStore } from "./store-events";
import type { MikApi } from "./api-types";

export type { MikApi } from "./api-types";
export { backendKind, convexUrl, type BackendMode } from "./backend-mode";

let backendPromise: Promise<MikApi> | null = null;

function loadBackend(): Promise<MikApi> {
  if (!backendPromise) {
    backendPromise =
      backendKind === "convex"
        ? import("./convex-backend").then((m) => m.convexApi)
        : import("./mock-backend").then((m) => m.mockApi);
  }
  return backendPromise;
}

/**
 * The active backend. Every method is deferred: the call waits for the
 * backend chunk to load, then forwards. The Proxy keeps this module free of
 * static imports of either implementation. Nothing preloads the chunk here:
 * the auth bootstrap (src/lib/auth.tsx) triggers it on the first non-landing
 * route, so landing visits never pay for the backend at all.
 */
export const backend: MikApi = new Proxy({} as MikApi, {
  get(_target, prop: string) {
    return (...args: unknown[]) =>
      loadBackend().then((impl) => {
        const fn = (impl as unknown as Record<string, unknown>)[prop] as
          | ((...a: unknown[]) => unknown)
          | undefined;
        if (typeof fn !== "function") {
          return Promise.reject(
            new Error(`Backend method not found: ${prop}`),
          );
        }
        return fn.apply(impl, args);
      });
  },
});

// Initialize the auth bridge (restores a persisted Convex session if any).
// Done inside the loaded chunk's module scope — nothing to do here.

// ---------------------------------------------------------------------------
// Tiny React binding helpers (useQuery/useMutation analogues that work in
// either backend mode without depending on the Convex provider).
// ---------------------------------------------------------------------------

/** Subscribe to a query, re-fetching whenever the store notifies or deps change. */
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
    return subscribeToStore(refetch);
  }, [refetch, depsKey]);

  return data;
}

/** Stable mutation wrapper (the fn may be recreated on each render). */
export function useApiMutation<Args = void, R = unknown>(
  fn: (args: Args) => Promise<R>,
): (args: Args) => Promise<R> {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback((args: Args) => fnRef.current(args), []);
}
