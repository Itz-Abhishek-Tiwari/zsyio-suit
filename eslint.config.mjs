import { createConfig } from "@zsyio/config-eslint";
import { globalIgnores } from "eslint/config";

const eslintConfig = [
  ...createConfig(import.meta.dirname),
  // Root-specific extras not covered by the shared config's ignores.
  globalIgnores(["dist/**", "node_modules/**", "coverage/**"]),
];

export default eslintConfig;
