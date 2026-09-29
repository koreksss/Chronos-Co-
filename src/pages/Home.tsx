import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { getProducts } from "../services/api";

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

function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  const featuredProducts = products.slice(0, 3);

  return (
    <div className="home">
      <Header />

      <main>
        {/* Главный экран */}
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

        {/* Категории */}
        <section className="categories">
          <div className="section-heading">
            <p>КОЛЛЕКЦИИ</p>
            <h2>Выберите свою коллекцию</h2>
          </div>

          <div className="category-grid">
            <Link
              to="/catalog?category=men"
              className="category-card"
            >
              <div className="category-image category-men"></div>

              <div className="category-info">
                <h3>Мужские часы</h3>
                <span>Смотреть коллекцию →</span>
              </div>
            </Link>

            <Link
              to="/catalog?category=women"
              className="category-card"
            >
              <div className="category-image category-women"></div>

              <div className="category-info">
                <h3>Женские часы</h3>
                <span>Смотреть коллекцию →</span>
              </div>
            </Link>

            <Link
              to="/catalog?category=premium"
              className="category-card"
            >
              <div className="category-image category-premium"></div>

              <div className="category-info">
                <h3>Премиум коллекция</h3>
                <span>Смотреть коллекцию →</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Премиальная коллекция */}
        <section className="featured">
          <div className="section-heading">
            <p>CHRONOS & CO</p>
            <h2>Премиальная коллекция</h2>
          </div>

          {loading && (
            <p className="catalog-message">
              Загрузка товаров...
            </p>
          )}

          {!loading && (
            <div className="product-grid">
              {featuredProducts.map((product) => (
                <div
                  className="product-card"
                  key={product.ProductID}
                >
                  <div className="product-image">
                    {product.Image && (
                      <img
                        src={`/images/${product.Image}`}
                        alt={product.ModelName}
                      />
                    )}
                  </div>

                  <div className="product-info">
                    <p className="product-brand">
                      {product.BrandName}
                    </p>

                    <h3>{product.ModelName}</h3>

                    <button className="favorite-button">
                      ♡
                    </button>

                    <div className="product-bottom">
                      <span>{product.Price.toLocaleString("ru-RU")} ₽
                      </span>

                      <Link
                        to={`/catalog/${product.ProductID}`}
                      >
                        Подробнее
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Home;