import { Navigate, useNavigate } from "react-router-dom";
import Header from "../components/Header";

interface Client {
  ClientID: number;
  FirstName: string;
  LastName: string;
  Phone: string;
  Email: string;
}

function Account() {
  const navigate = useNavigate();

  const savedClient = localStorage.getItem("client");

  const client: Client | null = savedClient
    ? JSON.parse(savedClient)
    : null;

  function handleLogout() {
    localStorage.removeItem("client");

    window.dispatchEvent(
      new CustomEvent("app-toast", {
        detail: {
          message: "Вы вышли из аккаунта",
          type: "success",
        },
      })
    );

    navigate("/");
  }

  if (!client) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="account-page">
      <Header />

      <main className="account-main">
        <div className="account-heading">
          <p className="account-label">CHRONOS & CO</p>
          <h1>Личный кабинет</h1>
          <p>Ваше пространство в мире часового искусства</p>
        </div>

        <section className="account-card">
          <div className="account-card-top">
            <div className="account-avatar">
              {client.FirstName.charAt(0).toUpperCase()}
            </div>

            <div className="account-welcome">
              <span>ЛИЧНЫЙ ПРОФИЛЬ</span>
              <h2>
                {client.FirstName} {client.LastName}
              </h2>
              <p>Рады видеть вас снова!</p>
            </div>
          </div>

          <div className="account-divider" />

          <h3 className="account-section-title">
            Личные данные
          </h3>

          <div className="account-info">
            <div className="account-info-item">
              <span>Имя и фамилия</span>
              <strong>
                {client.FirstName} {client.LastName}
              </strong>
            </div>

            <div className="account-info-item">
              <span>Электронная почта</span>
              <strong>{client.Email}</strong>
            </div>

            <div className="account-info-item">
              <span>Номер телефона</span>
              <strong>{client.Phone}</strong>
            </div>

            <div className="account-info-item">
              <span>Номер клиента</span>
              <strong>№ {client.ClientID}</strong>
            </div>
          </div>

          <div className="account-divider" />

          <div className="account-bottom">
            <p>
              Благодарим за выбор Chronos & Co.
            </p>

            <button
              type="button"
              className="account-logout"
              onClick={handleLogout}
            >
              Выйти из аккаунта
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Account;