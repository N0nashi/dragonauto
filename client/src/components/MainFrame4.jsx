import React from "react";
import { useLang } from "../context/LangContext";
import { useInView } from "../hooks/useInView";

export default function MainFrame4() {
  const { t } = useLang();
  const c = t.contact;
  const [ref, inView] = useInView(0.1);

  return (
    <section ref={ref} className="bg-cream dark:bg-charcoal py-16 px-8 md:px-20 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">

        <div className={`flex flex-col items-center gap-6 mb-10 ${inView ? "anim-fade-up" : "opacity-0"}`}>
          <h2 className="font-mont font-black text-4xl md:text-5xl text-charcoal dark:text-cream tracking-tight text-center">
            {c.title}
          </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-5 items-stretch">

          <div className={`flex-1 min-h-[320px] rounded-2xl overflow-hidden border border-charcoal/20 dark:border-cream/15 ${inView ? "anim-fade-left anim-d1" : "opacity-0"}`}>
            <iframe
              title="DragonAuto location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2282.602799664989!2d61.29221631578879!3d55.17203804810462!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x43e8d9b400000001%3A0x6a6f4e0bb687ba8c!2z0JrQvtGB0LrQuNC5INCX0LDQvdC-0YDQvtCw!5e0!3m2!1sru!2sru!4v1696223209448!5m2!1sru!2sru"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "320px" }}
              className="[filter:grayscale(0.6)_contrast(0.9)] dark:[filter:grayscale(1)_invert(0.9)_contrast(0.85)]"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className={`md:w-72 shrink-0 rounded-2xl border border-charcoal/20 dark:border-cream/15 p-8 flex flex-col gap-7 ${inView ? "anim-fade-right anim-d2" : "opacity-0"}`}>
            <div className="flex flex-col gap-1.5">
              <p className="font-mont font-bold text-charcoal dark:text-cream text-sm">{c.phoneLabel}</p>
              <a
                href={`tel:${c.phone.replace(/\s/g, "")}`}
                className="font-mont text-sm text-charcoal/55 dark:text-cream/55 hover:text-red-accent transition-colors duration-200"
              >
                {c.phone}
              </a>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="font-mont font-bold text-charcoal dark:text-cream text-sm">{c.addressLabel}</p>
              <p className="font-mont text-sm text-charcoal/55 dark:text-cream/55 leading-relaxed">
                {c.address}
              </p>
            </div>

            <a
              href="https://t.me/nonashi"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mont font-bold text-xs tracking-widest uppercase px-5 py-3 text-center bg-red-accent text-cream hover:opacity-85 transition-opacity duration-200 rounded-xl mt-auto"
            >
              {c.telegram}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
