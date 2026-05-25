import React, { useState } from "react";
import { useLang } from "../context/LangContext";
import { useInView } from "../hooks/useInView";

export default function FAQBlock() {
  const { t } = useLang();
  const [open, setOpen] = useState(null);
  const [ref, inView] = useInView(0.1);

  const toggle = (i) => setOpen((prev) => (prev === i ? null : i));

  return (
    <section ref={ref} className="bg-cream dark:bg-charcoal py-20 px-8 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">

        {/* ── Title ── */}
        <div className={`mb-10 ${inView ? "anim-fade-up" : "opacity-0"}`}>
          <h2 className="font-mont font-bold text-charcoal dark:text-cream mb-4 text-center" style={{ fontSize: 24 }}>
            {t.faq.title}
          </h2>
          <div className="w-full h-px bg-charcoal/20 dark:bg-cream/20" />
        </div>

        {/* ── Items ── */}
        <div className="flex flex-col gap-3">
          {t.faq.items.map((item, i) => (
            <div
              key={i}
              className={`border border-charcoal/15 dark:border-cream/15 rounded-xl overflow-hidden transition-colors duration-200 ${
                inView ? "anim-fade-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${0.1 + i * 0.07}s` }}
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left group"
              >
                {/* chevron */}
                <svg
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  className={`shrink-0 text-charcoal/30 dark:text-cream/30 transition-transform duration-300 ${open === i ? "rotate-90 text-red-accent" : ""}`}
                >
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {/* Question */}
                <span className="font-mont font-bold text-charcoal dark:text-cream flex-1" style={{ fontSize: 17 }}>
                  {item.q}
                </span>
              </button>

              {/* Answer — smooth expand via CSS grid */}
              <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 pl-[44px] font-mont text-sm text-charcoal/55 dark:text-cream/55 leading-relaxed">
                    {item.a}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
