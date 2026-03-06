import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
ENV          = os.getenv("ENV", "local")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set. Please check your .env file.")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

try:
    if ENV == "production":
        engine = create_engine(
            DATABASE_URL,
            connect_args={"sslmode": "require"},
            pool_pre_ping=True,
            pool_recycle=300
        )
    else:
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=300
        )

    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
        print(f"[INFO] Database connection established successfully. Running in [{ENV}] mode.")

except Exception as e:
    raise RuntimeError(
        f"[ERROR] Failed to connect to the database in [{ENV}] mode.\n"
        f"Reason: {str(e)}\n"
        f"Please verify your DATABASE_URL and database server status."
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base         = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        raise RuntimeError(
            f"[ERROR] A database session error occurred.\n"
            f"Reason: {str(e)}"
        )
    finally:
        db.close()