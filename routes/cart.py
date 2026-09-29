from flask import Blueprint, jsonify, request
from sqlalchemy import text
from config.database import engine

cart_bp = Blueprint("cart", __name__)


@cart_bp.route("/api/cart/<int:client_id>", methods=["GET"])
def get_cart(client_id):
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT
                        c.CartID,
                        c.ClientID,
                        c.ItemID,
                        c.AddedDate,
                        p.ProductID,
                        p.ModelName,
                        p.Price,
                        p.Image,
                        b.BrandName
                    FROM Cart c
                    INNER JOIN ProductItems pi
                        ON c.ItemID = pi.ItemID
                    INNER JOIN Products p
                        ON pi.ProductID = p.ProductID
                    INNER JOIN Brands b
                        ON p.BrandID = b.BrandID
                    WHERE c.ClientID = :client_id
                """),
                {"client_id": client_id}
            )

            cart = []

            for row in result:
                cart.append({
                    "CartID": row.CartID,
                    "ClientID": row.ClientID,
                    "ItemID": row.ItemID,
                    "AddedDate": str(row.AddedDate),
                    "ProductID": row.ProductID,
                    "ModelName": row.ModelName,
                    "Price": float(row.Price),
                    "Image": row.Image,
                    "BrandName": row.BrandName
                })

            return jsonify(cart)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@cart_bp.route("/api/cart", methods=["POST"])
def add_to_cart():
    try:
        data = request.get_json()

        client_id = data.get("ClientID")
        item_id = data.get("ItemID")

        if not client_id or not item_id:
            return jsonify({
                "error": "ClientID и ItemID обязательны"
            }), 400

        with engine.begin() as connection:
            connection.execute(
                text("""
                    INSERT INTO Cart
                        (ClientID, ItemID, AddedDate)
                    VALUES
                        (:client_id, :item_id, GETDATE())
                """),
                {
                    "client_id": client_id,
                    "item_id": item_id
                }
            )

        return jsonify({
            "message": "Товар добавлен в корзину"
        }), 201

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500