import "server-only";
import { randomUUID } from "node:crypto";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Server-side upload of business-verification documents (and, for the
 * Complete plan, logo/website-photo uploads) into a PRIVATE Supabase
 * Storage bucket. Never exposes a public URL — the bucket has no RLS
 * policies at all, so only the service-role client (this file) can read or
 * write it, same pattern as every Postgres table in this app. Storage paths
 * are random UUIDs, not derived from the uploaded filename, so they're
 * non-guessable and never leak the original filename into the path.
 */

export const ONBOARDING_UPLOADS_BUCKET = "onboarding-uploads";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

// Extensions accepted for each MIME type above — checked against the
// uploaded filename as a second signal alongside the browser-reported MIME
// type, since either alone can be spoofed by the client.
const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
};

export type UploadResult = { success: true; path: string } | { success: false; error: string };

function fileExtension(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() ?? "") : "";
}

export async function uploadOnboardingDocument(file: File): Promise<UploadResult> {
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "No file was received." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: "File is too large. Maximum size is 10 MB." };
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return { success: false, error: "Unsupported file type. Please upload a PDF, JPG or PNG." };
  }

  const claimedExt = fileExtension(file.name);
  if (!ALLOWED_EXTENSIONS[file.type].includes(claimedExt)) {
    return { success: false, error: "The file extension doesn't match its contents. Please re-upload." };
  }

  // Random, non-guessable path — never derived from the original filename.
  const path = `${randomUUID()}.${ext}`;

  const { error } = await supabaseServer.storage
    .from(ONBOARDING_UPLOADS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    // Never log file contents or any signed/private URL — message only.
    console.error("Onboarding document upload failed:", error.message);
    return { success: false, error: "We couldn't upload your file. Please try again." };
  }

  return { success: true, path };
}
