import React from "react";

export interface ParsedClipboardImage {
  file: File;
  fileName: string;
  fileSize: number;
}

/**
 * Extracts image files from a ClipboardEvent (native or React).
 */
export function getImagesFromClipboard(
  e: ClipboardEvent | React.ClipboardEvent
): File[] {
  const items = e.clipboardData?.items;
  const files: File[] = [];

  if (items && items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
  }

  // Fallback to clipboardData.files if items didn't yield images
  if (files.length === 0 && e.clipboardData?.files && e.clipboardData.files.length > 0) {
    const rawFiles = e.clipboardData.files;
    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];
      if (file.type.startsWith("image/")) {
        files.push(file);
      }
    }
  }

  return files;
}
