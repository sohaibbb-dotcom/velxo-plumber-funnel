"use client";

import { useEffect, useState } from "react";
import { splitBusinessNameForLogo } from "@/lib/preview/content";

export function PreviewNav({
  businessName,
  phone,
  hasReviews,
}: {
  businessName: string;
  phone: string;
  hasReviews: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { rest, last } = splitBusinessNameForLogo(businessName);
  const phoneClean = phone.replace(/\s/g, "");
  const closeMenu = () => setOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav id="navbar" className={scrolled ? "scrolled" : ""}>
        <a href="#hero" className="nav-logo">
          <span className="nav-logo-text">
            {rest ? `${rest} ` : ""}
            <span>{last}</span>
          </span>
        </a>
        <div className="nav-right">
          <a href={`tel:${phoneClean}`} className="nav-phone desktop-only">
            <strong>📞 {phone}</strong> &nbsp;— 24/7
          </a>
          <a href="#contact" className="btn-nav desktop-only">
            Get Free Quote
          </a>
          <a href="#contact" className="btn-nav btn-nav-ol desktop-only">
            📅 Book Now
          </a>
          <button
            type="button"
            className={`nav-hamburger${open ? " open" : ""}`}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className={`mobile-menu${open ? " open" : ""}`}>
        <a href="#services" onClick={closeMenu}>
          Services
        </a>
        <a href="#why" onClick={closeMenu}>
          Why Us
        </a>
        {hasReviews && (
          <a href="#reviews" onClick={closeMenu}>
            Reviews
          </a>
        )}
        <a href="#contact" onClick={closeMenu}>
          Contact
        </a>
        <a href={`tel:${phoneClean}`} className="btn-nav" onClick={closeMenu}>
          📞 Call {phone}
        </a>
        <a href="#contact" className="btn-nav btn-nav-ol" onClick={closeMenu}>
          📅 Book Now
        </a>
      </div>
    </>
  );
}
