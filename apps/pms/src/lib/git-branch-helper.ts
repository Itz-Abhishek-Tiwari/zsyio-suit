import { formatTicketId } from "@/lib/utils";

/**
 * Git branch naming and command helpers for tickets/tasks.
 */

export interface GitBranchSuggestion {
  shortId: string;
  prefix: string;
  branchName: string;
  checkoutCmd: string;
  switchCmd: string;
  pushCmd: string;
  commitMsg: string;
}

export const BRANCH_PREFIXES = [
  { value: "feature", label: "feature/" },
  { value: "fix", label: "fix/" },
  { value: "bugfix", label: "bugfix/" },
  { value: "hotfix", label: "hotfix/" },
  { value: "chore", label: "chore/" },
  { value: "refactor", label: "refactor/" },
  { value: "docs", label: "docs/" },
  { value: "test", label: "test/" },
  { value: "design", label: "design/" },
] as const;

/**
 * Maps a task type to a recommended git branch prefix.
 */
export function getDefaultBranchPrefix(taskType?: string | null): string {
  if (!taskType) return "feature";
  const normalized = taskType.toUpperCase().trim();

  switch (normalized) {
    case "BUG":
      return "fix";
    case "FEATURE":
    case "CUSTOMIZATION":
      return "feature";
    case "NEW_DESIGN":
    case "DESIGN_CHANGE":
    case "DESIGN_CHANGES":
      return "design";
    case "SUPPORT_REQUEST":
      return "support";
    case "DEPLOYMENT":
      return "release";
    case "MAINTENANCE":
      return "chore";
    default: {
      const sanitized = normalized.toLowerCase().replace(/[^a-z0-9]/g, "");
      return sanitized || "feature";
    }
  }
}

const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by",
  "from", "during", "and", "or", "is", "are", "was", "were", "be", "been",
  "that", "this", "these", "those", "into", "onto", "about", "via", "when",
  "while", "as", "after", "before", "over", "under", "using", "use", "uses",
  "used", "such", "than", "then", "each", "all", "both", "per"
]);

const REDUNDANT_ACTION_PREFIXES = new Set([
  "fix", "fixes", "fixed", "fixing", "bug", "bugfix", "hotfix",
  "add", "adds", "added", "adding", "create", "creates", "created", "creating",
  "implement", "implements", "implemented", "implementing",
  "update", "updates", "updated", "updating",
  "refactor", "refactors", "refactored", "refactoring",
  "automate", "automates", "automated", "automating",
  "setup", "set", "configure", "configures", "configured", "configuring",
  "integrate", "integrates", "integrated", "integrating", "integration",
  "enable", "enables", "enabled", "enabling",
  "allow", "allows", "allowed", "allowing",
  "build", "building", "built", "generate", "generates", "generated", "generating",
  "feat", "feature", "chore", "docs", "test", "tests", "support"
]);

/**
 * Converts a ticket title to a clean, semantic, git-friendly slug without chopping words or repeating prefixes.
 */
export function slugifyTitle(title: string, maxWords = 7): string {
  if (!title) return "task";

  const rawWords = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, " ")
    .split(/[\s_-]+/)
    .filter(Boolean);

  if (rawWords.length === 0) return "task";

  let meaningful = rawWords.filter((w) => !STOP_WORDS.has(w));
  if (meaningful.length === 0) {
    meaningful = rawWords;
  }

  // If leading word is a generic action word (like "automate" or "implement") and there are other meaningful words, strip it
  if (meaningful.length > 2 && REDUNDANT_ACTION_PREFIXES.has(meaningful[0])) {
    meaningful = meaningful.slice(1);
  }

  // Deduplicate consecutive or repeated words while preserving order
  const seen = new Set<string>();
  const deduplicated: string[] = [];
  for (const word of meaningful) {
    if (!seen.has(word)) {
      seen.add(word);
      deduplicated.push(word);
    }
  }

  const selected = deduplicated.slice(0, maxWords);
  const slug = selected.join("-").slice(0, 55).replace(/-+$/, "");

  return slug || "task";
}

/**
 * Generates git branch suggestions and CLI commands for a ticket.
 */
export function generateGitBranchSuggestion(params: {
  id: string;
  ticketNumber?: number | null;
  title: string;
  type?: string | null;
  prefixOverride?: string;
  slugOverride?: string | null;
}): GitBranchSuggestion {
  const { id, ticketNumber, title, type, prefixOverride, slugOverride } = params;
  const shortId = formatTicketId({ id, ticketNumber }, "TSK");
  const shortIdLower = formatTicketId({ id, ticketNumber }, "tsk");
  const prefix = prefixOverride || getDefaultBranchPrefix(type);

  let rawSlug = (slugOverride && slugOverride.trim()) ? slugOverride.trim() : slugifyTitle(title);

  rawSlug = rawSlug
    .replace(new RegExp(`^${prefix}-+`, "i"), "")
    .replace(/^(fix|bug|bugfix|hotfix|feat|feature|chore|docs|refactor)-+/i, "");

  const slug = rawSlug || slugifyTitle(title);
  const branchName = `${prefix}/${shortIdLower}-${slug}`;
  const checkoutCmd = `git checkout -b ${branchName}`;
  const switchCmd = `git switch -c ${branchName}`;
  const pushCmd = `git push -u origin ${branchName}`;
  
  const commitType = prefix === "fix" || prefix === "bugfix" || prefix === "hotfix" 
    ? "fix" 
    : prefix === "chore" || prefix === "maint" 
    ? "chore" 
    : prefix === "docs" 
    ? "docs" 
    : prefix === "refactor" 
    ? "refactor" 
    : "feat";
    
  const commitMsg = `git commit -m "${commitType}(${shortId}): ${title.trim().replace(/"/g, '\\"')}"`;

  return {
    shortId,
    prefix,
    branchName,
    checkoutCmd,
    switchCmd,
    pushCmd,
    commitMsg,
  };
}
