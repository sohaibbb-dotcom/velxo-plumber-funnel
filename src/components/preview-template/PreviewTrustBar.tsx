export function PreviewTrustBar({ suburb }: { suburb: string }) {
  const items = (
    <>
      <div className="trust-item">
        <em>✓</em> Reliable Service
      </div>
      <div className="trust-item">
        <em>⚡</em> Fast Response
      </div>
      <div className="trust-item">
        <em>💰</em> Upfront Pricing
      </div>
      <div className="trust-item">
        <em>📞</em> 24/7 Emergency
      </div>
      <div className="trust-item">
        <em>🏆</em> Customer Focused
      </div>
      <div className="trust-item">
        <em>✓</em> No Call-Out Fee
      </div>
      <div className="trust-item">
        <em>🔧</em> All Plumbing Work
      </div>
      <div className="trust-item">
        <em>📍</em> Local {suburb} Team
      </div>
    </>
  );

  return (
    <div id="trust">
      <div className="trust-track">
        {items}
        {items}
      </div>
    </div>
  );
}
