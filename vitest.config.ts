import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/server/**", "src/lib/**"],
      exclude: ["src/lib/prisma.ts", "src/lib/auth.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./apps/pms/src"),
      "@zsyio/database": path.resolve(import.meta.dirname, "./packages/database/src"),
      "@zsyio/types": path.resolve(import.meta.dirname, "./packages/types/src"),
      "@zsyio/validators": path.resolve(import.meta.dirname, "./packages/validators/src"),
      "@zsyio/auth/domain-restriction": path.resolve(import.meta.dirname, "./packages/auth/src/domain-restriction.ts"),
      "@zsyio/auth/permissions": path.resolve(import.meta.dirname, "./packages/auth/src/permissions.ts"),
      "@zsyio/auth/super-admin": path.resolve(import.meta.dirname, "./packages/auth/src/super-admin.ts"),
      "@zsyio/auth/auth-cache": path.resolve(import.meta.dirname, "./packages/auth/src/auth-cache.ts"),
      "@zsyio/auth/password": path.resolve(import.meta.dirname, "./packages/auth/src/password.ts"),
      "@zsyio/auth": path.resolve(import.meta.dirname, "./packages/auth/src"),
      "@zsyio/ui": path.resolve(import.meta.dirname, "./packages/ui/src"),
      "@zsyio/editor": path.resolve(import.meta.dirname, "./packages/editor/src"),
      "@prisma/client": path.resolve(import.meta.dirname, "./packages/database/node_modules/@prisma/client"),
      "bcryptjs": path.resolve(import.meta.dirname, "./packages/auth/node_modules/bcryptjs"),
    },
  },
});
