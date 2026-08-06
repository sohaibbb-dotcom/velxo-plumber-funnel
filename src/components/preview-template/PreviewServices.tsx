import type { ServiceItem } from "@/lib/preview/types";

const SERVICE_ICONS = ["🔧", "💧", "🚿", "⚡", "🔩", "🛠️", "🌊", "♨️", "🪠", "🏠"];

export function PreviewServices({ services }: { services: ServiceItem[] }) {
  return (
    <section id="services" className="section">
      <div className="container">
        <div className="section-label">What We Do</div>
        <h2 className="section-title">
          Our <span>Services</span>
        </h2>
        <div className="services-grid">
          {services.map((service, i) => (
            <div className="service-card reveal" key={service.title}>
              <div className="service-icon">{SERVICE_ICONS[i % SERVICE_ICONS.length]}</div>
              <h3 className="service-name">{service.title}</h3>
              <p className="service-desc">{service.description}</p>
              <a href="#contact" className="service-link">
                Get a Quote →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
