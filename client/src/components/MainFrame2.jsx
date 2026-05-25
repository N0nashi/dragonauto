import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../context/LangContext";

const cars = [
  { id: 1, brand: "Toyota",  model: "Camry",    year: 2019, price: 2500000, photo_url: "/camry.webp" },
  { id: 2, brand: "Honda",   model: "Accord",   year: 2020, price: 1500000, photo_url: "/accord.webp" },
  { id: 3, brand: "Kia",     model: "Sportage", year: 2021, price: 1200000, photo_url: "/sportage.webp" },
  { id: 4, brand: "Hyundai", model: "Tucson",   year: 2020, price: 1600000, photo_url: "/tuscon.webp" },
  { id: 5, brand: "Mazda",   model: "CX-5",     year: 2022, price: 1700000, photo_url: "/cx-5.png" },
  { id: 6, brand: "Nissan",  model: "Qashqai",  year: 2018, price: 1300000, photo_url: "/qashqai.webp" },
  { id: 7, brand: "Haval",   model: "Jolion",   year: 2024, price: 2550000, photo_url: "/haval.png" },
];

const PARTS_BASE = [
  { id: 1, price: 1200, photo_url: "/фильтр.webp" },
  { id: 2, price: 3000, photo_url: "/колодки.webp" },
  { id: 3, price: 7000, photo_url: "/аккум.webp" },
  { id: 4, price: 8500, photo_url: "/фара.webp" },
  { id: 5, price: 2000, photo_url: "/свечи.webp" },
];

const CARD_W = 288; // w-72 = 288px
const GAP    = 16;  // gap-4 = 16px
const TOTAL  = cars.length + 1; // +1 for ghost card

export default function MainFrame2() {
  const { t }    = useLang();
  const navigate = useNavigate();
  const [tab, setTab]       = useState("cars");
  const [index, setIndex]   = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);
  const stripRef            = useRef(null);

  const parts = PARTS_BASE.map((p, i) => ({ ...p, name: t.catalog.partNames[i] }));
  const list = tab === "cars" ? cars : parts;

  const updateMax = () => {
    const el = stripRef.current;
    if (!el) return;
    setMaxIndex(Math.max(0, Math.round((el.scrollWidth - el.clientWidth) / (CARD_W + GAP))));
  };

  useEffect(() => {
    if (stripRef.current) stripRef.current.scrollLeft = 0;
    setIndex(0);
    requestAnimationFrame(updateMax);
  }, [tab]);

  useEffect(() => {
    window.addEventListener("resize", updateMax);
    return () => window.removeEventListener("resize", updateMax);
  }, []);

  const handleScroll = () => {
    if (!stripRef.current) return;
    setIndex(Math.round(stripRef.current.scrollLeft / (CARD_W + GAP)));
  };

  const scroll = (dir) => {
    const next = Math.max(0, Math.min(maxIndex, index + dir));
    setIndex(next);
    if (stripRef.current) {
      stripRef.current.scrollTo({ left: next * (CARD_W + GAP), behavior: "smooth" });
    }
  };

  return (
    <section className="bg-cream dark:bg-charcoal transition-colors duration-300 overflow-hidden py-16">

<div className="flex flex-col items-center gap-6 mb-10 px-8">
        <h2 className="font-mont font-black text-4xl md:text-5xl text-charcoal dark:text-cream tracking-tight text-center">
          {t.catalog.title}
        </h2>

<div className="flex gap-8">
          {["cars", "parts"].map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`font-mont text-xs tracking-widest uppercase pb-2 border-b-2 transition-all duration-200 ${
                tab === key
                  ? "border-red-accent text-charcoal dark:text-cream"
                  : "border-transparent text-charcoal/30 dark:text-cream/30 hover:text-charcoal dark:hover:text-cream"
              }`}
            >
              {key === "cars" ? t.catalog.cars : t.catalog.parts}
            </button>
          ))}
        </div>
      </div>

<div className="relative">

        {/* Left fade */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 md:w-24 z-10
          bg-gradient-to-r from-cream dark:from-charcoal to-transparent" />
        {/* Right fade */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 md:w-24 z-10
          bg-gradient-to-l from-cream dark:from-charcoal to-transparent" />

        {/* Card strip */}
        <div
          ref={stripRef}
          onScroll={handleScroll}
          className="flex gap-4 pl-8 md:pl-20 pr-8 md:pr-20 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {list.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="shrink-0 w-72 rounded-2xl bg-cream dark:bg-charcoal border border-charcoal/10 dark:border-cream/10 overflow-hidden group cursor-pointer transition-all duration-300 hover:border-charcoal/20 dark:hover:border-cream/20 hover:shadow-[0_16px_48px_rgba(47,48,50,0.12)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
              style={{ scrollSnapAlign: "start" }}
              onClick={() => navigate("/catalog")}
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden bg-charcoal/5 dark:bg-cream/5">
                <img
                  src={item.photo_url}
                  alt={item.name || `${item.brand} ${item.model}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Brand / name overlay */}
                <div className="absolute bottom-3 left-4 right-4">
                  {tab === "cars" ? (
                    <>
                      <p className="font-mont font-black text-white text-base leading-tight drop-shadow">{item.brand}</p>
                      <p className="font-mont text-white/65 text-sm">{item.model}</p>
                    </>
                  ) : (
                    <p className="font-mont font-black text-white text-sm leading-snug drop-shadow">{item.name}</p>
                  )}
                </div>

                {/* Year pill */}
                {tab === "cars" && item.year && (
                  <span className="absolute top-3 right-3 font-mont font-black text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/90">
                    {item.year}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4 flex items-end justify-between gap-2">
                <div>
                  <p className="font-mont text-[9px] tracking-widest uppercase text-charcoal/30 dark:text-cream/30">от</p>
                  <p className="font-mont font-black text-red-accent text-[17px] leading-tight">
                    {item.price.toLocaleString("ru-RU")} ₽
                  </p>
                </div>
                <span className="font-mont text-charcoal/20 dark:text-cream/20 text-xl transition-all duration-200 group-hover:text-red-accent group-hover:translate-x-1 inline-block">
                  →
                </span>
              </div>
            </div>
          ))}

          {/* Ghost "see all" card */}
          <div
            className="shrink-0 w-52 rounded-2xl border-2 border-dashed border-charcoal/15 dark:border-cream/15 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-red-accent transition-colors duration-300 group"
            style={{ scrollSnapAlign: "start" }}
            onClick={() => navigate("/catalog")}
          >
            <span className="font-mont text-3xl font-thin text-charcoal/30 dark:text-cream/30 group-hover:text-red-accent group-hover:scale-110 transition-all duration-300">
              →
            </span>
            <span className="font-mont text-[10px] tracking-widest uppercase text-center px-4 text-charcoal/30 dark:text-cream/30 group-hover:text-red-accent transition-colors duration-300">
              {t.catalog.toCatalog}
            </span>
          </div>
        </div>

      </div>

<div className="flex items-center justify-center gap-6 mt-8 px-8 select-none">

        {/* Prev */}
        <button
          onClick={() => scroll(-1)}
          disabled={index <= 0}
          aria-label="Назад"
          className="group flex items-center gap-2 disabled:opacity-20 transition-opacity duration-200"
        >
          {/* Long thin arrow left */}
          <svg width="48" height="12" viewBox="0 0 48 12" fill="none"
            className="text-charcoal dark:text-cream group-hover:text-red-accent transition-colors duration-200 group-disabled:pointer-events-none">
            <line x1="47" y1="6" x2="1" y2="6" stroke="currentColor" strokeWidth="1.5"/>
            <polyline points="7,1 1,6 7,11" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Counter */}
        <span className="font-mont text-xs tracking-widest text-charcoal/40 dark:text-cream/40 tabular-nums w-16 text-center">
          {String(index + 1).padStart(2, "0")} / {String(maxIndex + 1).padStart(2, "0")}
        </span>

        {/* Next */}
        <button
          onClick={() => scroll(1)}
          disabled={index >= maxIndex}
          aria-label="Вперёд"
          className="group flex items-center gap-2 disabled:opacity-20 transition-opacity duration-200"
        >
          {/* Long thin arrow right */}
          <svg width="48" height="12" viewBox="0 0 48 12" fill="none"
            className="text-charcoal dark:text-cream group-hover:text-red-accent transition-colors duration-200">
            <line x1="1" y1="6" x2="47" y2="6" stroke="currentColor" strokeWidth="1.5"/>
            <polyline points="41,1 47,6 41,11" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
        </button>

      </div>
    </section>
  );
}
