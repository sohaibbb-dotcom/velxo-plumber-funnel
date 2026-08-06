import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { isPlan } from "@/lib/plans";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = {
  title: "Start Your Velxo Trial",
  description: "Set up your business and start your 30-day free trial.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; preview?: string }>;
}) {
  const params = await searchParams;
  const plan = isPlan(params.plan) ? params.plan : null;
  const previewPublicId = typeof params.preview === "string" && params.preview ? params.preview : null;

  if (!plan) {
    return <InvalidPlan />;
  }

  return <OnboardingFlow plan={plan} previewPublicId={previewPublicId} />;
}

function InvalidPlan() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center">
      <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase">Onboarding</p>
      <h1 className="max-w-md text-2xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
        We need to know which plan you&apos;re signing up for.
      </h1>
      <p className="max-w-sm text-[15px] leading-relaxed text-zinc-500">
        This link is missing or has an invalid plan. Head back to pricing and
        choose AI Receptionist or Velxo Complete to continue.
      </p>
      <Link href="/#pricing" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-2")}>
        Back to Pricing
      </Link>
    </div>
  );
}
