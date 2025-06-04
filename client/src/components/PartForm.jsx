import React, { useState, useEffect } from "react";

const COUNTRIES = ["Китай", "Корея", "Япония"];
const BODIES = [
  "Седан",
  "Хэтчбек",
  "Универсал",
  "Кроссовер",
  "Внедорожник",
  "Купе",
  "Минивэн",
  "Пикап",
  "Лифтбек",
  "Кабриолет",
  "Фургон",
];

export default function PartForm({
  onSubmit,
  loading,
  initialData = null,
  onCancel = null,
  onClose = null,
  readOnly = false
}) {
  const [form, setForm] = useState({
    part_name: "",
    country_part: "",
    brand_part: "",
    model_part: "",
    body_part: "",
    price_from_part: "",
    price_to_part: "",
    description: "",
  });

  const [errors, setErrors] = useState({});

  // При монтировании или изменении initialData обновляем форму
  useEffect(() => {
    if (initialData) {
      setForm({
        part_name: initialData.part_name || "",
        country_part: initialData.country_part || "",
        brand_part: initialData.brand_part || "",
        model_part: initialData.model_part || "",
        body_part: initialData.body_part || "",
        price_from_part: initialData.price_from_part != null ? String(initialData.price_from_part) : "",
        price_to_part: initialData.price_to_part != null ? String(initialData.price_to_part) : "",
        description: initialData.description || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!readOnly) {
      if (!form.part_name.trim()) errs.part_name = "Введите название запчасти";
      if (!form.country_part) errs.country_part = "Выберите страну";
      if (!form.brand_part.trim()) errs.brand_part = "Введите марку";
      if (!form.body_part) errs.body_part = "Выберите кузов";

      if (!form.price_from_part.trim()) {
        errs.price_from_part = "Введите минимальную цену";
      } else if (isNaN(Number(form.price_from_part)) || Number(form.price_from_part) < 0) {
        errs.price_from_part = "Минимальная цена должна быть положительным числом";
      }

      if (!form.price_to_part.trim()) {
        errs.price_to_part = "Введите максимальную цену";
      } else if (isNaN(Number(form.price_to_part)) || Number(form.price_to_part) < 0) {
        errs.price_to_part = "Максимальная цена должна быть положительным числом";
      }

      if (
        !errs.price_from_part &&
        !errs.price_to_part &&
        Number(form.price_from_part) > Number(form.price_to_part)
      ) {
        errs.price_to_part = "Максимальная цена должна быть больше или равна минимальной";
      }
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSubmit({
        ...form,
        price_from_part: Number(form.price_from_part),
        price_to_part: Number(form.price_to_part),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4">
      {/* Название запчасти */}
      <div>
        <label className="block font-semibold mb-1">Запчасть (обязательно):</label>
        <input
          type="text"
          name="part_name"
          value={form.part_name}
          onChange={handleChange}
          disabled={loading || readOnly}
          className="border p-2 w-full"
          placeholder="Например, Амортизатор"
        />
        {errors.part_name && <p className="text-red-600 text-sm mt-1">{errors.part_name}</p>}
      </div>

      {/* Страна */}
      <div>
        <label className="block font-semibold mb-1">Страна (обязательно):</label>
        <select
          name="country_part"
          value={form.country_part}
          onChange={handleChange}
          disabled={loading || readOnly}
          className="border p-2 w-full"
        >
          <option value="">-- Выберите страну --</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.country_part && (
          <p className="text-red-600 text-sm mt-1">{errors.country_part}</p>
        )}
      </div>

      {/* Марка */}
      <div>
        <label className="block font-semibold mb-1">Марка (обязательно):</label>
        <input
          type="text"
          name="brand_part"
          value={form.brand_part}
          onChange={handleChange}
          disabled={loading || readOnly}
          className="border p-2 w-full"
          placeholder="Например, Toyota"
        />
        {errors.brand_part && <p className="text-red-600 text-sm mt-1">{errors.brand_part}</p>}
      </div>

      {/* Модель */}
      <div>
        <label className="block font-semibold mb-1">Модель (необязательно):</label>
        <input
          type="text"
          name="model_part"
          value={form.model_part}
          onChange={handleChange}
          disabled={loading || readOnly}
          className="border p-2 w-full"
          placeholder="Например, Camry"
        />
      </div>

      {/* Кузов */}
      <div>
        <label className="block font-semibold mb-1">Кузов (обязательно):</label>
        <select
          name="body_part"
          value={form.body_part}
          onChange={handleChange}
          disabled={loading || readOnly}
          className="border p-2 w-full"
        >
          <option value="">-- Выберите кузов --</option>
          {BODIES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        {errors.body_part && <p className="text-red-600 text-sm mt-1">{errors.body_part}</p>}
      </div>

      {/* Цены */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block font-semibold mb-1">Цена от (обязательно):</label>
          <input
            type="number"
            name="price_from_part"
            value={form.price_from_part}
            onChange={handleChange}
            disabled={loading || readOnly}
            className="border p-2 w-full"
            placeholder="Минимум"
            min="0"
            step="any"
          />
          {errors.price_from_part && (
            <p className="text-red-600 text-sm mt-1">{errors.price_from_part}</p>
          )}
        </div>
        <div className="flex-1">
          <label className="block font-semibold mb-1">Цена до (обязательно):</label>
          <input
            type="number"
            name="price_to_part"
            value={form.price_to_part}
            onChange={handleChange}
            disabled={loading || readOnly}
            className="border p-2 w-full"
            placeholder="Максимум"
            min="0"
            step="any"
          />
          {errors.price_to_part && (
            <p className="text-red-600 text-sm mt-1">{errors.price_to_part}</p>
          )}
        </div>
      </div>

      {/* Описание */}
      <div>
        <label className="block font-semibold mb-1">Описание (необязательно):</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          disabled={loading || readOnly}
          className="border p-2 w-full"
          rows={4}
          placeholder="Дополнительная информация"
        />
      </div>

      {/* Кнопки */}
      <div className="flex gap-4">
        {!readOnly && (
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Отправка..." : "Отправить заявку"}
          </button>
        )}

        {(onClose || onCancel) && (
          <button
            type="button"
            onClick={onClose || onCancel}
            disabled={loading}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Закрыть
          </button>
        )}
      </div>
    </form>
  );
}