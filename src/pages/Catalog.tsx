import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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

function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();

  const selectedBrand = searchParams.get("brand");

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
              {filteredProducts.map((product) => (
                <div className="product-card" key={product.ProductID}>
                  <div className="product-image">
                    {product.Image && (
                      <img
                        src={getProductImageUrl(product.Image)}
                        alt={product.ModelName}
                      />
                    )}
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
                  </div>
                </div>
              ))}
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