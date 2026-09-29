from flask import Blueprint, jsonify, request
from sqlalchemy import text
from config.database import engine

favorites_bp = Blueprint("favorites", __name__)


@favorites_bp.route("/api/favorites/<int:client_id>", methods=["GET"])
def get_favorites(client_id):
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT
                        f.FavoriteID,
                        f.ClientID,
                        f.ProductID,
                        f.AddedDate,
                        p.ModelName,
                        p.Price,
                        p.Image,
                        b.BrandName
                    FROM Favorites f
                    INNER JOIN Products p
                        ON f.ProductID = p.ProductID
                    INNER JOIN Brands b
                        ON p.BrandID = b.BrandID
                    WHERE f.ClientID = :client_id
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
        return jsonify({
            "error": str(e)
        }), 500


@favorites_bp.route("/api/favorites", methods=["POST"])
def add_favorite():
    try:
        data = request.get_json()

        client_id = data.get("ClientID")
        product_id = data.get("ProductID")

        if not client_id or not product_id:
            return jsonify({
                "error": "ClientID и ProductID обязательны"
            }), 400

        with engine.begin() as connection:
            connection.execute(
                text("""
                    INSERT INTO Favorites
                        (ClientID, ProductID, AddedDate)
                    VALUES
                        (:client_id, :product_id, GETDATE())
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
        return jsonify({
            "error": str(e)
        }), 500