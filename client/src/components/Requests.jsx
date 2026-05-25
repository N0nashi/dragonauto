import React, { useState, useEffect, useContext } from "react";
import { toast } from "../utils/toast";
import EditApplicationForm from "./EditApplicationForm";
import ApplicationComments from "./ApplicationComments";
import StatusStepper from "./StatusStepper";
import { useLang } from "../context/LangContext";
import { translateDesc } from "../utils/translateDesc";
import { AuthContext } from "../context/AuthContext";
import { STATUS_COLORS, isFinal, USER_EDITABLE, USER_CANCELLABLE, USER_CLOSEABLE } from "../utils/statusConfig";

const API = import.meta.env.VITE_API_URL;

export default function Requests({ initialOpenId = null, onOpenIdConsumed }) {
  const { t, lang } = useLang();
  const { refreshUnreadCount } = useContext(AuthContext);
  const tr = t.requests;
  const tt = t.toasts;

  const Badge = ({ status }) => {
    const cls = STATUS_COLORS[status] ?? "bg-charcoal/8 text-charcoal/50 dark:text-cream/50";
    const label = tr.statuses?.[status] ?? status;
    return (
      <span className={`font-mont font-bold text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border border-transparent ${cls}`}>
        {label}
      </span>
    );
  };

  const [apps, setApps]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing]   = useState(null);
  const [unreadMap, setUnreadMap] = useState({});
  const [itemModal, setItemModal] = useState(null);

  const token = localStorage.getItem("token");

  const loadApps = async () => {
    if (!token) { setLoading(false); return; }
    try {
      const r = await fetch(`${API}/api/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error();
      setApps(await r.json());
    } catch { toast.error(tt.requestsLoadFail); }
    finally { setLoading(false); }
  };

  const loadUnread = async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API}/api/notifications/per-application`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setUnreadMap(await r.json());
    } catch { /* silently */ }
  };

  useEffect(() => {
    loadApps();
    loadUnread();
  }, []);

  useEffect(() => {
    if (!initialOpenId || apps.length === 0) return;
    setExpanded(initialOpenId);
    setTimeout(() => {
      const el = document.getElementById(`app-card-${initialOpenId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    onOpenIdConsumed?.();
  }, [initialOpenId, apps]);

  const cancel = async (id) => {
    try {
      const r = await fetch(`${API}/api/applications/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error();
      await loadApps();
      toast.success(tt.requestCancelled);
    } catch { toast.error(tt.requestCancelFail); }
  };

  const closeApp = async (id) => {
    try {
      const r = await fetch(`${API}/api/applications/${id}/close`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!r.ok) throw new Error();
      await loadApps();
      toast.success(tt.requestClosed);
    } catch { toast.error(tt.requestCloseFail); }
  };

  const confirmOffer = async (id) => {
    try {
      const r = await fetch(`${API}/api/applications/${id}/confirm-offer`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!r.ok) throw new Error();
      await loadApps();
      toast.success(tt.offerAccepted);
    } catch { toast.error(tt.offerAcceptFail); }
  };

  if (editing) {
    return (
      <EditApplicationForm
        applicationId={editing.id}
        onSave={() => {
          setEditing(null);
          loadApps();
          toast.success(tt.requestUpdated);
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <span className="font-mont text-sm text-charcoal/30 dark:text-cream/30 tracking-widest uppercase animate-pulse">
        {tr.loading}
      </span>
    </div>
  );

  if (apps.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 border border-charcoal/10 dark:border-cream/10 rounded-2xl">
      <span className="font-mont text-4xl text-charcoal/10 dark:text-cream/10">∅</span>
      <p className="font-mont text-sm text-charcoal/30 dark:text-cream/30 tracking-widest uppercase">{tr.empty}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-mont font-black text-sm tracking-widest uppercase text-charcoal/40 dark:text-cream/40">
          {tr.title}
        </h3>
        <span className="font-mont text-xs text-charcoal/30 dark:text-cream/30">{apps.length} {lang === "en" ? "items" : "шт."}</span>
      </div>

      {itemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setItemModal(null)}>
          <div className="bg-cream dark:bg-charcoal rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            {itemModal.photo_url && (
              <img
                src={itemModal.photo_url.startsWith("http") ? itemModal.photo_url : `${API}${itemModal.photo_url}`}
                alt=""
                className="w-full h-56 object-cover"
              />
            )}
            <div className="p-5">
              <h3 className="font-mont font-black text-lg text-charcoal dark:text-cream mb-4">
                {itemModal._type === "car"
                  ? `${itemModal.brand} ${itemModal.model} ${itemModal.year}`
                  : itemModal.part_name}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {itemModal._type === "car" ? (<>
                  {itemModal.country    && <div><p className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{lang === "en" ? "Country" : "Страна"}</p><p className="font-mont font-bold text-sm text-charcoal dark:text-cream">{itemModal.country}</p></div>}
                  {itemModal.mileage != null && <div><p className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{lang === "en" ? "Mileage" : "Пробег"}</p><p className="font-mont font-bold text-sm text-charcoal dark:text-cream">{Number(itemModal.mileage).toLocaleString("ru-RU")} км</p></div>}
                  {itemModal.gearbox   && <div><p className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{lang === "en" ? "Gearbox" : "КПП"}</p><p className="font-mont font-bold text-sm text-charcoal dark:text-cream">{itemModal.gearbox}</p></div>}
                  {itemModal.drive     && <div><p className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{lang === "en" ? "Drive" : "Привод"}</p><p className="font-mont font-bold text-sm text-charcoal dark:text-cream">{itemModal.drive}</p></div>}
                  {itemModal.body      && <div><p className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{lang === "en" ? "Body" : "Кузов"}</p><p className="font-mont font-bold text-sm text-charcoal dark:text-cream">{itemModal.body}</p></div>}
                  {itemModal.engine_power && <div><p className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{lang === "en" ? "Power" : "Мощность"}</p><p className="font-mont font-bold text-sm text-charcoal dark:text-cream">{itemModal.engine_power} л.с.</p></div>}
                </>) : (<>
                  {itemModal.brand  && <div><p className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{lang === "en" ? "Brand" : "Марка"}</p><p className="font-mont font-bold text-sm text-charcoal dark:text-cream">{itemModal.brand}</p></div>}
                  {itemModal.model  && <div><p className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{lang === "en" ? "Model" : "Модель"}</p><p className="font-mont font-bold text-sm text-charcoal dark:text-cream">{itemModal.model}</p></div>}
                  {itemModal.year   && <div><p className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{lang === "en" ? "Year" : "Год"}</p><p className="font-mont font-bold text-sm text-charcoal dark:text-cream">{itemModal.year}</p></div>}
                  {itemModal.body   && <div><p className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{lang === "en" ? "Body" : "Кузов"}</p><p className="font-mont font-bold text-sm text-charcoal dark:text-cream">{itemModal.body}</p></div>}
                </>)}
                <div className="col-span-2"><p className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{lang === "en" ? "Price" : "Цена"}</p><p className="font-mont font-black text-lg text-red-accent">{Number(itemModal.price).toLocaleString("ru-RU")} ₽</p></div>
              </div>
              {itemModal.description && (
                <p className="font-mont text-sm text-charcoal/60 dark:text-cream/60 mt-3">{itemModal.description}</p>
              )}
              <button onClick={() => setItemModal(null)} className="mt-5 w-full font-mont font-black text-[10px] tracking-widest uppercase py-3 bg-charcoal/8 dark:bg-cream/8 text-charcoal dark:text-cream rounded-xl hover:opacity-80 transition">
                {lang === "en" ? "Close" : "Закрыть"}
              </button>
            </div>
          </div>
        </div>
      )}

      {apps.map((app) => {
        const { id, date, status, description, type, offered_price, matched_item, matched_item_type } = app;
        const isOpen    = expanded === id;
        const hasUnread = unreadMap[id] > 0;

        return (
          <div key={id} id={`app-card-${id}`}
            className={`border rounded-2xl overflow-hidden transition-all duration-200 ${isOpen ? "border-charcoal/25 dark:border-cream/25 ring-2 ring-red-accent/20" : "border-charcoal/10 dark:border-cream/10"}`}
          >
            {/* Row header */}
            <button
              onClick={() => {
                setExpanded(p => p === id ? null : id);
                if (!isOpen && hasUnread) {
                  setUnreadMap(m => ({ ...m, [id]: 0 }));
                  refreshUnreadCount?.();
                }
              }}
              className="w-full flex items-center gap-4 px-5 py-4 text-left"
            >
              <span className="font-mont text-xs text-charcoal/25 dark:text-cream/25 tabular-nums w-6 shrink-0">
                #{id}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-mont font-bold text-sm text-charcoal dark:text-cream">
                  {type === "car" ? tr.typeCar : type === "part" ? tr.typePart : type}
                </p>
                <p className="font-mont text-xs text-charcoal/40 dark:text-cream/40 mt-0.5">
                  {new Date(date).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {hasUnread && (
                  <span className="w-2 h-2 rounded-full bg-red-accent animate-pulse" title="Есть новые сообщения" />
                )}
                <Badge status={status} />
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                className={`text-charcoal/25 dark:text-cream/25 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Expanded panel */}
            {isOpen && (
              <div className="px-5 pb-5 border-t border-charcoal/10 dark:border-cream/10">

                {/* Status stepper */}
                <StatusStepper status={status} />

                {/* Description */}
                {description && (
                  <p className="font-mont text-sm text-charcoal/55 dark:text-cream/55 leading-relaxed mt-4 mb-4">
                    {translateDesc(description, lang)}
                  </p>
                )}

                {/* Offer block */}
                {status === "предложение" && offered_price && (
                  <div className="bg-orange-500/8 dark:bg-orange-400/8 border border-orange-500/20 rounded-xl px-4 py-3 mb-4">
                    <p className="font-mont font-bold text-sm text-orange-700 dark:text-orange-400 mb-2">
                      {lang === "en" ? "Offer found:" : "Найден вариант:"}
                      {" "}
                      <span className="text-red-accent">
                        {Number(offered_price).toLocaleString("ru-RU")} ₽
                      </span>
                    </p>
                    {matched_item && (
                      <button
                        onClick={() => setItemModal({ ...matched_item, _type: matched_item_type })}
                        className="w-full flex items-center gap-3 bg-charcoal/5 dark:bg-cream/5 hover:bg-charcoal/10 dark:hover:bg-cream/10 rounded-xl px-3 py-2 mb-2 transition text-left"
                      >
                        {matched_item.photo_url && (
                          <img
                            src={matched_item.photo_url.startsWith("http") ? matched_item.photo_url : `${API}${matched_item.photo_url}`}
                            alt=""
                            className="w-16 h-12 object-cover rounded-lg shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-mont font-bold text-sm text-charcoal dark:text-cream">
                            {matched_item_type === "car"
                              ? `${matched_item.brand} ${matched_item.model} ${matched_item.year}`
                              : matched_item.part_name}
                          </p>
                          <p className="font-mont text-xs text-charcoal/50 dark:text-cream/50">
                            {Number(matched_item.price).toLocaleString("ru-RU")} ₽
                          </p>
                        </div>
                        <span className="font-mont text-[10px] tracking-widest uppercase text-red-accent shrink-0">
                          {lang === "en" ? "Details →" : "Подробнее →"}
                        </span>
                      </button>
                    )}
                    <p className="font-mont text-xs text-charcoal/50 dark:text-cream/50">
                      {lang === "en"
                        ? "Manager found a suitable option. Click \"Accept offer\" to confirm."
                        : "Менеджер нашёл подходящий вариант. Нажмите «Принять предложение» для подтверждения."}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                {!isFinal(status) && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {USER_EDITABLE.includes(status) && (
                      <button onClick={() => setEditing(app)}
                        className="font-mont font-black text-[10px] tracking-widest uppercase px-4 py-2 border-2 border-charcoal/20 dark:border-cream/20 text-charcoal dark:text-cream rounded-xl hover:border-charcoal dark:hover:border-cream transition">
                        {tr.edit}
                      </button>
                    )}
                    {status === "предложение" && (
                      <button onClick={() => confirmOffer(id)}
                        className="font-mont font-black text-[10px] tracking-widest uppercase px-4 py-2 bg-orange-500 text-white rounded-xl hover:opacity-90 transition">
                        {lang === "en" ? "Accept offer" : "Принять предложение"}
                      </button>
                    )}
                    {USER_CLOSEABLE.includes(status) && (
                      <button onClick={() => closeApp(id)}
                        className="font-mont font-black text-[10px] tracking-widest uppercase px-4 py-2 bg-green-600 text-white rounded-xl hover:opacity-90 transition">
                        {lang === "en" ? "Mark as done" : "Выполнено"}
                      </button>
                    )}
                    {USER_CANCELLABLE.includes(status) && (
                      <button onClick={() => cancel(id)}
                        className="font-mont font-black text-[10px] tracking-widest uppercase px-4 py-2 border-2 border-red-accent/20 text-red-accent rounded-xl hover:bg-red-accent/5 transition">
                        {tr.cancel}
                      </button>
                    )}
                  </div>
                )}

                {/* Comments thread */}
                <ApplicationComments applicationId={id} authorRole="user" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
