import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

type AuthMode = "none" | "basic" | "oauth" | "hybrid";

function getAuthMode(): AuthMode {
  const mode = process.env.PRIVATE_AUTH_MODE;
  if (mode === "basic" || mode === "oauth" || mode === "hybrid" || mode === "none") {
    return mode;
  }

  const hosted = process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "production";
  if (!hosted) {
    return "none";
  }

  const isPublicDemo = process.env.DEMO_MODE === "true" && process.env.PUBLIC_DEMO === "true";
  return isPublicDemo ? "none" : "oauth";
}

function unauthorizedResponse(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="WhetIQ Private"'
    }
  });
}

function applyNoIndex(response: NextResponse): NextResponse {
  if (process.env.VERCEL_ENV === "preview") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return response;
}

function isAuthorized(request: NextRequest): boolean {
  const username = process.env.PRIVATE_AUTH_USERNAME;
  const password = process.env.PRIVATE_AUTH_PASSWORD;

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
    return applyNoIndex(NextResponse.next());
  }

  if (mode === "basic" || mode === "hybrid") {
    if (isAuthorized(request)) {
      if (mode === "basic") {
        return applyNoIndex(NextResponse.next());
      }
    } else {
      return applyNoIndex(unauthorizedResponse());
    }
  }

  const path = request.nextUrl.pathname;
  const isPublic =
    path === "/" ||
    path === "/workspace" ||
    path === "/login" ||
    path.startsWith("/api/auth/") ||
    path === "/api/chat/demo" ||
    path.startsWith("/_next/") ||
    path === "/favicon.ico";

  if (isPublic) {
    return applyNoIndex(NextResponse.next());
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
    });
    if (token) {
      return applyNoIndex(NextResponse.next());
    }
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", path || "/");
    loginUrl.searchParams.set("error", "config");
    return applyNoIndex(NextResponse.redirect(loginUrl));
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", path || "/");
  return applyNoIndex(NextResponse.redirect(loginUrl));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
