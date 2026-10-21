export interface TokenPrimitives {
  color: Record<string, Record<string, string>>;
  radius: Record<string, string>;
  space: Record<string, string>;
  font: {
    family: { display: string; body: string; mono: string };
    size: Record<string, string>;
  };
  shadow: Record<string, string>;
}

export interface BrandingPlugin {
  id: string; // "zsyio-default"
  displayName: string; // shown in <title>, email footers
  primitives: TokenPrimitives; // same shape as tokens/primitives.json
  logo: { light: string; dark: string; favicon: string };
  fonts?: { display?: string; body?: string }; // font file paths, optional override
}
