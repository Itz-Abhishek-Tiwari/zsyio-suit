import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "./auth";
import {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
  ConflictError,
  GoneError,
  TooManyRequestsError,
  DEFAULT_ROLE_PERMISSIONS,
  ALL_ACTIONS,
  canAccessApp,
  type AppId,
} from "./permissions";
import { isSuperAdmin } from "./super-admin";
import { prisma } from "@zsyio/database";
import { getCachedUserAuth, setCachedUserAuth } from "./auth-cache";

import type { Session } from "next-auth";

export function errorResponse(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string[]>
) {
  return NextResponse.json(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status }
  );
}

export type AuthenticatedUser = NonNullable<Session["user"]>;

export async function requireAppAccess(appId: AppId): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (!canAccessApp(user.role, appId, user.permissions)) {
    throw errorResponse(
      "FORBIDDEN",
      `Role ${user.role} does not have access to Zsyio ${appId.toUpperCase()}.`,
      403
    );
  }
  return user;
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const session = await auth();
  if (!session?.user) {
    throw errorResponse("UNAUTHENTICATED", "Not signed in.", 401);
  }

  const lookupKey = session.user.id || session.user.email;
  if (lookupKey) {
    // Check ultra-fast in-memory cache first (0ms latency, zero DB queries)
    const cached = getCachedUserAuth(lookupKey);
    if (cached) {
      if (!cached.active) {
        throw errorResponse(
          "UNAUTHENTICATED",
          "Account has been deactivated or does not exist.",
          401
        );
      }
      session.user.id = cached.id;
      if (cached.name) session.user.name = cached.name;
      session.user.role = cached.role;
      session.user.customRoleId = cached.customRoleId;
      session.user.permissions = cached.permissions;
      if (cached.theme) session.user.theme = cached.theme;
      return session.user;
    }

    // Cache miss: Single DB pass with relation join strategy
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(session.user.id ? [{ id: session.user.id }] : []),
          ...(session.user.email ? [{ email: session.user.email }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        customRoleId: true,
        theme: true,
        customRole: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
      relationLoadStrategy: "join",
    });

    if (!dbUser || !dbUser.active) {
      throw errorResponse(
        "UNAUTHENTICATED",
        "Account has been deactivated or does not exist.",
        401
      );
    }

    session.user.id = dbUser.id;
    if (dbUser.name) session.user.name = dbUser.name;
    session.user.theme = dbUser.theme || "light";

    let effectiveRole: string = dbUser.role;
    let customRoleId: string | null = null;
    let permissions: string[] = [];

    if (isSuperAdmin(dbUser)) {
      effectiveRole = "SUPER_ADMIN";
      customRoleId = null;
      permissions = ALL_ACTIONS;
    } else if (dbUser.customRole) {
      effectiveRole = dbUser.customRole.name;
      customRoleId = dbUser.customRole.id;
      permissions = dbUser.customRole.permissions;
    } else {
      effectiveRole = dbUser.role;
      customRoleId = null;
      const sysRole = await prisma.customRole.findUnique({
        where: { name: dbUser.role },
      });
      permissions =
        sysRole?.permissions ||
        (DEFAULT_ROLE_PERMISSIONS as Record<string, string[]>)[dbUser.role] ||
        [];
    }

    session.user.role = effectiveRole;
    session.user.customRoleId = customRoleId;
    session.user.permissions = permissions;

    // Cache user auth resolution for subsequent calls
    setCachedUserAuth({
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: effectiveRole,
      customRoleId,
      permissions,
      active: dbUser.active,
      theme: dbUser.theme || "light",
    });
  }

  return session.user;
}

export async function withApiHandler<T>(fn: () => Promise<T>): Promise<NextResponse | Response> {
  try {
    const result = await fn();
    if (result instanceof Response) return result;
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof ZodError) {
      const fields: Record<string, string[]> = {};
      for (const issue of err.issues) {
        const key = issue.path.join(".") || "_";
        fields[key] = [...(fields[key] ?? []), issue.message];
      }
      const fieldNames = Object.keys(fields);
      const readableMsg =
        fieldNames.length > 0
          ? fieldNames.map((f) => `${f}: ${fields[f].join(", ")}`).join("; ")
          : "Invalid request body.";
      return errorResponse("VALIDATION_ERROR", readableMsg, 400, fields);
    }
    if (err instanceof BadRequestError) {
      return errorResponse("BAD_REQUEST", err.message, 400);
    }
    if (err instanceof ForbiddenError) {
      return errorResponse("FORBIDDEN", err.message, 403);
    }
    if (err instanceof NotFoundError) {
      return errorResponse("NOT_FOUND", err.message, 404);
    }
    if (err instanceof ConflictError) {
      return errorResponse("CONFLICT", err.message, 409);
    }
    if (err instanceof GoneError) {
      return errorResponse("GONE", err.message, 410);
    }
    if (err instanceof TooManyRequestsError) {
      return errorResponse("TOO_MANY_REQUESTS", err.message, 429);
    }
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      const meta = (err as { meta?: { target?: string[] | string } }).meta;
      const field = Array.isArray(meta?.target) ? meta?.target.join(", ") : "Value";
      return errorResponse("CONFLICT", `${field} is already in use by another record.`, 409);
    }
    console.error("API error:", err);
    return errorResponse("INTERNAL_ERROR", "Something went wrong.", 500);
  }
}
