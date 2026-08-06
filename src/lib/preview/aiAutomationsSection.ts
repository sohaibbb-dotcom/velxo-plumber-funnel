/**
 * "AI Automations" section injected directly under the generated website
 * preview — same minimal-wrapper technique as the badge/CTA/contact-form
 * in route.ts (additive <style>/<script>, never touches the generator's
 * own markup).
 *
 * A single continuous phone-conversation demo (missed call -> AI SMS
 * reply -> booking -> review request), not four separate per-feature
 * demos — it autoplays once when the section scrolls into view, then
 * settles into a headline + the three service cards, with a Replay Demo
 * button to run it again.
 *
 * Colour handling inside the phone: the phone mockup itself is ALWAYS a
 * fixed dark UI (an iPhone screen, not the site's own theme), so anything
 * drawn on it uses fixed colours, never the generator's scheme-adaptive
 * --text/--text-mid vars — those flip to near-black for light colour
 * schemes, which would make chat text unreadable against the phone's
 * permanently-dark bubbles. --orange/--black-mid/--black-light/--white
 * are safe to keep using outside the phone (the header, cards, end
 * screen) since --white is a fixed value in the generator's own CSS, and
 * the section itself sits on the generator's real (scheme-adaptive)
 * background. "Missed Call" red and the success badges' green are fixed
 * semantic colours on purpose — they should read the same regardless of
 * brand palette.
 */

type Card = { title: string; subtitle: string };

const CARDS: Card[] = [
  { title: "Missed Call Assistant", subtitle: "Replies to missed calls within seconds and keeps customers engaged." },
  { title: "AI Booking", subtitle: "Books customers automatically through SMS conversations." },
  { title: "Google Reviews", subtitle: "Automatically follows up after every completed job to generate more 5-star reviews." },
];

const STYLE = `
#velxo-aa-section{padding:100px 5% 120px;background:var(--black-mid);position:relative;overflow:hidden}
.velxo-aa-header{text-align:center;max-width:640px;margin:0 auto 56px}
.velxo-aa-eyebrow{display:inline-flex;align-items:center;gap:8px;font:700 12px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:var(--orange);margin-bottom:18px}
.velxo-aa-header h2{font-family:'Bebas Neue',sans-serif;font-size:clamp(30px,4vw,48px);color:var(--white);line-height:1.1;margin:0 0 14px;letter-spacing:0.02em}
.velxo-aa-header p{font:400 16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text-mid);margin:0}

/* ── demo stage ── */
.velxo-aa-stage{max-width:1100px;margin:0 auto;display:flex;flex-direction:column;align-items:center}

.velxo-aa-phone-wrap{transition:opacity 0.6s cubic-bezier(0.4,0,0.2,1),transform 0.6s cubic-bezier(0.4,0,0.2,1);opacity:1;transform:scale(1)}
.velxo-aa-phone-wrap.velxo-aa-fading{opacity:0;transform:scale(0.94);pointer-events:none}
.velxo-aa-phone-wrap.velxo-aa-gone{display:none}

.velxo-aa-phone{width:272px;height:552px;background:#05070c;border-radius:44px;border:1px solid rgba(255,255,255,0.08);padding:10px;position:relative;box-shadow:0 30px 70px -20px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.04)}
.velxo-aa-phone-inner{width:100%;height:100%;background:#0b0e14;border-radius:34px;position:relative;overflow:hidden;display:flex;flex-direction:column}
.velxo-aa-phone-notch{position:absolute;top:14px;left:50%;transform:translateX(-50%);width:84px;height:24px;border-radius:16px;background:#000;z-index:5}
.velxo-aa-phone-home{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:110px;height:4px;border-radius:3px;background:rgba(255,255,255,0.35);z-index:5}

/* Ringing: a phone actually buzzing on a bench — stronger horizontal
   shake, a touch of rotation, a subtle scale pulse. Runs on the phone
   itself, not just the on-screen rings, and stops the instant the call
   is marked missed. */
@keyframes velxo-aa-phone-vibrate{
  0%,100%{transform:translateX(0) rotate(0deg) scale(1)}
  10%{transform:translateX(-6px) rotate(-2deg) scale(1.015)}
  20%{transform:translateX(6px) rotate(2deg) scale(1.025)}
  30%{transform:translateX(-6px) rotate(-1.6deg) scale(1.015)}
  40%{transform:translateX(6px) rotate(1.6deg) scale(1.025)}
  50%{transform:translateX(-5px) rotate(-2deg) scale(1.015)}
  60%{transform:translateX(5px) rotate(2deg) scale(1.025)}
  70%{transform:translateX(-5px) rotate(-1.4deg) scale(1.015)}
  80%{transform:translateX(4px) rotate(1.4deg) scale(1.02)}
  90%{transform:translateX(-3px) rotate(-0.8deg) scale(1.01)}
}
.velxo-aa-phone.velxo-aa-ringing{animation:velxo-aa-phone-vibrate 0.45s ease-in-out infinite}

.velxo-aa-screen{position:absolute;inset:0;display:flex;flex-direction:column;opacity:0;transition:opacity 0.35s ease;pointer-events:none}
.velxo-aa-screen.velxo-aa-active{opacity:1;pointer-events:auto}

/* Scene 0: plumber busy on the tools — the opening context, and the brief cutback later */
.velxo-aa-screen-working{align-items:center;justify-content:center;gap:20px;padding:60px 30px;background:linear-gradient(180deg,#12161f 0%,#0b0e14 100%);text-align:center}
.velxo-aa-working-icon{font-size:56px;line-height:1;animation:velxo-aa-wrench-wiggle 1.8s ease-in-out infinite}
@keyframes velxo-aa-wrench-wiggle{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(10deg)}}
.velxo-aa-working-caption{font:600 14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:rgba(255,255,255,0.82);max-width:200px}

/* Scene 1: call */
.velxo-aa-screen-call{align-items:center;justify-content:center;gap:22px;padding:60px 20px 40px;background:linear-gradient(180deg,#12161f 0%,#0b0e14 100%)}
.velxo-aa-call-avatar{width:88px;height:88px;border-radius:50%;background:var(--black-light);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:34px;color:var(--white);position:relative;flex-shrink:0}
.velxo-aa-ring{position:absolute;inset:0;border-radius:50%;border:2px solid var(--orange);opacity:0;animation:velxo-aa-ring-pulse 1.1s ease-out infinite}
.velxo-aa-ring:nth-child(2){animation-delay:0.35s}
.velxo-aa-ring:nth-child(3){animation-delay:0.7s}
@keyframes velxo-aa-ring-pulse{0%{transform:scale(1);opacity:0.85}100%{transform:scale(2.1);opacity:0}}
.velxo-aa-call-name{font:600 17px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--white)}
.velxo-aa-call-status{font:600 14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:rgba(255,255,255,0.82)}
.velxo-aa-missed{font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:0.03em;color:#ff4d4d;opacity:0;transform:translateY(6px) scale(0.9);transition:opacity 0.3s cubic-bezier(0.34,1.56,0.64,1),transform 0.3s cubic-bezier(0.34,1.56,0.64,1);text-shadow:0 0 24px rgba(255,77,77,0.5)}
.velxo-aa-missed.velxo-aa-show{opacity:1;transform:translateY(0) scale(1)}
.velxo-aa-call-status.velxo-aa-hide,.velxo-aa-ring-wrap.velxo-aa-hide{display:none}

/* Scenes 2-4: chat */
.velxo-aa-screen-chat{background:#0b0e14;padding:52px 14px 18px}
.velxo-aa-chat-messages{flex:1;display:flex;flex-direction:column;gap:10px;overflow-y:auto;overflow-x:hidden;scroll-behavior:smooth;padding:4px 6px;scrollbar-width:none}
.velxo-aa-chat-messages::-webkit-scrollbar{display:none}
.velxo-aa-msg{max-width:80%;padding:11px 15px;border-radius:17px;font:500 14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;opacity:0;transform:translateY(10px) scale(0.9);transition:opacity 0.35s cubic-bezier(0.34,1.56,0.64,1),transform 0.35s cubic-bezier(0.34,1.56,0.64,1);transform-origin:bottom left}
.velxo-aa-msg.velxo-aa-show{opacity:1;transform:translateY(0) scale(1)}
.velxo-aa-msg-ai{align-self:flex-start;background:#22283a;color:#f5f7fa;border-bottom-left-radius:5px;transform-origin:bottom left}
.velxo-aa-msg-customer{align-self:flex-end;background:var(--orange);color:#fff;border-bottom-right-radius:5px;transform-origin:bottom right;box-shadow:0 4px 14px -4px rgba(0,0,0,0.4)}
.velxo-aa-msg-stars{display:block;font-size:17px;letter-spacing:3px;margin-bottom:4px}
.velxo-aa-msg-stars span{display:inline-block;opacity:0;transform:scale(0) rotate(-30deg);transition:opacity 0.3s cubic-bezier(0.34,1.56,0.64,1),transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}
.velxo-aa-msg-stars span.velxo-aa-show{opacity:1;transform:scale(1) rotate(0deg)}

.velxo-aa-typing{align-self:flex-start;display:flex;gap:5px;padding:12px 16px;background:#22283a;border-radius:17px;border-bottom-left-radius:5px;opacity:0;transform:scale(0.9);transition:opacity 0.25s ease,transform 0.25s ease}
.velxo-aa-typing.velxo-aa-show{opacity:1;transform:scale(1)}
.velxo-aa-typing span{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,0.55);animation:velxo-aa-bounce 1s ease-in-out infinite}
.velxo-aa-typing span:nth-child(2){animation-delay:0.15s}
.velxo-aa-typing span:nth-child(3){animation-delay:0.3s}
@keyframes velxo-aa-bounce{0%,60%,100%{transform:translateY(0);opacity:0.5}30%{transform:translateY(-5px);opacity:1}}

/* Badges are inline, in the chat flow — never a floating overlay that
   could sit on top of the conversation. */
.velxo-aa-badge-inline{align-self:center;display:inline-flex;align-items:center;gap:6px;background:#16a34a;color:#fff;font:700 13px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:10px 20px;border-radius:999px;box-shadow:0 10px 26px -6px rgba(22,163,74,0.55);white-space:nowrap;margin:4px 0;opacity:0;transform:scale(0.6) translateY(6px);transition:opacity 0.4s cubic-bezier(0.34,1.56,0.64,1),transform 0.4s cubic-bezier(0.34,1.56,0.64,1)}
.velxo-aa-badge-inline.velxo-aa-show{opacity:1;transform:scale(1) translateY(0)}

/* end state */
.velxo-aa-end{text-align:center;max-width:640px;margin:0 auto;opacity:0;max-height:0;overflow:hidden;transition:opacity 0.5s ease}
.velxo-aa-end.velxo-aa-show{opacity:1;max-height:420px;margin-top:40px}
.velxo-aa-end h3{font-family:'Bebas Neue',sans-serif;font-size:clamp(34px,6vw,64px);color:var(--white);line-height:1.08;margin:0 0 26px;letter-spacing:0.01em;text-shadow:0 0 60px var(--orange-glow-strong,rgba(255,255,255,0.15));opacity:0;transform:translateY(14px) scale(0.96);transition:opacity 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s,transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s}
.velxo-aa-end.velxo-aa-show h3{opacity:1;transform:translateY(0) scale(1)}
.velxo-aa-replay{display:inline-flex;align-items:center;gap:8px;background:transparent;border:1px solid var(--border);color:var(--text-mid);font:600 13px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:12px 22px;border-radius:999px;cursor:pointer;transition:border-color 0.2s ease,color 0.2s ease}
.velxo-aa-replay:hover{border-color:var(--orange);color:var(--orange)}

.velxo-aa-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;max-width:1100px;margin:56px auto 0;opacity:0;transform:translateY(12px);transition:opacity 0.6s ease,transform 0.6s ease}
.velxo-aa-cards.velxo-aa-show{opacity:1;transform:translateY(0)}
.velxo-aa-card{background:var(--black-light);border:1px solid var(--border);border-radius:14px;padding:32px 26px;text-align:left;display:flex;flex-direction:column;gap:10px;transition:transform 0.25s ease,border-color 0.25s ease}
.velxo-aa-card:hover{transform:translateY(-4px);border-color:var(--orange)}
.velxo-aa-card h4{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:0.03em;color:var(--white);margin:0}
.velxo-aa-card p{font:400 14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text-mid);margin:0}

@media (max-width:640px){
  #velxo-aa-section{padding:72px 6% 88px}
  .velxo-aa-phone{width:230px;height:468px;border-radius:38px}
  .velxo-aa-phone-inner{border-radius:28px}
  .velxo-aa-cards{grid-template-columns:1fr;margin-top:40px}
  .velxo-aa-msg{font-size:13.5px}
}

@media (prefers-reduced-motion: reduce){
  .velxo-aa-ring{animation:none;display:none}
  .velxo-aa-typing span{animation:none}
  .velxo-aa-phone.velxo-aa-ringing{animation:none}
  .velxo-aa-working-icon{animation:none}
}
`;

function cardHtml(card: Card): string {
  return `
<div class="velxo-aa-card">
  <h4>${card.title}</h4>
  <p>${card.subtitle}</p>
</div>`;
}

const MARKUP = `
<section id="velxo-aa-section">
  <div class="velxo-aa-header">
    <div class="velxo-aa-eyebrow">🤖 AI Automations</div>
    <h2>Your website is only the beginning.</h2>
    <p>See how Velxo automatically handles missed calls, books jobs and requests Google reviews.</p>
  </div>

  <div class="velxo-aa-stage">
    <div class="velxo-aa-phone-wrap" id="velxo-aa-phone-wrap">
      <div class="velxo-aa-phone" id="velxo-aa-phone">
        <div class="velxo-aa-phone-inner">
          <div class="velxo-aa-phone-notch"></div>

          <div class="velxo-aa-screen velxo-aa-screen-working velxo-aa-active" id="velxo-aa-screen-working">
            <div class="velxo-aa-working-icon">🔧</div>
            <div class="velxo-aa-working-caption" id="velxo-aa-working-caption">Under the sink — can't reach his phone.</div>
          </div>

          <div class="velxo-aa-screen velxo-aa-screen-call" id="velxo-aa-screen-call">
            <div class="velxo-aa-call-avatar">
              <div class="velxo-aa-ring-wrap" id="velxo-aa-ring-wrap">
                <span class="velxo-aa-ring"></span>
                <span class="velxo-aa-ring"></span>
                <span class="velxo-aa-ring"></span>
              </div>
              👤
            </div>
            <div class="velxo-aa-call-name">John Mitchell</div>
            <div class="velxo-aa-call-status" id="velxo-aa-call-status">Incoming call…</div>
            <div class="velxo-aa-missed" id="velxo-aa-missed">Missed Call</div>
          </div>

          <div class="velxo-aa-screen velxo-aa-screen-chat" id="velxo-aa-screen-chat">
            <div class="velxo-aa-chat-messages" id="velxo-aa-chat-messages"></div>
          </div>

          <div class="velxo-aa-phone-home"></div>
        </div>
      </div>
    </div>

    <div class="velxo-aa-end" id="velxo-aa-end">
      <h3>While you're fixing today's jobs…<br>Velxo is booking tomorrow's.</h3>
      <button type="button" class="velxo-aa-replay" id="velxo-aa-replay">↻ Replay Demo</button>
    </div>
  </div>

  <div class="velxo-aa-cards" id="velxo-aa-cards">
    ${CARDS.map(cardHtml).join("")}
  </div>
</section>
`;

/**
 * The whole narrative is one scripted async sequence (sleep + DOM
 * mutation between beats) rather than four independent demos — there is
 * exactly one autoplay trigger and one Replay control for the entire
 * story, never a per-card modal.
 */
const SCRIPT = `
<script id="velxo-ext-ai-automations">
(function(){
  var section = document.getElementById('velxo-aa-section');
  var phoneWrap = document.getElementById('velxo-aa-phone-wrap');
  var phone = document.getElementById('velxo-aa-phone');
  var screenWorking = document.getElementById('velxo-aa-screen-working');
  var workingCaption = document.getElementById('velxo-aa-working-caption');
  var screenCall = document.getElementById('velxo-aa-screen-call');
  var screenChat = document.getElementById('velxo-aa-screen-chat');
  var ringWrap = document.getElementById('velxo-aa-ring-wrap');
  var callStatus = document.getElementById('velxo-aa-call-status');
  var missedEl = document.getElementById('velxo-aa-missed');
  var messagesEl = document.getElementById('velxo-aa-chat-messages');
  var endEl = document.getElementById('velxo-aa-end');
  var cardsEl = document.getElementById('velxo-aa-cards');
  var replayBtn = document.getElementById('velxo-aa-replay');
  if (!section || !phoneWrap || !phone || !screenWorking || !screenCall || !screenChat) return;

  var WORKING_CAPTION_OPEN = "Under the sink — can't reach his phone.";
  var WORKING_CAPTION_CUTBACK = "Still under the sink. Booked without lifting a finger.";

  function showScreen(el){
    [screenWorking, screenCall, screenChat].forEach(function(s){ s.classList.remove('velxo-aa-active'); });
    el.classList.add('velxo-aa-active');
  }

  function scrollToBottom(){
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var played = false;
  var running = false;

  function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

  function addMessage(text, who){
    return new Promise(function(resolve){
      var typing = document.createElement('div');
      typing.className = 'velxo-aa-typing';
      typing.innerHTML = '<span></span><span></span><span></span>';
      messagesEl.appendChild(typing);
      scrollToBottom();
      requestAnimationFrame(function(){ typing.classList.add('velxo-aa-show'); });

      setTimeout(function(){
        typing.remove();
        var msg = document.createElement('div');
        msg.className = 'velxo-aa-msg velxo-aa-msg-' + who;
        msg.textContent = text;
        messagesEl.appendChild(msg);
        scrollToBottom();
        requestAnimationFrame(function(){ msg.classList.add('velxo-aa-show'); scrollToBottom(); });
        resolve();
      }, 550);
    });
  }

  /** The review-confirmation bubble: five stars pop in one at a time, then "Done!" follows. */
  function addStarMessage(){
    return new Promise(function(resolve){
      var typing = document.createElement('div');
      typing.className = 'velxo-aa-typing';
      typing.innerHTML = '<span></span><span></span><span></span>';
      messagesEl.appendChild(typing);
      scrollToBottom();
      requestAnimationFrame(function(){ typing.classList.add('velxo-aa-show'); });

      setTimeout(function(){
        typing.remove();
        var msg = document.createElement('div');
        msg.className = 'velxo-aa-msg velxo-aa-msg-customer';
        var starsRow = document.createElement('span');
        starsRow.className = 'velxo-aa-msg-stars';
        for (var i = 0; i < 5; i++) {
          var star = document.createElement('span');
          star.textContent = '⭐';
          starsRow.appendChild(star);
        }
        msg.appendChild(starsRow);
        msg.appendChild(document.createTextNode('Done!'));
        messagesEl.appendChild(msg);
        scrollToBottom();
        requestAnimationFrame(function(){ msg.classList.add('velxo-aa-show'); });

        var stars = starsRow.querySelectorAll('span');
        stars.forEach(function(star, i){
          setTimeout(function(){ star.classList.add('velxo-aa-show'); }, 120 + i * 90);
        });
        setTimeout(resolve, 120 + stars.length * 90 + 150);
      }, 550);
    });
  }

  /** Inline, in the chat flow — this can never sit on top of the conversation. */
  function showBadge(text){
    var badge = document.createElement('div');
    badge.className = 'velxo-aa-badge-inline';
    badge.textContent = text;
    messagesEl.appendChild(badge);
    scrollToBottom();
    requestAnimationFrame(function(){ badge.classList.add('velxo-aa-show'); scrollToBottom(); });
    return sleep(1100);
  }

  function resetStage(){
    showScreen(screenWorking);
    workingCaption.textContent = WORKING_CAPTION_OPEN;
    phone.classList.remove('velxo-aa-ringing');
    ringWrap.classList.remove('velxo-aa-hide');
    callStatus.classList.remove('velxo-aa-hide');
    callStatus.textContent = 'Incoming call…';
    missedEl.classList.remove('velxo-aa-show');
    messagesEl.innerHTML = '';
    phoneWrap.classList.remove('velxo-aa-fading', 'velxo-aa-gone');
    endEl.classList.remove('velxo-aa-show');
    cardsEl.classList.remove('velxo-aa-show');
  }

  async function playSequence(){
    if (running) return;
    running = true;
    resetStage();

    if (reduceMotion) {
      // Skip straight to the resting state — no scripted animation.
      phoneWrap.classList.add('velxo-aa-gone');
      endEl.classList.add('velxo-aa-show');
      cardsEl.classList.add('velxo-aa-show');
      running = false;
      return;
    }

    // Scene 1 — he's busy on the tools, physically can't get to his phone (~1.8s)
    await sleep(1800);

    // Scene 2 — the phone rings (hard) and goes to missed (~2s)
    showScreen(screenCall);
    if (!reduceMotion) phone.classList.add('velxo-aa-ringing');
    await sleep(1300);
    phone.classList.remove('velxo-aa-ringing');
    ringWrap.classList.add('velxo-aa-hide');
    callStatus.classList.add('velxo-aa-hide');
    missedEl.classList.add('velxo-aa-show');
    await sleep(700);

    // Scene 3 — AI takes over, customer explains the problem (~3s)
    showScreen(screenChat);
    await addMessage('Hi 👋 Sorry we missed your call. How can we help today?', 'ai');
    await sleep(700);
    await addMessage('My hot water system stopped working.', 'customer');
    await sleep(700);

    // Scene 4 — booked, automatically. Badge only appears once the
    // customer has actually confirmed, and inline in the thread so it
    // never covers a message.
    await addMessage('We have availability today at 3:30.', 'ai');
    await sleep(500);
    await addMessage('Perfect.', 'customer');
    await sleep(300);
    await showBadge('✓ Job Booked');

    // Scene 5 — the emotional beat: cut back to him, still on the tools,
    // never having stopped — the booking happened without him. The chat
    // thread itself isn't cleared, so returning to it below continues the
    // same conversation rather than starting a new one.
    await sleep(300);
    workingCaption.textContent = WORKING_CAPTION_CUTBACK;
    showScreen(screenWorking);
    await sleep(1600);

    // Scene 6 — after the job's done, the review request (~3.5s)
    showScreen(screenChat);
    await sleep(300);
    await addMessage('Thanks for choosing Velxo Plumbing. Would you mind leaving us a Google review?', 'ai');
    await sleep(600);
    await addStarMessage();
    await sleep(300);
    await showBadge('+1 Google Review');
    await sleep(500);

    // Scene 7 — fade the phone, reveal the headline and cards
    phoneWrap.classList.add('velxo-aa-fading');
    await sleep(600);
    phoneWrap.classList.add('velxo-aa-gone');
    endEl.classList.add('velxo-aa-show');
    cardsEl.classList.add('velxo-aa-show');

    running = false;
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', function(){ playSequence(); });
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting && !played) {
          played = true;
          playSequence();
          observer.disconnect();
        }
      });
    }, { threshold: 0.4 });
    observer.observe(section);
  } else {
    playSequence();
  }
})();
</script>
`;

export function buildAiAutomationsSection(): string {
  return `
<style id="velxo-ext-ai-automations-style">
${STYLE}
</style>
${MARKUP}
${SCRIPT}
`;
}
