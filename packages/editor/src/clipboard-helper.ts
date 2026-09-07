/**
 * Utility functions for clipboard screenshot/image paste handling and client-side compression.
 */

export { getImagesFromClipboard, type ParsedClipboardImage } from "@zsyio/ui";

/**
 * Compresses an image file/blob to WebP/JPEG using Canvas.
 * Resizes max dimension to 1600px and applies 0.82 quality.
 * Reduces 5MB-10MB retina screenshots down to 100KB-300KB without visible quality loss.
 */
export async function optimizeImage(
  fileOrBlob: File | Blob,
  fallbackName?: string,
  maxDimension = 1600,
  quality = 0.82
): Promise<{ fileName: string; fileUrl: string; fileSize: number }> {
  // Non-image files (PDFs, docs) shouldn't be processed via Canvas
  if (fileOrBlob.type && !fileOrBlob.type.startsWith("image/")) {
    return fileToDataUrl(fileOrBlob, fallbackName);
  }

  try {
    const rawDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBlob);
    });

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = rawDataUrl;
    });

    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (width <= 0 || height <= 0) {
      return fileToDataUrl(fileOrBlob, fallbackName);
    }

    // Scale down proportionally if larger than maxDimension
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return fileToDataUrl(fileOrBlob, fallbackName);
    }

    ctx.drawImage(img, 0, 0, width, height);

    // Prefer webp, fallback to jpeg
    let optimizedDataUrl = canvas.toDataURL("image/webp", quality);
    if (!optimizedDataUrl.startsWith("data:image/webp")) {
      optimizedDataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    // Generate clean filename
    let name = (fileOrBlob as File).name || fallbackName;
    if (!name || name === "image.png" || name === "blob" || name === "Screenshot.png") {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      name = `Screenshot_${dateStr}.webp`;
    } else {
      name = name.replace(/\.(png|jpg|jpeg)$/i, ".webp");
    }

    // Estimate byte size from base64 length
    const approxSize = Math.round((optimizedDataUrl.length * 3) / 4);

    return {
      fileName: name,
      fileUrl: optimizedDataUrl,
      fileSize: approxSize,
    };
  } catch {
    return fileToDataUrl(fileOrBlob, fallbackName);
  }
}

/**
 * Converts a File or Blob (image/document) to a Base64 data URL with a clean filename.
 */
export async function fileToDataUrl(
  fileOrBlob: File | Blob,
  fallbackName?: string
): Promise<{ fileName: string; fileUrl: string; fileSize: number }> {
  const fileUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob);
  });

  let name = (fileOrBlob as File).name || fallbackName;
  if (!name || name === "image.png" || name === "blob") {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    name = `Screenshot_${dateStr}.png`;
  }

  return {
    fileName: name,
    fileUrl,
    fileSize: fileOrBlob.size,
  };
}
