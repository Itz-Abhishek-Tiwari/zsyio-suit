/**
 * Mermaid Syntax & Code Utilities
 */

/**
 * Strips leading/trailing code fences (```mermaid, ```, ````, etc.) from raw text
 */
export function cleanMermaidCode(raw: string): string {
  if (!raw) return "";
  let cleaned = raw.trim();

  // Strip opening fences like ```mermaid, ```, ````mermaid, etc.
  cleaned = cleaned.replace(/^`{3,}(?:mermaid)?\s*\n?/i, "");
  // Strip trailing fences like ``` or ````
  cleaned = cleaned.replace(/\n?`{3,}\s*$/i, "");

  return cleaned.trim();
}

/**
 * Regular expression matching known Mermaid diagram entry keywords
 */
export const MERMAID_KEYWORDS_REGEX =
  /^(?:graph\s+(?:LR|RL|TB|TD|BT)|flowchart\s+(?:LR|RL|TB|TD|BT)|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|quadrantChart|requirementDiagram|gitGraph|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|mindmap|timeline|zenuml|sankey-beta|xychart-beta|block-beta|packet-beta|architecture-beta)/i;

/**
 * Detects whether the given code string is a Mermaid diagram
 */
export function isMermaidCode(raw: string, explicitLanguage?: string): boolean {
  if (explicitLanguage && explicitLanguage.toLowerCase().includes("mermaid")) {
    return true;
  }
  const cleaned = cleanMermaidCode(raw);
  if (!cleaned) return false;

  return MERMAID_KEYWORDS_REGEX.test(cleaned);
}

/**
 * Extracts a concise human-readable diagram type badge
 */
export function getMermaidDiagramType(code: string): string {
  const cleaned = cleanMermaidCode(code);
  const firstLine = cleaned.split("\n")[0]?.trim() || "DIAGRAM";
  return firstLine.substring(0, 24).toUpperCase();
}
