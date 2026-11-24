import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
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

const API_URL = import.meta.env.PROD ? "" : "http://localhost:5000";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [cartProductIds, setCartProductIds] = useState<number[]>([]);
  const [cartAdding, setCartAdding] = useState(false);

  const [clientId] = useState<number | null>(() => {
    try {
      const client = JSON.parse(localStorage.getItem("client") || "null");
      return client?.ClientID ?? null;
    } catch {
      return null;
    }
  });

  // Загружаем товар
  useEffect(() => {
    getProducts()
      .then((data: Product[]) => {
        const foundProduct = data.find(
          (item) => item.ProductID === Number(id)
        );

        setProduct(foundProduct || null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

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
  async function toggleFavorite() {
    if (!product) return;

    if (!clientId) {
      navigate("/login");
      return;
    }

    const productId = product.ProductID;
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
  async function addToCart() {
    if (!product) return;

    if (!clientId) {
      navigate("/login");
      return;
    }

    const productId = product.ProductID;

    if (cartProductIds.includes(productId)) {
      return;
    }

    setCartAdding(true);

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
      window.dispatchEvent(new Event("cart-updated"));
    } finally {
      setCartAdding(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <p className="catalog-message">Загрузка товара...</p>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <p className="catalog-message">Товар не найден</p>
      </>
    );
  }

  const isFavorite = favoriteIds.includes(product.ProductID);
  const isInCart = cartProductIds.includes(product.ProductID);

  return (
    <div className="product-page">
      <Header />

      <main className="product-details">
        <div className="product-details-image">
          <img
            src={getProductImageUrl(product.Image)}
            alt={product.ModelName}
          />
        </div>

        <div className="product-details-info">
          <p className="product-brand">{product.BrandName}</p>

          <h1>{product.ModelName}</h1>

          <p className="product-category">
            {product.CategoryName}
          </p>

          <div className="product-details-price">
            {product.Price.toLocaleString("ru-RU")} ₽
          </div>

          <p className="product-details-description">
            {product.Description}
          </p>

          <div className="product-specifications">
            <h2>Характеристики</h2>
            <p>{product.Specifications}</p>
          </div>

          <details className="product-expand">
            <summary>Описание и история модели</summary>
            <p>{product.Description}</p>
            <p>
              {product.ModelName} — модель, в которой дизайн,
              внимание к деталям и особенности часового механизма
              формируют индивидуальный характер часов.
            </p>
          </details>

          <details className="product-expand">
            <summary>О бренде {product.BrandName}</summary>
            <p>
              {product.BrandName} — бренд, представленный в коллекции
              Chronos &amp; Co. Подробнее об истории марки и её
              часовых традициях можно узнать в разделе «Бренды».
            </p>
          </details>

          <p className="product-article">
            Артикул: {product.Article}
          </p>

          <div className="product-details-actions">
            <button
              type="button"
              onClick={toggleFavorite}
              aria-pressed={isFavorite}
            >
              {isFavorite
                ? "♥ Удалить из избранного"
                : "♡ Добавить в избранное"}
            </button>

            <button
              type="button"
              onClick={addToCart}
              disabled={isInCart || cartAdding}
            >
              {cartAdding
                ? "Добавление..."
                : isInCart
                  ? "✓ В корзине"
                  : "Добавить в корзину"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProductDetails;