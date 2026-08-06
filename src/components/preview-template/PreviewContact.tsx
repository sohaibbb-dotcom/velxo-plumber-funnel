export function PreviewContact({
  businessName,
  phone,
  suburb,
}: {
  businessName: string;
  phone: string;
  suburb: string;
}) {
  const phoneClean = phone.replace(/\s/g, "");

  return (
    <section id="contact" className="section section-alt">
      <div className="container">
        <div className="section-label">Get In Touch</div>
        <h2 className="section-title">
          Get Your <span>Free Quote</span>
        </h2>
        <div className="contact-wrap">
          <div className="contact-info reveal">
            <h3>Ready to Fix Your Plumbing Problem?</h3>
            <p>
              Whether it&rsquo;s an emergency callout or a planned renovation, our team
              is ready to help. Contact us for a free, no-obligation quote.
            </p>
            <div className="contact-row">
              <div className="contact-icon">📞</div>
              <div className="contact-text">
                <strong>Phone</strong>
                <span>
                  <a href={`tel:${phoneClean}`} style={{ color: "var(--w70)" }}>
                    {phone}
                  </a>
                </span>
              </div>
            </div>
            <div className="contact-row">
              <div className="contact-icon">📍</div>
              <div className="contact-text">
                <strong>Service Area</strong>
                <span>{suburb} and surrounding areas</span>
              </div>
            </div>
            <div className="contact-row">
              <div className="contact-icon">🕐</div>
              <div className="contact-text">
                <strong>Hours</strong>
                <span>24/7 Emergencies — Mon–Sat 7am–7pm Scheduled</span>
              </div>
            </div>
            <a href={`tel:${phoneClean}`} className="btn-primary" style={{ marginTop: "10px" }}>
              📞 Call Now: {phone}
            </a>
          </div>

          <div className="cta-form reveal">
            <div className="mock-field">
              <span>Name</span>
              <div className="mock-input" />
            </div>
            <div className="mock-field">
              <span>Phone</span>
              <div className="mock-input" />
            </div>
            <div className="mock-field">
              <span>How can {businessName} help?</span>
              <div className="mock-textarea" />
            </div>
            <div className="mock-submit">Send Message</div>
            <p className="preview-note">Preview only — this form isn&rsquo;t connected yet.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
