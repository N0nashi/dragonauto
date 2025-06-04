import React from "react";
import{ useState } from "react";
import CarsCatalog from "../components/CarsCatalog";
import PartsCatalog from "../components/PartsCatalog";

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState("cars");

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#00355B] mb-6">Каталог</h1>
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${activeTab === "cars" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("cars")}
        >
          Автомобили
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === "parts" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("parts")}
        >
          Запчасти
        </button>
      </div>
      {activeTab === "cars" ? <CarsCatalog /> : <PartsCatalog />}
    </div>
  );
}
