import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Checkout Cancelled — Velxo",
  robots: { index: false, follow: false },
};

export default function OnboardingCancelledPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <XCircle className="h-7 w-7" />
      </span>
      <h1 className="max-w-md text-2xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
        Checkout was cancelled.
      </h1>
      <p className="max-w-sm text-[15px] leading-relaxed text-zinc-500">
        No payment was made and your trial hasn&apos;t started. You can pick
        a plan again whenever you&apos;re ready.
      </p>
      <Link href="/#pricing" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-2")}>
        Back to Pricing
      </Link>
    </div>
  );
}
