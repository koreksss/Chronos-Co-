interface CartControlProps {
  quantity: number;
  onAdd: () => void;
  onChangeQuantity: (quantity: number) => void;
  onRemove: () => void;
}

function CartControl({
  quantity,
  onAdd,
  onChangeQuantity,
  onRemove,
}: CartControlProps) {
  if (quantity === 0) {
    return (
      <button
        className="add-to-cart-button"
        type="button"
        onClick={onAdd}
      >
        Добавить в корзину
      </button>
    );
  }

  return (
    <div className="cart-quantity-control">
      <div className="cart-quantity-counter">
        <button
          type="button"
          aria-label="Уменьшить количество"
          onClick={() => onChangeQuantity(quantity - 1)}
        >
          −
        </button>

        <span>{quantity}</span>

        <button
          type="button"
          aria-label="Увеличить количество"
          onClick={() => onChangeQuantity(quantity + 1)}
        >
          +
        </button>
      </div>

      <button
        type="button"
        className="cart-delete-button"
        aria-label="Удалить из корзины"
        title="Удалить из корзины"
        onClick={onRemove}
      >
        🛒
      </button>
    </div>
  );
}

export default CartControl;