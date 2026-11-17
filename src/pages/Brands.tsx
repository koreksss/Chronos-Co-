import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Brand {
  BrandID: number;
  BrandName: string;
  Country: string;
  Description: string;
  LogoURL: string;
}

const API_URL = import.meta.env.PROD ? "" : "http://localhost:5001";

function Brands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBrands() {
      try {
        const response = await fetch(`${API_URL}/api/brands`);

        if (!response.ok) {
          throw new Error("Не удалось загрузить бренды");
        }

        const data = await response.json();
        setBrands(data);
      } catch {
        setError("Не удалось загрузить список брендов.");
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, []);

  if (loading) return <p className="brands-message">Загрузка брендов...</p>;
  if (error) return <p className="brands-message">{error}</p>;

  return (
    <main className="brands-page">
      <section className="brands-heading">
        <span>CHRONOS & CO</span>
        <h1>Наши бренды</h1>
        <p>
          Знакомьтесь с часовыми домами, чьи традиции и мастерство
          определяют искусство часового дела.
        </p>
      </section>

      <section className="brands-grid">
        {brands.map((brand) => (
          <Link
            to={`/catalog?brand=${encodeURIComponent(brand.BrandName)}`}
            className="brand-card"
            key={brand.BrandID}
          >
            <div className="brand-logo">
              <img
                src={brand.LogoURL}
                alt={`Логотип ${brand.BrandName}`}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div className="brand-info">
              <h2>{brand.BrandName}</h2>
              <span className="brand-country">{brand.Country}</span>
              <p>{brand.Description}</p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}

export default Brands;