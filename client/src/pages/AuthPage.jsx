import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import { AuthContext } from "../context/AuthContext";
import { useLang } from "../context/LangContext";

const AuthPage = () => {
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { t } = useLang();

  const handleAuthSuccess = (token) => {
    login(token);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal flex transition-colors duration-300">

<div className="hidden lg:flex flex-col justify-between w-[45%] bg-charcoal dark:bg-cream/5 pl-16 pr-10 py-14 shrink-0">
<Link to="/" className="flex items-baseline gap-1.5">
          <span className="font-kalissa text-4xl text-cream leading-none">Dragon</span>
          <span className="font-mont font-black text-2xl text-cream tracking-widest leading-none">AUTO</span>
        </Link>

<div>
          <p className="font-mont font-black text-5xl text-cream leading-tight tracking-tight mb-6">
            {t.auth.leftHeadline.split("\n").map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br/>}</span>
            ))}
          </p>
          <p className="font-mont text-sm text-cream/40 leading-relaxed max-w-xs">
            {t.auth.leftSubtitle}
          </p>
        </div>

<p className="font-mont text-xs text-cream/20 tracking-widest uppercase">
          г. Челябинск · +7 (982) 290-00-86
        </p>
      </div>

<div className="flex-1 flex flex-col items-start justify-center pl-10 pr-6 py-12">

<Link to="/" className="flex items-baseline gap-1.5 mb-10 lg:hidden">
          <span className="font-kalissa text-3xl text-charcoal dark:text-cream leading-none">Dragon</span>
          <span className="font-mont font-black text-xl text-charcoal dark:text-cream tracking-widest leading-none">AUTO</span>
        </Link>

        <div className="w-full max-w-sm">

<h1 className="font-mont font-black text-3xl text-charcoal dark:text-cream tracking-tight mb-2">
            {mode === "login" ? t.auth.loginTitle : t.auth.registerTitle}
          </h1>
          <p className="font-mont text-sm text-charcoal/40 dark:text-cream/40 mb-8">
            {mode === "login" ? t.auth.loginSubtitle : t.auth.registerSubtitle}
          </p>

<div className="flex justify-center gap-2 mb-8">
            {[
              { key: "login",    label: t.nav.login },
              { key: "register", label: t.nav.register },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setMode(key); setMessage(""); }}
                className={`min-w-32 font-mont font-black text-xs tracking-widest uppercase px-6 py-2.5 rounded-xl border-2 transition-all duration-200 ${
                  mode === key
                    ? "bg-red-accent border-red-accent text-cream"
                    : "bg-transparent border-charcoal/20 dark:border-cream/20 text-charcoal dark:text-cream hover:border-charcoal dark:hover:border-cream"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

{mode === "login" ? (
            <LoginForm
              setMessage={setMessage}
              onLoginSuccess={handleAuthSuccess}
              onForgot={() => setShowForgot(true)}
            />
          ) : (
            <RegisterForm
              setMessage={setMessage}
              onRegisterSuccess={handleAuthSuccess}
            />
          )}

{message && (
            <p className="mt-4 font-mont text-sm text-red-accent text-center">{message}</p>
          )}
        </div>
      </div>

{showForgot && (
        <ForgotPasswordForm onClose={() => setShowForgot(false)} />
      )}
    </div>
  );
};

export default AuthPage;
