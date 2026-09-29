from flask import Blueprint, jsonify, request
from sqlalchemy import text
from config.database import engine

clients_bp = Blueprint("clients", __name__)


@clients_bp.route("/api/clients", methods=["GET"])
def get_clients():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT
                        ClientID,
                        FirstName,
                        LastName,
                        Phone,
                        Email
                    FROM Clients
                """)
            )

            clients = []

            for row in result:
                clients.append({
                    "ClientID": row.ClientID,
                    "FirstName": row.FirstName,
                    "LastName": row.LastName,
                    "Phone": row.Phone,
                    "Email": row.Email
                })

            return jsonify(clients)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@clients_bp.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        email = data.get("Email")
        phone = data.get("Phone")

        if not email or not phone:
            return jsonify({
                "error": "Email и Phone обязательны"
            }), 400

        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT
                        ClientID,
                        FirstName,
                        LastName,
                        Phone,
                        Email
                    FROM Clients
                    WHERE Email = :email
                      AND Phone = :phone
                """),
                {
                    "email": email,
                    "phone": phone
                }
            )

            row = result.fetchone()

            if row is None:
                return jsonify({
                    "error": "Неверный Email или номер телефона"
                }), 401

            return jsonify({
                "message": "Вход выполнен успешно",
                "client": {
                    "ClientID": row.ClientID,
                    "FirstName": row.FirstName,
                    "LastName": row.LastName,
                    "Phone": row.Phone,
                    "Email": row.Email
                }
            })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500