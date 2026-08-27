import NextAuth from "next-auth";
import { decode } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@zsyio/database";
import { isEmailDomainAllowed } from "./domain-restriction";
import { DEFAULT_ROLE_PERMISSIONS, ALL_ACTIONS } from "./permissions";
import { isSuperAdmin } from "./super-admin";
import { getCachedUserAuth, setCachedUserAuth } from "./auth-cache";

export async function resolveUserAuth(user: {
  id: string;
  name: string | null;
  email: string;
  role: string;
  customRoleId?: string | null;
  customRole?: { id: string; name: string; permissions: string[] } | null;
  active: boolean;
  mustChangePassword?: boolean;
  theme?: string | null;
}) {
  const theme = user.theme || "light";

  if (isSuperAdmin(user)) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: "SUPER_ADMIN",
      customRoleId: null,
      permissions: ALL_ACTIONS,
      active: true,
      mustChangePassword: !!user.mustChangePassword,
      theme,
    };
  }

  const effectiveRole: string = user.customRole?.name || user.role;
  let activePermissions: string[] = user.customRole?.permissions || [];
  const customRoleId: string | null = user.customRoleId || user.customRole?.id || null;

  if (!user.customRole) {
    const sysRole = await prisma.customRole.findUnique({
      where: { name: user.role },
    });
    activePermissions =
      sysRole?.permissions ||
      (DEFAULT_ROLE_PERMISSIONS as Record<string, string[]>)[user.role] ||
      [];
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: effectiveRole,
    customRoleId,
    permissions: activePermissions,
    active: user.active,
    mustChangePassword: !!user.mustChangePassword,
    theme,
  };
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    // When building in CI / Next.js static page data collection, use a placeholder so the build worker doesn't fail
    if (
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.VERCEL ||
      process.env.CI ||
      process.env.NODE_ENV !== "production"
    ) {
      return "mediloom-build-time-secret-key-32-chars-min";
    }
    throw new Error(
      "[FATAL SECURITY ERROR] AUTH_SECRET or NEXTAUTH_SECRET environment variable is required in production."
    );
  }
  return secret;
}

const useSecureCookies = process.env.NODE_ENV === "production";
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
const rawCookieDomain = process.env.COOKIE_DOMAIN?.trim() || undefined;
// Browsers strictly reject domain cookies on Public Suffixes (such as *.vercel.app)
// and localhost. Only activate domain-level cookie sharing when deployed on a custom domain (e.g. .zsyio.com).
const cookieDomain =
  rawCookieDomain &&
  !rawCookieDomain.includes("vercel.app") &&
  !rawCookieDomain.includes("localhost")
    ? rawCookieDomain
    : undefined;

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: getAuthSecret(),
  trustHost: true,
  session: { strategy: "jwt" },
  jwt: {
    async decode(params) {
      try {
        return await decode(params);
      } catch {
        // Return null cleanly when client sends a cookie from an older secret or another app
        return null;
      }
    },
  },
  pages: { signIn: "/login" },
  cookies: cookieDomain
    ? {
        sessionToken: {
          name: `${cookiePrefix}authjs.session-token`,
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: useSecureCookies,
            domain: cookieDomain,
          },
        },
      }
    : undefined,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        // Security check: restrict authentication strictly to permitted corporate domains
        if (!isEmailDomainAllowed(email)) {
          return null;
        }

        const normalizedEmail = email.toLowerCase().trim();
        let user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { customRole: true },
          relationLoadStrategy: "join",
        });

        if (!user) {
          user = await prisma.user.findFirst({
            where: {
              email: {
                equals: normalizedEmail,
                mode: "insensitive",
              },
            },
            include: { customRole: true },
            relationLoadStrategy: "join",
          });
        }

        if (
          !user ||
          !user.active ||
          !user.passwordHash ||
          user.invitationStatus === "PENDING" ||
          user.invitationStatus === "REJECTED"
        ) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        const authData = await resolveUserAuth(user);
        setCachedUserAuth(authData);

        return {
          id: authData.id,
          name: authData.name,
          email: authData.email,
          role: authData.role,
          customRoleId: authData.customRoleId,
          permissions: authData.permissions,
          mustChangePassword: authData.mustChangePassword,
          theme: authData.theme,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user?.email && !isEmailDomainAllowed(user.email)) {
        return false;
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as string;
        token.customRoleId = user.customRoleId as string | null | undefined;
        token.permissions = user.permissions as string[] | null | undefined;
        token.mustChangePassword = user.mustChangePassword as boolean;
        token.theme = (user as any).theme || "light";
      }

      // Fast-path permission sync with in-memory TTL cache (0ms DB cost on hit)
      if (token.id) {
        const cached = getCachedUserAuth(token.id as string);
        if (cached) {
          // If user was deactivated or invitation invalid, revoke token immediately
          if (!cached.active) {
            return null;
          }
          token.role = cached.role;
          token.customRoleId = cached.customRoleId;
          token.permissions = cached.permissions;
          if (cached.mustChangePassword !== undefined) {
            token.mustChangePassword = cached.mustChangePassword;
          }
          if (cached.theme !== undefined && cached.theme !== null) {
            token.theme = cached.theme;
          }
        } else {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              include: { customRole: true },
              relationLoadStrategy: "join",
            });
            if (
              !dbUser ||
              !dbUser.active ||
              dbUser.invitationStatus === "PENDING" ||
              dbUser.invitationStatus === "REJECTED"
            ) {
              // Deactivated or invalid user - revoke session
              return null;
            }

            const authData = await resolveUserAuth(dbUser);
            token.role = authData.role;
            token.customRoleId = authData.customRoleId;
            token.permissions = authData.permissions;
            token.mustChangePassword = authData.mustChangePassword;
            token.theme = authData.theme;

            setCachedUserAuth(authData);
          } catch {
            // Keep existing token permissions if DB lookup fails transiently
          }
        }
      }

      if (trigger === "update" && session?.user) {
        if (session.user.mustChangePassword !== undefined) {
          token.mustChangePassword = session.user.mustChangePassword;
        }
        if (session.user.theme !== undefined && session.user.theme !== null) {
          token.theme = session.user.theme;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (!token || !token.id) {
        return null as any;
      }
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.customRoleId = token.customRoleId as string | null | undefined;
        session.user.permissions = token.permissions as string[] | null | undefined;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
        session.user.theme = (token.theme as string) || "light";
      }
      return session;
    },
  },
});

