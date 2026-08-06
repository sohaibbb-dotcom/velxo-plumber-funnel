import { splitBusinessNameForLogo } from "@/lib/preview/content";
import type { ServiceItem } from "@/lib/preview/types";

export function PreviewFooter({
  businessName,
  suburb,
  services,
  phone,
}: {
  businessName: string;
  suburb: string;
  services: ServiceItem[];
  phone: string;
}) {
  const { rest, last } = splitBusinessNameForLogo(businessName);
  const phoneClean = phone.replace(/\s/g, "");
  const year = new Date().getFullYear();
  const tagline = `${suburb}'s Most Trusted Plumber`;

  return (
    <footer id="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <div className="footer-brand-name">
              {rest ? `${rest} ` : ""}
              <span>{last}</span>
            </div>
            <p className="footer-tagline">{tagline}. Fast, reliable, and always on time.</p>
          </div>
          <div className="footer-col">
            <h4>Services</h4>
            <ul>
              {services.slice(0, 5).map((service) => (
                <li key={service.title}>
                  <a href="#services">{service.title}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li>
                <a href={`tel:${phoneClean}`}>📞 {phone}</a>
              </li>
              <li>
                <a href="#contact">📋 Get a Free Quote</a>
              </li>
              <li>
                <a href="#contact">📅 Book Online</a>
              </li>
              <li style={{ fontSize: "14px", color: "var(--w40)" }}>📍 {suburb}, VIC</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © {year} {businessName}. All rights reserved.
          </p>
          <p>
            Serving <span>{suburb}</span> &amp; surrounding areas
          </p>
        </div>
      </div>
    </footer>
  );
}
