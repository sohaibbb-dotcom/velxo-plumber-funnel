/**
 * A small, fixed-position scroll cue nudging first-time visitors toward
 * the AI Automations section below the generated website preview. Same
 * minimal-wrapper technique as the rest of the injected overlay in
 * route.ts — additive <style>/<script>, never touches the generator's
 * own markup.
 *
 * Only appears if the AI Automations section genuinely isn't visible
 * without scrolling (checked once, at reveal time) — a page short enough
 * that it's already in view gets no cue at all. Disappears permanently on
 * the visitor's first scroll, whichever direction, since its only job is
 * to get them scrolling in the first place.
 *
 * Positioned well above the existing floating badge/CTA (which sit much
 * lower and, on mobile, span full width) so the two never overlap.
 */

const COPY = "Scroll to see how Velxo books your jobs while you're busy.";

const STYLE = `
#velxo-scroll-cue{position:fixed;left:50%;bottom:150px;transform:translateX(-50%);z-index:99998;display:inline-flex;align-items:center;gap:8px;background:rgba(8,10,16,0.86);backdrop-filter:blur(8px);color:rgba(255,255,255,0.92);font:600 12.5px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:10px 18px;border-radius:999px;box-shadow:0 10px 28px rgba(0,0,0,0.35);white-space:nowrap;max-width:calc(100vw - 32px);opacity:0;pointer-events:none;transition:opacity 0.6s ease,transform 0.6s ease}
#velxo-scroll-cue.velxo-scroll-cue-visible{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}
#velxo-scroll-cue.velxo-scroll-cue-hidden{opacity:0!important;transform:translateX(-50%) translateY(10px)!important;transition:opacity 0.4s ease,transform 0.4s ease}
.velxo-scroll-chevron{display:inline-block;animation:velxo-scroll-bounce 1.6s ease-in-out infinite}
@keyframes velxo-scroll-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
@media (max-width:640px){
  #velxo-scroll-cue{bottom:150px;font-size:11.5px;padding:9px 15px;white-space:normal;text-align:center;max-width:calc(100vw - 24px)}
}
@media (prefers-reduced-motion: reduce){
  .velxo-scroll-chevron{animation:none}
}
`;

const MARKUP = `
<div id="velxo-scroll-cue"><span class="velxo-scroll-chevron">⬇</span><span>${COPY}</span></div>
`;

const SCRIPT = `
<script id="velxo-ext-scroll-cue">
(function(){
  var section = document.getElementById('velxo-aa-section');
  var cue = document.getElementById('velxo-scroll-cue');
  if (!section || !cue) return;

  // Only worth prompting if it genuinely takes a scroll to reach.
  if (section.getBoundingClientRect().top <= window.innerHeight) return;

  var dismissed = false;
  var revealTimer = setTimeout(function(){
    if (!dismissed) cue.classList.add('velxo-scroll-cue-visible');
  }, 1400);

  function dismiss(){
    if (dismissed) return;
    dismissed = true;
    clearTimeout(revealTimer);
    cue.classList.remove('velxo-scroll-cue-visible');
    cue.classList.add('velxo-scroll-cue-hidden');
    window.removeEventListener('scroll', dismiss);
  }

  window.addEventListener('scroll', dismiss, { passive: true });
})();
</script>
`;

export function buildScrollCue(): string {
  return `
<style id="velxo-ext-scroll-cue-style">
${STYLE}
</style>
${MARKUP}
${SCRIPT}
`;
}
