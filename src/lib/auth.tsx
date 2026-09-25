import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { backend } from "./api";
import type { AuthUser } from "./types";

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
  const [isLoading, setIsLoading] = useState(true);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    backend
      .getUser()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(
    async (provider: "email-otp" | "anonymous", formData?: FormData) => {
      if (provider === "anonymous") {
        const u = await backend.signInAnonymous();
        setUser(u);
        setPendingEmail(null);
        return;
      }
      const email = String(formData?.get("email") ?? "");
      const code = formData?.get("code");
      if (code == null) {
        await backend.requestEmailOtp(email);
        setPendingEmail(email);
      } else {
        // The verify form re-submits the email as a hidden input, so the
        // email survives even if the auth context's pendingEmail is lost.
        const u = await backend.verifyEmailOtp(
          String(code),
          email || (pendingEmail ?? undefined),
        );
        setUser(u);
        setPendingEmail(null);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    await backend.signOut();
    setUser(null);
    setPendingEmail(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: user !== null,
      user,
      pendingEmail,
      signIn,
      signOut,
    }),
    [isLoading, user, pendingEmail, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
