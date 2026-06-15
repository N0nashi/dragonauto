import React, { useState, useEffect, useRef } from "react";
import { toast } from "../utils/toast";
import { Input, SingleSelect, PhotoUpload, SubmitBtn } from "./ui/FormFields";
import { COUNTRIES, BODIES, GEARBOXES, DRIVES } from "../constants/catalog";
import { useLang } from "../context/LangContext";

const API = import.meta.env.VITE_API_URL;
const tok = () => localStorage.getItem("token");
const authH = (json = true) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${tok()}`,
});

const TEXT_FIELDS_SP = ["brand", "model", "part_name"];
const MAX_TEXT_SP = 50;
const sanitizeText = (v) => v.replace(/[^a-zA-Z0-9\s\-\.]/g, "").slice(0, MAX_TEXT_SP);
const sanitizePartName = (v) => v.replace(/[^a-zA-Z0-9Ѐ-ӿ\s\-\.]/g, "").slice(0, MAX_TEXT_SP);
// марка — только буквы, пробел и дефис, без цифр
const sanitizeBrand = (v) => v.replace(/[^a-zA-Zа-яА-ЯёЁ\s\-]/g, "").slice(0, MAX_TEXT_SP);
const hasLetter = (v) => /[a-zA-Zа-яА-ЯёЁ]/.test(String(v ?? ""));
const blockSpecialNumeric = (e) => {
  if (["-", "+", "_", "e", "E", ".", ","].includes(e.key)) e.preventDefault();
};

function AddCarForm({ onSuccess }) {
  const { t } = useLang();
  const tf = t.supplier.form;
  const tt = t.toasts;

  const [form, setForm] = useState({
    brand: "", model: "", year: new Date().getFullYear(), price: "", country: "",
    mileage: "", body: "", gearbox: "", drive: "", engine_power: "",
  });
  const [photo, setPhoto]   = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const carFields = ["brand","model","year","price","country","mileage","body","gearbox","drive","engine_power"];
    if (carFields.some(k => form[k] === "" || form[k] == null) || !photo) {
      toast.error(tf.required); return;
    }
    if (!hasLetter(form.brand)) {
      toast.error("Марка должна содержать буквы"); return;
    }
    setLoading(true);
    try {
      let photo_url = null;
      if (photo) {
        const fd = new FormData();
        fd.append("file", photo);
        const r = await fetch(`${API}/api/upload?folder=cars`, { method: "POST", headers: { Authorization: `Bearer ${tok()}` }, body: fd });
        if (!r.ok) throw new Error("Ошибка загрузки фото");
        photo_url = (await r.json()).url;
      }
      const r = await fetch(`${API}/api/supplier/cars`, {
        method: "POST",
        headers: authH(),
        body: JSON.stringify({
          ...form,
          year: +form.year, price: +form.price,
          mileage: +form.mileage || 0,
          engine_power: form.engine_power ? +form.engine_power : null,
          photo_url,
        }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
      toast.success(tt.carSubmitted);
      setForm({ brand: "", model: "", year: new Date().getFullYear(), price: "", country: "", mileage: "", body: "", gearbox: "", drive: "", engine_power: "" });
      setPhoto(null);
      onSuccess?.();
    } catch (err) { toast.error(err.message || tt.genericError); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label={tf.brand} required placeholder="Toyota"
          value={form.brand} onChange={e => set("brand", sanitizeBrand(e.target.value))} disabled={loading} />
        <Input label={tf.model} required placeholder="Land Cruiser"
          value={form.model} onChange={e => set("model", sanitizeText(e.target.value))} disabled={loading} />
        <SingleSelect label={tf.country} required placeholder="Выберите…"
          options={COUNTRIES} value={form.country}
          onChange={v => set("country", v)} disabled={loading} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label={tf.year} required type="number" min="1950" max="2030" placeholder="2023"
          value={form.year} onChange={e => set("year", e.target.value)} onKeyDown={blockSpecialNumeric} disabled={loading} />
        <Input label={tf.price} required type="number" min="0" placeholder="3 500 000"
          value={form.price} onChange={e => set("price", e.target.value)} onKeyDown={blockSpecialNumeric} disabled={loading} />
        <Input label={tf.mileage} required type="number" min="0" placeholder="15 000"
          value={form.mileage} onChange={e => set("mileage", e.target.value)} onKeyDown={blockSpecialNumeric} disabled={loading} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <SingleSelect label={tf.body} required placeholder="—" options={BODIES}
          value={form.body} onChange={v => set("body", v)} disabled={loading} />
        <SingleSelect label={tf.gearbox} required placeholder="—" options={GEARBOXES}
          value={form.gearbox} onChange={v => set("gearbox", v)} disabled={loading} />
        <SingleSelect label={tf.drive} required placeholder="—" options={DRIVES}
          value={form.drive} onChange={v => set("drive", v)} disabled={loading} />
        <Input label={tf.power} required type="number" min="0" placeholder="249"
          value={form.engine_power} onChange={e => set("engine_power", e.target.value)} onKeyDown={blockSpecialNumeric} disabled={loading} />
      </div>
      <PhotoUpload file={photo} onChange={setPhoto} label={tf.carPhoto} required />
      <SubmitBtn loading={loading} label={tf.submit} loadingLabel={tf.submitting} />
    </form>
  );
}

function AddPartForm({ onSuccess }) {
  const { t } = useLang();
  const tf = t.supplier.form;
  const tt = t.toasts;

  const [form, setForm] = useState({
    part_name: "", brand: "", model: "", price: "",
    country: "", body: "", year: "",
  });
  const [photo, setPhoto]   = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const partFields = ["part_name", "price", "country", "brand", "model", "year", "body"];
    if (partFields.some(k => form[k] === "" || form[k] == null) || !photo) {
      toast.error(tf.required); return;
    }
    if (!hasLetter(form.part_name) || !hasLetter(form.brand)) {
      toast.error("Название и марка должны содержать буквы"); return;
    }
    setLoading(true);
    try {
      let photo_url = null;
      if (photo) {
        const fd = new FormData();
        fd.append("file", photo);
        const r = await fetch(`${API}/api/upload?folder=parts`, { method: "POST", headers: { Authorization: `Bearer ${tok()}` }, body: fd });
        if (!r.ok) throw new Error("Ошибка загрузки фото");
        photo_url = (await r.json()).url;
      }
      const r = await fetch(`${API}/api/supplier/parts`, {
        method: "POST",
        headers: authH(),
        body: JSON.stringify({
          ...form,
          price: +form.price,
          year: form.year ? +form.year : null,
          photo_url,
        }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
      toast.success(tt.partSubmitted);
      setForm({ part_name: "", brand: "", model: "", price: "", country: "", body: "", year: "" });
      setPhoto(null);
      onSuccess?.();
    } catch (err) { toast.error(err.message || tt.genericError); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={tf.partName} required placeholder="Передний бампер"
          value={form.part_name} onChange={e => set("part_name", sanitizePartName(e.target.value))} disabled={loading} />
        <Input label={tf.price} required type="number" min="0" placeholder="12 000"
          value={form.price} onChange={e => set("price", e.target.value)} onKeyDown={blockSpecialNumeric} disabled={loading} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SingleSelect label={tf.country} required placeholder="—" options={COUNTRIES}
          value={form.country} onChange={v => set("country", v)} disabled={loading} />
        <Input label={tf.carBrand} required placeholder="Toyota"
          value={form.brand} onChange={e => set("brand", sanitizeBrand(e.target.value))} disabled={loading} />
        <Input label={tf.carModel} required placeholder="Land Cruiser"
          value={form.model} onChange={e => set("model", sanitizeText(e.target.value))} disabled={loading} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SingleSelect label={tf.body} required placeholder="—" options={BODIES}
          value={form.body} onChange={v => set("body", v)} disabled={loading} />
        <Input label={tf.carYear} required type="number" min="1950" max="2030" placeholder="2020"
          value={form.year} onChange={e => set("year", e.target.value)} onKeyDown={blockSpecialNumeric} disabled={loading} />
      </div>
      <PhotoUpload file={photo} onChange={setPhoto} label={tf.partPhoto} required />
      <SubmitBtn loading={loading} label={tf.submit} loadingLabel={tf.submitting} />
    </form>
  );
}

/* Matched Requests tab */
function MatchedRequests({ initialOpenId = null, onInitConsumed }) {
  const { t } = useLang();
  const tt = t.toasts;
  const ts = t.supplier;

  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [messages, setMessages] = useState({});  // { appId: [...] }
  const [reply, setReply]     = useState({});     // { appId: "" }
  const [sending, setSending] = useState(false);
  const bottomRefs = useRef({});

  const SUPPLIER_STATUS = {
    pending:   { label: tt.supplierStatusPending,   cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    confirmed: { label: tt.supplierStatusConfirmed, cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    declined:  { label: tt.supplierStatusDeclined,  cls: "bg-red-accent/15 text-red-accent" },
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/supplier/matched-applications`, { headers: authH(false) });
      if (r.ok) setApps(await r.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Auto-open from notification
  useEffect(() => {
    if (!initialOpenId || apps.length === 0) return;
    setExpanded(initialOpenId);
    loadMessages(initialOpenId);
    setTimeout(() => {
      const el = document.getElementById(`matched-app-${initialOpenId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    onInitConsumed?.();
  }, [initialOpenId, apps]);

  const loadMessages = async (appId) => {
    const r = await fetch(`${API}/api/applications/${appId}/supplier-messages`, { headers: authH(false) });
    if (r.ok) {
      const data = await r.json();
      setMessages(prev => ({ ...prev, [appId]: data }));
    }
  };

  const openApp = (appId) => {
    const next = expanded === appId ? null : appId;
    setExpanded(next);
    if (next) loadMessages(next);
  };

  const sendMsg = async (appId) => {
    const text = (reply[appId] || "").trim();
    if (!text || sending) return;
    setSending(true);
    const r = await fetch(`${API}/api/applications/${appId}/supplier-messages`, {
      method: "POST",
      headers: authH(),
      body: JSON.stringify({ message: text }),
    });
    if (r.ok) {
      setReply(prev => ({ ...prev, [appId]: "" }));
      await loadMessages(appId);
      bottomRefs.current[appId]?.scrollIntoView({ behavior: "smooth" });
    } else toast.error(tt.submitError);
    setSending(false);
  };

  const confirm = async (appId, status) => {
    const r = await fetch(`${API}/api/applications/${appId}/supplier-confirm`, {
      method: "PATCH",
      headers: authH(),
      body: JSON.stringify({ status }),
    });
    if (r.ok) { toast.success(status === "confirmed" ? tt.matchConfirmed : tt.matchDeclined); load(); }
    else toast.error(tt.genericError);
  };

  if (loading) return <p className="font-mont text-sm text-charcoal/90 dark:text-cream/90 animate-pulse">{ts.loading}</p>;

  if (apps.length === 0) return (
    <div className="border-2 border-dashed border-charcoal/15 dark:border-cream/15 rounded-2xl p-10 text-center">
      <p className="font-mont text-sm text-charcoal/90 dark:text-cream/90">{tt.noActiveRequests}</p>
      <p className="font-mont text-xs text-charcoal/90 dark:text-cream/90 mt-1">{tt.noActiveRequestsHint}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {apps.map((app, i) => {
        const isOpen = expanded === app.id;
        const ss = SUPPLIER_STATUS[app.supplier_status] || SUPPLIER_STATUS.pending;
        const item = app.matched_item;
        const itemName = app.matched_item_type === "car"
          ? (item ? `${item.brand} ${item.model} ${item.year}` : `Авто #${app.matched_item_id}`)
          : (item ? item.part_name : `Запчасть #${app.matched_item_id}`);
        const msgs = messages[app.id] || [];

        return (
          <div key={app.id} id={`matched-app-${app.id}`}
            className={`border rounded-2xl overflow-hidden transition-all animate-slide-up ${isOpen ? "border-charcoal/25 dark:border-cream/25 ring-2 ring-red-accent/20" : "border-charcoal/10 dark:border-cream/10"}`}
            style={{ animationDelay: `${i * 40}ms` }}>
            <button className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-charcoal/3 dark:hover:bg-cream/3 transition-colors"
              onClick={() => openApp(app.id)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-mont font-bold text-sm text-charcoal dark:text-cream">Заявка #{app.id}</span>
                  <span className={`font-mont text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${ss.cls}`}>{ss.label}</span>
                  {app.unread_count > 0 && (
                    <span className="font-mont font-black text-[9px] px-1.5 py-0.5 rounded-full bg-red-accent text-cream">{app.unread_count} новых</span>
                  )}
                </div>
                <p className="font-mont text-xs text-charcoal/90 dark:text-cream/90 truncate">{itemName}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"
                className={`shrink-0 text-charcoal/90 dark:text-cream/90 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                <path d="M4 6l4 4 4-4"/>
              </svg>
            </button>

            {isOpen && (
              <div className="border-t border-charcoal/10 dark:border-cream/10 px-5 py-5 flex flex-col gap-4">

                {/* Confirm/decline buttons */}
                {app.supplier_status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => confirm(app.id, "confirmed")}
                      className="font-mont font-black text-xs tracking-widest uppercase px-4 py-2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded-xl hover:bg-emerald-500/25 transition">
                      ✓ Подтвердить наличие
                    </button>
                    <button onClick={() => confirm(app.id, "declined")}
                      className="font-mont font-black text-xs tracking-widest uppercase px-4 py-2 bg-red-accent/10 text-red-accent rounded-xl hover:bg-red-accent/20 transition">
                      ✕ Отклонить
                    </button>
                  </div>
                )}
                {app.supplier_status === "confirmed" && (
                  <p className="font-mont text-xs text-emerald-600 dark:text-emerald-400">✓ Вы подтвердили наличие товара</p>
                )}
                {app.supplier_status === "declined" && (
                  <p className="font-mont text-xs text-red-accent">✕ Вы отклонили этот запрос</p>
                )}

                {/* Messages */}
                <div>
                  <p className="font-mont text-[10px] tracking-widest uppercase text-charcoal/90 dark:text-cream/90 mb-2">
                    Переписка с менеджером
                  </p>
                  <div className="max-h-48 overflow-y-auto flex flex-col gap-2 mb-2 pr-1">
                    {msgs.length === 0 && (
                      <p className="font-mont text-xs text-charcoal/90 dark:text-cream/90 text-center py-3">Сообщений нет</p>
                    )}
                    {msgs.map(msg => (
                      <div key={msg.id} className={`flex flex-col gap-0.5 max-w-[85%] ${msg.sender_role === "supplier" ? "self-end items-end" : "self-start items-start"}`}>
                        <span className="font-mont text-[9px] tracking-widest uppercase text-charcoal/90 dark:text-cream/90 px-1">
                          {msg.sender_role === "admin" ? "Менеджер" : "Вы"}
                        </span>
                        <div className={`font-mont text-xs px-3 py-2 rounded-xl leading-relaxed whitespace-pre-line ${
                          msg.sender_role === "supplier"
                            ? "bg-red-accent text-cream rounded-br-sm"
                            : "bg-charcoal/8 dark:bg-cream/8 text-charcoal dark:text-cream rounded-bl-sm"
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    ))}
                    <div ref={el => { bottomRefs.current[app.id] = el; }} />
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={reply[app.id] || ""}
                      onChange={e => setReply(prev => ({ ...prev, [app.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(app.id); }}}
                      placeholder="Ответить менеджеру…"
                      disabled={sending}
                      className="flex-1 font-mont text-xs bg-charcoal/5 dark:bg-cream/5 border border-charcoal/10 dark:border-cream/10 rounded-xl px-3 py-2 text-charcoal dark:text-cream placeholder:text-charcoal/90 focus:outline-none focus:border-red-accent/40 transition-colors disabled:opacity-50"
                    />
                    <button onClick={() => sendMsg(app.id)} disabled={sending || !(reply[app.id] || "").trim()}
                      className="w-8 h-8 rounded-xl bg-red-accent flex items-center justify-center hover:opacity-90 transition disabled:opacity-40 shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SupplierPanel({ initialTab = null, initialOpenId = null, onInitConsumed }) {
  const { t } = useLang();
  const ts = t.supplier;
  const tt = t.toasts;

  const [tab, setTab]           = useState(initialTab || "listings");
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editPhoto, setEditPhoto] = useState(null);

  const statusMap = {
    pending:  { label: ts.statuses.pending,  cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    approved: { label: ts.statuses.approved, cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    rejected: { label: ts.statuses.rejected, cls: "bg-red-accent/15 text-red-accent" },
  };

  const Badge = ({ status }) => {
    const s = statusMap[status] || statusMap.pending;
    return (
      <span className={`font-mont font-bold text-[10px] tracking-widest uppercase px-2.5 py-0.5 rounded-full ${s.cls}`}>
        {s.label}
      </span>
    );
  };

  const loadListings = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/supplier/listings`, { headers: authH(false) });
      if (!r.ok) throw new Error();
      setListings(await r.json());
    } catch { toast.error(tt.productsLoadFail); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadListings(); }, []);

  const setEditField = (key, val) =>
    setEditing(e => ({ ...e, item: { ...e.item, [key]: val } }));

  const saveEdit = async () => {
    if (!editing) return;
    const { item, type } = editing;
    setEditSaving(true);
    try {
      let updatedItem = { ...item };
      if (editPhoto) {
        const fd = new FormData();
        fd.append("file", editPhoto);
        const up = await fetch(`${API}/api/upload?folder=${type === "car" ? "cars" : "parts"}`, {
          method: "POST", headers: { Authorization: `Bearer ${tok()}` }, body: fd,
        });
        if (!up.ok) throw new Error("Ошибка загрузки фото");
        updatedItem.photo_url = (await up.json()).url;
      }
      const url = type === "car"
        ? `${API}/api/supplier/my-car/${item.id}`
        : `${API}/api/supplier/my-part/${item.id}`;
      const r = await fetch(url, {
        method: "PATCH",
        headers: authH(),
        body: JSON.stringify(updatedItem),
      });
      if (r.ok) {
        toast.success(tt.productUpdated);
        setEditing(null);
        setEditPhoto(null);
        loadListings();
      } else {
        const d = await r.json().catch(() => ({}));
        toast.error(d.error || tt.saveError);
      }
    } catch { toast.error(tt.networkError); }
    finally { setEditSaving(false); }
  };

  const TABS = [
    { key: "listings",  label: ts.myProducts },
    { key: "requests",  label: ts.matchedRequests ?? "Запросы" },
    { key: "add-car",   label: ts.addCar },
    { key: "add-part",  label: ts.addPart },
  ];

  return (
    <div className="flex flex-col gap-5">

      <div className="flex gap-2 flex-wrap">
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`font-mont font-bold text-xs tracking-widest uppercase px-4 py-2 rounded-xl border-2 transition-all duration-200 ${
              tab === tb.key
                ? "bg-red-accent border-red-accent text-cream"
                : "border-charcoal/15 dark:border-cream/15 text-charcoal/60 dark:text-cream/60 hover:border-charcoal/40 dark:hover:border-cream/40"
            }`}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "listings" && (
        <div className="border border-charcoal/10 dark:border-cream/10 rounded-2xl p-5">
          <h3 className="font-mont font-black text-sm tracking-widest uppercase text-charcoal/90 dark:text-cream/90 mb-4">
            {ts.myProducts}
          </h3>
          {loading ? (
            <p className="font-mont text-sm text-charcoal/90 dark:text-cream/90 animate-pulse">{ts.loading}</p>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="font-mont text-sm text-charcoal/90 dark:text-cream/90">{ts.noProducts}</p>
              <button onClick={() => setTab("add-car")}
                className="font-mont font-black text-xs tracking-widest uppercase px-5 py-2 bg-red-accent text-cream rounded-xl hover:opacity-90 transition">
                {ts.addFirst}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {listings.map((item, i) => (
                <div key={i}
                  className="flex items-center gap-4 py-3 border-b border-charcoal/10 dark:border-cream/10 last:border-0">
                  <div className="w-14 h-10 rounded-lg overflow-hidden bg-charcoal/5 dark:bg-cream/5 shrink-0">
                    {item.photo_url ? (
                      <img
                        src={item.photo_url.startsWith("http") ? item.photo_url : `${API}${item.photo_url}`}
                        alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                          className="text-charcoal/20 dark:text-cream/20">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mont font-bold text-sm text-charcoal dark:text-cream truncate">
                      {item.type === "car" ? `${item.brand} ${item.model} ${item.year}` : item.part_name}
                    </p>
                    <p className="font-mont text-xs text-charcoal/90 dark:text-cream/90 mt-0.5">
                      {item.type === "car" ? ts.carLabel : ts.partLabel} · {item.price?.toLocaleString("ru-RU")} ₽
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge status={item.status || "pending"} />
                    <button
                      onClick={() => setEditing({ item: { ...item }, type: item.type })}
                      className="font-mont text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-lg border border-charcoal/15 dark:border-cream/15 text-charcoal/50 dark:text-cream/50 hover:border-red-accent/50 hover:text-red-accent transition-colors">
                      Изменить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-charcoal/40 dark:bg-charcoal/60 backdrop-blur-sm" onClick={() => { setEditing(null); setEditPhoto(null); }} />
          <div className="relative bg-cream dark:bg-charcoal rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal/10 dark:border-cream/10 shrink-0">
              <div>
                <h2 className="font-mont font-black text-base text-charcoal dark:text-cream">
                  {editing.type === "car" ? "Редактировать автомобиль" : "Редактировать запчасть"}
                </h2>
                <p className="font-mont text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                  После сохранения товар будет отправлен на повторную модерацию
                </p>
              </div>
              <button onClick={() => { setEditing(null); setEditPhoto(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal/90 dark:text-cream/90 hover:text-charcoal dark:hover:text-cream hover:bg-charcoal/8 transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/>
                </svg>
              </button>
            </div>
            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {(() => {
                const fldCls = "font-mont text-sm bg-charcoal/5 dark:bg-cream/5 border border-charcoal/10 dark:border-cream/10 rounded-xl px-3 py-2 text-charcoal dark:text-cream focus:outline-none focus:border-red-accent/50 transition-colors";
                const lbl = (text) => <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/90 dark:text-cream/90">{text}</span>;
                const numInput = (key, label, min, max) => (
                  <label key={key} className="flex flex-col gap-1">
                    {lbl(label)}
                    <input type="number" value={editing.item[key] ?? ""} min={min} max={max}
                      onChange={e => setEditField(key, e.target.value)}
                      onKeyDown={blockSpecialNumeric} className={fldCls} />
                  </label>
                );
                const txtInput = (key, label, span2 = false) => (
                  <label key={key} className={`flex flex-col gap-1${span2 ? " col-span-2" : ""}`}>
                    {lbl(label)}
                    <input type="text" value={editing.item[key] ?? ""}
                      onChange={e => setEditField(key, key === "part_name" ? sanitizePartName(e.target.value) : key === "brand" ? sanitizeBrand(e.target.value) : TEXT_FIELDS_SP.includes(key) ? sanitizeText(e.target.value) : e.target.value)}
                      className={fldCls} />
                  </label>
                );
                const selectInput = (key, label, opts) => (
                  <label key={key} className="flex flex-col gap-1">
                    {lbl(label)}
                    <select value={editing.item[key] ?? ""} onChange={e => setEditField(key, e.target.value)} className={fldCls}>
                      <option value="">— не выбрано</option>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                );
                const photoBlock = (
                  <div key="photo" className="col-span-2 flex flex-col gap-2">
                    {lbl("Фото")}
                    {editing.item.photo_url && !editPhoto && (
                      <img src={editing.item.photo_url.startsWith("http") ? editing.item.photo_url : `${API}${editing.item.photo_url}`}
                        alt="" className="w-full h-32 object-cover rounded-xl" />
                    )}
                    <PhotoUpload file={editPhoto} onChange={f => {
                      if (f && f.size > 10 * 1024 * 1024) { toast.error("Файл слишком большой (макс. 10 МБ)"); return; }
                      setEditPhoto(f || null);
                    }} label={editing.item.photo_url ? "Заменить фото" : "Загрузить фото"} />
                  </div>
                );
                return editing.type === "car" ? (
                  <div className="grid grid-cols-2 gap-4">
                    {txtInput("brand", "Марка *")}
                    {txtInput("model", "Модель *")}
                    {numInput("year",         "Год *",           1950, new Date().getFullYear() + 1)}
                    {numInput("price",        "Цена, ₽ *",       0)}
                    {selectInput("country",   "Страна *",        COUNTRIES)}
                    {numInput("mileage",      "Пробег, км",      0)}
                    {selectInput("body",      "Кузов",           BODIES)}
                    {selectInput("gearbox",   "КПП",             GEARBOXES)}
                    {selectInput("drive",     "Привод",          DRIVES)}
                    {numInput("engine_power", "Мощность, л.с.",  0)}
                    {photoBlock}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {txtInput("part_name", "Название *", true)}
                    {numInput("price",   "Цена, ₽ *",      0)}
                    {txtInput("brand",   "Марка авто")}
                    {txtInput("model",   "Модель авто")}
                    {numInput("year",    "Год авто",        1950, new Date().getFullYear() + 1)}
                    {selectInput("country", "Страна",      COUNTRIES)}
                    {selectInput("body",    "Кузов",       BODIES)}
                    {photoBlock}
                  </div>
                );
              })()}
            </div>
            {/* Modal footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-charcoal/10 dark:border-cream/10 shrink-0">
              <button onClick={saveEdit} disabled={editSaving}
                className="font-mont font-black text-xs tracking-widest uppercase px-5 py-2.5 bg-red-accent text-cream rounded-xl hover:opacity-90 transition disabled:opacity-50">
                {editSaving ? "Сохранение…" : "Сохранить и отправить"}
              </button>
              <button onClick={() => { setEditing(null); setEditPhoto(null); }}
                className="font-mont text-xs text-charcoal/90 dark:text-cream/90 hover:text-charcoal dark:hover:text-cream transition px-3 py-2">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "requests" && (
        <div className="border border-charcoal/10 dark:border-cream/10 rounded-2xl p-5">
          <h3 className="font-mont font-black text-sm tracking-widest uppercase text-charcoal/90 dark:text-cream/90 mb-4">
            {ts.matchedRequests ?? "Запросы модератора"}
          </h3>
          <MatchedRequests initialOpenId={initialOpenId} onInitConsumed={onInitConsumed} />
        </div>
      )}

      {tab === "add-car" && (
        <div className="border border-charcoal/10 dark:border-cream/10 rounded-2xl p-5">
          <h3 className="font-mont font-black text-sm tracking-widest uppercase text-charcoal/90 dark:text-cream/90 mb-5">
            {ts.addCarTitle}
          </h3>
          <AddCarForm onSuccess={() => { loadListings(); setTab("listings"); }} />
        </div>
      )}

      {tab === "add-part" && (
        <div className="border border-charcoal/10 dark:border-cream/10 rounded-2xl p-5">
          <h3 className="font-mont font-black text-sm tracking-widest uppercase text-charcoal/90 dark:text-cream/90 mb-5">
            {ts.addPartTitle}
          </h3>
          <AddPartForm onSuccess={() => { loadListings(); setTab("listings"); }} />
        </div>
      )}
    </div>
  );
}
