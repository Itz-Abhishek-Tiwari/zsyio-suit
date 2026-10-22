import { createAuthMiddleware, DEFAULT_PUBLIC_PATHS } from "@zsyio/auth/middleware";

export const middleware = createAuthMiddleware({
  publicPaths: DEFAULT_PUBLIC_PATHS,
  // The marketing site is its own app (apps/landing).
  landingPath: process.env.NEXT_PUBLIC_LANDING_URL,
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|branding|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

