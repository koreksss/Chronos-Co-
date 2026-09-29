from flask import Blueprint, jsonify
from sqlalchemy import text
from config.database import engine

brands_bp = Blueprint("brands", __name__)


@brands_bp.route("/api/brands", methods=["GET"])
def get_brands():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT BrandID, BrandName, Country, Description
                    FROM Brands
                """)
            )

            brands = []

            for row in result:
                brands.append({
                    "BrandID": row.BrandID,
                    "BrandName": row.BrandName,
                    "Country": row.Country,
                    "Description": row.Description
                })

            return jsonify(brands)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500