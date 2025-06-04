import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const COUNTRIES = ["Китай", "Корея", "Япония"];
const DRIVES = ["Задний", "Передний", "4WD"];
const GEARBOXES = ["АКПП", "Вариатор", "Робот", "Механика"];
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

function SelectDropdown({ label, options, value, onChange, disabled }) {
  return (
    <div className="space-y-1">
      <label className="block font-semibold">{label}:</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="border p-2 w-full rounded"
      >
        <option value="">Не выбрано</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function CarForm({ initialData = null, onSubmit, onCancel, loading = false }) {
  const [form, setForm] = useState({
    country: "",
    brand: "",
    model: "",
    year: "",
    price: "",
    drive: "",
    gearbox: "",
    body: "",
    mileage: "",
    engine_power: "",
    description: "",
    photo_url: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});

  // Инициализация формы при получении данных
  useEffect(() => {
    if (initialData) {
      setForm({
        country: initialData.country || "",
        brand: initialData.brand || "",
        model: initialData.model || "",
        year: initialData.year || "",
        price: initialData.price || "",
        drive: initialData.drive || "",
        gearbox: initialData.gearbox || "",
        body: initialData.body || "",
        mileage: initialData.mileage || "",
        engine_power: initialData.engine_power || "",
        description: initialData.description || "",
        photo_url: initialData.photo_url || "",
      });
      setPreviewUrl(initialData.photo_url || "");
    } else {
      // Сброс формы при добавлении нового автомобиля
      setForm({
        country: "",
        brand: "",
        model: "",
        year: "",
        price: "",
        drive: "",
        gearbox: "",
        body: "",
        mileage: "",
        engine_power: "",
        description: "",
        photo_url: "",
      });
      setPreviewUrl("");
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.country) newErrors.country = "Выберите страну";
    if (!form.brand.trim()) newErrors.brand = "Введите марку автомобиля";
    if (!form.year) newErrors.year = "Введите год выпуска";
    if (form.year && (isNaN(form.year) || form.year < 1900 || form.year > new Date().getFullYear())) {
      newErrors.year = "Введите корректный год";
    }
    if (!form.price) newErrors.price = "Введите цену";
    if (form.price && (isNaN(form.price) || form.price < 0)) {
      newErrors.price = "Введите корректную цену";
    }
    if (form.mileage && (isNaN(form.mileage) || form.mileage < 0)) {
      newErrors.mileage = "Введите корректный пробег";
    }
    if (form.engine_power && (isNaN(form.engine_power) || form.engine_power < 0)) {
      newErrors.engine_power = "Введите корректную мощность";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    let photoUrl = form.photo_url;

    // Если загружено новое фото — загружаем его на сервер
    if (avatar) {
      const formData = new FormData();
      formData.append("file", avatar);

      try {
        const uploadRes = await axios.post(
          "http://localhost:5000/api/upload?folder=cars",
          formData
        );
        photoUrl = uploadRes.data.url;
      } catch (err) {
        toast.error("Ошибка загрузки фото");
        return;
      }
    }

    const finalData = {
      ...form,
      photo_url: photoUrl,
    };

    // Добавляем id, если это редактирование
    if (initialData?.id) {
      finalData.id = initialData.id;
    }

    onSubmit(finalData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SelectDropdown
          label="Страна (обязательно)"
          options={COUNTRIES}
          value={form.country}
          onChange={(val) => setForm((prev) => ({ ...prev, country: val }))}
          disabled={loading}
        />
        <div className="space-y-1">
          <label className="block font-semibold">Марка (обязательно):</label>
          <input
            name="brand"
            value={form.brand}
            onChange={handleChange}
            className={`border p-2 w-full rounded ${errors.brand ? "border-red-500" : ""}`}
            disabled={loading}
            placeholder="Например, Toyota"
          />
          {errors.brand && <p className="text-red-600 text-sm">{errors.brand}</p>}
        </div>
        <div className="space-y-1">
          <label className="block font-semibold">Модель:</label>
          <input
            name="model"
            value={form.model}
            onChange={handleChange}
            className="border p-2 w-full rounded"
            disabled={loading}
            placeholder="Например, Camry"
          />
        </div>
        <div className="space-y-1">
          <label className="block font-semibold">Год выпуска (обязательно):</label>
          <input
            name="year"
            value={form.year}
            onChange={handleChange}
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            className={`border p-2 w-full rounded ${errors.year ? "border-red-500" : ""}`}
            disabled={loading}
          />
          {errors.year && <p className="text-red-600 text-sm">{errors.year}</p>}
        </div>
        <div className="space-y-1">
          <label className="block font-semibold">Цена (обязательно):</label>
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            type="number"
            min="0"
            className={`border p-2 w-full rounded ${errors.price ? "border-red-500" : ""}`}
            disabled={loading}
          />
          {errors.price && <p className="text-red-600 text-sm">{errors.price}</p>}
        </div>
        <SelectDropdown
          label="Привод"
          options={DRIVES}
          value={form.drive}
          onChange={(val) => setForm((prev) => ({ ...prev, drive: val }))}
          disabled={loading}
        />
        <SelectDropdown
          label="Коробка передач"
          options={GEARBOXES}
          value={form.gearbox}
          onChange={(val) => setForm((prev) => ({ ...prev, gearbox: val }))}
          disabled={loading}
        />
        <SelectDropdown
          label="Тип кузова"
          options={BODIES}
          value={form.body}
          onChange={(val) => setForm((prev) => ({ ...prev, body: val }))}
          disabled={loading}
        />
        <div className="space-y-1">
          <label className="block font-semibold">Пробег (км):</label>
          <input
            name="mileage"
            value={form.mileage}
            onChange={handleChange}
            type="number"
            min="0"
            className={`border p-2 w-full rounded ${errors.mileage ? "border-red-500" : ""}`}
            disabled={loading}
          />
          {errors.mileage && <p className="text-red-600 text-sm">{errors.mileage}</p>}
        </div>
        <div className="space-y-1">
          <label className="block font-semibold">Мощность двигателя (л.с.):</label>
          <input
            name="engine_power"
            value={form.engine_power}
            onChange={handleChange}
            type="number"
            min="0"
            className={`border p-2 w-full rounded ${errors.engine_power ? "border-red-500" : ""}`}
            disabled={loading}
          />
          {errors.engine_power && <p className="text-red-600 text-sm">{errors.engine_power}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-semibold">Фото:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
          className="w-full px-3 py-2 border rounded"
        />
        {previewUrl && (
          <div className="mt-2">
            <img src={previewUrl} alt="Предпросмотр" className="max-h-48 rounded" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label className="block font-semibold">Описание:</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          disabled={loading}
          className="border p-2 w-full resize-y rounded"
          placeholder="Дополнительная информация"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </form>
  );
}