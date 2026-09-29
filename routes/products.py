from flask import Blueprint, jsonify
from sqlalchemy import text
from config.database import engine

products_bp = Blueprint("products", __name__)


@products_bp.route("/api/products", methods=["GET"])
def get_products():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT
                        p.ProductID,
                        p.ModelName,
                        p.Article,
                        p.Price,
                        p.Description,
                        p.Image,
                        p.Specifications,
                        b.BrandName,
                        c.CategoryName
                    FROM Products p
                    INNER JOIN Brands b
                        ON p.BrandID = b.BrandID
                    INNER JOIN Categories c
                        ON p.CategoryID = c.CategoryID
                """)
            )

            products = []

            for row in result:
                products.append({
                    "ProductID": row.ProductID,
                    "ModelName": row.ModelName,
                    "Article": row.Article,
                    "Price": float(row.Price),
                    "Description": row.Description,
                    "Image": row.Image,
                    "Specifications": row.Specifications,
                    "BrandName": row.BrandName,
                    "CategoryName": row.CategoryName
                })

            return jsonify(products)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500