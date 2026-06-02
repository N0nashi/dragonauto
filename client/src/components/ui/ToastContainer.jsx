import React, { useState, useEffect, useRef, useCallback } from "react";
import { _setListener } from "../../utils/toast";

const DURATION = 4000; // ms before auto-dismiss

/* ── Per-type config ──────────────────────────────────────────── */
const TYPES = {
  success: {
    color: "#16a34a",
    bg:    "#16a34a1a",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4"
           strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2.5,8.5 6,12 13.5,4" />
      </svg>
    ),
  },
  error: {
    color: "#8B1A1A",
    bg:    "#8B1A1A1a",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4"
           strokeLinecap="round">
        <line x1="3.5" y1="3.5" x2="12.5" y2="12.5"/>
        <line x1="12.5" y1="3.5" x2="3.5" y2="12.5"/>
      </svg>
    ),
  },
  info: {
    color: "#2563eb",
    bg:    "#2563eb1a",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor">
        <circle cx="8" cy="4.8" r="1.3"/>
        <rect x="7" y="7.2" width="2" height="5.2" rx="1"/>
      </svg>
    ),
  },
  warning: {
    color: "#b45309",
    bg:    "#b453091a",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor">
        <rect x="7" y="3.5" width="2" height="5.8" rx="1"/>
        <circle cx="8" cy="12.2" r="1.3"/>
      </svg>
    ),
  },
  default: {
    color: "#2D2D2D",
    bg:    "#2D2D2D14",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor">
        <circle cx="8" cy="8" r="2.8"/>
      </svg>
    ),
  },
};

/* ── Single toast card ────────────────────────────────────────── */
function ToastItem({ data, onRemove }) {
  const [phase, setPhase] = useState("enter"); // enter | idle | exit
  const timerRef = useRef(null);
  const cfg = TYPES[data.type] ?? TYPES.default;

  const dismiss = useCallback(() => {
    if (phase === "exit") return;
    setPhase("exit");
    clearTimeout(timerRef.current);
    setTimeout(() => onRemove(data.id), 320);
  }, [phase, data.id, onRemove]);

  useEffect(() => {
    // tiny delay so browser paints the "enter" transform first
    const raf = requestAnimationFrame(() => setPhase("idle"));
    timerRef.current = setTimeout(dismiss, DURATION);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const style = {
    transform:  phase === "idle" ? "translateX(0) scale(1)"   : "translateX(22px) scale(0.97)",
    opacity:    phase === "idle" ? 1 : 0,
    transition: phase === "exit"
      ? "transform 0.28s ease-in, opacity 0.22s ease-in"
      : "transform 0.42s cubic-bezier(0.16,1,0.3,1), opacity 0.32s ease",
  };

  return (
    <div
      role="alert"
      style={style}
      className="relative w-80 rounded-xl overflow-hidden cursor-pointer select-none
        bg-[#FFFFF0] dark:bg-[#252525]
        border border-black/[0.07] dark:border-white/[0.08]
        shadow-[0_6px_28px_rgba(0,0,0,0.10)] dark:shadow-[0_6px_28px_rgba(0,0,0,0.50)]"
      onClick={dismiss}
    >
      {/* Left accent stripe */}
      <div
        className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl"
        style={{ backgroundColor: cfg.color }}
      />

      {/* Content row */}
      <div className="flex items-center gap-3 pl-5 pr-9 py-[13px]">
        {/* Icon bubble */}
        <div
          className="shrink-0 w-[26px] h-[26px] rounded-full flex items-center justify-center p-[5px]"
          style={{ backgroundColor: cfg.bg, color: cfg.color }}
        >
          {cfg.icon}
        </div>

        {/* Message */}
        <p className="font-mont text-[12.5px] font-semibold leading-snug tracking-tight text-charcoal dark:text-cream">
          {data.message}
        </p>
      </div>

      {/* Close × */}
      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        aria-label="Закрыть"
        className="absolute top-2.5 right-3 leading-none text-[16px] font-thin
          text-charcoal/90 dark:text-cream/90
          hover:text-charcoal dark:hover:text-cream transition-colors duration-150"
      >
        ×
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-[3px] right-0 h-[2px] bg-black/[0.05] dark:bg-white/[0.06]">
        <div
          className="h-full"
          style={{
            backgroundColor: cfg.color,
            opacity: 0.55,
            animation: `toast-progress ${DURATION}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

/* ── Container — rendered once in App.jsx ─────────────────────── */
export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _setListener((t) =>
      setToasts((prev) => (prev.length >= 5 ? [...prev.slice(1), t] : [...prev, t]))
    );
    return () => _setListener(null);
  }, []);

  const remove = useCallback(
    (id) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    []
  );

  if (!toasts.length) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem data={t} onRemove={remove} />
        </div>
      ))}
    </div>
  );
}
