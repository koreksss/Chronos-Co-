import { Link } from "react-router-dom";

interface Client {
  ClientID: number;
  FirstName: string;
  LastName: string;
  Phone: string;
  Email: string;
}

function Header() {
  const savedClient = localStorage.getItem("client");
  const client: Client | null = savedClient
    ? JSON.parse(savedClient)
    : null;

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

        <Link to="/cart" title="Корзина">
          🛒
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