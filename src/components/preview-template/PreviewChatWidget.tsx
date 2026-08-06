"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Ported from the reference project's own fake chat widget
 * (Demo plumber site/hts-plumbing/output/index.html) — same floating
 * bubble, same panel layout (header/avatar/status dot, message list,
 * input row), same open/close toggle, same "type a message -> canned
 * reply after ~900ms" behaviour. Nothing here calls any real API —
 * every reply is hardcoded client-side, exactly like the source.
 *
 * The one deliberate change: the source hardcoded a specific orange
 * theme (#FF6B00 etc.) for one prospect. Colours here use this page's
 * existing --accent/--glass variables instead, so the same widget works
 * correctly across all six brand colour schemes rather than just one.
 */
export function PreviewChatWidget({
  businessName,
  suburb,
  primaryService,
  phone,
}: {
  businessName: string;
  suburb: string;
  primaryService: string;
  phone: string;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<{ id: number; role: "business" | "visitor"; text: string }[]>(
    [],
  );
  const messagesRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const greeting1 = `👋 Hi! I'm the ${businessName} AI Assistant. Need a hand with ${primaryService.toLowerCase()} in ${suburb}?`;
  const greeting2 = "I'm available 24/7 for emergencies. What can I help you with today?";

  const handleSend = () => {
    const value = inputValue.trim();
    if (!value) return;

    setMessages((prev) => [...prev, { id: nextId.current++, role: "visitor", text: value }]);
    setInputValue("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current++,
          role: "business",
          text: `Thanks! I'll get back to you shortly. For urgent jobs call ${phone} directly.`,
        },
      ]);
    }, 900);
  };

  return (
    <div className="chat-widget">
      <div className={`chat-box${open ? " open" : ""}`}>
        <div className="chat-header">
          <div className="chat-avatar">🔧</div>
          <div className="chat-header-info">
            <h4>{businessName}</h4>
            <p>Usually replies in minutes</p>
          </div>
          <div className="chat-online" />
        </div>

        <div className="chat-messages" ref={messagesRef}>
          <div className="chat-msg">{greeting1}</div>
          <div className="chat-msg">{greeting2}</div>
          {messages.map((m) => (
            <div key={m.id} className={m.role === "visitor" ? "chat-reply" : "chat-msg"}>
              {m.text}
            </div>
          ))}
        </div>

        <div className="chat-input-row">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <button type="button" className="chat-send" onClick={handleSend} aria-label="Send message">
            ➤
          </button>
        </div>
      </div>

      <button
        type="button"
        className="chat-bubble"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        <svg viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  );
}
