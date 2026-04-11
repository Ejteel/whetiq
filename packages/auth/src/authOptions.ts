import type { NextAuthOptions, Session } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

type ProviderFactory<TFactory extends (...args: never[]) => unknown> =
  | TFactory
  | { default: TFactory };

function resolveProviderFactory<TFactory extends (...args: never[]) => unknown>(
  factory: ProviderFactory<TFactory>,
): TFactory {
  return typeof factory === "function" ? factory : factory.default;
}

const githubProviderFactory = resolveProviderFactory(GithubProvider);
const googleProviderFactory = resolveProviderFactory(GoogleProvider);

function normalizeSessionUser(
  user: Session["user"] | undefined,
  email: string,
): NonNullable<Session["user"]> {
  return (
    user ?? {
      email,
      image: null,
      name: null,
    }
  );
}

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
      if (token.email) {
        const currentUser = normalizeSessionUser(session.user, token.email);

        session.user = {
          email: token.email,
          image: currentUser.image,
          name: currentUser.name,
        };
      }
      return session;
    },
  },
};
