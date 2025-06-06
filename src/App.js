import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./components/Home"; 
import CatalogPage from "./components/CatalogPage";
import FAQPage from "./pages/FAQPage";
import ProfilePage from "./components/ProfilePage";
import AuthPage from "./components/AuthPage";

// Импорт страницы создания заявки
import CreateRequestPage from "./components/CreateRequestPage";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ToastContainer position="top-right" autoClose={3000} />
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/auth" element={<AuthPage />} />
          {/* Добавляем новый маршрут */}
          <Route path="/create-request" element={<CreateRequestPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
