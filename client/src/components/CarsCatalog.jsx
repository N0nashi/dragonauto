import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import { toast } from "../utils/toast";
import { useLang } from "../context/LangContext";

const PAGE = 12;
const API  = import.meta.env.VITE_API_URL;
const CURRENT_YEAR = new Date().getFullYear();

const RANGE_LIMITS = {
  year:    { min: 1950,  max: CURRENT_YEAR },
  price:   { min: 0,     max: 100_000_000 },
  mileage: { min: 0,     max: 2_000_000 },
};

const BLOCKED_KEYS = ["-", "+", "e", "E", ".", ","];

const RangeRow = memo(({ label, filterKey, value, onChange, fromLabel, toLabel }) => {
  const limits   = RANGE_LIMITS[filterKey] || { min: 0, max: 999_999_999 };
  const maxLen   = String(Math.floor(limits.max)).length; // максимальное кол-во цифр
  const [local, setLocal] = useState({ min: "", max: "" });
  const timerRef = useRef(null);

  useEffect(() => {
    if (!value) setLocal({ min: "", max: "" });
  }, [value]);

  const clampVal = (v) => {
    if (v === "" || v === undefined) return undefined;
    const n = Number(v);
    if (isNaN(n)) return undefined;
    return Math.min(Math.max(n, limits.min), limits.max);
  };

  const commit = (next) => {
    const minNum = clampVal(next.min);
    const maxNum = clampVal(next.max);
    onChange(filterKey, (minNum !== undefined || maxNum !== undefined) ? { min: minNum, max: maxNum } : undefined);
  };

  const handleChange = (k, raw) => {
    // Разрешаем только цифры, не больше maxLen символов
    const digits = raw.replace(/\D/g, "").slice(0, maxLen);
    const next = { ...local, [k]: digits };
    setLocal(next);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => commit(next), 600);
  };

  const handleBlur = (k) => {
    clearTimeout(timerRef.current);
    const clamped = local[k] !== "" ? String(clampVal(local[k]) ?? "") : "";
    const next = { ...local, [k]: clamped };
    setLocal(next);
    commit(next);
  };

  const inputCls = "w-full font-mont text-sm text-charcoal dark:text-cream bg-transparent border border-charcoal/20 dark:border-cream/20 rounded-xl px-3 py-2.5 focus:outline-none focus:border-charcoal/50 dark:focus:border-cream/50 transition-colors duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mont text-[10px] tracking-widest text-charcoal/90 dark:text-cream/90 uppercase pr-0.5">
        {label}
      </span>
      <div className="flex gap-2">
        {(["min", "max"]).map(k => (
          <input
            key={k}
            type="text"
            inputMode="numeric"
            placeholder={k === "min" ? fromLabel : toLabel}
            value={local[k]}
            onKeyDown={e => { if (BLOCKED_KEYS.includes(e.key)) e.preventDefault(); }}
            onChange={e => handleChange(k, e.target.value)}
            onBlur={() => handleBlur(k)}
            className={inputCls}
          />
        ))}
      </div>
    </div>
  );
});

const CatalogFilterSelect = ({ placeholder, options, currentValue, onSelect, getLabel }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const seen = new Set();
  const deduped = (options || []).filter(Boolean).filter(o => {
    const label = getLabel(o);
    if (seen.has(label)) return false;
    seen.add(label);
    return true;
  });

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full font-mont text-sm text-left flex items-center justify-between gap-2 bg-cream dark:bg-charcoal border border-charcoal/20 dark:border-cream/20 rounded-xl px-4 py-3 focus:outline-none transition-colors duration-200 hover:border-charcoal/40 dark:hover:border-cream/40">
        <span className={`truncate ${!currentValue ? "text-charcoal/90 dark:text-cream/90" : "text-charcoal dark:text-cream"}`}>
          {currentValue ? getLabel(currentValue) : placeholder}
        </span>
        <svg width="11" height="6" viewBox="0 0 11 6" fill="none"
          className="shrink-0 text-charcoal/90 dark:text-cream/90 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "" }}>
          <path d="M1 1l4.5 4 4.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-cream dark:bg-charcoal border border-charcoal/10 dark:border-cream/10 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {deduped.length === 0 ? (
            <p className="font-mont text-xs text-charcoal/90 dark:text-cream/90 text-center py-4 px-4">
              Нет данных
            </p>
          ) : (
            <>
              <button type="button"
                onClick={() => { onSelect(undefined); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-charcoal/5 dark:hover:bg-cream/5 transition-colors text-left">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${!currentValue ? "bg-red-accent" : "bg-charcoal/10 dark:bg-cream/10"}`}>
                  {!currentValue && <div className="w-2 h-2 rounded-full bg-cream" />}
                </div>
                <span className={`font-mont text-sm ${!currentValue ? "text-red-accent font-semibold" : "text-charcoal/90 dark:text-cream/90"}`}>{placeholder}</span>
              </button>
              {deduped.map(o => {
                const label = getLabel(o);
                const sel = currentValue === o;
                return (
                  <button key={o} type="button"
                    onClick={() => { onSelect(o); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-charcoal/5 dark:hover:bg-cream/5 transition-colors text-left">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${sel ? "bg-red-accent" : "bg-charcoal/10 dark:bg-cream/10"}`}>
                      {sel && <div className="w-2 h-2 rounded-full bg-cream" />}
                    </div>
                    <span className={`font-mont text-sm ${sel ? "text-red-accent font-semibold" : "text-charcoal dark:text-cream"}`}>{label}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const CarsCatalog = () => {
  const { t, lang } = useLang();
  const tc = t.catalog;

  const [activeTab, setActiveTab] = useState("cars");

  const [filters, setFilters] = useState({ countries: [], brands: [], models: [], bodies: [], gearboxes: [], drives: [] });
  const [selectedFilters, setSelectedFilters] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [allItems, setAllItems]       = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const [animStart, setAnimStart]     = useState(0);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingItems, setLoadingItems]     = useState(false);
  const [loadingMore, setLoadingMore]       = useState(false);
  const [error, setError] = useState(null);

  const [gridCols, setGridCols]       = useState(3);
  const [availableGrid, setAvailableGrid] = useState([3, 4]);

  const prevCountryRef = useRef(null);
  const prevBrandRef   = useRef(null);
  const token = localStorage.getItem("token");

  const getUserId = () => {
    if (!token) return null;
    try { const p = JSON.parse(atob(token.split(".")[1])); return p.userId || p.id || null; }
    catch { return null; }
  };
  const currentUserId = getUserId();

  const updateLayout = useCallback(() => {
    const w = window.innerWidth;
    if (w < 768) {
      setAvailableGrid([]);
      setGridCols(window.matchMedia("(orientation: portrait)").matches ? 1 : 2);
    } else {
      setAvailableGrid([3, 4]);
      setGridCols(prev => (prev < 3 ? 3 : prev));
    }
  }, []);

  useEffect(() => {
    updateLayout();
    window.addEventListener("resize", updateLayout);
    window.addEventListener("orientationchange", updateLayout);
    return () => { window.removeEventListener("resize", updateLayout); window.removeEventListener("orientationchange", updateLayout); };
  }, [updateLayout]);

  useEffect(() => {
    setSelectedFilters({});
    setAllItems([]);
    setVisibleCount(PAGE);
    setAnimStart(0);
    setFilters({ countries: [], brands: [], models: [], bodies: [], gearboxes: [], drives: [] });
  }, [activeTab]);

  useEffect(() => {
    const load = async () => {
      setLoadingFilters(true);
      try {
        const base = activeTab === "cars" ? `${API}/api/cars/filters` : `${API}/api/parts/filters`;
        const url = new URL(base);
        if (selectedFilters.country) url.searchParams.append("country", selectedFilters.country);
        if (selectedFilters.brand)   url.searchParams.append("brand",   selectedFilters.brand);
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFilters(data);
        if (prevCountryRef.current !== selectedFilters.country)
          setSelectedFilters(p => ({ ...p, brand: "", model: "" }));
        if (prevBrandRef.current !== selectedFilters.brand)
          setSelectedFilters(p => ({ ...p, model: "" }));
        prevCountryRef.current = selectedFilters.country;
        prevBrandRef.current   = selectedFilters.brand;
        setError(null);
      } catch { setError(tc.ui.loading); }
      finally  { setLoadingFilters(false); }
    };
    load();
  }, [activeTab, selectedFilters.country, selectedFilters.brand]);

  useEffect(() => {
    const load = async () => {
      setLoadingItems(true);
      setVisibleCount(PAGE);
      setAnimStart(0);
      try {
        const endpoint = activeTab === "cars" ? `${API}/api/cars/search` : `${API}/api/parts/search`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedFilters),
        });
        if (!res.ok) throw new Error();
        setAllItems(await res.json());
        setError(null);
      } catch { setError(tc.ui.loading); }
      finally  { setLoadingItems(false); }
    };
    load();
  }, [activeTab, selectedFilters]);

  const handleFilter = (key, value) => {
    setSelectedFilters(prev => {
      const next = { ...prev, [key]: value || undefined };
      if (key === "country") { next.brand = ""; next.model = ""; }
      else if (key === "brand") { next.model = ""; }
      return next;
    });
  };

  const loadMore = () => {
    setAnimStart(visibleCount);
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(p => Math.min(p + PAGE, allItems.length));
      setLoadingMore(false);
    }, 250);
  };

  const visibleItems = allItems.slice(0, visibleCount);
  const hasMore = visibleCount < allItems.length;

  const createRequest = async (item) => {
    if (!currentUserId) {
      toast.info(tc.ui.loginRequired);
      setTimeout(() => { window.location.href = "/auth"; }, 2000);
      return;
    }
    try {
      const body = activeTab === "cars"
        ? {
            type: "car",
            description: `${tc.ui.reqCarDesc} ${item.brand} ${item.model} ${item.year}`,
            country_car: item.country, brand_car: item.brand, model_car: item.model,
            price_from_car: item.price, price_to_car: item.price,
            year_from_car: item.year, year_to_car: item.year,
            mileage_from_car: item.mileage, mileage_to_car: item.mileage,
            gearbox_car: item.gearbox, body_car: item.body,
            drive_car: item.drive ? [item.drive] : null,
            power_from_car: item.engine_power ? Number(item.engine_power) : null,
            power_to_car:   item.engine_power ? Number(item.engine_power) : null,
          }
        : {
            type: "part",
            description: `${tc.ui.reqPartDesc} ${item.part_name} ${tc.ui.reqFor} ${item.brand} ${item.model}`,
            country_part: item.country, brand_part: item.brand, model_part: item.model,
            part_name: item.part_name,
            price_from_part: item.price, price_to_part: item.price,
            body_part: item.body_type || item.body,
          };
      const res = await fetch(`${API}/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const d = await res.json();
      const itemName = activeTab === "cars"
        ? `${item.brand} ${item.model} ${item.year}`
        : item.part_name;
      toast.success(`${tc.ui.requestSent} ${tc.ui.requestNum}${d.applicationId} — ${itemName}`);
    } catch (e) { toast.error(e.message || t.toasts.submitError); }
  };

  const xlat = (map, val) => (map && map[val]) ? map[val] : val;

  const getMap = (filterKey) => {
    if (!tc.countryMap) return null;
    if (filterKey === "country") return tc.countryMap;
    if (filterKey === "gearbox") return tc.gearboxMap;
    if (filterKey === "drive")   return tc.driveMap;
    if (filterKey === "body")    return tc.bodyMap;
    return null;
  };

  const FilterSelect = ({ placeholder, filterKey, options }) => (
    <CatalogFilterSelect
      placeholder={placeholder}
      options={options}
      currentValue={selectedFilters[filterKey] || ""}
      onSelect={(val) => handleFilter(filterKey, val)}
      getLabel={(o) => xlat(getMap(filterKey), o)}
    />
  );


  const Chip = ({ children }) => (
    <span className="font-mont text-[10px] tracking-wide px-2.5 py-1 rounded-lg bg-charcoal/8 dark:bg-cream/6 text-charcoal/90 dark:text-cream/90 whitespace-nowrap">
      {children}
    </span>
  );

  const SkeletonCard = ({ compact }) => (
    <div className="rounded-2xl border border-charcoal/10 dark:border-cream/10 overflow-hidden animate-pulse bg-cream dark:bg-charcoal">
      <div className={`${compact ? "h-32" : "h-52"} bg-charcoal/8 dark:bg-cream/8`} />
      <div className="p-4 flex flex-col gap-3">
        {!compact && <>
          <div className="h-3.5 bg-charcoal/8 dark:bg-cream/8 rounded-lg w-2/3" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-charcoal/6 dark:bg-cream/6 rounded-lg" />
            <div className="h-6 w-20 bg-charcoal/6 dark:bg-cream/6 rounded-lg" />
          </div>
          <div className="h-3 bg-charcoal/5 dark:bg-cream/5 rounded-lg w-1/3" />
        </>}
        {compact && <div className="h-3.5 bg-charcoal/8 dark:bg-cream/8 rounded-lg w-3/4" />}
        <div className="flex justify-between items-end pt-3 border-t border-charcoal/10 dark:border-cream/6 mt-auto gap-2">
          <div className="h-6 w-28 bg-charcoal/10 dark:bg-cream/8 rounded-lg" />
          <div className="h-9 w-24 bg-charcoal/10 dark:bg-cream/8 rounded-xl" />
        </div>
      </div>
    </div>
  );

  const CarCard = ({ car, idx }) => {
    const src = car.photo_url?.startsWith("http") ? car.photo_url : `${API}${car.photo_url}`;
    const compact = gridCols === 4;
    const isNew = idx >= animStart;

    return (
      <div
        className={`group rounded-2xl overflow-hidden border flex flex-col bg-cream dark:bg-charcoal
          border-charcoal/15 dark:border-cream/10
          hover:border-charcoal/30 dark:hover:border-cream/20
          shadow-[0_1px_4px_rgba(47,48,50,0.06)] dark:shadow-none
          hover:shadow-[0_16px_48px_rgba(47,48,50,0.13)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.45)]
          transition-all duration-300
          ${isNew ? "anim-fade-up" : ""}`}
        style={isNew ? { animationDelay: `${(idx - animStart) * 0.055}s` } : undefined}
      >
<div className={`relative ${compact ? "h-36" : "h-52"} overflow-hidden bg-charcoal/5 dark:bg-cream/5 shrink-0`}>
          <img src={src || "/placeholder-car.jpg"} alt={`${car.brand} ${car.model}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            onError={e => { e.target.src = "/placeholder-car.jpg"; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

          {car.country && (
            <span className="absolute top-3 left-3 font-mont font-black text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/90">
              {xlat(tc.countryMap, car.country)}
            </span>
          )}
          {car.year && (
            <span className="absolute top-3 right-3 font-mont font-black text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/90">
              {car.year}
            </span>
          )}
          {!compact && (
            <div className="absolute bottom-3 left-4 right-4">
              <p className="font-mont font-black text-white text-lg leading-tight drop-shadow">{car.brand}</p>
              <p className="font-mont text-white/90 text-sm leading-tight">{car.model}</p>
            </div>
          )}
        </div>

<div className="p-4 flex flex-col flex-grow gap-2.5">
          {compact && (
            <div>
              <p className="font-mont font-bold text-charcoal dark:text-cream text-sm leading-tight">{car.brand} {car.model}</p>
              <p className="font-mont text-[11px] text-charcoal/90 dark:text-cream/90 mt-0.5">{car.year}</p>
            </div>
          )}

          {!compact && (
            <div className="flex flex-wrap gap-1.5 min-h-[28px]">
              {car.gearbox && <Chip>{xlat(tc.gearboxMap, car.gearbox)}</Chip>}
              {car.drive   && <Chip>{xlat(tc.driveMap,   car.drive)}</Chip>}
              {car.body    && <Chip>{xlat(tc.bodyMap,    car.body)}</Chip>}
              {car.engine_power && <Chip>{car.engine_power} л.с.</Chip>}
            </div>
          )}

          {!compact && car.mileage > 0 && (
            <div className="flex items-center gap-1.5 text-charcoal/90 dark:text-cream/90">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span className="font-mont text-xs">{car.mileage.toLocaleString("ru-RU")} км</span>
            </div>
          )}

          <div className="flex items-end justify-between mt-auto pt-3 border-t border-charcoal/10 dark:border-cream/10 gap-2">
            <div>
              <p className="font-mont text-[9px] tracking-widest uppercase text-charcoal/90 dark:text-cream/90">{tc.ui.priceFrom}</p>
              <p className="font-mont font-black text-red-accent text-[17px] leading-tight">
                {car.price ? car.price.toLocaleString("ru-RU") + " ₽" : "—"}
              </p>
            </div>
            <button onClick={() => createRequest(car)}
              className="shrink-0 font-mont font-black text-[10px] tracking-widest uppercase px-4 py-2.5 bg-red-accent text-cream rounded-xl hover:opacity-85 active:scale-95 transition-all duration-200">
              {tc.ui.select}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PartCard = ({ part, idx }) => {
    const placeholder = "/images/part-placeholder.png";
    const src = part.photo_url?.startsWith("http") ? part.photo_url : `${API}${part.photo_url}`;
    const compact = gridCols === 4;
    const isNew = idx >= animStart;

    return (
      <div
        className={`group rounded-2xl overflow-hidden border flex flex-col bg-cream dark:bg-charcoal
          border-charcoal/15 dark:border-cream/10
          hover:border-charcoal/30 dark:hover:border-cream/20
          shadow-[0_1px_4px_rgba(47,48,50,0.06)] dark:shadow-none
          hover:shadow-[0_16px_48px_rgba(47,48,50,0.13)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.45)]
          transition-all duration-300
          ${isNew ? "anim-fade-up" : ""}`}
        style={isNew ? { animationDelay: `${(idx - animStart) * 0.055}s` } : undefined}
      >
<div className={`relative ${compact ? "h-36" : "h-48"} overflow-hidden bg-charcoal/5 dark:bg-cream/5 shrink-0`}>
          <img src={part.photo_url ? src : placeholder} alt={part.part_name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            onError={e => { e.target.src = placeholder; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

          {part.country && (
            <span className="absolute top-3 left-3 font-mont font-black text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/90">
              {xlat(tc.countryMap, part.country)}
            </span>
          )}
          {!compact && (
            <div className="absolute bottom-3 left-4 right-4">
              <p className="font-mont font-black text-white text-base leading-snug drop-shadow">{part.part_name}</p>
            </div>
          )}
        </div>

<div className="p-4 flex flex-col flex-grow gap-2.5">
          {compact && (
            <p className="font-mont font-bold text-charcoal dark:text-cream text-sm leading-tight">{part.part_name}</p>
          )}

          {!compact && (
            <div className="flex flex-wrap gap-1.5 min-h-[28px]">
              {part.brand && <Chip>{part.brand}{part.model ? ` ${part.model}` : ""}</Chip>}
              {(part.body_type || part.body) && <Chip>{xlat(tc.bodyMap, part.body_type || part.body)}</Chip>}
              {part.year && <Chip>{part.year}</Chip>}
            </div>
          )}

          <div className="flex items-end justify-between mt-auto pt-3 border-t border-charcoal/10 dark:border-cream/10 gap-2">
            <div>
              <p className="font-mont text-[9px] tracking-widest uppercase text-charcoal/90 dark:text-cream/90">{tc.ui.priceFrom}</p>
              <p className="font-mont font-black text-red-accent text-[17px] leading-tight">
                {part.price ? part.price.toLocaleString("ru-RU") + " ₽" : "—"}
              </p>
            </div>
            <button onClick={() => createRequest(part)}
              className="shrink-0 font-mont font-black text-[10px] tracking-widest uppercase px-4 py-2.5 bg-red-accent text-cream rounded-xl hover:opacity-85 active:scale-95 transition-all duration-200">
              {tc.ui.select}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const GridIcon = ({ cols }) => cols === 3
    ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        {[1,5.25,9.5].map(x => [1,8].map(y =>
          <rect key={`${x}${y}`} x={x} y={y} width="3.5" height="5" rx="0.5" fill="currentColor" opacity="0.7"/>
        ))}
      </svg>
    : <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        {[0.5,4,7.5,11].map(x => [1,8].map(y =>
          <rect key={`${x}${y}`} x={x} y={y} width="2.5" height="5" rx="0.5" fill="currentColor" opacity="0.7"/>
        ))}
      </svg>;

  const gridClass = gridCols === 1 ? "grid-cols-1"
    : gridCols === 2 ? "grid-cols-2"
    : gridCols === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <>
      <div className="flex flex-col lg:flex-row px-6 md:px-12 pb-16 gap-6 items-start">

<aside className="w-full lg:w-64 shrink-0">
          <div className="border border-charcoal/15 dark:border-cream/10 rounded-2xl sticky top-4">

<div className="flex p-3 gap-2">
              {[
                { key: "cars",  label: tc.tabCars.toUpperCase() },
                { key: "parts", label: tc.parts.toUpperCase() },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`flex-1 font-mont font-black text-xs tracking-widest py-2 rounded-lg border-2 transition-all duration-200 ${
                    activeTab === key
                      ? "bg-red-accent border-red-accent text-cream"
                      : "bg-transparent border-charcoal/20 dark:border-cream/20 text-charcoal dark:text-cream hover:border-charcoal dark:hover:border-cream"
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="w-full h-px bg-charcoal/10 dark:bg-cream/10" />

            <div className="p-4 flex flex-col gap-3">
              {loadingFilters ? (
                <div className="flex flex-col gap-3 py-2">
                  {[1,2,3].map(i => <div key={i} className="h-11 rounded-xl bg-charcoal/6 dark:bg-cream/6 animate-pulse" />)}
                </div>
              ) : error ? (
                <p className="font-mont text-sm text-red-accent">{error}</p>
              ) : (
                <>
                  <FilterSelect placeholder={tc.f.country} filterKey="country" options={filters.countries} />
                  <FilterSelect placeholder={tc.f.brand}   filterKey="brand"   options={filters.brands}    />
                  <FilterSelect placeholder={tc.f.model}   filterKey="model"   options={filters.models}    />

                  <div className="h-px bg-charcoal/8 dark:bg-cream/8 my-0.5" />

                  <RangeRow label={tc.f.price} filterKey="price" value={selectedFilters.price} onChange={handleFilter} fromLabel={tc.f.from} toLabel={tc.f.to} />
                  <RangeRow label={tc.f.year}  filterKey="year"  value={selectedFilters.year}  onChange={handleFilter} fromLabel={tc.f.from} toLabel={tc.f.to} />

                  <button
                    onClick={() => setShowAdvanced(p => !p)}
                    className="font-mont text-[10px] tracking-widest uppercase text-charcoal/90 dark:text-cream/90 hover:text-red-accent transition-colors duration-200 text-left mt-1 flex items-center gap-1.5"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"
                      style={{ transform: showAdvanced ? "rotate(90deg)" : "", transition: "transform .2s" }}>
                      <path d="M3 1.5l3.5 3.5L3 8.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {showAdvanced ? tc.f.hide : tc.f.more}
                  </button>

                  {showAdvanced && (
                    <div className="flex flex-col gap-3 pt-1 anim-fade-up">
                      <div className="h-px bg-charcoal/8 dark:bg-cream/8" />
                      <RangeRow label={tc.f.mileage} filterKey="mileage" value={selectedFilters.mileage} onChange={handleFilter} fromLabel={tc.f.from} toLabel={tc.f.to} />
                      {activeTab === "cars" && (
                        <>
                          <FilterSelect placeholder={tc.f.gearbox} filterKey="gearbox" options={filters.gearboxes} />
                          <FilterSelect placeholder={tc.f.drive}   filterKey="drive"   options={filters.drives}    />
                        </>
                      )}
                      <FilterSelect placeholder={tc.f.body} filterKey="body" options={filters.bodies} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </aside>

<main className="flex-1 min-w-0">

{lang === "en" && (
            <div className="flex items-center gap-2 mb-4 px-3.5 py-2.5 rounded-xl bg-charcoal/5 dark:bg-cream/5">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="shrink-0 text-charcoal/90 dark:text-cream/90">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M8 7v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="8" cy="5" r="0.7" fill="currentColor"/>
              </svg>
              <span className="font-mont text-[11px] text-charcoal/90 dark:text-cream/90 leading-snug">
                {tc.ui.langNotice}
              </span>
            </div>
          )}

<div className="flex justify-between items-center mb-5">
            <span className="font-mont text-xs text-charcoal/90 dark:text-cream/90 tracking-widest uppercase">
              {loadingItems ? "…" : `${allItems.length} ${activeTab === "cars" ? tc.ui.carsCount : tc.ui.partsCount}`}
            </span>
            {availableGrid.length > 0 && (
              <div className="flex gap-1.5">
                {availableGrid.map(cols => (
                  <button key={cols} onClick={() => setGridCols(cols)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all duration-200 ${
                      gridCols === cols
                        ? "border-charcoal dark:border-cream bg-charcoal dark:bg-cream text-cream dark:text-charcoal"
                        : "border-charcoal/20 dark:border-cream/20 text-charcoal/90 dark:text-cream/90 hover:border-charcoal/50 dark:hover:border-cream/50"
                    }`}>
                    <GridIcon cols={cols} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadingItems && (
            <div className={`grid gap-5 ${gridClass}`}>
              {Array.from({ length: PAGE }, (_, i) => (
                <SkeletonCard key={i} compact={gridCols === 4} />
              ))}
            </div>
          )}

          {!loadingItems && allItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <span className="font-mont text-4xl text-charcoal/10 dark:text-cream/10">∅</span>
              <p className="font-mont text-sm text-charcoal/90 dark:text-cream/90 tracking-widest uppercase">
                {tc.ui.empty}
              </p>
            </div>
          )}

          {!loadingItems && visibleItems.length > 0 && (
            <>
              <div className={`grid gap-5 ${gridClass}`}>
                {visibleItems.map((item, i) =>
                  activeTab === "cars"
                    ? <CarCard key={item.id} car={item} idx={i} />
                    : <PartCard key={item.id} part={item} idx={i} />
                )}
              </div>

              {(hasMore || loadingMore) && (
                <div className="flex flex-col items-center gap-3 mt-10">
                  <p className="font-mont text-xs text-charcoal/90 dark:text-cream/90 tracking-widest uppercase">
                    {visibleCount} из {allItems.length}
                  </p>
                  <div className="w-full max-w-xs h-0.5 bg-charcoal/8 dark:bg-cream/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-accent rounded-full transition-all duration-500"
                      style={{ width: `${(visibleCount / allItems.length) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="mt-2 font-mont font-black text-xs tracking-widest uppercase px-8 py-3 border-2 border-charcoal/20 dark:border-cream/20 text-charcoal dark:text-cream rounded-xl hover:border-red-accent hover:text-red-accent transition-all duration-200 disabled:opacity-40 flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"/>
                        </svg>
                        Загрузка…
                      </>
                    ) : "Загрузить ещё"}
                  </button>
                </div>
              )}

              {!hasMore && !loadingMore && allItems.length > PAGE && (
                <p className="text-center font-mont text-xs text-charcoal/90 dark:text-cream/90 tracking-widest uppercase mt-10">
                  Все {allItems.length} показаны
                </p>
              )}
            </>
          )}
        </main>
      </div>

    </>
  );
};

export default CarsCatalog;
