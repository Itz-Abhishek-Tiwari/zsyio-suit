import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";

export function createConfig(baseDirectory) {
  const compat = new FlatCompat({
    baseDirectory: baseDirectory ?? import.meta.dirname,
    resolvePluginsRelativeTo: import.meta.dirname,
  });
  return defineConfig([
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    globalIgnores([".next/**", "out/**", "build/**", "dist/**", "next-env.d.ts", "node_modules/**"]),
  ]);
}
