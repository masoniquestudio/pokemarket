from db import get_conn
from psycopg2.extras import RealDictCursor

INDICES = [
    {"slug": "pmi", "name": "PokéMarket Index", "filter": {}},
    {"slug": "fire", "name": "Fire Type Index", "filter": {"type": "Fire"}},
    {"slug": "water", "name": "Water Type Index", "filter": {"type": "Water"}},
    {"slug": "grass", "name": "Grass Type Index", "filter": {"type": "Grass"}},
    {"slug": "electric", "name": "Electric Type Index", "filter": {"type": "Electric"}},
    {"slug": "psychic", "name": "Psychic Type Index", "filter": {"type": "Psychic"}},
    {"slug": "fighting", "name": "Fighting Type Index", "filter": {"type": "Fighting"}},
    {"slug": "darkness", "name": "Darkness Type Index", "filter": {"type": "Darkness"}},
    {"slug": "metal", "name": "Metal Type Index", "filter": {"type": "Metal"}},
    {"slug": "dragon", "name": "Dragon Type Index", "filter": {"type": "Dragon"}},
    {"slug": "holo", "name": "Holo Index", "filter": {"is_holo": True}},
    {"slug": "vintage", "name": "Vintage Index", "filter": {"era": "vintage"}},
    {"slug": "modern", "name": "Modern Index", "filter": {"era": "modern"}},
    {"slug": "blue-chip-30", "name": "Blue Chip 30", "filter": {"slug": "blue-chip-30"}},
]

def compute_index(slug: str, filter_: dict) -> float | None:
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Build WHERE clause based on filter
            where_parts = ["ph.recorded_at > NOW() - INTERVAL '7 days'"]
            params = []

            if "type" in filter_:
                where_parts.append("%s = ANY(c.types)")
                params.append(filter_["type"])
            if "is_holo" in filter_:
                where_parts.append("c.is_holo = %s")
                params.append(filter_["is_holo"])
            if "era" in filter_:
                where_parts.append("c.era = %s")
                params.append(filter_["era"])
            if "slug" in filter_:
                where_parts.append(
                    "c.id IN (SELECT card_id FROM index_members WHERE index_slug = %s)"
                )
                params.append(filter_["slug"])

            where_sql = " AND ".join(where_parts)

            cur.execute(f"""
                SELECT AVG(ph.price) as avg_price
                FROM price_history ph
                JOIN cards c ON c.id = ph.card_id
                WHERE {where_sql}
            """, params)

            row = cur.fetchone()
            return float(row["avg_price"]) if row and row["avg_price"] else None

def get_previous_index_value(slug: str) -> float | None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT value FROM indices
                WHERE slug = %s
                ORDER BY recorded_at DESC
                LIMIT 1
            """, (slug,))
            row = cur.fetchone()
            return float(row[0]) if row else None

def save_index(slug: str, name: str, value: float, change_pct: float | None):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO indices (slug, name, value, change_pct)
                VALUES (%s, %s, %s, %s)
            """, (slug, name, value, change_pct))
        conn.commit()

def recompute_all_indices():
    print("Recomputing indices...")
    for idx in INDICES:
        value = compute_index(idx["slug"], idx["filter"])
        if value is None:
            print(f"  [{idx['slug']}] No data, skipping")
            continue
        prev = get_previous_index_value(idx["slug"])
        change_pct = ((value - prev) / prev * 100) if prev else None
        save_index(idx["slug"], idx["name"], value, change_pct)
        print(f"  [{idx['slug']}] {value:.2f} ({change_pct:+.2f}%)" if change_pct else f"  [{idx['slug']}] {value:.2f}")
