import type { BrandingPlugin } from "../types";
import primitives from "@tokens/primitives.json";

const mediloonDefault: BrandingPlugin = {
  id: "mediloon-default",
  displayName: "Zsyio",
  primitives,
  logo: {
    light: "/branding/mediloon-default/logo-light.svg",
    dark: "/branding/mediloon-default/logo-dark.svg",
    favicon: "/branding/mediloon-default/favicon.svg",
  },
};

export default mediloonDefault;
