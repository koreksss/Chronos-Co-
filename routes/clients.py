from flask import Blueprint, jsonify, request
from sqlalchemy import text
from werkzeug.security import generate_password_hash, check_password_hash
from config.database import engine

clients_bp = Blueprint("clients", __name__)


@clients_bp.route("/api/clients", methods=["GET"])
def get_clients():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT
                        "ClientID",
                        "FirstName",
                        "LastName",
                        "Phone",
                        "Email"
                    FROM "Clients"
                """)
            )

            clients = [
                {
                    "ClientID": row.ClientID,
                    "FirstName": row.FirstName,
                    "LastName": row.LastName,
                    "Phone": row.Phone,
                    "Email": row.Email
                }
                for row in result
            ]

            return jsonify(clients)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@clients_bp.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json() or {}

        first_name = data.get("FirstName", "").strip()
        last_name = data.get("LastName", "").strip()
        phone = data.get("Phone", "").strip()
        email = data.get("Email", "").strip().lower()
        password = data.get("Password", "")

        if not all([first_name, last_name, phone, email, password]):
            return jsonify({
                "error": "Заполните все поля"
            }), 400

        if len(password) < 8:
            return jsonify({
                "error": "Пароль должен содержать не менее 8 символов"
            }), 400

        password_hash = generate_password_hash(password)

        with engine.begin() as connection:
            existing = connection.execute(
                text("""
                    SELECT "ClientID"
                    FROM "Clients"
                    WHERE "Email" = :email OR "Phone" = :phone
                """),
                {
                    "email": email,
                    "phone": phone
                }
            ).first()

            if existing:
                return jsonify({
                    "error": "Пользователь с таким Email или телефоном уже существует"
                }), 409

            result = connection.execute(
                text("""
                    INSERT INTO "Clients"
                        ("FirstName", "LastName", "Phone", "Email", "PasswordHash")
                    VALUES
                        (:first_name, :last_name, :phone, :email, :password_hash)
                    RETURNING "ClientID", "FirstName", "LastName", "Phone", "Email"
                """),
                {
                    "first_name": first_name,
                    "last_name": last_name,
                    "phone": phone,
                    "email": email,
                    "password_hash": password_hash
                }
            )

            client = result.fetchone()

            return jsonify({
                "message": "Регистрация прошла успешно",
                "client": {
                    "ClientID": client.ClientID,
                    "FirstName": client.FirstName,
                    "LastName": client.LastName,
                    "Phone": client.Phone,
                    "Email": client.Email
                }
            }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@clients_bp.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json() or {}

        email = data.get("Email", "").strip().lower()
        password = data.get("Password", "")

        if not email or not password:
            return jsonify({
                "error": "Введите Email и пароль"
            }), 400

        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT
                        "ClientID",
                        "FirstName",
                        "LastName",
                        "Phone",
                        "Email",
                        "PasswordHash"
                    FROM "Clients"
                    WHERE "Email" = :email
                """),
                {"email": email}
            )

            client = result.fetchone()

            if (
                client is None
                or not client.PasswordHash
                or not check_password_hash(client.PasswordHash, password)
            ):
                return jsonify({
                    "error": "Неверный Email или пароль"
                }), 401

            return jsonify({
                "message": "Вход выполнен успешно",
                "client": {
                    "ClientID": client.ClientID,
                    "FirstName": client.FirstName,
                    "LastName": client.LastName,
                    "Phone": client.Phone,
                    "Email": client.Email
                }
            })

    except Exception as e:
        return jsonify({"error": str(e)}), 500