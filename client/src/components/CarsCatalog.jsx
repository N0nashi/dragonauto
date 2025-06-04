import React, { useEffect, useState } from "react";

const allGridOptions = [3, 6, 9];

const CarsCatalog = () => {
  const [filters, setFilters] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [cars, setCars] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingCars, setLoadingCars] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [gridCols, setGridCols] = useState(3);
  const [availableGridOptions, setAvailableGridOptions] = useState([3, 6, 9]);
  const [isPortrait, setIsPortrait] = useState(
    window.matchMedia("(orientation: portrait)").matches
  );

  // Получаем токен из localStorage
  const token = localStorage.getItem("token");

  // Функция для получения userId из токена
  const getUserIdFromToken = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId || payload.id || null;
    } catch {
      return null;
    }
  };

  const currentUserId = getUserIdFromToken();

  // Обновление доступных вариантов сетки
  const updateLayout = () => {
    const width = window.innerWidth;
    const portrait = window.matchMedia("(orientation: portrait)").matches;
    setIsPortrait(portrait);

    if (width < 768) {
      setAvailableGridOptions([]);
      setGridCols(portrait ? 1 : 2);
    } else if (width >= 768 && width < 1024) {
      setAvailableGridOptions([3, 6]);
      if (![3, 6].includes(gridCols)) setGridCols(3);
    } else {
      setAvailableGridOptions(allGridOptions);
      if (!allGridOptions.includes(gridCols)) setGridCols(3);
    }
  };

  useEffect(() => {
    updateLayout();
    window.addEventListener("resize", updateLayout);
    window.addEventListener("orientationchange", updateLayout);
    return () => {
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("orientationchange", updateLayout);
    };
  }, []);

  useEffect(() => {
    if (availableGridOptions.length > 0 && !availableGridOptions.includes(gridCols)) {
      setGridCols(availableGridOptions[0]);
    }
  }, [availableGridOptions]);

  // Загрузка фильтров
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cars/filters`);
        if (!response.ok) throw new Error("Failed to load filters");
        const data = await response.json();
        setFilters(data);
      } catch (err) {
        setError("Ошибка загрузки фильтров");
        console.error(err);
      } finally {
        setLoadingFilters(false);
      }
    };
    loadFilters();
  }, []);

  // Загрузка автомобилей по фильтрам
  useEffect(() => {
    const loadCars = async () => {
      setLoadingCars(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/cars/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedFilters),
        });
        if (!response.ok) throw new Error("Failed to load cars");
        const data = await response.json();
        setCars(data);
      } catch (err) {
        setError("Ошибка загрузки автомобилей");
        console.error(err);
      } finally {
        setLoadingCars(false);
      }
    };
    loadCars();
  }, [selectedFilters]);

  const handleFilterChange = (key, value) => {
    setSelectedFilters(prev => ({ ...prev, [key]: value }));
  };

  const renderFilterSelect = (label, key, options) => (
    <label className="block mb-4" key={key}>
      <span className="block font-semibold mb-1">{label}</span>
      <select
        value={selectedFilters[key] || ""}
        onChange={(e) => handleFilterChange(key, e.target.value)}
        className="w-full border rounded px-2 py-1"
      >
        <option value="">Все</option>
        {options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );

  const renderRangeInput = (label, keyMin, keyMax) => (
    <div className="mb-4" key={keyMin + keyMax}>
      <span className="block font-semibold mb-1">{label}</span>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="от"
          value={selectedFilters[keyMin] || ""}
          onChange={(e) => handleFilterChange(keyMin, e.target.value)}
          className="w-1/2 border rounded px-2 py-1"
        />
        <input
          type="number"
          placeholder="до"
          value={selectedFilters[keyMax] || ""}
          onChange={(e) => handleFilterChange(keyMax, e.target.value)}
          className="w-1/2 border rounded px-2 py-1"
        />
      </div>
    </div>
  );

  const renderCarImage = (car) => {
    const placeholder = "/images/car-placeholder.png";
    const photoUrl = car.photo_url;
    const src = photoUrl?.startsWith("http")
      ? photoUrl
      : `${process.env.REACT_APP_API_URL}${photoUrl}`;
    const heightClass =
      gridCols === 3 ? "h-64" : gridCols === 6 ? "h-48" : "h-40";
    return (
      <img
        src={photoUrl ? src : placeholder}
        alt={`${car.brand} ${car.model}`}
        className={`w-full ${heightClass} object-cover rounded-t`}
        onError={(e) => {
          e.target.src = placeholder;
        }}
      />
    );
  };

  const createRequest = async (car) => {
    if (!currentUserId) {
      alert("Пожалуйста, войдите в систему, чтобы создать заявку.");
      return;
    }

    try {
      const requestData = {
        type: "car",
        description: `Заявка на автомобиль ${car.brand} ${car.model} ${car.year} года`,
        country_car: car.country,
        brand_car: car.brand,
        price_from_car: car.price,
        price_to_car: car.price,
        year_from_car: car.year,
        year_to_car: car.year,
        mileage_from_car: car.mileage,
        mileage_to_car: car.mileage,
        gearbox_car: car.gearbox,
        body_car: car.body,
        drive_car: car.drive ? [car.drive] : null,
        car_power: car.engine_power?.toString()
      };

      console.log("Отправка данных заявки:", requestData);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка создания заявки");
      }

      const data = await response.json();
      alert(`Заявка №${data.applicationId} успешно создана!`);
    } catch (error) {
      console.error("Ошибка при создании заявки:", error);
      alert(`Ошибка: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row p-4 gap-6">
      {/* Блок фильтров */}
      <aside className="w-full md:w-64 bg-white border rounded p-4 h-fit shadow">
        <h2 className="font-bold text-lg mb-4">Фильтры</h2>
        
        {loadingFilters ? (
          <p>Загрузка фильтров...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <>
            {renderFilterSelect("Страна", "country", filters?.countries)}
            {renderFilterSelect("Марка", "brand", filters?.brands)}
            {renderFilterSelect("Модель", "model", filters?.models)}

            {showAdvancedFilters && (
              <>
                {renderRangeInput("Год выпуска", "year_from", "year_to")}
                {renderRangeInput("Цена (₽)", "price_from", "price_to")}
                {renderRangeInput("Пробег (км)", "mileage_from", "mileage_to")}
                {renderFilterSelect("Коробка передач", "gearbox", filters?.gearboxes)}
                {renderFilterSelect("Привод", "drive", filters?.drives)}
                {renderFilterSelect("Кузов", "body", filters?.bodies)}
              </>
            )}

            <button
              className="text-blue-600 mt-2 text-sm hover:text-blue-800 transition"
              onClick={() => setShowAdvancedFilters(prev => !prev)}
            >
              {showAdvancedFilters
                ? "Скрыть дополнительные фильтры"
                : "Показать дополнительные фильтры"}
            </button>
          </>
        )}
      </aside>

      {/* Основной контент */}
      <main className="flex-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-xl">Автомобили ({cars.length})</h2>

          {availableGridOptions.length > 0 && (
            <div className="flex gap-2">
              {availableGridOptions.map(cols => (
                <button
                  key={cols}
                  className={`px-3 py-1 border rounded transition ${
                    gridCols === cols
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-blue-600 hover:bg-blue-50"
                  }`}
                  onClick={() => setGridCols(cols)}
                >
                  {cols}
                </button>
              ))}
            </div>
          )}
        </div>

        {loadingCars ? (
          <p>Загрузка автомобилей...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : cars.length === 0 ? (
          <p className="text-gray-500">По вашему запросу автомобилей не найдено</p>
        ) : (
          <div
            className={`grid gap-6 ${
              gridCols === 1
                ? "grid-cols-1"
                : gridCols === 2
                ? "grid-cols-2"
                : gridCols === 3
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : gridCols === 6
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
                : "grid-cols-3 md:grid-cols-6 lg:grid-cols-9"
            }`}
          >
            {cars.map(car => (
              <div
                key={car.id}
                className="border rounded shadow hover:shadow-lg transition flex flex-col"
              >
                {renderCarImage(car)}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-semibold text-lg mb-1">
                    {car.brand} {car.model}
                  </h3>
                  <p className="text-sm mb-2">
                    {car.year} год · {car.mileage?.toLocaleString() || '—'} км
                  </p>
                  <p className="text-lg font-bold mb-3">
                    {car.price?.toLocaleString() || '—'} ₽
                  </p>
                  <button
                    onClick={() => createRequest(car)}
                    className="mt-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                  >
                    Подобрать
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CarsCatalog;