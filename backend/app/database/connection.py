"""PostgreSQL connections and additive history schema initialization."""
import os
import psycopg

def get_db_connection():
    required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
    missing = [key for key in required if not os.getenv(key)]
    if missing:
        raise RuntimeError(f'Missing database configuration: {', '.join(missing)}')
    return psycopg.connect(host=os.getenv('DB_HOST'), port=int(os.getenv('DB_PORT')), dbname=os.getenv('DB_NAME'), user=os.getenv('DB_USER'), password=os.getenv('DB_PASSWORD'), connect_timeout=5, options='-c statement_timeout=10000')

def ensure_prediction_history_table():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('\n                    CREATE TABLE IF NOT EXISTS prediction_history (\n                        id SERIAL PRIMARY KEY,\n                        prediction TEXT NOT NULL,\n                        prediction_id INTEGER NOT NULL,\n                        is_benign BOOLEAN NOT NULL,\n                        confidence_percent DOUBLE PRECISION,\n                        features_received INTEGER NOT NULL,\n                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n                    )\n                    ')
                cur.execute("ALTER TABLE prediction_history ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'legacy_unknown'")
                conn.commit()
    except (psycopg.Error, RuntimeError, ValueError, OSError):
        return False
    return True
