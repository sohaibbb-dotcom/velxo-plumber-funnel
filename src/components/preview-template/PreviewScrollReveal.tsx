"use client";

import { useEffect } from "react";

/**
 * Ported from the reference template's inline script: an IntersectionObserver
 * that fades/slides `.reveal` elements in as they scroll into view (same
 * threshold/rootMargin/stagger as the original), plus the navbar scrolled
 * class toggle equivalent lives in PreviewNav itself.
 *
 * Renders nothing — it's a DOM-effect component, mounted once per preview page.
 */
export function PreviewScrollReveal() {
  useEffect(() => {
    const root = document.querySelector(".preview-template");
    if (!root) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" },
    );

    root.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    ["services-grid", "why-grid", "reviews-grid", "photos-grid", "velxo-grid"].forEach(
      (cls) => {
        const grid = root.querySelector(`.${cls}`);
        if (!grid) return;
        grid.querySelectorAll(".reveal").forEach((card, i) => {
          (card as HTMLElement).style.transitionDelay = `${i * 0.08}s`;
        });
      },
    );

    return () => io.disconnect();
  }, []);

  return null;
}
