import "server-only";
import { NextResponse } from "next/server";
import { uploadOnboardingDocument } from "@/lib/onboarding/documentUpload";

// Needs Node's file/buffer handling, not the Edge runtime.
export const runtime = "nodejs";

const GENERIC_ERROR = "We couldn't upload your file. Please try again.";

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "No file was received." }, { status: 400 });
  }

  const result = await uploadOnboardingDocument(file);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, path: result.path });
}
