import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const handleLinkClick = () => setIsOpen(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/");
  };

  return (
    <header className="bg-[#00355B] shadow-md flex items-center h-14 px-4 relative">
      {/* Логотип с ссылкой на главную */}
      <div className="flex-shrink-0">
        <Link to="/" onClick={handleLinkClick}>
          <img
            src={process.env.PUBLIC_URL + "/DA.svg"}
            alt="Logo"
            className="h-8 w-8"
          />
        </Link>
      </div>

      <div className="flex-grow" />

      {/* Десктопное меню */}
      <nav className="hidden md:flex space-x-8 text-white font-medium mr-4 lg:mr-8">
        <Link to="/" className="hover:text-blue-400" onClick={handleLinkClick}>
          Главная
        </Link>
        <Link
          to="/#reviews"
          className="hover:text-blue-400"
          onClick={handleLinkClick}
        >
          Отзывы
        </Link>
        <Link to="/faq" className="hover:text-blue-400" onClick={handleLinkClick}>
          Вопросы
        </Link>
      </nav>

      {/* Каталог и авторизация (десктоп) */}
      <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
        <Link
          to="/catalog"
          className="bg-white text-[#00355B] px-5 py-1.5 rounded-full font-semibold hover:bg-blue-600 hover:text-white transition h-8 flex items-center"
          onClick={handleLinkClick}
        >
          Каталог
        </Link>
        {isLoggedIn ? (
          <>
            <Link
              to="/profile"
              className="flex items-center space-x-1 text-white hover:text-blue-400 transition"
              onClick={handleLinkClick}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.121 17.804A7.966 7.966 0 0112 15a7.966 7.966 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Профиль</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-white hover:text-blue-400 font-semibold transition"
              aria-label="Выйти"
            >
              Выйти
            </button>
          </>
        ) : (
          <Link
            to="/auth"
            className="text-white hover:text-blue-400 font-semibold transition"
            onClick={handleLinkClick}
          >
            Войти
          </Link>
        )}
      </div>

      {/* Мобильная кнопка меню */}
      <button
        onClick={toggleMenu}
        className="md:hidden flex items-center justify-center w-10 h-10 focus:outline-none"
        aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={isOpen}
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Мобильное меню */}
      {isOpen && (
        <div
          className="absolute top-14 left-0 w-full bg-[#00355B] text-white flex flex-col items-center space-y-4 py-4 md:hidden z-10 shadow-md"
          role="menu"
          aria-label="Мобильное меню"
        >
          <Link to="/" onClick={handleLinkClick} className="hover:text-blue-400">
            Главная
          </Link>
          <Link to="/#reviews" onClick={handleLinkClick} className="hover:text-blue-400">
            Отзывы
          </Link>
          <Link to="/faq" onClick={handleLinkClick} className="hover:text-blue-400">
            Вопросы
          </Link>
          <Link
            to="/catalog"
            onClick={handleLinkClick}
            className="bg-white text-[#00355B] px-5 py-1.5 rounded-full font-semibold hover:bg-blue-600 hover:text-white transition h-8 flex items-center"
          >
            Каталог
          </Link>
          {isLoggedIn ? (
            <>
              <Link
                to="/profile"
                onClick={handleLinkClick}
                className="flex items-center justify-center space-x-2 text-white hover:text-blue-400 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.121 17.804A7.966 7.966 0 0112 15a7.966 7.966 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Профиль</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-white hover:text-blue-400 font-semibold transition"
                aria-label="Выйти"
              >
                Выйти
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              onClick={handleLinkClick}
              className="text-white hover:text-blue-400 font-semibold transition"
            >
              Войти
            </Link>
          )}
        </div>
      )}
    </header>
  );
}