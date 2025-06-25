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
      className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white 
        ${type === "success" ? "bg-green-600" : "bg-red-600"} animate-slideIn`}
      role="alert"
    >
      <div className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-4 font-bold text-white hover:text-gray-200 focus:outline-none"
          aria-label="Закрыть уведомление"
        >
          ×
        </button>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default function EditApplicationForm({ applicationId, onSave, onCancel }) {
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
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/applications/${applicationId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Ошибка загрузки заявки");

        const data = await res.json();
        setApplicationData(data);
      } catch (error) {
        console.error("Ошибка при загрузке заявки:", error);
        setNotification({
          message: "Не удалось загрузить данные заявки",
          type: "error",
        });
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

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/updateApplications/${applicationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

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
