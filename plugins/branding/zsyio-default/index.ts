import type { BrandingPlugin } from "../types";
import primitives from "@tokens/primitives.json";

const zsyioDefault: BrandingPlugin = {
  id: "zsyio-default",
  displayName: "Zsyio",
  primitives,
  logo: {
    light: "/branding/zsyio-default/logo-light.svg",
    dark: "/branding/zsyio-default/logo-dark.svg",
    favicon: "/branding/zsyio-default/favicon.svg",
  },
};

export default zsyioDefault;
