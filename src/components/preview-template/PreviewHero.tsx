import type { HeadlineParts, SubheadlineParts } from "@/lib/preview/types";

export function PreviewHero({
  phone,
  suburb,
  headline,
  subheadline,
}: {
  phone: string;
  suburb: string;
  headline: HeadlineParts;
  subheadline: SubheadlineParts;
}) {
  const phoneClean = phone.replace(/\s/g, "");

  return (
    <section id="hero">
      <div className="hero-glow" />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge-dot" />
          Available 24/7 — No Call-Out Fee
        </div>

        <h1 className="hero-h1">
          {headline.prefix}
          {headline.accent && (
            <>
              <br />
              <span>{headline.accent}</span>
            </>
          )}
          {headline.suffix && (
            <>
              <br />
              {headline.suffix}
            </>
          )}
        </h1>

        <p className="hero-sub">
          {subheadline.before}
          {subheadline.bold && <strong>{subheadline.bold}</strong>}
          {subheadline.after}
        </p>

        <div className="hero-ctas">
          <a href="#contact" className="btn-primary">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <polyline points="3 7 12 13 21 7" />
            </svg>
            Get Free Quote
          </a>
          <a href={`tel:${phoneClean}`} className="btn-secondary">
            📞 Call Now: {phone}
          </a>
          <a href="#contact" className="btn-accent-ol">
            📅 Book Now
          </a>
        </div>

        <div className="hero-stats">
          <div>
            <div className="stat-num">24/7</div>
            <div className="stat-label">Availability</div>
          </div>
          <div>
            <div className="stat-num">Upfront</div>
            <div className="stat-label">Pricing</div>
          </div>
          <div>
            <div className="stat-num">Local</div>
            <div className="stat-label">{suburb} Team</div>
          </div>
          <div>
            <div className="stat-num">Fast</div>
            <div className="stat-label">Callback Response</div>
          </div>
        </div>
      </div>
    </section>
  );
}
