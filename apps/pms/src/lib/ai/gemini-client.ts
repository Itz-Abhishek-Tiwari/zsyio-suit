import { GoogleGenAI } from "@google/genai";

export interface GeminiChatParams {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  apiKey?: string;
  /**
   * Budget in tokens for reasoning/thinking. For models like gemini-2.5-flash,
   * setting this to 0 disables thinking so response tokens start immediately and
   * thinking tokens do not consume the maxOutputTokens budget.
   * Defaults to 0 for fast, full responses.
   */
  thinkingBudget?: number;
}

export interface GeminiChatResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export function getGeminiApiKey(explicitKey?: string): string | null {
  const key = explicitKey ?? process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) return null;
  return key.trim();
}

export function getGeminiDefaultModel(): string {
  return process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
}

/**
 * Execute a unary content generation request using Google Gemini SDK (@google/genai).
 */
export async function callGeminiChat(params: GeminiChatParams): Promise<GeminiChatResponse | null> {
  const apiKey = getGeminiApiKey(params.apiKey);
  if (!apiKey) return null;

  const model = params.model ?? getGeminiDefaultModel();

  try {
    const ai = new GoogleGenAI({ apiKey });

    const config: Record<string, unknown> = {
      systemInstruction: params.systemInstruction,
      temperature: params.temperature ?? 0.2,
      maxOutputTokens: params.maxOutputTokens ?? 2048,
    };

    const budget = params.thinkingBudget !== undefined ? params.thinkingBudget : 0;
    config.thinkingConfig = { thinkingBudget: budget };

    const response = await ai.models.generateContent({
      model,
      contents: params.prompt,
      config,
    });

    const content = response.text ?? "";
    const usageMetadata = response.usageMetadata;

    return {
      content,
      model,
      usage: usageMetadata
        ? {
            inputTokens: usageMetadata.promptTokenCount ?? 0,
            outputTokens: usageMetadata.candidatesTokenCount ?? 0,
          }
        : undefined,
    };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[Gemini Client] API Error: ${errMsg}`);
    return null;
  }
}

/**
 * Streaming content generation using Google Gemini SDK (@google/genai).
 * Returns an async iterable stream of text chunks.
 */
export async function callGeminiChatStream(
  params: GeminiChatParams
): Promise<AsyncIterable<{ text?: string }> | null> {
  const apiKey = getGeminiApiKey(params.apiKey);
  if (!apiKey) return null;

  const model = params.model ?? getGeminiDefaultModel();

  try {
    const ai = new GoogleGenAI({ apiKey });

    const config: Record<string, unknown> = {
      systemInstruction: params.systemInstruction,
      temperature: params.temperature ?? 0.3,
      maxOutputTokens: params.maxOutputTokens ?? 2048,
    };

    const budget = params.thinkingBudget !== undefined ? params.thinkingBudget : 0;
    config.thinkingConfig = { thinkingBudget: budget };

    const stream = await ai.models.generateContentStream({
      model,
      contents: params.prompt,
      config,
    });

    return stream;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[Gemini Client] Streaming Error: ${errMsg}`);
    return null;
  }
}
