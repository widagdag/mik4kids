/**
 * Placeholder for the Convex code-generated API module.
 *
 * When you run `npx convex dev` (see README "Reconnecting Convex"), Convex
 * generates the real `api` object from the functions in `convex/`. This stub
 * keeps `src/lib/api.ts` typechecking in mock mode.
 *
 * NOTE: with this stub, only mock mode works. The convex adapters in
 * src/lib/api.ts compile but will throw at runtime until the real module
 * is generated.
 */

export const api: any = new Proxy(
  {},
  {
    get(_target, module) {
      return new Proxy(
        {},
        {
          get(_t2, fn) {
            const path = `${String(module)}.${String(fn)}`;
            return { _stub: true, path };
          },
        },
      );
    },
  },
) as any;
