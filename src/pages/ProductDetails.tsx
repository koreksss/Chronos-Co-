import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="product-page">
      <Header />

      <main className="product-details">
        <div className="product-details-image">
          <img
            src={`/images/${product.Image}`}
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
            <h3>Характеристики</h3>
            <p>{product.Specifications}</p>
          </div>

          <p className="product-article">
            Артикул: {product.Article}
          </p>

          <div className="product-details-actions">
            <button>♡ Добавить в избранное</button>
            <button>Добавить в корзину</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProductDetails;