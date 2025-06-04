import React from "react";

const ApplicationsMenu = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="mb-4 flex justify-center space-x-4 border-b pb-2">
      <button
        onClick={() => setActiveTab("all")}
        className={`px-4 py-2 font-medium ${
          activeTab === "all" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"
        }`}
      >
        Все заявки
      </button>
      <button
        onClick={() => setActiveTab("car")}
        className={`px-4 py-2 font-medium ${
          activeTab === "car" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"
        }`}
      >
        На автомобили
      </button>
      <button
        onClick={() => setActiveTab("part")}
        className={`px-4 py-2 font-medium ${
          activeTab === "part" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"
        }`}
      >
        На запчасти
      </button>
    </nav>
  );
};

export default ApplicationsMenu;