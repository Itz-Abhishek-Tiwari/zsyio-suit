export interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<void>;
}

export interface StorageProvider {
  getUploadUrl(fileName: string, size: number): Promise<{ url: string; fileUrl: string }>;
}
