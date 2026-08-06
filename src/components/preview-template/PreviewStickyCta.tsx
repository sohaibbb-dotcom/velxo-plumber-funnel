import { buildOnboardingUrl } from "@/lib/routes";

export function PreviewStickyCta({ publicId }: { publicId: string }) {
  return (
    <div className="sticky-cta">
      <a href={buildOnboardingUrl(publicId)} className="btn-primary">
        Launch This For My Business
      </a>
    </div>
  );
}
