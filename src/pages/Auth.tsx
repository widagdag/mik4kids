import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowRight,
  LoaderCircle,
  Mail,
  UserX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth";

const LOGO_DATA_URL =
  "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2064%2064'%20fill='none'%3e%3crect%20x='13.5'%20y='13.5'%20width='37'%20height='37'%20stroke='%230A0A0A'%20stroke-width='4'%20/%3e%3crect%20x='13.5'%20y='13.5'%20width='37'%20height='37'%20transform='rotate(45%2032%2032)'%20stroke='%230A0A0A'%20stroke-width='4'%20/%3e%3ccircle%20cx='32'%20cy='32'%20r='3.5'%20fill='%230A0A0A'%20/%3e%3c/svg%3e";

type Mode = { step: "signIn" } | { step: "verify"; email: string };

function safeReturnTo(value: string | null, fallback = "/dashboard"): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export default function AuthPage() {
  const { isLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"));

  const [mode, setMode] = useState<Mode>({ step: "signIn" });
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate(returnTo);
  }, [isLoading, isAuthenticated, navigate, returnTo]);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      await signIn("email-otp", fd);
      setMode({ step: "verify", email: String(fd.get("email")) });
      setSubmitting(false);
    } catch (err) {
      console.error("Email sign-in error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send verification code. Please try again.",
      );
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      await signIn("email-otp", fd);
      navigate(returnTo);
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("The verification code you entered is incorrect.");
      setSubmitting(false);
      setCode("");
    }
  };

  const handleGuest = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(returnTo);
    } catch (err) {
      console.error("Guest login error:", err);
      setError(
        `Failed to sign in as guest: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center">
        <div className="flex h-full flex-col items-center justify-center">
          <Card className="min-w-[350px] border-neutral-200 pb-0 shadow-none">
            {mode.step === "signIn" ? (
              <>
                <CardHeader className="text-center">
                  <div className="flex justify-center">
                    <img
                      src={LOGO_DATA_URL}
                      alt="Lock Icon"
                      width={64}
                      height={64}
                      className="mt-4 mb-4 cursor-pointer rounded-lg"
                      onClick={() => navigate("/")}
                    />
                  </div>
                  <CardTitle className="text-xl">Welcome to MIK for Kids</CardTitle>
                  <CardDescription>
                    Enter your email to sign in and keep learning
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleEmailSubmit}>
                  <CardContent>
                    <div className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          name="email"
                          placeholder="name@example.com"
                          type="email"
                          className="pl-9"
                          disabled={submitting}
                          required
                        />
                      </div>
                      <Button type="submit" variant="outline" size="icon" disabled={submitting}>
                        {submitting ? (
                          <Spinner className="h-4 w-4" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                    <div className="mt-4">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={handleGuest}
                        disabled={submitting}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Continue as Guest
                      </Button>
                    </div>
                  </CardContent>
                </form>
              </>
            ) : (
              <>
                <CardHeader className="mt-4 text-center">
                  <CardTitle>Check your email</CardTitle>
                  <CardDescription>
                    We've sent a code to {mode.email}
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleOtpSubmit}>
                  <CardContent className="pb-4">
                    <input type="hidden" name="email" value={mode.email} />
                    <input type="hidden" name="code" value={code} />
                    <input type="hidden" name="mockOtpAccepted" value="1" />
                    <div className="flex justify-center">
                      <Input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                        disabled={submitting}
                        className="text-center text-2xl tracking-[0.5em]"
                        aria-label="6-digit verification code"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && code.length === 6 && !submitting) {
                            (e.target as HTMLInputElement).closest("form")?.requestSubmit();
                          }
                        }}
                      />
                    </div>
                    {error && (
                      <p className="mt-2 text-center text-sm text-red-500">{error}</p>
                    )}
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      Didn't receive a code?{" "}
                      <Button
                        variant="link"
                        className="h-auto p-0"
                        onClick={() => setMode({ step: "signIn" })}
                        type="button"
                      >
                        Try again
                      </Button>
                    </p>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting || code.length !== 6}
                    >
                      {submitting ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify code <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setMode({ step: "signIn" })}
                      disabled={submitting}
                      className="w-full"
                    >
                      Use different email
                    </Button>
                  </CardFooter>
                </form>
              </>
            )}
            <div className="rounded-b-lg border-t bg-muted px-6 py-4 text-center text-xs text-muted-foreground">
              Secured by{" "}
              <a
                href="https://freebuff.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-colors hover:text-primary"
              >
                freebuff.com
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function AuthWithSuspense(props: Record<string, unknown>) {
  return (
    <Suspense fallback={null}>
      <AuthPage {...props} />
    </Suspense>
  );
}
