import zsyioDefault from "./zsyio-default";
import mediloonDefault from "./mediloon-default";
import type { BrandingPlugin } from "./types";

export const brandingRegistry: Record<string, BrandingPlugin> = {
  "zsyio-default": zsyioDefault,
  "mediloon-default": mediloonDefault,
};

export function getActiveBranding(): BrandingPlugin {
  const id = process.env.ACTIVE_BRAND ?? "zsyio-default";
  return brandingRegistry[id] ?? brandingRegistry["zsyio-default"] ?? zsyioDefault;
}
