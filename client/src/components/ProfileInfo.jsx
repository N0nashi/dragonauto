import React, { useState, useEffect, useCallback } from "react";

export default function ProfileInfo() {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    avatarUrl: "https://i.pravatar.cc/150?img=12",
  });

  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notification, setNotification] = useState({ message: "", type: "" });

  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState({
    firstName: "",
    lastName: "",
    avatarUrl: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // Получение полного URL аватара
  const getFullAvatarUrl = (url) => {
    if (!url) return "https://i.pravatar.cc/150?img=12";
    if (url.startsWith("http")) return url;
    return `http://localhost:5000${url}`;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Пользователь не авторизован");
      return;
    }

    fetch("http://localhost:5000/api/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Ошибка при загрузке профиля");
        const data = await res.json();
        setProfile({
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          avatarUrl: data.photo_url || "https://i.pravatar.cc/150?img=12",
        });
        setEditProfile({
          firstName: data.first_name,
          lastName: data.last_name,
          avatarUrl: data.photo_url || "https://i.pravatar.cc/150?img=12",
        });
      })
      .catch((err) => {
        console.error(err);
        alert("Не удалось загрузить профиль");
      });
  }, []);

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: "", type: "" });
    }, 5000);
  }, []);

  const handleEmailChange = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !newEmail) {
      showNotification("Введите новый email", "error");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/profile/email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail }),
      });
      if (!res.ok) throw new Error("Ошибка при обновлении email");
      setProfile((prev) => ({ ...prev, email: newEmail }));
      setNewEmail("");
      showNotification("Email успешно обновлен", "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !currentPassword || !newPassword || !confirmPassword) {
      showNotification("Заполните все поля", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification("Новый пароль и подтверждение не совпадают", "error");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/profile/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Ошибка при смене пароля");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showNotification("Пароль успешно обновлен", "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return editProfile.avatarUrl;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", selectedFile);

    const res = await fetch("http://localhost:5000/api/upload?folder=avatars", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Ошибка при загрузке изображения");
    }

    const data = await res.json();
    return data.url; // URL для сохранения в профиле
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      showNotification("Пользователь не авторизован", "error");
      return;
    }

    try {
      const uploadedUrl = await handleFileUpload();
      const bodyData = {
        first_name: editProfile.firstName,
        last_name: editProfile.lastName,
        photo_url: uploadedUrl,
      };

      const res = await fetch("http://localhost:5000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Ошибка при обновлении профиля");
      }

      setProfile({ ...editProfile, avatarUrl: uploadedUrl });
      setIsEditing(false);
      setSelectedFile(null);
      showNotification("Профиль успешно обновлен", "success");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  // Вынесем формы в отдельные мемоизированные компоненты, чтобы минимизировать перерендеры

  const ProfileCard = React.useMemo(() => (
    <section className="border border-gray-300 rounded shadow-sm bg-white p-4 max-w-md w-full mx-auto md:mx-0">
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-600 mb-4">
          {isEditing ? (
            <img
              src={
                selectedFile
                  ? URL.createObjectURL(selectedFile)
                  : getFullAvatarUrl(editProfile.avatarUrl)
              }
              alt="Предпросмотр"
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={getFullAvatarUrl(profile.avatarUrl)}
              alt="Фото профиля"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {isEditing ? (
          <>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="mb-2"
            />
            <input
              type="text"
              value={editProfile.firstName}
              onChange={(e) =>
                setEditProfile((prev) => ({ ...prev, firstName: e.target.value }))
              }
              placeholder="Имя"
              className="mb-2 w-full border border-gray-300 rounded px-3 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
            <input
              type="text"
              value={editProfile.lastName}
              onChange={(e) =>
                setEditProfile((prev) => ({ ...prev, lastName: e.target.value }))
              }
              placeholder="Фамилия"
              className="mb-4 w-full border border-gray-300 rounded px-3 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
            <div className="flex gap-2 w-full">
              <button
                onClick={handleProfileSave}
                className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition flex-grow"
              >
                Сохранить
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditProfile(profile);
                  setSelectedFile(null);
                }}
                className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500 transition flex-grow"
              >
                Отмена
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-1">{profile.firstName}</h2>
            <h3 className="text-lg text-gray-600 mb-3">{profile.lastName}</h3>
            <p className="text-gray-700 break-words text-center">{profile.email}</p>
            <button
              onClick={() => setIsEditing(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
            >
              Редактировать профиль
            </button>
          </>
        )}
      </div>
    </section>
  ), [profile, editProfile, isEditing, selectedFile]);

  const EmailChangeCard = React.useMemo(() => (
    <section className="bg-white border border-gray-300 rounded shadow-sm p-4 mb-6 max-w-lg w-full mx-auto md:mx-0">
      <h3 className="text-lg font-semibold mb-4">Смена электронной почты</h3>
      <form onSubmit={handleEmailChange} className="flex flex-col gap-2" autoComplete="off">
        <input
          type="email"
          placeholder="Новый email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          autoComplete="off"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded py-1 hover:bg-blue-700 transition"
        >
          Обновить email
        </button>
      </form>
    </section>
  ), [newEmail]);

  const PasswordChangeCard = React.useMemo(() => (
    <section className="bg-white border border-gray-300 rounded shadow-sm p-4 max-w-lg w-full mx-auto md:mx-0">
      <h3 className="text-lg font-semibold mb-4">Смена пароля</h3>
      <form onSubmit={handlePasswordChange} className="flex flex-col gap-2" autoComplete="off">
        <input
          type="password"
          placeholder="Текущий пароль"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          autoComplete="off"
        />
        <input
          type="password"
          placeholder="Новый пароль"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          autoComplete="off"
        />
        <input
          type="password"
          placeholder="Подтверждение нового пароля"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          autoComplete="off"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded py-1 hover:bg-blue-700 transition"
        >
          Обновить пароль
        </button>
      </form>
    </section>
  ), [currentPassword, newPassword, confirmPassword]);

  return (
    <>
      {notification.message && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded shadow-md font-semibold z-50 ${
            notification.type === "error"
              ? "bg-red-600 text-white"
              : "bg-green-600 text-white"
          }`}
        >
          {notification.message}
        </div>
      )}

      <main className="p-4 flex flex-col items-center gap-6 max-w-4xl mx-auto md:flex-row md:items-start md:justify-between">
        {ProfileCard}
        <div className="flex flex-col gap-6 flex-grow">
          {EmailChangeCard}
          {PasswordChangeCard}
        </div>
      </main>
    </>
  );
}
