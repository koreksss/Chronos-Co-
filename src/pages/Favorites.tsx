import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProductImageUrl } from "../services/storage";
import "../pages_css/Favorites.css";

interface Favorite {
  FavoriteID: number;
  ClientID: number;
  ProductID: number;
  AddedDate: string;
  ModelName: string;
  Price: number;
  Image: string;
  BrandName: string;
}

const API_URL = import.meta.env.PROD ? "" : "http://localhost:5000";

function Favorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const client = JSON.parse(localStorage.getItem("client") || "null");
  const clientId = client?.ClientID;

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/favorites/${clientId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Не удалось загрузить избранное");
        }
        return response.json();
      })
      .then((data) => setFavorites(data))
      .catch(() => setError("Не удалось загрузить избранное."))
      .finally(() => setLoading(false));
  }, [clientId]);

  async function removeFavorite(productId: number) {
    const previousFavorites = favorites;

    setFavorites((prev) =>
      prev.filter((item) => item.ProductID !== productId)
    );

    try {
      const response = await fetch(
        `${API_URL}/api/favorites/${clientId}/${productId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Не удалось удалить товар");
      }
    } catch {
      setFavorites(previousFavorites);
      setError("Не удалось удалить товар из избранного.");
    }
  }

  return (
    <main className="favorites-page">
      <section className="favorites-heading">
        <span>CHRONOS & CO</span>
        <h1>Избранное</h1>
        <p>Коллекция часов, которые вам понравились</p>

        {clientId && !loading && (
          <div className="favorites-count">
            {favorites.length}{" "}
            {favorites.length === 1
              ? "модель"
              : favorites.length >= 2 && favorites.length <= 4
              ? "модели"
              : "моделей"}
          </div>
        )}
      </section>

      {!clientId && (
        <div className="favorites-empty">
          <span className="empty-heart">♡</span>
          <h2>Войдите в аккаунт</h2>
          <p>Чтобы сохранять понравившиеся модели часов.</p>
          <Link to="/login" className="favorites-catalog-button">
            Войти
          </Link>
        </div>
      )}

      {loading && (
        <p className="favorites-message">Загрузка избранного...</p>
      )}

      {error && (
        <p className="favorites-message">{error}</p>
      )}

      {!loading && !error && clientId && (
        favorites.length > 0 ? (
          <section className="product-grid">
            {favorites.map((item) => (
              <article className="product-card" key={item.FavoriteID}>
                <div className="product-image">
                  <Link to={`/catalog/${item.ProductID}`}>
                    {item.Image && (
                      <img
                        className="watch-image"
                        src={getProductImageUrl(item.Image)}
                        alt={`${item.BrandName} ${item.ModelName}`}
                      />
                    )}
                  </Link>

                  <button
                    type="button"
                    className="favorite-button active"
                    onClick={() => removeFavorite(item.ProductID)}
                    aria-label="Удалить из избранного"
                    title="Удалить из избранного"
                  >
                    <span className="heart-icon">♥</span>
                  </button>
                </div>

                <div className="product-info">
                  <p className="product-brand">{item.BrandName}</p>

                  <h2>{item.ModelName}</h2>

                  <div className="product-bottom">
                    <span>
                      {item.Price.toLocaleString("ru-RU")} ₽
                    </span>

                    <Link to={`/catalog/${item.ProductID}`}>
                      Подробнее
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <div className="favorites-empty">
            <span className="empty-heart">♡</span>
            <h2>В избранном пока пусто</h2>
            <p>
              Добавляйте понравившиеся часы, чтобы не потерять их.
            </p>
            <Link to="/catalog" className="favorites-catalog-button">
              Перейти в каталог
            </Link>
          </div>
        )
      )}
    </main>
  );
}

export default Favorites;