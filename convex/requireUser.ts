import { QueryCtx, MutationCtx } from "./_generated/server";
import { query } from "./_generated/server";
import { auth } from "./auth";

/**
 * Every app function requires a signed-in user (guest or email).
 *
 * The Anonymous provider ("Continue as Guest") creates a users row during
 * sign-in via createAccount, and email-OTP sign-ins do the same — so
 * `auth.getUserId` covers every signed-in visitor.
 */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error("Not signed in");
  return ctx.db.get(userId);
}

/** Client-facing "who am I" query (used by the convex auth bridge). */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return user;
  },
});
