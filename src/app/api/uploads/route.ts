import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { ApiError, jsonError, jsonOk, rateLimit, requireUser, clientIp } from "@/lib/api";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/constants";

/**
 * Local object-storage adapter for development. Production swaps this for a
 * presigned S3/R2 upload and never proxies bytes through the app server.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireUser();
    rateLimit(`upload:${ctx.user.id}`, 40, 10 * 60 * 1000);
    rateLimit(`upload-ip:${clientIp(req)}`, 80, 10 * 60 * 1000);

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "NO_FILE", "No file was uploaded.");
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new ApiError(415, "UNSUPPORTED_TYPE", "Only JPG, PNG or WebP images are accepted.");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new ApiError(413, "FILE_TOO_LARGE", "Images must be 6 MB or smaller.");
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const hash = createHash("sha256").update(bytes).digest("hex");
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const fileName = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), bytes);

    return jsonOk({ url: `/uploads/${fileName}`, hash, size: file.size, mimeType: file.type }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
