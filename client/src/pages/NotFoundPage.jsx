import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";

export default function NotFoundPage() {
  const { t } = useLang();

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal flex items-center justify-center px-6 transition-colors duration-300">
      <div className="flex flex-col items-center text-center max-w-md">

        {/* Big 404 */}
        <p className="font-kalissa text-[10rem] leading-none text-charcoal/6 dark:text-cream/6 select-none">
          404
        </p>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-accent/10 flex items-center justify-center -mt-10 mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
            className="text-red-accent">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <h1 className="font-mont font-black text-2xl text-charcoal dark:text-cream tracking-tight mb-3">
          {t.notFound?.title ?? "Страница не найдена"}
        </h1>
        <p className="font-mont text-sm text-charcoal/90 dark:text-cream/90 leading-relaxed mb-8">
          {t.notFound?.subtitle ?? "Возможно, она была удалена или адрес введён неверно."}
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/"
            className="font-mont font-black text-xs tracking-widest uppercase px-6 py-3 bg-red-accent text-cream rounded-xl hover:opacity-85 transition-opacity duration-200"
          >
            {t.notFound?.home ?? "На главную"}
          </Link>
          <Link
            to="/catalog"
            className="font-mont font-black text-xs tracking-widest uppercase px-6 py-3 border-2 border-charcoal/20 dark:border-cream/20 text-charcoal dark:text-cream rounded-xl hover:border-red-accent hover:text-red-accent transition-all duration-200"
          >
            {t.notFound?.catalog ?? "Каталог"}
          </Link>
        </div>

      </div>
    </div>
  );
}
