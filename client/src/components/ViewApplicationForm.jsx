import React, { useState, useEffect } from "react";
import CarForm from "./CarForm";
import PartForm from "./PartForm";

function Notification({ message, type, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      className={`fixed top-5 right-5 z-50 max-w-xs px-4 py-3 rounded shadow-lg text-white ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
      role="alert"
    >
      {message}
      <button
        onClick={onClose}
        className="ml-3 font-bold focus:outline-none"
        aria-label="Закрыть уведомление"
      >
        ×
      </button>
    </div>
  );
}

export default function ViewApplicationForm({ applicationId, onCancel, onReply }) {
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  useEffect(() => {
    if (!applicationId) {
      setApplicationData(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/applications/${applicationId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Ошибка загрузки заявки");

        const data = await res.json();
        setApplicationData(data);
      } catch (error) {
        console.error("Ошибка при загрузке заявки:", error);
        setNotification({ message: "Не удалось загрузить данные заявки", type: "error" });
        setApplicationData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [applicationId]);

  if (loading && !applicationData)
    return <p className="p-4">Загрузка данных заявки...</p>;

  if (!applicationData)
    return <p className="p-4">Нет данных для отображения</p>;

  const type = applicationData.type?.trim().toLowerCase();

  return (
    <>
      <div className="p-4 border rounded shadow max-w-3xl mx-auto relative">
        {type === "car" ? (
          <CarForm initialData={applicationData} readOnly={true} onClose={onCancel} />
        ) : (
          <PartForm initialData={applicationData} readOnly={true} onClose={onCancel} />
        )}

        {onReply && applicationData.email && (
          <div className="flex justify-end mt-4 gap-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => onReply(applicationData.email)}
            >
              Ответить на заявку
            </button>
          </div>
        )}
      </div>

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: "", type: "" })}
      />
    </>
  );
}
