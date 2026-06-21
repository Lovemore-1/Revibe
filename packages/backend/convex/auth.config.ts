import { env } from "./env";

export default {
  providers: [
    {
      domain: env.SITE_URL ?? "http://localhost:3000",
      applicationID: "convex",
    },
  ],
};
