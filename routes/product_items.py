from flask import Blueprint, jsonify
from sqlalchemy import text
from config.database import engine

product_items_bp = Blueprint("product_items", __name__)


@product_items_bp.route("/api/product-items", methods=["GET"])
def get_product_items():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT
                        pi.ItemID,
                        pi.ProductID,
                        p.ModelName,
                        b.BrandName,
                        pi.SerialNumber,
                        pi.Status,
                        pi.Location,
                        pi.Condition
                    FROM ProductItems pi
                    INNER JOIN Products p
                        ON pi.ProductID = p.ProductID
                    INNER JOIN Brands b
                        ON p.BrandID = b.BrandID
                """)
            )

            items = []

            for row in result:
                items.append({
                    "ItemID": row.ItemID,
                    "ProductID": row.ProductID,
                    "ModelName": row.ModelName,
                    "BrandName": row.BrandName,
                    "SerialNumber": row.SerialNumber,
                    "Status": row.Status,
                    "Location": row.Location,
                    "Condition": row.Condition
                })

            return jsonify(items)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500