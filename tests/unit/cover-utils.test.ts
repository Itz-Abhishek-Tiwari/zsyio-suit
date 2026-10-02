import { describe, it, expect } from "vitest";
import { parseCover, formatCoverWithPosition } from "@zsyio/editor";

describe("Cover Image Utils (parseCover & formatCoverWithPosition)", () => {
  describe("parseCover", () => {
    it("handles empty or null values gracefully", () => {
      expect(parseCover(null)).toEqual({
        raw: "",
        url: "",
        isGradient: false,
        positionY: 50,
      });
      expect(parseCover(undefined)).toEqual({
        raw: "",
        url: "",
        isGradient: false,
        positionY: 50,
      });
      expect(parseCover("   ")).toEqual({
        raw: "",
        url: "",
        isGradient: false,
        positionY: 50,
      });
    });

    it("identifies CSS gradient and solid covers without altering them", () => {
      const gradient = "linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(124, 58, 237) 50%)";
      expect(parseCover(gradient)).toEqual({
        raw: gradient,
        url: gradient,
        isGradient: true,
        positionY: 50,
      });

      const solidRgb = "rgb(139, 92, 246)";
      expect(parseCover(solidRgb)).toEqual({
        raw: solidRgb,
        url: solidRgb,
        isGradient: true,
        positionY: 50,
      });

      const hex = "#4f46e5";
      expect(parseCover(hex)).toEqual({
        raw: hex,
        url: hex,
        isGradient: true,
        positionY: 50,
      });
    });

    it("parses image URLs without custom position and defaults to 50%", () => {
      const url = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1600";
      expect(parseCover(url)).toEqual({
        raw: url,
        url: url,
        isGradient: false,
        positionY: 50,
      });
    });

    it("parses image URLs with #pos=Y fragment and clamps properly", () => {
      const urlWithPos = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1600#pos=25";
      const parsed = parseCover(urlWithPos);
      expect(parsed.isGradient).toBe(false);
      expect(parsed.positionY).toBe(25);
      expect(parsed.url).toBe("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1600");

      // Clamping > 100
      expect(parseCover("https://example.com/img.jpg#pos=140").positionY).toBe(100);
      // Clamping < 0
      expect(parseCover("https://example.com/img.jpg#pos=-20").positionY).toBe(50); // negative not matched by regex \d+, falls back to 50
    });
  });

  describe("formatCoverWithPosition", () => {
    it("preserves gradients untouched", () => {
      const gradient = "linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(124, 58, 237) 50%)";
      expect(formatCoverWithPosition(gradient, 10)).toBe(gradient);
    });

    it("omits #pos=50 if center default", () => {
      const url = "https://example.com/mountain.jpg";
      expect(formatCoverWithPosition(url, 50)).toBe(url);
    });

    it("appends #pos=Y when repositioned", () => {
      const url = "https://example.com/mountain.jpg";
      expect(formatCoverWithPosition(url, 20)).toBe("https://example.com/mountain.jpg#pos=20");
      expect(formatCoverWithPosition(url, 0)).toBe("https://example.com/mountain.jpg#pos=0");
      expect(formatCoverWithPosition(url, 100)).toBe("https://example.com/mountain.jpg#pos=100");
    });

    it("replaces existing position correctly without duplicating fragments", () => {
      const original = "https://example.com/mountain.jpg#pos=80";
      expect(formatCoverWithPosition(original, 35)).toBe("https://example.com/mountain.jpg#pos=35");
      expect(formatCoverWithPosition(original, 50)).toBe("https://example.com/mountain.jpg");
    });
  });
});
