import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLang } from "../context/LangContext";

const API = import.meta.env.VITE_API_URL;
const SESSION_KEY = "da_chat_session";

const QUICK_REPLIES = {
  ru: ["Доставка", "Как оформить заказ", "Цены", "Запчасти", "Контакты", "Позвать менеджера"],
  en: ["Delivery", "How to order", "Prices", "Spare Parts", "Contacts", "Call manager"],
};

const QUICK_REPLY_MAP = {
  "Доставка": "Расскажи про доставку",
  "How to order": "How to order a car?",
  "Как оформить заказ": "Как оформить заказ?",
  "Delivery": "Tell me about delivery",
  "Цены": "Сколько стоит?",
  "Prices": "How much does it cost?",
  "Запчасти": "Расскажи про запчасти",
  "Spare Parts": "Tell me about spare parts",
  "Контакты": "Контакты",
  "Contacts": "Contacts",
  "Позвать менеджера": "Позвать менеджера",
  "Call manager": "I want to speak to a manager",
};

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ msg, lang }) {
  const isUser  = msg.sender === "user";
  const isAdmin = msg.sender === "admin";
  const isBot   = msg.sender === "bot";

  const bubbleCls = isUser
    ? "bg-red-accent text-cream self-end rounded-2xl rounded-br-sm"
    : isAdmin
    ? "bg-charcoal dark:bg-cream text-cream dark:text-charcoal self-start rounded-2xl rounded-bl-sm"
    : "bg-charcoal/8 dark:bg-cream/8 text-charcoal dark:text-cream self-start rounded-2xl rounded-bl-sm";

  return (
    <div className={`flex flex-col gap-0.5 max-w-[82%] ${isUser ? "items-end self-end" : "items-start self-start"}`}>
      {isAdmin && (
        <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/90 dark:text-cream/90 px-1">
          {lang === "en" ? "Manager" : "Менеджер"}
        </span>
      )}
      <div className={`font-mont text-sm px-4 py-2.5 leading-relaxed whitespace-pre-line ${bubbleCls}`}>
        {msg.message}
      </div>
      <span className="font-mont text-[10px] text-charcoal/90 dark:text-cream/90 px-1">
        {formatTime(msg.created_at)}
      </span>
    </div>
  );
}

export default function ChatWidget() {
  const { lang } = useLang();
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState("");
  const [sessionToken, setSessionToken] = useState(null);
  const [sessionId, setSessionId]   = useState(null);
  const [status, setStatus]   = useState("bot");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [unread, setUnread]   = useState(0);

  const resetSession = useCallback(async () => {
    const oldToken = localStorage.getItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    setMessages([]);
    setStatus("bot");
    setSessionToken(null);
    setSessionId(null);
    lastIdRef.current = 0;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(`${API}/api/chat/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ sessionToken: oldToken, lang, forceNew: true }),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      localStorage.setItem(SESSION_KEY, data.sessionToken);
      setSessionToken(data.sessionToken);
      setSessionId(data.sessionId);
      setStatus(data.status);
      setMessages(data.messages);
      lastIdRef.current = data.messages[data.messages.length - 1]?.id ?? 0;
    } catch {}
    finally { setLoading(false); }
  }, [lang]);

  const bottomRef  = useRef(null);
  const pollRef    = useRef(null);
  const lastIdRef  = useRef(0);
  const inputRef   = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const startSession = useCallback(async () => {
    if (started) return;
    setStarted(true);
    setLoading(true);
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      const token = localStorage.getItem("token");
      const r = await fetch(`${API}/api/chat/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sessionToken: stored, lang }),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      localStorage.setItem(SESSION_KEY, data.sessionToken);
      setSessionToken(data.sessionToken);
      setSessionId(data.sessionId);
      setStatus(data.status);
      setMessages(data.messages);
      lastIdRef.current = data.messages[data.messages.length - 1]?.id ?? 0;
    } catch {
    } finally {
      setLoading(false);
    }
  }, [started]);

  useEffect(() => {
    if (open) {
      startSession();
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !sessionToken) return;
    const poll = async () => {
      try {
        const r = await fetch(
          `${API}/api/chat/poll?sessionToken=${sessionToken}&after=${lastIdRef.current}`
        );
        if (!r.ok) return;
        const data = await r.json();
        if (data.messages.length > 0) {
          lastIdRef.current = data.messages[data.messages.length - 1].id;
          setMessages(prev => [...prev, ...data.messages]);
          if (!open) setUnread(n => n + data.messages.filter(m => m.sender !== "user").length);
        }
        setStatus(data.status);
      } catch {}
    };
    pollRef.current = setInterval(poll, 4000);
    return () => clearInterval(pollRef.current);
  }, [open, sessionToken]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || !sessionToken) return;
    setInput("");
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, message: msg, lang }),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setMessages(data.messages);
      setStatus(data.status);
      lastIdRef.current = data.messages[data.messages.length - 1]?.id ?? 0;
    } catch {}
    finally { setLoading(false); }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const quickReplies = QUICK_REPLIES[lang] ?? QUICK_REPLIES.ru;

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-red-accent shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
        aria-label="Chat"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-charcoal dark:bg-cream text-cream dark:text-charcoal rounded-full font-mont font-black text-[10px] flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] rounded-2xl shadow-2xl border border-charcoal/10 dark:border-cream/10 bg-cream dark:bg-charcoal flex flex-col overflow-hidden"
          style={{ height: "520px" }}>

          <div className="bg-red-accent px-5 py-4 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mont font-black text-sm text-white leading-tight">DragonAuto</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="font-mont text-[11px] text-white/70">
                  {status === "active"
                    ? (lang === "en" ? "Manager connected" : "Менеджер подключился")
                    : (lang === "en" ? "Virtual assistant" : "Виртуальный помощник")}
                </p>
              </div>
            </div>
            {(status === "pending" || status === "closed" || messages.length > 1) && (
              <button
                onClick={resetSession}
                title={lang === "en" ? "New conversation" : "Новый диалог"}
                className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors shrink-0"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
                </svg>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {loading && messages.length === 0 && (
              <p className="font-mont text-xs text-charcoal/90 dark:text-cream/90 animate-pulse text-center mt-8">
                {lang === "en" ? "Loading…" : "Загрузка…"}
              </p>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} lang={lang} />
            ))}
            {loading && messages.length > 0 && (
              <div className="self-start flex gap-1 px-4 py-2.5 bg-charcoal/8 dark:bg-cream/8 rounded-2xl rounded-bl-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-charcoal/40 dark:bg-cream/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-charcoal/40 dark:bg-cream/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-charcoal/40 dark:bg-cream/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {status === "bot" && (
            <div className="px-3 py-2 border-t border-charcoal/10 dark:border-cream/10 flex gap-1.5 flex-wrap shrink-0">
              {quickReplies.map((label) => (
                <button
                  key={label}
                  onClick={() => send(QUICK_REPLY_MAP[label] ?? label)}
                  disabled={loading}
                  className="font-mont text-[11px] font-bold px-3 py-1 rounded-full border border-red-accent/50 dark:border-red-accent/70 bg-red-accent/10 dark:bg-red-accent/20 text-red-accent dark:text-red-300 hover:bg-red-accent hover:border-red-accent hover:text-cream dark:hover:text-cream transition-colors duration-150 disabled:opacity-40"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="px-3 py-3 border-t border-charcoal/10 dark:border-cream/10 flex gap-2 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={lang === "en" ? "Type a message…" : "Написать сообщение…"}
              disabled={loading || status === "closed"}
              className="flex-1 font-mont text-sm bg-charcoal/5 dark:bg-cream/5 border border-charcoal/10 dark:border-cream/10 rounded-xl px-4 py-2.5 text-charcoal dark:text-cream placeholder:text-charcoal/90 dark:placeholder:text-cream/90 focus:outline-none focus:border-red-accent/40 transition-colors disabled:opacity-50"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim() || status === "closed"}
              className="w-10 h-10 rounded-xl bg-red-accent flex items-center justify-center hover:opacity-90 transition disabled:opacity-40 shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
