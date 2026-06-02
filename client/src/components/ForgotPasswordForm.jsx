import React, { useState } from "react";
import { useLang } from "../context/LangContext";

const ForgotPasswordForm = ({ onClose }) => {
  const { t } = useLang();
  const ta = t.auth;
  const [email, setEmail]           = useState("");
  const [otp, setOtp]               = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep]             = useState("email");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const inputCls = "w-full font-mont text-sm text-charcoal dark:text-cream bg-transparent border border-charcoal/20 dark:border-cream/20 rounded-xl px-4 py-3.5 placeholder:text-charcoal/90 dark:placeholder:text-cream/90 focus:outline-none focus:border-charcoal/50 dark:focus:border-cream/50 transition-colors duration-200 disabled:opacity-50";

  const sendOtp = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStep("reset");
    } catch {
      setError(ta.forgotSendError);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      setStep("done");
      setTimeout(onClose, 2000);
    } catch {
      setError(ta.forgotResetError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-charcoal/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-cream dark:bg-charcoal border border-charcoal/15 dark:border-cream/15 rounded-2xl p-8 max-w-sm w-full relative">

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-charcoal/90 dark:text-cream/90 hover:text-charcoal dark:hover:text-cream transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <h3 className="font-mont font-black text-xl text-charcoal dark:text-cream mb-2">
          {ta.forgotTitle}
        </h3>

        {step === "email" && (
          <>
            <p className="font-mont text-sm text-charcoal/90 dark:text-cream/90 mb-6">
              {ta.forgotDesc}
            </p>
            <form onSubmit={sendOtp} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="off"
                className={inputCls}
              />
              {error && <p className="font-mont text-xs text-red-accent">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full bg-red-accent border-2 border-red-accent text-cream font-mont font-black text-sm tracking-widest uppercase py-3.5 rounded-xl hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? ta.sending : ta.sendCode}
              </button>
            </form>
          </>
        )}

        {step === "reset" && (
          <>
            <p className="font-mont text-sm text-charcoal/90 dark:text-cream/90 mb-6">
              {ta.codeSentTo} <span className="text-charcoal dark:text-cream font-bold">{email}</span>
            </p>
            <form onSubmit={resetPassword} className="flex flex-col gap-3" autoComplete="off">
              <input
                type="text"
                placeholder={ta.codeFromEmail}
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                disabled={loading}
                autoComplete="off"
                className={inputCls}
              />
              <input
                type="password"
                placeholder={ta.newPasswordPlaceholder}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                className={inputCls}
              />
              {error && <p className="font-mont text-xs text-red-accent">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full bg-red-accent border-2 border-red-accent text-cream font-mont font-black text-sm tracking-widest uppercase py-3.5 rounded-xl hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? ta.changing : ta.changePassword}
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full bg-red-accent/10 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <p className="font-mont font-bold text-charcoal dark:text-cream text-center">
              {ta.passwordChanged}
            </p>
            <p className="font-mont text-xs text-charcoal/90 dark:text-cream/90 text-center">
              {ta.closingWindow}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
