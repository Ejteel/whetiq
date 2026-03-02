import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

function hasPair(id?: string, secret?: string): boolean {
  return Boolean(id && secret);
}

function buildProviders() {
  const providers: NonNullable<NextAuthOptions["providers"]> = [];

  if (hasPair(process.env.AUTH_GITHUB_ID, process.env.AUTH_GITHUB_SECRET)) {
    providers.push(
      GitHubProvider({
        clientId: process.env.AUTH_GITHUB_ID as string,
        clientSecret: process.env.AUTH_GITHUB_SECRET as string
      })
    );
  }

  if (hasPair(process.env.AUTH_GOOGLE_ID, process.env.AUTH_GOOGLE_SECRET)) {
    providers.push(
      GoogleProvider({
        clientId: process.env.AUTH_GOOGLE_ID as string,
        clientSecret: process.env.AUTH_GOOGLE_SECRET as string
      })
    );
  }

  return providers;
}

function parseCsv(input?: string): string[] {
  if (!input) {
    return [];
  }
  return input
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedEmail(email?: string | null): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const allowedEmails = parseCsv(process.env.ALLOWED_EMAILS);
  const allowedDomains = parseCsv(process.env.ALLOWED_DOMAINS);

  if (allowedEmails.length === 0 && allowedDomains.length === 0) {
    return true;
  }

  if (allowedEmails.includes(normalized)) {
    return true;
  }

  const domain = normalized.split("@")[1];
  if (!domain) {
    return false;
  }

  return allowedDomains.includes(domain);
}

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: buildProviders(),
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async signIn({ user, profile }) {
      const email = user.email ?? (typeof profile?.email === "string" ? profile.email : undefined);
      if (isAllowedEmail(email)) {
        return true;
      }
      return "/access-denied";
    }
  },
  pages: {
    signIn: "/login"
  }
};
