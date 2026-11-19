import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { Link } from "react-router-dom";
import { getProductImageUrl } from "../services/storage";

interface CartItem {
  CartID: number;
  ClientID: number;
  ProductID: number;
  AddedDate: string;
  Quantity: number;
  ModelName: string;
  Price: number;
  Image: string;
  BrandName: string;
}

interface DeliveryForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
}

type FormErrors = Partial<Record<keyof DeliveryForm, string>>;

const API_URL = import.meta.env.PROD ? "" : "http://localhost:5001";

const initialForm: DeliveryForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  city: "",
  address: "",
};

function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingIds, setUpdatingIds] = useState<number[]>([]);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [form, setForm] = useState<DeliveryForm>(initialForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Последние известные количества товаров.
  const latestQuantities = useRef(new Map<number, number>());

  // Очереди запросов для отдельных моделей часов.
  const quantityRequests = useRef(new Map<number, Promise<void>>());

  const [clientId] = useState<number | null>(() => {
    try {
      const client = JSON.parse(localStorage.getItem("client") || "null");
      return client?.ClientID ?? null;
    } catch {
      return null;
    }
  });

  // Общее количество товаров в корзине.
  const getTotalQuantity = useCallback(() => {
    return Array.from(latestQuantities.current.values()).reduce(
      (sum, quantity) => sum + quantity,
      0
    );
  }, []);

  // Мгновенная передача количества другим компонентам.
  const notifyCartUpdated = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("cart-updated", {
        detail: {
          total: getTotalQuantity(),
        },
      })
    );
  }, [getTotalQuantity]);

  // Загрузка корзины.
  const loadCart = useCallback(async () => {
    if (!clientId) {
      setItems([]);
      latestQuantities.current.clear();
      setLoading(false);
      notifyCartUpdated();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/cart/${clientId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить корзину");
      }

      const data: CartItem[] = await response.json();

      setItems(data);

      latestQuantities.current.clear();

      data.forEach((item) => {
        latestQuantities.current.set(item.ProductID, item.Quantity);
      });

      setError("");
      notifyCartUpdated();
    } catch (error) {
      console.error(error);
      setError("Не удалось загрузить корзину. Попробуйте обновить страницу.");
    } finally {
      setLoading(false);
    }
  }, [clientId, notifyCartUpdated]);

  // Загружаем корзину только при открытии страницы.
  // Не слушаем cart-updated, чтобы не перезаписывать локальные изменения.
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Обновление количества товара.
  function updateQuantity(item: CartItem, difference: number) {
    if (!clientId) return;

    const currentQuantity =
      latestQuantities.current.get(item.ProductID) ?? item.Quantity;

    const newQuantity = currentQuantity + difference;

    if (newQuantity < 1) {
      removeItem(item);
      return;
    }

    if (newQuantity === currentQuantity) return;

    // Сразу сохраняем новое количество.
    latestQuantities.current.set(item.ProductID, newQuantity);

    // Мгновенно обновляем интерфейс.
    setItems((prev) =>
      prev.map((cartItem) =>
        cartItem.ProductID === item.ProductID
          ? { ...cartItem, Quantity: newQuantity }
          : cartItem
      )
    );

    setError("");

    // Сразу обновляем счётчик в шапке.
    notifyCartUpdated();

    // Предыдущий запрос этой модели должен завершиться раньше нового.
    const previousRequest =
      quantityRequests.current.get(item.ProductID) ?? Promise.resolve();

    const currentRequest = previousRequest
      .catch(() => undefined)
      .then(async () => {
        const response = await fetch(
          `${API_URL}/api/cart/${clientId}/${item.ProductID}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              Quantity: newQuantity,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Не удалось изменить количество");
        }
      });

    quantityRequests.current.set(item.ProductID, currentRequest);

    currentRequest
      .catch(async (error) => {
        console.error(error);

        if (
          quantityRequests.current.get(item.ProductID) === currentRequest
        ) {
          setError(
            error instanceof Error
              ? error.message
              : "Не удалось изменить количество"
          );

          await loadCart();
        }
      })
      .finally(() => {
        if (
          quantityRequests.current.get(item.ProductID) === currentRequest
        ) {
          quantityRequests.current.delete(item.ProductID);
        }
      });
  }

  // Полное удаление модели из корзины.
  async function removeItem(item: CartItem) {
    if (
      !clientId ||
      updatingIds.includes(item.ProductID) ||
      !latestQuantities.current.has(item.ProductID)
    ) {
      return;
    }

    const previousRequest =
      quantityRequests.current.get(item.ProductID) ?? Promise.resolve();

    setUpdatingIds((prev) => [...prev, item.ProductID]);
    setError("");

    // Сразу убираем товар с экрана.
    setItems((prev) =>
      prev.filter((cartItem) => cartItem.ProductID !== item.ProductID)
    );

    latestQuantities.current.delete(item.ProductID);

    // Сразу обновляем счётчик в шапке.
    notifyCartUpdated();

    const currentRequest = previousRequest
      .catch(() => undefined)
      .then(async () => {
        const response = await fetch(
          `${API_URL}/api/cart/${clientId}/${item.ProductID}`,
          {
            method: "DELETE",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Не удалось удалить товар");
        }
      });

    quantityRequests.current.set(item.ProductID, currentRequest);

    try {
      await currentRequest;
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Не удалось удалить товар"
      );

      await loadCart();
    } finally {
      if (
        quantityRequests.current.get(item.ProductID) === currentRequest
      ) {
        quantityRequests.current.delete(item.ProductID);
      }

      setUpdatingIds((prev) =>
        prev.filter((id) => id !== item.ProductID)
      );
    }
  }

  // Изменение полей формы.
  function handleFormChange(field: keyof DeliveryForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  }

  // Проверка данных.
  function validateForm(): boolean {
    const errors: FormErrors = {};

    if (form.firstName.trim().length < 2) {
      errors.firstName = "Введите имя (не менее 2 символов)";
    }

    if (form.lastName.trim().length < 2) {
      errors.lastName = "Введите фамилию (не менее 2 символов)";
    }

    const phoneDigits = form.phone.replace(/\D/g, "");

    if (phoneDigits.length !== 11) {
      errors.phone = "Введите корректный номер телефона";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email.trim())) {
      errors.email = "Введите корректный адрес электронной почты";
    }

    if (form.city.trim().length < 2) {
      errors.city = "Введите город";
    }

    if (form.address.trim().length < 5) {
      errors.address = "Введите полный адрес доставки";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  }

  // Оформление заказа (демонстрационный режим).
  function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setOrderComplete(true);
  }

  // Закрытие и сброс окна.
  function closeCheckout() {
    setCheckoutOpen(false);
    setOrderComplete(false);
    setForm(initialForm);
    setFormErrors({});
  }

  // Общее количество часов.
  const totalQuantity = items.reduce(
    (sum, item) => sum + item.Quantity,
    0
  );

  // Общая стоимость.
  const total = items.reduce(
    (sum, item) => sum + item.Price * item.Quantity,
    0
  );

  return (
    <main className="cart-page">
      <section className="cart-heading">
        <span>CHRONOS & CO</span>
        <h1>Корзина</h1>
        <p>Ваш выбор, достойный времени</p>
      </section>

      {!clientId && (
        <section className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <h2>Войдите в аккаунт</h2>
          <p>
            Чтобы просматривать свою корзину, необходимо авторизоваться.
          </p>
          <Link to="/login" className="cart-continue-button">
            Войти
          </Link>
        </section>
      )}

      {clientId && loading && (
        <p className="cart-message">Загрузка корзины...</p>
      )}

      {clientId && !loading && error && (
        <p className="cart-error">{error}</p>
      )}

      {clientId && !loading && !error && items.length === 0 && (
        <section className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <h2>Ваша корзина пока пуста</h2>
          <p>
            Самое время найти часы, которые станут частью вашей истории.
          </p>
          <Link to="/catalog" className="cart-continue-button">
            Перейти в каталог
          </Link>
        </section>
      )}

      {clientId && !loading && items.length > 0 && (
        <div className="cart-content">
          <section className="cart-items">
            <div className="cart-items-heading">
              <h2>Ваши часы</h2>
              <span>
                {totalQuantity}{" "}
                {totalQuantity === 1
                  ? "товар"
                  : totalQuantity < 5
                    ? "товара"
                    : "товаров"}
              </span>
            </div>

            {items.map((item) => {
              const isUpdating = updatingIds.includes(item.ProductID);

              return (
                <article className="cart-item" key={item.CartID}>
                  <Link
                    to={`/catalog/${item.ProductID}`}
                    className="cart-item-image"
                  >
                    <img
                      src={getProductImageUrl(item.Image)}
                      alt={item.ModelName}
                    />
                  </Link>

                  <div className="cart-item-info">
                    <span className="cart-item-brand">
                      {item.BrandName}
                    </span>

                    <h3>{item.ModelName}</h3>

                    <Link
                      to={`/catalog/${item.ProductID}`}
                      className="cart-item-details"
                    >
                      Подробнее о модели →
                    </Link>
                  </div>

                  <div className="cart-item-actions">
                    <strong>
                      {(item.Price * item.Quantity).toLocaleString("ru-RU")} ₽
                    </strong>

                    <div className="cart-quantity-control">
                      <div className="cart-quantity-counter">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item, -1)}
                          aria-label="Уменьшить количество"
                          disabled={isUpdating}
                        >
                          −
                        </button>

                        <span>{item.Quantity}</span>

                        <button
                          type="button"
                          onClick={() => updateQuantity(item, 1)}
                          aria-label="Увеличить количество"
                          disabled={isUpdating}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="cart-delete-button"
                        onClick={() => removeItem(item)}
                        disabled={isUpdating}
                        aria-label="Удалить модель из корзины"
                        title="Удалить из корзины"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="19"
                          height="19"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="m19 6-1 14H6L5 6" />
                          <path d="M10 11v5M14 11v5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            <Link to="/catalog" className="cart-back-link">
              ← Продолжить покупки
            </Link>
          </section>

          <aside className="cart-summary">
            <h2>Ваш заказ</h2>

            <div className="cart-summary-row">
              <span>Количество товаров</span>
              <span>{totalQuantity}</span>
            </div>

            <div className="cart-summary-row">
              <span>Доставка</span>
              <span>Уточняется</span>
            </div>

            <div className="cart-summary-divider" />

            <div className="cart-total">
              <span>Итого</span>
              <strong>{total.toLocaleString("ru-RU")} ₽</strong>
            </div>

            <p className="cart-summary-note">
              Стоимость указана без учёта возможной доставки.
            </p>

            <button
              type="button"
              className="cart-checkout-button"
              onClick={() => setCheckoutOpen(true)}
            >
              Оформление заказа
            </button>

            <p className="cart-checkout-note">
              Заполните данные для доставки ваших часов.
            </p>
          </aside>
        </div>
      )}

      {/* Модальное окно оформления заказа */}
      {checkoutOpen && (
        <div
          className="checkout-overlay"
          onClick={closeCheckout}
        >
          <div
            className="checkout-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="checkout-close"
              onClick={closeCheckout}
              aria-label="Закрыть"
            >
              ×
            </button>

            {!orderComplete ? (
              <>
                <div className="checkout-heading">
                  <span>CHRONOS & CO</span>
                  <h2>Оформление заказа</h2>
                  <p>Укажите данные для доставки</p>
                </div>

                <form
                  className="checkout-form"
                  onSubmit={handleCheckout}
                  noValidate
                >
                  <div className="checkout-fields">
                    <div className="checkout-field">
                      <label htmlFor="firstName">Имя</label>
                      <input
                        id="firstName"
                        type="text"
                        placeholder="Ваше имя"
                        value={form.firstName}
                        onChange={(e) =>
                          handleFormChange("firstName", e.target.value)
                        }
                        className={formErrors.firstName ? "invalid" : ""}
                      />
                      {formErrors.firstName && (
                        <span className="field-error">
                          {formErrors.firstName}
                        </span>
                      )}
                    </div>

                    <div className="checkout-field">
                      <label htmlFor="lastName">Фамилия</label>
                      <input
                        id="lastName"
                        type="text"
                        placeholder="Ваша фамилия"
                        value={form.lastName}
                        onChange={(e) =>
                          handleFormChange("lastName", e.target.value)
                        }
                        className={formErrors.lastName ? "invalid" : ""}
                      />
                      {formErrors.lastName && (
                        <span className="field-error">
                          {formErrors.lastName}
                        </span>
                      )}
                    </div>

                    <div className="checkout-field">
                      <label htmlFor="phone">Телефон</label>
                      <input
                        id="phone"
                        type="tel"
                        placeholder="+7 (999) 123-45-67"
                        value={form.phone}
                        onChange={(e) =>
                          handleFormChange("phone", e.target.value)
                        }
                        className={formErrors.phone ? "invalid" : ""}
                      />
                      {formErrors.phone && (
                        <span className="field-error">
                          {formErrors.phone}
                        </span>
                      )}
                    </div>

                    <div className="checkout-field">
                      <label htmlFor="email">Электронная почта</label>
                      <input
                        id="email"
                        type="email"
                        placeholder="example@mail.com"
                        value={form.email}
                        onChange={(e) =>
                          handleFormChange("email", e.target.value)
                        }
                        className={formErrors.email ? "invalid" : ""}
                      />
                      {formErrors.email && (
                        <span className="field-error">
                          {formErrors.email}
                        </span>
                      )}
                    </div>

                    <div className="checkout-field checkout-field-full">
                      <label htmlFor="city">Город</label>
                      <input
                        id="city"
                        type="text"
                        placeholder="Город доставки"
                        value={form.city}
                        onChange={(e) =>
                          handleFormChange("city", e.target.value)
                        }
                        className={formErrors.city ? "invalid" : ""}
                      />
                      {formErrors.city && (
                        <span className="field-error">
                          {formErrors.city}
                        </span>
                      )}
                    </div>

                    <div className="checkout-field checkout-field-full">
                      <label htmlFor="address">Адрес доставки</label>
                      <textarea
                        id="address"
                        placeholder="Улица, дом, квартира"
                        rows={3}
                        value={form.address}
                        onChange={(e) =>
                          handleFormChange("address", e.target.value)
                        }
                        className={formErrors.address ? "invalid" : ""}
                      />
                      {formErrors.address && (
                        <span className="field-error">
                          {formErrors.address}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="checkout-total">
                    <span>К оплате</span>
                    <strong>
                      {total.toLocaleString("ru-RU")} ₽
                    </strong>
                  </div>

                  <button
                    type="submit"
                    className="checkout-submit"
                  >
                    Оформить заказ
                  </button>

                  <p className="checkout-disclaimer">
                    После оформления с вами свяжется менеджер для
                    подтверждения заказа и уточнения доставки.
                  </p>
                </form>
              </>
            ) : (
              <div className="checkout-success">
                <div className="success-icon">✓</div>
                <span>CHRONOS & CO</span>
                <h2>Заказ оформлен!</h2>
                <p>
                  Спасибо за ваш выбор, {form.firstName}!
                  Ваши данные приняты. Менеджер свяжется с вами
                  для подтверждения заказа.
                </p>
                <button
                  type="button"
                  className="checkout-submit"
                  onClick={closeCheckout}
                >
                  Продолжить
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default Cart;