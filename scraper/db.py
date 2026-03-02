import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_conn():
    return psycopg2.connect(
        dbname=os.environ["POSTGRES_DB"],
        user=os.environ["POSTGRES_USER"],
        password=os.environ["POSTGRES_PASSWORD"],
        host=os.environ["POSTGRES_HOST"],
        port=os.environ["POSTGRES_PORT"],
    )

def fetch_all_cards():
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, name, ebay_search_query FROM cards WHERE ebay_search_query IS NOT NULL")
            return cur.fetchall()

def insert_price(card_id, price, volume, condition):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO price_history (card_id, price, volume, condition) VALUES (%s, %s, %s, %s)",
                (card_id, price, volume, condition)
            )
        conn.commit()
