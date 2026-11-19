import { useCallback, useEffect, useState } from "react";

export interface CartEntry {
  CartID?: number;
  ClientID?: number;
  ProductID: number;
  Quantity: number;
}

const API_URL = import.meta.env.PROD ? "" : "http://localhost:5001";

export function useCart(clientId: number | null) {
  const [cartItems, setCartItems] = useState<CartEntry[]>([]);

  const loadCart = useCallback(async () => {
    if (!clientId) {
      setCartItems([]);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/cart/${clientId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить корзину");
      }

      const data: CartEntry[] = await response.json();
      setCartItems(data);
    } catch (error) {
      console.error(error);
    }
  }, [clientId]);

  useEffect(() => {
    loadCart();

    window.addEventListener("cart-updated", loadCart);

    return () => {
      window.removeEventListener("cart-updated", loadCart);
    };
  }, [loadCart]);

  // Получить количество конкретной модели
  const getQuantity = useCallback(
    (productId: number) => {
      return (
        cartItems.find((item) => item.ProductID === productId)?.Quantity ?? 0
      );
    },
    [cartItems]
  );

  // Добавить модель или увеличить количество
  const addToCart = useCallback(
    async (productId: number) => {
      if (!clientId) return;

      setCartItems((prev) => {
        const existing = prev.find(
          (item) => item.ProductID === productId
        );

        if (existing) {
          return prev.map((item) =>
            item.ProductID === productId
              ? { ...item, Quantity: item.Quantity + 1 }
              : item
          );
        }

        return [...prev, { ProductID: productId, Quantity: 1 }];
      });

      try {
        const response = await fetch(`${API_URL}/api/cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ClientID: clientId,
            ProductID: productId,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Не удалось добавить товар");
        }

        window.dispatchEvent(new Event("cart-updated"));
      } catch (error) {
        console.error(error);
        await loadCart();
      }
    },
    [clientId, loadCart]
  );

  // Установить новое количество
  const updateQuantity = useCallback(
    async (productId: number, quantity: number) => {
      if (!clientId) return;

      if (quantity <= 0) {
        await removeFromCart(productId);
        return;
      }

      const previousItems = cartItems;

      setCartItems((prev) =>
        prev.map((item) =>
          item.ProductID === productId
            ? { ...item, Quantity: quantity }
            : item
        )
      );

      try {
        const response = await fetch(
          `${API_URL}/api/cart/${clientId}/${productId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Quantity: quantity }),
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Не удалось изменить количество");
        }

        window.dispatchEvent(new Event("cart-updated"));
      } catch (error) {
        console.error(error);
        setCartItems(previousItems);
        await loadCart();
      }
    },
    [clientId, cartItems, loadCart]
  );

  // Полностью удалить модель
  const removeFromCart = useCallback(
    async (productId: number) => {
      if (!clientId) return;

      const previousItems = cartItems;

      setCartItems((prev) =>
        prev.filter((item) => item.ProductID !== productId)
      );

      try {
        const response = await fetch(
          `${API_URL}/api/cart/${clientId}/${productId}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Не удалось удалить товар");
        }

        window.dispatchEvent(new Event("cart-updated"));
      } catch (error) {
        console.error(error);
        setCartItems(previousItems);
        await loadCart();
      }
    },
    [clientId, cartItems, loadCart]
  );

  return {
    cartItems,
    getQuantity,
    addToCart,
    updateQuantity,
    removeFromCart,
  };
}