from flask import Blueprint, jsonify, request
from sqlalchemy import text
from config.database import engine

favorites_bp = Blueprint("favorites", __name__)


# Получение избранного пользователя
@favorites_bp.route("/api/favorites/<int:client_id>", methods=["GET"])
def get_favorites(client_id):
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT
                        f."FavoriteID",
                        f."ClientID",
                        f."ProductID",
                        f."AddedDate",
                        p."ModelName",
                        p."Price",
                        p."Image",
                        b."BrandName"
                    FROM "Favorites" f
                    INNER JOIN "Products" p
                        ON f."ProductID" = p."ProductID"
                    INNER JOIN "Brands" b
                        ON p."BrandID" = b."BrandID"
                    WHERE f."ClientID" = :client_id
                    ORDER BY f."AddedDate" DESC
                """),
                {"client_id": client_id}
            )

            favorites = []

            for row in result:
                favorites.append({
                    "FavoriteID": row.FavoriteID,
                    "ClientID": row.ClientID,
                    "ProductID": row.ProductID,
                    "AddedDate": str(row.AddedDate),
                    "ModelName": row.ModelName,
                    "Price": float(row.Price),
                    "Image": row.Image,
                    "BrandName": row.BrandName
                })

            return jsonify(favorites)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Добавление товара в избранное
@favorites_bp.route("/api/favorites", methods=["POST"])
def add_favorite():
    try:
        data = request.get_json(silent=True) or {}

        client_id = data.get("ClientID")
        product_id = data.get("ProductID")

        if not client_id or not product_id:
            return jsonify({
                "error": "ClientID и ProductID обязательны"
            }), 400

        with engine.begin() as connection:

            # Проверяем, есть ли товар уже в избранном
            existing = connection.execute(
                text("""
                    SELECT "FavoriteID"
                    FROM "Favorites"
                    WHERE "ClientID" = :client_id
                      AND "ProductID" = :product_id
                """),
                {
                    "client_id": client_id,
                    "product_id": product_id
                }
            ).first()

            if existing:
                return jsonify({
                    "message": "Товар уже находится в избранном"
                }), 200

            connection.execute(
                text("""
                    INSERT INTO "Favorites"
                        ("ClientID", "ProductID", "AddedDate")
                    VALUES
                        (:client_id, :product_id, CURRENT_DATE)
                """),
                {
                    "client_id": client_id,
                    "product_id": product_id
                }
            )

        return jsonify({
            "message": "Товар добавлен в избранное"
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Удаление товара из избранного
@favorites_bp.route(
    "/api/favorites/<int:client_id>/<int:product_id>",
    methods=["DELETE"]
)
def remove_favorite(client_id, product_id):
    try:
        with engine.begin() as connection:
            result = connection.execute(
                text("""
                    DELETE FROM "Favorites"
                    WHERE "ClientID" = :client_id
                      AND "ProductID" = :product_id
                """),
                {
                    "client_id": client_id,
                    "product_id": product_id
                }
            )

            if result.rowcount == 0:
                return jsonify({
                    "error": "Товар не найден в избранном"
                }), 404

        return jsonify({
            "message": "Товар удалён из избранного"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500