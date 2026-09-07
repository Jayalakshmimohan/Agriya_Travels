import { getPool } from '../db/client';
import type { TravelRequirement } from '../schemas/travelRequirement';

/**
 * Answers "where should I go?" instead of "what does this trip cost?".
 *
 * The rest of the assistant retrieves through a named destination, which meant
 * a message describing only what someone wants — calm, snow, a village, tea
 * with locals — reached no data at all. This scores destinations by their tags
 * and description against those preferences.
 *
 * Deliberately returns NO price. A destination suggestion has no dates and no
 * headcount, so any figure attached to it would be invented. Costing happens
 * once they pick somewhere.
 */

export interface SuggestedPackage {
  id: string;
  title: string;
  duration: string | null;
  bestFor: string | null;
  startingPrice: string | null;
  priceInr: number | null;
}

export interface DestinationSuggestion {
  slug: string;
  name: string;
  region: string | null;
  destinationType: string | null;
  description: string | null;
  score: number;
  reasons: string[];
  bestMonths: string[];
  packages: SuggestedPackage[];
}

interface DestinationRow {
  id: string;
  slug: string;
  name: string;
  state: string | null;
  country: string | null;
  destination_type: string | null;
  description: string | null;
  best_months: string[];
  tags: unknown;
  popularity_rank: number | null;
}

/**
 * Words travellers use, mapped to the tag vocabulary the data actually holds.
 *
 * Without this, "chilly" never reaches a destination tagged "cold" and
 * "hamlet" never reaches "village". Kept as data so it is cheap to extend when
 * real enquiries show us the words people really use.
 */
const SYNONYMS: Record<string, string[]> = {
  // Deliberately narrow. An early version expanded snow -> mountains, which
  // made Munnar claim "has the snow scenery you described" — Munnar has hills
  // and tea, and no snow. Mountains do not imply snow, and cold does not
  // either. A wrong reason is worse than a missing one.
  snow: ['snow'],
  snowy: ['snow'],
  mountain: ['mountains', 'himalayas', 'alps', 'hill-station'],
  mountains: ['mountains', 'himalayas', 'alps', 'hill-station'],
  hills: ['hill-station', 'mountains'],
  chilly: ['cold', 'cool'],
  cold: ['cold'],
  cool: ['cool', 'hill-station'],
  warm: ['warm', 'tropical'],
  tropical: ['tropical', 'warm', 'beach'],
  beach: ['beach', 'island', 'warm'],
  sea: ['beach', 'island'],
  island: ['island', 'beach'],
  desert: ['desert'],
  forest: ['pine-forest', 'nature', 'forest'],
  lake: ['lake'],
  valley: ['mountains', 'meadows'],
  backwaters: ['backwaters', 'nature'],

  calm: ['calm', 'peaceful', 'slow', 'quiet'],
  peaceful: ['peaceful', 'calm', 'slow', 'quiet'],
  quiet: ['quiet', 'peaceful', 'calm', 'remote'],
  slow: ['slow', 'calm', 'peaceful'],
  serene: ['peaceful', 'calm'],
  relaxing: ['peaceful', 'calm', 'slow'],
  relaxation: ['peaceful', 'calm', 'slow'],
  romantic: ['honeymoon', 'couples'],
  honeymoon: ['honeymoon', 'couples'],
  adventurous: ['adventure', 'trekking'],
  adventure: ['adventure', 'trekking'],
  spiritual: ['pilgrimage', 'temples', 'monastery'],
  lively: ['nightlife', 'city'],
  luxury: ['luxury'],
  budget: ['budget'],

  village: ['village', 'remote', 'homestay'],
  hamlet: ['village', 'remote'],
  small_town: ['village', 'hill-station'],
  city: ['city', 'metro', 'modern'],
  local: ['village', 'homestay', 'culture'],
  localites: ['village', 'homestay', 'culture'],
  locals: ['village', 'homestay', 'culture'],
  tea: ['tea', 'tea-plantation', 'kahwa', 'butter-tea', 'tea-ceremony'],
  homestay: ['homestay', 'village'],
  trekking: ['trekking', 'adventure', 'mountains'],
  temples: ['temples', 'pilgrimage', 'heritage'],
  temple: ['temples', 'pilgrimage'],
  photography: ['landscapes', 'nature'],
  nature: ['nature', 'mountains', 'forest'],
  food: ['street-food', 'seafood'],
  culture: ['culture', 'heritage'],
  heritage: ['heritage', 'history', 'monuments'],
  history: ['history', 'heritage', 'monuments'],
};

/** A traveller's phrase -> the set of tags it should match. */
function expand(term: string): string[] {
  const key = term.toLowerCase().trim().replace(/\s+/g, '_');
  const direct = SYNONYMS[key];
  if (direct) return direct;

  // Multi-word phrases like "tea with locals" — expand each meaningful word.
  const words = key.split('_').filter((w) => w.length > 2);
  const out = new Set<string>();
  for (const word of words) {
    for (const tag of SYNONYMS[word] ?? [word]) out.add(tag);
  }
  return [...out];
}

const asTags = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((t) => String(t).toLowerCase()) : [];

/** Human-readable label for what matched, for the reasons list. */
const label = (term: string) => term.replace(/_/g, ' ');

/** ['snow','mountains'] -> 'snow and mountains' */
function sentence(items: string[]): string {
  if (items.length === 0) return '';
  return items.length === 1
    ? items[0]
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export async function discoverDestinations(
  req: TravelRequirement,
  limit = 4
): Promise<DestinationSuggestion[]> {
  const pool = getPool();

  const { rows: destinations } = await pool.query<DestinationRow>(
    `SELECT id, slug, name, state, country, destination_type, description,
            best_months, tags, popularity_rank
     FROM destinations`
  );

  const prefs = req.preferences;

  const WEIGHTS = { landscape: 22, vibe: 14, interest: 12, settlement: 14, climate: 10, pace: 10 };

  const scored = destinations.map((dest) => {
    const tags = new Set(asTags(dest.tags));
    const haystack = `${dest.name} ${dest.description ?? ''} ${dest.destination_type ?? ''}`.toLowerCase();

    let score = 0;
    let possible = 0;

    /**
     * Does this destination satisfy one preference term?
     *
     * A tag hit is authoritative. A description hit counts for less: the text
     * is prose, so "no snow in summer" would match "snow" — good enough to
     * rank on, not good enough to weight fully.
     */
    const hit = (term: string, weight: number): boolean => {
      possible += weight;
      const expanded = expand(term);
      if (expanded.some((t) => tags.has(t))) {
        score += weight;
        return true;
      }
      if (expanded.some((t) => haystack.includes(t))) {
        score += Math.round(weight * 0.5);
        return true;
      }
      return false;
    };

    // Collected per category so reasons read as one clean statement each,
    // rather than "Has the snow scenery" followed by "Has the mountains
    // scenery" followed by three near-identical vibe lines.
    const matchedLandscape = prefs.landscape.filter((t) => hit(t, WEIGHTS.landscape));
    const matchedVibe = prefs.vibe.filter((t) => hit(t, WEIGHTS.vibe));
    const matchedInterests = prefs.interests.filter((t) => hit(t, WEIGHTS.interest));
    const matchedSettlement = prefs.settlement ? hit(prefs.settlement, WEIGHTS.settlement) : false;
    const matchedClimate = prefs.climate ? hit(prefs.climate, WEIGHTS.climate) : false;
    const matchedPace = prefs.pace === 'slow' ? hit('slow', WEIGHTS.pace) : false;

    // Most specific first: "small villages to stay in" and "tea with locals"
    // tell someone far more than "known for being calm".
    const reasons: string[] = [];
    if (matchedLandscape.length) {
      reasons.push(`${capitalise(sentence(matchedLandscape.map(label)))} scenery, as you described`);
    }
    if (matchedSettlement) {
      reasons.push(
        prefs.settlement === 'city' ? 'A city, as you wanted' : `Small ${prefs.settlement}s to stay in`
      );
    }
    if (matchedInterests.length) {
      reasons.push(`Good for ${sentence(matchedInterests.map(label))}`);
    }
    if (matchedVibe.length) {
      reasons.push(`Known for being ${sentence(matchedVibe.map(label))}`);
    }
    if (matchedClimate) {
      reasons.push(`${capitalise(label(prefs.climate!))} climate`);
    }
    if (matchedPace) reasons.push('Suits an unhurried pace');

    // Popularity only separates otherwise equal matches.
    const tieBreak = dest.popularity_rank
      ? Math.max(0, 5 - Math.floor(dest.popularity_rank / 4))
      : 0;

    // Normalised against what was actually asked for, so the number means
    // "how much of your request does this meet" rather than a raw total that
    // saturates at the cap and makes every result look identical.
    const fit = possible > 0 ? Math.round((score / possible) * 100) : 0;

    return { dest, score: fit, rank: score + tieBreak, reasons };
  });

  const top = scored
    .filter((s) => s.score > 0 && s.reasons.length > 0)
    .sort((a, b) => b.rank - a.rank || b.score - a.score)
    .slice(0, limit);

  if (top.length === 0) return [];

  // One query for every winning destination's packages.
  const ids = top.map((t) => t.dest.id);
  const { rows: packages } = await pool.query<{
    destination_id: string; id: string; title: string; duration: string | null;
    best_for: string | null; starting_price: string | null; price_inr: number | null;
  }>(
    `SELECT destination_id, id, title, duration, best_for, starting_price, price_inr
     FROM packages
     WHERE destination_id = ANY($1::bigint[]) AND status = 'active'
     ORDER BY price_inr NULLS LAST`,
    [ids]
  );

  return top.map(({ dest, score, reasons }) => ({
    slug: dest.slug,
    name: dest.name,
    region: dest.state ?? dest.country ?? null,
    destinationType: dest.destination_type,
    description: dest.description,
    score: Math.min(100, score),
    reasons: reasons.slice(0, 5),
    bestMonths: dest.best_months ?? [],
    packages: packages
      .filter((p) => p.destination_id === dest.id)
      .map((p) => ({
        id: p.id,
        title: p.title,
        duration: p.duration,
        bestFor: p.best_for,
        startingPrice: p.starting_price,
        priceInr: p.price_inr,
      })),
  }));
}
