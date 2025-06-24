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
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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

    if (!agreed) {
      toast.error("Вы должны согласиться с политикой конфиденциальности");
      return;
    }

    if (!form.first_name || !form.last_name || !form.email || !form.password || !form.confirmPassword) {
      toast.error("Все поля обязательны");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("first_name", form.first_name.trim());
      formData.append("last_name", form.last_name.trim());
      formData.append("email", form.email.trim());
      formData.append("password", form.password);
      if (avatar) formData.append("file", avatar);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code: verificationCode }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка подтверждения");

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
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!showVerification ? (
          <>
            {/* input поля (оставляем как есть) */}
            {/* ... */}

            {/* Аватар */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Аватар (необязательно, макс. 5MB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
                className="w-full px-3 py-2 border rounded-md"
              />
              {avatar && (
                <div className="mt-1 text-sm text-gray-500">Выбран файл: {avatar.name}</div>
              )}
            </div>

            {/* Чекбокс и ссылка */}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={loading}
              />
              <span>
                Я соглашаюсь с{" "}
                <button
                  type="button"
                  className="underline text-blue-600 hover:text-blue-800"
                  onClick={() => setShowPrivacyModal(true)}
                >
                  политикой конфиденциальности
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition ${
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
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleVerifyEmail}
              disabled={loading}
              className={`w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Проверка..." : "Подтвердить email"}
            </button>
          </div>
        )}
      </form>

      {/* Модалка политики конфиденциальности */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full p-6 rounded shadow-lg overflow-y-auto max-h-[80vh]">
            <h2 className="text-xl font-semibold mb-4">Политика конфиденциальности</h2>
            <p className="text-sm text-gray-700 leading-relaxed space-y-2">
              <strong>1. Общие положения:</strong> Мы уважаем вашу конфиденциальность и обязуемся
              защищать персональные данные, которые вы предоставляете.
              <br />
              <strong>2. Сбор информации:</strong> Мы собираем только необходимую информацию: имя,
              email, аватар и другие данные, нужные для регистрации и обработки заявок.
              <br />
              <strong>3. Хранение и защита:</strong> Все данные хранятся на защищённых серверах и
              не передаются третьим лицам без вашего согласия.
              <br />
              <strong>4. Удаление данных:</strong> Вы можете запросить удаление своего аккаунта и
              всех связанных с ним данных.
              <br />
              <strong>5. Обновления:</strong> Мы можем периодически обновлять эту политику и
              уведомлять вас об изменениях.
              <br />
              По всем вопросам пишите на <a href="mailto:admin@dragonauto74.ru" className="underline text-blue-600">admin@dragonauto74.ru</a>
            </p>
            <div className="text-right mt-6">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RegisterForm;
