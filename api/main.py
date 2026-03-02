from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extras import RealDictCursor
from db import get_conn

app = FastAPI(title="PokéMarket API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

@app.get("/cards")
def list_cards(
    type: str = None,
    era: str = None,
    is_holo: bool = None,
    set_code: str = None,
    min_price: float = None,
    max_price: float = None,
    sort: str = "name",
    limit: int = Query(50, le=200),
):
    where = ["1=1"]
    params = []

    if type:
        where.append("%s = ANY(types)")
        params.append(type)
    if era:
        where.append("era = %s")
        params.append(era)
    if is_holo is not None:
        where.append("is_holo = %s")
        params.append(is_holo)
    if set_code:
        where.append("set_code = %s")
        params.append(set_code)

    where_sql = " AND ".join(where)
    order_sql = "name ASC" if sort == "name" else "name ASC"

    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(f"""
                SELECT c.*,
                  (SELECT ph.price FROM price_history ph
                   WHERE ph.card_id = c.id
                   ORDER BY ph.recorded_at DESC LIMIT 1) as current_price,
                  (SELECT ph.price FROM price_history ph
                   WHERE ph.card_id = c.id
                     AND ph.recorded_at < NOW() - INTERVAL '30 days'
                   ORDER BY ph.recorded_at DESC LIMIT 1) as price_30d_ago
                FROM cards c
                WHERE {where_sql}
                ORDER BY {order_sql}
                LIMIT %s
            """, params + [limit])
            rows = cur.fetchall()

    return {"cards": [dict(r) for r in rows]}


@app.get("/cards/{card_id}")
def get_card(card_id: str):
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM cards WHERE id = %s", (card_id,))
            card = cur.fetchone()
            if not card:
                raise HTTPException(status_code=404, detail="Card not found")

            cur.execute("""
                SELECT price, volume, condition, recorded_at
                FROM price_history
                WHERE card_id = %s
                ORDER BY recorded_at ASC
            """, (card_id,))
            history = cur.fetchall()

    return {"card": dict(card), "history": [dict(h) for h in history]}


@app.get("/indices")
def list_indices():
    """Returns latest value for every index."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT DISTINCT ON (slug) slug, name, value, change_pct, recorded_at
                FROM indices
                ORDER BY slug, recorded_at DESC
            """)
            rows = cur.fetchall()
    return {"indices": [dict(r) for r in rows]}


@app.get("/indices/{slug}")
def get_index(slug: str, days: int = 30):
    """Returns index history for charting."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT slug, name, value, change_pct, recorded_at
                FROM indices
                WHERE slug = %s
                  AND recorded_at > NOW() - INTERVAL '1 day' * %s
                ORDER BY recorded_at ASC
            """, (slug, days))
            rows = cur.fetchall()

    if not rows:
        raise HTTPException(status_code=404, detail="Index not found")

    return {"index": {"slug": slug}, "history": [dict(r) for r in rows]}


@app.get("/market/movers")
def market_movers():
    """Top gainers, top losers, most active by volume."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT c.id, c.name, c.set_name, c.image_url,
                  latest.price as current_price,
                  past.price as price_7d_ago,
                  CASE WHEN past.price > 0
                    THEN ROUND((latest.price - past.price) / past.price * 100, 2)
                    ELSE NULL END as change_pct_7d,
                  vol.volume as volume_7d
                FROM cards c
                JOIN LATERAL (
                  SELECT price FROM price_history
                  WHERE card_id = c.id
                  ORDER BY recorded_at DESC LIMIT 1
                ) latest ON true
                LEFT JOIN LATERAL (
                  SELECT price FROM price_history
                  WHERE card_id = c.id
                    AND recorded_at < NOW() - INTERVAL '7 days'
                  ORDER BY recorded_at DESC LIMIT 1
                ) past ON true
                LEFT JOIN LATERAL (
                  SELECT SUM(volume) as volume FROM price_history
                  WHERE card_id = c.id
                    AND recorded_at > NOW() - INTERVAL '7 days'
                ) vol ON true
                WHERE latest.price IS NOT NULL
            """)
            cards = cur.fetchall()

    cards_list = [dict(c) for c in cards]
    sorted_gain = sorted([c for c in cards_list if c["change_pct_7d"]], key=lambda x: x["change_pct_7d"], reverse=True)
    sorted_loss = sorted([c for c in cards_list if c["change_pct_7d"]], key=lambda x: x["change_pct_7d"])
    sorted_vol = sorted([c for c in cards_list if c["volume_7d"]], key=lambda x: x["volume_7d"], reverse=True)

    return {
        "gainers": sorted_gain[:10],
        "losers": sorted_loss[:10],
        "most_active": sorted_vol[:10],
    }
