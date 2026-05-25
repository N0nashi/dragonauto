import React, { useState, useEffect, useRef, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLang } from "../context/LangContext";

const API = import.meta.env.VITE_API_URL;

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ApplicationComments({ applicationId, authorRole }) {
  const { refreshUnreadCount } = useContext(AuthContext);
  const { lang } = useLang();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);
  const token = localStorage.getItem("token");

  const load = async () => {
    try {
      const r = await fetch(`${API}/api/applications/${applicationId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return;
      setComments(await r.json());
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  const markRead = async () => {
    try {
      await fetch(`${API}/api/notifications/mark-read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ application_id: applicationId }),
      });
      refreshUnreadCount?.();
    } catch { /* silently fail */ }
  };

  useEffect(() => {
    load();
    if (authorRole === "user") markRead();
  }, [applicationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const r = await fetch(`${API}/api/applications/${applicationId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text.trim() }),
      });
      if (!r.ok) return;
      const d = await r.json();
      setComments(prev => [...prev, d.comment]);
      setText("");
    } catch { /* silently fail */ }
    finally { setSending(false); }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const placeholder = lang === "en" ? "Write a message…" : "Написать сообщение…";
  const sendLabel   = lang === "en" ? "Send" : "Отправить";
  const emptyLabel  = lang === "en" ? "No messages yet" : "Сообщений пока нет";

  return (
    <div className="mt-4 border-t border-charcoal/10 dark:border-cream/10 pt-4">
<div className="flex flex-col gap-2 max-h-56 overflow-y-auto mb-3 pr-1">
        {loading && (
          <p className="font-mont text-xs text-charcoal/30 dark:text-cream/30 text-center animate-pulse py-4">
            {lang === "en" ? "Loading…" : "Загрузка…"}
          </p>
        )}
        {!loading && comments.length === 0 && (
          <p className="font-mont text-xs text-charcoal/30 dark:text-cream/30 text-center py-4">{emptyLabel}</p>
        )}
        {comments.map(c => {
          const isAdmin = c.author_role === "admin";
          return (
            <div key={c.id} className={`flex flex-col gap-0.5 max-w-[85%] ${isAdmin ? "self-end items-end" : "self-start items-start"}`}>
              <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40 px-1">
                {c.author_name}
              </span>
              <div className={`font-mont text-sm px-4 py-2.5 rounded-2xl whitespace-pre-line leading-relaxed ${
                isAdmin
                  ? "bg-red-accent text-cream rounded-br-sm"
                  : "bg-charcoal/8 dark:bg-cream/8 text-charcoal dark:text-cream rounded-bl-sm"
              }`}>
                {c.message}
              </div>
              <span className="font-mont text-[10px] text-charcoal/25 dark:text-cream/25 px-1">
                {formatTime(c.created_at)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

<div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={sending}
          className="flex-1 font-mont text-sm bg-charcoal/5 dark:bg-cream/5 border border-charcoal/10 dark:border-cream/10 rounded-xl px-4 py-2.5 text-charcoal dark:text-cream placeholder:text-charcoal/30 dark:placeholder:text-cream/30 focus:outline-none focus:border-red-accent/40 transition-colors disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="font-mont font-black text-[10px] tracking-widest uppercase px-4 py-2.5 bg-red-accent text-cream rounded-xl hover:opacity-90 transition disabled:opacity-40 shrink-0"
        >
          {sendLabel}
        </button>
      </div>
    </div>
  );
}
