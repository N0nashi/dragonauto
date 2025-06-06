import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#00355B] text-white text-sm md:text-base font-semibold py-4 px-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start items-end text-right md:text-left">
        {/* Левый блок на десктопе, правый на мобилках */}
        <div className="mb-4 md:mb-0">
          <p className="mb-1">DragonAuto</p>
          <p>ИП Иванов Георгий</p>
        </div>

        {/* Второй блок — всегда по правому краю на мобилках */}
        <div>
          <p>г.Челябинск, пр. Ленина 87</p>
          <p className="mb-1">+7 945 643 55 46</p>
        </div>
      </div>
    </footer>
  );
}
