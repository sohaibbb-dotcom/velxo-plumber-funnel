import { firstWord } from "@/lib/preview/content";

export function PreviewWhyChooseUs({
  businessName,
  suburb,
}: {
  businessName: string;
  suburb: string;
}) {
  return (
    <section id="why" className="section section-alt">
      <div className="container">
        <div className="section-label">Why Choose Us</div>
        <h2 className="section-title">
          The <span>{firstWord(businessName)}</span> Difference
        </h2>
        <div className="why-grid">
          <div className="why-card reveal">
            <div className="why-icon">⚡</div>
            <div className="why-title">Fast Response</div>
            <p className="why-desc">
              Call any time for emergency plumbing — we get back to you quickly and
              get the job sorted with minimal fuss.
            </p>
          </div>
          <div className="why-card reveal">
            <div className="why-icon">🏆</div>
            <div className="why-title">Quality Workmanship</div>
            <p className="why-desc">
              Every job is completed to a high standard, with clear communication from
              quote through to completion.
            </p>
          </div>
          <div className="why-card reveal">
            <div className="why-icon">💰</div>
            <div className="why-title">Upfront Pricing</div>
            <p className="why-desc">
              You&rsquo;ll always know the cost before we start. No hidden fees, no
              surprises on your invoice.
            </p>
          </div>
          <div className="why-card reveal">
            <div className="why-icon">📍</div>
            <div className="why-title">Local Experts</div>
            <p className="why-desc">
              We&rsquo;re based in {suburb} and know the local area, regulations, and
              infrastructure inside out.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
