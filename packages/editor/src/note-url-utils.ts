/**
 * Utilities for extracting Zsyio Canvas information from URLs and markdown.
 */

const RESERVED_NOTE_SEGMENTS = new Set([
  "templates",
  "folders",
  "api",
  "new",
  "shares",
  "trash",
  "archive",
  "starred",
  "settings",
]);

/**
 * Extracts a Note ID from any Zsyio Canvas URL.
 * Supports:
 * - http://localhost:3001/notes?id={id}
 * - http://localhost:3000/notes?id={id}
 * - https://notes.zsyio.com/notes?id={id}
 * - https://canvas.zsyio.com/notes?id={id}
 * - /notes?id={id}
 * - .../notes/{id}
 * - notes?id={id}
 */
export function extractNoteId(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  // Trim and strip common trailing punctuation often caught in markdown or copy-paste
  const cleaned = rawUrl.trim().replace(/[.,;:)\]'">]+$/, "");
  if (!cleaned) return null;

  try {
    const isAbsolute = cleaned.startsWith("http://") || cleaned.startsWith("https://");
    const parsed = isAbsolute ? new URL(cleaned) : new URL(cleaned, "https://zsyio.internal");

    const pathname = parsed.pathname.toLowerCase();

    // Case 1: /notes or /notes/ with ?id=... parameter
    if (pathname === "/notes" || pathname === "/notes/") {
      const id = parsed.searchParams.get("id");
      if (id && /^[a-zA-Z0-9_-]+$/.test(id) && !RESERVED_NOTE_SEGMENTS.has(id.toLowerCase())) {
        return id;
      }
    }

    // Case 2: /notes/:id path parameter
    if (pathname.startsWith("/notes/")) {
      const segments = pathname.split("/").filter(Boolean);
      // segments: ['notes', ':id']
      if (segments.length >= 2 && segments[0] === "notes") {
        const potentialId = segments[1];
        if (
          potentialId &&
          !RESERVED_NOTE_SEGMENTS.has(potentialId.toLowerCase()) &&
          /^[a-zA-Z0-9_-]+$/.test(potentialId)
        ) {
          return potentialId;
        }
      }
    }
  } catch {
    // If URL parsing fails, continue to regex fallback
  }

  // Regex Fallback for relative or malformed formats: "notes?id=xyz" or "/notes?id=xyz"
  const regex = /(?:^|\/|\b)notes(?:\?id=|\/)([a-zA-Z0-9_-]+)/i;
  const match = cleaned.match(regex);
  if (match && match[1]) {
    const candidate = match[1];
    if (!RESERVED_NOTE_SEGMENTS.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  return null;
}

export function isNoteUrl(rawUrl?: string | null): boolean {
  return Boolean(extractNoteId(rawUrl));
}

/**
 * Extracts all unique Note IDs present in a text/markdown string.
 */
export function extractAllNoteIds(text?: string | null): string[] {
  if (!text || typeof text !== "string") return [];

  const noteIds = new Set<string>();

  // 1. Match URLs in markdown links: [text](url)
  const mdLinkRegex = /\[(?:[^\]]*)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = mdLinkRegex.exec(text)) !== null) {
    const id = extractNoteId(match[1]);
    if (id) noteIds.add(id);
  }

  // 2. Match raw http/https or relative notes URLs in plain text
  const urlRegex = /(?:https?:\/\/[^\s<>()]+|\/(?:notes\?[^\s<>()]+|notes\/[a-zA-Z0-9_-]+))/gi;
  while ((match = urlRegex.exec(text)) !== null) {
    const id = extractNoteId(match[0]);
    if (id) noteIds.add(id);
  }

  return Array.from(noteIds);
}

/**
 * Strips markdown and HTML syntax to produce a clean, human-readable text excerpt.
 */
export function getCleanExcerpt(markdown?: string | null, maxLength = 130): string {
  if (!markdown || typeof markdown !== "string") return "";

  const clean = markdown
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, " ")
    // Remove HTML tags
    .replace(/<[^>]*>/g, " ")
    // Remove markdown headers (#, ##, etc.)
    .replace(/^#+\s+/gm, " ")
    // Remove images: ![alt](url)
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    // Convert links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Convert mentions @[name](...) -> @name
    .replace(/@\[([^\]]+)\](?:\([^)]+\))?/g, "@$1")
    // Remove inline code `code` -> code
    .replace(/`([^`]+)`/g, "$1")
    // Remove bold, italic, strikethrough: ***text***, **text**, *text*, ~~text~~
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
    // Remove blockquote markers, list bullets, numbers
    .replace(/^[>\s*-+]\s+/gm, " ")
    .replace(/^\s*\d+\.\s+/gm, " ")
    // Remove horizontal rules
    .replace(/^---+$/gm, " ")
    // Collapse multiple spaces/newlines into single space
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Formats an ISO date string into a clean relative time string without external dependencies.
 */
export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
