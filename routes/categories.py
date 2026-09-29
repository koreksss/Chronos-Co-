from flask import Blueprint, jsonify
from sqlalchemy import text
from config.database import engine

categories_bp = Blueprint("categories", __name__)


@categories_bp.route("/api/categories", methods=["GET"])
def get_categories():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT CategoryID, CategoryName
                    FROM Categories
                """)
            )

            categories = []

            for row in result:
                categories.append({
                    "CategoryID": row.CategoryID,
                    "CategoryName": row.CategoryName
                })

            return jsonify(categories)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500