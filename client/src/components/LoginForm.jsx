import React, { useState } from "react";
import axios from "axios";
import { useLang } from "../context/LangContext";

const LoginForm = ({ setMessage, onLoginSuccess, onForgot }) => {
  const { t } = useLang();
  const ta = t.auth;
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/login`, {
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("token", res.data.token);
      onLoginSuccess(res.data.token);
    } catch (error) {
      setMessage(error.response?.data?.error || "Неверный email или пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">

      <div className="relative">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          disabled={loading}
          className="w-full font-mont text-sm text-charcoal dark:text-cream bg-transparent border border-charcoal/20 dark:border-cream/20 rounded-xl px-4 py-3.5 placeholder:text-charcoal/30 dark:placeholder:text-cream/30 focus:outline-none focus:border-charcoal/50 dark:focus:border-cream/50 transition-colors duration-200 disabled:opacity-50"
        />
      </div>

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder={ta.passwordPlaceholder}
          value={form.password}
          onChange={handleChange}
          required
          disabled={loading}
          className="w-full font-mont text-sm text-charcoal dark:text-cream bg-transparent border border-charcoal/20 dark:border-cream/20 rounded-xl px-4 py-3.5 pr-12 placeholder:text-charcoal/30 dark:placeholder:text-cream/30 focus:outline-none focus:border-charcoal/50 dark:focus:border-cream/50 transition-colors duration-200 disabled:opacity-50"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword(p => !p)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/30 dark:text-cream/30 hover:text-charcoal dark:hover:text-cream transition-colors"
        >
          {showPassword ? (
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
      </div>

      <div className="flex justify-end -mt-1">
        <button
          type="button"
          onClick={onForgot}
          className="font-mont text-xs text-charcoal/35 dark:text-cream/35 hover:text-charcoal dark:hover:text-cream transition-colors duration-200"
        >
          {ta.forgotPassword}
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full bg-red-accent border-2 border-red-accent text-cream font-mont font-black text-sm tracking-widest uppercase py-3.5 rounded-xl hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? ta.loggingIn : ta.loginBtn}
      </button>
    </form>
  );
};

export default LoginForm;
