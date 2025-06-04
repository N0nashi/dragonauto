import React, { useState, useEffect } from "react";
import ProfileInfo from "../components/ProfileInfo";
import Requests from "../components/Requests";
import ModeratorPanel from "../components/ModeratorPanel"; // ← Компонент для панели модерации (создадим ниже)

const ProfilePage = () => {
  const [activeMenu, setActiveMenu] = useState("profile");
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    // Предположим, что есть эндпоинт /api/profile, который возвращает данные пользователя
    fetch(`${process.env.REACT_APP_API_URL}/api/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка получения данных профиля");
        return res.json();
      })
      .then((data) => {
        setIsModerator(data.role === "moderator"); // ← проверка роли
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center p-4">Загрузка...</div>;
  }

  return (
    <div className="p-4 max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
      {/* Верхнее меню для мобильных */}
      <nav className="flex md:hidden mb-4 space-x-4 justify-center overflow-x-auto">
        <button
          onClick={() => setActiveMenu("profile")}
          className={`px-4 py-2 rounded font-medium ${
            activeMenu === "profile"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          } whitespace-nowrap`}
        >
          Профиль
        </button>
        <button
          onClick={() => setActiveMenu("applications")}
          className={`px-4 py-2 rounded font-medium ${
            activeMenu === "applications"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          } whitespace-nowrap`}
        >
          Заявки
        </button>
        {isModerator && (
          <button
            onClick={() => setActiveMenu("moderation")}
            className={`px-4 py-2 rounded font-medium ${
              activeMenu === "moderation"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            } whitespace-nowrap`}
          >
            Панель модерации
          </button>
        )}
      </nav>

      {/* Боковое меню для md+ экранов */}
      <aside className="hidden md:flex flex-col space-y-2 w-48">
        <button
          onClick={() => setActiveMenu("profile")}
          className={`px-4 py-2 rounded font-medium ${
            activeMenu === "profile"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Профиль
        </button>
        <button
          onClick={() => setActiveMenu("applications")}
          className={`px-4 py-2 rounded font-medium ${
            activeMenu === "applications"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Заявки
        </button>
        {isModerator && (
          <button
            onClick={() => setActiveMenu("moderation")}
            className={`px-4 py-2 rounded font-medium ${
              activeMenu === "moderation"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            Панель модерации
          </button>
        )}
      </aside>

      {/* Основной контент */}
      <main className="flex-grow">
        {activeMenu === "profile" && <ProfileInfo />}
        {activeMenu === "applications" && <Requests />}
        {activeMenu === "moderation" && isModerator && <ModeratorPanel />}
      </main>
    </div>
  );
};

export default ProfilePage;