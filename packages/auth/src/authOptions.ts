import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

function resolveProviderFactory<TFactory extends (...args: never[]) => unknown>(
  factory: TFactory | { default: TFactory },
): TFactory {
  return typeof factory === "function" ? factory : factory.default;
}

const githubProviderFactory = resolveProviderFactory(GithubProvider);
const googleProviderFactory = resolveProviderFactory(GoogleProvider);

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    githubProviderFactory({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    googleProviderFactory({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email;
      }
      return session;
    },
  },
};
