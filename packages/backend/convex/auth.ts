import Google from "@auth/core/providers/google";
import GitHub from "@auth/core/providers/github";
import Apple from "@auth/core/providers/apple";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { convexAuth } from "@convex-dev/auth/server";
import { env } from "./env";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Google, GitHub, Apple, Password, Anonymous],
  callbacks: {
    async redirect({ redirectTo }) {
      const siteUrl = env.SITE_URL ?? "";

      // Allow relative paths
      if (redirectTo.startsWith("/")) return redirectTo;

      // Allow SITE_URL-matching redirects
      if (siteUrl && redirectTo.startsWith(siteUrl)) return redirectTo;

      // Allow native app schemes (Expo Go and custom schemes)
      if (
        redirectTo.startsWith("exp://") ||
        redirectTo.startsWith("myapp://") ||
        redirectTo.startsWith("revibe://")
      ) {
        return redirectTo;
      }

      // Default: send back to site root
      return siteUrl || "/";
    },
  },
});
