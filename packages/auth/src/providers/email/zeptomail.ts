import type { EmailProvider } from "../types";

export const zeptomailEmailProvider: EmailProvider = {
  async send(to: string, subject: string, body: string): Promise<void> {
    const rawToken =
      process.env.ZEPTOMAIL_TOKEN ||
      process.env.ZEPTOMAIL_SEND_MAIL_TOKEN ||
      process.env.ZEPTOMAIL_API_KEY;

    if (!rawToken) {
      throw new Error("ZEPTOMAIL_TOKEN is not set — cannot send email via ZeptoMail.");
    }

    const trimmedToken = rawToken.trim();
    const authHeader = trimmedToken.startsWith("Zoho-enczapikey ")
      ? trimmedToken
      : `Zoho-enczapikey ${trimmedToken}`;

    const rawUrl = process.env.ZEPTOMAIL_URL || "https://api.zeptomail.com/";
    const baseUrl = rawUrl.replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/v1.1/email")
      ? baseUrl
      : `${baseUrl}/v1.1/email`;

    const fromAddress =
      process.env.ZEPTOMAIL_FROM_EMAIL ||
      process.env.EMAIL_FROM ||
      "notifications@zsyio.com";
    const fromName = process.env.ZEPTOMAIL_FROM_NAME || "Zsyio";
    const bounceAddress = process.env.ZEPTOMAIL_BOUNCE_ADDRESS;

    const payload: Record<string, unknown> = {
      from: {
        address: fromAddress,
        name: fromName,
      },
      to: [
        {
          email_address: {
            address: to,
            name: to,
          },
        },
      ],
      subject,
      htmlbody: body,
    };

    if (bounceAddress) {
      payload.bounce_address = bounceAddress;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error(`[ZeptoMail Error] status=${res.status} response=${errorText}`);
        throw new Error(
          `ZeptoMail API returned ${res.status}: ${errorText || res.statusText}`
        );
      }

      const data = await res.json().catch(() => null);
      if (data?.data?.[0]?.code && data?.data?.[0]?.code !== "SUCCESS") {
        console.error("[ZeptoMail Warning]", data);
      }
    } catch (err: unknown) {
      console.error("[ZeptoMail Dispatch Exception]", err);
      throw err;
    }
  },
};
