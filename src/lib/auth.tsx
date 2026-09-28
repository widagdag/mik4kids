import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "./types";
import { useLocation } from "react-router";
import { backend, useApiMutation } from "./api";
import { notifyStoreChange } from "./store-events";

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  pendingEmail: string | null;
  signIn: (provider: "email-otp" | "anonymous", formData?: FormData) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // 'idle' until the first session check runs; landing traffic never pays
  // for it (it would force the backend chunk into every landing visit).
  const [authStatus, setAuthStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const location = useLocation();

  // Deferred backend wrappers: they wait for the backend chunk to load, so
  // neither the Convex client nor the mock backend ends up in the entry
  // bundle (see src/lib/api.ts).
  const getUser = useApiMutation(() => backend.getUser());
  const signInAnonymous = useApiMutation(() => backend.signInAnonymous());
  const requestEmailOtp = useApiMutation((email: string) =>
    backend.requestEmailOtp(email),
  );
  const verifyEmailOtp = useApiMutation((args: { code: string; email?: string }) =>
    backend.verifyEmailOtp(args.code, args.email),
  );
  const signOutFn = useApiMutation(() => backend.signOut());

  // One-shot session check, run lazily the first time the visitor leaves the
  // landing page (any real app route needs to know the session state).
  const bootstrapRef = useRef<Promise<void> | null>(null);
  const ensureBootstrapped = useCallback(() => {
    bootstrapRef.current ??= getUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => {
        setAuthStatus("ready");
        // Deep-linked pages may have fired queries before the session check
        // finished (unauthenticated -> rejected). Nudge them to refetch now
        // that auth state is settled.
        notifyStoreChange();
      });
    return bootstrapRef.current;
  }, [getUser]);

  useEffect(() => {
    if (location.pathname !== "/") ensureBootstrapped();
  }, [location.pathname, ensureBootstrapped]);

  const signIn = useCallback(
    async (provider: "email-otp" | "anonymous", formData?: FormData) => {
      if (provider === "anonymous") {
        const u = await signInAnonymous();
        setUser(u);
        setPendingEmail(null);
        return;
      }
      const email = String(formData?.get("email") ?? "");
      const code = formData?.get("code");
      if (code == null) {
        await requestEmailOtp(email);
        setPendingEmail(email);
      } else {
        // The verify form re-submits the email as a hidden input, so the
        // email survives even if the auth context's pendingEmail is lost.
        const u = await verifyEmailOtp({
          code: String(code),
          email: email || (pendingEmail ?? undefined),
        });
        setUser(u);
        setPendingEmail(null);
      }
    },
    // pendingEmail is deliberately omitted: the verify form always re-sends
    // the email as a hidden input, so a stale fallback is harmless (same as
    // the previous always-stale closure).
    [signInAnonymous, requestEmailOtp, verifyEmailOtp],
  );

  const signOut = useCallback(async () => {
    await signOutFn();
    setUser(null);
    setPendingEmail(null);
  }, [signOutFn]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading: authStatus !== "ready",
      isAuthenticated: user !== null,
      user,
      pendingEmail,
      signIn,
      signOut,
    }),
    [authStatus, user, pendingEmail, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
