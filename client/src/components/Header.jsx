import React, { useState, useContext, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LangContext";

const API = import.meta.env.VITE_API_URL;

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4.5"/>
    <line x1="12" y1="2"     x2="12" y2="4"/>
    <line x1="12" y1="20"    x2="12" y2="22"/>
    <line x1="4.22" y1="4.22"   x2="5.64"  y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="2"  y1="12" x2="4"  y2="12"/>
    <line x1="20" y1="12" x2="22" y2="12"/>
    <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
    <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

function BellDropdown({ onClose, refreshUnreadCount }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const navigate = useNavigate();

  const token = () => localStorage.getItem("token");
  const authH = () => ({ Authorization: `Bearer ${token()}` });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/notifications`, { headers: authH() });
      if (r.ok) setItems(await r.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAll = async (e) => {
    e.stopPropagation();
    setMarkingAll(true);
    try {
      await fetch(`${API}/api/notifications/mark-read`, {
        method: "PATCH",
        headers: { ...authH(), "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setItems(prev => prev.map(n => ({ ...n, is_read: true })));
      refreshUnreadCount();
    } finally { setMarkingAll(false); }
  };

  const handleNotifClick = async (e, n) => {
    e.stopPropagation();
    await fetch(`${API}/api/notifications/mark-read`, {
      method: "PATCH",
      headers: { ...authH(), "Content-Type": "application/json" },
      body: JSON.stringify({ application_id: n.application_id }),
    });
    setItems(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
    refreshUnreadCount();
    onClose();
    if (n.type === "supplier_match") {
      navigate("/profile", { state: { section: "supplier", tab: "requests", openId: n.application_id } });
    } else {
      navigate("/profile", { state: { section: "requests", openId: n.application_id } });
    }
  };

  const typeLabel = (type) => ({
    status_change:  "Изменение статуса",
    new_comment:    "Новый комментарий",
    supplier_match: "Запрос от модератора",
  }[type] ?? "Уведомление");

  const statusLabel = (s) => ({
    "в обработке": "В обработке",
    "в работе":    "В работе",
    "предложение": "Предложение",
    "согласована": "Согласована",
    "выполнена":   "Выполнена",
    "отменена":    "Отменена",
  }[s] ?? s);

  const appLabel = (n) =>
    `Заявка #${n.application_id} (${n.app_type === "car" ? "авто" : "запчасть"})`;

  const fmtDate = (d) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("ru-RU") + " " +
      dt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  const hasUnread = items.some(n => !n.is_read);

  return (
    <>
      <div className="fixed inset-0 z-[998]" onClick={onClose} />
      <div
        className="absolute right-0 top-full mt-2 w-80 max-h-[420px] flex flex-col
          bg-cream dark:bg-charcoal border border-charcoal/10 dark:border-cream/10
          rounded-2xl shadow-xl z-[999] overflow-hidden anim-slide-down"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-charcoal/10 dark:border-cream/10 shrink-0">
          <span className="font-mont font-bold text-sm text-charcoal dark:text-cream">Уведомления</span>
          {hasUnread && (
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={markAll}
              disabled={markingAll}
              className="font-mont text-[10px] tracking-widest uppercase text-red-accent hover:opacity-70 transition disabled:opacity-40"
            >
              {markingAll ? "…" : "Прочитать все"}
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {loading && (
            <p className="font-mont text-xs text-charcoal/40 dark:text-cream/40 text-center py-8">Загрузка…</p>
          )}
          {!loading && items.length === 0 && (
            <p className="font-mont text-xs text-charcoal/40 dark:text-cream/40 text-center py-8">Нет уведомлений</p>
          )}
          {!loading && items.map(n => (
            <button
              key={n.id}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => handleNotifClick(e, n)}
              className={`w-full text-left px-4 py-3 border-b border-charcoal/5 dark:border-cream/5 last:border-0
                hover:bg-charcoal/5 dark:hover:bg-cream/5 transition-colors flex items-start gap-3
                ${!n.is_read ? "bg-red-accent/5" : ""}`}
            >
              <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${!n.is_read ? "bg-red-accent" : "bg-charcoal/15 dark:bg-cream/15"}`} />
              <div className="flex-1 min-w-0">
                <p className="font-mont font-bold text-[11px] text-charcoal dark:text-cream leading-snug">
                  {typeLabel(n.type)}
                </p>
                <p className="font-mont text-[11px] text-charcoal/60 dark:text-cream/60 leading-snug truncate">
                  {appLabel(n)}{n.app_status ? ` · ${statusLabel(n.app_status)}` : ""}
                </p>
                <p className="font-mont text-[10px] text-charcoal/35 dark:text-cream/35 mt-0.5">
                  {fmtDate(n.created_at)}
                </p>
              </div>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round"
                className="text-charcoal/20 dark:text-cream/20 shrink-0 mt-1">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default function Header() {
  const [isOpen,   setIsOpen]   = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const { isLoggedIn, logout, unreadCount, refreshUnreadCount } = useContext(AuthContext);
  const { dark, toggle: toggleTheme } = useTheme();
  const { lang, toggle: toggleLang, t } = useLang();
  const navigate   = useNavigate();
  const { pathname } = useLocation();

  const close = () => setIsOpen(false);

  const handleLogout = () => { logout(); close(); navigate("/"); };

  /* active nav helper */
  const isActive = (path) => {
    if (path.startsWith("/#")) return false; // hash-only links never "active"
    return pathname === path || (path !== "/" && pathname.startsWith(path));
  };

  const navLinkCls = (path) =>
    `font-mont text-sm transition-colors duration-200 border-b pb-px ${
      isActive(path)
        ? "text-charcoal dark:text-cream border-charcoal/30 dark:border-cream/30"
        : "text-charcoal/55 dark:text-cream/55 border-transparent hover:text-charcoal dark:hover:text-cream"
    }`;

  /* shared icon-button style */
  const iconBtnCls =
    "flex items-center justify-center w-8 h-8 rounded-full text-charcoal/50 dark:text-cream/50 hover:text-charcoal dark:hover:text-cream hover:bg-charcoal/6 dark:hover:bg-cream/6 transition-colors duration-200";

  return (
    <header className="bg-cream dark:bg-charcoal h-16 relative z-50 border-b border-charcoal/10 dark:border-cream/10 transition-colors duration-300">

      <div className="max-w-6xl mx-auto px-8 md:px-20 h-full flex items-center justify-between">

        {/* Logo */}
        <Link to="/" onClick={close} className="shrink-0">
          <img src="/logo.svg" alt="Dragon Auto" className="h-9 dark:invert" />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/catalog"   className={navLinkCls("/catalog")}>{t.nav.catalog}</Link>
          <Link to="/#reviews"  className={navLinkCls("/#reviews")}>{t.nav.reviews}</Link>
          <Link to="/faq"       className={navLinkCls("/faq")}>{t.nav.faq}</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">

          {/* Lang / Theme */}
          <button onClick={toggleLang} className={`${iconBtnCls} font-mont text-xs tracking-wider`}>
            {lang === "ru" ? "EN" : "RU"}
          </button>
          <button onClick={toggleTheme} className={iconBtnCls} aria-label="Toggle theme">
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          <div className="w-px h-5 bg-charcoal/15 dark:bg-cream/15" />

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              {/* Bell */}
              <div className="relative">
                <button
                  onClick={() => setBellOpen(o => !o)}
                  className={`${iconBtnCls} relative`}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-accent text-cream font-mont font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <BellDropdown onClose={() => setBellOpen(false)} refreshUnreadCount={refreshUnreadCount} />
                )}
              </div>

              <Link to="/profile"
                className="font-mont font-semibold text-xs tracking-widest border border-charcoal/30 dark:border-cream/30 text-charcoal dark:text-cream px-5 py-2 rounded-full hover:bg-charcoal hover:text-cream dark:hover:bg-cream dark:hover:text-charcoal hover:border-transparent transition-all duration-200">
                {t.nav.profile}
              </Link>
              <button onClick={handleLogout}
                className="font-mont font-semibold text-xs tracking-widest bg-charcoal dark:bg-cream text-cream dark:text-charcoal px-5 py-2 rounded-full hover:opacity-75 transition-opacity duration-200">
                {t.nav.logout}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/auth"
                className="font-mont font-semibold text-xs tracking-widest border border-charcoal/30 dark:border-cream/30 text-charcoal dark:text-cream px-5 py-2 rounded-full hover:bg-charcoal hover:text-cream dark:hover:bg-cream dark:hover:text-charcoal hover:border-transparent transition-all duration-200">
                {t.nav.login}
              </Link>
              <Link to="/auth"
                className="font-mont font-semibold text-xs tracking-widest bg-charcoal dark:bg-cream text-cream dark:text-charcoal px-5 py-2 rounded-full hover:opacity-75 transition-opacity duration-200">
                {t.nav.register}
              </Link>
            </div>
          )}
        </div>

        <div className="md:hidden flex items-center gap-1">
          <button onClick={toggleLang} className={`${iconBtnCls} font-mont text-xs tracking-wider`}>
            {lang === "ru" ? "EN" : "RU"}
          </button>
          <button onClick={toggleTheme} className={iconBtnCls} aria-label="Toggle theme">
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          {isLoggedIn && (
            <div className="relative">
              <button onClick={() => setBellOpen(o => !o)} className={`${iconBtnCls} relative`}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-accent text-cream font-mont font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {bellOpen && (
                <BellDropdown onClose={() => setBellOpen(false)} refreshUnreadCount={refreshUnreadCount} />
              )}
            </div>
          )}

          {/* Burger */}
          <button onClick={() => setIsOpen(o => !o)} className={iconBtnCls} aria-label="Menu">
            <svg className="w-5 h-5 text-charcoal dark:text-cream" fill="none" stroke="currentColor"
              strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round">
              {isOpen
                ? <path d="M6 18L18 6M6 6l12 12"/>
                : <path d="M4 6h16M4 12h16M4 18h16"/>}
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="anim-slide-down absolute top-16 left-0 w-full bg-cream dark:bg-charcoal border-t border-charcoal/10 dark:border-cream/10 flex flex-col items-center gap-5 py-8 shadow-lg z-50">
          <Link to="/catalog"  onClick={close} className={navLinkCls("/catalog")}>{t.nav.catalog}</Link>
          <Link to="/#reviews" onClick={close} className={navLinkCls("/#reviews")}>{t.nav.reviews}</Link>
          <Link to="/faq"      onClick={close} className={navLinkCls("/faq")}>{t.nav.faq}</Link>

          <div className="w-12 h-px bg-charcoal/10 dark:bg-cream/10" />

          {isLoggedIn ? (
            <>
              <Link to="/profile" onClick={close}
                className="font-mont font-semibold text-xs tracking-widest border border-charcoal/30 dark:border-cream/30 text-charcoal dark:text-cream px-6 py-2 rounded-full hover:bg-charcoal hover:text-cream dark:hover:bg-cream dark:hover:text-charcoal hover:border-transparent transition-all">
                {t.nav.profile}
              </Link>
              <button onClick={handleLogout}
                className="font-mont font-semibold text-xs tracking-widest bg-charcoal dark:bg-cream text-cream dark:text-charcoal px-6 py-2 rounded-full hover:opacity-75 transition-opacity">
                {t.nav.logout}
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" onClick={close}
                className="font-mont font-semibold text-xs tracking-widest border border-charcoal/30 dark:border-cream/30 text-charcoal dark:text-cream px-6 py-2 rounded-full hover:bg-charcoal hover:text-cream dark:hover:bg-cream dark:hover:text-charcoal hover:border-transparent transition-all">
                {t.nav.login}
              </Link>
              <Link to="/auth" onClick={close}
                className="font-mont font-semibold text-xs tracking-widest bg-charcoal dark:bg-cream text-cream dark:text-charcoal px-6 py-2 rounded-full hover:opacity-75 transition-opacity">
                {t.nav.register}
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
