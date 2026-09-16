/**
 * AI-Generated Management Ticket Summary using Google Gemini (@google/genai)
 *
 * Generates a clear, concise, management-friendly summary of a ticket.
 * The summary is intentionally non-technical - it focuses on the main issue,
 * business context, impact, and overall purpose so that non-technical stakeholders
 * can quickly understand what a ticket is about.
 */
import { callGeminiChatStream, getGeminiApiKey } from "./gemini-client";

const SYSTEM_INSTRUCTION = `You are a professional technical writer creating summaries for project management stakeholders and executives who are non-technical.

Given a support/project ticket, write a concise 2–4 sentence summary that:
- Clearly states the main issue or goal in plain business language
- Explains the business impact or reason this matters
- Mentions the affected area or product if relevant
- Avoids all technical jargon, code terms, internal system names, and implementation details

Tone: Professional, clear, and concise. Output ONLY the summary paragraph - no headers, no bullet points, no markdown, no labels.`;

function buildUserPrompt(params: {
  title: string;
  description?: string | null;
  type?: string | null;
  priority?: string | null;
  status?: string | null;
  clientName?: string | null;
  productName?: string | null;
}): string {
  const { title, description, type, priority, status, clientName, productName } = params;
  const lines: string[] = [];
  lines.push(`Title: ${title.trim().slice(0, 200)}`);
  if (type) lines.push(`Type: ${type}`);
  if (priority) lines.push(`Priority: ${priority}`);
  if (status) lines.push(`Status: ${status}`);
  if (clientName) lines.push(`Client: ${clientName}`);
  if (productName) lines.push(`Product: ${productName}`);
  if (description && description.trim()) {
    const cleanDesc = description
      .replace(/<[^>]+>/g, " ")
      .replace(/[#*`_~\[\]()>]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 800);
    lines.push(`\nDescription:\n${cleanDesc}`);
  }
  return lines.join("\n");
}

/**
 * Streams AI-generated summary tokens directly from Google Gemini.
 *
 * @param params Ticket details
 * @param onComplete Callback invoked with the fully assembled summary string once finished
 * @returns A ReadableStream yielding SSE formatted text chunks (`data: {"token": "..."}\n\n`)
 */
export async function createSummaryStream(
  params: {
    title: string;
    description?: string | null;
    type?: string | null;
    priority?: string | null;
    status?: string | null;
    clientName?: string | null;
    productName?: string | null;
    apiKey?: string;
  },
  onComplete?: (fullText: string) => Promise<void> | void
): Promise<ReadableStream<Uint8Array> | null> {
  if (!params.description || !params.description.trim()) {
    return null;
  }

  const resolvedKey = getGeminiApiKey(params.apiKey);
  if (!resolvedKey) {
    console.warn("[Gemini Summary Stream] No API key configured.");
    return null;
  }

  const userPrompt = buildUserPrompt(params);

  const stream = await callGeminiChatStream({
    apiKey: resolvedKey,
    systemInstruction: SYSTEM_INSTRUCTION,
    prompt: userPrompt,
    temperature: 0.3,
    maxOutputTokens: 2048,
    thinkingBudget: 0,
  });

  if (!stream) {
    return null;
  }

  const encoder = new TextEncoder();
  let fullAccumulated = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const textToken = chunk.text ?? "";
          if (textToken) {
            fullAccumulated += textToken;
            const sseEvent = `data: ${JSON.stringify({ token: textToken })}\n\n`;
            controller.enqueue(encoder.encode(sseEvent));
          }
        }

        // Send completion event with full text
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, fullText: fullAccumulated.trim() })}\n\n`)
        );
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();

        // Trigger persistence callback
        if (fullAccumulated.trim() && onComplete) {
          try {
            await onComplete(fullAccumulated.trim());
          } catch (saveErr) {
            console.error("[Gemini Summary Stream] onComplete callback error:", saveErr);
          }
        }
      } catch (streamErr) {
        console.error("[Gemini Summary Stream] Iteration error:", streamErr);
        controller.error(streamErr);
      }
    },
  });
}
