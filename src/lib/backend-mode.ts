/**
 * Backend selection, parsed from Vite env vars.
 *
 * Kept free of any backend imports so the entry bundle stays small — the
 * Convex client libraries are only loaded by the lazy backend chunk
 * (src/lib/convex-backend.ts) when VITE_BACKEND=convex.
 */

export type BackendMode = "mock" | "convex";

export const backendKind: BackendMode =
  (import.meta.env.VITE_BACKEND as BackendMode | undefined) ?? "mock";

export const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
