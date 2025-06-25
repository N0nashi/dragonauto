import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MainFrame2() {
  const [tab, setTab] = useState("cars");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % list.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isMobile, activeIndex, tab]);

  const cars = [
    { id: 1, brand: "Toyota", model: "Camry", year: 2019, price: 2500000, photo_url: "/camry.webp" },
    { id: 2, brand: "Honda", model: "Accord", year: 2020, price: 150000, photo_url: "/accord.webp" },
    { id: 3, brand: "Kia", model: "Sportage", year: 2021, price: 1200000, photo_url: "/sportage.webp" },
    { id: 4, brand: "Hyundai", model: "Tucson", year: 2020, price: 1600000, photo_url: "/tuscon.webp" },
    { id: 5, brand: "Mazda", model: "CX-5", year: 2022, price: 1700000, photo_url: "/cx-5.png" },
    { id: 6, brand: "Nissan", model: "Qashqai", year: 2018, price: 1300000, photo_url: "/qashqai.webp" },
    { id: 7, brand: "Haval", model: "Jolion", year: 2024, price: 2550000, photo_url: "/haval.png" }
  ];

  const parts = [
    { id: 1, name: "Фильтр масляный", price: 1200, photo_url: "/фильтр.webp" },
    { id: 2, name: "Тормозные колодки", price: 3000, photo_url: "/колодки.webp" },
    { id: 3, name: "Аккумулятор", price: 7000, photo_url: "/аккум.webp" },
    { id: 4, name: "Фара левая", price: 8500, photo_url: "/фара.webp" },
    { id: 5, name: "Свечи зажигания", price: 2000, photo_url: "/свечи.webp" }
  ];

  const list = tab === "cars" ? cars : parts;

  const renderCard = (item) => (
    <div
      key={item.id}
      className="bg-[#00355B] border border-gray-200 rounded-lg shadow-md overflow-hidden flex-shrink-0 w-full sm:w-72"
    >
      <img
        src={item.photo_url}
        alt={item.name || `${item.brand} ${item.model}`}
        className="w-full h-40 object-cover"
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
  );

    return (
    <section className="py-10 bg-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Рекомендуем</h2>

        {/* Переключатель */}
        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={() => {
              setTab("cars");
              setActiveIndex(0);
            }}
            className={`px-4 py-2 rounded-full font-medium ${
              tab === "cars" ? "bg-[#00355B] text-white" : "bg-white text-gray-700 border"
            }`}
          >
            Популярные автомобили
          </button>
          <button
            onClick={() => {
              setTab("parts");
              setActiveIndex(0);
            }}
            className={`px-4 py-2 rounded-full font-medium ${
              tab === "parts" ? "bg-[#00355B] text-white" : "bg-white text-gray-700 border"
            }`}
          >
            Запчасти
          </button>
        </div>

        {/* Отображение карточек */}
        <div className="relative flex items-center justify-center overflow-hidden">
          <button
            onClick={() => setActiveIndex((prev) => (prev - 1 + list.length) % list.length)}
            className="absolute left-0 z-20 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
          >
            &larr;
          </button>

          {isMobile ? (
            <div className="w-full max-w-xs">{renderCard(list[activeIndex])}</div>
          ) : (
            <div className="flex gap-6 justify-center items-center">
              {[-1, 0, 1].map((offset) => {
                const index = (activeIndex + offset + list.length) % list.length;
                const isCenter = offset === 0;
                return (
                  <div
                    key={index}
                    className={`transition-all duration-300 ${
                      isCenter ? "scale-105 z-10" : "opacity-50"
                    }`}
                    style={{ flexShrink: 0, width: "300px" }}
                  >
                    {renderCard(list[index])}
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setActiveIndex((prev) => (prev + 1) % list.length)}
            className="absolute right-0 z-20 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
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
