import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import EditApplicationForm from "./EditApplicationForm";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Requests() {
  const [applications, setApplications] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingApplication, setEditingApplication] = useState(null);

  async function loadApplications() {
    const token = localStorage.getItem("token");
    if (!token) {
      setApplications([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/applications", {
        headers: { Authorization: "Bearer " + token },
      });

      if (!response.ok) throw new Error("Ошибка загрузки заявок");

      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error(error);
      toast.error("Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const cancelApplication = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.warn("Пожалуйста, войдите в систему");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/applications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Ошибка отмены заявки");

      await loadApplications();
      toast.success("Заявка отменена");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось отменить заявку");
    }
  };

  const closeApplication = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.warn("Пожалуйста, войдите в систему");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/applications/${id}/close`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "выполнена" }),
      });

      if (!res.ok) throw new Error("Ошибка закрытия заявки");

      await loadApplications();
      toast.success("Заявка успешно закрыта");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось закрыть заявку");
    }
  };

  const startEditApplication = (application) => {
    setEditingApplication(application);
  };

  const saveApplication = (updatedApp) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === updatedApp.id ? updatedApp : app))
    );
    setEditingApplication(null);
    toast.success("Заявка успешно обновлена");
  };

  const cancelEdit = () => setEditingApplication(null);

  const statusColor = {
    выполнена: "bg-green-500",
    обработка: "bg-yellow-400",
    отменена: "bg-red-500",
    отменено: "bg-red-500",
  };

  const isFinalStatus = (status) =>
    status === "выполнена" || status.startsWith("отмен");

  if (loading) return <p>Загрузка заявок...</p>;
  if (applications.length === 0) return <p>У вас пока нет заявок.</p>;

  if (editingApplication) {
    return (
      <section>
        <EditApplicationForm
          applicationId={editingApplication.id}
          onSave={saveApplication}
          onCancel={cancelEdit}
        />
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6 text-[#00355B]">Ваши заявки</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-100 text-gray-700 rounded-t-lg">
            <tr>
              <th className="p-3 text-left rounded-tl-lg">№</th>
              <th className="p-3 text-left">Дата</th>
              <th className="p-3 text-left">Тип</th>
              <th className="p-3 text-left rounded-tr-lg">Статус</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(({ id, date, status, description, type }) => (
              <React.Fragment key={id}>
                <tr
                  className="hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => toggleExpand(id)}
                >
                  <td className="p-3 border-t border-gray-200">{id}</td>
                  <td className="p-3 border-t border-gray-200">
                    {new Date(date).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="p-3 border-t border-gray-200 capitalize">{type}</td>
                  <td className="p-3 border-t border-gray-200 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm ${
                        statusColor[status] || "bg-gray-400"
                      }`}
                    >
                      {status === "выполнена" && <CheckCircle size={16} />}
                      {(status === "отменена" || status === "отменено") && (
                        <XCircle size={16} />
                      )}
                      {status}
                    </span>
                    {expandedId === id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </td>
                </tr>

                {expandedId === id && (
                  <tr>
                    <td colSpan={4} className="bg-blue-50 px-6 py-4 border-t border-gray-200">
                      <div className="mb-4">
                        <strong>Описание:</strong>
                        <p className="mt-2 text-gray-700">{description}</p>
                      </div>
                      {!isFinalStatus(status) && (
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => cancelApplication(id)}
                            className="px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition-shadow shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Отменить
                          </button>

                          <button
                            onClick={() => startEditApplication({ id, date, status, description, type })}
                            className="px-4 py-2 rounded-md bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition-shadow shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          >
                            Редактировать
                          </button>

                          <button
                            onClick={() => closeApplication(id)}
                            className="px-4 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 transition-shadow shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            Закрыть заявку
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
