import { ConvexHttpClient } from "convex/browser";
import { backendKind, convexUrl } from "./backend-mode";

export { backendKind, convexUrl, type BackendMode } from "./backend-mode";

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
