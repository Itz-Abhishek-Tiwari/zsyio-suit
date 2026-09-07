/**
 * Utilities for parsing and formatting note cover images with focal position support.
 */

export interface ParsedCover {
  raw: string;
  url: string;
  isGradient: boolean;
  positionY: number; // 0 (top) to 100 (bottom)
}

/**
 * Extracts clean URL, gradient status, and vertical position percentage (0-100) from a cover string.
 */
export function parseCover(cover: string | null | undefined): ParsedCover {
  if (!cover || typeof cover !== "string" || !cover.trim()) {
    return {
      raw: "",
      url: "",
      isGradient: false,
      positionY: 50,
    };
  }

  const trimmed = cover.trim();

  // Gradient or solid color
  if (
    trimmed.startsWith("linear-gradient") ||
    trimmed.startsWith("radial-gradient") ||
    trimmed.startsWith("conic-gradient") ||
    trimmed.startsWith("rgb") ||
    trimmed.startsWith("rgba") ||
    trimmed.startsWith("hsl") ||
    trimmed.startsWith("#")
  ) {
    return {
      raw: trimmed,
      url: trimmed,
      isGradient: true,
      positionY: 50,
    };
  }

  // Check for position fragment #pos=Y at the end of the URL
  const match = trimmed.match(/#pos=([0-9]+(?:\.[0-9]+)?)$/);
  let positionY = 50;
  let cleanUrl = trimmed;

  if (match) {
    const parsed = parseFloat(match[1]);
    if (!isNaN(parsed)) {
      positionY = Math.max(0, Math.min(100, Math.round(parsed)));
    }
    cleanUrl = trimmed.slice(0, match.index);
  }

  return {
    raw: trimmed,
    url: cleanUrl,
    isGradient: false,
    positionY,
  };
}

/**
 * Formats a cover image URL with vertical position.
 * If positionY is 50, we still preserve/format cleanly or omit if exactly default.
 * Appending #pos=Y persists vertical focal point without breaking image URLs.
 */
export function formatCoverWithPosition(url: string, positionY: number): string {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();

  // If it's a gradient or solid, return as is
  if (
    trimmed.startsWith("linear-gradient") ||
    trimmed.startsWith("radial-gradient") ||
    trimmed.startsWith("conic-gradient") ||
    trimmed.startsWith("rgb") ||
    trimmed.startsWith("rgba") ||
    trimmed.startsWith("hsl") ||
    trimmed.startsWith("#")
  ) {
    return trimmed;
  }

  // Strip existing #pos= fragment if any
  const cleanUrl = trimmed.replace(/#pos=[0-9]+(?:\.[0-9]+)?$/, "");
  const clampedY = Math.max(0, Math.min(100, Math.round(positionY)));

  if (clampedY === 50) {
    return cleanUrl;
  }

  return `${cleanUrl}#pos=${clampedY}`;
}
