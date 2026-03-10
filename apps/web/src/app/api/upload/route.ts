// CreatorHub — Upload API
// POST /api/upload          — Request presigned upload URL
// POST /api/upload/confirm  — Confirm upload completed (optional, for validation)
// DELETE /api/upload         — Delete an uploaded file
//
// Flow:
// 1. Client calls POST /api/upload with { filename, contentType, category }
// 2. Server returns { uploadUrl, objectKey, publicUrl }
// 3. Client PUTs file directly to uploadUrl (browser -> MinIO/S3)
// 4. Client saves objectKey in the relevant form field

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  apiSuccess,
  apiCreated,
  requireAuthUser,
  parseBody,
  handleApiError,
} from "@/lib/api-helpers";
import {
  generatePresignedUpload,
  generatePresignedDownload,
  deleteObject,
  getMaxFileSize,
  getAllowedTypes,
  type UploadCategory,
} from "@/lib/storage";

// ----------------------------------------
// POST /api/upload — Request presigned URL
// ----------------------------------------
const uploadRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  category: z.enum([
    "avatar",
    "banner",
    "logo",
    "portfolio",
    "deliverable",
    "attachment",
  ]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = await parseBody(req, uploadRequestSchema);

    const category = body.category as UploadCategory;

    // Validate content type is allowed for this category
    const allowedTypes = getAllowedTypes(category);
    if (!allowedTypes.includes(body.contentType)) {
      return apiSuccess(
        {
          error: `File type not allowed for ${category}`,
          allowedTypes,
        },
        400
      ) as any;
    }

    const result = await generatePresignedUpload(
      user.id,
      category,
      body.filename,
      body.contentType
    );

    return apiCreated({
      ...result,
      maxSizeMB: getMaxFileSize(category),
      allowedTypes,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ----------------------------------------
// DELETE /api/upload — Delete uploaded file
// ----------------------------------------
const deleteSchema = z.object({
  objectKey: z.string().min(1),
});

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = deleteSchema.parse(await req.json());

    // Security: verify the objectKey belongs to this user
    // Object keys follow pattern: {category}/{userId}/{timestamp}-{hash}.{ext}
    const keyParts = body.objectKey.split("/");
    if (keyParts.length < 3 || keyParts[1] !== user.id) {
      return apiSuccess({ error: "You can only delete your own files" }, 403) as any;
    }

    await deleteObject(body.objectKey);

    return apiSuccess({ deleted: true, objectKey: body.objectKey });
  } catch (error) {
    return handleApiError(error);
  }
}

// ----------------------------------------
// GET /api/upload?key=... — Get download URL for private files
// ----------------------------------------
export async function GET(req: NextRequest) {
  try {
    await requireAuthUser();
    const url = new URL(req.url);
    const objectKey = url.searchParams.get("key");

    if (!objectKey) {
      return apiSuccess({ error: "Missing 'key' parameter" }, 400) as any;
    }

    const downloadUrl = await generatePresignedDownload(objectKey);

    return apiSuccess({ downloadUrl, objectKey });
  } catch (error) {
    return handleApiError(error);
  }
}
