import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Client {
  ClientID: number;
  FirstName: string;
  LastName: string;
  Phone: string;
  Email: string;
}

interface CartItem {
  ProductID: number;
  Quantity: number;
}

interface CartUpdatedEvent extends CustomEvent {
  detail: {
    total?: number;
  };
}

const API_URL = import.meta.env.PROD ? "" : "http://localhost:5001";

function getSavedClient(): Client | null {
  try {
    const savedClient = localStorage.getItem("client");
    return savedClient ? JSON.parse(savedClient) : null;
  } catch {
    return null;
  }
}

function Header() {
  const [client, setClient] = useState<Client | null>(getSavedClient);
  const [cartCount, setCartCount] = useState(0);

  // Обновление информации о пользователе
  useEffect(() => {
    function updateClient() {
      setClient(getSavedClient());
    }

    window.addEventListener("client-updated", updateClient);
    window.addEventListener("storage", updateClient);

    return () => {
      window.removeEventListener("client-updated", updateClient);
      window.removeEventListener("storage", updateClient);
    };
  }, []);

  // Загрузка количества товаров из корзины
  const loadCartCount = useCallback(async () => {
    if (!client?.ClientID) {
      setCartCount(0);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/cart/${client.ClientID}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Не удалось загрузить корзину");
      }

      const data: CartItem[] = await response.json();

      const totalQuantity = data.reduce(
        (sum, item) => sum + Number(item.Quantity || 0),
        0
      );

      setCartCount(totalQuantity);
    } catch (error) {
      console.error("Ошибка загрузки корзины:", error);
    }
  }, [client?.ClientID]);

  // Первоначальная загрузка и обработка изменений корзины
  useEffect(() => {
    loadCartCount();

    function handleCartUpdated(event: Event) {
      const customEvent = event as CartUpdatedEvent;
      const total = customEvent.detail?.total;

      // Если новое количество передано в событии,
      // обновляем счётчик сразу, без запроса к API
      if (typeof total === "number") {
        setCartCount(total);
      } else {
        // Если количество не передано, загружаем его с сервера
        loadCartCount();
      }
    }

    window.addEventListener("cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, [loadCartCount]);

  return (
    <header className="site-header">
      <Link to="/" className="site-logo">
        Chronos & Co
      </Link>

      <nav className="site-nav">
        <Link to="/">Главная</Link>
        <Link to="/catalog">Каталог</Link>
        <Link to="/brands">Бренды</Link>
        <Link to="/about">О компании</Link>
      </nav>

      <div className="header-actions">
        <Link to="/favorites" title="Избранное">
          ♡
        </Link>

        <Link to="/cart" title="Корзина" className="cart-header-link">
          🛒
          {cartCount > 0 && (
            <span className="cart-count">{cartCount}</span>
          )}
        </Link>

        {client ? (
          <Link to="/account" className="login-button">
            {client.FirstName}
          </Link>
        ) : (
          <Link to="/login" className="login-button">
            Войти
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;