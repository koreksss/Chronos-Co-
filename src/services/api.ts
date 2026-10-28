
const API_URL = "http://localhost:5000";

export async function getProducts() {
  const response = await fetch(`${API_URL}/api/products`);

  if (!response.ok) {
    throw new Error("Не удалось загрузить товары");
  }

  return response.json();
}
