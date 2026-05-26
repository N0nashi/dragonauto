import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "../utils/toast";
import { useLang } from "../context/LangContext";
import ViewApplicationForm from "../components/ViewApplicationForm";
import { COUNTRIES, BODIES, GEARBOXES, DRIVES } from "../constants/catalog";

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem("token");
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

const fmt = (v) => (v !== null && v !== undefined && v !== "" ? v : "—");
const fmtPrice = (v) => (v ? `${Number(v).toLocaleString("ru-RU")} ₽` : "—");

const Btn = ({ onClick, cls = "", children, disabled }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`font-mont font-bold text-xs px-3 py-1.5 rounded-lg transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${cls}`}
  >
    {children}
  </button>
);

const TEXT_FIELDS_CATALOG = ["brand", "model", "part_name"];
const MAX_TEXT_LEN = 50;
const sanitizeText = (v) => v.replace(/[^a-zA-Z0-9\s\-\.]/g, "").slice(0, MAX_TEXT_LEN);
const blockSpecialNumeric = (e) => {
  if (["-", "+", "_", "e", "E", ".", ","].includes(e.key)) e.preventDefault();
};

const Field = ({ label, value, onChange, type = "text", required, min, max, fieldKey }) => {
  const handleChange = (e) => {
    let v = e.target.value;
    if (type === "number" && max !== undefined && v !== "") {
      const maxLen = String(Math.floor(+max)).length;
      if (v.replace(/[^0-9]/g, "").length > maxLen) return;
    }
    if (type === "text" && fieldKey && TEXT_FIELDS_CATALOG.includes(fieldKey)) {
      v = sanitizeText(v);
    }
    onChange(v);
  };
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">
        {label}{required && <span className="text-red-accent ml-0.5">*</span>}
      </span>
      <input
        type={type}
        value={value ?? ""}
        onChange={handleChange}
        onKeyDown={type === "number" ? blockSpecialNumeric : undefined}
        min={min}
        max={max}
        maxLength={type === "text" && fieldKey && TEXT_FIELDS_CATALOG.includes(fieldKey) ? MAX_TEXT_LEN : undefined}
        className="font-mont text-sm bg-charcoal/5 dark:bg-cream/5 border border-charcoal/10 dark:border-cream/10 rounded-lg px-3 py-2 text-charcoal dark:text-cream focus:outline-none focus:border-red-accent/50 transition-colors"
      />
    </label>
  );
};

const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
      active
        ? "bg-red-accent/10 text-red-accent"
        : "text-charcoal/50 dark:text-cream/50 hover:text-charcoal dark:hover:text-cream hover:bg-charcoal/5 dark:hover:bg-cream/5"
    }`}
  >
    <span className="shrink-0">{icon}</span>
    <span className="font-mont font-bold text-sm">{label}</span>
  </button>
);

const PAGE_SIZE = 15;

function AdminSelect({ value, onChange, options, placeholder = "Выберите…" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const current = options.find(o => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full font-mont text-sm bg-cream dark:bg-charcoal border border-charcoal/10 dark:border-cream/10 rounded-xl px-4 py-3 text-left flex items-center justify-between gap-2 focus:outline-none transition-colors hover:border-charcoal/25 dark:hover:border-cream/25">
        <span className={`truncate ${!value ? "text-charcoal/35 dark:text-cream/35" : "text-charcoal dark:text-cream"}`}>
          {current?.label ?? (value || placeholder)}
        </span>
        <svg width="11" height="6" viewBox="0 0 11 6" fill="none" className="shrink-0 text-charcoal/30 dark:text-cream/30 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "" }}>
          <path d="M1 1l4.5 4 4.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-cream dark:bg-charcoal border border-charcoal/10 dark:border-cream/10 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {options.map(o => {
            const sel = value === o.value;
            return (
              <button key={o.value} type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-charcoal/5 dark:hover:bg-cream/5 transition-colors text-left">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${sel ? "bg-red-accent" : "bg-charcoal/10 dark:bg-cream/10"}`}>
                  {sel && <div className="w-2 h-2 rounded-full bg-cream" />}
                </div>
                <span className={`font-mont text-sm ${sel ? "text-red-accent font-semibold" : "text-charcoal dark:text-cream"}`}>{o.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ
   SECTION 1 — Catalog
в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ */
function CatalogSection() {
  const { t, lang } = useLang();
  const tc = t.admin.catalog;
  const tt = t.toasts;
  const countryMap = t.catalog.countryMap ?? {};
  const bodyMap    = t.catalog.bodyMap    ?? {};
  const gearboxMap = t.catalog.gearboxMap ?? {};
  const driveMap   = t.catalog.driveMap   ?? {};

  const [cars, setCars]   = useState([]);
  const [parts, setParts] = useState([]);
  const [tab, setTab]     = useState("cars");
  const [editing, setEditing]     = useState(null);
  const [editPhoto, setEditPhoto] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState("");
  const [deleting, setDeleting]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [delBusy, setDelBusy]     = useState(false);
  const [adding, setAdding]       = useState(false);
  const [addForm, setAddForm]     = useState({});
  const [addPhoto, setAddPhoto]   = useState(null);
  const [addSaving, setAddSaving] = useState(false);
  const [addMsg, setAddMsg]       = useState("");

  const [search, setSearch]     = useState("");
  const [countryF, setCountryF] = useState("all");
  const [statusF, setStatusF]   = useState([]); // [] = все; иначе массив выбранных статусов
  const [sortDir, setSortDir]   = useState("desc");
  const [page, setPage]         = useState(1);

  const toggleStatus = (s) =>
    setStatusF(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );

  const load = useCallback(async () => {
    const res = await fetch(`${API}/api/supplier/all`, { headers: authHeaders() });
    if (res.ok) {
      const { cars: c, parts: p } = await res.json();
      setCars(c);
      setParts(p);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [tab, search, countryF, statusF, sortDir]);

  const startEdit = (type, item) => { setMsg(""); setEditPhoto(null); setEditing({ type, item: { ...item } }); };
  const cancelEdit = () => { setEditing(null); setEditPhoto(null); setMsg(""); };

  const save = async () => {
    setSaving(true);
    setMsg("");
    const { type, item } = editing;
    const payload = { ...item };

    if (!item.supplier_id) {
      if (type === "car") {
        const yr = +payload.year;
        const CY = new Date().getFullYear();
        if (yr < 1950 || yr > CY + 1) { toast.error(lang === "en" ? `Year: 1900 — ${CY + 1}` : `Год: 1950 — ${CY + 1}`); setSaving(false); return; }
        if (+payload.price <= 0 || +payload.price > 100_000_000) { toast.error(lang === "en" ? "Price: 1 — 100,000,000 ₽" : "Цена: 1 — 100 000 000 ₽"); setSaving(false); return; }
        if (+payload.mileage < 0 || +payload.mileage > 2_000_000) { toast.error(lang === "en" ? "Mileage: 0 — 2,000,000 km" : "Пробег: 0 — 2 000 000 км"); setSaving(false); return; }
        if (payload.engine_power && (+payload.engine_power <= 0 || +payload.engine_power > 1500)) { toast.error(lang === "en" ? "Power: 1 — 1500 hp" : "Мощность: 1 — 1500 л.с."); setSaving(false); return; }
      }
    }

    try {
      let url, method;
      if (item.supplier_id) {
        url    = type === "car" ? `${API}/api/supplier/car/${item.id}` : `${API}/api/supplier/part/${item.id}`;
        method = "PATCH";
      } else {
        if (editPhoto) {
          const fd = new FormData();
          fd.append("file", editPhoto);
          const upRes = await fetch(`${API}/api/upload?folder=${type === "car" ? "cars" : "parts"}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token()}` },
            body: fd,
          });
          if (!upRes.ok) throw new Error("Ошибка загрузки фото");
          const { url: photo_url } = await upRes.json();
          payload.photo_url = photo_url;
        }
        url    = type === "car" ? `${API}/api/cars/${item.id}` : `${API}/api/parts/${item.id}`;
        method = "PUT";
      }
      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      if (r.ok) { setMsg(tc.save); setEditing(null); setEditPhoto(null); load(); }
      else {
        const d = await r.json().catch(() => ({}));
        toast.error(d.error || tt.saveError);
      }
    } catch (err) {
      toast.error(err.message || tt.saveError);
    } finally {
      setSaving(false);
    }
  };

  const setField = (key, val) =>
    setEditing(e => ({ ...e, item: { ...e.item, [key]: val } }));

  const setAddField = (key, val) => setAddForm(p => ({ ...p, [key]: val }));

  const openAdd = () => {
    setAddForm({ status: "approved", year: new Date().getFullYear() });
    setAddMsg("");
    setAddPhoto(null);
    setAdding(true);
  };

  const doAdd = async () => {
    const isCar = tab === "cars";
    const CY = new Date().getFullYear();

    const REQ_CAR  = ["brand", "model", "year", "price", "country", "mileage", "body", "gearbox", "drive", "engine_power"];
    const REQ_PART = ["part_name", "price", "brand", "model", "year", "country", "body"];
    const required = isCar ? REQ_CAR : REQ_PART;
    const missing  = required.filter(k => !addForm[k] && addForm[k] !== 0);
    const noPhoto  = !addPhoto;
    if (missing.length > 0 || noPhoto) {
      const labels = [
        ...missing.map(k => tc.fields[k === "part_name" ? "name" : k] || k),
        ...(noPhoto ? ["Фото"] : []),
      ];
      setAddMsg(`Заполните: ${labels.join(", ")}`);
      return;
    }

    const rangeErrors = [];
    const yr = +addForm.year;
    if (!Number.isInteger(yr) || yr < 1950 || yr > CY + 1)
      rangeErrors.push(`Год: 1950 — ${CY + 1}`);
    const pr = +addForm.price;
    if (isNaN(pr) || pr <= 0 || pr > 100_000_000)
      rangeErrors.push("Цена: 1 — 100 000 000 ₽");
    if (isCar) {
      const ml = +addForm.mileage;
      if (isNaN(ml) || ml < 0 || ml > 2_000_000)
        rangeErrors.push("Пробег: 0 — 2 000 000 км");
      const pw = +addForm.engine_power;
      if (isNaN(pw) || pw <= 0 || pw > 1500)
        rangeErrors.push("Мощность: 1 — 1500 л.с.");
    }
    if (rangeErrors.length > 0) {
      setAddMsg(rangeErrors.join(". "));
      return;
    }

    setAddSaving(true);
    setAddMsg("");
    try {
      const fd = new FormData();
      fd.append("file", addPhoto);
      const upRes = await fetch(`${API}/api/upload?folder=${isCar ? "cars" : "parts"}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      if (!upRes.ok) throw new Error("Ошибка загрузки фото");
      const { url: photo_url } = await upRes.json();

      const endpoint = isCar ? `${API}/api/supplier/cars` : `${API}/api/supplier/parts`;
      const body = isCar
        ? {
            ...addForm, photo_url,
            year:         +addForm.year,
            price:        +addForm.price,
            mileage:      +addForm.mileage,
            engine_power: +addForm.engine_power,
          }
        : {
            ...addForm, photo_url,
            price: +addForm.price,
            year:  addForm.year ? +addForm.year : null,
          };
      const r = await fetch(endpoint, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "Ошибка удаления"); }
      setMsg(tc.addSuccess);
      setAdding(false);
      setAddForm({});
      setAddPhoto(null);
      load();
    } catch (err) {
      setAddMsg(err.message);
    } finally {
      setAddSaving(false);
    }
  };

  const startDelete = (type, item) => { setDeleting({ type, item }); setDeleteConfirm(false); };
  const cancelDelete = () => { setDeleting(null); setDeleteConfirm(false); };

  const doDelete = async () => {
    if (!deleting) return;
    setDelBusy(true);
    const { type, item } = deleting;
    const url = `${API}/api/supplier/${type}/${item.id}`;
    const r = await fetch(url, { method: "DELETE", headers: authHeaders() });
    setDelBusy(false);
    if (r.ok) {
      const d = await r.json();
      const extra = d.cancelledApplications > 0
        ? ` Отменено заявок: ${d.cancelledApplications}.`
        : "";
      setMsg(`Удалено.${extra}`);
      setDeleting(null);
      setDeleteConfirm(false);
      load();
    } else {
      toast.error(tt.deleteError);
      setDeleting(null);
    }
  };

  const source = tab === "cars" ? cars : parts;
  const countries = ["all", ...Array.from(new Set(source.map(i => i.country).filter(Boolean))).sort()];

  const filtered = source
    .filter(item => {
      const name = tab === "cars"
        ? `${item.brand} ${item.model} ${item.year}`
        : `${item.part_name} ${item.brand || ""} ${item.model || ""}`;
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
      if (countryF !== "all" && item.country !== countryF) return false;
      if (statusF.length > 0 && !statusF.includes(item.status)) return false;
      return true;
    })
    .sort((a, b) => {
      const tA = a.created_at ? new Date(a.created_at).getTime() : a.id;
      const tB = b.created_at ? new Date(b.created_at).getTime() : b.id;
      return sortDir === "desc" ? tB - tA : tA - tB;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-1">
        <h2 className="font-mont font-black text-xl text-charcoal dark:text-cream">{tc.title}</h2>
        <button onClick={openAdd}
          className="flex items-center gap-2 font-mont font-bold text-xs tracking-widest uppercase px-4 py-2 rounded-xl bg-red-accent text-cream hover:opacity-85 transition-opacity duration-200">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/>
          </svg>
          {tc.addBtn}
        </button>
      </div>
      <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40 mb-6">{tc.subtitle}</p>

{editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-cream dark:bg-charcoal rounded-2xl shadow-[0_8px_60px_-8px_rgba(0,0,0,0.28)] dark:shadow-[0_8px_60px_-8px_rgba(0,0,0,0.7)] border border-charcoal/10 dark:border-cream/10 w-full max-w-lg flex flex-col max-h-[90vh] animate-scale-in pointer-events-auto">
<div className="flex items-center justify-between px-6 py-4 border-b border-charcoal/10 dark:border-cream/10 shrink-0">
              <h3 className="font-mont font-black text-base text-charcoal dark:text-cream">
                {tc.editTitle} {editing.type === "car" ? tc.carWord : tc.partWord}
              </h3>
              <button onClick={cancelEdit}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal/40 dark:text-cream/40 hover:text-charcoal dark:hover:text-cream hover:bg-charcoal/8 dark:hover:bg-cream/8 transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/>
                </svg>
              </button>
            </div>
<div className="flex-1 overflow-y-auto px-6 py-5">

            {editing.item.supplier_id ? (
              <div className="flex flex-col gap-5">
{editing.item.photo_url && (
                  <img
                    src={editing.item.photo_url.startsWith("http") ? editing.item.photo_url : `${API}${editing.item.photo_url}`}
                    alt="" className="w-full h-40 object-cover rounded-xl" />
                )}
{editing.type === "car" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                    {[
                      [tc.fields.brand,   editing.item.brand],
                      [tc.fields.model,   editing.item.model],
                      [tc.fields.year,    editing.item.year],
                      [tc.fields.country, countryMap[editing.item.country]  ?? editing.item.country],
                      [tc.fields.price,   editing.item.price ? `${Number(editing.item.price).toLocaleString("ru-RU")} ₽` : null],
                      [tc.fields.mileage, editing.item.mileage ? `${Number(editing.item.mileage).toLocaleString("ru-RU")} ${tc.fields.mileageUnit}` : null],
                      [tc.fields.body,    bodyMap[editing.item.body]        ?? editing.item.body],
                      [tc.fields.gearbox, gearboxMap[editing.item.gearbox]  ?? editing.item.gearbox],
                      [tc.fields.drive,   driveMap[editing.item.drive]      ?? editing.item.drive],
                      [tc.fields.power,   editing.item.engine_power ? `${editing.item.engine_power} ${tc.fields.powerUnit}` : null],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/35 dark:text-cream/35">{label}</span>
                        <span className={`font-mont text-sm ${value ? "text-charcoal dark:text-cream" : "text-charcoal/20 dark:text-cream/20"}`}>{value || "—"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                    {[
                      [tc.fields.name,    editing.item.part_name],
                      [tc.fields.price,   editing.item.price ? `${Number(editing.item.price).toLocaleString("ru-RU")} ₽` : null],
                      [tc.fields.brand,   editing.item.brand],
                      [tc.fields.model,   editing.item.model],
                      [tc.fields.year,    editing.item.year],
                      [tc.fields.country, countryMap[editing.item.country] ?? editing.item.country],
                      [tc.fields.body,    bodyMap[editing.item.body]       ?? editing.item.body],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/35 dark:text-cream/35">{label}</span>
                        <span className={`font-mont text-sm ${value ? "text-charcoal dark:text-cream" : "text-charcoal/20 dark:text-cream/20"}`}>{value || "—"}</span>
                      </div>
                    ))}
                  </div>
                )}
<div className="pt-3 border-t border-charcoal/10 dark:border-cream/10 flex flex-col gap-3">
<div className="flex flex-col gap-1">
                    <span className="font-mont text-[11px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{tc.fields.status}</span>
                    <span className={`inline-flex self-start font-mont font-bold text-xs px-3 py-1 rounded-full ${
                      editing.item.status === "approved"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : editing.item.status === "rejected"
                        ? "bg-red-accent/10 text-red-accent"
                        : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                    }`}>
                      {tc.statuses[editing.item.status] ?? editing.item.status}
                    </span>
                  </div>
<div className="flex flex-col gap-1">
                    <span className="font-mont text-[11px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{tc.fields.changeTo}</span>
                    <AdminSelect
                      value={editing.item.status !== "approved" ? editing.item.status : ""}
                      onChange={v => setField("status", v)}
                      placeholder={tc.fields.choose}
                      options={[
                        { value: "pending",  label: tc.statuses.pending  },
                        { value: "rejected", label: tc.statuses.rejected },
                      ]}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
<div className="col-span-2 flex flex-col gap-1.5 mb-4">
                <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">
                  {tc.fields.photo}
                </span>
                <label className="flex items-center gap-3 border-2 border-dashed border-charcoal/15 dark:border-cream/15 rounded-xl px-4 py-3 cursor-pointer hover:border-red-accent/40 transition-colors group">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                    className="text-charcoal/30 dark:text-cream/30 group-hover:text-red-accent shrink-0 transition-colors">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span className="font-mont text-sm text-charcoal/40 dark:text-cream/40 truncate flex-1 group-hover:text-charcoal dark:group-hover:text-cream transition-colors">
                    {editPhoto ? editPhoto.name : tc.fields.changePhoto}
                  </span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => setEditPhoto(e.target.files[0] || null)} />
                </label>
                {editPhoto ? (
                  <img src={URL.createObjectURL(editPhoto)} alt="preview"
                    className="h-28 w-full object-cover rounded-xl" />
                ) : editing.item.photo_url ? (
                  <img src={editing.item.photo_url} alt="current"
                    className="h-28 w-full object-cover rounded-xl" />
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {editing.type === "car" ? (<>
                  <Field label={tc.fields.brand}   value={editing.item.brand}        onChange={v => setField("brand", v)}         fieldKey="brand" />
                  <Field label={tc.fields.model}   value={editing.item.model}        onChange={v => setField("model", v)}         fieldKey="model" />
                  <Field label={tc.fields.year}    value={editing.item.year}         onChange={v => setField("year", v)}          type="number" min="1950" max={new Date().getFullYear() + 1} />
                  <Field label={tc.fields.price}   value={editing.item.price}        onChange={v => setField("price", v)}         type="number" min="1" max={100_000_000} />
                  <div className="flex flex-col gap-1">
                    <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{tc.fields.country}</span>
                    <AdminSelect placeholder={tc.fields.choose} value={editing.item.country ?? ""} onChange={v => setField("country", v)} options={COUNTRIES.map(c => ({ value: c, label: countryMap[c] ?? c }))} />
                  </div>
                  <Field label={tc.fields.mileage} value={editing.item.mileage}      onChange={v => setField("mileage", v)}       type="number" min="0" max={2_000_000} />
                  <div className="flex flex-col gap-1">
                    <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{tc.fields.body}</span>
                    <AdminSelect placeholder={tc.fields.choose} value={editing.item.body ?? ""} onChange={v => setField("body", v)} options={BODIES.map(b => ({ value: b, label: bodyMap[b] ?? b }))} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{tc.fields.gearbox}</span>
                    <AdminSelect placeholder={tc.fields.choose} value={editing.item.gearbox ?? ""} onChange={v => setField("gearbox", v)} options={GEARBOXES.map(g => ({ value: g, label: gearboxMap[g] ?? g }))} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{tc.fields.drive}</span>
                    <AdminSelect placeholder={tc.fields.choose} value={editing.item.drive ?? ""} onChange={v => setField("drive", v)} options={DRIVES.map(d => ({ value: d, label: driveMap[d] ?? d }))} />
                  </div>
                  <Field label={tc.fields.power}   value={editing.item.engine_power} onChange={v => setField("engine_power", v)}  type="number" min="1" max={1500} />
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <span className="font-mont text-[11px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{tc.fields.status}</span>
                    <AdminSelect value={editing.item.status ?? "approved"} onChange={v => setField("status", v)}
                      options={[
                        { value: "approved", label: tc.statuses.approved },
                        { value: "pending",  label: tc.statuses.pending  },
                        { value: "rejected", label: tc.statuses.rejected },
                      ]} />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <span className="font-mont text-[11px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{tc.fields.description}</span>
                    <textarea value={editing.item.description ?? ""} onChange={e => setField("description", e.target.value)} rows={2}
                      className="w-full font-mont text-sm bg-charcoal/5 dark:bg-cream/5 border border-charcoal/10 dark:border-cream/10 rounded-xl px-4 py-3 text-charcoal dark:text-cream resize-none focus:outline-none focus:border-red-accent/50 transition-colors" />
                  </div>
                </>) : (<>
                  <div className="col-span-2">
                    <Field label={tc.fields.name}  value={editing.item.part_name}    onChange={v => setField("part_name", v)} fieldKey="part_name" />
                  </div>
                  <Field label={tc.fields.price}   value={editing.item.price}        onChange={v => setField("price", v)}    type="number" min="1" max={100_000_000} />
                  <Field label={tc.fields.brand}   value={editing.item.brand}        onChange={v => setField("brand", v)}    fieldKey="brand" />
                  <Field label={tc.fields.model}   value={editing.item.model}        onChange={v => setField("model", v)}    fieldKey="model" />
                  <Field label={tc.fields.year}    value={editing.item.year}         onChange={v => setField("year", v)}     type="number" min="1950" max={new Date().getFullYear() + 1} />
                  <div className="flex flex-col gap-1">
                    <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{tc.fields.country}</span>
                    <AdminSelect placeholder={tc.fields.choose} value={editing.item.country ?? ""} onChange={v => setField("country", v)} options={COUNTRIES.map(c => ({ value: c, label: countryMap[c] ?? c }))} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{tc.fields.body}</span>
                    <AdminSelect placeholder={tc.fields.choose} value={editing.item.body ?? ""} onChange={v => setField("body", v)} options={BODIES.map(b => ({ value: b, label: bodyMap[b] ?? b }))} />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <span className="font-mont text-[11px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{tc.fields.status}</span>
                    <AdminSelect value={editing.item.status ?? "approved"} onChange={v => setField("status", v)}
                      options={[
                        { value: "approved", label: tc.statuses.approved },
                        { value: "pending",  label: tc.statuses.pending  },
                        { value: "rejected", label: tc.statuses.rejected },
                      ]} />
                  </div>
                </>)}
              </div>
              </>
            )}
            {msg && <p className="font-mont text-sm text-red-accent mt-3">{msg}</p>}
            </div>
<div className="flex gap-3 px-6 py-4 border-t border-charcoal/10 dark:border-cream/10 shrink-0">
              <Btn onClick={save} disabled={saving}
                cls="bg-charcoal dark:bg-cream text-cream dark:text-charcoal hover:bg-red-accent hover:text-cream">
                {saving ? tc.saving : tc.save}
              </Btn>
              <Btn onClick={cancelEdit}
                cls="bg-charcoal/8 dark:bg-cream/8 text-charcoal/60 dark:text-cream/60 hover:bg-charcoal/15 dark:hover:bg-cream/15">
                {tc.cancel}
              </Btn>
            </div>
          </div>
        </div>
      )}

{adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-cream dark:bg-charcoal rounded-2xl shadow-[0_8px_60px_-8px_rgba(0,0,0,0.28)] dark:shadow-[0_8px_60px_-8px_rgba(0,0,0,0.7)] border border-charcoal/10 dark:border-cream/10 w-full max-w-lg flex flex-col max-h-[90vh] animate-scale-in pointer-events-auto">
<div className="flex items-center justify-between px-6 py-4 border-b border-charcoal/10 dark:border-cream/10 shrink-0">
              <h3 className="font-mont font-black text-base text-charcoal dark:text-cream">
                {tc.addTitle} — {tab === "cars" ? tc.carWord : tc.partWord}
              </h3>
              <button onClick={() => { setAdding(false); setAddForm({}); setAddPhoto(null); setAddMsg(""); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal/40 dark:text-cream/40 hover:text-charcoal dark:hover:text-cream hover:bg-charcoal/8 dark:hover:bg-cream/8 transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/>
                </svg>
              </button>
            </div>
<div className="flex-1 overflow-y-auto px-6 py-5">
<div className="col-span-2 flex flex-col gap-1.5 mb-1">
              <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">
                {tc.fields.photo} <span className="text-red-accent">*</span>
              </span>
              <label className="flex items-center gap-3 border-2 border-dashed border-charcoal/15 dark:border-cream/15 rounded-xl px-4 py-3 cursor-pointer hover:border-red-accent/40 transition-colors group">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                  className="text-charcoal/30 dark:text-cream/30 group-hover:text-red-accent shrink-0 transition-colors">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span className="font-mont text-sm text-charcoal/40 dark:text-cream/40 truncate flex-1 group-hover:text-charcoal dark:group-hover:text-cream transition-colors">
                  {addPhoto ? addPhoto.name : tc.fields.choose}
                </span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => setAddPhoto(e.target.files[0] || null)} />
              </label>
              {addPhoto && (
                <img src={URL.createObjectURL(addPhoto)} alt="preview"
                  className="h-28 w-full object-cover rounded-xl" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {tab === "cars" ? (<>
                <Field required label={tc.fields.brand}   value={addForm.brand ?? ""} onChange={v => setAddField("brand", v)} fieldKey="brand" />
                <Field required label={tc.fields.model}   value={addForm.model ?? ""} onChange={v => setAddField("model", v)} fieldKey="model" />
                <Field required label={tc.fields.year}    value={addForm.year  ?? ""} onChange={v => setAddField("year", v)}  type="number" min="1950" max={new Date().getFullYear() + 1} />
                <Field required label={tc.fields.price}   value={addForm.price ?? ""} onChange={v => setAddField("price", v)} type="number" min="1" max={100_000_000} />
<div className="flex flex-col gap-1">
                  <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">
                    {tc.fields.country}<span className="text-red-accent ml-0.5">*</span>
                  </span>
                  <AdminSelect placeholder={tc.fields.choose}
                    value={addForm.country ?? ""}
                    onChange={v => setAddField("country", v)}
                    options={COUNTRIES.map(c => ({ value: c, label: countryMap[c] ?? c }))} />
                </div>
                <Field required label={tc.fields.mileage} value={addForm.mileage ?? ""} onChange={v => setAddField("mileage", v)} type="number" min="0" max="2000000" />
<div className="flex flex-col gap-1">
                  <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">
                    {tc.fields.body}<span className="text-red-accent ml-0.5">*</span>
                  </span>
                  <AdminSelect placeholder={tc.fields.choose}
                    value={addForm.body ?? ""}
                    onChange={v => setAddField("body", v)}
                    options={BODIES.map(b => ({ value: b, label: bodyMap[b] ?? b }))} />
                </div>
<div className="flex flex-col gap-1">
                  <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">
                    {tc.fields.gearbox}<span className="text-red-accent ml-0.5">*</span>
                  </span>
                  <AdminSelect placeholder={tc.fields.choose}
                    value={addForm.gearbox ?? ""}
                    onChange={v => setAddField("gearbox", v)}
                    options={GEARBOXES.map(g => ({ value: g, label: gearboxMap[g] ?? g }))} />
                </div>
<div className="flex flex-col gap-1">
                  <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">
                    {tc.fields.drive}<span className="text-red-accent ml-0.5">*</span>
                  </span>
                  <AdminSelect placeholder={tc.fields.choose}
                    value={addForm.drive ?? ""}
                    onChange={v => setAddField("drive", v)}
                    options={DRIVES.map(d => ({ value: d, label: driveMap[d] ?? d }))} />
                </div>
                <Field required label={tc.fields.power} value={addForm.engine_power ?? ""} onChange={v => setAddField("engine_power", v)} type="number" min="1" max="1500" />
                <div className="col-span-2 flex flex-col gap-1.5">
                  <span className="font-mont text-[11px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{tc.fields.status}</span>
                  <AdminSelect
                    value={addForm.status ?? "approved"}
                    onChange={v => setAddField("status", v)}
                    options={[
                      { value: "approved", label: tc.statuses.approved },
                      { value: "pending",  label: tc.statuses.pending  },
                      { value: "rejected", label: tc.statuses.rejected },
                    ]}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <span className="font-mont text-[11px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{tc.fields.description}</span>
                  <textarea value={addForm.description ?? ""}
                    onChange={e => setAddField("description", e.target.value)}
                    rows={2}
                    className="w-full font-mont text-sm bg-charcoal/5 dark:bg-cream/5 border border-charcoal/10 dark:border-cream/10 rounded-xl px-4 py-3 text-charcoal dark:text-cream resize-none focus:outline-none focus:border-red-accent/50 transition-colors"
                  />
                </div>
              </>) : (<>
                <div className="col-span-2">
                  <Field required label={tc.fields.name} value={addForm.part_name ?? ""} onChange={v => setAddField("part_name", v)} fieldKey="part_name" />
                </div>
                <Field required label={tc.fields.price} value={addForm.price ?? ""} onChange={v => setAddField("price", v)} type="number" min="1" max={100_000_000} />
                <Field required label={tc.fields.brand} value={addForm.brand ?? ""} onChange={v => setAddField("brand", v)} fieldKey="brand" />
                <Field required label={tc.fields.model} value={addForm.model ?? ""} onChange={v => setAddField("model", v)} fieldKey="model" />
                <Field required label={tc.fields.year}  value={addForm.year  ?? ""} onChange={v => setAddField("year", v)}  type="number" min="1950" max={new Date().getFullYear() + 1} />
<div className="flex flex-col gap-1">
                  <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">
                    {tc.fields.country}<span className="text-red-accent ml-0.5">*</span>
                  </span>
                  <AdminSelect placeholder={tc.fields.choose}
                    value={addForm.country ?? ""}
                    onChange={v => setAddField("country", v)}
                    options={COUNTRIES.map(c => ({ value: c, label: countryMap[c] ?? c }))} />
                </div>
<div className="flex flex-col gap-1">
                  <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">
                    {tc.fields.body}<span className="text-red-accent ml-0.5">*</span>
                  </span>
                  <AdminSelect placeholder={tc.fields.choose}
                    value={addForm.body ?? ""}
                    onChange={v => setAddField("body", v)}
                    options={BODIES.map(b => ({ value: b, label: bodyMap[b] ?? b }))} />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <span className="font-mont text-[11px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">{tc.fields.status}</span>
                  <AdminSelect
                    value={addForm.status ?? "approved"}
                    onChange={v => setAddField("status", v)}
                    options={[
                      { value: "approved", label: tc.statuses.approved },
                      { value: "pending",  label: tc.statuses.pending  },
                      { value: "rejected", label: tc.statuses.rejected },
                    ]}
                  />
                </div>
              </>)}
            </div>
            {addMsg && <p className="font-mont text-sm text-red-accent mt-3">{addMsg}</p>}
            </div>
<div className="flex gap-3 px-6 py-4 border-t border-charcoal/10 dark:border-cream/10 shrink-0">
              <Btn onClick={doAdd} disabled={addSaving}
                cls="bg-charcoal dark:bg-cream text-cream dark:text-charcoal hover:bg-red-accent hover:text-cream">
                {addSaving ? tc.addSaving : tc.addBtn}
              </Btn>
              <Btn onClick={() => { setAdding(false); setAddForm({}); setAddPhoto(null); setAddMsg(""); }}
                cls="bg-charcoal/8 dark:bg-cream/8 text-charcoal/60 dark:text-cream/60 hover:bg-charcoal/15 dark:hover:bg-cream/15">
                {tc.cancel}
              </Btn>
            </div>
          </div>
        </div>
      )}

{deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-cream dark:bg-charcoal rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
            <div className="w-10 h-10 rounded-2xl bg-red-accent/10 flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-red-accent">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h3 className="font-mont font-black text-base text-charcoal dark:text-cream mb-1">
              {tc.deleteTitle}
            </h3>
            <p className="font-mont text-sm text-charcoal/50 dark:text-cream/50 mb-1">
              <span className="font-bold text-charcoal dark:text-cream">
                {deleting.type === "car"
                  ? `${deleting.item.brand} ${deleting.item.model} ${deleting.item.year}`
                  : deleting.item.part_name}
              </span>
            </p>
            <p className="font-mont text-xs text-red-accent mb-5">{tc.deleteWarning}</p>

            {!deleteConfirm ? (
              <div className="flex gap-3">
                <Btn onClick={() => setDeleteConfirm(true)}
                  cls="bg-red-accent/10 text-red-accent hover:bg-red-accent/20">
                  {tc.confirmDelete}
                </Btn>
                <Btn onClick={cancelDelete}
                  cls="bg-charcoal/8 dark:bg-cream/8 text-charcoal/60 dark:text-cream/60 hover:bg-charcoal/15 dark:hover:bg-cream/15">
                  {tc.cancel}
                </Btn>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="font-mont text-xs font-bold text-charcoal/70 dark:text-cream/70">
                  {tc.irreversible}
                </p>
                <div className="flex gap-3">
                  <Btn onClick={doDelete} disabled={delBusy}
                    cls="bg-red-accent text-cream hover:opacity-90">
                    {delBusy ? tc.deleting : tc.confirmDeleteFinal}
                  </Btn>
                  <Btn onClick={cancelDelete} disabled={delBusy}
                    cls="bg-charcoal/8 dark:bg-cream/8 text-charcoal/60 dark:text-cream/60 hover:bg-charcoal/15 dark:hover:bg-cream/15">
                    {tc.cancel}
                  </Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

<div className="flex gap-2 mb-4">
        {[["cars", tc.tabCars, cars.length], ["parts", tc.tabParts, parts.length]].map(([k, l, c]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`font-mont font-bold text-sm px-4 py-2 rounded-xl transition-colors ${
              tab === k ? "bg-red-accent/10 text-red-accent" : "text-charcoal/40 dark:text-cream/40 hover:text-charcoal dark:hover:text-cream"
            }`}>
            {l} <span className="opacity-60">({c})</span>
          </button>
        ))}
      </div>

<div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-40">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30 dark:text-cream/30">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === "cars" ? tc.searchCars : tc.searchParts}
            className="w-full font-mont text-xs pl-8 pr-3 py-2 bg-charcoal/5 dark:bg-cream/5 border border-charcoal/10 dark:border-cream/10 rounded-lg text-charcoal dark:text-cream placeholder:text-charcoal/30 dark:placeholder:text-cream/30 focus:outline-none focus:border-red-accent/40 transition-colors"
          />
        </div>

        <AdminSelect
          value={countryF}
          onChange={setCountryF}
          options={countries.map(c => ({ value: c, label: c === "all" ? tc.allCountries : (countryMap[c] ?? c) }))}
        />

        <AdminSelect
          value={sortDir}
          onChange={setSortDir}
          options={[
            { value: "desc", label: tc.newerFirst },
            { value: "asc",  label: tc.olderFirst },
          ]}
        />
      </div>

      {/* Фильтр по статусу */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/35 dark:text-cream/35 mr-1">
          {tc.statusFilter ?? "Статус"}:
        </span>
        {[
          { key: "pending",  color: "bg-amber-400/15 text-amber-600 dark:text-amber-400 border-amber-400/30"  },
          { key: "approved", color: "bg-emerald-400/15 text-emerald-600 dark:text-emerald-400 border-emerald-400/30" },
          { key: "rejected", color: "bg-red-accent/10 text-red-accent border-red-accent/25" },
        ].map(({ key, color }) => {
          const active = statusF.includes(key);
          const count  = source.filter(i => i.status === key).length;
          return (
            <button
              key={key}
              onClick={() => toggleStatus(key)}
              className={`font-mont font-bold text-[11px] px-3 py-1 rounded-lg border transition-all duration-150 ${
                active
                  ? color
                  : "bg-transparent border-charcoal/12 dark:border-cream/12 text-charcoal/40 dark:text-cream/40 hover:border-charcoal/25 dark:hover:border-cream/25"
              }`}
            >
              {tc.statuses[key]} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
        {statusF.length > 0 && (
          <button
            onClick={() => setStatusF([])}
            className="font-mont text-[11px] text-charcoal/35 dark:text-cream/35 hover:text-red-accent transition-colors px-1"
          >
            × сбросить
          </button>
        )}
      </div>

      <p className="font-mont text-xs text-charcoal/30 dark:text-cream/30 mb-3">
        {tc.found} {filtered.length} — {tc.page} {page} {tc.of} {totalPages}
      </p>

      {msg && !editing && (
        <p className="font-mont text-sm text-emerald-600 dark:text-emerald-400 mb-3">{msg}</p>
      )}

      <div className="space-y-2">
        {paginated.length === 0 && (
          <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40 py-4 text-center">{tc.noItems}</p>
        )}
        {paginated.map((item, i) => (
          <div key={item.id}
            className="flex items-center justify-between gap-4 bg-charcoal/3 dark:bg-cream/3 border border-charcoal/10 dark:border-cream/10 rounded-xl px-4 py-3 animate-slide-up"
            style={{ animationDelay: `${i * 35}ms` }}>
            <div className="flex items-center gap-3 min-w-0">
              {item.photo_url
                ? <img src={item.photo_url.startsWith("http") ? item.photo_url : `${API}${item.photo_url}`} alt="" className="w-12 h-10 object-cover rounded-lg shrink-0" />
                : <div className="w-12 h-10 rounded-lg bg-charcoal/8 dark:bg-cream/8 shrink-0" />
              }
              <div className="min-w-0">
                <p className="font-mont font-bold text-sm text-charcoal dark:text-cream truncate">
                  {tab === "cars"
                    ? `${item.brand} ${item.model} ${item.year}`
                    : `${item.part_name}${item.brand ? ` — ${item.brand}` : ""}${item.model ? ` ${item.model}` : ""}`}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="font-mont text-xs text-charcoal/40 dark:text-cream/40">
                    {fmtPrice(item.price)} — {fmt(countryMap[item.country] || item.country)}
                    {item.created_at && ` — ${new Date(item.created_at).toLocaleDateString("ru-RU")}`}
                  </span>
                  {item.status && (
                    <span className={`font-mont font-bold text-[10px] px-2 py-0.5 rounded-md ${
                      item.status === "approved" ? "bg-emerald-400/12 text-emerald-600 dark:text-emerald-400"
                      : item.status === "pending" ? "bg-amber-400/12 text-amber-600 dark:text-amber-400"
                      : "bg-red-accent/10 text-red-accent"
                    }`}>
                      {tc.statuses[item.status] ?? item.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Btn onClick={() => startEdit(tab === "cars" ? "car" : "part", item)}
                cls="bg-charcoal/8 dark:bg-cream/8 text-charcoal/70 dark:text-cream/70 hover:bg-red-accent/10 hover:text-red-accent">
                {tc.editBtn}
              </Btn>
              <Btn onClick={() => startDelete(tab === "cars" ? "car" : "part", item)}
                cls="bg-red-accent/8 text-red-accent/70 hover:bg-red-accent/15 hover:text-red-accent">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </Btn>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <Btn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            cls="bg-charcoal/8 dark:bg-cream/8 text-charcoal/60 dark:text-cream/60 hover:bg-charcoal/15 dark:hover:bg-cream/15">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </Btn>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
            .reduce((acc, n, idx, arr) => {
              if (idx > 0 && n - arr[idx - 1] > 1) acc.push("—");
              acc.push(n);
              return acc;
            }, [])
            .map((n, i) =>
              n === "—"
                ? <span key={`e${i}`} className="font-mont text-xs text-charcoal/30 dark:text-cream/30 px-1">←</span>
                : <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg font-mont font-bold text-xs transition-colors ${
                      page === n
                        ? "bg-red-accent text-cream"
                        : "bg-charcoal/8 dark:bg-cream/8 text-charcoal/60 dark:text-cream/60 hover:bg-charcoal/15 dark:hover:bg-cream/15"
                    }`}>
                    {n}
                  </button>
            )
          }
          <Btn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            cls="bg-charcoal/8 dark:bg-cream/8 text-charcoal/60 dark:text-cream/60 hover:bg-charcoal/15 dark:hover:bg-cream/15">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Btn>
        </div>
      )}
    </div>
  );
}

/* в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ
   SECTION 2 — Chatbot / Live support
в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ */
function ChatbotSection() {
  const { t } = useLang();
  const tc = t.admin.chatbot;
  const [tickets, setTickets]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);   // { id, first_name, last_name, email }
  const [messages, setMessages]       = useState([]);
  const [reply, setReply]             = useState("");
  const [sending, setSending]         = useState(false);
  const [closing, setClosing]         = useState(false);
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);

  const loadTickets = useCallback(async () => {
    const r = await fetch(`${API}/api/chat/admin/tickets`, { headers: authHeaders() });
    if (r.ok) setTickets(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  useEffect(() => {
    const iv = setInterval(loadTickets, 8000);
    return () => clearInterval(iv);
  }, [loadTickets]);

  const openTicket = async (ticket) => {
    setSelected(ticket);
    const r = await fetch(`${API}/api/chat/admin/messages/${ticket.id}`, { headers: authHeaders() });
    if (r.ok) { setMessages(await r.json()); loadTickets(); }
  };

  useEffect(() => {
    if (!selected) return;
    const poll = async () => {
      const r = await fetch(`${API}/api/chat/admin/messages/${selected.id}`, { headers: authHeaders() });
      if (r.ok) setMessages(await r.json());
    };
    pollRef.current = setInterval(poll, 4000);
    return () => clearInterval(pollRef.current);
  }, [selected?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    await fetch(`${API}/api/chat/admin/reply`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ sessionId: selected.id, message: reply.trim() }),
    });
    setReply("");
    setSending(false);
    const r = await fetch(`${API}/api/chat/admin/messages/${selected.id}`, { headers: authHeaders() });
    if (r.ok) setMessages(await r.json());
    loadTickets();
  };

  const closeTicket = async () => {
    if (!selected) return;
    setClosing(true);
    await fetch(`${API}/api/chat/admin/close/${selected.id}`, {
      method: "PATCH", headers: authHeaders(),
    });
    setClosing(false);
    setSelected(null);
    setMessages([]);
    loadTickets();
  };

  const senderCls = (sender) => {
    if (sender === "user")  return "bg-charcoal/8 dark:bg-cream/8 text-charcoal dark:text-cream self-start rounded-2xl rounded-bl-sm";
    if (sender === "admin") return "bg-red-accent text-cream self-end rounded-2xl rounded-br-sm";
    return "bg-charcoal/5 dark:bg-cream/5 text-charcoal/60 dark:text-cream/60 self-start rounded-2xl rounded-bl-sm border border-charcoal/10 dark:border-cream/10 text-xs italic";
  };

  const totalUnread = tickets.reduce((s, t) => s + (t.unread_count || 0), 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 className="font-mont font-black text-xl text-charcoal dark:text-cream">{tc.title}</h2>
        {totalUnread > 0 && (
          <span className="font-mont font-black text-[10px] tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-red-accent text-cream">
            {totalUnread} {tc.newCount}
          </span>
        )}
      </div>
      <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40 mb-6">
        {tc.subtitle}
      </p>

      <div className="flex gap-5 items-start min-h-[420px]">

<div className="w-64 shrink-0 flex flex-col gap-2">
          {loading && (
            <p className="font-mont text-sm text-charcoal/30 dark:text-cream/30 animate-pulse">{tc.loading}</p>
          )}
          {!loading && tickets.length === 0 && (
            <div className="border-2 border-dashed border-charcoal/15 dark:border-cream/15 rounded-2xl p-8 text-center">
              <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40">{tc.empty}</p>
            </div>
          )}
          {tickets.map((tk, i) => (
            <button key={tk.id} onClick={() => openTicket(tk)}
              className={`w-full text-left p-3 rounded-xl border transition-colors animate-slide-up ${
                selected?.id === tk.id
                  ? "bg-red-accent/8 border-red-accent/30"
                  : "bg-charcoal/3 dark:bg-cream/3 border-charcoal/10 dark:border-cream/10 hover:border-charcoal/20 dark:hover:border-cream/20"
              }`}
              style={{ animationDelay: `${i * 45}ms` }}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-mont font-bold text-xs text-charcoal dark:text-cream truncate">
                  {tk.first_name ? `${tk.first_name} ${tk.last_name}` : tc.guest}
                </p>
                {tk.unread_count > 0 && (
                  <span className="shrink-0 font-mont font-black text-[9px] px-1.5 py-0.5 rounded-full bg-red-accent text-cream">
                    {tk.unread_count}
                  </span>
                )}
              </div>
              {tk.email && (
                <p className="font-mont text-[10px] text-charcoal/40 dark:text-cream/40 truncate">{tk.email}</p>
              )}
              {tk.last_message && (
                <p className="font-mont text-[11px] text-charcoal/50 dark:text-cream/50 truncate mt-1">{tk.last_message}</p>
              )}
              <span className={`inline-block mt-1.5 font-mont text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full ${
                tk.status === "active"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              }`}>
                {tk.status === "active" ? tc.statusActive : tc.statusPending}
              </span>
            </button>
          ))}
        </div>

{selected ? (
          <div className="flex-1 border border-charcoal/10 dark:border-cream/10 rounded-2xl flex flex-col overflow-hidden" style={{ height: "480px" }}>
<div className="px-5 py-3.5 border-b border-charcoal/10 dark:border-cream/10 flex items-center justify-between shrink-0">
              <div>
                <p className="font-mont font-bold text-sm text-charcoal dark:text-cream">
                  {selected.first_name ? `${selected.first_name} ${selected.last_name}` : tc.guest}
                </p>
                {selected.email && (
                  <p className="font-mont text-xs text-charcoal/40 dark:text-cream/40">{selected.email}</p>
                )}
              </div>
              <Btn onClick={closeTicket} disabled={closing}
                cls="bg-charcoal/8 dark:bg-cream/8 text-charcoal/60 dark:text-cream/60 hover:bg-red-accent/10 hover:text-red-accent">
                {closing ? tc.closing : tc.closeBtn}
              </Btn>
            </div>

<div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5">
              {messages.map((msg, i) => (
                <div key={msg.id}
                  className={`flex flex-col gap-0.5 max-w-[80%] animate-slide-up ${msg.sender === "admin" ? "items-end self-end" : "items-start self-start"}`}
                  style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                  {msg.sender === "user" && (
                    <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/30 dark:text-cream/30 px-1">{tc.labelClient}</span>
                  )}
                  {msg.sender === "bot" && (
                    <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/25 dark:text-cream/25 px-1">{tc.labelBot}</span>
                  )}
                  <div className={`font-mont text-sm px-4 py-2.5 leading-relaxed whitespace-pre-line ${senderCls(msg.sender)}`}>
                    {msg.message}
                  </div>
                  <span className="font-mont text-[10px] text-charcoal/25 dark:text-cream/25 px-1">
                    {new Date(msg.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

<div className="px-3 py-3 border-t border-charcoal/10 dark:border-cream/10 flex gap-2 shrink-0">
              <input
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); }}}
                placeholder={tc.replyPlaceholder}
                disabled={sending}
                className="flex-1 font-mont text-sm bg-charcoal/5 dark:bg-cream/5 border border-charcoal/10 dark:border-cream/10 rounded-xl px-4 py-2.5 text-charcoal dark:text-cream placeholder:text-charcoal/30 dark:placeholder:text-cream/30 focus:outline-none focus:border-red-accent/40 transition-colors disabled:opacity-50"
              />
              <button onClick={sendReply} disabled={sending || !reply.trim()}
                className="w-10 h-10 rounded-xl bg-red-accent flex items-center justify-center hover:opacity-90 transition disabled:opacity-40 shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 border-2 border-dashed border-charcoal/10 dark:border-cream/10 rounded-2xl flex items-center justify-center" style={{ height: "480px" }}>
            <p className="font-mont text-sm text-charcoal/30 dark:text-cream/30">{tc.selectHint}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ
   SECTION 3 — Supplier Moderation
в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ */
function SupplierModerationSection() {
  const { t } = useLang();
  const tm = t.admin.moderation;
  const countryMap = t.catalog.countryMap ?? {};

  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  const [typeF, setTypeF]     = useState("all");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`${API}/api/supplier/pending`, { headers: authHeaders() });
    if (r.ok) setItems(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const moderate = async (id, type, status) => {
    const key = `${type}-${id}`;
    setBusy(key);
    await fetch(`${API}/api/supplier/moderate`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ id, type, status }),
    });
    setBusy(null);
    load();
  };

  const sorted = [...items]
    .filter(i => typeF === "all" || i.type === typeF)
    .sort((a, b) => sortDir === "desc" ? b.id - a.id : a.id - b.id);

  return (
    <div>
      <h2 className="font-mont font-black text-xl text-charcoal dark:text-cream mb-1">{tm.title}</h2>
      <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40 mb-5">{tm.subtitle}</p>

      <div className="flex flex-wrap gap-2 mb-5">
        <AdminSelect
          value={typeF}
          onChange={setTypeF}
          options={[
            { value: "all",  label: tm.allTypes },
            { value: "car",  label: tm.cars     },
            { value: "part", label: tm.parts    },
          ]}
        />
        <AdminSelect
          value={sortDir}
          onChange={setSortDir}
          options={[
            { value: "desc", label: tm.newerFirst },
            { value: "asc",  label: tm.olderFirst },
          ]}
        />
        {items.length > 0 && (
          <span className="font-mont text-xs text-charcoal/30 dark:text-cream/30 self-center ml-1">
            {sorted.length}
          </span>
        )}
      </div>

      {loading && <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40 animate-pulse">{tm.loading}</p>}

      {!loading && sorted.length === 0 && (
        <div className="border-2 border-dashed border-charcoal/15 dark:border-cream/15 rounded-2xl p-10 text-center">
          <p className="font-mont font-bold text-sm text-charcoal/50 dark:text-cream/50">{tm.empty}</p>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((item, i) => {
          const key = `${item.type}-${item.id}`;
          const isBusy = busy === key;
          const isOpen = expanded === key;

          const Field = ({ label, value }) => (
            <div className="flex flex-col gap-0.5">
              <span className="font-mont text-[10px] tracking-widest uppercase text-charcoal/35 dark:text-cream/35">{label}</span>
              <span className={`font-mont text-sm ${value ? "text-charcoal dark:text-cream" : "text-charcoal/20 dark:text-cream/20"}`}>
                {value || "—"}
              </span>
            </div>
          );

          return (
            <div key={key}
              className={`border rounded-2xl overflow-hidden transition-all duration-200 animate-slide-up ${isOpen ? "border-charcoal/25 dark:border-cream/25" : "border-charcoal/10 dark:border-cream/10"}`}
              style={{ animationDelay: `${i * 45}ms` }}>

<button
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-charcoal/3 dark:hover:bg-cream/3 transition-colors"
                onClick={() => setExpanded(p => p === key ? null : key)}
              >
                <div className="w-14 h-12 rounded-xl overflow-hidden bg-charcoal/5 dark:bg-cream/5 shrink-0">
                  {item.photo_url ? (
                    <img src={item.photo_url.startsWith("http") ? item.photo_url : `${API}${item.photo_url}`}
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
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-mont font-bold text-sm text-charcoal dark:text-cream">
                      {item.type === "car" ? `${item.brand} ${item.model}, ${item.year}` : item.part_name}
                    </span>
                    <span className="font-mont text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-charcoal/8 dark:bg-cream/8 text-charcoal/50 dark:text-cream/50">
                      {item.type === "car" ? tm.carBadge : tm.partBadge}
                    </span>
                  </div>
                  <p className="font-mont text-xs text-charcoal/50 dark:text-cream/50">
                    {fmtPrice(item.price)}{item.type === "car" && item.country ? ` — ${countryMap[item.country] || item.country}` : ""}
                  </p>
                  <p className="font-mont text-[11px] text-charcoal/35 dark:text-cream/35 mt-0.5">
                    {tm.supplierLabel} {item.first_name} {item.last_name}
                    {item.email && <span className="text-charcoal/25 dark:text-cream/25"> · {item.email}</span>}
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`shrink-0 text-charcoal/30 dark:text-cream/30 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                  <path d="M4 6l4 4 4-4"/>
                </svg>
              </button>

              {/* Expanded details */}
              {isOpen && (
                <div className="border-t border-charcoal/10 dark:border-cream/10 px-5 py-5 animate-fade-in">
                  {/* Full photo */}
                  {item.photo_url && (
                    <div className="mb-5 rounded-xl overflow-hidden bg-charcoal/5 dark:bg-cream/5" style={{ maxHeight: 240 }}>
                      <img src={item.photo_url.startsWith("http") ? item.photo_url : `${API}${item.photo_url}`}
                        alt="" className="w-full h-full object-cover" style={{ maxHeight: 240 }} />
                    </div>
                  )}

                  {/* Fields grid */}
                  {item.type === "car" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 mb-5">
                      <Field label="Марка"    value={item.brand} />
                      <Field label="Модель"   value={item.model} />
                      <Field label="Год"      value={item.year} />
                      <Field label="Страна"   value={item.country} />
                      <Field label="Цена"     value={item.price ? `${Number(item.price).toLocaleString("ru-RU")} ₽` : null} />
                      <Field label="Пробег"   value={item.mileage ? `${Number(item.mileage).toLocaleString("ru-RU")} км` : null} />
                      <Field label="Кузов"    value={item.body} />
                      <Field label="КПП"      value={item.gearbox} />
                      <Field label="Привод"   value={item.drive} />
                      <Field label="Мощность" value={item.engine_power ? `${item.engine_power} л.с.` : null} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 mb-5">
                      <Field label="Название"   value={item.part_name} />
                      <Field label="Цена"       value={item.price ? `${Number(item.price).toLocaleString("ru-RU")} ₽` : null} />
                      <Field label="Марка авто" value={item.brand} />
                      <Field label="Модель авто" value={item.model} />
                      <Field label="Год авто"   value={item.year} />
                      <Field label="Страна"     value={item.country} />
                      <Field label="Кузов"      value={item.body} />
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2 border-t border-charcoal/10 dark:border-cream/10">
                    <Btn disabled={isBusy} onClick={() => moderate(item.id, item.type, "approved")}
                      cls="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25">
                      {isBusy ? "—" : tm.approve}
                    </Btn>
                    <Btn disabled={isBusy} onClick={() => moderate(item.id, item.type, "rejected")}
                      cls="bg-red-accent/10 text-red-accent hover:bg-red-accent/20">
                      {isBusy ? "—" : tm.reject}
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ
   SECTION 4 — Suppliers
в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ */
function SuppliersSection() {
  const { t } = useLang();
  const ts = t.admin.suppliers;

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busy, setBusy]           = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`${API}/api/supplier/suppliers`, { headers: authHeaders() });
    if (r.ok) setSuppliers(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id, currentlyBlocked) => {
    setBusy(id);
    await fetch(`${API}/api/supplier/block/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ blocked: !currentlyBlocked }),
    });
    setBusy(null);
    load();
  };

  return (
    <div>
      <h2 className="font-mont font-black text-xl text-charcoal dark:text-cream mb-1">{ts.title}</h2>
      <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40 mb-6">{ts.subtitle}</p>

      {loading && <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40 animate-pulse">{ts.loading}</p>}

      {!loading && suppliers.length === 0 && (
        <div className="border-2 border-dashed border-charcoal/15 dark:border-cream/15 rounded-2xl p-10 text-center">
          <p className="font-mont font-bold text-sm text-charcoal/50 dark:text-cream/50">{ts.empty}</p>
        </div>
      )}

      <div className="space-y-3">
        {suppliers.map((s, i) => (
          <div key={s.id}
            className={`flex items-center justify-between gap-4 border rounded-xl px-4 py-3 transition-colors animate-slide-up ${
              s.is_blocked
                ? "bg-red-accent/5 border-red-accent/20"
                : "bg-charcoal/3 dark:bg-cream/3 border-charcoal/10 dark:border-cream/10"
            }`}
            style={{ animationDelay: `${i * 40}ms` }}>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-mont font-bold text-sm text-charcoal dark:text-cream">
                  {s.first_name} {s.last_name}
                </p>
                {s.is_blocked && (
                  <span className="font-mont font-bold text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-red-accent/15 text-red-accent">
                    {ts.blocked}
                  </span>
                )}
              </div>
              <p className="font-mont text-xs text-charcoal/40 dark:text-cream/40">{s.email}</p>
              <p className="font-mont text-[10px] text-charcoal/30 dark:text-cream/30 mt-0.5">
                ID: {s.id} — {ts.regDate} {new Date(s.created_at).toLocaleDateString("ru-RU")}
              </p>
            </div>
            <Btn disabled={busy === s.id} onClick={() => toggle(s.id, s.is_blocked)}
              cls={s.is_blocked
                ? "shrink-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25"
                : "shrink-0 bg-red-accent/10 text-red-accent hover:bg-red-accent/20"
              }>
              {busy === s.id ? "—" : (s.is_blocked ? ts.unblock : ts.block)}
            </Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

/* в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ
   SECTION 5 — Applications
в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ */
function ApplicationsSection() {
  const { t } = useLang();
  const ta = t.admin.applications;

  const STATUS_COLORS = {
    "в обработке": "bg-yellow-400/15 text-yellow-700 dark:text-yellow-400",
    "в работе":    "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    "предложение": "bg-orange-500/15 text-orange-700 dark:text-orange-400",
    "согласована": "bg-purple-500/15 text-purple-700 dark:text-purple-400",
    "выполнена":   "bg-green-500/15 text-green-700 dark:text-green-400",
    "отменена":    "bg-red-accent/10 text-red-accent",
  };

  const Badge = ({ status }) => {
    const cls = STATUS_COLORS[status] ?? "bg-charcoal/8 text-charcoal/50";
    return (
      <span className={`font-mont text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${cls}`}>
        {ta.statuses[status] ?? status}
      </span>
    );
  };

  const [apps, setApps]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter]     = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`${API}/api/applications/all`, { headers: authHeaders() });
    if (r.ok) setApps(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = apps.filter(a => {
    if (filter === "car")  return a.type === "car";
    if (filter === "part") return a.type === "part";
    return true;
  });

  return (
    <div>
      <h2 className="font-mont font-black text-xl text-charcoal dark:text-cream mb-1">{ta.title}</h2>
      <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40 mb-6">{ta.subtitle}</p>

      <div className="flex gap-2 flex-wrap mb-5">
        {[["all", ta.all], ["car", ta.cars], ["part", ta.parts]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`font-mont font-bold text-xs px-3 py-1.5 rounded-lg transition-colors ${
              filter === k
                ? "bg-red-accent/10 text-red-accent"
                : "bg-charcoal/5 dark:bg-cream/5 text-charcoal/50 dark:text-cream/50 hover:text-charcoal dark:hover:text-cream"
            }`}>
            {l}
          </button>
        ))}
      </div>

      {loading && <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40 animate-pulse">{ta.loading}</p>}

      {!loading && filtered.length === 0 && (
        <div className="border-2 border-dashed border-charcoal/15 dark:border-cream/15 rounded-2xl p-10 text-center">
          <p className="font-mont font-bold text-sm text-charcoal/50 dark:text-cream/50">{ta.empty}</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((app, i) => {
          const isOpen = expanded === app.id;
          return (
            <div key={app.id}
              className={`border rounded-2xl overflow-hidden transition-all duration-200 animate-slide-up ${isOpen ? "border-charcoal/25 dark:border-cream/25" : "border-charcoal/10 dark:border-cream/10"}`}
              style={{ animationDelay: `${i * 40}ms` }}>

              <button
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-charcoal/3 dark:hover:bg-cream/3 transition-colors"
                onClick={() => setExpanded(p => p === app.id ? null : app.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    app.type === "car" ? "bg-red-accent/10" : "bg-charcoal/8 dark:bg-cream/8"
                  }`}>
                    {app.type === "car" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" className="text-red-accent">
                        <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l3-4h8l3 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
                        <circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" className="text-charcoal/50 dark:text-cream/50">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mont font-bold text-sm text-charcoal dark:text-cream">
                        {ta.requestPrefix}{app.id}
                      </span>
                      <Badge status={app.status} />
                    </div>
                    <p className="font-mont text-xs text-charcoal/40 dark:text-cream/40">
                      {app.first_name} {app.last_name} — {app.email} ·{" "}
                      {new Date(app.date).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`shrink-0 text-charcoal/30 dark:text-cream/30 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                  <path d="M4 6l4 4 4-4"/>
                </svg>
              </button>

              {isOpen && (
                <div className="border-t border-charcoal/10 dark:border-cream/10 px-5 py-5">
                  <ViewApplicationForm
                    applicationId={app.id}
                    statusControls={true}
                    onStatusChanged={load}
                    onCancel={() => setExpanded(null)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ
   MAIN PAGE
в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ */
export default function AdminPage() {
  const [allowed, setAllowed] = useState(false);
  const [section, setSection] = useState("catalog");
  const navigate = useNavigate();
  const { t } = useLang();
  const ta = t.admin;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    try {
      const role = JSON.parse(atob(token.split(".")[1])).role;
      if (role === "admin" || role === "moderator") {
        setAllowed(true);
      } else {
        navigate("/");
      }
    } catch {
      navigate("/auth");
    }
  }, []);

  if (!allowed) return null;

  const SECTIONS = [
    {
      key: "catalog",
      label: ta.nav.catalog,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
      component: CatalogSection,
    },
    {
      key: "chatbot",
      label: ta.nav.chatbot,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      component: ChatbotSection,
    },
    {
      key: "moderation",
      label: ta.nav.moderation,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      ),
      component: SupplierModerationSection,
    },
    {
      key: "suppliers",
      label: ta.nav.suppliers,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      component: SuppliersSection,
    },
    {
      key: "applications",
      label: ta.nav.applications,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
      component: ApplicationsSection,
    },
  ];

  const current = SECTIONS.find(s => s.key === section);
  const Component = current?.component;

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-10">

        <div className="mb-8 animate-slide-up">
          <p className="font-mont text-[10px] tracking-[0.3em] text-charcoal/30 dark:text-cream/30 uppercase mb-1">
            DragonAuto
          </p>
          <div className="flex items-center gap-3">
            <h1 className="font-mont font-black text-3xl text-charcoal dark:text-cream tracking-tight">
              {ta.title}
            </h1>
            <span className="font-mont font-bold text-[10px] tracking-widest uppercase px-3 py-1 rounded-full bg-charcoal dark:bg-cream text-cream dark:text-charcoal">
              Admin
            </span>
          </div>
          <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40 mt-0.5">
            {ta.subtitle}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">

          <aside className="w-full md:w-56 shrink-0">
            <div className="flex flex-col gap-1">
              {SECTIONS.map((s, i) => (
                <div key={s.key} className="animate-slide-left" style={{ animationDelay: `${i * 50}ms` }}>
                  <NavItem
                    icon={s.icon}
                    label={s.label}
                    active={section === s.key}
                    onClick={() => setSection(s.key)}
                  />
                </div>
              ))}

              <div className="h-px bg-charcoal/8 dark:bg-cream/8 my-2 animate-fade-in" style={{ animationDelay: `${SECTIONS.length * 50}ms` }} />

              <div className="animate-slide-left" style={{ animationDelay: `${(SECTIONS.length + 1) * 50}ms` }}>
                <button
                  onClick={() => navigate("/profile")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 text-charcoal/50 dark:text-cream/50 hover:text-charcoal dark:hover:text-cream hover:bg-charcoal/5 dark:hover:bg-cream/5"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span className="font-mont font-bold text-sm">{ta.profileLink}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto opacity-40">
                    <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </aside>

          <main key={section} className="flex-1 min-w-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
            {Component && <Component />}
          </main>
        </div>
      </div>
    </div>
  );
}
