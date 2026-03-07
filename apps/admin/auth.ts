import type { NextAuthOptions } from "next-auth";
import Auth0Provider from "next-auth/providers/auth0";
import { getRoleByEmail } from "./lib/controlPlane";

function normalizeEmail(input?: string | null): string {
  return input?.trim().toLowerCase() ?? "";
}

export const authOptions: NextAuthOptions = {
  secret: process.env.ADMIN_AUTH_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers:
    process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET && process.env.AUTH0_ISSUER
      ? [
          Auth0Provider({
            clientId: process.env.AUTH0_CLIENT_ID,
            clientSecret: process.env.AUTH0_CLIENT_SECRET,
            issuer: process.env.AUTH0_ISSUER
          })
        ]
      : [],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      const email = normalizeEmail(user.email);
      if (!email) {
        return false;
      }
      const role = getRoleByEmail(email);
      return Boolean(role) || "/access-denied";
    },
    async jwt({ token, user }) {
      const email = normalizeEmail(user?.email ?? token.email);
      token.email = email;
      token.role = email ? getRoleByEmail(email) : null;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = normalizeEmail(token.email as string);
        (session.user as { role?: string }).role = typeof token.role === "string" ? token.role : undefined;
      }
      return session;
    }
  },
  pages: {
    signIn: "/",
    error: "/access-denied"
  }
};
