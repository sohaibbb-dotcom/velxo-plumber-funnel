/**
 * Ported 1:1 from the reference template's inline <style> block
 * (Demo plumber site / generate.js). Every selector is scoped under
 * `.preview-template` so it can't leak into the rest of the Velxo app —
 * the original targeted `:root`/`body`/`*` directly, which was safe for a
 * standalone static HTML file but not for one route inside a shared app.
 *
 * The only genuinely dynamic values (bg/accent/accent-rgb/glow/glow-strong)
 * are NOT hardcoded here — they're set as inline CSS custom properties on
 * the wrapper via buildThemeVars() (see src/lib/preview/theme.ts) so this
 * stylesheet can stay static while still theming per business.
 *
 * Do not "clean up" or restructure this file into Tailwind — it exists to
 * preserve the reference template exactly, not approximate it.
 */
export function PreviewTemplateStyles() {
  return (
    <style>{`
/*
 * The reference template sets scroll-behavior on <html> (the only element
 * it can be set on for whole-document scrolling). This <style> tag — and
 * therefore this rule — only exists in the DOM while /p/[publicId] is
 * mounted, so it can't affect scrolling on any other route.
 */
html{scroll-behavior:smooth}

.preview-template,
.preview-template *,
.preview-template *::before,
.preview-template *::after{box-sizing:border-box}
.preview-template *,
.preview-template *::before,
.preview-template *::after{margin:0;padding:0}
.preview-template *{cursor:default!important}
.preview-template a,
.preview-template button{cursor:pointer!important}
.preview-template img{max-width:100%;height:auto;display:block}
.preview-template a{color:inherit;text-decoration:none}

.preview-template{
  --white: #ffffff;
  --w70: rgba(255,255,255,0.70);
  --w40: rgba(255,255,255,0.40);
  --glass: rgba(255,255,255,0.06);
  --glass-b: rgba(255,255,255,0.10);
  --alt: rgba(255,255,255,0.03);
  --font-h: 'Bebas Neue',sans-serif;
  --font-b: 'DM Sans',sans-serif;
  --r: 12px;
  --ease: 0.3s ease;

  background:var(--bg);color:var(--white);font-family:var(--font-b);
  font-size:16px;line-height:1.6;overflow-x:hidden;position:relative;
}

.preview-template .container{max-width:1180px;margin:0 auto;padding:0 24px}
.preview-template .section{padding:96px 0}
.preview-template .section-alt{background:var(--alt)}
.preview-template .section-label{font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
.preview-template .section-title{font-family:var(--font-h);font-size:clamp(34px,5vw,58px);text-transform:uppercase;line-height:1;margin-bottom:52px}
.preview-template .section-title span{color:var(--accent)}

.preview-template .reveal{opacity:0;transform:translateY(36px);transition:opacity 0.65s ease,transform 0.65s ease}
.preview-template .reveal.visible{opacity:1;transform:none}

.preview-template #navbar{
  position:fixed;top:36px;left:0;right:0;z-index:1000;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 28px;height:72px;
  background:rgba(10,15,30,0.92);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border-bottom:1px solid var(--glass-b);
  transition:height var(--ease),background var(--ease),box-shadow var(--ease);
}
.preview-template #navbar.scrolled{height:62px;background:rgba(10,15,30,0.98);box-shadow:0 4px 32px rgba(0,0,0,0.5)}
.preview-template .nav-logo{display:flex;align-items:center;gap:10px}
.preview-template .nav-logo-img{height:38px;width:auto;object-fit:contain}
.preview-template .nav-logo-text{font-family:var(--font-h);font-size:20px;letter-spacing:2px;text-transform:uppercase}
.preview-template .nav-logo-text span{color:var(--accent)}
.preview-template .nav-right{display:flex;align-items:center;gap:14px}
.preview-template .nav-phone{color:var(--w70);font-size:14px;font-weight:500}
.preview-template .nav-phone strong{color:var(--white)}
.preview-template .desktop-only{display:none!important}
@media(min-width:768px){
  .preview-template .desktop-only{display:inline-flex!important}
  .preview-template .nav-hamburger{display:none}
}

.preview-template .btn-nav{
  background:var(--accent);color:var(--white);
  border:none;border-radius:8px;padding:10px 18px;
  font-family:var(--font-b);font-size:13px;font-weight:700;
  display:inline-flex;align-items:center;gap:6px;transition:var(--ease);
}
.preview-template .btn-nav:hover{box-shadow:0 0 24px var(--glow-strong);transform:translateY(-1px)}
.preview-template .btn-nav-ol{background:transparent;border:1.5px solid var(--accent);color:var(--accent)}
.preview-template .btn-nav-ol:hover{background:var(--accent);color:var(--white)}

.preview-template .nav-hamburger{display:flex;flex-direction:column;gap:5px;background:none;border:none;padding:4px}
.preview-template .nav-hamburger span{display:block;width:24px;height:2px;background:var(--white);border-radius:2px;transition:all .3s}
.preview-template .nav-hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.preview-template .nav-hamburger.open span:nth-child(2){opacity:0;transform:scaleX(0)}
.preview-template .nav-hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}

.preview-template .mobile-menu{
  display:none;position:fixed;top:108px;left:0;right:0;z-index:999;
  background:rgba(10,15,30,0.98);backdrop-filter:blur(20px);
  border-bottom:1px solid var(--glass-b);padding:20px 24px;
  flex-direction:column;gap:0;
}
.preview-template .mobile-menu.open{display:flex}
.preview-template .mobile-menu a{color:var(--white);font-size:15px;font-weight:600;padding:13px 0;border-bottom:1px solid var(--glass-b);display:block}
.preview-template .mobile-menu a:last-child{border-bottom:none}
.preview-template .mobile-menu .btn-nav{text-align:center;justify-content:center;margin-top:6px;border-bottom:none;display:flex}

.preview-template #hero{position:relative;min-height:100vh;display:flex;align-items:center;padding:120px 0 80px;overflow:hidden}
.preview-template .hero-glow{
  position:absolute;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(ellipse 65% 55% at 80% 35%,rgba(var(--accent-rgb),0.13) 0%,transparent 65%),
    radial-gradient(ellipse 45% 65% at 12% 68%,rgba(var(--accent-rgb),0.07) 0%,transparent 65%);
}
.preview-template .hero-overlay{position:absolute;inset:0;z-index:1;background:linear-gradient(135deg,rgba(10,15,30,0.96) 0%,rgba(10,15,30,0.72) 55%,rgba(10,15,30,0.90) 100%)}
.preview-template .hero-content{position:relative;z-index:2;padding:0 24px;max-width:820px}
@media(min-width:1200px){.preview-template .hero-content{margin-left:8%}}

.preview-template .hero-badge{
  display:inline-flex;align-items:center;gap:8px;
  background:var(--glow);border:1px solid rgba(var(--accent-rgb),0.30);border-radius:100px;
  padding:7px 16px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
  color:var(--accent);margin-bottom:26px;animation:preview-fadein 0.8s ease both;
}
.preview-template .badge-dot{width:7px;height:7px;background:var(--accent);border-radius:50%;animation:preview-pulsedot 2s infinite}
@keyframes preview-pulsedot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.72)}}
@keyframes preview-fadein{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}

.preview-template .hero-h1{
  font-family:var(--font-h);font-size:clamp(50px,8.5vw,108px);
  line-height:.94;letter-spacing:2px;text-transform:uppercase;
  margin-bottom:22px;animation:preview-fadein .9s .12s ease both;
}
.preview-template .hero-h1 span{color:var(--accent)}
.preview-template .hero-sub{font-size:clamp(16px,2.1vw,20px);color:var(--w70);line-height:1.65;margin-bottom:40px;max-width:500px;animation:preview-fadein .9s .25s ease both}
.preview-template .hero-sub strong{color:var(--white);font-weight:700}
.preview-template .hero-ctas{display:flex;gap:14px;flex-wrap:wrap;animation:preview-fadein .9s .38s ease both}

.preview-template .btn-primary{
  background:var(--accent);color:var(--white);border:none;border-radius:10px;
  padding:15px 30px;font-family:var(--font-b);font-size:16px;font-weight:700;
  display:inline-flex;align-items:center;gap:8px;transition:var(--ease);
}
.preview-template .btn-primary:hover{box-shadow:0 0 40px var(--glow-strong),0 8px 32px rgba(var(--accent-rgb),.28);transform:translateY(-2px)}
.preview-template .btn-secondary{
  background:transparent;color:var(--white);border:1.5px solid var(--glass-b);
  border-radius:10px;padding:15px 30px;font-family:var(--font-b);font-size:16px;font-weight:600;
  display:inline-flex;align-items:center;gap:8px;backdrop-filter:blur(10px);transition:var(--ease);
}
.preview-template .btn-secondary:hover{border-color:var(--accent);color:var(--accent);box-shadow:0 0 24px rgba(var(--accent-rgb),.2);transform:translateY(-2px)}
.preview-template .btn-accent-ol{
  background:transparent;color:var(--accent);border:1.5px solid var(--accent);
  border-radius:10px;padding:15px 30px;font-family:var(--font-b);font-size:16px;font-weight:700;
  display:inline-flex;align-items:center;gap:8px;transition:var(--ease);
}
.preview-template .btn-accent-ol:hover{background:var(--accent);color:var(--white);box-shadow:0 0 32px var(--glow-strong);transform:translateY(-2px)}
@media(max-width:580px){
  .preview-template .hero-ctas{flex-direction:column}
  .preview-template .btn-primary,
  .preview-template .btn-secondary,
  .preview-template .btn-accent-ol{justify-content:center}
}

.preview-template .hero-stats{
  display:flex;gap:40px;flex-wrap:wrap;
  margin-top:52px;padding-top:32px;border-top:1px solid var(--glass-b);
  animation:preview-fadein .9s .50s ease both;
}
.preview-template .stat-num{font-family:var(--font-h);font-size:38px;color:var(--accent);line-height:1}
.preview-template .stat-label{font-size:12px;color:var(--w40);margin-top:4px;letter-spacing:.5px}

.preview-template #trust{background:var(--alt);border-top:1px solid var(--glass-b);border-bottom:1px solid var(--glass-b);padding:18px 0;overflow:hidden}
.preview-template .trust-track{display:flex;gap:48px;align-items:center;white-space:nowrap;width:max-content;animation:preview-marquee 24s linear infinite}
.preview-template .trust-item{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--w70);flex-shrink:0}
.preview-template .trust-item em{color:var(--accent);font-style:normal;font-size:15px}
@keyframes preview-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}

.preview-template .services-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:22px}
.preview-template .service-card{background:var(--glass);border:1px solid var(--glass-b);border-radius:var(--r);padding:34px 26px;transition:transform var(--ease),border-color var(--ease),box-shadow var(--ease)}
.preview-template .service-card:hover{transform:translateY(-4px);border-color:rgba(var(--accent-rgb),.42);box-shadow:0 16px 40px rgba(0,0,0,.3)}
.preview-template .service-icon{font-size:34px;margin-bottom:18px}
.preview-template .service-name{font-family:var(--font-h);font-size:21px;letter-spacing:1px;margin-bottom:10px}
.preview-template .service-desc{font-size:14px;color:var(--w70);line-height:1.65;margin-bottom:18px}
.preview-template .service-link{color:var(--accent);font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:4px;transition:gap var(--ease)}
.preview-template .service-link:hover{gap:9px}

.preview-template #why .section-title,
.preview-template #why .section-label{text-align:center}
.preview-template .why-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:22px}
.preview-template .why-card{background:var(--glass);border:1px solid var(--glass-b);border-radius:var(--r);padding:30px 22px;text-align:center;transition:transform var(--ease),border-color var(--ease)}
.preview-template .why-card:hover{transform:translateY(-4px);border-color:rgba(var(--accent-rgb),.42)}
.preview-template .why-icon{font-size:38px;margin-bottom:14px}
.preview-template .why-title{font-family:var(--font-h);font-size:20px;letter-spacing:1px;margin-bottom:8px}
.preview-template .why-desc{font-size:14px;color:var(--w70);line-height:1.65}

.preview-template .reviews-note{font-size:14px;color:var(--w40);margin:-30px 0 32px;max-width:520px}
.preview-template .reviews-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:22px}
.preview-template .review-card{position:relative;background:var(--glass);border:1px solid var(--glass-b);border-radius:var(--r);padding:30px 26px;display:flex;flex-direction:column;transition:transform var(--ease),border-color var(--ease)}
.preview-template .review-card:hover{transform:translateY(-4px);border-color:rgba(var(--accent-rgb),.42)}
.preview-template .review-sample-tag{position:absolute;top:16px;right:16px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--w40);background:rgba(var(--accent-rgb),.12);border:1px solid var(--glass-b);border-radius:999px;padding:4px 10px}
.preview-template .review-stars{font-size:18px;color:#fbbf24;letter-spacing:2px;margin-bottom:14px}
.preview-template .review-text{font-size:14px;color:var(--w70);line-height:1.7;margin-bottom:18px;font-style:italic;flex:1}
.preview-template .review-author strong{font-size:14px;font-weight:700}
.preview-template .review-author span{display:block;font-size:12px;color:var(--w40);margin-top:3px}

.preview-template .contact-wrap{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start}
@media(max-width:900px){.preview-template .contact-wrap{grid-template-columns:1fr}}
.preview-template .contact-info h3{font-family:var(--font-h);font-size:30px;letter-spacing:1px;margin-bottom:16px}
.preview-template .contact-info p{color:var(--w70);line-height:1.7;margin-bottom:28px}
.preview-template .contact-row{display:flex;align-items:center;gap:14px;margin-bottom:18px}
.preview-template .contact-icon{width:42px;height:42px;border-radius:10px;background:var(--glow);border:1px solid rgba(var(--accent-rgb),.22);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.preview-template .contact-text strong{display:block;font-size:14px;margin-bottom:2px}
.preview-template .contact-text span{font-size:13px;color:var(--w70)}
.preview-template .cta-form{background:var(--glass);border:1px solid var(--glass-b);border-radius:20px;padding:24px;backdrop-filter:blur(16px);display:flex;flex-direction:column;gap:14px}
.preview-template .mock-field{display:flex;flex-direction:column;gap:6px}
.preview-template .mock-field span{font-size:12px;color:var(--w40)}
.preview-template .mock-field .mock-input{height:44px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid var(--glass-b)}
.preview-template .mock-field .mock-textarea{height:88px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid var(--glass-b)}
.preview-template .mock-submit{height:46px;border-radius:8px;background:var(--glass-b);color:var(--w40);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;margin-top:4px}
.preview-template .preview-note{font-size:12px;color:var(--w40);text-align:center;margin-top:4px}

.preview-template #footer{background:rgba(0,0,0,0.40);border-top:1px solid var(--glass-b);padding:56px 0 28px}
.preview-template .footer-top{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:40px;margin-bottom:36px}
@media(max-width:768px){.preview-template .footer-top{grid-template-columns:1fr}}
.preview-template .footer-brand-name{font-family:var(--font-h);font-size:22px;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px}
.preview-template .footer-brand-name span{color:var(--accent)}
.preview-template .footer-tagline{font-size:14px;color:var(--w70);line-height:1.6}
.preview-template .footer-col h4{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--w40);margin-bottom:14px}
.preview-template .footer-col ul{list-style:none}
.preview-template .footer-col li{margin-bottom:9px}
.preview-template .footer-col a{font-size:14px;color:var(--w70);transition:color var(--ease)}
.preview-template .footer-col a:hover{color:var(--accent)}
.preview-template .footer-bottom{padding-top:22px;border-top:1px solid var(--glass-b);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.preview-template .footer-bottom p{font-size:13px;color:var(--w40)}
.preview-template .footer-bottom span{color:var(--accent)}

/* ── New chrome: not part of the reference template ── */
.preview-template .velxo-banner{
  background:linear-gradient(180deg,var(--alt) 0%,rgba(255,255,255,0.02) 100%);
  border-top:1px solid var(--glass-b);border-bottom:1px solid var(--glass-b);
}
.preview-template .velxo-banner-label{
  display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:700;
  letter-spacing:2px;text-transform:uppercase;color:var(--w40);margin-bottom:14px;
}
.preview-template .velxo-banner-label em{color:var(--accent);font-style:normal}
.preview-template .velxo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:22px}
.preview-template .velxo-card{background:var(--glass);border:1px solid var(--glass-b);border-radius:var(--r);padding:26px 22px}
.preview-template .velxo-icon{width:40px;height:40px;border-radius:10px;background:var(--glow);color:var(--accent);display:flex;align-items:center;justify-content:center;margin-bottom:14px}
.preview-template .velxo-title{font-family:var(--font-h);font-size:19px;letter-spacing:1px;margin-bottom:6px}
.preview-template .velxo-desc{font-size:13px;color:var(--w70);line-height:1.6}

.preview-template .preview-flag{
  position:fixed;top:0;left:0;right:0;z-index:1001;height:36px;
  display:flex;align-items:center;justify-content:center;gap:8px;
  background:rgba(10,15,30,0.98);color:var(--w70);
  font-size:12px;font-weight:600;letter-spacing:.3px;
  padding:0 16px;text-align:center;border-bottom:1px solid var(--glass-b);
}
.preview-template .preview-flag strong{color:var(--white)}

/* Room at the bottom so the sticky CTA never covers the footer's content. */
.preview-template{padding-bottom:84px}

.preview-template .sticky-cta{
  position:fixed;left:0;right:0;bottom:0;z-index:1000;
  background:rgba(10,15,30,0.97);backdrop-filter:blur(16px);
  border-top:1px solid var(--glass-b);
  padding:12px 16px;
  display:flex;align-items:center;justify-content:center;gap:12px;
}
.preview-template .sticky-cta .btn-primary{width:100%;justify-content:center}
@media(min-width:640px){
  .preview-template .sticky-cta .btn-primary{width:auto}
}

/*
 * Chat widget — ported from the reference project's own fake chatbot
 * (Demo plumber site/hts-plumbing/output/index.html): same bubble, same
 * panel layout, same open/close + send interaction. Colours use this
 * page's --accent/--glass variables instead of the source's one-off
 * hardcoded orange theme, so it works correctly across all six schemes.
 * Positioned above the sticky CTA bar (~73px tall) so it never covers it.
 */
.preview-template .chat-widget{position:fixed;bottom:90px;right:20px;z-index:1002}
.preview-template .chat-bubble{
  width:58px;height:58px;border-radius:50%;background:var(--accent);
  display:flex;align-items:center;justify-content:center;cursor:pointer;
  border:none;box-shadow:0 4px 20px var(--glow-strong);transition:transform 0.25s;
}
.preview-template .chat-bubble:hover{transform:scale(1.1)}
.preview-template .chat-bubble svg{width:26px;height:26px;stroke:var(--white);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.preview-template .chat-box{
  position:absolute;bottom:72px;right:0;width:300px;max-width:calc(100vw - 40px);
  background:rgba(10,15,30,0.97);backdrop-filter:blur(16px);
  border:1px solid var(--glass-b);border-radius:12px;
  box-shadow:0 12px 40px rgba(0,0,0,0.4);overflow:hidden;
  display:none;flex-direction:column;
}
.preview-template .chat-box.open{display:flex}
.preview-template .chat-header{background:var(--accent);padding:16px 18px;display:flex;align-items:center;gap:12px}
.preview-template .chat-avatar{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:18px}
.preview-template .chat-header-info h4{font-size:14px;font-weight:700;color:var(--white)}
.preview-template .chat-header-info p{font-size:12px;color:rgba(255,255,255,0.8)}
.preview-template .chat-online{width:8px;height:8px;border-radius:50%;background:#4ade80;margin-left:auto;flex-shrink:0}
.preview-template .chat-messages{padding:16px;display:flex;flex-direction:column;gap:10px;min-height:120px;max-height:260px;overflow-y:auto}
.preview-template .chat-msg{background:rgba(255,255,255,0.06);border-radius:8px;padding:10px 14px;font-size:13px;color:var(--w70);line-height:1.5;max-width:85%}
.preview-template .chat-reply{background:var(--accent);color:var(--white);align-self:flex-end;border-radius:8px;padding:10px 14px;font-size:13px;max-width:85%}
.preview-template .chat-input-row{display:flex;gap:8px;padding:12px;border-top:1px solid var(--glass-b)}
.preview-template .chat-input-row input{flex:1;min-width:0;background:rgba(255,255,255,0.06);border:1px solid var(--glass-b);border-radius:6px;padding:9px 12px;font-size:13px;color:var(--white);outline:none;font-family:var(--font-b)}
.preview-template .chat-input-row input::placeholder{color:var(--w40)}
.preview-template .chat-send{background:var(--accent);border:none;border-radius:6px;padding:9px 14px;cursor:pointer;color:var(--white);font-size:14px;transition:opacity 0.2s}
.preview-template .chat-send:hover{opacity:0.85}
`}</style>
  );
}
