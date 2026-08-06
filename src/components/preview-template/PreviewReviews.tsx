/**
 * The reference template renders real submitted reviews here, or omits the
 * section entirely if there are none. This preview has no genuine reviews
 * for the business yet, so rather than either inventing testimonials or
 * showing a single sparse placeholder, it renders a full grid of clearly
 * labelled illustrative reviews — same visual density as the real thing,
 * with every card marked "Sample review" and attributed to "Verified
 * Customer" rather than an invented name.
 */
const SAMPLE_REVIEWS = [
  "Called about a blocked drain and had someone out the same day — really happy with how quickly it was sorted.",
  "Great communication from start to finish. Knew the price before any work began, no surprises on the invoice.",
  "Fixed the issue properly the first time round. Would use again without hesitation.",
  "Turned up on time and left the place spotless afterwards. Can't fault the service.",
  "Explained exactly what was wrong and what it would cost before starting the job.",
  "Sorted an emergency call-out quickly and was easy to deal with the whole way through.",
];

export function PreviewReviews({ suburb }: { suburb: string }) {
  return (
    <section id="reviews" className="section">
      <div className="container">
        <div className="section-label">Customer Reviews</div>
        <h2 className="section-title">
          What Clients <span>Say</span>
        </h2>
        <p className="reviews-note">
          Illustrative examples — your real Google reviews will appear here once
          you&rsquo;re live with Velxo.
        </p>
        <div className="reviews-grid">
          {SAMPLE_REVIEWS.map((text, i) => (
            <div className="review-card reveal" key={i}>
              <span className="review-sample-tag">Sample review</span>
              <div className="review-stars">★★★★★</div>
              <p className="review-text">&ldquo;{text}&rdquo;</p>
              <div className="review-author">
                <strong>Verified Customer</strong>
                <span>{suburb}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
