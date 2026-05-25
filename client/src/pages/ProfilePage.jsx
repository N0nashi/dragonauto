import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import ProfileInfo from "../components/ProfileInfo";
import Requests from "../components/Requests";
import SupplierPanel from "../components/SupplierPanel";
import { useLang } from "../context/LangContext";

const getRoleFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1])).role || "client";
  } catch { return "client"; }
};

const NavItem = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
      active
        ? "bg-red-accent/10 text-red-accent"
        : "text-charcoal/50 dark:text-cream/50 hover:text-charcoal dark:hover:text-cream hover:bg-charcoal/5 dark:hover:bg-cream/5"
    }`}
  >
    <span className={`shrink-0 transition-colors duration-200 ${active ? "text-red-accent" : ""}`}>
      {icon}
    </span>
    <span className="font-mont font-bold text-sm">{label}</span>
    {badge && (
      <span className="ml-auto font-mont text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-red-accent text-cream">
        {badge}
      </span>
    )}
  </button>
);

export default function ProfilePage() {
  const location = useLocation();
  const navState = location.state || {};
  const [section, setSection]   = useState(navState.section || "profile");
  const [openId, setOpenId]     = useState(navState.openId  || null);
  const [initialTab, setInitialTab] = useState(navState.tab || null);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const { t } = useLang();
  const tp = t.profile;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => data && setProfile(data))
      .catch(() => {});
  }, []);

  const role = profile?.role || getRoleFromToken() || "client";

  const roleBadge = {
    admin:     { label: tp.roles.admin,     cls: "bg-charcoal dark:bg-cream text-cream dark:text-charcoal" },
    moderator: { label: tp.roles.moderator, cls: "bg-charcoal dark:bg-cream text-cream dark:text-charcoal" },
    supplier:  { label: tp.roles.supplier,  cls: "bg-red-accent/15 text-red-accent" },
    client:    { label: tp.roles.client,    cls: "bg-charcoal/8 dark:bg-cream/8 text-charcoal/50 dark:text-cream/50" },
  }[role] || { label: tp.roles.client, cls: "bg-charcoal/8 text-charcoal/50" };

  const isAdmin = role === "admin" || role === "moderator";
  const isSupplier = role === "supplier";

  const navItems = [
    {
      key: "profile",
      label: tp.title,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
    {
      key: "requests",
      label: tp.myRequests,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      ),
    },
    ...(isSupplier ? [{
      key: "supplier",
      label: tp.myProducts,
      badge: tp.supplierBadge,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
        </svg>
      ),
    }] : []),
  ];

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-10">

        <div className="mb-8 animate-slide-up">
          <p className="font-mont text-[10px] tracking-[0.3em] text-charcoal/30 dark:text-cream/30 uppercase mb-1">
            DragonAuto
          </p>
          <div className="flex items-center gap-3">
            <h1 className="font-mont font-black text-3xl text-charcoal dark:text-cream tracking-tight">
              {profile ? `${profile.first_name} ${profile.last_name}` : tp.title}
            </h1>
            <span className={`font-mont font-bold text-[10px] tracking-widest uppercase px-3 py-1 rounded-full ${roleBadge.cls}`}>
              {roleBadge.label}
            </span>
          </div>
          {profile && (
            <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40 mt-0.5">{profile.email}</p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:items-start">

          <aside className="w-full md:w-52 shrink-0 md:self-start">

            <div className="flex flex-col gap-1 max-w-sm mx-auto md:max-w-none md:mx-0">
              {navItems.map((item, i) => (
                <div key={item.key} className="animate-slide-left" style={{ animationDelay: `${i * 55}ms` }}>
                  <NavItem
                    icon={item.icon}
                    label={item.label}
                    badge={item.badge}
                    active={section === item.key}
                    onClick={() => setSection(item.key)}
                  />
                </div>
              ))}

              {isAdmin && <div className="h-px bg-charcoal/8 dark:bg-cream/8 my-2 animate-fade-in" style={{ animationDelay: `${navItems.length * 55}ms` }} />}

              {isAdmin && (
                <div className="animate-slide-left" style={{ animationDelay: `${(navItems.length + 1) * 55}ms` }}>
                  <Link
                    to="/admin"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 text-charcoal/50 dark:text-cream/50 hover:text-charcoal dark:hover:text-cream hover:bg-charcoal/5 dark:hover:bg-cream/5"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span className="font-mont font-bold text-sm">{tp.adminPanel}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto opacity-40">
                      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
              )}

              <div className="h-px bg-charcoal/8 dark:bg-cream/8 my-2" />
              <div className="animate-slide-left" style={{ animationDelay: `${(navItems.length + 2) * 55}ms` }}>
                <button
                  onClick={() => { localStorage.removeItem("token"); navigate("/"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-charcoal/40 dark:text-cream/40 hover:text-red-accent transition-colors duration-200"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span className="font-mont font-bold text-sm">{tp.logout}</span>
                </button>
              </div>
            </div>
          </aside>

          <main key={section} className="flex-1 min-w-0 w-full animate-fade-in" style={{ animationDelay: "60ms" }}>
            {section === "profile"   && <ProfileInfo onProfileLoad={setProfile} />}
            {section === "requests"  && <Requests initialOpenId={openId} onOpenIdConsumed={() => setOpenId(null)} />}
            {section === "supplier"  && isSupplier && <SupplierPanel initialTab={initialTab} initialOpenId={openId} onInitConsumed={() => { setInitialTab(null); setOpenId(null); }} />}
          </main>
        </div>
      </div>
    </div>
  );
}
