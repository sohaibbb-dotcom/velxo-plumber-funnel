import type { Metadata } from "next";
import { PreviewRequestFlow } from "@/components/preview/PreviewRequestFlow";

export const metadata: Metadata = {
  title: "See Your Plumbing Business Before You Buy — Velxo",
  description:
    "Request a personalised preview showing how your plumbing business could look and work with Velxo.",
};

export default function PreviewPage() {
  return <PreviewRequestFlow />;
}
