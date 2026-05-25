import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import ToastContainer from "./components/ui/ToastContainer";
import { ThemeProvider } from "./context/ThemeContext";
import { LangProvider } from "./context/LangContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";
import Home from "./pages/Home";
import CatalogPage from "./pages/CatalogPage";
import FAQPage from "./pages/FAQPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import CreateRequestPage from "./pages/CreateRequestPage";
import AdminPage from "./pages/AdminPage";

const BARE_ROUTES = ["/auth"];

function Layout() {
  const { pathname } = useLocation();
  const isBare = BARE_ROUTES.includes(pathname);

  return (
    <div className="min-h-screen flex flex-col bg-cream dark:bg-charcoal transition-colors duration-300">
      <ToastContainer />

      {!isBare && <Header />}

      <main className={isBare ? "" : "flex-grow"}>
        <Routes>
          <Route path="/"               element={<Home />} />
          <Route path="/catalog"        element={<CatalogPage />} />
          <Route path="/faq"            element={<FAQPage />} />
          <Route path="/profile"        element={<ProfilePage />} />
          <Route path="/auth"           element={<AuthPage />} />
          <Route path="/create-request" element={<CreateRequestPage />} />
          <Route path="/admin"          element={<AdminPage />} />
        </Routes>
      </main>

      {!isBare && <Footer />}
      {!isBare && <ChatWidget />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <Layout />
      </LangProvider>
    </ThemeProvider>
  );
}

export default App;
