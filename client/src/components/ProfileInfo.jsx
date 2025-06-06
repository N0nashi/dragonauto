import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ProfileInfo = () => {
  // Состояния профиля
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    avatarUrl: "",
  });
  
  // Состояния для смены email
  const [newEmail, setNewEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [isEmailStep, setIsEmailStep] = useState(false);
  
  // Состояния для смены пароля
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Состояния для редактирования профиля
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    firstName: "",
    lastName: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  
  // Состояния загрузки
  const [isLoading, setIsLoading] = useState({
    profile: false,
    email: false,
    password: false,
    avatar: false,
  });

  // Загрузка данных профиля
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(prev => ({...prev, profile: true}));
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Требуется авторизация");
        }

        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Ошибка загрузки профиля");
        }

        const data = await response.json();
        setProfile({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          email: data.email || "",
          avatarUrl: data.photo_url || "",
        });
        setEditedProfile({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
        });
        setAvatarPreview(data.photo_url || "");
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(prev => ({...prev, profile: false}));
      }
    };

    fetchProfile();
  }, []);

  // Обработка изменения аватара
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Сохранение изменений профиля
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(prev => ({...prev, profile: true}));
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Требуется авторизация");
      }

      const formData = new FormData();
      formData.append("first_name", editedProfile.firstName);
      formData.append("last_name", editedProfile.lastName);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка обновления профиля");
      }

      const data = await response.json();
      setProfile(prev => ({
        ...prev,
        firstName: data.first_name,
        lastName: data.last_name,
        avatarUrl: data.photo_url || prev.avatarUrl,
      }));
      setAvatarPreview(data.photo_url || avatarPreview);
      setEditMode(false);
      toast.success("Профиль успешно обновлен");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(prev => ({...prev, profile: false}));
    }
  };

  // Отправка кода подтверждения для смены email
  const handleSendVerificationCode = async (e) => {
    e.preventDefault();
    setIsLoading(prev => ({...prev, email: true}));
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Требуется авторизация");
      }

      if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        throw new Error("Введите корректный email");
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/profile/request-email-change`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка отправки кода");
      }

      setIsEmailStep(true);
      toast.success(`Код подтверждения отправлен на ${profile.email}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(prev => ({...prev, email: false}));
    }
  };

  // Подтверждение смены email
  const handleConfirmEmailChange = async (e) => {
    e.preventDefault();
    setIsLoading(prev => ({...prev, email: true}));
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Требуется авторизация");
      }

      if (!emailCode || emailCode.length !== 6) {
        throw new Error("Введите 6-значный код");
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/profile/email`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newEmail: newEmail,
            code: emailCode,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка подтверждения email");
      }

      const result = await response.json();
      setProfile(prev => ({ ...prev, email: result.user.email }));
      setNewEmail("");
      setEmailCode("");
      setIsEmailStep(false);
      toast.success("Email успешно изменен");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(prev => ({...prev, email: false}));
    }
  };

  // Смена пароля
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsLoading(prev => ({...prev, password: true}));
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Требуется авторизация");
      }

      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error("Заполните все поля");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Пароли не совпадают");
      }

      if (newPassword.length < 6) {
        throw new Error("Пароль должен содержать минимум 6 символов");
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/profile/password`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка смены пароля");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Пароль успешно изменен");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(prev => ({...prev, password: false}));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Мой профиль</h1>
        
        {/* Карточка профиля */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
            <div className="relative">
              {editMode ? (
                <>
                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-blue-500">
                    <img
                      src={avatarPreview || "https://via.placeholder.com/150"}
                      alt="Аватар"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </label>
                </>
              ) : (
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
                  <img
                    src={profile.avatarUrl || "https://via.placeholder.com/150"}
                    alt="Аватар"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex-1">
              {editMode ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                    <input
                      type="text"
                      value={editedProfile.firstName}
                      onChange={(e) => setEditedProfile(prev => ({...prev, firstName: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                    <input
                      type="text"
                      value={editedProfile.lastName}
                      onChange={(e) => setEditedProfile(prev => ({...prev, lastName: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={isLoading.profile}
                      className={`px-4 py-2 rounded-md text-white ${isLoading.profile ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition`}
                    >
                      {isLoading.profile ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold text-gray-800">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <p className="text-gray-600 mt-1">{profile.email}</p>
                  <button
                    onClick={() => setEditMode(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Редактировать профиль
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Смена email */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Смена email</h2>
          
          {!isEmailStep ? (
            <form onSubmit={handleSendVerificationCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Новый email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading.email}
                className={`px-4 py-2 rounded-md text-white ${isLoading.email ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition`}
              >
                {isLoading.email ? 'Отправка...' : 'Отправить код подтверждения'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmEmailChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Код подтверждения</label>
                <input
                  type="text"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                  placeholder="Введите 6-значный код"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={6}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Код отправлен на текущий email: {profile.email}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading.email}
                  className={`px-4 py-2 rounded-md text-white ${isLoading.email ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'} transition`}
                >
                  {isLoading.email ? 'Проверка...' : 'Подтвердить'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEmailStep(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Смена пароля */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Смена пароля</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Текущий пароль</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Подтверждение пароля</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading.password}
              className={`px-4 py-2 rounded-md text-white ${isLoading.password ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition`}
            >
              {isLoading.password ? 'Сохранение...' : 'Изменить пароль'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo;