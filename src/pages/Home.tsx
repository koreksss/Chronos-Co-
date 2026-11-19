import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProducts } from "../services/api";
import { getProductImageUrl } from "../services/storage";

interface Product {
  ProductID: number;
  BrandName: string;
  ModelName: string;
  CategoryName: string;
  Price: number;
  Description: string;
  Image: string;
  Specifications: string;
  Article: string;
}

interface CartItem {
  ProductID: number;
}

const API_URL = import.meta.env.PROD ? "" : "http://localhost:5001";

function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [cartProductIds, setCartProductIds] = useState<number[]>([]);
  const [cartAddingId, setCartAddingId] = useState<number | null>(null);

  const [clientId] = useState<number | null>(() => {
    try {
      const client = JSON.parse(localStorage.getItem("client") || "null");
      return client?.ClientID ?? null;
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    getProducts()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Загружаем избранное
  useEffect(() => {
    if (!clientId) {
      setFavoriteIds([]);
      return;
    }

    async function loadFavorites() {
      try {
        const response = await fetch(
          `${API_URL}/api/favorites/${clientId}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Не удалось загрузить избранное");
        }

        const data = await response.json();

        setFavoriteIds(
          data.map((item: { ProductID: number }) => item.ProductID)
        );
      } catch (error) {
        console.error(error);
      }
    }

    loadFavorites();

    window.addEventListener("favorites-updated", loadFavorites);

    return () => {
      window.removeEventListener("favorites-updated", loadFavorites);
    };
  }, [clientId]);

  // Добавление и удаление из избранного
  async function toggleFavorite(productId: number) {
    if (!clientId) {
      navigate("/login");
      return;
    }

    const isFavorite = favoriteIds.includes(productId);

    setFavoriteIds((prev) =>
      isFavorite
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );

    try {
      const response = await fetch(
        isFavorite
          ? `${API_URL}/api/favorites/${clientId}/${productId}`
          : `${API_URL}/api/favorites`,
        isFavorite
          ? { method: "DELETE" }
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ClientID: clientId,
                ProductID: productId,
              }),
            }
      );

      if (!response.ok) {
        throw new Error("Не удалось обновить избранное");
      }

      window.dispatchEvent(new Event("favorites-updated"));
    } catch (error) {
      setFavoriteIds((prev) =>
        isFavorite
          ? [...prev, productId]
          : prev.filter((id) => id !== productId)
      );

      console.error(error);
    }
  }

  // Загружаем корзину пользователя
  useEffect(() => {
    if (!clientId) {
      setCartProductIds([]);
      return;
    }

    async function loadCart() {
      try {
        const response = await fetch(
          `${API_URL}/api/cart/${clientId}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Не удалось загрузить корзину");
        }

        const data: CartItem[] = await response.json();

        setCartProductIds([
          ...new Set(data.map((item) => item.ProductID)),
        ]);
      } catch (error) {
        console.error(error);
      }
    }

    loadCart();

    window.addEventListener("cart-updated", loadCart);

    return () => {
      window.removeEventListener("cart-updated", loadCart);
    };
  }, [clientId]);

  // Добавление товара в корзину
  async function addToCart(productId: number) {
    if (!clientId) {
      navigate("/login");
      return;
    }

    if (cartProductIds.includes(productId)) {
      return;
    }

    setCartAddingId(productId);

    try {
      const response = await fetch(`${API_URL}/api/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ClientID: clientId,
          ProductID: productId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось добавить товар");
      }

      setCartProductIds((prev) => [...prev, productId]);

      window.dispatchEvent(new Event("cart-updated"));
    } catch (error) {
      console.error(error);

      // Обновляем данные на случай, если товар уже добавлен
      window.dispatchEvent(new Event("cart-updated"));
    } finally {
      setCartAddingId(null);
    }
  }

  const featuredProducts = products.filter((product) =>
    [12, 5, 2].includes(product.ProductID)
  );

  return (
    <div className="home">
      <main>
        <section className="hero">
          <div className="hero-content">
            <p className="hero-label">CHRONOS & CO</p>
            <h1>Искусство времени</h1>
            <p className="hero-description">
              Премиальные часы от ведущих мировых брендов.
            </p>
            <Link to="/catalog" className="hero-button">
              Смотреть коллекцию
            </Link>
          </div>
        </section>

        <section className="categories">
          <div className="section-heading">
            <p>КОЛЛЕКЦИИ</p>
            <h2>Выберите свою коллекцию</h2>
          </div>

          <div className="category-grid">
            <Link to="/catalog?category=men" className="category-card">
              <div
                className="category-image category-men"
                role="img"
                aria-label="Коллекция мужских часов"
              />
              <div className="category-info">
                <h3>Мужские часы</h3>
                <span>Смотреть коллекцию →</span>
              </div>
            </Link>

            <Link to="/catalog?category=women" className="category-card">
              <div
                className="category-image category-women"
                role="img"
                aria-label="Коллекция женских часов"
              />
              <div className="category-info">
                <h3>Женские часы</h3>
                <span>Смотреть коллекцию →</span>
              </div>
            </Link>

            <Link to="/catalog?category=premium" className="category-card">
              <div
                className="category-image category-premium"
                role="img"
                aria-label="Премиальная коллекция часов"
              />
              <div className="category-info">
                <h3>Премиум коллекция</h3>
                <span>Смотреть коллекцию →</span>
              </div>
            </Link>
          </div>
        </section>

        <section className="featured">
          <div className="section-heading">
            <p>CHRONOS & CO</p>
            <h2>Премиальная коллекция</h2>
          </div>

          {loading && (
            <p className="catalog-message">Загрузка товаров...</p>
          )}

          {!loading && (
            <div className="product-grid">
              {featuredProducts.map((product) => {
                const isFavorite = favoriteIds.includes(product.ProductID);
                const isInCart = cartProductIds.includes(product.ProductID);

                return (
                  <div className="product-card" key={product.ProductID}>
                    <div className="product-image">
                      {product.Image && (
                        <img
                          className="watch-image"
                          src={getProductImageUrl(product.Image)}
                          alt={product.ModelName}
                        />
                      )}

                      <button
                        className={`favorite-button ${isFavorite ? "active" : ""}`}
                        type="button"
                        aria-label={
                          isFavorite
                            ? "Удалить из избранного"
                            : "Добавить в избранное"
                        }
                        aria-pressed={isFavorite}
                        onClick={() => toggleFavorite(product.ProductID)}
                      >
                        <span className="heart-icon">♥</span>
                      </button>
                    </div>

                    <div className="product-info">
                      <p className="product-brand">{product.BrandName}</p>
                      <h3>{product.ModelName}</h3>

                      <div className="product-bottom">
                        <span>
                          {product.Price.toLocaleString("ru-RU")} ₽
                        </span>
                        <Link to={`/catalog/${product.ProductID}`}>
                          Подробнее
                        </Link>
                      </div>

                      <button
                        className={`add-to-cart-button ${isInCart ? "in-cart" : ""}`}
                        type="button"
                        disabled={isInCart || cartAddingId === product.ProductID}
                        onClick={() => addToCart(product.ProductID)}
                      >
                        {cartAddingId === product.ProductID
                          ? "Добавление..."
                          : isInCart
                            ? "✓ В корзине"
                            : "Добавить в корзину"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Home;