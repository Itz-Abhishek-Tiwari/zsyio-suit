import type { EmailProvider } from "../types";

export const consoleLoggerEmailProvider: EmailProvider = {
  async send(to, subject, body) {
    console.log(`[email:console] to=${to} subject="${subject}"\n${body}`);
  },
};
