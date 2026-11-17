import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Header from "./components/Header";

import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Brands from "./pages/Brands";
import About from "./pages/About";
import Login from "./pages/Login";
import Favorites from "./pages/Favorites";
import Cart from "./pages/Cart";
import ProductDetails from "./pages/ProductDetails";
import Account from "./pages/Account";

interface ToastData {
  message: string;
  type: "success" | "error";
}

function App() {
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    function handleToast(event: Event) {
      const customEvent = event as CustomEvent<ToastData>;
      setToast(customEvent.detail);
    }

    window.addEventListener("app-toast", handleToast);

    return () => {
      window.removeEventListener("app-toast", handleToast);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <BrowserRouter>
      <Header />

      {toast && (
        <div className={`app-toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "success" ? "✓" : "!"}
          </span>
          {toast.message}
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/catalog/:id" element={<ProductDetails />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/account" element={<Account />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;