import { callGeminiChat, getGeminiApiKey } from "./gemini-client";

export interface AiTestCaseItem {
  title: string;
  description?: string;
  steps: string;
  expectedResult: string;
}

export interface GenerateTestCasesResult {
  testCases: AiTestCaseItem[];
  source: "gemini" | "fallback";
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

const SYSTEM_INSTRUCTION = `You are a Senior QA Engineer creating structured, professional test cases for a software ticket.
Given the ticket details (title, type, priority, and description), generate 3 to 6 targeted QA test cases.

Respond ONLY with a valid JSON array of objects. Each object MUST have:
- "title": (string) Clear, action-oriented test title (e.g. "Verify successful checkout with discount code")
- "description": (string, optional) Brief context, precondition, or scenario
- "steps": (string) Step-by-step instructions numbered like "1. Go to page...\\n2. Enter value...\\n3. Click Submit"
- "expectedResult": (string) Exact expected system behavior or outcome

Do NOT include markdown formatting or backticks around the JSON unless standard JSON. Return pure JSON array.`;

export async function generateGeminiTestCases(params: {
  title: string;
  description?: string | null;
  type?: string | null;
  priority?: string | null;
  apiKey?: string;
}): Promise<GenerateTestCasesResult> {
  const { title, description, type, priority, apiKey } = params;
  const resolvedKey = getGeminiApiKey(apiKey);

  if (!resolvedKey) {
    return {
      testCases: [],
      source: "fallback",
    };
  }

  const userPrompt = [
    `Ticket Title: ${title}`,
    type ? `Type: ${type}` : "",
    priority ? `Priority: ${priority}` : "",
    description ? `Description:\n${description.slice(0, 1500)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await callGeminiChat({
    apiKey: resolvedKey,
    systemInstruction: SYSTEM_INSTRUCTION,
    prompt: userPrompt,
    temperature: 0.2,
    maxOutputTokens: 2500,
    thinkingBudget: 0,
  });

  if (!response || !response.content) {
    return { testCases: [], source: "fallback" };
  }

  try {
    const cleanJson = response.content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleanJson);

    if (Array.isArray(parsed) && parsed.length > 0) {
      const validCases: AiTestCaseItem[] = parsed.map((item) => ({
        title: String(item.title || "Untitled Test Case").trim(),
        description: item.description ? String(item.description).trim() : undefined,
        steps: String(item.steps || "").trim(),
        expectedResult: String(item.expectedResult || "").trim(),
      }));

      return {
        testCases: validCases,
        source: "gemini",
        usage: response.usage,
      };
    }

    return { testCases: [], source: "fallback" };
  } catch (parseError) {
    console.warn(`[Gemini QA] Failed to parse JSON response:`, parseError);
    return { testCases: [], source: "fallback" };
  }
}

// Backward-compatible alias
export const generateOpenAiTestCases = generateGeminiTestCases;
