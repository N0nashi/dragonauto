import React, { useState, useEffect } from "react";
import ApplicationsMenu from "./ApplicationsMenu";
import RequestTableAll from "./RequestTableAll";
import RequestTableCar from "./RequestTableCar";
import RequestTablePart from "./RequestTablePart";
import CatalogManagement from "./CatalogManagement";
import ViewApplicationForm from "./ViewApplicationForm";
import SendEmailModal from "./SendEmailModal";

const ModeratorPanel = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("applications");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setError("Неавторизованный доступ");
      setLoading(false);
      return;
    }

    fetch(`https://dragonauto-backend.onrender.com/api/applications/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Ошибка загрузки заявок");
        }
        return res.json();
      })
      .then((data) => {
        setApplications(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  const handleReply = (email, applicationId) => {
    setSelectedEmail(email);
    setSelectedApplicationId(applicationId);
    setEmailModalVisible(true);
  };

  const closeEmailModal = () => {
    setEmailModalVisible(false);
    setSelectedEmail(null);
    setSelectedApplicationId(null);
  };

  if (loading) {
    return <div className="text-center p-4">Загрузка заявок...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center p-4">{error}</div>;
  }

  return (
    <section className="bg-white border border-gray-300 rounded shadow-sm p-6 space-y-8">
      <div className="flex justify-center space-x-6 border-b pb-2">
        <button
          onClick={() => setActiveSection("applications")}
          className={`font-semibold ${
            activeSection === "applications"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600"
          }`}
        >
          Управление заявками
        </button>
        <button
          onClick={() => setActiveSection("catalog")}
          className={`font-semibold ${
            activeSection === "catalog"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600"
          }`}
        >
          Управление каталогом
        </button>
      </div>

      {activeSection === "applications" && (
        <>
          <ApplicationsMenu activeTab={activeTab} setActiveTab={setActiveTab} />

          {activeTab === "all" && (
            <RequestTableAll
              applications={applications}
              onView={(id) => setSelectedApplicationId(id)}
              onReply={(email, id) => handleReply(email, id)}
            />
          )}
          {activeTab === "car" && (
            <RequestTableCar
              applications={applications}
              onView={(id) => setSelectedApplicationId(id)}
              onReply={(email, id) => handleReply(email, id)}
            />
          )}
          {activeTab === "part" && (
            <RequestTablePart
              applications={applications}
              onView={(id) => setSelectedApplicationId(id)}
              onReply={(email, id) => handleReply(email, id)}
            />
          )}
        </>
      )}

      {activeSection === "catalog" && <CatalogManagement />}

      {selectedApplicationId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-auto">
            <ViewApplicationForm
              applicationId={selectedApplicationId}
              onCancel={() => setSelectedApplicationId(null)}
            />
          </div>
        </div>
      )}

      {emailModalVisible && (
        <SendEmailModal
          email={selectedEmail}
          applicationId={selectedApplicationId}
          onClose={closeEmailModal}
        />
      )}
    </section>
  );
};

export default ModeratorPanel;
