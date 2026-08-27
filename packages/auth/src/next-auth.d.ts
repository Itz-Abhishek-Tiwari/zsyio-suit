import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "DEVELOPER" | "SUPPORT" | string;
      customRoleId?: string | null;
      permissions?: string[] | null;
      mustChangePassword: boolean;
      theme?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: string;
    customRoleId?: string | null;
    permissions?: string[] | null;
    mustChangePassword?: boolean;
    theme?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    customRoleId?: string | null;
    permissions?: string[] | null;
    mustChangePassword: boolean;
    theme?: string | null;
  }
}
