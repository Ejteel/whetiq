import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

type AuthMode = "none" | "basic" | "oauth";

function getAuthMode(): AuthMode {
  const mode = process.env.PREVIEW_AUTH_MODE;
  if (mode === "basic" || mode === "oauth" || mode === "none") {
    return mode;
  }
  return "none";
}

function unauthorizedResponse(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Aggreate Preview"'
    }
  });
}

function isAuthorized(request: NextRequest): boolean {
  const username = process.env.PREVIEW_AUTH_USERNAME;
  const password = process.env.PREVIEW_AUTH_PASSWORD;

  if (!username || !password) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return false;
  }

  const encoded = authHeader.slice("Basic ".length).trim();

  try {
    const decoded = atob(encoded);
    const separator = decoded.indexOf(":");
    if (separator === -1) {
      return false;
    }

    const inputUser = decoded.slice(0, separator);
    const inputPassword = decoded.slice(separator + 1);

    return inputUser === username && inputPassword === password;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const mode = getAuthMode();
  if (mode === "none") {
    return NextResponse.next();
  }

  if (mode === "basic") {
    if (isAuthorized(request)) {
      return NextResponse.next();
    }
    return unauthorizedResponse();
  }

  const path = request.nextUrl.pathname;
  const isPublic =
    path === "/login" || path.startsWith("/api/auth/") || path.startsWith("/_next/") || path === "/favicon.ico";

  if (isPublic) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  });
  if (token) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", path || "/");
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
