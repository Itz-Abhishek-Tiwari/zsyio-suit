import { after } from "next/server";

/**
 * Runs side work (notifications, AI enrichment) after the response is sent.
 * `after()` keeps the function alive until the work settles, where a bare
 * fire-and-forget promise can be frozen once the response goes out. Outside a
 * request (unit tests, scripts) `after()` throws, so run the work immediately.
 */
export function runAfterResponse(work: () => Promise<unknown>, label: string): void {
  const run = () => work().catch((err) => console.error(`${label} error:`, err));
  try {
    after(run);
  } catch {
    void run();
  }
}
