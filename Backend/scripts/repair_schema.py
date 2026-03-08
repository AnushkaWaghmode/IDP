import argparse
import os
import sys
from pathlib import Path

from alembic import command
from alembic.config import Config
from dotenv import load_dotenv
from sqlalchemy import inspect

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from database import Base, engine


def repair_schema(stamp_head: bool) -> None:
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    expected_tables = set(Base.metadata.tables.keys())

    missing_tables = sorted(expected_tables - existing_tables)

    if missing_tables:
        print(f"[repair] Missing tables detected: {', '.join(missing_tables)}")
        Base.metadata.create_all(bind=engine, tables=[Base.metadata.tables[name] for name in missing_tables])
        print("[repair] Missing tables created.")
    else:
        print("[repair] No missing tables found.")

    if stamp_head:
        cfg = Config("alembic.ini")
        if os.getenv("DATABASE_URL"):
            cfg.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL"))
        command.stamp(cfg, "head")
        print("[repair] Alembic stamped to head.")
    else:
        print("[repair] Skipped alembic stamp.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Repair schema by creating only missing tables and optionally stamping Alembic head.")
    parser.add_argument("--no-stamp", action="store_true", help="Do not stamp Alembic head after repair")
    args = parser.parse_args()

    load_dotenv()
    repair_schema(stamp_head=not args.no_stamp)


if __name__ == "__main__":
    main()
