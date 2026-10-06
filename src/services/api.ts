const API_URL = "";

export async function getProducts() {
  const response = await fetch(`${API_URL}/api/products`);

  if (!response.ok) {
    throw new Error("Не удалось загрузить товары");
  }

  return response.json();
}