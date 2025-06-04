import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import { AuthContext } from "../context/AuthContext";

const AuthPage = () => {
  const [mode, setMode] = useState("login"); // 'login' или 'register'
  const [message, setMessage] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const navigate = useNavigate();

  const { login } = useContext(AuthContext);

  // Предполагается, что login или register формы при успешном ответе вызовут этот callback с токеном
  const handleAuthSuccess = (token) => {
    login(token);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="bg-white p-8 rounded shadow-lg w-full max-w-md">
        <div className="flex mb-6">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 font-semibold text-center ${
              mode === "login"
                ? "bg-indigo-100 text-indigo-700 border-b-2 border-indigo-700"
                : "text-gray-600"
            }`}
          >
            Вход
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2 font-semibold text-center ${
              mode === "register"
                ? "bg-indigo-100 text-indigo-700 border-b-2 border-indigo-700"
                : "text-gray-600"
            }`}
          >
            Регистрация
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center">
          {mode === "login" ? "Вход" : "Регистрация"}
        </h2>

        <div className="mb-4">
          {mode === "login" ? (
            <LoginForm
              setMessage={setMessage}
              onLoginSuccess={handleAuthSuccess}
            />
          ) : (
            <RegisterForm
              setMessage={setMessage}
              onRegisterSuccess={handleAuthSuccess}
            />
          )}
        </div>

        {message && <p className="mb-4 text-red-600 text-center">{message}</p>}

        {mode === "login" && (
          <button
            onClick={() => setShowForgotModal(true)}
            className="text-blue-600 underline text-sm mb-4"
          >
            Забыли пароль?
          </button>
        )}

        {showForgotModal && (
          <ForgotPasswordForm onClose={() => setShowForgotModal(false)} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
