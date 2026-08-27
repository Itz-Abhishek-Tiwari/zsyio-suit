import type { EmailProvider } from "../types";

export const resendEmailProvider: EmailProvider = {
  async send(to, subject, body) {
    const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
    if (!apiKey) {
      throw new Error("EMAIL_PROVIDER_API_KEY is not set — cannot send via Resend.");
    }
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html: body }),
    });
  },
};
