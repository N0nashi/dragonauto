import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import CarForm from "../components/CarForm";
import PartForm from "../components/PartForm";
import "react-toastify/dist/ReactToastify.css";

export default function CreateRequest() {
  const [activeTab, setActiveTab] = useState("car");
  const [isAuth, setIsAuth] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
    } else {
      setIsAuth(true);
    }
  }, [navigate]);

  async function sendRequest(formData) {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Добавляем поле type, чтобы сервер получил тип заявки
      const dataToSend = { ...formData, type: activeTab };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error("Ошибка при отправке заявки: " + (errorData.error || "Неизвестная ошибка"));
        setLoading(false);
        return;
      }

      const data = await response.json();
      toast.success(`Заявка успешно отправлена! Номер: ${data.applicationId}`);
      navigate("/");
    } catch (error) {
      toast.error("Ошибка при отправке заявки: " + error.message);
      setLoading(false);
    }
  }

  if (!isAuth) return <p>Проверка авторизации...</p>;

  return (
    <section className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Создать заявку</h1>

      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-6 font-semibold ${
            activeTab === "car"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }`}
          onClick={() => setActiveTab("car")}
          disabled={loading}
        >
          Авто
        </button>
        <button
          className={`py-2 px-6 font-semibold ml-4 ${
            activeTab === "part"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }`}
          onClick={() => setActiveTab("part")}
          disabled={loading}
        >
          Запчасти
        </button>
      </div>

      {activeTab === "car" ? (
        <CarForm onSubmit={sendRequest} loading={loading} />
      ) : (
        <PartForm onSubmit={sendRequest} loading={loading} />
      )}

      <ToastContainer />
    </section>
  );
}