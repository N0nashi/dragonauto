import React, { useState } from "react";
import axios from "axios";

const LoginForm = ({ setMessage, onLoginSuccess }) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await axios.post("http://localhost:5000/api/login", {
        email: form.email,
        password: form.password,
      });

      const token = res.data.token;
      localStorage.setItem("token", token);
      setMessage("Вход выполнен!");

      // Передаем токен наверх, чтобы обновить контекст и сделать navigate
      onLoginSuccess(token);
    } catch (error) {
      setMessage(error.response?.data?.error || "Ошибка входа");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="password"
        name="password"
        placeholder="Пароль"
        value={form.password}
        onChange={handleChange}
        required
        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Войти
      </button>
    </form>
  );
};

export default LoginForm;
