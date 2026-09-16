import { slugifyTitle } from "@/lib/git-branch-helper";
import { callGeminiChat, getGeminiApiKey } from "./gemini-client";

export interface GenerateBranchSlugResult {
  slug: string;
  source: "gemini" | "fallback";
  model?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Clean & sanitize AI output to ensure strict git-safe kebab-case without chopping words.
 */
export function sanitizeKebabSlug(raw: string, maxWords = 7): string {
  if (!raw) return "";

  const words = raw
    .toLowerCase()
    .trim()
    .replace(/^["'`]|["'`]$/g, "") // remove surrounding quotes
    .replace(/[^\w\s-]/g, " ") // remove non-alphanumeric chars except space & hyphen
    .split(/[\s_-]+/)
    .filter(Boolean);

  if (words.length === 0) return "";

  // Strip leading redundant action words if multiple words exist
  let meaningful = words.filter(
    (w) =>
      !["fix", "fixes", "bug", "bugfix", "feat", "feature", "chore", "docs", "refactor"].includes(w)
  );
  if (meaningful.length === 0) {
    meaningful = words;
  }

  // Deduplicate consecutive or repeated words
  const seen = new Set<string>();
  const deduplicated: string[] = [];
  for (const word of meaningful) {
    if (!seen.has(word)) {
      seen.add(word);
      deduplicated.push(word);
    }
  }

  return deduplicated.slice(0, maxWords).join("-").slice(0, 55).replace(/-+$/, "");
}

const SYSTEM_INSTRUCTION =
  "You are an expert Git branch name generator. Analyze the entire task title and produce a concise 3-6 word lowercase kebab-case slug capturing the core technical subject and specific libraries, frameworks, or tools mentioned (e.g. 'client-sdk-fastify-openapi', 'auth-session-cookie-fix', 'orval-openapi-sdk-generator'). Do NOT simply copy the first few words. Omit generic filler words like 'automate', 'implement', 'feature', 'fix', 'support'. Output ONLY the lowercase kebab-case slug without any quotes or explanations.";

/**
 * Generates a concise 3-6 word Git branch slug using Google Gemini.
 * Captures the technical core of the ticket rather than just the beginning of the title.
 */
export async function generateGeminiBranchSlug(params: {
  title: string;
  description?: string | null;
  type?: string | null;
  apiKey?: string;
}): Promise<GenerateBranchSlugResult> {
  const { title, apiKey } = params;
  const resolvedKey = getGeminiApiKey(apiKey);

  // If no API key is provided, gracefully fallback to deterministic local slug
  if (!resolvedKey) {
    return {
      slug: slugifyTitle(title, 7),
      source: "fallback",
    };
  }

  const response = await callGeminiChat({
    apiKey: resolvedKey,
    systemInstruction: SYSTEM_INSTRUCTION,
    prompt: title.trim().slice(0, 200),
    temperature: 0.2,
    maxOutputTokens: 150,
    thinkingBudget: 0,
  });

  if (!response || !response.content) {
    return {
      slug: slugifyTitle(title, 7),
      source: "fallback",
    };
  }

  const sanitized = sanitizeKebabSlug(response.content, 7);
  if (!sanitized) {
    return {
      slug: slugifyTitle(title, 7),
      source: "fallback",
    };
  }

  return {
    slug: sanitized,
    source: "gemini",
    model: response.model,
    usage: response.usage,
  };
}

// Backward-compatible alias
export const generateOpenAiBranchSlug = generateGeminiBranchSlug;
