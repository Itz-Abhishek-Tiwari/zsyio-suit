import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@zsyio/database";
import { requireUser, withApiHandler } from "./api-helpers";
import { getCachedUserAuth, setCachedUserAuth } from "./auth-cache";

const themeSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
});

export type UpdateThemeBody = z.infer<typeof themeSchema>;

/**
 * GET handler for /api/users/theme:
 * Retrieves the current authenticated user's theme from DB or cache.
 */
export async function handleThemeGet() {
  return withApiHandler(async () => {
    const user = await requireUser();

    // Fast check: return from session user if populated
    if (user.theme) {
      return { theme: user.theme };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { theme: true },
    });

    return { theme: dbUser?.theme || "light" };
  });
}

/**
 * PATCH handler for /api/users/theme:
 * Updates the user's theme preference in the database and syncs the in-memory cache.
 */
export async function handleThemePatch(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const json = await request.json();
    const { theme } = themeSchema.parse(json);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { theme },
      select: { id: true, email: true, theme: true },
    });

    // Update in-memory auth cache so subsequent requests instantly reflect the new theme
    const cached = getCachedUserAuth(user.id) || getCachedUserAuth(user.email || "");
    if (cached) {
      setCachedUserAuth({
        ...cached,
        theme: updated.theme,
      });
    }

    return { success: true, theme: updated.theme };
  });
}
