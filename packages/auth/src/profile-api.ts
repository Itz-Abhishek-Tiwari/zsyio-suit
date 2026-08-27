import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, SAFE_USER_SELECT } from "@zsyio/database";
import { requireUser, withApiHandler, errorResponse } from "./api-helpers";
import { comparePassword, hashPassword } from "./password";
import { invalidateUserAuth } from "./auth-cache";
import { sendPasswordChangedAlertEmail } from "./email";
import { formatSuperAdminUser } from "./super-admin";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  jobTitle: z.string().max(100).nullable().optional(),
  department: z.string().max(100).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional().or(z.literal("")).or(z.null()),
  timeZone: z.string().max(60).optional(),
  theme: z.string().max(30).optional(),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter.")
      .regex(/[0-9]/, "Must contain at least one number."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/**
 * Shared handler for GET /api/users/me across all suite apps
 */
export async function handleGetProfile() {
  return withApiHandler(async () => {
    const sessionUser = await requireUser();

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        ...SAFE_USER_SELECT,
        teamMemberships: {
          select: {
            teamId: true,
            role: true,
            team: {
              select: {
                id: true,
                name: true,
                color: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw errorResponse("NOT_FOUND", "User not found.", 404);
    }

    const [assignedTasksCount, completedTasksCount] = await Promise.all([
      prisma.task.count({ where: { assignees: { some: { userId: sessionUser.id } } } }).catch(() => 0),
      prisma.task.count({ where: { assignees: { some: { userId: sessionUser.id } }, status: "DONE" } }).catch(() => 0),
    ]);

    return {
      user: formatSuperAdminUser(user),
      stats: {
        assignedTasksCount,
        completedTasksCount,
      },
    };
  });
}

/**
 * Shared handler for PATCH /api/users/me across all suite apps
 */
export async function handleUpdateProfile(request: NextRequest) {
  return withApiHandler(async () => {
    const sessionUser = await requireUser();
    const body = updateProfileSchema.parse(await request.json());

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.jobTitle !== undefined) updateData.jobTitle = body.jobTitle ? body.jobTitle.trim() : null;
    if (body.department !== undefined) updateData.department = body.department ? body.department.trim() : null;
    if (body.bio !== undefined) updateData.bio = body.bio ? body.bio.trim() : null;
    if (body.phone !== undefined) updateData.phone = body.phone ? body.phone.trim() : null;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl ? body.avatarUrl.trim() : null;
    if (body.timeZone !== undefined) updateData.timeZone = body.timeZone || "Asia/Kolkata";
    if (body.theme !== undefined) updateData.theme = body.theme || "system";

    const updated = await prisma.user.update({
      where: { id: sessionUser.id },
      data: updateData,
      select: SAFE_USER_SELECT,
    });

    invalidateUserAuth(sessionUser.id);
    if (sessionUser.email) invalidateUserAuth(sessionUser.email);

    return formatSuperAdminUser(updated);
  });
}

/**
 * Shared handler for PATCH /api/users/me/password across all suite apps
 */
export async function handleChangePassword(request: NextRequest) {
  return withApiHandler(async () => {
    const sessionUser = await requireUser();
    const body = changePasswordSchema.parse(await request.json());

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, email: true, name: true, passwordHash: true },
    });

    if (!dbUser?.passwordHash) {
      throw errorResponse("FORBIDDEN", "Cannot change password for this account.", 403);
    }

    const currentValid = await comparePassword(body.currentPassword, dbUser.passwordHash);
    if (!currentValid) {
      throw errorResponse("FORBIDDEN", "Current password is incorrect.", 403);
    }

    if (body.newPassword === body.currentPassword) {
      throw errorResponse(
        "VALIDATION_ERROR",
        "New password must be different from your current password.",
        400
      );
    }

    const newHash = await hashPassword(body.newPassword);

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    invalidateUserAuth(sessionUser.id);
    if (dbUser.email) invalidateUserAuth(dbUser.email);

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : (request.headers.get("x-real-ip") || undefined);
    const userAgent = request.headers.get("user-agent") || undefined;

    try {
      if (dbUser.email) {
        await sendPasswordChangedAlertEmail({
          to: dbUser.email,
          name: dbUser.name || sessionUser.name || "Workspace Member",
          changedAt: new Date(),
          ipAddress,
          userAgent,
        });
      }
    } catch (emailErr) {
      console.error("[Password Changed Alert Email Error]:", emailErr);
    }

    return { success: true };
  });
}
