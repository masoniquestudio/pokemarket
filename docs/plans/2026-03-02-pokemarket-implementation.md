# PokéMarket Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a public Pokemon TCG price tracking website that displays eBay sold listing data in a stock market style, including multiple market indices, card detail pages, a screener, and dark/light mode.

**Architecture:** Python scraper pulls eBay sold listings every 6 hours and stores price history in PostgreSQL. FastAPI serves a REST API consumed by a Next.js frontend. All four services run locally via Docker Compose.

**Tech Stack:** Python 3.11, Playwright, APScheduler, FastAPI, PostgreSQL 15, Next.js 14, Tailwind CSS, Recharts, Docker Compose

---

## Phase 1: Project Scaffold & Docker Setup

### Task 1: Initialize project structure

**Files:**
- Create: `docker-compose.yml`
- Create: `scraper/Dockerfile`
- Create: `api/Dockerfile`
- Create: `web/Dockerfile`
- Create: `db/init.sql`
- Create: `.env.example`

**Step 1: Create root folder structure**

```bash
mkdir -p scraper api web db
```

**Step 2: Create `.env.example`**

```env
POSTGRES_DB=pokemarket
POSTGRES_USER=pokemarket
POSTGRES_PASSWORD=changeme
POSTGRES_HOST=db
POSTGRES_PORT=5432
EBAY_APP_ID=your_ebay_app_id_here
```

**Step 3: Create `docker-compose.yml`**

```yaml
version: "3.9"

services:
  db:
    image: postgres:15-alpine
    env_file: .env
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  api:
    build: ./api
    env_file: .env
    depends_on:
      - db
    ports:
      - "8000:8000"

  scraper:
    build: ./scraper
    env_file: .env
    depends_on:
      - db

  web:
    build: ./web
    depends_on:
      - api
    ports:
      - "3000:3000"

volumes:
  pgdata:
```

**Step 4: Commit**

```bash
git init
git add .
git commit -m "feat: initial project scaffold"
```

---

## Phase 2: Database Schema

### Task 2: Write PostgreSQL schema

**Files:**
- Modify: `db/init.sql`

**Step 1: Write schema**

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  set_name TEXT NOT NULL,
  set_code TEXT NOT NULL,
  number TEXT,
  rarity TEXT,
  types TEXT[] DEFAULT '{}',
  is_holo BOOLEAN DEFAULT false,
  era TEXT CHECK (era IN ('vintage', 'modern')),
  image_url TEXT,
  ebay_search_query TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  price NUMERIC(10, 2) NOT NULL,
  volume INTEGER NOT NULL DEFAULT 1,
  condition TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_card_id ON price_history(card_id);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at);

CREATE TABLE indices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  value NUMERIC(12, 4),
  change_pct NUMERIC(8, 4),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_indices_slug ON indices(slug);
CREATE INDEX idx_indices_recorded_at ON indices(recorded_at);

CREATE TABLE index_members (
  index_slug TEXT NOT NULL,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  weight NUMERIC(8, 6) DEFAULT 0,
  PRIMARY KEY (index_slug, card_id)
);

-- Seed a small set of cards for development
INSERT INTO cards (name, set_name, set_code, number, rarity, types, is_holo, era, image_url, ebay_search_query) VALUES
('Charizard', 'Base Set', 'base1', '4/102', 'Holo Rare', ARRAY['Fire'], true, 'vintage', 'https://images.pokemontcg.io/base1/4_hires.png', 'Charizard Base Set Holo 4/102'),
('Blastoise', 'Base Set', 'base1', '2/102', 'Holo Rare', ARRAY['Water'], true, 'vintage', 'https://images.pokemontcg.io/base1/2_hires.png', 'Blastoise Base Set Holo 2/102'),
('Venusaur', 'Base Set', 'base1', '15/102', 'Holo Rare', ARRAY['Grass'], true, 'vintage', 'https://images.pokemontcg.io/base1/15_hires.png', 'Venusaur Base Set Holo 15/102'),
('Pikachu', 'Base Set', 'base1', '58/102', 'Common', ARRAY['Electric'], false, 'vintage', 'https://images.pokemontcg.io/base1/58_hires.png', 'Pikachu Base Set 58/102'),
('Mewtwo', 'Base Set', 'base1', '10/102', 'Holo Rare', ARRAY['Psychic'], true, 'vintage', 'https://images.pokemontcg.io/base1/10_hires.png', 'Mewtwo Base Set Holo 10/102');
```

**Step 2: Verify schema loads**

```bash
docker compose up db -d
docker compose exec db psql -U pokemarket -d pokemarket -c "\dt"
```
Expected: tables `cards`, `price_history`, `indices`, `index_members` listed.

**Step 3: Commit**

```bash
git add db/init.sql
git commit -m "feat: add postgres schema with seed cards"
```

---

## Phase 3: Python Scraper

### Task 3: Scraper project setup

**Files:**
- Create: `scraper/requirements.txt`
- Create: `scraper/Dockerfile`
- Create: `scraper/main.py`
- Create: `scraper/db.py`

**Step 1: Create `scraper/requirements.txt`**

```
playwright==1.42.0
psycopg2-binary==2.9.9
apscheduler==3.10.4
requests==2.31.0
python-dotenv==1.0.1
```

**Step 2: Create `scraper/Dockerfile`**

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN playwright install chromium --with-deps

COPY . .
CMD ["python", "main.py"]
```

**Step 3: Create `scraper/db.py`**

```python
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
```

**Step 4: Commit**

```bash
git add scraper/
git commit -m "feat: scraper project setup and db helpers"
```

---

### Task 4: eBay sold listings scraper

**Files:**
- Create: `scraper/ebay.py`

**Step 1: Create `scraper/ebay.py`**

This uses eBay's Finding API (free, register at developer.ebay.com for an App ID).

```python
import os
import re
import requests

EBAY_API_URL = "https://svcs.ebay.com/services/search/FindingService/v1"

def parse_condition(title: str) -> str:
    title_lower = title.lower()
    if "psa 10" in title_lower:
        return "PSA 10"
    if "psa 9" in title_lower:
        return "PSA 9"
    if "psa 8" in title_lower:
        return "PSA 8"
    if "bgs" in title_lower or "beckett" in title_lower:
        return "BGS"
    if "cgc" in title_lower:
        return "CGC"
    return "Raw"

def fetch_sold_listings(query: str, max_results: int = 50) -> list[dict]:
    """
    Calls eBay Finding API for completed (sold) listings.
    Returns list of {price, title, condition, end_time}.
    """
    params = {
        "OPERATION-NAME": "findCompletedItems",
        "SERVICE-VERSION": "1.0.0",
        "SECURITY-APPNAME": os.environ["EBAY_APP_ID"],
        "RESPONSE-DATA-FORMAT": "JSON",
        "keywords": query,
        "itemFilter(0).name": "SoldItemsOnly",
        "itemFilter(0).value": "true",
        "paginationInput.entriesPerPage": str(max_results),
        "sortOrder": "EndTimeSoonest",
    }

    resp = requests.get(EBAY_API_URL, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    try:
        items = data["findCompletedItemsResponse"][0]["searchResult"][0].get("item", [])
    except (KeyError, IndexError):
        return []

    results = []
    for item in items:
        try:
            price = float(item["sellingStatus"][0]["currentPrice"][0]["__value__"])
            title = item["title"][0]
            results.append({
                "price": price,
                "title": title,
                "condition": parse_condition(title),
            })
        except (KeyError, IndexError, ValueError):
            continue

    return results

def median_price(prices: list[float]) -> float:
    if not prices:
        return 0.0
    s = sorted(prices)
    mid = len(s) // 2
    return (s[mid - 1] + s[mid]) / 2 if len(s) % 2 == 0 else s[mid]

def filter_outliers(listings: list[dict]) -> list[dict]:
    """Remove sales > 3x or < 0.3x the median price."""
    prices = [l["price"] for l in listings]
    if not prices:
        return listings
    med = median_price(prices)
    return [l for l in listings if 0.3 * med <= l["price"] <= 3 * med]
```

**Step 2: Commit**

```bash
git add scraper/ebay.py
git commit -m "feat: ebay finding api scraper with outlier filter"
```

---

### Task 5: Index computation

**Files:**
- Create: `scraper/indices.py`

**Step 1: Create `scraper/indices.py`**

```python
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
```

**Step 2: Commit**

```bash
git add scraper/indices.py
git commit -m "feat: index computation for all market indices"
```

---

### Task 6: Main scraper loop with APScheduler

**Files:**
- Modify: `scraper/main.py`

**Step 1: Write `scraper/main.py`**

```python
import time
from apscheduler.schedulers.blocking import BlockingScheduler
from db import fetch_all_cards, insert_price
from ebay import fetch_sold_listings, filter_outliers
from indices import recompute_all_indices

def scrape_all_cards():
    print("Starting scrape run...")
    cards = fetch_all_cards()
    print(f"  Scraping {len(cards)} cards")

    for card in cards:
        try:
            listings = fetch_sold_listings(card["ebay_search_query"])
            listings = filter_outliers(listings)

            if not listings:
                print(f"  [{card['name']}] No valid listings found")
                continue

            prices = [l["price"] for l in listings]
            avg_price = sum(prices) / len(prices)
            condition = listings[0]["condition"] if listings else "Raw"

            insert_price(
                card_id=card["id"],
                price=round(avg_price, 2),
                volume=len(listings),
                condition=condition,
            )
            print(f"  [{card['name']}] ${avg_price:.2f} ({len(listings)} sales)")

        except Exception as e:
            print(f"  [{card['name']}] ERROR: {e}")

    recompute_all_indices()
    print("Scrape run complete.")

if __name__ == "__main__":
    # Run once immediately on startup
    scrape_all_cards()

    scheduler = BlockingScheduler()
    scheduler.add_job(scrape_all_cards, "interval", hours=6)
    print("Scheduler started — scraping every 6 hours")
    scheduler.start()
```

**Step 2: Commit**

```bash
git add scraper/main.py
git commit -m "feat: main scraper loop with apscheduler every 6 hours"
```

---

## Phase 4: FastAPI Backend

### Task 7: FastAPI project setup

**Files:**
- Create: `api/requirements.txt`
- Create: `api/Dockerfile`
- Create: `api/main.py`
- Create: `api/db.py`

**Step 1: Create `api/requirements.txt`**

```
fastapi==0.110.0
uvicorn[standard]==0.29.0
psycopg2-binary==2.9.9
python-dotenv==1.0.1
```

**Step 2: Create `api/Dockerfile`**

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Step 3: Create `api/db.py`** (same pattern as scraper)

```python
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
```

**Step 4: Commit**

```bash
git add api/
git commit -m "feat: fastapi project setup"
```

---

### Task 8: API routes — cards

**Files:**
- Modify: `api/main.py`

**Step 1: Write card routes**

```python
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
```

**Step 2: Test the endpoint**

```bash
docker compose up db api -d
curl http://localhost:8000/cards | jq '.cards | length'
```
Expected: `5` (the 5 seeded cards)

**Step 3: Commit**

```bash
git add api/main.py
git commit -m "feat: api card list and detail endpoints"
```

---

### Task 9: API routes — indices

**Files:**
- Modify: `api/main.py`

**Step 1: Add index routes**

```python
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
                  AND recorded_at > NOW() - INTERVAL '%s days'
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
```

**Step 2: Test**

```bash
curl http://localhost:8000/indices | jq
```

**Step 3: Commit**

```bash
git add api/main.py
git commit -m "feat: api index and market movers endpoints"
```

---

## Phase 5: Next.js Frontend

### Task 10: Next.js project scaffold

**Files:**
- Create: `web/` (Next.js app)

**Step 1: Scaffold Next.js app**

```bash
cd web
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Step 2: Install chart library**

```bash
npm install recharts
```

**Step 3: Create `web/Dockerfile`**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
CMD ["node", "server.js"]
```

**Step 4: Create `web/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Step 5: Commit**

```bash
git add web/
git commit -m "feat: next.js scaffold with tailwind and recharts"
```

---

### Task 11: Theme system (dark/light mode)

**Files:**
- Create: `web/src/styles/themes.css`
- Modify: `web/src/app/globals.css`
- Create: `web/src/components/ThemeToggle.tsx`
- Create: `web/src/lib/theme.ts`

**Step 1: Create `web/src/styles/themes.css`**

```css
:root[data-theme="dark"] {
  --bg: #0d0d0d;
  --surface: #1a1a1a;
  --border: #2a2a2a;
  --text: #e0e0e0;
  --text-secondary: #888888;
  --up: #00c853;
  --down: #ff3d00;
  --accent: #f7d02c;
}

:root[data-theme="light"] {
  --bg: #f5f5f5;
  --surface: #ffffff;
  --border: #e0e0e0;
  --text: #111111;
  --text-secondary: #555555;
  --up: #00a846;
  --down: #d32f0f;
  --accent: #d4a800;
}
```

**Step 2: Update `web/src/app/globals.css`** — import the themes file and set base styles

```css
@import "./themes.css";
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: var(--bg);
  color: var(--text);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
```

**Step 3: Create `web/src/lib/theme.ts`**

```typescript
export function initTheme() {
  const saved = localStorage.getItem("theme") ?? "dark";
  document.documentElement.setAttribute("data-theme", saved);
  return saved;
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  return next;
}
```

**Step 4: Create `web/src/components/ThemeToggle.tsx`**

```tsx
"use client";
import { useState, useEffect } from "react";
import { initTheme, toggleTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(initTheme());
  }, []);

  const handleToggle = () => {
    const next = toggleTheme();
    setTheme(next);
  };

  return (
    <button
      onClick={handleToggle}
      style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
      className="px-3 py-1 text-sm rounded-sm hover:opacity-80 transition-opacity"
    >
      {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
```

**Step 5: Commit**

```bash
git add web/src/
git commit -m "feat: dark/light theme system with localStorage persistence"
```

---

### Task 12: Nav bar and layout

**Files:**
- Create: `web/src/components/Nav.tsx`
- Modify: `web/src/app/layout.tsx`

**Step 1: Create `web/src/components/Nav.tsx`**

```tsx
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  return (
    <nav
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
      className="px-6 py-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-8">
        <Link href="/" style={{ color: "var(--accent)" }} className="font-bold text-lg tracking-widest">
          POKÉMARKET
        </Link>
        <div className="flex gap-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          <Link href="/indices" className="hover:text-white transition-colors">Indices</Link>
          <Link href="/cards" className="hover:text-white transition-colors">Cards</Link>
          <Link href="/screener" className="hover:text-white transition-colors">Screener</Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <input
          placeholder="Search cards..."
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          className="px-3 py-1 text-sm rounded-sm w-48 focus:outline-none focus:border-yellow-400"
        />
        <ThemeToggle />
      </div>
    </nav>
  );
}
```

**Step 2: Update `web/src/app/layout.tsx`**

```tsx
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata = {
  title: "PokéMarket — Pokemon TCG Price Tracker",
  description: "Stock market-style price tracking for Pokemon trading cards",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <Nav />
        <main className="max-w-screen-xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
```

**Step 3: Commit**

```bash
git add web/src/components/Nav.tsx web/src/app/layout.tsx
git commit -m "feat: nav bar layout with theme toggle"
```

---

### Task 13: Homepage — PMI chart + sector indices

**Files:**
- Create: `web/src/app/page.tsx`
- Create: `web/src/components/IndexChart.tsx`
- Create: `web/src/components/SectorGrid.tsx`
- Create: `web/src/lib/api.ts`

**Step 1: Create `web/src/lib/api.ts`**

```typescript
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchIndices() {
  const res = await fetch(`${API}/indices`, { next: { revalidate: 300 } });
  return res.json();
}

export async function fetchIndexHistory(slug: string, days = 30) {
  const res = await fetch(`${API}/indices/${slug}?days=${days}`, { next: { revalidate: 300 } });
  return res.json();
}

export async function fetchMarketMovers() {
  const res = await fetch(`${API}/market/movers`, { next: { revalidate: 300 } });
  return res.json();
}

export async function fetchCards(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/cards?${qs}`, { next: { revalidate: 300 } });
  return res.json();
}

export async function fetchCard(id: string) {
  const res = await fetch(`${API}/cards/${id}`, { next: { revalidate: 300 } });
  return res.json();
}
```

**Step 2: Create `web/src/components/IndexChart.tsx`**

```tsx
"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
];

export default function IndexChart({ history, name }: { history: any[]; name: string }) {
  const [range, setRange] = useState(30);

  const filtered = history.filter(
    (h) => new Date(h.recorded_at) > new Date(Date.now() - range * 86400000)
  );

  const data = filtered.map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString(),
    value: parseFloat(h.value),
  }));

  const isUp = data.length >= 2 && data[data.length - 1].value >= data[0].value;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="p-4 rounded-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{name}</span>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setRange(r.days)}
              className="text-xs px-2 py-1 rounded-sm font-mono"
              style={{
                background: range === r.days ? "var(--accent)" : "var(--bg)",
                color: range === r.days ? "#000" : "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isUp ? "var(--up)" : "var(--down)"} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isUp ? "var(--up)" : "var(--down)"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={isUp ? "var(--up)" : "var(--down)"}
            fill="url(#colorValue)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 3: Create `web/src/components/SectorGrid.tsx`**

```tsx
const TYPE_EMOJI: Record<string, string> = {
  fire: "🔥", water: "💧", grass: "🌿", electric: "⚡",
  psychic: "🌀", fighting: "🥊", darkness: "🌑", metal: "⚙️",
  dragon: "🐉",
};

export default function SectorGrid({ indices }: { indices: any[] }) {
  const sectors = indices.filter((i) => TYPE_EMOJI[i.slug]);

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-6">
      {sectors.map((idx) => {
        const isUp = idx.change_pct >= 0;
        return (
          <a
            key={idx.slug}
            href={`/indices/${idx.slug}`}
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            className="p-3 rounded-sm hover:border-yellow-400 transition-colors"
          >
            <div className="text-lg">{TYPE_EMOJI[idx.slug]}</div>
            <div className="text-xs font-mono mt-1" style={{ color: "var(--text-secondary)" }}>
              {idx.name.replace(" Type Index", "")}
            </div>
            <div className="text-sm font-mono font-bold mt-1" style={{ color: "var(--text)" }}>
              {parseFloat(idx.value).toFixed(2)}
            </div>
            <div className="text-xs font-mono" style={{ color: isUp ? "var(--up)" : "var(--down)" }}>
              {isUp ? "▲" : "▼"} {Math.abs(idx.change_pct).toFixed(2)}%
            </div>
          </a>
        );
      })}
    </div>
  );
}
```

**Step 4: Create `web/src/app/page.tsx`**

```tsx
import { fetchIndices, fetchIndexHistory, fetchMarketMovers } from "@/lib/api";
import IndexChart from "@/components/IndexChart";
import SectorGrid from "@/components/SectorGrid";
import MoversTable from "@/components/MoversTable";

export default async function HomePage() {
  const [{ indices }, pmiHistory, { gainers, losers, most_active }] = await Promise.all([
    fetchIndices(),
    fetchIndexHistory("pmi", 30),
    fetchMarketMovers(),
  ]);

  const pmi = indices.find((i: any) => i.slug === "pmi");
  const isUp = pmi?.change_pct >= 0;

  return (
    <div>
      {/* PMI Header */}
      <div className="mb-4">
        <div className="text-xs font-mono mb-1" style={{ color: "var(--text-secondary)" }}>
          POKÉMARKET INDEX (PMI)
        </div>
        <div className="flex items-baseline gap-4">
          <span className="text-4xl font-mono font-bold">
            {pmi ? parseFloat(pmi.value).toFixed(2) : "—"}
          </span>
          {pmi?.change_pct !== null && (
            <span className="text-lg font-mono" style={{ color: isUp ? "var(--up)" : "var(--down)" }}>
              {isUp ? "▲" : "▼"} {Math.abs(pmi.change_pct).toFixed(2)}% today
            </span>
          )}
        </div>
      </div>

      {/* PMI Chart */}
      <IndexChart history={pmiHistory.history ?? []} name="PokéMarket Index" />

      {/* Sector Indices */}
      <h2 className="mt-8 mb-2 text-xs font-mono tracking-widest" style={{ color: "var(--text-secondary)" }}>
        SECTOR INDICES
      </h2>
      <SectorGrid indices={indices} />

      {/* Movers Tables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <MoversTable title="TOP GAINERS" cards={gainers} metric="change_pct_7d" />
        <MoversTable title="TOP LOSERS" cards={losers} metric="change_pct_7d" />
        <MoversTable title="MOST ACTIVE" cards={most_active} metric="volume_7d" />
      </div>
    </div>
  );
}
```

**Step 5: Create `web/src/components/MoversTable.tsx`**

```tsx
export default function MoversTable({ title, cards, metric }: { title: string; cards: any[]; metric: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-sm">
      <div className="px-4 py-2 border-b text-xs font-mono tracking-widest" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
        {title}
      </div>
      <table className="w-full text-sm font-mono">
        <tbody>
          {cards.map((card) => {
            const val = card[metric];
            const isUp = val >= 0;
            return (
              <tr key={card.id} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-2" style={{ color: "var(--text)" }}>
                  <a href={`/cards/${card.id}`} className="hover:underline">{card.name}</a>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{card.set_name}</div>
                </td>
                <td className="px-4 py-2 text-right" style={{ color: isUp ? "var(--up)" : "var(--down)" }}>
                  {metric === "volume_7d"
                    ? `${val} sales`
                    : `${isUp ? "+" : ""}${parseFloat(val).toFixed(2)}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 6: Verify locally**

```bash
cd web && npm run dev
```
Open http://localhost:3000 — homepage should render with PMI chart, sector grid, movers tables.

**Step 7: Commit**

```bash
git add web/src/
git commit -m "feat: homepage with PMI chart, sector indices, movers tables"
```

---

### Task 14: Card detail page

**Files:**
- Create: `web/src/app/cards/[id]/page.tsx`
- Create: `web/src/components/PriceChart.tsx`
- Create: `web/src/components/SalesTable.tsx`

**Step 1: Create `web/src/components/PriceChart.tsx`**

```tsx
"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useState } from "react";

const RANGES = [
  { label: "7D", days: 7 }, { label: "30D", days: 30 },
  { label: "90D", days: 90 }, { label: "1Y", days: 365 }, { label: "ALL", days: 9999 },
];

export default function PriceChart({ history }: { history: any[] }) {
  const [range, setRange] = useState(30);

  const filtered = history.filter(
    (h) => range === 9999 || new Date(h.recorded_at) > new Date(Date.now() - range * 86400000)
  );

  const data = filtered.map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString(),
    price: parseFloat(h.price),
  }));

  const prices = data.map((d) => d.price);
  const high = Math.max(...prices);
  const low = Math.min(...prices);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="p-4 rounded-sm">
      <div className="flex justify-between mb-4">
        <div className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
          52W HIGH: <span style={{ color: "var(--up)" }}>${high.toFixed(2)}</span>
          &nbsp;&nbsp;LOW: <span style={{ color: "var(--down)" }}>${low.toFixed(2)}</span>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button key={r.days} onClick={() => setRange(r.days)}
              className="text-xs px-2 py-1 rounded-sm font-mono"
              style={{
                background: range === r.days ? "var(--accent)" : "var(--bg)",
                color: range === r.days ? "#000" : "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
          <Line type="monotone" dataKey="price" stroke="var(--accent)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 2: Create `web/src/app/cards/[id]/page.tsx`**

```tsx
import { fetchCard } from "@/lib/api";
import PriceChart from "@/components/PriceChart";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function CardPage({ params }: { params: { id: string } }) {
  const data = await fetchCard(params.id);
  if (!data.card) return notFound();

  const { card, history } = data;
  const latest = history[history.length - 1];
  const prev30 = history.find(
    (h: any) => new Date(h.recorded_at) < new Date(Date.now() - 30 * 86400000)
  );
  const change30 = prev30
    ? ((latest?.price - prev30.price) / prev30.price * 100).toFixed(2)
    : null;
  const isUp = change30 ? parseFloat(change30) >= 0 : true;

  return (
    <div>
      {/* Header */}
      <div className="flex gap-6 mb-6">
        {card.image_url && (
          <Image src={card.image_url} alt={card.name} width={180} height={250} className="rounded-sm" />
        )}
        <div>
          <h1 className="text-2xl font-mono font-bold" style={{ color: "var(--text)" }}>{card.name}</h1>
          <div className="text-sm font-mono mt-1" style={{ color: "var(--text-secondary)" }}>
            {card.set_name} · {card.number} · {card.rarity}
          </div>
          <div className="text-sm font-mono mt-1" style={{ color: "var(--text-secondary)" }}>
            Type: {card.types?.join(", ")} · Era: {card.era} · Holo: {card.is_holo ? "Yes" : "No"}
          </div>
          {latest && (
            <div className="mt-4">
              <div className="text-3xl font-mono font-bold">${parseFloat(latest.price).toFixed(2)}</div>
              {change30 && (
                <div className="text-sm font-mono" style={{ color: isUp ? "var(--up)" : "var(--down)" }}>
                  {isUp ? "▲" : "▼"} {Math.abs(parseFloat(change30))}% (30d)
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Price Chart */}
      <PriceChart history={history} />

      {/* Recent Sales */}
      <h2 className="mt-8 mb-2 text-xs font-mono tracking-widest" style={{ color: "var(--text-secondary)" }}>
        RECENT SALES
      </h2>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-sm">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Price</th>
              <th className="text-left px-4 py-2">Condition</th>
              <th className="text-left px-4 py-2">Volume</th>
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().slice(0, 20).map((h: any, i: number) => (
              <tr key={i} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-2">{new Date(h.recorded_at).toLocaleDateString()}</td>
                <td className="px-4 py-2" style={{ color: "var(--accent)" }}>${parseFloat(h.price).toFixed(2)}</td>
                <td className="px-4 py-2">{h.condition ?? "—"}</td>
                <td className="px-4 py-2">{h.volume}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add web/src/app/cards/ web/src/components/PriceChart.tsx
git commit -m "feat: card detail page with price chart and sales table"
```

---

### Task 15: Index deep-dive page

**Files:**
- Create: `web/src/app/indices/[slug]/page.tsx`

**Step 1: Create index page**

```tsx
import { fetchIndexHistory, fetchIndices } from "@/lib/api";
import IndexChart from "@/components/IndexChart";
import { notFound } from "next/navigation";

export default async function IndexPage({ params }: { params: { slug: string } }) {
  const [historyData, { indices }] = await Promise.all([
    fetchIndexHistory(params.slug, 90),
    fetchIndices(),
  ]);

  if (!historyData.history?.length) return notFound();

  const idx = indices.find((i: any) => i.slug === params.slug);
  const isUp = idx?.change_pct >= 0;

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs font-mono tracking-widest mb-1" style={{ color: "var(--text-secondary)" }}>
          INDEX
        </div>
        <h1 className="text-2xl font-mono font-bold">{idx?.name}</h1>
        {idx && (
          <div className="flex items-baseline gap-4 mt-2">
            <span className="text-3xl font-mono font-bold">{parseFloat(idx.value).toFixed(2)}</span>
            <span className="font-mono" style={{ color: isUp ? "var(--up)" : "var(--down)" }}>
              {isUp ? "▲" : "▼"} {Math.abs(idx.change_pct).toFixed(2)}%
            </span>
          </div>
        )}
      </div>
      <IndexChart history={historyData.history} name={idx?.name ?? params.slug} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/app/indices/
git commit -m "feat: index deep-dive page"
```

---

### Task 16: Card screener page

**Files:**
- Create: `web/src/app/screener/page.tsx`

**Step 1: Create screener**

```tsx
import { fetchCards } from "@/lib/api";
import Link from "next/link";

const TYPES = ["Fire", "Water", "Grass", "Electric", "Psychic", "Fighting", "Darkness", "Metal", "Dragon"];

export default async function ScreenerPage({
  searchParams,
}: {
  searchParams: { type?: string; era?: string; is_holo?: string };
}) {
  const params: Record<string, string> = { limit: "100" };
  if (searchParams.type) params.type = searchParams.type;
  if (searchParams.era) params.era = searchParams.era;
  if (searchParams.is_holo) params.is_holo = searchParams.is_holo;

  const { cards } = await fetchCards(params);

  return (
    <div>
      <h1 className="text-xl font-mono font-bold mb-4">CARD SCREENER</h1>

      {/* Filters */}
      <form className="flex gap-3 mb-6 flex-wrap">
        <select name="type" defaultValue={searchParams.type ?? ""}
          className="text-sm font-mono px-3 py-1 rounded-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
          <option value="">All Types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select name="era" defaultValue={searchParams.era ?? ""}
          className="text-sm font-mono px-3 py-1 rounded-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
          <option value="">All Eras</option>
          <option value="vintage">Vintage</option>
          <option value="modern">Modern</option>
        </select>
        <select name="is_holo" defaultValue={searchParams.is_holo ?? ""}
          className="text-sm font-mono px-3 py-1 rounded-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
          <option value="">All Cards</option>
          <option value="true">Holo Only</option>
          <option value="false">Non-Holo</option>
        </select>
        <button type="submit"
          style={{ background: "var(--accent)", color: "#000" }}
          className="text-sm font-mono px-4 py-1 rounded-sm font-bold">
          Filter
        </button>
      </form>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-sm">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <th className="text-left px-4 py-2">Card</th>
              <th className="text-left px-4 py-2">Set</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Price</th>
              <th className="text-left px-4 py-2">30d Δ</th>
              <th className="text-left px-4 py-2">Holo</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card: any) => {
              const price = card.current_price ? parseFloat(card.current_price) : null;
              const prev = card.price_30d_ago ? parseFloat(card.price_30d_ago) : null;
              const change = price && prev ? ((price - prev) / prev * 100) : null;
              const isUp = change !== null && change >= 0;

              return (
                <tr key={card.id} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-2">
                    <Link href={`/cards/${card.id}`} className="hover:underline" style={{ color: "var(--text)" }}>
                      {card.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>{card.set_name}</td>
                  <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>{card.types?.join(", ")}</td>
                  <td className="px-4 py-2" style={{ color: "var(--accent)" }}>
                    {price ? `$${price.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-2" style={{ color: change !== null ? (isUp ? "var(--up)" : "var(--down)") : "var(--text-secondary)" }}>
                    {change !== null ? `${isUp ? "+" : ""}${change.toFixed(2)}%` : "—"}
                  </td>
                  <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>
                    {card.is_holo ? "✓" : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/app/screener/
git commit -m "feat: card screener with filter controls"
```

---

## Phase 3 (Future): Deployment & Paid Features

> **Not part of the current build.** Complete Phases 1–5 first and verify everything works locally. Return here when ready to go live.

### Deployment (when ready)
- DigitalOcean $10/mo VPS
- Docker Compose (same setup, just on a remote machine)
- Cloudflare for free SSL + CDN
- `deploy.sh` script for git pull → rebuild → restart

### Phase 2 Paid Features (when ready)
- **Buy-low value scanner** — flag cards >20% below 90d avg with recovering volume
- **RSI momentum indicators** per card
- **User accounts + portfolio tracking**
- **Email/push alerts** for price movements on watched cards
- **Blue Chip 30 curation** — manually curate the 30 cards and insert into `index_members`

---

## Phase 6 (Local): Docker Compose Verification

### Task 17: Wire up Docker Compose and test full stack locally

**Step 1: Copy `.env.example` to `.env` and fill in real values**

```bash
cp .env.example .env
# Edit .env — add your real EBAY_APP_ID
```

**Step 2: Build and start all services**

```bash
docker compose up --build
```

**Step 3: Verify each service**

```bash
# DB
docker compose exec db psql -U pokemarket -d pokemarket -c "SELECT count(*) FROM cards;"
# Expected: 5

# API
curl http://localhost:8000/cards | jq '.cards | length'
# Expected: 5

curl http://localhost:8000/indices | jq
# Expected: empty array until scraper has run

# Frontend
# Open http://localhost:3000
```

**Step 4: Trigger a manual scrape**

```bash
docker compose exec scraper python -c "from main import scrape_all_cards; scrape_all_cards()"
```

**Step 5: Verify prices and indices populated**

```bash
curl http://localhost:8000/indices | jq '.indices | length'
# Expected: > 0

curl http://localhost:8000/market/movers | jq '.gainers | length'
# Expected: > 0
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat: full docker compose stack verified"
```

---

### Task 18: DigitalOcean VPS deployment

**Files:**
- Create: `deploy.sh`

**Step 1: Create `deploy.sh`**

```bash
#!/bin/bash
set -e

echo "Pulling latest..."
git pull origin main

echo "Rebuilding and restarting..."
docker compose down
docker compose up --build -d

echo "Done. Services running:"
docker compose ps
```

**Step 2: On the VPS (one-time setup)**

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repo
git clone <your-repo-url> /app/pokemarket
cd /app/pokemarket

# Copy env
cp .env.example .env
nano .env  # fill in real values

# Start
docker compose up --build -d
```

**Step 3: Point Cloudflare DNS to your VPS IP**

- Add an A record: `pokemarket.com` → `<VPS IP>`
- Enable Cloudflare proxy (orange cloud) for free SSL + CDN

**Step 4: Commit**

```bash
git add deploy.sh
git commit -m "chore: add deploy script"
```

---

## Open Questions (resolve before launch)

1. **eBay App ID** — register at developer.ebay.com (free). Needed before any scraping works.
2. **Blue Chip 30 card list** — which 30 cards? Needs manual curation.
3. **eBay API rate limits** — Finding API allows ~5,000 calls/day. With 50+ cards scraped every 6 hours = 200+ calls/day. Well within limits.
4. **Domain name** — decide on `pokemarket.com` or alternative before deployment.
