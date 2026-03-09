// CreatorHub — Storage Helper (MinIO / S3-compatible)
// Generates presigned URLs for direct browser uploads.
// MinIO in dev, S3 in production — same API.

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";
import crypto from "crypto";

// =============================
// S3 CLIENT
// =============================

const protocol = env.MINIO_USE_SSL ? "https" : "http";
const endpoint = `${protocol}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`;

const s3Client = new S3Client({
  region: "us-east-1", // MinIO ignores this but SDK requires it
  endpoint,
  forcePathStyle: true, // Required for MinIO
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY,
  },
});

const BUCKET = env.MINIO_BUCKET;

// =============================
// UPLOAD TYPES & CONFIG
// =============================

export type UploadCategory =
  | "avatar"
  | "banner"
  | "logo"
  | "portfolio"
  | "deliverable"
  | "attachment";

const CATEGORY_CONFIG: Record<
  UploadCategory,
  {
    maxSizeMB: number;
    allowedTypes: string[];
    path: string;
  }
> = {
  avatar: {
    maxSizeMB: 5,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    path: "avatars",
  },
  banner: {
    maxSizeMB: 10,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    path: "banners",
  },
  logo: {
    maxSizeMB: 5,
    allowedTypes: ["image/jpeg", "image/png", "image/svg+xml", "image/webp"],
    path: "logos",
  },
  portfolio: {
    maxSizeMB: 50,
    allowedTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
      "audio/mpeg",
      "audio/wav",
    ],
    path: "portfolio",
  },
  deliverable: {
    maxSizeMB: 100,
    allowedTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
      "audio/mpeg",
      "application/pdf",
      "application/zip",
    ],
    path: "deliverables",
  },
  attachment: {
    maxSizeMB: 25,
    allowedTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/zip",
      "text/plain",
    ],
    path: "attachments",
  },
};

// =============================
// PRESIGNED UPLOAD URL
// =============================

export interface PresignedUploadResult {
  uploadUrl: string; // PUT this URL with the file
  objectKey: string; // store this in DB
  publicUrl: string; // use this to display the file
  expiresIn: number; // seconds
}

export async function generatePresignedUpload(
  userId: string,
  category: UploadCategory,
  filename: string,
  contentType: string
): Promise<PresignedUploadResult> {
  const config = CATEGORY_CONFIG[category];
  if (!config) throw new Error(`Invalid upload category: ${category}`);

  // Validate content type
  if (!config.allowedTypes.includes(contentType)) {
    throw new Error(
      `File type ${contentType} not allowed for ${category}. Allowed: ${config.allowedTypes.join(", ")}`
    );
  }

  // Generate unique object key
  const ext = filename.split(".").pop() || "bin";
  const hash = crypto.randomBytes(8).toString("hex");
  const timestamp = Date.now();
  const objectKey = `${config.path}/${userId}/${timestamp}-${hash}.${ext}`;

  const expiresIn = 3600; // 1 hour

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
    ContentType: contentType,
    ContentLength: config.maxSizeMB * 1024 * 1024, // max size hint
    Metadata: {
      "uploaded-by": userId,
      category,
      "original-name": filename,
    },
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  const publicUrl = `${env.NEXT_PUBLIC_MINIO_PUBLIC_URL}/${BUCKET}/${objectKey}`;

  return { uploadUrl, objectKey, publicUrl, expiresIn };
}

// =============================
// PRESIGNED DOWNLOAD URL
// =============================

export async function generatePresignedDownload(
  objectKey: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// =============================
// DELETE OBJECT
// =============================

export async function deleteObject(objectKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: objectKey,
  });

  await s3Client.send(command);
}

// =============================
// VALIDATE FILE SIZE (client-side hint)
// =============================

export function getMaxFileSize(category: UploadCategory): number {
  return CATEGORY_CONFIG[category]?.maxSizeMB || 10;
}

export function getAllowedTypes(category: UploadCategory): string[] {
  return CATEGORY_CONFIG[category]?.allowedTypes || [];
}
