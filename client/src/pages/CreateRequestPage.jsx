import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "../utils/toast";
import CarForm from "../components/CarForm";
import PartForm from "../components/PartForm";
import { useLang } from "../context/LangContext";

export default function CreateRequestPage() {
  const [tab, setTab]       = useState("car");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLang();
  const tr = t.createRequest;
  const tt = t.toasts;

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/auth");
  }, [navigate]);

  const send = async (formData) => {
    setLoading(true);
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ...formData, type: tab }),
      });
      const data = await r.json();
      if (!r.ok) { toast.error(data.error || tt.submitError); return; }
      toast.success(`${tt.requestSent} #${data.applicationId}`);
      navigate("/profile");
    } catch { toast.error(tt.connectionError); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-10">

        <div className="mb-8">
          <p className="font-mont text-[10px] tracking-[0.3em] text-charcoal/30 dark:text-cream/30 uppercase mb-1">
            DragonAuto
          </p>
          <h1 className="font-mont font-black text-3xl text-charcoal dark:text-cream tracking-tight">
            {tr.title}
          </h1>
          <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40 mt-1">
            {tr.subtitle}
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          {[
            { key: "car",  label: tr.tabCar, icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l3-4h8l3 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
                <circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/>
              </svg>
            )},
            { key: "part", label: tr.tabPart, icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
              </svg>
            )},
          ].map(({ key, label, icon }) => (
            <button key={key} onClick={() => !loading && setTab(key)}
              className={`flex items-center gap-2 font-mont font-bold text-sm px-5 py-2.5 rounded-xl border-2 transition-all duration-200 ${
                tab === key
                  ? "bg-red-accent border-red-accent text-cream"
                  : "bg-transparent border-charcoal/15 dark:border-cream/15 text-charcoal/60 dark:text-cream/60 hover:border-charcoal/40 dark:hover:border-cream/40"
              }`}>
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div className="bg-charcoal/2 dark:bg-cream/2 border border-charcoal/10 dark:border-cream/10 rounded-2xl p-6">
          {tab === "car"
            ? <CarForm  onSubmit={send} loading={loading} />
            : <PartForm onSubmit={send} loading={loading} />
          }
        </div>

      </div>
    </div>
  );
}
