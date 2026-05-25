import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";

export default function MainFrame1() {
  const { t, lang } = useLang();
  const heroSrc = lang === "en" ? "/hero-text-en.svg" : "/hero-text.svg";

  const Buttons = ({ className = "" }) => (
    <div className={`flex flex-col gap-3 w-[220px] ${className}`} style={{ animationFillMode: "both" }}>
      <Link
        to="/create-request"
        className="bg-red-accent text-cream border-2 border-red-accent h-[44px] flex items-center justify-center text-base font-mont font-black tracking-normal rounded-md hover:opacity-90 transition"
      >
        {t.hero.order}
      </Link>
      <Link
        to="/catalog"
        className="bg-cream dark:bg-charcoal border-2 border-charcoal dark:border-cream text-charcoal dark:text-cream h-[44px] flex items-center justify-center text-base font-mont font-black tracking-normal rounded-md hover:bg-charcoal hover:text-cream dark:hover:bg-cream dark:hover:text-charcoal transition"
      >
        {t.hero.catalog}
      </Link>
    </div>
  );

  return (
    <section className="min-h-[calc(100vh-64px)] bg-cream dark:bg-charcoal flex items-center justify-center px-4 md:px-8 overflow-hidden transition-colors duration-300">

      {/* ── Desktop layout ── */}
      <div className="hidden md:flex flex-row items-center gap-6 w-full max-w-6xl">
        <div className="flex flex-col items-center gap-8 shrink-0">
          <img src={heroSrc} alt={t.hero.title}
            className="w-72 xl:w-96 dark:invert anim-fade-left" />
          <Buttons className="anim-fade-up anim-d3" />
        </div>
        <div className="flex-1 min-w-0 anim-fade-right anim-d2">
          <img src="/map.svg" alt="Asia map" className="w-full max-w-[740px] opacity-90 dark:invert" />
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="flex md:hidden flex-col items-center gap-6 w-full">
        <img src={heroSrc} alt={t.hero.title}
          className="w-3/4 max-w-[260px] dark:invert anim-fade-left" />
        <img src="/map.svg" alt="Asia map"
          className="w-full max-w-[380px] opacity-90 dark:invert anim-fade-right anim-d2" />
        <Buttons className="anim-fade-up anim-d4" />
      </div>

    </section>
  );
}
