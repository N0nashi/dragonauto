import React, { useEffect, useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const allGridOptions = [3, 6];

const CarsCatalog = () => {
  const [filters, setFilters] = useState({
    countries: [],
    brands: [],
    models: [],
    bodies: [],
    gearboxes: [],
    drives: [],
    priceRange: { min: 0, max: 0 },
  });
  const [selectedFilters, setSelectedFilters] = useState({});
  const [cars, setCars] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingCars, setLoadingCars] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [gridCols, setGridCols] = useState(3);
  const [availableGridOptions, setAvailableGridOptions] = useState([3, 6]);
  const [isPortrait, setIsPortrait] = useState(
    window.matchMedia("(orientation: portrait)").matches
  );

  const prevCountryRef = useRef(null);
  const prevBrandRef = useRef(null);

  const token = localStorage.getItem("token");

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

  const loadFilters = async () => {
    try {
      const url = new URL(`${process.env.REACT_APP_API_URL}/api/cars/filters`);
      if (selectedFilters.country)
        url.searchParams.append("country", selectedFilters.country);
      if (selectedFilters.brand)
        url.searchParams.append("brand", selectedFilters.brand);

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to load filters");
      const data = await response.json();
      setFilters(data);

      if (prevCountryRef.current !== selectedFilters.country) {
        setSelectedFilters((prev) => ({ ...prev, brand: "", model: "" }));
      }
      if (prevBrandRef.current !== selectedFilters.brand) {
        setSelectedFilters((prev) => ({ ...prev, model: "" }));
      }

      prevCountryRef.current = selectedFilters.country;
      prevBrandRef.current = selectedFilters.brand;
    } catch (err) {
      setError("Ошибка загрузки фильтров");
      console.error(err);
    } finally {
      setLoadingFilters(false);
    }
  };

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

  const handleFilterChange = (key, value) => {
    setSelectedFilters((prev) => {
      const newFilters = { ...prev, [key]: value || undefined };
      if (key === "country") {
        newFilters.brand = "";
        newFilters.model = "";
      } else if (key === "brand") {
        newFilters.model = "";
      }
      return newFilters;
    });
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

  useEffect(() => {
    loadFilters();
  }, [selectedFilters.country, selectedFilters.brand]);

  useEffect(() => {
    loadCars();
  }, [selectedFilters]);

  const renderFilterSelect = (label, key, options) => (
    <label className="block mb-4" key={key}>
      <span className="block font-semibold mb-1">{label}</span>
      <select
        value={selectedFilters[key] || ""}
        onChange={(e) => handleFilterChange(key, e.target.value || undefined)}
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

  const renderRangeInput = (label, key) => (
    <div className="mb-4" key={key}>
      <span className="block font-semibold mb-1">{label}</span>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="от"
          value={selectedFilters[key]?.min || ""}
          onChange={(e) =>
            handleFilterChange(key, {
              ...selectedFilters[key],
              min: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="w-1/2 border rounded px-2 py-1"
        />
        <input
          type="number"
          placeholder="до"
          value={selectedFilters[key]?.max || ""}
          onChange={(e) =>
            handleFilterChange(key, {
              ...selectedFilters[key],
              max: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="w-1/2 border rounded px-2 py-1"
        />
      </div>
    </div>
  );

  const renderCarImage = (car) => {
    const photoUrl = car.photo_url;
    const src = photoUrl?.startsWith("http")
      ? photoUrl
      : `${process.env.REACT_APP_API_URL}${photoUrl}`;
    const heightClass = gridCols === 3 ? "h-64" : gridCols === 6 ? "h-48" : "h-40";
    return (
      <img
        src={src || "/placeholder-car.jpg"}
        alt={`${car.brand} ${car.model}`}
        className={`w-full ${heightClass} object-cover rounded-t`}
        onError={(e) => {
          e.target.src = "/placeholder-car.jpg";
        }}
      />
    );
  };

  const createRequest = async (car) => {
    if (!currentUserId) {
      toast.info("Пожалуйста, войдите в систему, чтобы создать заявку.");
      setTimeout(() => {
        window.location.href = "/auth";
      }, 2000);
      return;
    }

    try {
      const enginePower = car.engine_power ? Number(car.engine_power) : null;

      const requestData = {
        type: "car",
        description: `Заявка на автомобиль ${car.brand} ${car.model} ${car.year} года`,
        country_car: car.country,
        brand_car: car.brand,
        model_car: car.model,
        price_from_car: car.price,
        price_to_car: car.price,
        year_from_car: car.year,
        year_to_car: car.year,
        mileage_from_car: car.mileage,
        mileage_to_car: car.mileage,
        gearbox_car: car.gearbox,
        body_car: car.body,
        drive_car: car.drive ? [car.drive] : null,
        power_from_car: enginePower,
        power_to_car: enginePower,
      };

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
      toast.success(`Заявка №${data.applicationId} успешно создана!`);
    } catch (error) {
      console.error("Ошибка при создании заявки:", error);
      toast.error(`Ошибка: ${error.message}`);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row p-4 gap-6">
        <aside className="w-full md:w-64 bg-white border rounded p-4 h-fit shadow">
          <h2 className="font-bold text-lg mb-4">Фильтры</h2>
          {loadingFilters ? (
            <p>Загрузка фильтров...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <>
              {renderFilterSelect("Страна", "country", filters.countries)}
              {renderFilterSelect("Марка", "brand", filters.brands)}
              {renderFilterSelect("Модель", "model", filters.models)}
              {showAdvancedFilters && (
                <>
                  {renderRangeInput("Год выпуска", "year")}
                  {renderRangeInput("Цена (₽)", "price")}
                  {renderRangeInput("Пробег (км)", "mileage")}
                  {renderFilterSelect("Коробка передач", "gearbox", filters.gearboxes)}
                  {renderFilterSelect("Привод", "drive", filters.drives)}
                  {renderFilterSelect("Кузов", "body", filters.bodies)}
                </>
              )}
              <button
                className="text-blue-600 mt-2 text-sm hover:text-blue-800 transition"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
              >
                {showAdvancedFilters
                  ? "Скрыть дополнительные фильтры"
                  : "Показать дополнительные фильтры"}
              </button>
            </>
          )}
        </aside>

        <main className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-xl">Автомобили ({cars.length})</h2>
            {availableGridOptions.length > 0 && (
              <div className="flex gap-2">
                {availableGridOptions.map((cols) => (
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
                  : "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
              }`}
            >
              {cars.map((car) => (
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
                      {car.year} год · {car.mileage?.toLocaleString() || "—"} км
                    </p>
                    <p className="text-lg font-bold mb-3">
                      {car.price ? `от ${car.price.toLocaleString()} ₽` : "— ₽"}
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
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default CarsCatalog;
