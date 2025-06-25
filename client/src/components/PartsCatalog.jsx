import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const allGridOptions = [3, 6];

const PartsCatalog = () => {
  const [filters, setFilters] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [parts, setParts] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingParts, setLoadingParts] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [gridCols, setGridCols] = useState(3);
  const [availableGridOptions, setAvailableGridOptions] = useState([3, 6]);
  const [isPortrait, setIsPortrait] = useState(window.matchMedia("(orientation: portrait)").matches);

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

  // Загрузка фильтров при монтировании и при изменении выбранной страны и бренда
  useEffect(() => {
    const loadFilters = async () => {
      setLoadingFilters(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedFilters.country) queryParams.append("country", selectedFilters.country);
        if (selectedFilters.brand) queryParams.append("brand", selectedFilters.brand);

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/parts/filters?${queryParams.toString()}`
        );

        if (!response.ok) throw new Error("Failed to load filters");
        const data = await response.json();

        setFilters((prev) => ({
          ...prev,
          brands: data.brands,
          models: data.models,
          countries: prev?.countries || data.countries,
          bodies: prev?.bodies || data.bodies,
          priceRange: prev?.priceRange || data.priceRange,
        }));
        setError(null);
      } catch (err) {
        setError("Ошибка загрузки фильтров");
        console.error(err);
      } finally {
        setLoadingFilters(false);
      }
    };

    loadFilters();
  }, [selectedFilters.country, selectedFilters.brand]);

  // Загрузка запчастей при изменении фильтров
  useEffect(() => {
    const loadParts = async () => {
      setLoadingParts(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/parts/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedFilters),
        });
        if (!response.ok) throw new Error("Failed to load parts");
        const data = await response.json();
        setParts(data);
        setError(null);
      } catch (err) {
        setError("Ошибка загрузки запчастей");
        console.error(err);
      } finally {
        setLoadingParts(false);
      }
    };
    loadParts();
  }, [selectedFilters]);

  // Обработчик изменения фильтров с логикой сброса зависимых фильтров
  const handleFilterChange = (key, value) => {
    setSelectedFilters((prev) => {
      let updated = { ...prev, [key]: value };

      if (key === "country") {
        updated.brand = "";
        updated.model = "";
      } else if (key === "brand") {
        updated.model = "";
      }

      return updated;
    });
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

  const renderPartImage = (part) => {
    const placeholder = "/images/part-placeholder.png";
    const photoUrl = part.photo_url;
    const src = photoUrl?.startsWith("http")
      ? photoUrl
      : `${process.env.REACT_APP_API_URL}${photoUrl}`;
    const heightClass = gridCols === 3 ? "h-64" : "h-48";

    return (
      <img
        src={photoUrl ? src : placeholder}
        alt={`${part.brand} ${part.model}`}
        className={`w-full ${heightClass} object-cover rounded-t`}
        onError={(e) => {
          e.target.src = placeholder;
        }}
      />
    );
  };

  const createRequest = async (part) => {
    if (!currentUserId) {
      toast.error("Пожалуйста, войдите в систему, чтобы создать заявку.");
      return;
    }

    try {
      const requestData = {
        type: "part",
        description: `Заявка на запчасть ${part.part_name} для ${part.brand} ${part.model}`,
        country_part: part.country,
        brand_part: part.brand,
        model_part: part.model,
        part_name: part.part_name,
        price_from_part: part.price,
        price_to_part: part.price,
        body_part: part.body_type || part.body,
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
              {renderFilterSelect("Страна", "country", filters?.countries)}
              {renderFilterSelect("Марка", "brand", filters?.brands)}
              {renderFilterSelect("Модель", "model", filters?.models)}

              {showAdvancedFilters && (
                <>
                  {renderRangeInput("Год выпуска", "year_from", "year_to")}
                  {renderFilterSelect("Тип кузова", "body_type", filters?.bodies)}
                  {renderRangeInput("Цена (₽)", "price_from", "price_to")}
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
            <h2 className="font-bold text-xl">Запчасти ({parts.length})</h2>
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

          {loadingParts ? (
            <p>Загрузка запчастей...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : parts.length === 0 ? (
            <p className="text-gray-500">По вашему запросу запчастей не найдено</p>
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
              {parts.map((part) => (
                <div
                  key={part.id}
                  className="border rounded shadow hover:shadow-lg transition flex flex-col"
                >
                  {renderPartImage(part)}
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-semibold text-lg mb-1">{part.part_name}</h3>
                    <p className="text-sm mb-2">
                      Для: {part.brand} {part.model} ({part.year})
                    </p>
                    <p className="text-sm mb-2">Кузов: {part.body_type || part.body}</p>
                    <p className="text-lg font-bold mb-3">
                      {part.price ? `от ${part.price.toLocaleString()} ₽` : "— ₽"}
                    </p>
                    <button
                      onClick={() => createRequest(part)}
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
      <ToastContainer position="top-right" autoClose={4000} />
    </>
  );
};

export default PartsCatalog;
