import React, { useState, useEffect } from "react";
import { toast } from "../utils/toast";
import { useLang } from "../context/LangContext";

const inputCls = "w-full font-mont text-sm text-charcoal dark:text-cream bg-transparent border border-charcoal/20 dark:border-cream/20 rounded-xl px-4 py-3 placeholder:text-charcoal/90 dark:placeholder:text-cream/90 focus:outline-none focus:border-charcoal/50 dark:focus:border-cream/50 transition-colors duration-200";

const Section = ({ title, children }) => (
  <div className="border border-charcoal/10 dark:border-cream/10 rounded-2xl p-6">
    <h3 className="font-mont font-black text-sm tracking-widest uppercase text-charcoal/90 dark:text-cream/90 mb-5">
      {title}
    </h3>
    {children}
  </div>
);

export default function ProfileInfo({ onProfileLoad }) {
  const { t } = useLang();
  const tp = t.profileInfo;
  const tt = t.toasts;

  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "", avatarUrl: "" });
  const [editMode, setEditMode]       = useState(false);
  const [editData, setEditData]       = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  const [newEmail, setNewEmail]       = useState("");
  const [emailCode, setEmailCode]     = useState("");
  const [emailStep, setEmailStep]     = useState(false);

  const [curPwd, setCurPwd]           = useState("");
  const [newPwd, setNewPwd]           = useState("");
  const [conPwd, setConPwd]           = useState("");

  const token = localStorage.getItem("token");

  const getAvatarUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${import.meta.env.VITE_API_URL}${url}`;
  };

  useEffect(() => {
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const p = { firstName: data.first_name, lastName: data.last_name, email: data.email, avatarUrl: data.photo_url || "" };
        setProfile(p);
        setEditData(p);
        onProfileLoad?.(data);
      })
      .catch(() => toast.error(tt.profileLoadFail));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      let photoUrl = editData.avatarUrl;
      if (selectedFile) {
        const fd = new FormData();
        fd.append("file", selectedFile);
        const r = await fetch(`${import.meta.env.VITE_API_URL}/api/upload?folder=avatars`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
        });
        if (!r.ok) throw new Error("Ошибка загрузки фото");
        photoUrl = (await r.json()).url;
      }
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ first_name: editData.firstName, last_name: editData.lastName, photo_url: photoUrl }),
      });
      if (!r.ok) throw new Error();
      setProfile({ ...editData, avatarUrl: photoUrl });
      setEditMode(false);
      setSelectedFile(null);
      toast.success(tt.profileSaved);
    } catch { toast.error(tt.profileSaveError); }
  };

  const sendEmailCode = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/request-email-change`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newEmail }),
      });
      if (!r.ok) throw new Error();
      setEmailStep(true);
      toast.info(tp.codeSent);
    } catch { toast.error(tt.codeSendError); }
  };

  const verifyEmailCode = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/email`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newEmail, code: emailCode }),
      });
      if (!r.ok) throw new Error();
      setProfile(p => ({ ...p, email: newEmail }));
      setNewEmail(""); setEmailCode(""); setEmailStep(false);
      toast.success(tt.emailUpdated);
    } catch { toast.error(tt.codeInvalid); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (newPwd !== conPwd) { toast.error(tt.passwordMismatch); return; }
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
      setCurPwd(""); setNewPwd(""); setConPwd("");
      toast.success(tt.passwordUpdated);
    } catch (err) { toast.error(err.message || tt.profileSaveError); }
  };

  const avatarSrc = selectedFile
    ? URL.createObjectURL(selectedFile)
    : getAvatarUrl(editMode ? editData.avatarUrl : profile.avatarUrl);

  const initials = `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="flex flex-col gap-5">

      <Section title={tp.personal}>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-charcoal/10 dark:border-cream/10 bg-charcoal/5 dark:bg-cream/5 flex items-center justify-center">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-mont font-black text-2xl text-charcoal/90 dark:text-cream/90">{initials}</span>
              )}
            </div>
            {editMode && (
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-accent rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <input type="file" accept="image/*" className="hidden" onChange={e => setSelectedFile(e.target.files[0])} />
              </label>
            )}
          </div>

          {editMode ? (
            <form onSubmit={saveProfile} className="flex-1 flex flex-col gap-3">
              <div className="flex gap-3">
                <input className={inputCls} placeholder={tp.firstName} value={editData.firstName}
                  onChange={e => setEditData(p => ({ ...p, firstName: e.target.value }))} />
                <input className={inputCls} placeholder={tp.lastName} value={editData.lastName}
                  onChange={e => setEditData(p => ({ ...p, lastName: e.target.value }))} />
              </div>
              <div className="flex gap-2 mt-1">
                <button type="submit"
                  className="font-mont font-black text-xs tracking-widest uppercase px-6 py-2.5 bg-red-accent text-cream rounded-xl hover:opacity-90 transition">
                  {tp.save}
                </button>
                <button type="button" onClick={() => { setEditMode(false); setEditData(profile); setSelectedFile(null); }}
                  className="font-mont font-black text-xs tracking-widest uppercase px-6 py-2.5 border-2 border-charcoal/20 dark:border-cream/20 text-charcoal/50 dark:text-cream/50 rounded-xl hover:border-charcoal dark:hover:border-cream hover:text-charcoal dark:hover:text-cream transition">
                  {tp.cancel}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex-1">
              <p className="font-mont font-black text-xl text-charcoal dark:text-cream">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="font-mont text-sm text-charcoal/90 dark:text-cream/90 mt-0.5">{profile.email}</p>
              <button onClick={() => setEditMode(true)}
                className="mt-4 font-mont font-black text-xs tracking-widest uppercase px-5 py-2 border-2 border-charcoal/20 dark:border-cream/20 text-charcoal dark:text-cream rounded-xl hover:border-charcoal dark:hover:border-cream transition">
                {tp.edit}
              </button>
            </div>
          )}
        </div>
      </Section>

      <Section title={tp.emailChange}>
        {!emailStep ? (
          <form onSubmit={sendEmailCode} className="flex flex-col gap-3">
            <input type="email" className={inputCls} placeholder={tp.newEmail}
              value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
            <button type="submit"
              className="self-start font-mont font-black text-xs tracking-widest uppercase px-6 py-2.5 bg-red-accent text-cream rounded-xl hover:opacity-90 transition">
              {tp.sendCode}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyEmailCode} className="flex flex-col gap-3">
            <p className="font-mont text-sm text-charcoal/50 dark:text-cream/50">
              {tp.codeSent}
            </p>
            <input type="text" className={inputCls} placeholder={tp.codeLabel}
              value={emailCode} onChange={e => setEmailCode(e.target.value)} required />
            <div className="flex gap-2">
              <button type="submit"
                className="font-mont font-black text-xs tracking-widest uppercase px-6 py-2.5 bg-red-accent text-cream rounded-xl hover:opacity-90 transition">
                {tp.confirm}
              </button>
              <button type="button" onClick={() => setEmailStep(false)}
                className="font-mont font-black text-xs tracking-widest uppercase px-6 py-2.5 border-2 border-charcoal/20 dark:border-cream/20 rounded-xl text-charcoal/50 dark:text-cream/50 hover:border-charcoal dark:hover:border-cream transition">
                {tp.back}
              </button>
            </div>
          </form>
        )}
      </Section>

      <Section title={tp.passwordChange}>
        <form onSubmit={changePassword} className="flex flex-col gap-3">
          <input type="password" className={inputCls} placeholder={tp.currentPassword}
            value={curPwd} onChange={e => setCurPwd(e.target.value)} required autoComplete="current-password" />
          <input type="password" className={inputCls} placeholder={tp.newPassword}
            value={newPwd} onChange={e => setNewPwd(e.target.value)} required autoComplete="new-password" />
          <input type="password" className={inputCls} placeholder={tp.repeatPassword}
            value={conPwd} onChange={e => setConPwd(e.target.value)} required autoComplete="new-password" />
          <button type="submit"
            className="self-start font-mont font-black text-xs tracking-widest uppercase px-6 py-2.5 bg-red-accent text-cream rounded-xl hover:opacity-90 transition">
            {tp.updatePassword}
          </button>
        </form>
      </Section>
    </div>
  );
}
