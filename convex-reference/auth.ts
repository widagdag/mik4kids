import { QueryCtx, MutationCtx } from "./_generated/server";
import { auth } from "./authSetup";

/** Every app function requires a signed-in user (guest or email). */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not signed in");
  const user = await auth.getUserId(ctx); // from @convex-dev/auth
  if (!user) throw new Error("Not signed in");
  return user;
}
