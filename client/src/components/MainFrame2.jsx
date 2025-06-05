import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MainFrame2() {
  const [activeIndex, setActiveIndex] = useState(1);
  const [tab, setTab] = useState("cars");
  const navigate = useNavigate();

  const cars = [
    { id: 1, brand: "Toyota", model: "Camry", year: 2019, price: 2500000, photo_url: "url('/camry.webp')" },
    { id: 2, brand: "Honda", model: "Accord", year: 2020, price: 150000, photo_url: "/images/car-placeholder.png" },
    { id: 3, brand: "Kia", model: "Sportage", year: 2021, price: 1200000, photo_url: "/images/car-placeholder.png" },
    { id: 4, brand: "Hyundai", model: "Tucson", year: 2020, price: 1600000, photo_url: "/images/car-placeholder.png" },
    { id: 5, brand: "Mazda", model: "CX-5", year: 2022, price: 1700000, photo_url: "/images/car-placeholder.png" },
    { id: 6, brand: "Nissan", model: "Qashqai", year: 2018, price: 1300000, photo_url: "/images/car-placeholder.png" },
    { id: 7, brand: "Haval", model: "Jolion", year: 2024, price: 2550000, photo_url: "/images/car-placeholder.png" }
  ];

  const parts = [
    { id: 1, name: "Фильтр масляный", price: 1200, photo_url: "/images/part-placeholder.png" },
    { id: 2, name: "Тормозные колодки", price: 3000, photo_url: "/images/part-placeholder.png" },
    { id: 3, name: "Аккумулятор", price: 7000, photo_url: "/images/part-placeholder.png" },
    { id: 4, name: "Фара левая", price: 8500, photo_url: "/images/part-placeholder.png" },
    { id: 5, name: "Свечи зажигания", price: 2000, photo_url: "/images/part-placeholder.png" }
  ];

  const list = tab === "cars" ? cars : parts;

  const next = () => {
    setActiveIndex((prev) => (prev + 1) % list.length);
  };

  const prev = () => {
    setActiveIndex((prev) => (prev - 1 + list.length) % list.length);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      next();
    }, 4000);
    return () => clearInterval(interval);
  }, [list, activeIndex]);

  const getDisplayItems = () => {
    const total = list.length;
    const center = activeIndex;
    const left = (center - 1 + total) % total;
    const right = (center + 1) % total;
    return [list[left], list[center], list[right]];
  };

  return (
    <section className="py-10 bg-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Рекомендуем</h2>

        {/* Переключатель */}
        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={() => setTab("cars")}
            className={`px-4 py-2 rounded-full font-medium ${
              tab === "cars" ? "bg-[#00355B] text-white" : "bg-white text-gray-700 border"
            }`}
          >
            Популярные автомобили
          </button>
          <button
            onClick={() => setTab("parts")}
            className={`px-4 py-2 rounded-full font-medium ${
              tab === "parts" ? "bg-[#00355B] text-white" : "bg-white text-gray-700 border"
            }`}
          >
            Запчасти
          </button>
        </div>

        {/* Карусель */}
        <div className="relative flex items-center justify-center">
          <button
            onClick={prev}
            className="absolute left-0 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition"
          >
            &larr;
          </button>

          <div className="flex gap-6 justify-center items-center">
            {getDisplayItems().map((item, idx) => (
              <div
                key={item.id}
                className={`w-72 bg-[#00355B] border border-gray-200 rounded-lg shadow-md transition-all duration-500 transform 
                ${idx === 1 ? "scale-110 z-10 opacity-100 shadow-lg" : "scale-95 opacity-50"}`}
              >
                <img
                  src={item.photo_url}
                  alt={item.name || `${item.brand} ${item.model}`}
                  className="w-full h-40 object-cover rounded-t-lg"
                />
                <div className="p-4 text-white">
                  {tab === "cars" ? (
                    <>
                      <h3 className="font-semibold text-lg">{item.brand} {item.model}</h3>
                      <p className="text-sm text-gray-300">Год: {item.year}</p>
                      <p className="text-white font-bold mt-2">от {item.price.toLocaleString()} ₽</p>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-white font-bold mt-2">от {item.price.toLocaleString()} ₽</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={next}
            className="absolute right-0 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition"
          >
            &rarr;
          </button>
        </div>

        {/* Кнопка в каталог */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate("/catalog")}
            className="px-6 py-3 bg-[#00355B] text-white rounded-full text-lg shadow-md hover:bg-[#002A48] transition"
          >
            Перейти в каталог
          </button>
        </div>
      </div>
    </section>
  );
}
