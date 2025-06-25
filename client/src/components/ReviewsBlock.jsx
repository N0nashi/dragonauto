import React, { useEffect, useState } from "react";

const reviews = [
  {
    id: 1,
    text: "Отличный сервис! Быстро помогли подобрать нужные запчасти.",
    author: "Иван Петров",
  },
  {
    id: 2,
    text: "Очень доволен покупкой автомобиля через этот каталог. Все честно и прозрачно.",
    author: "Елена Смирнова",
  },
  {
    id: 3,
    text: "Поддержка всегда на связи и быстро отвечает на вопросы.",
    author: "Алексей Кузнецов",
  },
  {
    id: 4,
    text: "Удобный интерфейс и широкий выбор автомобилей.",
    author: "Мария Иванова",
  },
  {
    id: 5,
    text: "Хорошие цены и оперативная доставка запчастей.",
    author: "Дмитрий Соколов",
  },
];

export default function ReviewsCarousel() {
  const [activeIndex, setActiveIndex] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  const updateIsMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  useEffect(() => {
    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  const next = () => {
    setActiveIndex((prev) => (prev + 1) % reviews.length);
  };

  const prev = () => {
    setActiveIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      next();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getDisplayItems = () => {
    const total = reviews.length;
    const center = activeIndex;
    const left = (center - 1 + total) % total;
    const right = (center + 1) % total;
    return [reviews[left], reviews[center], reviews[right]];
  };

  const renderCard = (item, highlight = false) => (
    <div
      key={item.id}
      className={`w-80 bg-white border border-[#00355B] rounded-lg shadow-md text-[#00355B] p-6 transition-all duration-500 transform
        ${highlight ? "scale-110 z-10 opacity-100 shadow-lg" : "scale-95 opacity-70"}
      `}
    >
      <p className="mb-4 text-lg italic">&quot;{item.text}&quot;</p>
      <p className="font-semibold text-right">— {item.author}</p>
    </div>
  );

  return (
    <section className="py-10 bg-[#00355B]">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">
          Отзывы наших клиентов
        </h2>

        <div className="relative flex items-center justify-center">
          {/* Левая стрелка */}
          <button
            onClick={prev}
            className="absolute left-0 lg:-translate-x-full z-20 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition"
            aria-label="Предыдущий отзыв"
          >
            &larr;
          </button>

          {/* Карточки */}
          {isMobile ? (
            <div className="w-full flex justify-center px-12">
              {renderCard(reviews[activeIndex], true)}
            </div>
          ) : (
            <div className="flex gap-6 justify-center items-center px-12">
              {getDisplayItems().map((item, idx) => renderCard(item, idx === 1))}
            </div>
          )}

          {/* Правая стрелка */}
          <button
            onClick={next}
            className="absolute right-0 lg:translate-x-full z-20 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition"
            aria-label="Следующий отзыв"
          >
            &rarr;
          </button>
        </div>
      </div>
    </section>
  );
}
