import type { StorageProvider } from "../types";

export const localDiskStorageProvider: StorageProvider = {
  async getUploadUrl(fileName) {
    const fileUrl = `/uploads/${encodeURIComponent(fileName)}`;
    return { url: `/api/dev-upload?fileName=${encodeURIComponent(fileName)}`, fileUrl };
  },
};
