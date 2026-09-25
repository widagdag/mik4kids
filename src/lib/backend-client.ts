import { ConvexHttpClient } from "convex/browser";
import { ConvexReactClient } from "convex/react";

export type BackendMode = "mock" | "convex";

export const backendKind: BackendMode =
  (import.meta.env.VITE_BACKEND as BackendMode | undefined) ?? "mock";

export const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

let httpClient: ConvexHttpClient | null = null;

/** Lazy singleton HTTP client — never created in mock mode. */
export function getConvexHttpClient(): ConvexHttpClient {
  if (backendKind !== "convex" || !convexUrl) {
    throw new Error(
      "VITE_BACKEND=convex requires VITE_CONVEX_URL (see .env.example)",
    );
  }
  if (!httpClient) {
    httpClient = new ConvexHttpClient(convexUrl);
    // Defensive reset: a brand-new client can carry stale internal auth
    // state that makes sign-in actions fail with "Could not verify OIDC
    // token claim". Clearing once after construction avoids that.
    try {
      httpClient.clearAuth();
    } catch {
      // older client versions may not expose clearAuth
    }
  }
  return httpClient;
}

let reactClient: ConvexReactClient | null = null;

/** Lazy singleton React client (available if we later switch to useQuery). */
export function getConvexReactClient(): ConvexReactClient {
  if (!convexUrl) {
    throw new Error("VITE_CONVEX_URL is required in convex mode");
  }
  if (!reactClient) reactClient = new ConvexReactClient(convexUrl);
  return reactClient;
}
