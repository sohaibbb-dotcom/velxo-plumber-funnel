const FEATURES = [
  {
    icon: "🤖",
    title: "AI Receptionist",
    desc: "Answers customer questions day or night, so no enquiry goes unanswered.",
  },
  {
    icon: "💬",
    title: "Missed Call Text-Back",
    desc: "Every missed call gets an instant text reply, before they call the next plumber.",
  },
  {
    icon: "📅",
    title: "Online Booking",
    desc: "Customers can request a job straight from the site, any time.",
  },
  {
    icon: "🔁",
    title: "Automatic Lead Follow-Up",
    desc: "New enquiries are followed up automatically, so nothing sits unanswered.",
  },
];

/**
 * Not part of the reference template — new content included with every
 * Velxo-built site. Reuses the same theme variables as the rest of the
 * page so it reads as a native part of the site, not a bolted-on ad.
 */
export function VelxoFeaturesBanner() {
  return (
    <section className="section velxo-banner">
      <div className="container">
        <div className="velxo-banner-label">
          <em>✦</em> Included with your Velxo website
        </div>
        <h2 className="section-title">
          Built To <span>Capture Every Job</span>
        </h2>
        <div className="velxo-grid">
          {FEATURES.map((feature) => (
            <div className="velxo-card reveal" key={feature.title}>
              <div className="velxo-icon">{feature.icon}</div>
              <div className="velxo-title">{feature.title}</div>
              <p className="velxo-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
