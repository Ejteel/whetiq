import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;
  const protectedPath = path.startsWith("/internal") || path.startsWith("/api/internal");

  if (!protectedPath) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.ADMIN_AUTH_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  });

  if (token?.email) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/internal/:path*", "/api/internal/:path*"]
};
