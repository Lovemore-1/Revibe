export default {
  providers: [
    {
      // Convex Auth issues JWTs with the issuer set to this deployment's
      // site URL, so the validating domain must match it. CONVEX_SITE_URL is
      // provided automatically by Convex. SITE_URL (the frontend origin) is a
      // separate concern, used only for post-login redirects in auth.ts.
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
