import React, { useState, useRef, useEffect } from "react";
import { useLang } from "../../context/LangContext";

/* base classes */
export const inputCls =
  "w-full font-mont text-sm bg-charcoal/5 dark:bg-cream/5 border border-charcoal/10 dark:border-cream/10 rounded-xl px-4 py-3 text-charcoal dark:text-cream placeholder:text-charcoal/90 dark:placeholder:text-cream/90 focus:outline-none focus:border-red-accent/50 transition-colors";

/* Label + Input wrapper */
export function FormField({ label, required, error, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mont text-[11px] tracking-widest uppercase text-charcoal/90 dark:text-cream/90">
        {label}{required && <span className="text-red-accent ml-0.5">*</span>}
      </span>
      {children}
      {error && <span className="font-mont text-xs text-red-accent">{error}</span>}
    </label>
  );
}

/* Text / Number input */
export function Input({ label, required, error, ...props }) {
  return (
    <FormField label={label} required={required} error={error}>
      <input className={`${inputCls}${error ? " border-red-accent/50" : ""}`} {...props} />
    </FormField>
  );
}

/* Select */
export function Select({ label, required, error, options, placeholder, ...props }) {
  return (
    <FormField label={label} required={required} error={error}>
      <select className={`${inputCls}${error ? " border-red-accent/50" : ""}`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </FormField>
  );
}

/* Textarea */
export function Textarea({ label, required, error, rows = 3, ...props }) {
  return (
    <FormField label={label} required={required} error={error}>
      <textarea rows={rows}
        className={`${inputCls} resize-none${error ? " border-red-accent/50" : ""}`}
        {...props}
      />
    </FormField>
  );
}

/* Range (from / to) */
export function RangeField({ label, required, fromProps, toProps, fromError, toError }) {
  const { lang } = useLang();
  const fromPh = lang === "en" ? "From" : "от";
  const toPh   = lang === "en" ? "To"   : "до";
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mont text-[11px] tracking-widest uppercase text-charcoal/90 dark:text-cream/90">
        {label}{required && <span className="text-red-accent ml-0.5">*</span>}
      </span>
      <div className="flex items-center gap-2">
        <input placeholder={fromPh}
          className={`${inputCls} flex-1${fromError ? " border-red-accent/50" : ""}`}
          {...fromProps}
        />
        <span className="font-mont text-xs text-charcoal/30 dark:text-cream/30 shrink-0">—</span>
        <input placeholder={toPh}
          className={`${inputCls} flex-1${toError ? " border-red-accent/50" : ""}`}
          {...toProps}
        />
      </div>
      {fromError && <span className="font-mont text-xs text-red-accent">{fromError}</span>}
      {toError   && <span className="font-mont text-xs text-red-accent">{toError}</span>}
    </div>
  );
}

const Chevron = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    className="shrink-0 transition-transform duration-200"
    style={{ transform: open ? "rotate(180deg)" : "" }}>
    <path d="M2 4l4 4 4-4"/>
  </svg>
);

const dropdownCls =
  "absolute z-30 mt-1 w-full bg-cream dark:bg-charcoal border border-charcoal/10 dark:border-cream/10 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto";

/* Combined translation map built from LangContext maps */
function useOptionLabel() {
  const { t } = useLang();
  const map = {
    ...(t.catalog?.countryMap ?? {}),
    ...(t.catalog?.gearboxMap ?? {}),
    ...(t.catalog?.driveMap   ?? {}),
    ...(t.catalog?.bodyMap    ?? {}),
  };
  return (opt) => map[opt] ?? opt;
}

/* MultiSelect dropdown */
export function MultiSelect({ label, required, error, options, selected, onChange, disabled }) {
  const { lang } = useLang();
  const getLabel = useOptionLabel();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (opt) => onChange(
    selected.includes(opt) ? selected.filter(v => v !== opt) : [...selected, opt]
  );

  const emptyPlaceholder = lang === "en" ? "Select…" : "Выберите…";
  const displayText = selected.length === 0
    ? emptyPlaceholder
    : selected.map(getLabel).join(", ");

  return (
    <FormField label={label} required={required} error={error}>
      <div ref={ref} className="relative">
        <button type="button" disabled={disabled}
          onClick={() => !disabled && setOpen(v => !v)}
          className={`${inputCls} text-left flex items-center justify-between gap-2 ${
            error ? "border-red-accent/50" : ""
          } ${selected.length === 0 ? "text-charcoal/90 dark:text-cream/90" : ""}`}
        >
          <span className="truncate">{displayText}</span>
          <Chevron open={open} />
        </button>

        {open && (
          <div className={dropdownCls}>
            {options.map(opt => {
              const checked = selected.includes(opt);
              return (
                <label key={opt}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-charcoal/5 dark:hover:bg-cream/5 cursor-pointer transition-colors">
                  <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    checked ? "bg-red-accent" : "bg-charcoal/10 dark:bg-cream/10"
                  }`}>
                    {checked && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="2.2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 3 6 7 2"/>
                      </svg>
                    )}
                  </div>
                  <span className={`font-mont text-sm transition-colors ${checked ? "text-red-accent font-semibold" : "text-charcoal dark:text-cream"}`}>
                    {getLabel(opt)}
                  </span>
                  <input type="checkbox" className="hidden" checked={checked} onChange={() => toggle(opt)} />
                </label>
              );
            })}
          </div>
        )}
      </div>
    </FormField>
  );
}

/* SingleSelect dropdown */
export function SingleSelect({ label, required, error, options, value, onChange, disabled, placeholder }) {
  const { lang } = useLang();
  const getLabel = useOptionLabel();
  placeholder = placeholder ?? (lang === "en" ? "Select…" : "Выберите…");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <FormField label={label} required={required} error={error}>
      <div ref={ref} className="relative">
        <button type="button" disabled={disabled}
          onClick={() => !disabled && setOpen(v => !v)}
          className={`${inputCls} text-left flex items-center justify-between gap-2 ${
            error ? "border-red-accent/50" : ""
          } ${!value ? "text-charcoal/90 dark:text-cream/90" : ""}`}
        >
          <span className="truncate">{value ? getLabel(value) : placeholder}</span>
          <Chevron open={open} />
        </button>

        {open && (
          <div className={dropdownCls}>
            {options.map(opt => {
              const sel = value === opt;
              return (
                <button key={opt} type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-charcoal/5 dark:hover:bg-cream/5 transition-colors text-left">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    sel ? "bg-red-accent" : "bg-charcoal/10 dark:bg-cream/10"
                  }`}>
                    {sel && <div className="w-2 h-2 rounded-full bg-cream" />}
                  </div>
                  <span className={`font-mont text-sm transition-colors ${sel ? "text-red-accent font-semibold" : "text-charcoal dark:text-cream"}`}>
                    {getLabel(opt)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </FormField>
  );
}

/* Photo upload */
export function PhotoUpload({ file, onChange, label = "Фото (необязательно)", required }) {
  return (
    <div className="flex flex-col gap-1.5">
      {required && (
        <span className="font-mont text-[11px] tracking-widest uppercase text-charcoal/90 dark:text-cream/90">
          Фото<span className="text-red-accent ml-0.5">*</span>
        </span>
      )}
      <label className="flex items-center gap-3 border-2 border-dashed border-charcoal/15 dark:border-cream/15 rounded-xl px-4 py-3 cursor-pointer hover:border-red-accent/40 transition-colors group">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          className="text-charcoal/30 dark:text-cream/30 group-hover:text-red-accent shrink-0 transition-colors">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span className="font-mont text-sm text-charcoal/90 dark:text-cream/90 group-hover:text-charcoal dark:group-hover:text-cream transition-colors truncate flex-1">
          {file ? file.name : label}
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={e => {
          const f = e.target.files[0];
          if (f && f.size > 10 * 1024 * 1024) { alert("Файл слишком большой (макс. 10 МБ)"); e.target.value = ""; return; }
          onChange(f);
        }} />
      </label>
    </div>
  );
}

/* Submit button */
export function SubmitBtn({ loading, label = "Отправить", loadingLabel = "Отправка…" }) {
  return (
    <button type="submit" disabled={loading}
      className="self-start font-mont font-black text-xs tracking-widest uppercase px-7 py-3 bg-red-accent text-cream rounded-xl hover:opacity-90 active:scale-95 transition disabled:opacity-50">
      {loading ? loadingLabel : label}
    </button>
  );
}
