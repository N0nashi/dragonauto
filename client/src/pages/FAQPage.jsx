import React, { useState } from "react";
import { useLang } from "../context/LangContext";

const extraFaqs = {
  ru: [
    {
      q: "Какие автомобили можно подобрать?",
      a: "Мы подбираем автомобили из Китая, Японии и Кореи: легковые, кроссоверы, грузовые и специализированные авто любых марок.",
    },
    {
      q: "Сколько времени занимает подбор?",
      a: "Подбор занимает от 1 до 3 рабочих дней. Мы свяжемся с вами сразу после оформления заявки.",
    },
    {
      q: "Нужна ли регистрация для заявки?",
      a: "Да, регистрация требуется — это нужно для удобства связи и отслеживания статуса вашей заявки.",
    },
    {
      q: "Можно ли подобрать автозапчасти?",
      a: "Да, выберите вкладку «Запчасти» в каталоге и укажите характеристики нужной детали.",
    },
    {
      q: "Как происходит оплата?",
      a: "Оплата производится после согласования всех условий. Мы работаем по договору и предоставляем полный пакет документов.",
    },
    {
      q: "Есть ли постгарантийное обслуживание?",
      a: "Мы консультируем клиентов и после получения автомобиля. Также помогаем с подбором запчастей на обслуживание.",
    },
  ],
  en: [
    {
      q: "What cars can be selected?",
      a: "We source cars from China, Japan and Korea: sedans, SUVs, trucks and specialty vehicles of any brand.",
    },
    {
      q: "How long does selection take?",
      a: "Selection takes 1 to 3 business days. We will contact you right after you submit a request.",
    },
    {
      q: "Is registration required?",
      a: "Yes, registration is required — it helps us stay in touch and track your request status.",
    },
    {
      q: "Can I order spare parts?",
      a: "Yes, switch to the 'Parts' tab in the catalog and specify the part characteristics you need.",
    },
    {
      q: "How does payment work?",
      a: "Payment is made after all conditions are agreed upon. We work under a contract and provide a full set of documents.",
    },
    {
      q: "Is there post-warranty service?",
      a: "We consult clients even after vehicle delivery and help with sourcing spare parts for maintenance.",
    },
  ],
};

export default function FAQPage() {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(null);

  const allItems = [...t.faq.items, ...extraFaqs[lang]];

  const toggle = (i) => setOpen((prev) => (prev === i ? null : i));

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal transition-colors duration-300">

      {/* ── Header ── */}
      <div className="px-6 md:px-16 pt-16 pb-12">
        <div className="max-w-3xl mx-auto">
          <p className="font-mont text-[10px] tracking-[0.3em] text-charcoal/30 dark:text-cream/30 uppercase mb-3">
            DragonAuto
          </p>
          <h1 className="font-mont font-black text-4xl md:text-6xl text-charcoal dark:text-cream leading-none tracking-tight">
            {t.faq.title}
          </h1>
          <div className="w-16 h-0.5 bg-red-accent mt-6" />
        </div>
      </div>

      {/* ── FAQ list ── */}
      <div className="px-6 md:px-16 pb-24">
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          {allItems.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                  isOpen
                    ? "border-charcoal/25 dark:border-cream/25"
                    : "border-charcoal/10 dark:border-cream/10"
                }`}
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center gap-4 px-6 py-5 text-left group"
                >
                  {/* Index */}
                  <span className="font-mont font-bold text-charcoal/20 dark:text-cream/20 text-xs tabular-nums shrink-0 w-5">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Question */}
                  <span className="font-mont font-bold text-charcoal dark:text-cream flex-1 text-base md:text-lg leading-snug">
                    {item.q}
                  </span>

                  {/* Toggle icon */}
                  <span className={`shrink-0 ml-4 transition-transform duration-300 ${isOpen ? "rotate-45" : "rotate-0"}`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                      className="text-charcoal/30 dark:text-cream/30 group-hover:text-charcoal dark:group-hover:text-cream transition-colors duration-200">
                      <line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                </button>

                {/* Answer */}
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96" : "max-h-0"}`}>
                  <p className="font-mont text-sm text-charcoal/55 dark:text-cream/55 leading-relaxed px-6 pb-6 pl-[60px]">
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="border-t border-charcoal/10 dark:border-cream/10 px-6 md:px-16 py-16">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-mont font-bold text-charcoal dark:text-cream text-lg">
              Остались вопросы?
            </p>
            <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40 mt-1">
              Напишите нам — ответим в течение часа
            </p>
          </div>
          <a
            href="https://t.me/"
            target="_blank"
            rel="noreferrer"
            className="font-mont font-black text-xs tracking-widest uppercase px-8 py-3 border-2 border-charcoal dark:border-cream text-charcoal dark:text-cream rounded-full hover:bg-charcoal hover:text-cream dark:hover:bg-cream dark:hover:text-charcoal transition-all duration-200 shrink-0"
          >
            Telegram
          </a>
        </div>
      </div>

    </div>
  );
}
