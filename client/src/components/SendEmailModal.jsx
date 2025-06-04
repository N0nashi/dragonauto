import React, { useState, useEffect } from "react";

const SendEmailModal = ({ email, applicationId, onClose }) => {
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (applicationId) {
      setSubject(`Ответ по вашей заявке №${applicationId}`);
    }
  }, [applicationId]);

  const token = localStorage.getItem("token");

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("http://localhost:5000/api/adminRoutes/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to: email, subject, text }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Ошибка отправки");
      }

      setSuccess(true);
      setText("");
      // Если нужно, можно закрыть модалку автоматически:
      // setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Отправить письмо</h2>

        <p>
          <b>Кому:</b> {email || "не указан"}
        </p>

        <input
          type="text"
          placeholder="Тема"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
        />

        <textarea
          placeholder="Текст письма"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full mb-3 p-2 border rounded h-32"
        />

        {error && <p className="text-red-600 mb-2">{error}</p>}
        {success && <p className="text-green-600 mb-2">Письмо успешно отправлено!</p>}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Отмена
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !subject || !text}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendEmailModal;
