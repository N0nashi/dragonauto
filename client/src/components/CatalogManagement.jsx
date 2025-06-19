import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CarForm from "./CarModerationForm";
import PartForm from "./PartModerationForm";

const PAGE_SIZE = 10;

const CatalogManagement = () => {
  const [activeTab, setActiveTab] = useState("cars");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    resetAndFetch();
  }, [activeTab]);

  const fetchData = async (offsetParam) => {
    const url = `${process.env.REACT_APP_API_URL}/api/${activeTab}?limit=${PAGE_SIZE}&offset=${offsetParam}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Ошибка сети");
    return await res.json();
  };

  const resetAndFetch = async () => {
    setLoading(true);
    try {
      const data = await fetchData(0);
      setItems(data);
      setOffset(data.length);
      setHasMore(data.length === PAGE_SIZE);
      setEditingItem(null);
    } catch (error) {
      toast.error("Ошибка при загрузке данных");
      console.error("Ошибка при загрузке данных:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    setLoading(true);
    try {
      const data = await fetchData(offset);
      setItems((prev) => [...prev, ...data]);
      setOffset((prev) => prev + data.length);
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      toast.error("Ошибка при подгрузке данных");
      console.error("Ошибка при подгрузке:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (item) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/${activeTab}/${item.id}`);
      if (!response.ok) throw new Error("Не удалось загрузить данные");
      const fullItem = await response.json();
      setEditingItem({ ...fullItem, id: item.id });
    } catch (err) {
      toast.error("Ошибка при загрузке данных для редактирования");
      console.error(err);
    }
  };

  const requestDelete = (id) => {
    setConfirmDeleteId(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/${activeTab}/${confirmDeleteId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Не удалось удалить запись");
      toast.success("Запись успешно удалена");
      setShowConfirmModal(false);
      setConfirmDeleteId(null);
      resetAndFetch();
    } catch (err) {
      toast.error("Ошибка при удалении записи");
      console.error(err);
    }
  };

  const handleSave = async (updatedData) => {
    const isNew = !updatedData.id;
    const dataToSend = { ...updatedData };
    const endpoint = isNew
      ? `${process.env.REACT_APP_API_URL}/api/${activeTab}`
      : `${process.env.REACT_APP_API_URL}/api/${activeTab}/${updatedData.id}`;
    const method = isNew ? "POST" : "PUT";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Ошибка ответа от сервера:", errorText);
        throw new Error("Не удалось сохранить изменения");
      }

      toast.success(isNew ? "Позиция успешно добавлена" : "Изменения успешно сохранены");
      resetAndFetch();
    } catch (err) {
      toast.error("Ошибка при сохранении изменений");
      console.error("Ошибка в handleSave:", err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleAddNew = () => {
    const newItem =
      activeTab === "cars"
        ? {
            country: "",
            brand: "",
            model: "",
            year: "",
            price: "",
            drive: "",
            gearbox: "",
            body: "",
            mileage: "",
            engine_power: "",
            description: "",
            photo_url: "",
          }
        : {
            part_name: "",
            brand: "",
            model: "",
            year: "",
            body: "",
            price: "",
            photo_url: "",
            country: "",
          };
    setEditingItem(newItem);
  };

  const renderTable = () => (
    <div className="mt-4">
      <button
        onClick={handleAddNew}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Добавить позицию
      </button>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              {activeTab === "cars" ? (
                <>
                  <th className="px-4 py-2 text-left">Марка</th>
                  <th className="px-4 py-2 text-left">Модель</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-2 text-left">Название запчасти</th>
                  <th className="px-4 py-2 text-left">Марка</th>
                  <th className="px-4 py-2 text-left">Модель</th>
                </>
              )}
              <th className="px-4 py-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{item.id}</td>
                {activeTab === "cars" ? (
                  <>
                    <td className="px-4 py-2">{item.brand}</td>
                    <td className="px-4 py-2">{item.model}</td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2">{item.part_name}</td>
                    <td className="px-4 py-2">{item.brand}</td>
                    <td className="px-4 py-2">{item.model}</td>
                  </>
                )}
                <td className="px-4 py-2 space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:underline"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => requestDelete(item.id)}
                    className="text-red-600 hover:underline"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && !loading && (
          <p className="text-center text-gray-500 mt-4">Нет записей</p>
        )}
        {hasMore && !loading && (
          <div className="text-center mt-4">
            <button
              onClick={loadMore}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Загрузить ещё
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <nav className="mb-6 flex justify-center space-x-4 border-b pb-2">
        <button
          onClick={() => setActiveTab("cars")}
          className={`px-4 py-2 font-medium ${
            activeTab === "cars" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"
          }`}
        >
          Каталог автомобилей
        </button>
        <button
          onClick={() => setActiveTab("parts")}
          className={`px-4 py-2 font-medium ${
            activeTab === "parts" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"
          }`}
        >
          Каталог запчастей
        </button>
      </nav>

      {loading ? <p className="text-center text-gray-500">Загрузка...</p> : renderTable()}
      
      {editingItem && (
        <div className="mt-8 border border-gray-300 rounded-lg p-6 bg-white shadow-md">
          <h3 className="text-xl font-semibold mb-4">
            {editingItem.id ? "Редактирование" : "Добавление"}{" "}
            {activeTab === "cars" ? "автомобиля" : "запчасти"}
          </h3>
          {activeTab === "cars" ? (
            <CarForm initialData={editingItem} onSubmit={handleSave} onCancel={handleCancelEdit} />
          ) : (
            <PartForm initialData={editingItem} onSubmit={handleSave} onCancel={handleCancelEdit} />
          )}
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Подтверждение удаления</h3>
            <p className="mb-6">Вы уверены, что хотите удалить эту позицию? Отменить это действие будет невозможно.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default CatalogManagement;