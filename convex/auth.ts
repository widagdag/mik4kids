import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Email } from "@convex-dev/auth/providers/Email";

/**
 * Convex Auth setup. The destructured exports below ARE the deployed auth
 * functions (api.auth.signIn, api.auth.signOut, api.auth.loggedIn, ...).
 *
 * Email OTP (provider id "email-otp", matching the recovered app):
 * delivery uses the Resend REST API when RESEND_API_KEY is set on the
 * deployment (`npx convex env set RESEND_API_KEY re_...`). Without it, the
 * code is printed to the deployment logs — the guest flow works either way.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Email({
      id: "email-otp",
      from: "MIK for Kids <onboarding@resend.dev>",
      maxAge: 60 * 10, // code valid for 10 minutes
      generateVerificationToken: () =>
        Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0"),
      async sendVerificationRequest({ provider, identifier, token, expires }) {
        const email = identifier;
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          console.log(
            `[MIK for Kids] Sign-in code for ${email}: ${token} (RESEND_API_KEY not set)`,
          );
          return;
        }
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: provider.from,
            to: [email],
            subject: "Your MIK for Kids sign-in code",
            text: `Your verification code is ${token}. It expires at ${
              expires?.toISOString?.() ?? "in 10 minutes"
            }.`,
          }),
        });
        if (!res.ok) {
          throw new Error(`Failed to send sign-in email: ${await res.text()}`);
        }
      },
    }),
    Anonymous(),
  ],
});
