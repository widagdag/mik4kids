import { AuthConfig } from "convex/server";

/**
 * Convex Auth's OIDC provider points back at this deployment itself.
 *
 * The domain is hardcoded (rather than read from CONVEX_SITE_URL) because
 * auth.config.ts is evaluated at push time on the CLI machine, where that
 * env var may not be set. If you ever swap deployments, update this URL.
 */
export default {
  providers: [
    {
      domain: "https://optimistic-possum-22.convex.site",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
