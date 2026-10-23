import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export interface AuthMiddlewareOptions {
  publicPaths?: string[];
  sessionCookieNameSubstrings?: string[];
  /** Where signed-out visitors to "/" go. Only apps that serve a landing page should set this; others fall back to /login. */
  landingPath?: string;
}

export const DEFAULT_PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/api/auth",
  "/invite",
  "/api/invitations",
  "/api/cron",
  "/branding",
  "/sw.js",
  "/favicon.ico",
  // GET answers signed-out pages with no theme; PATCH still requires a session.
  "/api/users/theme",
];

export const DEFAULT_SESSION_COOKIE_SUBSTRINGS = ["session-token"];

/**
 * Creates an edge route-protection middleware for Next.js app router applications.
 * Ensures unauthenticated requests to protected pages or API routes are intercepted.
 */
export function createAuthMiddleware(options: AuthMiddlewareOptions = {}) {
  const publicPaths = options.publicPaths ?? DEFAULT_PUBLIC_PATHS;
  const cookieSubstrings = options.sessionCookieNameSubstrings ?? DEFAULT_SESSION_COOKIE_SUBSTRINGS;

  return function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Fast-path bypass for static files, Next.js assets, service workers, and images
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/branding") ||
      pathname === "/sw.js" ||
      pathname === "/favicon.ico" ||
      (!pathname.startsWith("/api") && /\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?|map)$/i.test(pathname))
    ) {
      return NextResponse.next();
    }

    if (publicPaths.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    const hasSessionCookie = request.cookies
      .getAll()
      .some((c) => cookieSubstrings.some((sub) => c.name.includes(sub)));

    if (!hasSessionCookie) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json(
          { error: { code: "UNAUTHENTICATED", message: "Not signed in." } },
          { status: 401 }
        );
      }
      // On root path for unauthenticated users, direct them to the landing page when this app has one
      if (pathname === "/" && options.landingPath) {
        const landingUrl = new URL(options.landingPath, request.url);
        return NextResponse.redirect(landingUrl);
      }
      const loginUrl = new URL("/login", request.url);
      // Send the user back to the page they asked for once they have signed in.
      if (pathname !== "/") {
        loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
      }
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  };
}

export const defaultAuthMiddleware = createAuthMiddleware();
export const authMiddleware = defaultAuthMiddleware;
export const middleware = defaultAuthMiddleware;

export const authMiddlewareConfig = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|branding|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export const config = authMiddlewareConfig;

