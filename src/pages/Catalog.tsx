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

function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="catalog-page">
      <Header />

      <main className="catalog">
        <div className="section-heading">
          <p>CHRONOS & CO</p>
          <h1>Каталог часов</h1>
        </div>

        {loading && <p className="catalog-message">Загрузка товаров...</p>}

        {error && <p className="catalog-message">{error}</p>}

        {!loading && !error && (
          <div className="product-grid">
            {products.map((product) => (
              <div className="product-card" key={product.ProductID}>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Catalog;