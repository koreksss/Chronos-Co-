import os
from urllib.parse import quote_plus

from sqlalchemy import create_engine, text


SERVER = os.getenv("DB_SERVER", "localhost,1433")
DATABASE = os.getenv("DB_DATABASE", "ChronosCo")
USERNAME = os.getenv("DB_USERNAME", "chronosco_app")
PASSWORD = os.getenv("DB_PASSWORD", "")

connection_string = (
    f"mssql+pyodbc://{quote_plus(USERNAME)}:{quote_plus(PASSWORD)}"
    f"@{SERVER}/{DATABASE}"
    "?driver=ODBC+Driver+17+for+SQL+Server"
    "&TrustServerCertificate=yes"
)

engine = create_engine(connection_string)


def test_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT DB_NAME()"))
            print("Подключение успешно!")
            print("База данных:", result.scalar())
    except Exception as e:
        print("Ошибка подключения:")
        print(e)