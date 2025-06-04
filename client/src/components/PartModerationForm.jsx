import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function PartModerationForm({ initialData = null, onSubmit, onCancel, loading = false }) {
  const [form, setForm] = useState({
    part_name: "",
    country: "",
    brand: "",
    model: "",
    year: "",
    body: "",
    price: "",
    photo_url: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({
        part_name: initialData.part_name || "",
        country: initialData.country || "",
        brand: initialData.brand || "",
        model: initialData.model || "",
        year: initialData.year || "",
        body: initialData.body || "",
        price: initialData.price || "",
        photo_url: initialData.photo_url || "",
      });
      setPreviewUrl(initialData.photo_url || "");
    } else {
      setForm({
        part_name: "",
        country: "",
        brand: "",
        model: "",
        year: "",
        body: "",
        price: "",
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
    if (!form.part_name.trim()) newErrors.part_name = "Введите название запчасти";
    if (!form.country.trim()) newErrors.country = "Введите страну производства";
    if (!form.brand.trim()) newErrors.brand = "Введите марку автомобиля";
    if (!form.model.trim()) newErrors.model = "Введите модель автомобиля";
    if (!form.year) newErrors.year = "Введите год выпуска";
    if (form.year && (isNaN(form.year) || form.year < 1900 || form.year > new Date().getFullYear())) {
      newErrors.year = "Введите корректный год";
    }
    if (!form.body.trim()) newErrors.body = "Введите тип кузова";
    if (!form.price) newErrors.price = "Введите цену";
    if (form.price && (isNaN(form.price) || form.price < 0)) {
      newErrors.price = "Введите корректную цену";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    let photoUrl = form.photo_url;

    if (avatar) {
      const formData = new FormData();
      formData.append("file", avatar);

      try {
        const uploadRes = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/upload?folder=parts`,
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

    if (initialData?.id) {
      finalData.id = initialData.id;
    }

    onSubmit(finalData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="block font-semibold">Название запчасти (обязательно):</label>
          <input
            name="part_name"
            value={form.part_name}
            onChange={handleChange}
            className={`border p-2 w-full rounded ${errors.part_name ? "border-red-500" : ""}`}
            disabled={loading}
            placeholder="Например, Фара передняя"
          />
          {errors.part_name && <p className="text-red-600 text-sm">{errors.part_name}</p>}
        </div>

        <div className="space-y-1">
          <label className="block font-semibold">Страна (обязательно):</label>
          <input
            name="country"
            value={form.country}
            onChange={handleChange}
            className={`border p-2 w-full rounded ${errors.country ? "border-red-500" : ""}`}
            disabled={loading}
            placeholder="Например, Япония"
          />
          {errors.country && <p className="text-red-600 text-sm">{errors.country}</p>}
        </div>

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
          <label className="block font-semibold">Модель (обязательно):</label>
          <input
            name="model"
            value={form.model}
            onChange={handleChange}
            className={`border p-2 w-full rounded ${errors.model ? "border-red-500" : ""}`}
            disabled={loading}
            placeholder="Например, Camry"
          />
          {errors.model && <p className="text-red-600 text-sm">{errors.model}</p>}
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
          <label className="block font-semibold">Тип кузова (обязательно):</label>
          <input
            name="body"
            value={form.body}
            onChange={handleChange}
            className={`border p-2 w-full rounded ${errors.body ? "border-red-500" : ""}`}
            disabled={loading}
            placeholder="Например, Седан"
          />
          {errors.body && <p className="text-red-600 text-sm">{errors.body}</p>}
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