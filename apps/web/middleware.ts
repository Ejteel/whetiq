import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

type AuthMode = "none" | "basic" | "oauth" | "hybrid";

function getExplicitMode(): AuthMode | undefined {
  const mode = process.env.PREVIEW_AUTH_MODE;
  if (mode === "basic" || mode === "oauth" || mode === "none") {
    return mode;
  }
  return undefined;
}

function isHostedEnvironment(): boolean {
  return process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "production";
}

function isPublicDemo(): boolean {
  return process.env.DEMO_MODE === "true" && process.env.PUBLIC_DEMO === "true";
}

function getAuthMode(): AuthMode {
  const explicitMode = getExplicitMode();
  if (explicitMode) {
    return explicitMode;
  }
  if (!isHostedEnvironment()) {
    return "none";
  }
  return isPublicDemo() ? "none" : "oauth";
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

function decodeBasicCredentials(encoded: string): { username: string; password: string } | null {
  try {
    const decoded = atob(encoded);
    const separator = decoded.indexOf(":");
    if (separator === -1) {
      return null;
    }
    return { username: decoded.slice(0, separator), password: decoded.slice(separator + 1) };
  } catch (error) {
    console.warn("[auth] Failed to decode Basic Auth header:", error);
    return null;
  }
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
  const credentials = decodeBasicCredentials(authHeader.slice("Basic ".length).trim());
  if (!credentials) {
    return false;
  }
  return credentials.username === username && credentials.password === password;
}

function isPublicPath(path: string): boolean {
  return (
    path === "/" ||
    path === "/workspace" ||
    path === "/narrative" ||
    path === "/login" ||
    path === "/api/chat/demo" ||
    path.startsWith("/api/auth/") ||
    path.startsWith("/_next/") ||
    path === "/favicon.ico"
  );
}

function buildLoginRedirect(request: NextRequest, path: string): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", path || "/");
  return NextResponse.redirect(loginUrl);
}

function handleBasicAuth(request: NextRequest): NextResponse {
  return isAuthorized(request) ? applyNoIndex(NextResponse.next()) : applyNoIndex(unauthorizedResponse());
}

async function handleOAuth(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;
  if (isPublicPath(path)) {
    return applyNoIndex(NextResponse.next());
  }
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET });
  return token ? applyNoIndex(NextResponse.next()) : applyNoIndex(buildLoginRedirect(request, path));
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const mode = getAuthMode();
  if (mode === "none") {
    return applyNoIndex(NextResponse.next());
  }
  if (mode === "basic") {
    return handleBasicAuth(request);
  }
  return handleOAuth(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
