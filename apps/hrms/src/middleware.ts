export { defaultAuthMiddleware as middleware } from "@zsyio/auth/middleware";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|branding|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

