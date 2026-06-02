import React, { useState } from "react";
import { toast } from "../utils/toast";
import { useLang } from "../context/LangContext";

const Field = ({ type = "text", name, placeholder, value, onChange, disabled, extra = "" }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative">
      <input
        type={isPassword && show ? "text" : type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        disabled={disabled}
        className={`w-full font-mont text-sm text-charcoal dark:text-cream bg-transparent border border-charcoal/20 dark:border-cream/20 rounded-xl px-4 py-3.5 placeholder:text-charcoal/90 dark:placeholder:text-cream/90 focus:outline-none focus:border-charcoal/50 dark:focus:border-cream/50 transition-colors duration-200 disabled:opacity-50 ${isPassword ? "pr-12" : ""} ${extra}`}
      />
      {isPassword && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(p => !p)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/90 dark:text-cream/90 hover:text-charcoal dark:hover:text-cream transition-colors"
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

const RegisterForm = ({ onRegisterSuccess }) => {
  const { t } = useLang();
  const tt = t.toasts;
  const ta = t.auth;
  const [role, setRole] = useState("client"); // "client" | "supplier"
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", password: "", confirmPassword: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error(tt.fileTooLarge);
      return;
    }
    setAvatar(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.password || !form.confirmPassword) {
      toast.error(tt.fillAllFields); return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error(tt.passwordMismatch); return;
    }
    if (!acceptedPolicy) {
      toast.error(tt.acceptPrivacy); return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("first_name", form.first_name.trim());
      fd.append("last_name",  form.last_name.trim());
      fd.append("email",      form.email.trim());
      fd.append("password",   form.password);
      fd.append("role",       role);
      if (avatar) fd.append("file", avatar);

      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/register?folder=avatars`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка регистрации");

      if (data.requiresVerification) {
        setShowVerification(true);
        toast.info(tt.codeSent);
      } else {
        data.token ? onRegisterSuccess(data.token) : toast.success(tt.registerSuccess);
      }
    } catch (err) {
      toast.error(err.message || tt.submitError);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.trim()) { toast.error(tt.enterCode); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка подтверждения");
      toast.success(tt.emailConfirmed);
      data.token ? onRegisterSuccess(data.token) : toast.error(tt.tokenFail);
    } catch (err) {
      toast.error(err.message || tt.codeInvalid);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full font-mont text-sm text-charcoal dark:text-cream bg-transparent border border-charcoal/20 dark:border-cream/20 rounded-xl px-4 py-3.5 placeholder:text-charcoal/90 dark:placeholder:text-cream/90 focus:outline-none focus:border-charcoal/50 dark:focus:border-cream/50 transition-colors duration-200 disabled:opacity-50";

  if (showVerification) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-mont text-sm text-charcoal/50 dark:text-cream/50 text-center leading-relaxed">
          {ta.codeSentTo} <span className="text-charcoal dark:text-cream font-bold">{form.email}</span>
        </p>
        <input
          type="text"
          placeholder={ta.codeFromEmail}
          value={verificationCode}
          onChange={e => setVerificationCode(e.target.value)}
          disabled={loading}
          className={inputCls}
        />
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-red-accent border-2 border-red-accent text-cream font-mont font-black text-sm tracking-widest uppercase py-3.5 rounded-xl hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? ta.verifying : ta.verifyEmail}
        </button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">

<div className="flex gap-2 mb-1">
          {[
            { key: "client",   label: ta.roleClient,   desc: ta.roleClientDesc },
            { key: "supplier", label: ta.roleSupplier, desc: ta.roleSupplierDesc },
          ].map(({ key, label, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRole(key)}
              className={`flex-1 flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left ${
                role === key
                  ? "border-red-accent bg-red-accent/5 dark:bg-red-accent/10"
                  : "border-charcoal/15 dark:border-cream/15 hover:border-charcoal/30 dark:hover:border-cream/30"
              }`}
            >
              <span className={`font-mont font-black text-xs tracking-widest uppercase ${role === key ? "text-red-accent" : "text-charcoal/60 dark:text-cream/60"}`}>
                {label}
              </span>
              <span className="font-mont text-[10px] text-charcoal/90 dark:text-cream/90 leading-tight">
                {desc}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Field name="first_name" placeholder={ta.firstNamePlaceholder} value={form.first_name} onChange={handleChange} disabled={loading} />
          <Field name="last_name"  placeholder={ta.lastNamePlaceholder} value={form.last_name}  onChange={handleChange} disabled={loading} />
        </div>
        <Field type="email"    name="email"           placeholder="Email"                      value={form.email}           onChange={handleChange} disabled={loading} />
        <Field type="password" name="password"        placeholder={ta.passwordPlaceholder}     value={form.password}        onChange={handleChange} disabled={loading} />
        <Field type="password" name="confirmPassword" placeholder={ta.passwordRepeatPlaceholder} value={form.confirmPassword} onChange={handleChange} disabled={loading} />

        {/* Avatar upload */}
        <label className="flex items-center gap-3 border border-dashed border-charcoal/20 dark:border-cream/20 rounded-xl px-4 py-3 cursor-pointer hover:border-charcoal/40 dark:hover:border-cream/40 transition-colors duration-200 group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className="text-charcoal/90 dark:text-cream/90 group-hover:text-charcoal dark:group-hover:text-cream shrink-0 transition-colors">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span className="font-mont text-sm text-charcoal/90 dark:text-cream/90 group-hover:text-charcoal dark:group-hover:text-cream transition-colors flex-1 truncate">
            {avatar ? avatar.name : ta.avatarLabel}
          </span>
          <input type="file" accept="image/*" onChange={handleFile} disabled={loading} className="hidden" />
        </label>

        {/* Policy */}
        <label className="flex items-start gap-3 cursor-pointer select-none mt-1">
          <div
            onClick={() => setAcceptedPolicy(p => !p)}
            className={`w-5 h-5 shrink-0 mt-0.5 rounded border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${
              acceptedPolicy
                ? "bg-red-accent border-red-accent"
                : "border-charcoal/25 dark:border-cream/25"
            }`}
          >
            {acceptedPolicy && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="#FCF9E9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span className="font-mont text-xs text-charcoal/50 dark:text-cream/50 leading-relaxed pt-0.5">
            {ta.acceptPolicy}{" "}
            <button
              type="button"
              onClick={() => setShowPolicy(true)}
              className="text-charcoal dark:text-cream underline underline-offset-2 hover:text-red-accent transition-colors duration-200"
            >
              {ta.policyLink}
            </button>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full bg-red-accent border-2 border-red-accent text-cream font-mont font-black text-sm tracking-widest uppercase py-3.5 rounded-xl hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? ta.creatingAccount : ta.registerBtn}
        </button>
      </form>

      {/* Policy modal */}
      {showPolicy && (
        <div className="fixed inset-0 bg-charcoal/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cream dark:bg-charcoal border border-charcoal/15 dark:border-cream/15 rounded-2xl p-8 max-w-md w-full relative max-h-[80vh] flex flex-col">
            <button
              onClick={() => setShowPolicy(false)}
              className="absolute top-5 right-5 text-charcoal/90 dark:text-cream/90 hover:text-charcoal dark:hover:text-cream transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <h2 className="font-mont font-black text-xl text-charcoal dark:text-cream mb-4">
              {ta.policyTitle}
            </h2>
            <div className="font-mont text-sm text-charcoal/60 dark:text-cream/60 leading-relaxed space-y-3 overflow-y-auto">
              <p>{ta.policyP1}</p>
              <p>{ta.policyP2}</p>
              <p>{ta.policyP3}</p>
              <p>{ta.policyP4}</p>
            </div>
            <button
              onClick={() => { setAcceptedPolicy(true); setShowPolicy(false); }}
              className="mt-6 w-full bg-red-accent text-cream font-mont font-black text-xs tracking-widest uppercase py-3 rounded-xl hover:opacity-90 transition-opacity duration-200"
            >
              {ta.policyAccept}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RegisterForm;
