// components/FAQPage.jsx
import React from "react";
import { useState } from "react";

const faqs = [
  {
    question: "Какие автомобили можно подобрать через DragonAuto?",
    answer: "Мы подбираем автомобили из Китая, Японии и Кореи. В каталоге представлены легковые, грузовые и специальные авто.",
  },
  {
    question: "Сколько времени занимает подбор авто?",
    answer: "Подбор занимает от 1 до 3 рабочих дней. Мы свяжемся с вами сразу после оформления заявки.",
  },
  {
    question: "Нужно ли регистрироваться для подбора?",
    answer: "Да, регистрация требуется, это нужно для удобства нашей связи с вами.",
  },
  {
    question: "Можно ли подобрать автозапчасти отдельно?",
    answer: "Да, вы можете выбрать категорию 'запчасти' и указать характеристики нужной детали.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full min-h-[calc(100vh-56px)] bg-[#ffffff] text-black px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
          Часто задаваемые вопросы
        </h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-black/30 pb-4">
              <button
                className="w-full text-left text-xl font-semibold flex justify-between items-center"
                onClick={() => toggleFAQ(index)}
              >
                <span>{faq.question}</span>
                <span>{openIndex === index ? "−" : "+"}</span>
              </button>
              {openIndex === index && (
                <p className="mt-4 text-lg text-black/90">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
