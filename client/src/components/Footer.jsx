import React from "react";
import { useLang } from "../context/LangContext";

export default function Footer() {
  const { t } = useLang();
  const f = t.footer;

  return (
    <footer className="bg-charcoal transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-8 md:px-20 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex flex-col leading-snug">
          <span className="font-mont text-sm text-cream/80">{f.company}</span>
          <span className="font-mont text-xs text-cream/35">{f.legal}</span>
        </div>
        <div className="flex flex-col items-start sm:items-end leading-snug">
          <a href={`tel:${f.phone.replace(/\s/g, "")}`}
            className="font-mont text-sm text-cream/80 hover:text-cream transition-colors duration-200">
            {f.phone}
          </a>
          <span className="font-mont text-xs text-cream/35">{f.address}</span>
        </div>
      </div>
    </footer>
  );
}
