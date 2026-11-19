from flask import Blueprint, jsonify, request
from sqlalchemy import text
from config.database import engine

cart_bp = Blueprint("cart", __name__)


# Получение корзины клиента
@cart_bp.route("/api/cart/<int:client_id>", methods=["GET"])
def get_cart(client_id):
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT
                        c."CartID",
                        c."ClientID",
                        c."ProductID",
                        c."AddedDate",
                        c."Quantity",
                        p."ModelName",
                        p."Price",
                        p."Image",
                        b."BrandName"
                    FROM public."Cart" AS c
                    INNER JOIN public."Products" AS p
                        ON c."ProductID" = p."ProductID"
                    INNER JOIN public."Brands" AS b
                        ON p."BrandID" = b."BrandID"
                    WHERE c."ClientID" = :client_id
                    ORDER BY c."AddedDate" DESC, c."CartID" DESC
                """),
                {"client_id": client_id}
            )

            cart = []

            for row in result:
                cart.append({
                    "CartID": row.CartID,
                    "ClientID": row.ClientID,
                    "ProductID": row.ProductID,
                    "AddedDate": str(row.AddedDate),
                    "Quantity": row.Quantity,
                    "ModelName": row.ModelName,
                    "Price": float(row.Price),
                    "Image": row.Image,
                    "BrandName": row.BrandName
                })

            return jsonify(cart)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Добавление модели или увеличение количества
@cart_bp.route("/api/cart", methods=["POST"])
def add_to_cart():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Не переданы данные"}), 400

        client_id = data.get("ClientID")
        product_id = data.get("ProductID")

        if not client_id or not product_id:
            return jsonify({
                "error": "ClientID и ProductID обязательны"
            }), 400

        with engine.begin() as connection:

            # Блокируем модель на время изменения корзины
            product = connection.execute(
                text("""
                    SELECT "ProductID"
                    FROM public."Products"
                    WHERE "ProductID" = :product_id
                    FOR UPDATE
                """),
                {"product_id": product_id}
            ).first()

            if not product:
                return jsonify({"error": "Модель не найдена"}), 404

            # Проверяем количество доступных экземпляров
            available = connection.execute(
                text("""
                    SELECT COUNT(*)
                    FROM public."ProductItems"
                    WHERE "ProductID" = :product_id
                      AND "Status" = 'В наличии'
                """),
                {"product_id": product_id}
            ).scalar() or 0

            # Считаем количество экземпляров,
            # уже находящихся в корзинах всех клиентов
            reserved = connection.execute(
                text("""
                    SELECT COALESCE(SUM("Quantity"), 0)
                    FROM public."Cart"
                    WHERE "ProductID" = :product_id
                """),
                {"product_id": product_id}
            ).scalar() or 0

            if reserved >= available:
                return jsonify({
                    "error": "Больше экземпляров этой модели нет в наличии"
                }), 409

            # Проверяем, есть ли модель в корзине клиента
            existing = connection.execute(
                text("""
                    SELECT "CartID", "Quantity"
                    FROM public."Cart"
                    WHERE "ClientID" = :client_id
                      AND "ProductID" = :product_id
                    FOR UPDATE
                """),
                {
                    "client_id": client_id,
                    "product_id": product_id
                }
            ).first()

            if existing:
                connection.execute(
                    text("""
                        UPDATE public."Cart"
                        SET "Quantity" = "Quantity" + 1
                        WHERE "CartID" = :cart_id
                    """),
                    {"cart_id": existing.CartID}
                )
            else:
                connection.execute(
                    text("""
                        INSERT INTO public."Cart"
                            ("ClientID", "ProductID", "AddedDate", "Quantity")
                        VALUES
                            (:client_id, :product_id, CURRENT_DATE, 1)
                    """),
                    {
                        "client_id": client_id,
                        "product_id": product_id
                    }
                )

        return jsonify({
            "message": "Количество товара обновлено"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Установка конкретного количества
@cart_bp.route(
    "/api/cart/<int:client_id>/<int:product_id>",
    methods=["PATCH"]
)
def update_cart_quantity(client_id, product_id):
    try:
        data = request.get_json()

        if not data or "Quantity" not in data:
            return jsonify({"error": "Не указано количество"}), 400

        try:
            quantity = int(data["Quantity"])
        except (ValueError, TypeError):
            return jsonify({"error": "Некорректное количество"}), 400

        if quantity < 1:
            return jsonify({
                "error": "Количество должно быть не меньше 1"
            }), 400

        with engine.begin() as connection:

            # Блокируем модель, чтобы избежать одновременного превышения запаса
            product = connection.execute(
                text("""
                    SELECT "ProductID"
                    FROM public."Products"
                    WHERE "ProductID" = :product_id
                    FOR UPDATE
                """),
                {"product_id": product_id}
            ).first()

            if not product:
                return jsonify({"error": "Модель не найдена"}), 404

            cart_item = connection.execute(
                text("""
                    SELECT "CartID", "Quantity"
                    FROM public."Cart"
                    WHERE "ClientID" = :client_id
                      AND "ProductID" = :product_id
                    FOR UPDATE
                """),
                {
                    "client_id": client_id,
                    "product_id": product_id
                }
            ).first()

            if not cart_item:
                return jsonify({"error": "Товар не найден в корзине"}), 404

            available = connection.execute(
                text("""
                    SELECT COUNT(*)
                    FROM public."ProductItems"
                    WHERE "ProductID" = :product_id
                      AND "Status" = 'В наличии'
                """),
                {"product_id": product_id}
            ).scalar() or 0

            reserved_by_others = connection.execute(
                text("""
                    SELECT COALESCE(SUM("Quantity"), 0)
                    FROM public."Cart"
                    WHERE "ProductID" = :product_id
                      AND "ClientID" <> :client_id
                """),
                {
                    "product_id": product_id,
                    "client_id": client_id
                }
            ).scalar() or 0

            if quantity > available - reserved_by_others:
                return jsonify({
                    "error": "Недостаточно экземпляров этой модели в наличии"
                }), 409

            connection.execute(
                text("""
                    UPDATE public."Cart"
                    SET "Quantity" = :quantity
                    WHERE "CartID" = :cart_id
                """),
                {
                    "quantity": quantity,
                    "cart_id": cart_item.CartID
                }
            )

        return jsonify({
            "message": "Количество обновлено",
            "Quantity": quantity
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Полное удаление модели из корзины
@cart_bp.route(
    "/api/cart/<int:client_id>/<int:product_id>",
    methods=["DELETE"]
)
def remove_from_cart(client_id, product_id):
    try:
        with engine.begin() as connection:
            result = connection.execute(
                text("""
                    DELETE FROM public."Cart"
                    WHERE "ClientID" = :client_id
                      AND "ProductID" = :product_id
                    RETURNING "CartID"
                """),
                {
                    "client_id": client_id,
                    "product_id": product_id
                }
            )

            if not result.first():
                return jsonify({
                    "error": "Товар не найден в корзине"
                }), 404

        return jsonify({
            "message": "Товар удалён из корзины"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500