import { createAuthMiddleware, DEFAULT_PUBLIC_PATHS } from "@zsyio/auth/middleware";

export const middleware = createAuthMiddleware({ publicPaths: [...DEFAULT_PUBLIC_PATHS, "/api/careers/applications"] });

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|branding|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

