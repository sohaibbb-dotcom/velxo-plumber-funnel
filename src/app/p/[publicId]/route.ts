import "server-only";
import { after } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { buildOnboardingUrl } from "@/lib/routes";
import { advancePreviewViewedByEmail } from "@/lib/leadFulfillment";
import type { PreviewRequestRow } from "@/lib/preview/types";

type Params = { publicId: string };

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  // Keep every preview out of search indexes without touching the served
  // document itself — this works whether the body is the generator's own
  // page or one of the small status pages below.
  "x-robots-tag": "noindex, nofollow",
} as const;

async function getPreviewRow(publicId: string): Promise<PreviewRequestRow | null> {
  const { data, error } = await supabaseServer
    .from("preview_requests")
    .select("*")
    .eq("public_id", publicId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PreviewRequestRow;
}

/**
 * First-view-only, same as before. No longer force-sets status to "viewed"
 * on every row: status now also carries generation outcome ("generated" /
 * "failed"), which is more specific and shouldn't be clobbered by a view,
 * and rows already past "viewed" (onboarding/converted) shouldn't regress.
 */
async function markViewed(publicId: string) {
  try {
    await supabaseServer
      .from("preview_requests")
      .update({ status: "viewed", preview_viewed_at: new Date().toISOString() })
      .eq("public_id", publicId)
      .is("preview_viewed_at", null)
      .in("status", ["pending", "generated", "sent"]);
  } catch (err) {
    console.error("Failed to mark preview as viewed:", err);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Contrast fixes for bugs found in the live generator's own CSS (confirmed
 * by inspecting its raw <style> block, not guessed): several headings are
 * hardcoded to `color:var(--white)` even inside sections whose background
 * is scheme-adaptive (light for light colour schemes), and a few paragraphs
 * inside the always-dark hero/quote/mobile-menu sections use the
 * scheme-adaptive `--text`/`--text-mid` vars, which go dark-on-dark for
 * light schemes. `--text` itself is correct in both directions (near-white
 * on dark schemes, near-black on light schemes), so re-pointing the
 * wrongly-white selectors at it is safe for every scheme, not just light
 * ones. This does not touch the generator's own stylesheet — it's a
 * separate, additive <style> tag with higher source-order/`!important`
 * precedence, per the "minimal wrapper" scope already agreed.
 */
const CONTRAST_FIX_CSS = `
.services-section .section-title,
.why-section .section-title,
.how-section .section-title,
.reviews-section .section-title,
.stats-section .section-title,
.service-card h3,
.why-item-text h4,
.how-card h3,
.review-name,
.stat-number,
#trust .trust-item{color:var(--text)!important}
#navbar.scrolled .nav-logo{color:var(--text)!important}
#navbar.scrolled .hamburger span{background:var(--text)!important}
.hero-sub,
.cta-inner > p,
.mobile-menu a{color:rgba(255,255,255,0.75)!important}
`;

/**
 * The generator's own "fill out the form below" copy in the quote section
 * points at an empty `.ghl-form-wrap` — no GHL account is wired up for
 * instant previews, so nothing renders there. This restores a real,
 * premium-styled enquiry form in that exact slot, matching the approved
 * demo sites' form card (white card, labelled fields, accent submit
 * button). It is deliberately inert: no `action`, no `fetch`, no external
 * script — clicking submit just reveals a confirmation message.
 */
function buildContactFormScript(accent: string): string {
  return `
<style id="velxo-ext-form-style">
.velxo-contact-form{background:#fff;border-radius:12px;padding:28px;text-align:left;box-shadow:0 12px 40px rgba(0,0,0,0.25);max-width:520px;margin:0 auto}
.velxo-contact-form label{display:block;font:600 13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1a1a1a;margin-bottom:14px}
.velxo-form-row{display:flex;gap:14px}
.velxo-form-row label{flex:1}
.velxo-contact-form input,.velxo-contact-form textarea{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:11px 14px;border:1.5px solid #e0e0e0;border-radius:8px;font:400 14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1a1a1a;background:#fafafa}
.velxo-contact-form textarea{min-height:80px;resize:vertical}
.velxo-contact-form input:focus,.velxo-contact-form textarea:focus{outline:none;border-color:${accent}}
#velxo-form-submit{width:100%;margin-top:4px;padding:14px;border:none;border-radius:8px;background:${accent};color:#fff;font:700 15px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}
#velxo-form-submit:hover{filter:brightness(1.08)}
#velxo-form-submit:disabled{cursor:default;filter:brightness(0.9)}
#velxo-form-result{margin-top:14px;text-align:center;font:600 14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1a7a3a}
.velxo-form-disclaimer{margin-top:10px;text-align:center;font:500 11px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#999}
@media (max-width:640px){.velxo-form-row{flex-direction:column;gap:0}}
</style>
<script>
(function(){
  var wrap = document.querySelector('.ghl-form-wrap');
  if (!wrap) return;
  wrap.innerHTML = '' +
    '<div class="velxo-contact-form">' +
      '<div class="velxo-form-row">' +
        '<label>First Name<input type="text" placeholder="Enter your first name"></label>' +
        '<label>Last Name<input type="text" placeholder="Enter your last name"></label>' +
      '</div>' +
      '<div class="velxo-form-row">' +
        '<label>Phone<input type="tel" placeholder="04xx xxx xxx"></label>' +
        '<label>Email<input type="email" placeholder="you@email.com"></label>' +
      '</div>' +
      '<label>What\\'s the issue?<textarea placeholder="Tell us what\\'s going on..."></textarea></label>' +
      '<button type="button" id="velxo-form-submit">Send Enquiry</button>' +
      '<p id="velxo-form-result" style="display:none">\\u2713 Enquiry captured \\u2014 preview only.</p>' +
      '<p class="velxo-form-disclaimer">Preview only \\u2014 this form isn\\'t connected yet.</p>' +
    '</div>';
  var btn = document.getElementById('velxo-form-submit');
  var result = document.getElementById('velxo-form-result');
  btn.addEventListener('click', function(){
    result.style.display = 'block';
    btn.textContent = 'Sent \\u2713';
    btn.disabled = true;
  });
})();
</script>
`;
}

/**
 * Replaces the generator's own IntersectionObserver + CSS-transition card
 * reveals (plain "opacity 0.7s ease", no stagger grouping) with GSAP
 * ScrollTrigger reveals matching the approved demo sites' timing: grouped
 * per grid/parent, power2.out easing, ~0.1s stagger. gsap + ScrollTrigger
 * are already loaded by the generator's own <script> tags earlier in the
 * document, so this only adds behaviour, never touches their code. Skips
 * entirely under prefers-reduced-motion.
 */
const ANIMATION_ENHANCEMENT_SCRIPT = `
<script id="velxo-ext-anim">
(function(){
  if (typeof gsap === 'undefined') return;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fadeEls = document.querySelectorAll('.fade-up');
  if (reduceMotion) {
    fadeEls.forEach(function(el){ el.style.transition = 'none'; el.style.opacity = '1'; el.style.transform = 'none'; });
    return;
  }
  if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
  fadeEls.forEach(function(el){ el.style.transition = 'none'; });
  var parents = [];
  fadeEls.forEach(function(el){
    if (el.parentElement && parents.indexOf(el.parentElement) === -1) parents.push(el.parentElement);
  });
  parents.forEach(function(parent){
    var els = Array.prototype.filter.call(parent.children, function(el){ return el.classList.contains('fade-up'); });
    if (!els.length) return;
    gsap.set(els, {opacity:0, y:40});
    gsap.to(els, {
      opacity:1, y:0, duration:0.7, ease:'power2.out', stagger:0.1,
      scrollTrigger: { trigger: parent, start:'top 85%', toggleActions:'play none none none' }
    });
  });
  document.querySelectorAll('.btn-primary, .btn-nav, .nav-cta').forEach(function(btn){
    btn.addEventListener('mouseenter', function(){ gsap.to(btn, {scale:1.03, duration:0.2, ease:'power2.out'}); });
    btn.addEventListener('mouseleave', function(){ gsap.to(btn, {scale:1, duration:0.3, ease:'elastic.out(1,0.5)'}); });
  });
})();
</script>
`;

/**
 * The only visible additions this project makes to the generator's own
 * HTML: a small "personalised preview" badge and a floating CTA back to
 * onboarding, plus (see above) contrast fixes, a restored contact form, and
 * smoother scroll-reveal animations. Badge/CTA positioned to clear the
 * generator's own fixed chat widget (bottom:28px/right:28px, ~58px tall)
 * rather than covering it.
 */
function buildInjectedOverlay(row: PreviewRequestRow): string {
  const onboardingUrl = buildOnboardingUrl(row.public_id);
  const accent = row.secondary_color || "#00a8ff";

  return `
<style id="velxo-ext-style">
${CONTRAST_FIX_CSS}
#velxo-ext-badge{position:fixed;left:16px;bottom:16px;z-index:100000;display:inline-flex;align-items:center;gap:6px;width:max-content;max-width:calc(100vw - 32px);background:rgba(10,10,10,0.88);color:rgba(255,255,255,0.85);font:600 11px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.2px;padding:8px 12px;border-radius:999px;box-shadow:0 4px 16px rgba(0,0,0,0.3);white-space:nowrap}
#velxo-ext-badge strong{color:#fff}
#velxo-ext-cta{position:fixed;z-index:100000;right:28px;bottom:100px;background:${accent};color:#fff;font:700 14px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:14px 22px;border-radius:999px;text-decoration:none;box-shadow:0 8px 24px rgba(0,0,0,0.35);white-space:nowrap}
#velxo-ext-cta:hover{filter:brightness(1.08)}
@media (max-width:640px){
  #velxo-ext-cta{left:16px;right:16px;bottom:94px;text-align:center;border-radius:12px;white-space:normal}
  #velxo-ext-badge{left:12px;bottom:12px;font-size:10px}
}
</style>
<div id="velxo-ext-badge">✨ <strong>Built by Velxo</strong></div>
<a id="velxo-ext-cta" href="${onboardingUrl}">Launch This For My Business</a>
${buildContactFormScript(accent)}
${ANIMATION_ENHANCEMENT_SCRIPT}
`;
}

/** Injects the overlay right before </body>; appends it if the tag is somehow missing. */
function withOverlay(html: string, overlay: string): string {
  const idx = html.lastIndexOf("</body>");
  if (idx === -1) return html + overlay;
  return html.slice(0, idx) + overlay + html.slice(idx);
}

function statusPageHtml({
  title,
  heading,
  message,
  accent,
}: {
  title: string;
  heading: string;
  message: string;
  accent: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="robots" content="noindex, nofollow">
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0f1e;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:center;padding:24px}
.card{max-width:440px}
.tag{font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${accent};margin-bottom:14px}
h1{font-size:clamp(24px,5vw,34px);margin:0 0 16px;line-height:1.2}
p{color:rgba(255,255,255,0.7);line-height:1.6;margin:0}
</style>
</head>
<body>
<div class="card">
<div class="tag">Velxo Preview</div>
<h1>${escapeHtml(heading)}</h1>
<p>${escapeHtml(message)}</p>
</div>
</body>
</html>`;
}

function notFoundHtml(): string {
  return statusPageHtml({
    title: "Preview not found — Velxo",
    heading: "This preview link isn't valid.",
    message:
      "It may have been mistyped, or the preview may no longer be available. If you were sent this link, please check it and try again.",
    accent: "#00a8ff",
  });
}

function pendingOrFailedHtml(row: PreviewRequestRow): string {
  const accent = row.secondary_color || "#00a8ff";
  if (row.status === "failed") {
    return statusPageHtml({
      title: `${row.business_name} — Preview | Velxo`,
      heading: "Your preview is taking longer than expected.",
      message:
        "We couldn't finish building this preview automatically. Please submit the form again, or get in touch and we'll sort it out.",
      accent,
    });
  }
  return statusPageHtml({
    title: `${row.business_name} — Preview | Velxo`,
    heading: "Your preview is still being built.",
    message: "This usually only takes a few seconds. Refresh this page shortly.",
    accent,
  });
}

export async function GET(_request: Request, { params }: { params: Promise<Params> }) {
  const { publicId } = await params;
  const row = await getPreviewRow(publicId);

  if (!row) {
    return new Response(notFoundHtml(), { status: 404, headers: HTML_HEADERS });
  }

  await markViewed(publicId);

  // Advances the matching onboarding_submissions opportunity to "Preview
  // Viewed" (a no-op if that business hasn't submitted the onboarding form
  // yet, or has already moved past this stage) — after the response is
  // sent, so a slow HighLevel call never delays serving the preview.
  after(() => advancePreviewViewedByEmail(row.email));

  if (row.generated_html) {
    return new Response(withOverlay(row.generated_html, buildInjectedOverlay(row)), {
      status: 200,
      headers: HTML_HEADERS,
    });
  }

  return new Response(pendingOrFailedHtml(row), { status: 200, headers: HTML_HEADERS });
}
