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
