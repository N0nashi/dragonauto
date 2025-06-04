import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  "Фургон"
];

function MultiSelectDropdown({ label, options, selected, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const selectedLabel =
    selected.length === 0 ? `Выберите ${label.toLowerCase()}` : selected.join(", ");
  const toggleOpen = () => {
    if (!disabled) setOpen((v) => !v);
  };
  const onCheck = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter((v) => v !== option));
    } else {
      onChange([...selected, option]);
    }
  };
  return (
    <div className="relative">
      <div
        onClick={toggleOpen}
        className={`border p-2 cursor-pointer select-none ${
          disabled ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
      >
        <span className="block font-semibold">{label}</span>
        <span className="text-sm text-gray-600">{selectedLabel}</span>
      </div>
      {open && !disabled && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded border bg-white shadow-lg">
          {options.map((option) => (
            <label key={option} className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => onCheck(option)}
                className="mr-2"
                disabled={disabled}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CarForm({
  onSubmit,
  loading,
  initialData = null,
  onCancel = null,
  onClose = null,
  readOnly = false
}) {
  const [form, setForm] = useState({
    type: "car",
    country_car: [],
    brand_car: "",
    model_car: "",
    year_from_car: "",
    year_to_car: "",
    price_from_car: "",
    price_to_car: "",
    drive_car: [],
    gearbox_car: [],
    body_car: [],
    mileage_from_car: "",
    mileage_to_car: "",
    power_from_car: "",
    power_to_car: "",
    description: ""
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
        country_car: initialData.country_car || [],
        brand_car: Array.isArray(initialData.brand_car)
          ? initialData.brand_car[0] || ""
          : initialData.brand_car || "",
        model_car: initialData.model_car || "",
        year_from_car: initialData.year_from_car || "",
        year_to_car: initialData.year_to_car || "",
        price_from_car: initialData.price_from_car || "",
        price_to_car: initialData.price_to_car || "",
        drive_car: initialData.drive_car || [],
        gearbox_car: initialData.gearbox_car || [],
        body_car: initialData.body_car || [],
        mileage_from_car: initialData.mileage_from_car || "",
        mileage_to_car: initialData.mileage_to_car || "",
        power_from_car: initialData.power_from_car || "",
        power_to_car: initialData.power_to_car || "",
        description: initialData.description || ""
      }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!readOnly) {
      if (form.country_car.length === 0)
        newErrors.country_car = "Выберите хотя бы одну страну";
      if (!form.brand_car.trim()) newErrors.brand_car = "Введите марку автомобиля";

      // Цена
      if (
        form.price_from_car === "" ||
        isNaN(Number(form.price_from_car)) ||
        Number(form.price_from_car) < 0
      ) {
        newErrors.price_from_car = "Введите корректную минимальную цену";
      }
      if (
        form.price_to_car === "" ||
        isNaN(Number(form.price_to_car)) ||
        Number(form.price_to_car) < 0
      ) {
        newErrors.price_to_car = "Введите корректную максимальную цену";
      } else if (Number(form.price_to_car) < Number(form.price_from_car)) {
        newErrors.price_to_car = "Максимальная цена не может быть меньше минимальной";
      }

      // Год выпуска
      if (
        form.year_from_car !== "" &&
        (isNaN(Number(form.year_from_car)) || Number(form.year_from_car) < 1900)
      ) {
        newErrors.year_from_car = "Введите корректный год";
      }
      if (
        form.year_to_car !== "" &&
        (isNaN(Number(form.year_to_car)) || Number(form.year_to_car) < 1900)
      ) {
        newErrors.year_to_car = "Введите корректный год";
      } else if (
        form.year_from_car !== "" &&
        form.year_to_car !== "" &&
        Number(form.year_to_car) < Number(form.year_from_car)
      ) {
        newErrors.year_to_car = "Год 'до' не может быть меньше года 'от'";
      }

      // Пробег
      if (
        form.mileage_from_car !== "" &&
        (isNaN(Number(form.mileage_from_car)) || Number(form.mileage_from_car) < 0)
      ) {
        newErrors.mileage_from_car = "Введите корректный пробег";
      }
      if (
        form.mileage_to_car !== "" &&
        (isNaN(Number(form.mileage_to_car)) || Number(form.mileage_to_car) < 0)
      ) {
        newErrors.mileage_to_car = "Введите корректный пробег";
      } else if (
        form.mileage_from_car !== "" &&
        form.mileage_to_car !== "" &&
        Number(form.mileage_to_car) < Number(form.mileage_from_car)
      ) {
        newErrors.mileage_to_car = "Пробег 'до' не может быть меньше 'от'";
      }

      // Мощность
      if (
        form.power_from_car !== "" &&
        (isNaN(Number(form.power_from_car)) || Number(form.power_from_car) < 0)
      ) {
        newErrors.power_from_car = "Введите корректную мощность";
      }
      if (
        form.power_to_car !== "" &&
        (isNaN(Number(form.power_to_car)) || Number(form.power_to_car) < 0)
      ) {
        newErrors.power_to_car = "Введите корректную мощность";
      } else if (
        form.power_from_car !== "" &&
        form.power_to_car !== "" &&
        Number(form.power_to_car) < Number(form.power_from_car)
      ) {
        newErrors.power_to_car = "Мощность 'до' не может быть меньше 'от'";
      }
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSubmit(form);
    } else {
      toast.error("Исправьте ошибки в форме");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4">
        {/* Страна */}
        <div>
          <MultiSelectDropdown
            label="Страна (обязательно)"
            options={COUNTRIES}
            selected={form.country_car}
            onChange={(vals) => setForm((prev) => ({ ...prev, country_car: vals }))}
            disabled={loading || readOnly}
          />
          {errors.country_car && (
            <p className="text-red-600 text-sm mt-1">{errors.country_car}</p>
          )}
        </div>

        {/* Марка */}
        <div>
          <label className="block font-semibold mb-1">Марка (обязательно):</label>
          <input
            name="brand_car"
            value={form.brand_car}
            onChange={handleChange}
            className="border p-2 w-full"
            disabled={loading || readOnly}
            placeholder="Например, Toyota"
          />
          {errors.brand_car && (
            <p className="text-red-600 text-sm mt-1">{errors.brand_car}</p>
          )}
        </div>

        {/* Модель */}
        <div>
          <label className="block font-semibold mb-1">Модель (необязательно):</label>
          <input
            name="model_car"
            value={form.model_car}
            onChange={handleChange}
            className="border p-2 w-full"
            disabled={loading || readOnly}
            placeholder="Например, Camry"
          />
        </div>

        {/* Год выпуска */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-semibold mb-1">Год выпуска от:</label>
            <input
              name="year_from_car"
              value={form.year_from_car}
              onChange={handleChange}
              className="border p-2 w-full"
              disabled={loading || readOnly}
              placeholder="2000"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
            />
            {errors.year_from_car && (
              <p className="text-red-600 text-sm mt-1">{errors.year_from_car}</p>
            )}
          </div>
          <div className="flex-1">
            <label className="block font-semibold mb-1">Год выпуска до:</label>
            <input
              name="year_to_car"
              value={form.year_to_car}
              onChange={handleChange}
              className="border p-2 w-full"
              disabled={loading || readOnly}
              placeholder={new Date().getFullYear().toString()}
              type="number"
              min="1900"
              max={new Date().getFullYear()}
            />
            {errors.year_to_car && (
              <p className="text-red-600 text-sm mt-1">{errors.year_to_car}</p>
            )}
          </div>
        </div>

        {/* Цена */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-semibold mb-1">Цена от (₽, обязательно):</label>
            <input
              name="price_from_car"
              value={form.price_from_car}
              onChange={handleChange}
              className="border p-2 w-full"
              disabled={loading || readOnly}
              placeholder="100000"
              type="number"
              min="0"
            />
            {errors.price_from_car && (
              <p className="text-red-600 text-sm mt-1">{errors.price_from_car}</p>
            )}
          </div>
          <div className="flex-1">
            <label className="block font-semibold mb-1">Цена до (₽, обязательно):</label>
            <input
              name="price_to_car"
              value={form.price_to_car}
              onChange={handleChange}
              className="border p-2 w-full"
              disabled={loading || readOnly}
              placeholder="500000"
              type="number"
              min="0"
            />
            {errors.price_to_car && (
              <p className="text-red-600 text-sm mt-1">{errors.price_to_car}</p>
            )}
          </div>
        </div>

        {/* Пробег */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-semibold mb-1">Пробег от (км, необязательно):</label>
            <input
              name="mileage_from_car"
              value={form.mileage_from_car}
              onChange={handleChange}
              className="border p-2 w-full"
              disabled={loading || readOnly}
              placeholder="0"
              type="number"
              min="0"
            />
            {errors.mileage_from_car && (
              <p className="text-red-600 text-sm mt-1">{errors.mileage_from_car}</p>
            )}
          </div>
          <div className="flex-1">
            <label className="block font-semibold mb-1">Пробег до (км, необязательно):</label>
            <input
              name="mileage_to_car"
              value={form.mileage_to_car}
              onChange={handleChange}
              className="border p-2 w-full"
              disabled={loading || readOnly}
              placeholder="100000"
              type="number"
              min="0"
            />
            {errors.mileage_to_car && (
              <p className="text-red-600 text-sm mt-1">{errors.mileage_to_car}</p>
            )}
          </div>
        </div>

        {/* Мощность двигателя */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-semibold mb-1">Мощность от (л.с., необязательно):</label>
            <input
              name="power_from_car"
              value={form.power_from_car}
              onChange={handleChange}
              className="border p-2 w-full"
              disabled={loading || readOnly}
              placeholder="80"
              type="number"
              min="0"
            />
            {errors.power_from_car && (
              <p className="text-red-600 text-sm mt-1">{errors.power_from_car}</p>
            )}
          </div>
          <div className="flex-1">
            <label className="block font-semibold mb-1">Мощность до (л.с., необязательно):</label>
            <input
              name="power_to_car"
              value={form.power_to_car}
              onChange={handleChange}
              className="border p-2 w-full"
              disabled={loading || readOnly}
              placeholder="300"
              type="number"
              min="0"
            />
            {errors.power_to_car && (
              <p className="text-red-600 text-sm mt-1">{errors.power_to_car}</p>
            )}
          </div>
        </div>

        {/* Привод */}
        <div>
          <MultiSelectDropdown
            label="Привод (необязательно)"
            options={DRIVES}
            selected={form.drive_car}
            onChange={(vals) => setForm((prev) => ({ ...prev, drive_car: vals }))}
            disabled={loading || readOnly}
          />
        </div>

        {/* Коробка передач */}
        <div>
          <MultiSelectDropdown
            label="Коробка передач (необязательно)"
            options={GEARBOXES}
            selected={form.gearbox_car}
            onChange={(vals) => setForm((prev) => ({ ...prev, gearbox_car: vals }))}
            disabled={loading || readOnly}
          />
        </div>

        {/* Кузов */}
        <div>
          <MultiSelectDropdown
            label="Кузов (необязательно)"
            options={BODIES}
            selected={form.body_car}
            onChange={(vals) => setForm((prev) => ({ ...prev, body_car: vals }))}
            disabled={loading || readOnly}
          />
        </div>

        {/* Описание */}
        <div>
          <label className="block font-semibold mb-1">Описание (необязательно):</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="border p-2 w-full resize-y"
            rows={4}
            disabled={loading || readOnly}
            placeholder="Дополнительная информация о вашем запросе"
          />
        </div>

        {/* Кнопки */}
        <div className="flex gap-4">
          {!readOnly && (
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Отправка..." : "Отправить"}
            </button>
          )}

          {(onClose || onCancel) && (
            <button
              type="button"
              onClick={onClose || onCancel}
              disabled={loading}
              className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Закрыть
            </button>
          )}
        </div>
      </form>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}