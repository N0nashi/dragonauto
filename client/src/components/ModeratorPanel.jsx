import React, { useState, useEffect, useCallback } from "react";
import ApplicationsMenu from "./ApplicationsMenu";
import RequestTableAll from "./RequestTableAll";
import RequestTableCar from "./RequestTableCar";
import RequestTablePart from "./RequestTablePart";
import CatalogManagement from "./CatalogManagement";
import ViewApplicationForm from "./ViewApplicationForm";
import SendEmailModal from "./SendEmailModal";

const API = import.meta.env.VITE_API_URL;

const STATUS_LABELS = {
  "в обработке": "В обработке",
  "в работе":    "В работе",
  "предложение": "Предложение",
  "согласована": "Согласована",
};

const ModeratorPanel = () => {
  const [applications, setApplications]       = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [activeSection, setActiveSection]     = useState("applications");
  const [activeTab, setActiveTab]             = useState("all");
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [selectedEmail, setSelectedEmail]     = useState(null);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [statusFilter, setStatusFilter]       = useState("");

  const token = localStorage.getItem("token");

  const loadApplications = useCallback(async () => {
    if (!token) { setError("Неавторизованный доступ"); setLoading(false); return; }
    try {
      const res = await fetch(`${API}/api/applications/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Ошибка загрузки заявок");
      }
      setApplications(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadApplications(); }, [loadApplications]);

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

  const handleStatusChanged = () => {
    loadApplications();
  };

  const filteredApps = statusFilter
    ? applications.filter(a => a.status === statusFilter)
    : applications;

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <span className="font-mont text-sm text-charcoal/90 dark:text-cream/90 tracking-widest uppercase animate-pulse">
        Загрузка заявок…
      </span>
    </div>
  );

  if (error) return (
    <div className="font-mont text-sm text-red-accent text-center py-8">{error}</div>
  );

  return (
    <section className="flex flex-col gap-6">
      {/* Section switcher */}
      <div className="flex gap-1 border-b border-charcoal/10 dark:border-cream/10 pb-0">
        {[
          { key: "applications", label: "Заявки" },
          { key: "catalog",      label: "Каталог" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`font-mont font-black text-xs tracking-widest uppercase px-5 py-3 border-b-2 transition-colors ${
              activeSection === key
                ? "border-red-accent text-charcoal dark:text-cream"
                : "border-transparent text-charcoal/90 dark:text-cream/90 hover:text-charcoal dark:hover:text-cream"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeSection === "applications" && (
        <>
          {/* Tabs + status filter row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ApplicationsMenu activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="font-mont text-xs bg-cream dark:bg-charcoal border border-charcoal/15 dark:border-cream/15 rounded-xl px-4 py-2 text-charcoal dark:text-cream focus:outline-none focus:border-red-accent/50 transition-colors"
            >
              <option value="" className="bg-cream dark:bg-charcoal">Все статусы</option>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val} className="bg-cream dark:bg-charcoal">
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Table (filtered) */}
          {activeTab === "all" && (
            <RequestTableAll
              applications={filteredApps}
              onView={(id) => setSelectedApplicationId(id)}
              onReply={(email, id) => handleReply(email, id)}
            />
          )}
          {activeTab === "car" && (
            <RequestTableCar
              applications={filteredApps}
              onView={(id) => setSelectedApplicationId(id)}
              onReply={(email, id) => handleReply(email, id)}
            />
          )}
          {activeTab === "part" && (
            <RequestTablePart
              applications={filteredApps}
              onView={(id) => setSelectedApplicationId(id)}
              onReply={(email, id) => handleReply(email, id)}
            />
          )}
        </>
      )}

      {activeSection === "catalog" && <CatalogManagement />}

      {/* Application modal */}
      {selectedApplicationId && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-cream dark:bg-charcoal rounded-2xl w-full max-w-3xl mx-4 p-6 shadow-2xl border border-charcoal/10 dark:border-cream/10">
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <span className="font-mont font-black text-xs tracking-widest uppercase text-charcoal/90 dark:text-cream/90">
                Просмотр заявки
              </span>
              <button
                onClick={() => setSelectedApplicationId(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-charcoal/8 dark:hover:bg-cream/8 transition text-charcoal/50 dark:text-cream/50"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <ViewApplicationForm
              applicationId={selectedApplicationId}
              onCancel={() => setSelectedApplicationId(null)}
              onReply={(email) => handleReply(email, selectedApplicationId)}
              statusControls={true}
              onStatusChanged={handleStatusChanged}
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
