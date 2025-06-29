import { KyselyAdapter } from "@auth/kysely-adapter";
import { type NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";

import { MagicLinkEmail, resend, siteConfig } from "@saasfly/shared";
import { db } from "./db";
import { env } from "./env.mjs";

interface GitHubProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  adapter: KyselyAdapter(db),
  providers: [
    GithubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      httpOptions: { timeout: 15000 },
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      profile(profile: GitHubProfile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email ?? '',
          image: profile.avatar_url,
        }
      },
    }),
    EmailProvider({
      sendVerificationRequest: async ({ identifier, url }) => {
        const user = await db
          .selectFrom("User")
          .select(["name", "emailVerified"])
          .where("email", "=", identifier)
          .executeTakeFirst();
        const userVerified = !!user?.emailVerified;
        const authSubject = userVerified
          ? `Sign-in link for ${(siteConfig as { name: string }).name}`
          : "Activate your account";

        try {
          await resend.emails.send({
            from: env.RESEND_FROM,
            to: identifier,
            subject: authSubject,
            react: MagicLinkEmail({
              firstName: user?.name ?? "",
              actionUrl: url,
              mailType: userVerified ? "login" : "register",
              siteName: (siteConfig as { name: string }).name,
            }),
            headers: {
              "X-Entity-Ref-ID": new Date().getTime() + "",
            },
          });
        } catch (error) {
          console.log(error);
        }
      },
    }),
  ],
  callbacks: {
    signIn({ account: _account }) {
      return true;
    },
    redirect({ url, baseUrl }) {
      // Always allow callback URLs
      if (url.includes('/api/auth/callback')) {
        return url;
      }
      
      // Handle relative URLs
      if (url.startsWith('/')) {
        try {
          // Get requested URL
          const requestedUrl = new URL(url, baseUrl);
          const pathname = requestedUrl.pathname;
          
          // If URL already has a locale prefix, use it as is
          if (/^\/[a-z]{2}\//.test(pathname)) {
            return requestedUrl.toString();
          }
          
          // Add default locale prefix if missing
          const newPath = `/en${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
          requestedUrl.pathname = newPath;
          
          return requestedUrl.toString();
        } catch {
          // Fallback to baseUrl if URL parsing fails
          return baseUrl;
        }
      }
      
      // Allow same-origin URLs
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      // Default to base URL with dashboard
      return `${baseUrl}/en/dashboard`;
    },
    session({ token, session }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.isAdmin = !!token.isAdmin;
      }
      return session;
    },
    jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  debug: false,
};
