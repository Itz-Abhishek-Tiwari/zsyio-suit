import type { StorageProvider } from "../types";

export const vercelBlobStorageProvider: StorageProvider = {
  async getUploadUrl(fileName, size) {
    if (!process.env.STORAGE_PROVIDER_URL) {
      throw new Error("STORAGE_PROVIDER_URL is not set — cannot issue an upload URL.");
    }
    throw new Error(`Not yet implemented: getUploadUrl(${fileName}, ${size})`);
  },
};
