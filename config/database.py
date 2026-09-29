from sqlalchemy import create_engine, text

SERVER = r"HUWI\SQLEXPRESS"
DATABASE = "ChronosCo"

connection_string = (
    f"mssql+pyodbc://@{SERVER}/{DATABASE}"
    "?driver=ODBC+Driver+17+for+SQL+Server"
    "&trusted_connection=yes"
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