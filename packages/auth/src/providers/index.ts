import type { EmailProvider, StorageProvider } from "./types";
import { consoleLoggerEmailProvider } from "./email/console-logger";
import { resendEmailProvider } from "./email/resend";
import { zeptomailEmailProvider } from "./email/zeptomail";
import { localDiskStorageProvider } from "./storage/local-disk";
import { vercelBlobStorageProvider } from "./storage/vercel-blob";

export function getActiveEmailProvider(): EmailProvider {
  if (
    process.env.ZEPTOMAIL_TOKEN ||
    process.env.ZEPTOMAIL_SEND_MAIL_TOKEN ||
    process.env.ZEPTOMAIL_API_KEY
  ) {
    return zeptomailEmailProvider;
  }
  if (process.env.EMAIL_PROVIDER_API_KEY) {
    return resendEmailProvider;
  }
  return consoleLoggerEmailProvider;
}

export function getActiveStorageProvider(): StorageProvider {
  return process.env.STORAGE_PROVIDER_URL ? vercelBlobStorageProvider : localDiskStorageProvider;
}
