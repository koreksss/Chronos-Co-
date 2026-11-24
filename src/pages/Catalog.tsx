import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getProducts } from "../services/api";
import { getProductImageUrl } from "../services/storage";
import "../pages_css/Catalog.css";

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

const API_URL = import.meta.env.PROD ? "" : "http://localhost:5000";

function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedBrand = searchParams.get("brand");

  // Загружаем товары
  useEffect(() => {
    getProducts()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Не удалось загрузить товары");
        setLoading(false);
      });
  }, []);

  // Загружаем избранное пользователя
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

  const filteredProducts = selectedBrand
    ? products.filter(
        (product) =>
          product.BrandName.toLowerCase() === selectedBrand.toLowerCase()
      )
    : products;

  return (
    <main className="catalog">
      <div className="section-heading">
        <p>CHRONOS & CO</p>
        <h1>
          {selectedBrand ? `Часы ${selectedBrand}` : "Каталог часов"}
        </h1>

        {selectedBrand && (
          <Link to="/catalog" className="catalog-reset">
            Посмотреть все бренды и модели
          </Link>
        )}
      </div>

      {loading && <p className="catalog-message">Загрузка товаров...</p>}

      {error && <p className="catalog-message">{error}</p>}

      {!loading && !error && (
        <>
          {filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((product) => {
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

                      <h2>{product.ModelName}</h2>

                      <p className="product-description">
                        {product.Description}
                      </p>

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
          ) : (
            <p className="catalog-message">
              Часы этого бренда пока отсутствуют в каталоге.
            </p>
          )}
        </>
      )}
    </main>
  );
}

export default Catalog;