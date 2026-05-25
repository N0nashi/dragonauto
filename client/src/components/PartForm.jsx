import React, { useState, useEffect } from "react";
import { toast } from "../utils/toast";
import { Input, SingleSelect, RangeField, Textarea, SubmitBtn } from "./ui/FormFields";
import { COUNTRIES, BODIES } from "../constants/catalog";
import { useLang } from "../context/LangContext";
import { translateDesc } from "../utils/translateDesc";

export default function PartForm({ onSubmit, loading, initialData = null, readOnly = false }) {
  const { t, lang } = useLang();
  const tr = t.partForm;

  const [form, setForm] = useState({
    part_name:      "",
    country_part:   "",
    brand_part:     "",
    model_part:     "",
    body_part:      "",
    price_from_part: "",
    price_to_part:   "",
    description:    "",
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!initialData) return;
    setForm({
      part_name:       initialData.part_name       || "",
      country_part:    initialData.country_part    || "",
      brand_part:      initialData.brand_part      || "",
      model_part:      initialData.model_part      || "",
      body_part:       initialData.body_part       || "",
      price_from_part: initialData.price_from_part != null ? String(initialData.price_from_part) : "",
      price_to_part:   initialData.price_to_part   != null ? String(initialData.price_to_part)   : "",
      description:     initialData.description     || "",
    });
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (!form.part_name.trim())  e.part_name    = tr.errors.name;
    if (!form.country_part)      e.country_part = tr.errors.country;
    if (!form.brand_part.trim()) e.brand_part   = tr.errors.brand;
    if (!form.body_part)         e.body_part    = tr.errors.body;

    const num = v => v !== "" && !isNaN(Number(v)) && Number(v) >= 0;
    if (!num(form.price_from_part)) e.price_from_part = tr.errors.priceFrom;
    if (!num(form.price_to_part))   e.price_to_part   = tr.errors.priceTo;
    else if (+form.price_to_part < +form.price_from_part) e.price_to_part = tr.errors.priceToLess;
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error(tr.errors.required, { autoClose: 3000 });
      return;
    }
    onSubmit({ ...form, price_from_part: Number(form.price_from_part), price_to_part: Number(form.price_to_part) });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      <Input label={tr.partName} required placeholder={tr.partNamePlaceholder}
        value={form.part_name} onChange={e => set("part_name", e.target.value)}
        error={errors.part_name} disabled={readOnly || loading}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SingleSelect label={tr.country} required
          options={COUNTRIES} value={form.country_part}
          onChange={v => set("country_part", v)}
          error={errors.country_part} disabled={readOnly || loading}
        />
        <Input label={tr.carBrand} required placeholder="Toyota"
          value={form.brand_part} onChange={e => set("brand_part", e.target.value)}
          error={errors.brand_part} disabled={readOnly || loading}
        />
        <Input label={tr.carModel} placeholder="Land Cruiser"
          value={form.model_part} onChange={e => set("model_part", e.target.value)}
          disabled={readOnly || loading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SingleSelect label={tr.body} required
          options={BODIES} value={form.body_part}
          onChange={v => set("body_part", v)}
          error={errors.body_part} disabled={readOnly || loading}
        />
        <RangeField label={tr.price} required
          fromProps={{ type: "number", min: 0, value: form.price_from_part, onChange: e => set("price_from_part", e.target.value), disabled: readOnly || loading }}
          toProps={{   type: "number", min: 0, value: form.price_to_part,   onChange: e => set("price_to_part",   e.target.value), disabled: readOnly || loading }}
          fromError={errors.price_from_part} toError={errors.price_to_part}
        />
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
