/**
 * Card basket — single source of truth for all tracked cards.
 * All weights must sum to 1.0.
 */
export const CARDS = [
  {
    id: 'base-charizard',
    name: 'Charizard Holo',
    set: 'Base Set',
    number: '4/102',
    era: 'vintage',
    tier: 'vintage',
    weight: 0.12,
    ebayQuery: 'Pokemon Base Set Charizard Holo 4/102 PSA BGS CGC graded sold',
  },
  {
    id: 'base-blastoise',
    name: 'Blastoise Holo',
    set: 'Base Set',
    number: '2/102',
    era: 'vintage',
    tier: 'vintage',
    weight: 0.07,
    ebayQuery: 'Pokemon Base Set Blastoise Holo 2/102 sold',
  },
  {
    id: 'base-venusaur',
    name: 'Venusaur Holo',
    set: 'Base Set',
    number: '15/102',
    era: 'vintage',
    tier: 'vintage',
    weight: 0.06,
    ebayQuery: 'Pokemon Base Set Venusaur Holo 15/102 sold',
  },
  {
    id: 'base-pikachu',
    name: 'Pikachu',
    set: 'Base Set',
    number: '58/102',
    era: 'vintage',
    tier: 'vintage',
    weight: 0.05,
    ebayQuery: 'Pokemon Base Set Pikachu 58/102 yellow cheeks sold',
  },
  {
    id: 'base-mewtwo',
    name: 'Mewtwo Holo',
    set: 'Base Set',
    number: '10/102',
    era: 'vintage',
    tier: 'vintage',
    weight: 0.05,
    ebayQuery: 'Pokemon Base Set Mewtwo Holo 10/102 sold',
  },
  {
    id: 'gold-star-charizard',
    name: 'Charizard Gold Star',
    set: 'EX Team Rocket Returns',
    number: '100/109',
    era: 'vintage',
    tier: 'iconic',
    weight: 0.08,
    ebayQuery: 'Pokemon Charizard Gold Star EX Team Rocket Returns 100/109 sold',
  },
  {
    id: 'shining-charizard',
    name: 'Shining Charizard',
    set: 'Neo Destiny',
    number: '107/105',
    era: 'vintage',
    tier: 'iconic',
    weight: 0.07,
    ebayQuery: 'Pokemon Shining Charizard Neo Destiny 107/105 sold',
  },
  {
    id: 'crystal-charizard',
    name: 'Charizard Crystal',
    set: 'Skyridge',
    number: 'H3/H32',
    era: 'vintage',
    tier: 'iconic',
    weight: 0.06,
    ebayQuery: 'Pokemon Crystal Charizard Skyridge H3 sold',
  },
  {
    id: 'pikachu-illustrator',
    name: 'Pikachu Illustrator',
    set: 'Promo',
    number: 'Promo',
    era: 'vintage',
    tier: 'iconic',
    weight: 0.09,
    ebayQuery: 'Pokemon Pikachu Illustrator promo card sold',
  },
  {
    id: 'obsidian-charizard-alt',
    name: 'Charizard ex Alt Art',
    set: 'Obsidian Flames',
    number: '228/197',
    era: 'modern',
    tier: 'modern-chase',
    weight: 0.07,
    ebayQuery: 'Pokemon Charizard ex Alt Art Obsidian Flames 228/197 sold',
  },
  {
    id: 'umbreon-vmax-alt',
    name: 'Umbreon VMAX Alt Art',
    set: 'Evolving Skies',
    number: '215/203',
    era: 'modern',
    tier: 'modern-chase',
    weight: 0.07,
    ebayQuery: 'Pokemon Umbreon VMAX Alt Art Evolving Skies 215/203 sold',
  },
  {
    id: 'rayquaza-vmax-alt',
    name: 'Rayquaza VMAX Alt Art',
    set: 'Evolving Skies',
    number: '218/203',
    era: 'modern',
    tier: 'modern-chase',
    weight: 0.06,
    ebayQuery: 'Pokemon Rayquaza VMAX Alt Art Evolving Skies 218/203 sold',
  },
  {
    id: 'giratina-vstar-alt',
    name: 'Giratina VSTAR Alt Art',
    set: 'Lost Origin',
    number: '201/196',
    era: 'modern',
    tier: 'modern-chase',
    weight: 0.06,
    ebayQuery: 'Pokemon Giratina VSTAR Alt Art Lost Origin 201/196 sold',
  },
  {
    id: 'lugia-vstar-alt',
    name: 'Lugia VSTAR Alt Art',
    set: 'Silver Tempest',
    number: '211/195',
    era: 'modern',
    tier: 'modern-chase',
    weight: 0.06,
    ebayQuery: 'Pokemon Lugia VSTAR Alt Art Silver Tempest 211/195 sold',
  },
  {
    id: 'charizard-ex-151',
    name: 'Charizard ex',
    set: 'Pokémon 151',
    number: '199/165',
    era: 'modern',
    tier: 'modern-chase',
    weight: 0.07,
    ebayQuery: 'Pokemon Charizard ex 151 199/165 sold',
  },
];

/** Look up a card by its id slug */
export function getCard(id) {
  return CARDS.find((c) => c.id === id) ?? null;
}

/** Cards grouped by tier */
export function getCardsByTier(tier) {
  return CARDS.filter((c) => c.tier === tier);
}

// Sanity check — weights should sum to 1.0
const totalWeight = CARDS.reduce((sum, c) => sum + c.weight, 0);
if (Math.abs(totalWeight - 1.0) > 0.001) {
  console.warn(`Card basket weights sum to ${totalWeight}, expected 1.0`);
}
