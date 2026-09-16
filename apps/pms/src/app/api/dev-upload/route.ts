import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { requireUser, errorResponse } from "@zsyio/auth/api-helpers";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".pdf",
  ".txt",
  ".csv",
  ".docx",
  ".xlsx",
  ".pptx",
  ".zip",
]);

export async function PUT(request: NextRequest) {
  try {
    // 1. Guard against local filesystem writing in production environments
    if (process.env.NODE_ENV === "production") {
      return errorResponse(
        "FORBIDDEN",
        "Local filesystem dev-upload is disabled in production. Please configure object storage.",
        403
      );
    }

    await requireUser();

    const searchParams = request.nextUrl.searchParams;
    const rawFileName = searchParams.get("fileName");
    if (!rawFileName) {
      return errorResponse("BAD_REQUEST", "fileName query parameter is required.", 400);
    }

    // 2. Validate file extension allowlist to prevent Stored XSS / arbitrary code execution
    const ext = path.extname(rawFileName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return errorResponse(
        "BAD_REQUEST",
        `File extension "${ext || "unknown"}" is not permitted. Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}`,
        400
      );
    }

    // 3. Validate content-length header if provided
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE_BYTES) {
      return errorResponse("BAD_REQUEST", "File size exceeds the 10MB limit.", 400);
    }

    const buffer = Buffer.from(await request.arrayBuffer());
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      return errorResponse("BAD_REQUEST", "File size exceeds the 10MB limit.", 400);
    }

    // 4. Sanitize file name and prefix with timestamp to prevent overwrites
    const sanitizedBase = path
      .basename(decodeURIComponent(rawFileName), ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 100);
    const safeFileName = `${Date.now()}_${sanitizedBase || "file"}${ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, safeFileName), buffer);

    return NextResponse.json({
      success: true,
      fileUrl: `/uploads/${encodeURIComponent(safeFileName)}`,
    });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    console.error("Dev upload error:", err);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to save uploaded file locally.", 500);
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
