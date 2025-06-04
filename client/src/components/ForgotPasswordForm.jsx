import React, { useState } from "react";

const ForgotPasswordForm = ({ onClose }) => {
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [status, setStatus] = useState({
    loading: false,
    success: "",
    error: "",
  });

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: "", error: "" });
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setStatus({
        loading: false,
        success: "Инструкции по восстановлению отправлены на email",
        error: "",
      });
      setIsOTPSent(true);
    } catch (err) {
      setStatus({
        loading: false,
        success: "",
        error: "Ошибка при отправке запроса",
      });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: "", error: "" });
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp, newPassword }),
      });
      setStatus({
        loading: false,
        success: "Пароль успешно изменён",
        error: "",
      });
      setTimeout(() => {
        setIsOTPSent(false);
        setForgotEmail("");
        setOtp("");
        setNewPassword("");
        setStatus({ loading: false, success: "", error: "" });
        onClose();
      }, 2000);
    } catch (err) {
      setStatus({
        loading: false,
        success: "",
        error: "Ошибка при сбросе пароля",
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-md w-full mx-auto">
      <h3 className="text-xl font-semibold mb-4">Восстановление пароля</h3>
      {!isOTPSent ? (
        <form onSubmit={handleForgotPassword} className="space-y-4" autoComplete="off">
          <input
            type="email"
            placeholder="Введите email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
            disabled={status.loading}
            autoComplete="off"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={status.loading}
            className={`w-full py-2 rounded ${
              status.loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white transition`}
          >
            {status.loading ? "Отправка..." : "Отправить"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4" autoComplete="off">
          <input
            type="text"
            placeholder="Введите код из письма"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            disabled={status.loading}
            autoComplete="off"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Новый пароль"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={status.loading}
            autoComplete="new-password"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={status.loading}
            className={`w-full py-2 rounded ${
              status.loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            } text-white transition`}
          >
            {status.loading ? "Смена..." : "Сменить пароль"}
          </button>
        </form>
      )}
      {status.success && <p className="mt-4 text-green-600">{status.success}</p>}
      {status.error && <p className="mt-4 text-red-600">{status.error}</p>}
      <p className="mt-4">
        <button
          onClick={onClose}
          className="text-blue-600 underline"
        >
          Отмена
        </button>
      </p>
    </div>
  );
};

export default ForgotPasswordForm;
