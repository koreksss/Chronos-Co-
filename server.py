from flask import Flask
from flask_cors import CORS
from config.database import test_connection
from routes.brands import brands_bp
from routes.products import products_bp
from routes.categories import categories_bp
from routes.product_items import product_items_bp
from routes.favorites import favorites_bp
from routes.cart import cart_bp
from routes.clients import clients_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(brands_bp)
app.register_blueprint(products_bp)
app.register_blueprint(categories_bp)
app.register_blueprint(product_items_bp)
app.register_blueprint(favorites_bp)
app.register_blueprint(cart_bp)
app.register_blueprint(clients_bp)


@app.route("/")
def home():
    return "Chronos & Co Backend is running!"


test_connection()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)