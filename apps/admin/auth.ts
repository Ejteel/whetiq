import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { getRoleByEmail } from "./lib/controlPlane";

function normalizeEmail(input?: string | null): string {
  return input?.trim().toLowerCase() ?? "";
}

function hasPair(id?: string, secret?: string): boolean {
  return Boolean(id && secret);
}

function buildProviders(): NonNullable<NextAuthOptions["providers"]> {
  const providers: NonNullable<NextAuthOptions["providers"]> = [];

  if (hasPair(process.env.AUTH_GITHUB_ID, process.env.AUTH_GITHUB_SECRET)) {
    providers.push(
      GitHubProvider({
        clientId: process.env.AUTH_GITHUB_ID as string,
        clientSecret: process.env.AUTH_GITHUB_SECRET as string,
      }),
    );
  }

  if (hasPair(process.env.AUTH_GOOGLE_ID, process.env.AUTH_GOOGLE_SECRET)) {
    providers.push(
      GoogleProvider({
        clientId: process.env.AUTH_GOOGLE_ID as string,
        clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
      }),
    );
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  secret:
    process.env.ADMIN_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET,
  providers: buildProviders(),
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      const email = normalizeEmail(user.email);
      if (!email) {
        return false;
      }
      const role = await getRoleByEmail(email);
      return Boolean(role) || "/access-denied";
    },
    async jwt({ token, user }) {
      const email = normalizeEmail(user.email ?? token.email);
      token.email = email;
      token.role = email ? await getRoleByEmail(email) : null;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = normalizeEmail(token.email as string);
        (session.user as { role?: string }).role =
          typeof token.role === "string" ? token.role : undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/access-denied",
  },
};
