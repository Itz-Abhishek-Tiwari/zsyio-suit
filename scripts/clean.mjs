import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";

const targets = [
  ".next",
  ".turbo",
  "tsconfig.tsbuildinfo",
  "apps/pms/.next",
  "apps/notes/.next",
  "apps/sales/.next",
  "apps/hrms/.next",
  "apps/admin/.next",
  "apps/pms/.turbo",
  "apps/notes/.turbo",
  "apps/sales/.turbo",
  "apps/hrms/.turbo",
  "apps/admin/.turbo",
  "apps/pms/tsconfig.tsbuildinfo",
  "apps/notes/tsconfig.tsbuildinfo",
  "apps/sales/tsconfig.tsbuildinfo",
  "apps/hrms/tsconfig.tsbuildinfo",
  "apps/admin/tsconfig.tsbuildinfo",
  "packages/ui/tsconfig.tsbuildinfo",
  "packages/auth/tsconfig.tsbuildinfo",
  "packages/editor/tsconfig.tsbuildinfo",
  "node_modules/.cache",
  "apps/pms/node_modules/.cache",
  "apps/notes/node_modules/.cache",
  "apps/sales/node_modules/.cache",
  "apps/hrms/node_modules/.cache",
  "apps/admin/node_modules/.cache",
];

for (const target of targets) {
  if (existsSync(target)) {
    await rm(target, { recursive: true, force: true });
    console.log(`✓ removed ${target}`);
  }
}
