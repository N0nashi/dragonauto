import React, { useState, useEffect } from "react";
import CarForm from "./CarForm";
import PartForm from "./PartForm";

function Notification({ message, type, onClose }) {
  // type: "success" | "error"
  // Автоматически скрывается через 3 секунды
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      className={`fixed top-5 right-5 z-50 max-w-xs px-4 py-3 rounded shadow-lg text-white
        ${type === "success" ? "bg-green-600" : "bg-red-600"}
        animate-fadeInDown`}
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
      <style>{`
        @keyframes fadeInDown {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInDown {
          animation: fadeInDown 0.3s ease forwards;
        }
      `}</style>
    </div>
  );
}

export default function EditApplicationForm({ applicationId, onSave, onCancel }) {
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Для уведомлений
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

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:5000/api/updateApplications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Ошибка при сохранении заявки");

      const updated = await res.json();
      setNotification({ message: "Заявка успешно обновлена", type: "success" });
      onSave(updated);
    } catch (error) {
      console.error("Ошибка при сохранении:", error);
      setNotification({ message: "Не удалось сохранить заявку", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !applicationData) return <p className="p-4">Загрузка данных заявки...</p>;
  if (!applicationData) return <p className="p-4">Нет данных заявки для редактирования</p>;

  const type = applicationData.type?.trim().toLowerCase();

  return (
    <>
      <div className="p-4 border rounded shadow max-w-3xl mx-auto">
        {type === "car" ? (
          <CarForm
            onSubmit={handleSubmit}
            loading={loading}
            initialData={applicationData}
            onCancel={onCancel}
          />
        ) : (
          <PartForm
            onSubmit={handleSubmit}
            loading={loading}
            initialData={applicationData}
            onCancel={onCancel}
          />
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
