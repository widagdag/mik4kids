import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import EmailOtp from "@auth/core/providers/email"; // see note

/**
 * NOTE: the original app used Convex Auth's Resend OTP flow ("email-otp").
 * If you don't have a Resend API key, keep `Anonymous` only — the guest flow
 * still works, and the Auth page falls back to it.
 */
export const auth = convexAuth({
  providers: [EmailOtp, Anonymous],
});
