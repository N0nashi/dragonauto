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
  const [agreed, setAgreed] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Размер файла не должен превышать 5MB");
        return;
      }
      setAvatar(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.first_name || !form.last_name || !form.email || !form.password || !form.confirmPassword) {
      toast.error("Все поля обязательны");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    if (!agreed) {
      toast.error("Необходимо согласиться с политикой конфиденциальности");
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

      const response = await fetch(`https://dragonauto74.ru/api/register?folder=avatars`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Ошибка регистрации");

      if (data.requiresVerification) {
        setShowVerification(true);
        toast.info("Код подтверждения отправлен на ваш email");
      } else {
        toast.success("Регистрация успешна!");
        onRegisterSuccess(data.token);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Ошибка подтверждения");

      toast.success("Email успешно подтверждён!");
      onRegisterSuccess();
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
          <input type="text" name="first_name" placeholder="Имя" value={form.first_name} onChange={handleChange} disabled={loading} className="w-full px-4 py-2 border rounded" />
          <input type="text" name="last_name" placeholder="Фамилия" value={form.last_name} onChange={handleChange} disabled={loading} className="w-full px-4 py-2 border rounded" />
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} disabled={loading} className="w-full px-4 py-2 border rounded" />
          <input type="password" name="password" placeholder="Пароль" value={form.password} onChange={handleChange} disabled={loading} className="w-full px-4 py-2 border rounded" />
          <input type="password" name="confirmPassword" placeholder="Повторите пароль" value={form.confirmPassword} onChange={handleChange} disabled={loading} className="w-full px-4 py-2 border rounded" />

          <div>
            <label className="block text-sm font-medium mb-1">Аватар (необязательно, макс. 5MB)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} disabled={loading} className="w-full px-3 py-2 border rounded" />
            {avatar && <p className="text-sm text-gray-500 mt-1">Выбран файл: {avatar.name}</p>}
          </div>

          <div className="flex items-start gap-2">
            <input type="checkbox" checked={agreed} onChange={() => setAgreed(!agreed)} disabled={loading} className="mt-1" />
            <label className="text-sm text-gray-700">
              Я согласен с{" "}
              <button type="button" onClick={() => setShowPolicy(true)} className="text-blue-600 underline hover:text-blue-800">
                политикой конфиденциальности
              </button>
            </label>
          </div>

          <button type="submit" disabled={loading} className={`w-full bg-blue-600 text-white py-2 rounded ${loading ? "opacity-70 cursor-not-allowed" : ""}`}>
            {loading ? "Загрузка..." : "Зарегистрироваться"}
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-center text-gray-600">Мы отправили код подтверждения на <strong>{form.email}</strong></p>
          <input type="text" placeholder="Введите код из письма" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} disabled={loading} className="w-full px-4 py-2 border rounded" />
          <button type="button" onClick={handleVerifyEmail} disabled={loading} className={`w-full bg-green-600 text-white py-2 rounded ${loading ? "opacity-70 cursor-not-allowed" : ""}`}>
            {loading ? "Проверка..." : "Подтвердить email"}
          </button>
        </div>
      )}

      {showPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full relative">
            <h2 className="text-xl font-semibold mb-4">Политика конфиденциальности</h2>
            <div className="text-sm text-gray-700 h-64 overflow-y-auto space-y-2">
              <p>Мы собираем персональные данные исключительно для регистрации и обработки заявок.</p>
              <p>Ваши данные не передаются третьим лицам и защищены в соответствии с действующим законодательством.</p>
              <p>Вы можете запросить удаление данных, обратившись в службу поддержки.</p>
              <p>Использование сайта означает согласие с данной политикой.</p>
            </div>
            <button onClick={() => setShowPolicy(false)} className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

export default RegisterForm;
