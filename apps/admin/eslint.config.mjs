import { createConfig } from "@zsyio/config-eslint";

const config = [
  ...createConfig(import.meta.dirname),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];

export default config;
