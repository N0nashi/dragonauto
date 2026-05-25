import React, { useState, useEffect, useRef } from "react";
import { toast } from "../utils/toast";
import CarForm from "./CarForm";
import PartForm from "./PartForm";
import ApplicationComments from "./ApplicationComments";
import { STATUS_COLORS } from "../utils/statusConfig";
import { useLang } from "../context/LangContext";

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem("token");

/* State machine — mirrors server TRANSITIONS */
const TRANSITIONS = {
  "в обработке": ["в работе", "отменена"],
  "в работе":    ["предложение", "отменена"],
  "предложение": ["в работе", "отменена"],
  "согласована": ["выполнена", "отменена"],
};

function StatusSelect({ value, onChange, options, statusLabels }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const currentLabel = statusLabels[value] ?? value;
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full font-mont text-sm bg-cream dark:bg-charcoal border border-charcoal/15 dark:border-cream/15 rounded-xl px-4 py-3 text-left flex items-center justify-between gap-2 focus:outline-none transition-colors hover:border-charcoal/30 dark:hover:border-cream/30">
        <span className="text-charcoal dark:text-cream truncate">{currentLabel}</span>
        <svg width="11" height="6" viewBox="0 0 11 6" fill="none"
          className="shrink-0 text-charcoal/30 dark:text-cream/30 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "" }}>
          <path d="M1 1l4.5 4 4.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-cream dark:bg-charcoal border border-charcoal/10 dark:border-cream/10 rounded-xl shadow-xl overflow-hidden">
          {options.map(s => {
            const sel = value === s;
            return (
              <button key={s} type="button"
                onClick={() => { onChange(s); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-charcoal/5 dark:hover:bg-cream/5 transition-colors text-left">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${sel ? "bg-red-accent" : "bg-charcoal/10 dark:bg-cream/10"}`}>
                  {sel && <div className="w-2 h-2 rounded-full bg-cream" />}
                </div>
                <span className={`font-mont text-sm transition-colors ${sel ? "text-red-accent font-semibold" : "text-charcoal dark:text-cream"}`}>
                  {statusLabels[s] ?? s}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SupplierMatchPanel({ applicationId, appType, matchedItemId, matchedItemType, matchedSupplierId, supplierStatus, matchedItem, onMatchChanged }) {
  const { t } = useLang();
  const tm = t.moderator;
  const tt = t.toasts;
  const [listings, setListings]   = useState([]);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [messages, setMessages]   = useState([]);
  const [reply, setReply]         = useState("");
  const [sending, setSending]     = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const bottomRef = useRef(null);

  const isMatched = !!matchedItemId;

  useEffect(() => {
    if (!showSearch) return;
    setLoading(true);
    fetch(`${API}/api/supplier/all`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : { cars: [], parts: [] })
      .then(data => {
        const all = appType === "car"
          ? (data.cars || []).filter(c => c.status === "approved" && c.supplier_id)
          : (data.parts || []).filter(p => p.status === "approved" && p.supplier_id);
        setListings(all);
      })
      .finally(() => setLoading(false));
  }, [showSearch, appType]);

  const loadMessages = () => {
    if (!isMatched) return;
    fetch(`${API}/api/applications/${applicationId}/supplier-messages`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setMessages);
  };

  useEffect(() => { loadMessages(); }, [isMatched, applicationId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const matchItem = async (item) => {
    const r = await fetch(`${API}/api/applications/${applicationId}/match`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ item_id: item.id, item_type: appType === "car" ? "car" : "part" }),
    });
    if (r.ok) { toast.success(tt.itemMatched); setShowSearch(false); onMatchChanged?.(); }
    else { const d = await r.json(); toast.error(d.error || tt.genericError); }
  };

  const unmatch = async () => {
    const r = await fetch(`${API}/api/applications/${applicationId}/match`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (r.ok) { toast.success(tt.matchRemoved); onMatchChanged?.(); }
    else toast.error(tt.genericError);
  };

  const sendMsg = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    const r = await fetch(`${API}/api/applications/${applicationId}/supplier-messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ message: reply.trim() }),
    });
    if (r.ok) { setReply(""); loadMessages(); }
    else toast.error(tt.submitError);
    setSending(false);
  };

  const SUPPLIER_STATUS = {
    pending:   { label: tm.supplierStatuses.pending,   cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    confirmed: { label: tm.supplierStatuses.confirmed, cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    declined:  { label: tm.supplierStatuses.declined,  cls: "bg-red-accent/15 text-red-accent" },
  };

  const filtered = listings.filter(item => {
    const name = appType === "car" ? `${item.brand} ${item.model} ${item.year}` : item.part_name;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="border border-charcoal/10 dark:border-cream/10 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="font-mont font-black text-xs tracking-widest uppercase text-charcoal/50 dark:text-cream/50">
          {tm.supplierItem}
        </p>
        <div className="flex items-center gap-2">
          {isMatched && (
            <span className={`font-mont text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${(SUPPLIER_STATUS[supplierStatus] || SUPPLIER_STATUS.pending).cls}`}>
              {(SUPPLIER_STATUS[supplierStatus] || SUPPLIER_STATUS.pending).label}
            </span>
          )}
          <button onClick={onMatchChanged} title="Обновить"
            className="w-6 h-6 flex items-center justify-center rounded-lg text-charcoal/30 dark:text-cream/30 hover:text-red-accent hover:bg-red-accent/8 transition">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
      </div>

      {!isMatched ? (
        /* Not yet matched — show search button / panel */
        <div>
          {!showSearch ? (
            <button onClick={() => setShowSearch(true)}
              className="font-mont font-black text-xs tracking-widest uppercase px-4 py-2 bg-red-accent/10 text-red-accent rounded-xl hover:bg-red-accent/20 transition">
              {tm.matchItem}
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder={tm.searchPlaceholder}
                className="w-full font-mont text-sm bg-charcoal/5 dark:bg-cream/5 border border-charcoal/10 dark:border-cream/10 rounded-xl px-4 py-2.5 text-charcoal dark:text-cream placeholder:text-charcoal/30 focus:outline-none focus:border-red-accent/40 transition-colors"
              />
              {loading && <p className="font-mont text-xs text-charcoal/40 dark:text-cream/40 animate-pulse">{tm.loading}</p>}
              <div className="max-h-56 overflow-y-auto flex flex-col gap-1.5">
                {filtered.map(item => {
                  const name = appType === "car" ? `${item.brand} ${item.model} ${item.year}` : item.part_name;
                  return (
                    <button key={item.id} onClick={() => matchItem(item)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-charcoal/10 dark:border-cream/10 hover:border-red-accent/40 hover:bg-red-accent/5 transition text-left">
                      <div className="w-10 h-8 rounded-lg overflow-hidden bg-charcoal/5 dark:bg-cream/5 shrink-0">
                        {item.photo_url ? (
                          <img src={item.photo_url.startsWith("http") ? item.photo_url : `${API}${item.photo_url}`}
                            alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-charcoal/20">
                              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mont font-bold text-xs text-charcoal dark:text-cream truncate">{name}</p>
                        <p className="font-mont text-[10px] text-charcoal/40 dark:text-cream/40">
                          {item.price?.toLocaleString("ru-RU")} ₽
                        </p>
                      </div>
                    </button>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <p className="font-mont text-xs text-charcoal/30 dark:text-cream/30 text-center py-4">
                    {tm.noItems}
                  </p>
                )}
              </div>
              <button onClick={() => setShowSearch(false)}
                className="font-mont text-xs text-charcoal/40 dark:text-cream/40 hover:text-charcoal dark:hover:text-cream transition self-start">
                {tm.cancelMatch}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Matched — show item + messaging */
        <div className="flex flex-col gap-4">
          {/* Matched item card */}
          {(() => {
            const itemName = matchedItem
              ? (matchedItemType === "car"
                  ? `${matchedItem.brand ?? ""} ${matchedItem.model ?? ""} ${matchedItem.year ?? ""}`.trim()
                  : matchedItem.part_name ?? `Запчасть #${matchedItemId}`)
              : (matchedItemType === "car" ? `Авто #${matchedItemId}` : `Запчасть #${matchedItemId}`);
            const itemPrice = matchedItem?.price;
            const itemPhoto = matchedItem?.photo_url;
            return (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-charcoal/3 dark:bg-cream/3 border border-charcoal/10 dark:border-cream/10">
                <div className="w-12 h-10 rounded-lg overflow-hidden bg-charcoal/5 dark:bg-cream/5 shrink-0 flex items-center justify-center">
                  {itemPhoto ? (
                    <img src={itemPhoto.startsWith("http") ? itemPhoto : `${API}${itemPhoto}`}
                      alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-charcoal/20">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mont font-bold text-xs text-charcoal dark:text-cream truncate">{itemName}</p>
                  {itemPrice && (
                    <p className="font-mont text-[10px] text-charcoal/40 dark:text-cream/40">
                      {Number(itemPrice).toLocaleString("ru-RU")} ₽
                    </p>
                  )}
                </div>
                <button onClick={unmatch}
                  className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40 hover:text-red-accent transition px-2 py-1 rounded-lg hover:bg-red-accent/8">
                  {tm.unbind}
                </button>
              </div>
            );
          })()}

          {/* Supplier messages */}
          <div>
            <p className="font-mont text-[10px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40 mb-2">
              {tm.conversation}
            </p>
            <div className="max-h-48 overflow-y-auto flex flex-col gap-2 mb-2 pr-1">
              {messages.length === 0 && (
                <p className="font-mont text-xs text-charcoal/25 dark:text-cream/25 text-center py-3">{tm.noMessages}</p>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col gap-0.5 max-w-[85%] ${msg.sender_role === "admin" ? "self-end items-end" : "self-start items-start"}`}>
                  <span className="font-mont text-[9px] tracking-widest uppercase text-charcoal/30 dark:text-cream/30 px-1">
                    {msg.sender_name}
                  </span>
                  <div className={`font-mont text-xs px-3 py-2 rounded-xl leading-relaxed whitespace-pre-line ${
                    msg.sender_role === "admin"
                      ? "bg-red-accent text-cream rounded-br-sm"
                      : "bg-charcoal/8 dark:bg-cream/8 text-charcoal dark:text-cream rounded-bl-sm"
                  }`}>
                    {msg.message}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="flex gap-2">
              <input
                value={reply} onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }}}
                placeholder={tm.replyPlaceholder}
                disabled={sending}
                className="flex-1 font-mont text-xs bg-charcoal/5 dark:bg-cream/5 border border-charcoal/10 dark:border-cream/10 rounded-xl px-3 py-2 text-charcoal dark:text-cream placeholder:text-charcoal/25 focus:outline-none focus:border-red-accent/40 transition-colors disabled:opacity-50"
              />
              <button onClick={sendMsg} disabled={sending || !reply.trim()}
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
}

export default function ViewApplicationForm({ applicationId, onCancel, onReply, statusControls = false, onStatusChanged }) {
  const { t } = useLang();
  const tm = t.moderator;
  const tt = t.toasts;
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [nextStatus, setNextStatus] = useState("");
  const [comment, setComment]       = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [msg, setMsg]               = useState(null);

  const loadData = () => {
    if (!applicationId) { setData(null); return; }
    setLoading(true);
    fetch(`${API}/api/applications/${applicationId}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        setData(d);
        const opts = TRANSITIONS[d.status] ?? [];
        setNextStatus(opts[0] ?? "");
      })
      .catch(() => setMsg({ text: "Не удалось загрузить заявку", ok: false }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [applicationId]);

  const saveStatus = async () => {
    if (!nextStatus) return;
    setSaving(true);
    setMsg(null);
    try {
      const body = { status: nextStatus, comment: comment || undefined };
      if (nextStatus === "предложение" && offerPrice) body.offered_price = Number(offerPrice);

      const r = await fetch(`${API}/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMsg({ text: tt.statusUpdated, ok: true });
      toast.success(tt.statusUpdated);
      setData(prev => ({ ...prev, status: nextStatus }));
      setComment("");
      setOfferPrice("");
      const opts = TRANSITIONS[nextStatus] ?? [];
      setNextStatus(opts[0] ?? "");
      onStatusChanged?.();
    } catch (e) {
      const errText = e.message || tt.saveError;
      setMsg({ text: errText, ok: false });
      toast.error(errText);
      // Перезагружаем данные чтобы показать актуальный статус из БД
      loadData();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40 p-4">{tm.loading}</p>
  );
  if (!data) return (
    <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40 p-4">{tm.noData}</p>
  );

  const type     = data.type?.trim().toLowerCase();
  const allowedNext = TRANSITIONS[data.status] ?? [];
  const isTerminal  = allowedNext.length === 0;

  const currentBadgeCls = STATUS_COLORS[data.status] ?? "bg-charcoal/8 text-charcoal/50";

  return (
    <div className="flex flex-col gap-6">
      {/* Current status badge */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="font-mont font-black text-sm tracking-widest uppercase text-charcoal dark:text-cream">
          {tm.application}{applicationId}
        </span>
        <span className={`font-mont font-bold text-[10px] tracking-widest uppercase px-3 py-1 rounded-full ${currentBadgeCls}`}>
          {t.admin.applications.statuses[data.status] ?? data.status}
        </span>
      </div>

      {/* Application fields (read-only) */}
      {type === "car"
        ? <CarForm initialData={data} readOnly onClose={onCancel} />
        : <PartForm initialData={data} readOnly onClose={onCancel} />}

      {/* Status controls (moderator) */}
      {statusControls && !isTerminal && (
        <div className="border border-charcoal/10 dark:border-cream/10 rounded-2xl p-5 flex flex-col gap-4">
          <p className="font-mont font-black text-xs tracking-widest uppercase text-charcoal/50 dark:text-cream/50">
            {tm.changeStatus}
          </p>

          <div className="flex flex-col gap-1.5">
            <span className="font-mont text-[11px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">
              {tm.newStatus}
            </span>
            <StatusSelect
              value={nextStatus}
              onChange={setNextStatus}
              options={allowedNext}
              statusLabels={t.admin.applications.statuses}
            />
          </div>

          {/* Offered price — only shown for 'предложение' */}
          {nextStatus === "предложение" && (
            <div className="flex flex-col gap-1.5">
              <span className="font-mont text-[11px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">
                {tm.offerPrice}
              </span>
              <input
                type="number"
                value={offerPrice}
                onChange={e => setOfferPrice(e.target.value)}
                placeholder={tm.offerPricePlaceholder}
                className="w-full font-mont text-sm bg-charcoal/5 dark:bg-cream/5 border border-charcoal/10 dark:border-cream/10 rounded-xl px-4 py-3 text-charcoal dark:text-cream focus:outline-none focus:border-red-accent/50 transition-colors"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="font-mont text-[11px] tracking-widest uppercase text-charcoal/40 dark:text-cream/40">
              {tm.commentOptional}
            </span>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              placeholder={tm.commentPlaceholder}
              className="w-full font-mont text-sm bg-charcoal/5 dark:bg-cream/5 border border-charcoal/10 dark:border-cream/10 rounded-xl px-4 py-3 text-charcoal dark:text-cream resize-none focus:outline-none focus:border-red-accent/50 transition-colors"
            />
          </div>

          {msg && (
            <p className={`font-mont text-sm ${msg.ok ? "text-green-600 dark:text-green-400" : "text-red-accent"}`}>
              {msg.text}
            </p>
          )}

          <button
            onClick={saveStatus}
            disabled={saving || !nextStatus}
            className="font-mont font-black text-xs tracking-widest uppercase px-5 py-2.5 bg-red-accent text-cream rounded-xl hover:opacity-90 transition disabled:opacity-40 self-start"
          >
            {saving ? tm.saving : tm.save}
          </button>
        </div>
      )}

      {/* Email reply button */}
      {onReply && data.email && (
        <button
          onClick={() => onReply(data.email)}
          className="font-mont font-bold text-xs tracking-widest uppercase px-5 py-2.5 border-2 border-charcoal/20 dark:border-cream/20 text-charcoal dark:text-cream rounded-xl hover:border-charcoal dark:hover:border-cream transition self-start"
        >
          {tm.reply}
        </button>
      )}

      {/* Supplier match panel — visible only in status controls mode and non-terminal */}
      {statusControls && !isTerminal && (
        <SupplierMatchPanel
          applicationId={applicationId}
          appType={type}
          matchedItemId={data.matched_item_id}
          matchedItemType={data.matched_item_type}
          matchedSupplierId={data.matched_supplier_id}
          supplierStatus={data.supplier_status}
          matchedItem={data.matched_item}
          onMatchChanged={loadData}
        />
      )}

      {/* Comments thread */}
      <ApplicationComments applicationId={applicationId} authorRole="admin" />
    </div>
  );
}
