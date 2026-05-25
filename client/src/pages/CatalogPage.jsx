import React from "react";
import CarsCatalog from "../components/CarsCatalog";
import { useLang } from "../context/LangContext";

export default function CatalogPage() {
  const { t } = useLang();

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal transition-colors duration-300">

      {/* ── Title ── */}
      <div className="flex justify-start px-6 md:px-12 pt-8 pb-6">
        <h1 className="font-mont font-black text-2xl tracking-widest text-charcoal dark:text-cream uppercase">
          {t.nav.catalog}
        </h1>
      </div>

      {/* ── Catalog (tabs + filters + grid all inside) ── */}
      <CarsCatalog />
    </div>
  );
}
