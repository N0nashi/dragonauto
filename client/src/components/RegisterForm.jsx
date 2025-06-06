import React, { useState } from "react";

const RegisterForm = ({ setMessage, onRegisterSuccess }) => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });

  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage("Размер файла не должен превышать 5MB");
        return;
      }
      setAvatar(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("first_name", form.first_name);
      formData.append("last_name", form.last_name);
      formData.append("email", form.email);
      formData.append("password", form.password);

      if (avatar) {
        formData.append("file", avatar); // имя поля должно быть "file", как в uploadMiddleware
      }

      const response = await fetch(`http://195.133.147.185:5000/api/register?folder=avatars`, {
        method: "POST",
        body: formData, // не указываем Content-Type вручную
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка регистрации");
      }

      onRegisterSuccess(data.token);
      setMessage("Регистрация успешна!");
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="first_name"
        placeholder="Имя"
        value={form.first_name}
        onChange={handleChange}
        required
        disabled={loading}
        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="text"
        name="last_name"
        placeholder="Фамилия"
        value={form.last_name}
        onChange={handleChange}
        required
        disabled={loading}
        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
        disabled={loading}
        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="password"
        name="password"
        placeholder="Пароль"
        value={form.password}
        onChange={handleChange}
        required
        disabled={loading}
        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

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

      <button
        type="submit"
        disabled={loading}
        className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition ${
          loading ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Загрузка..." : "Зарегистрироваться"}
      </button>
    </form>
  );
};

export default RegisterForm;
