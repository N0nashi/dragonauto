import React, { useState, useEffect } from "react";
import { toast } from "../utils/toast";
import { Input, Select, RangeField, MultiSelect, Textarea, SubmitBtn } from "./ui/FormFields";
import { COUNTRIES, DRIVES, GEARBOXES, BODIES } from "../constants/catalog";
import { useLang } from "../context/LangContext";
import { translateDesc } from "../utils/translateDesc";

const sanitizeText = (v) => v.replace(/[^a-zA-Z0-9\s\-\.]/g, "").slice(0, 50);
// марка — только буквы, пробел и дефис, без цифр
const sanitizeBrand = (v) => v.replace(/[^a-zA-Zа-яА-ЯёЁ\s\-]/g, "").slice(0, 50);
const hasLetter = (v) => /[a-zA-Zа-яА-ЯёЁ]/.test(v);
const blockSpecialNumeric = (e) => {
  if (["-", "+", "_", "e", "E", ".", ","].includes(e.key)) e.preventDefault();
};

const CAR_BOUNDS = {
  year:    { min: 1950, max: new Date().getFullYear() + 1 },
  price:   { min: 0, max: 1_000_000_000 },
  mileage: { min: 0, max: 2_000_000 },
  power:   { min: 0, max: 2_000 },
};
// оставляем только цифры и зажимаем само значение до максимума,
// чтобы нельзя было вбить ни 2222222222222, ни 9999 в год
const clampNum = (v, max) => {
  const digits = v.replace(/[^0-9]/g, "").slice(0, String(max).length);
  if (digits === "") return "";
  return String(Math.min(Number(digits), max));
};

export default function CarForm({ onSubmit, loading, initialData = null, readOnly = false }) {
  const { t, lang } = useLang();
  const tr = t.carForm;

  const [form, setForm] = useState({
    country_car:      [],
    brand_car:        "",
    model_car:        "",
    year_from_car:    "",
    year_to_car:      "",
    price_from_car:   "",
    price_to_car:     "",
    mileage_from_car: "",
    mileage_to_car:   "",
    power_from_car:   "",
    power_to_car:     "",
    drive_car:        [],
    gearbox_car:      [],
    body_car:         [],
    description:      "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!initialData) return;
    setForm({
      country_car:      initialData.country_car      || [],
      brand_car:        Array.isArray(initialData.brand_car) ? initialData.brand_car.join(", ") : (initialData.brand_car || ""),
      model_car:        initialData.model_car        || "",
      year_from_car:    initialData.year_from_car    ?? "",
      year_to_car:      initialData.year_to_car      ?? "",
      price_from_car:   initialData.price_from_car   ?? "",
      price_to_car:     initialData.price_to_car     ?? "",
      mileage_from_car: initialData.mileage_from_car ?? "",
      mileage_to_car:   initialData.mileage_to_car   ?? "",
      power_from_car:   initialData.power_from_car   ?? "",
      power_to_car:     initialData.power_to_car     ?? "",
      drive_car:        initialData.drive_car        || [],
      gearbox_car:      initialData.gearbox_car      || [],
      body_car:         initialData.body_car         || [],
      description:      initialData.description      || "",
    });
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (form.country_car.length === 0) e.country_car = tr.errors.country;
    if (!form.brand_car.trim() || !hasLetter(form.brand_car)) e.brand_car = tr.errors.brand;

    const inRange = (v, { min, max }) => v !== "" && !isNaN(Number(v)) && Number(v) >= min && Number(v) <= max;
    if (!inRange(form.year_from_car, CAR_BOUNDS.year)) e.year_from_car = tr.errors.yearFrom;
    if (!inRange(form.year_to_car, CAR_BOUNDS.year))   e.year_to_car   = tr.errors.yearTo;
    else if (+form.year_to_car < +form.year_from_car) e.year_to_car = tr.errors.yearToLess;

    if (!inRange(form.price_from_car, CAR_BOUNDS.price)) e.price_from_car = tr.errors.priceFrom;
    if (!inRange(form.price_to_car, CAR_BOUNDS.price))   e.price_to_car   = tr.errors.priceTo;
    else if (+form.price_to_car < +form.price_from_car) e.price_to_car = tr.errors.priceToLess;

    if (!inRange(form.mileage_from_car, CAR_BOUNDS.mileage)) e.mileage_from_car = tr.errors.mileageFrom;
    if (!inRange(form.mileage_to_car, CAR_BOUNDS.mileage))   e.mileage_to_car   = tr.errors.mileageTo;
    else if (+form.mileage_to_car < +form.mileage_from_car) e.mileage_to_car = tr.errors.mileageToLess;

    if (!inRange(form.power_from_car, CAR_BOUNDS.power)) e.power_from_car = tr.errors.powerFrom;
    if (!inRange(form.power_to_car, CAR_BOUNDS.power))   e.power_to_car   = tr.errors.powerTo;
    else if (+form.power_to_car < +form.power_from_car) e.power_to_car = tr.errors.powerToLess;

    return e;
  };

  // После первой попытки отправки подсвечиваем ошибки прямо при вводе
  useEffect(() => {
    if (submitted) setErrors(validate());
  }, [form, submitted]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;
    setSubmitted(true);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error(tr.errors.required, { autoClose: 3000 });
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MultiSelect
          label={tr.country} required
          options={COUNTRIES}
          selected={form.country_car}
          onChange={v => set("country_car", v)}
          error={errors.country_car}
          disabled={readOnly || loading}
        />
        <Input label={tr.brand} required placeholder="Toyota"
          value={form.brand_car} onChange={e => set("brand_car", sanitizeBrand(e.target.value))}
          error={errors.brand_car} disabled={readOnly || loading}
        />
        <Input label={tr.model} placeholder="Camry"
          value={form.model_car} onChange={e => set("model_car", sanitizeText(e.target.value))}
          disabled={readOnly || loading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RangeField label={tr.year} required
          fromProps={{ type: "number", min: CAR_BOUNDS.year.min, max: CAR_BOUNDS.year.max, value: form.year_from_car, onChange: e => set("year_from_car", clampNum(e.target.value, CAR_BOUNDS.year.max)), onKeyDown: blockSpecialNumeric, disabled: readOnly || loading }}
          toProps={{   type: "number", min: CAR_BOUNDS.year.min, max: CAR_BOUNDS.year.max, value: form.year_to_car,   onChange: e => set("year_to_car",   clampNum(e.target.value, CAR_BOUNDS.year.max)), onKeyDown: blockSpecialNumeric, disabled: readOnly || loading }}
          fromError={errors.year_from_car} toError={errors.year_to_car}
        />
        <RangeField label={tr.price} required
          fromProps={{ type: "number", min: 0, max: CAR_BOUNDS.price.max, value: form.price_from_car, onChange: e => set("price_from_car", clampNum(e.target.value, CAR_BOUNDS.price.max)), onKeyDown: blockSpecialNumeric, disabled: readOnly || loading }}
          toProps={{   type: "number", min: 0, max: CAR_BOUNDS.price.max, value: form.price_to_car,   onChange: e => set("price_to_car",   clampNum(e.target.value, CAR_BOUNDS.price.max)), onKeyDown: blockSpecialNumeric, disabled: readOnly || loading }}
          fromError={errors.price_from_car} toError={errors.price_to_car}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RangeField label={tr.mileage} required
          fromProps={{ type: "number", min: 0, max: CAR_BOUNDS.mileage.max, value: form.mileage_from_car, onChange: e => set("mileage_from_car", clampNum(e.target.value, CAR_BOUNDS.mileage.max)), onKeyDown: blockSpecialNumeric, disabled: readOnly || loading }}
          toProps={{   type: "number", min: 0, max: CAR_BOUNDS.mileage.max, value: form.mileage_to_car,   onChange: e => set("mileage_to_car",   clampNum(e.target.value, CAR_BOUNDS.mileage.max)), onKeyDown: blockSpecialNumeric, disabled: readOnly || loading }}
          fromError={errors.mileage_from_car} toError={errors.mileage_to_car}
        />
        <RangeField label={tr.power} required
          fromProps={{ type: "number", min: 0, max: CAR_BOUNDS.power.max, value: form.power_from_car, onChange: e => set("power_from_car", clampNum(e.target.value, CAR_BOUNDS.power.max)), onKeyDown: blockSpecialNumeric, disabled: readOnly || loading }}
          toProps={{   type: "number", min: 0, max: CAR_BOUNDS.power.max, value: form.power_to_car,   onChange: e => set("power_to_car",   clampNum(e.target.value, CAR_BOUNDS.power.max)), onKeyDown: blockSpecialNumeric, disabled: readOnly || loading }}
          fromError={errors.power_from_car} toError={errors.power_to_car}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MultiSelect label={tr.body} options={BODIES} selected={form.body_car}
          onChange={v => set("body_car", v)} disabled={readOnly || loading} />
        <MultiSelect label={tr.gearbox} options={GEARBOXES} selected={form.gearbox_car}
          onChange={v => set("gearbox_car", v)} disabled={readOnly || loading} />
        <MultiSelect label={tr.drive} options={DRIVES} selected={form.drive_car}
          onChange={v => set("drive_car", v)} disabled={readOnly || loading} />
      </div>

      <Textarea label={tr.comment} placeholder={tr.commentPlaceholder}
        value={readOnly ? translateDesc(form.description, lang) : form.description}
        onChange={e => set("description", e.target.value)}
        disabled={readOnly || loading}
      />

      {!readOnly && <SubmitBtn loading={loading} label={tr.submit} loadingLabel={tr.submitting} />}
    </form>
  );
}
