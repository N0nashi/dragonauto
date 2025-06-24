import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RegisterForm = ({ onRegisterSuccess }) => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error("Размер файла не должен превышать 5MB");
      return;
    }
    setAvatar(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.first_name ||
      !form.last_name ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      toast.error("Все поля обязательны");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    if (!acceptedPolicy) {
      toast.error("Вы должны согласиться с политикой конфиденциальности");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("first_name", form.first_name.trim());
      formData.append("last_name", form.last_name.trim());
      formData.append("email", form.email.trim());
      formData.append("password", form.password);
      if (avatar) {
        formData.append("file", avatar);
      }

      const response = await fetch(
        `https://dragonauto74.ru/api/register?folder=avatars`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка регистрации");
      }

      if (data.requiresVerification) {
        setShowVerification(true);
        toast.info("Код подтверждения отправлен на ваш email");
      } else {
        if (data.token) {
          onRegisterSuccess(data.token);
          toast.success("Регистрация успешна! Вы вошли в аккаунт.");
        } else {
          toast.success("Регистрация успешна!");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode.trim()) {
      toast.error("Введите код подтверждения");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`https://dragonauto74.ru/api/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка подтверждения");
      }

      toast.success("Email успешно подтверждён!");

      if (data.token) {
        onRegisterSuccess(data.token);
      } else {
        toast.error("Не удалось получить токен после подтверждения");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Неверный или просроченный код");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!showVerification ? (
        <>
          <input
            type="text"
            name="first_name"
            placeholder="Имя"
            value={form.first_name}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-2 border rounded focus:outline-none"
          />
          <input
            type="text"
            name="last_name"
            placeholder="Фамилия"
            value={form.last_name}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-2 border rounded focus:outline-none"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-2 border rounded focus:outline-none"
          />
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            value={form.password}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-2 border rounded focus:outline-none"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Повторите пароль"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-2 border rounded focus:outline-none"
          />

          <div>
            <label className="block text-sm mb-1">Аватар (до 5MB, не обяз.)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
              className="w-full px-3 py-2 border rounded-md"
            />
            {avatar && (
              <div className="mt-1 text-sm text-gray-500">Файл: {avatar.name}</div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="policy"
              checked={acceptedPolicy}
              onChange={(e) => setAcceptedPolicy(e.target.checked)}
              disabled={loading}
            />
            <label htmlFor="policy" className="text-sm text-gray-700">
              Я принимаю{" "}
              <button
                type="button"
                onClick={() => setShowPolicyModal(true)}
                className="text-blue-600 underline"
              >
                политику конфиденциальности
              </button>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Загрузка..." : "Зарегистрироваться"}
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-center text-gray-600">
            Мы отправили код подтверждения на <strong>{form.email}</strong>
          </p>

          <input
            type="text"
            placeholder="Введите код из письма"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border rounded focus:outline-none"
          />

          <button
            type="button"
            onClick={handleVerifyEmail}
            disabled={loading}
            className={`w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Проверка..." : "Подтвердить email"}
          </button>
        </div>
      )}

      {showPolicyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-lg w-full relative">
            <button
              onClick={() => setShowPolicyModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Политика конфиденциальности</h2>
            <div className="text-sm text-gray-700 space-y-2 max-h-[60vh] overflow-y-auto">
              <p>
                Мы уважаем вашу конфиденциальность. Ваши данные используются исключительно
                для регистрации и работы сервиса DragonAuto.
              </p>
              <p>
                Мы не передаём вашу информацию третьим лицам без вашего согласия, за
                исключением случаев, предусмотренных законодательством.
              </p>
              <p>
                Email используется только для отправки кода подтверждения и уведомлений
                о ваших заявках.
              </p>
              <p>
                Если у вас есть вопросы — свяжитесь с нами через форму обратной связи.
              </p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default RegisterForm;
