import React from "react";
import { useLang } from "../context/LangContext";

const STEPS = ["в обработке", "в работе", "предложение", "согласована", "выполнена"];

export default function StatusStepper({ status }) {
  const { t } = useLang();
  const tr = t.requests?.statuses ?? {};

  const isCancelled = status === "отменена";
  const currentIdx  = STEPS.indexOf(status);
  const activeIdx   = isCancelled
    ? Math.max(STEPS.findIndex((_, i) => i < STEPS.length), 0)
    : currentIdx;

  const labels = {
    "в обработке": tr["в обработке"] ?? "В обработке",
    "в работе":    tr["в работе"]    ?? "В работе",
    "предложение": tr["предложение"] ?? "Предложение",
    "согласована": tr["согласована"] ?? "Согласована",
    "выполнена":   tr["выполнена"]   ?? "Выполнена",
  };

  return (
    <div className="flex items-start gap-0 w-full mt-3 mb-1">
      {STEPS.map((step, idx) => {
        const done    = !isCancelled && currentIdx > idx;
        const active  = !isCancelled && currentIdx === idx;
        const cancelled = isCancelled && idx === currentIdx - 1;
        const last    = idx === STEPS.length - 1;

        const dotCls = done
          ? "bg-red-accent border-red-accent"
          : active
          ? "border-red-accent bg-cream dark:bg-charcoal ring-2 ring-red-accent ring-offset-1 ring-offset-cream dark:ring-offset-charcoal"
          : cancelled
          ? "bg-charcoal/20 dark:bg-cream/20 border-charcoal/20 dark:border-cream/20"
          : "bg-cream dark:bg-charcoal border-charcoal/20 dark:border-cream/20";

        const lineCls = done
          ? "bg-red-accent"
          : "bg-charcoal/15 dark:bg-cream/15";

        return (
          <div key={step} className="flex items-start flex-1 min-w-0">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 shrink-0 transition-all ${dotCls} ${cancelled ? "relative" : ""}`}>
                {cancelled && (
                  <svg className="absolute inset-0 w-full h-full text-charcoal/90 dark:text-cream/90" viewBox="0 0 12 12" fill="none">
                    <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
              </div>
              <span className={`font-mont text-[9px] tracking-wider mt-1 text-center leading-tight w-12 truncate ${
                active ? "text-red-accent font-bold" : "text-charcoal/90 dark:text-cream/90"
              }`}>
                {labels[step]}
              </span>
            </div>
            {!last && (
              <div className={`flex-1 h-0.5 mt-1.5 mx-0.5 transition-all ${lineCls}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
