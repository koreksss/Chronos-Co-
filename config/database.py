
import os

from sqlalchemy import create_engine, text


DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1
    )

if DATABASE_URL:
    print("Схема подключения:", DATABASE_URL.split(":", 1)[0])

if not DATABASE_URL:
    raise RuntimeError(
        "Не задана переменная окружения DATABASE_URL. "
        "Укажи строку подключения Supabase в настройках Docker."
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)


def test_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("SELECT current_database()")
            )
            print("Подключение к Supabase успешно!")
            print("База данных:", result.scalar())
    except Exception as e:
        print("Ошибка подключения к Supabase:")
        print(e)
        raise