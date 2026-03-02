# PokéMarket — Design Document
**Date:** 2026-03-02
**Status:** Approved

---

## Overview

PokéMarket is a public-facing Pokemon TCG price tracking website targeting card investors and flippers. It presents Pokemon card market data in a stock market style — price history charts, market indices, sector performance, gainers/losers tables — powered by real eBay sold listing data.

---

## Goals

- Show real-time (scraped every 6 hours) eBay sold prices for Pokemon cards
- Present multiple market indices (PMI, type sectors, Blue Chip 30, etc.)
- Give investors the tools to spot trends, track cards, and evaluate market health
- Look and feel like a financial data terminal, not a fan site

---

## Non-Goals (Phase 1)

- User accounts / portfolios
- Buy/sell signals or paid features (Phase 2)
- TCGPlayer or other data sources (eBay only)
- Mobile app

---

## Aesthetic Direction

Dark terminal aesthetic — data-dense, tabular, monospace numbers. No Bootstrap, no rounded card fluff, no gradients.

### Dark Mode (default)
| Token | Value |
|---|---|
| Background | `#0d0d0d` |
| Surface | `#1a1a1a` |
| Border | `#2a2a2a` |
| Up (green) | `#00c853` |
| Down (red) | `#ff3d00` |
| Accent | `#f7d02c` |
| Text primary | `#e0e0e0` |
| Text secondary | `#888888` |

### Light Mode
| Token | Value |
|---|---|
| Background | `#f5f5f5` |
| Surface | `#ffffff` |
| Border | `#e0e0e0` |
| Up (green) | `#00a846` |
| Down (red) | `#d32f0f` |
| Accent | `#f7d02c` |
| Text primary | `#111111` |
| Text secondary | `#555555` |

Theme toggled via button in nav bar, persisted in `localStorage`. Implemented as CSS custom properties on `:root`.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    VPS ($10/mo)                     │
│                                                     │
│  ┌─────────────┐    ┌─────────────┐                 │
│  │   Scraper   │───▶│  PostgreSQL │                 │
│  │  (Python)   │    │             │                 │
│  │             │    │ - cards     │                 │
│  │ - eBay API  │    │ - prices    │                 │
│  │ - Playwright│    │ - indices   │                 │
│  │ - APScheduler    └──────┬──────┘                 │
│  └─────────────┘           │                        │
│                     ┌──────▼──────┐                 │
│                     │   FastAPI   │                 │
│                     │  (REST API) │                 │
│                     └──────┬──────┘                 │
│                            │                        │
│                     ┌──────▼──────┐                 │
│                     │   Next.js   │                 │
│                     │  (Frontend) │                 │
│                     └─────────────┘                 │
│                                                     │
│  Orchestrated via Docker Compose                    │
│  SSL + CDN via Cloudflare (free)                    │
└─────────────────────────────────────────────────────┘
```

---

## Data Model

### `cards`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | text | e.g. "Charizard" |
| set_name | text | e.g. "Base Set" |
| set_code | text | e.g. "base1" |
| number | text | e.g. "4/102" |
| rarity | text | Common / Uncommon / Rare / Holo Rare |
| types | text[] | Array — supports dual-type |
| is_holo | boolean | |
| era | text | `vintage` (pre-2003) or `modern` |
| image_url | text | From Pokemon TCG API |
| ebay_search_query | text | Search string used to find eBay listings |

### `price_history`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| card_id | UUID | FK → cards |
| price | numeric | Sale price in USD |
| volume | integer | Number of sales in this scrape batch |
| condition | text | Raw / PSA 10 / PSA 9 / BGS etc. (parsed from title) |
| recorded_at | timestamptz | When the scrape ran |

### `indices`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | text | e.g. "PMI", "Fire Type", "Blue Chip 30" |
| value | numeric | Computed index value |
| change_pct | numeric | % change vs previous snapshot |
| recorded_at | timestamptz | |

### `index_members`
| Column | Type | Notes |
|---|---|---|
| index_id | UUID | FK → indices |
| card_id | UUID | FK → cards |
| weight | numeric | 0–1, sum = 1 per index |

---

## Market Indices

| Index | Composition | Weighting |
|---|---|---|
| PMI (PokéMarket Index) | All tracked cards | Volume-weighted |
| Blue Chip 30 | 30 iconic cards (Charizard, Pikachu, Mewtwo…) | Equal-weight |
| Holo Index | All holo cards | Volume-weighted |
| PSA 10 Index | Listings with "PSA 10" in title | Volume-weighted |
| Fire / Water / Grass / Electric / Psychic / etc. | Cards by type | Volume-weighted |
| Vintage Index | Cards from sets pre-2003 | Volume-weighted |
| Modern Index | Cards from sets 2003–present | Volume-weighted |

---

## Pages

### 1. Homepage — Market Dashboard
- Large PMI chart (30d/90d/1y toggle)
- Sector index grid (type indices as mini tiles with sparklines + % change)
- Specialty index tiles (Blue Chip 30, Holo, PSA 10, Vintage vs Modern)
- Three tables side by side: Most Active | Top Gainers | Top Losers
- Nav: `POKÉMARKET | Indices | Cards | Screener | [Search] | [🌙/☀️]`

### 2. Card Detail Page — `/cards/[id]`
- Card name, set, rarity, type, era
- Current price + 52-week high/low + avg daily volume
- Price history chart (7d/30d/90d/1y/All toggle)
- Recent eBay sales table (date, price, condition, listing title)
- Related cards (same set / same type)

### 3. Index Deep-Dive — `/indices/[slug]`
- Full index chart with time range toggle
- Index composition table: card name, weight %, price, 30d change, sparkline

### 4. Card Screener — `/screener`
- Filter bar: Type, Set, Era, Holo, Price range
- Sortable table: Card | Set | Price | 7d Δ | 30d Δ | Volume

---

## Data Pipeline

### Scrape Schedule
| Job | Frequency |
|---|---|
| eBay sold listings per card | Every 6 hours |
| Index recomputation | After every scrape run |
| New card discovery | Daily (Pokemon TCG API metadata) |

### eBay Data Strategy
- Primary: eBay Finding API (free, returns sold listings by keyword)
- Fallback: Playwright scraping of completed listings page

### Data Quality Rules
- Outlier filter: drop sales >3x or <0.3x the 30-day median
- Low liquidity flag: cards with <3 sales in 90 days marked as low liquidity
- Condition parsing: extract Raw / PSA / BGS grade from listing title

### Index Computation
```
PMI            = Σ(price × volume_weight) across all cards
Type Index     = same, filtered by type
Blue Chip 30   = equal-weight average of 30 curated cards
Holo Index     = volume-weighted across is_holo = true
PSA 10 Index   = listings where condition = "PSA 10"
Vintage Index  = cards where era = "vintage"
Modern Index   = cards where era = "modern"
```
Pre-computed and stored in `indices` table after each scrape. Charts read stored rows — no heavy math at request time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Scraper | Python + Playwright + eBay Finding API |
| Scheduler | APScheduler (inside scraper container) |
| Database | PostgreSQL |
| Backend | FastAPI |
| Frontend | Next.js + Tailwind CSS + Recharts |
| Deployment | Docker Compose on DigitalOcean $10/mo |
| SSL + CDN | Cloudflare (free tier) |

---

## Project Structure

```
pokemarket/
├── scraper/           # Python scraper + APScheduler
├── api/               # FastAPI backend
├── web/               # Next.js frontend
├── db/                # PostgreSQL migrations
├── docker-compose.yml
└── docs/
    └── plans/
        └── 2026-03-02-pokemarket-design.md
```

---

## Phase 2 (Future / Paid Tier)

- **Buy-Low Value Scanner:** Flag cards where price is X% below 90-day average and volume is recovering — classic accumulation signal. Presented as a paid feature.
- RSI-style momentum indicators per card
- User accounts + personal portfolio tracking
- Email/push alerts for price movements on watched cards

---

## Open Questions

- Which 30 cards make up the Blue Chip 30? (curated list needed before launch)
- eBay Finding API rate limits — may need to stagger scrape jobs per card
