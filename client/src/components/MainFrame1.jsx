import React from "react";
export default function MainFrame1() {
  const robotoFont = "'Roboto', sans-serif";

  return (
    <section
      className="w-full min-h-[calc(100vh-56px)] bg-cover bg-center relative flex justify-center md:justify-start items-start pb-10 md:pb-0"
      style={{ backgroundImage: "url('/background1.png')" }}
    >
      <div
        className="bg-[rgba(0,53,91,0.7)] overflow-y-auto rounded-[15px] flex flex-col justify-start items-start px-6 md:px-10 py-10 md:ml-20"
        style={{
          boxSizing: "border-box",
          fontFamily: robotoFont,
          width: "90%",
          maxWidth: 779,
          marginTop: 120, // опускаем блок пониже на больших экранах
        }}
      >
        {/* Заголовок */}
        <p className="text-white font-semibold text-2xl sm:text-3xl md:text-[36px] leading-[36px] mb-6">
          Ищите авто из стран Азии?
        </p>

        {/* Основной текст */}
        <div className="text-white font-semibold text-xl sm:text-[26px] md:text-[30px] leading-[36px] w-full mb-6">
          <p className="mb-6 indent-8">
            Удобный каталог, большая база данных.
          </p>
          <p className="mb-6 indent-8">
            Аукционы и сервисы Китая, Японии и Кореи<br />
            обновляются ежедневно!
          </p>
          <p className="indent-8">
            Моментальная связь с клиентом,<br />
            качественная поддержка и длительное<br />
            сопровождение.
          </p>
        </div>

        {/* Завершающая строка */}
        <p className="text-white font-semibold text-2xl sm:text-3xl md:text-[36px] leading-[36px] mb-10">
          DragonAuto для вас!
        </p>

        {/* Кнопка */}
        <a
          href="/create-request"
          className="bg-white text-[#00355B] font-semibold text-base sm:text-lg md:text-xl py-2 sm:py-2.5 px-10 sm:px-20 rounded-full hover:bg-blue-600 hover:text-white transition w-full sm:w-auto text-center"
        >
          ПРИСТУПИТЬ К ПОДБОРУ
        </a>
      </div>
    </section>
  );
}
