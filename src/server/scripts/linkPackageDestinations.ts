import 'dotenv/config';
import { getPool, closePool, withTransaction } from '../db/client';

/**
 * Creates a destination row for every package that lacked one, and links them.
 *
 * Retrieval walks destinations -> packages, so the 19 packages with a NULL
 * destination_id were unreachable by the assistant: the answerable catalogue
 * was Tirupati and Munnar. Nothing snow-covered, nothing romantic, nothing
 * international.
 *
 * `tags` carries the qualitative vocabulary that preference matching scores
 * against — snow, village, peaceful, tea — which is why they are more
 * generous than a pure geography record would need.
 *
 * Idempotent: destinations upsert on slug, links are set by package id.
 */

interface DestinationSeed {
  slug: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lon?: number;
  type: string;
  description: string;
  rank: number;
  bestMonths: string[];
  tags: string[];
  /** Package ids this destination serves. */
  packages: string[];
}

const SEEDS: DestinationSeed[] = [
  // ---- Snow / mountain, the gap that started this ----
  {
    slug: 'shimla-manali', name: 'Shimla & Manali', state: 'Himachal Pradesh',
    lat: 32.239, lon: 77.188, type: 'hill_station', rank: 4,
    description:
      'Himalayan hill towns of Himachal Pradesh with snow-covered peaks, apple orchards, deodar and pine forest, and small mountain villages where roadside tea stalls are a way of life.',
    bestMonths: ['Mar', 'Apr', 'May', 'Jun', 'Oct', 'Nov', 'Dec', 'Jan'],
    tags: ['snow', 'mountains', 'village', 'peaceful', 'calm', 'slow', 'nature',
           'tea', 'pine-forest', 'honeymoon', 'cold', 'himalayas'],
    packages: ['ind-9'],
  },
  {
    slug: 'kashmir', name: 'Kashmir (Srinagar & Gulmarg)', state: 'Jammu & Kashmir',
    lat: 34.083, lon: 74.797, type: 'hill_station', rank: 3,
    description:
      'Snow-capped Himalayan valley of meadows, houseboats on Dal Lake and quiet villages among walnut and saffron fields. Kashmiri kahwa tea with locals is part of daily life.',
    bestMonths: ['Mar', 'Apr', 'May', 'Jun', 'Sep', 'Oct', 'Nov', 'Dec'],
    tags: ['snow', 'mountains', 'village', 'peaceful', 'calm', 'slow', 'lake',
           'nature', 'tea', 'kahwa', 'meadows', 'cold', 'himalayas', 'honeymoon'],
    packages: ['ind-2'],
  },
  {
    slug: 'leh-ladakh', name: 'Leh & Ladakh', state: 'Ladakh',
    lat: 34.152, lon: 77.577, type: 'adventure', rank: 7,
    description:
      'High-altitude cold desert of snow passes, turquoise lakes and remote Buddhist villages. Homestays with butter tea in tiny hamlets far from any crowd.',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    tags: ['snow', 'mountains', 'village', 'remote', 'peaceful', 'calm', 'slow',
           'adventure', 'high-altitude', 'landscapes', 'monastery', 'tea',
           'butter-tea', 'cold', 'himalayas'],
    packages: ['ind-8'],
  },
  {
    slug: 'swiss-alps', name: 'Swiss Alps', country: 'Switzerland',
    lat: 46.558, lon: 7.879, type: 'hill_station', rank: 12,
    description:
      'Alpine villages beneath permanent snow peaks, scenic mountain railways, and serene lakes at Interlaken and Lucerne. Slow, quiet and immaculately calm.',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Dec', 'Jan'],
    tags: ['snow', 'mountains', 'village', 'peaceful', 'calm', 'slow', 'lake',
           'nature', 'train', 'luxury', 'cold', 'alps'],
    packages: ['int-7'],
  },

  // ---- India, remaining ----
  {
    slug: 'hampi', name: 'Hampi', state: 'Karnataka',
    lat: 15.335, lon: 76.460, type: 'heritage', rank: 15,
    description:
      'Surreal boulder landscape scattered with Vijayanagara-era ruins, stone chariots and temples along the Tungabhadra river. Quiet, slow and otherworldly.',
    bestMonths: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    tags: ['heritage', 'ruins', 'temples', 'peaceful', 'calm', 'slow', 'village',
           'culture', 'river', 'backpacking'],
    packages: ['ind-10'],
  },
  {
    slug: 'goa', name: 'Goa', state: 'Goa',
    lat: 15.299, lon: 74.124, type: 'beach', rank: 5,
    description:
      'Golden beaches, Portuguese-era churches and villages, seafood shacks and a famously unhurried pace alongside lively nightlife.',
    bestMonths: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    tags: ['beach', 'warm', 'nightlife', 'friends', 'couples', 'heritage',
           'seafood', 'village', 'slow'],
    packages: ['ind-4'],
  },
  {
    slug: 'delhi-agra-jaipur', name: 'Delhi, Agra & Jaipur', state: 'North India',
    lat: 27.175, lon: 78.042, type: 'heritage', rank: 6,
    description:
      "India's Golden Triangle — the Taj Mahal, Amber Fort and Delhi's Mughal monuments, dense with history, architecture and street food.",
    bestMonths: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    tags: ['heritage', 'history', 'architecture', 'city', 'monuments',
           'street-food', 'family', 'packed'],
    packages: ['ind-7'],
  },
  {
    slug: 'rajasthan', name: 'Rajasthan (Jaipur & Udaipur)', state: 'Rajasthan',
    lat: 26.912, lon: 75.787, type: 'heritage', rank: 9,
    description:
      'Land of Maharajas — hilltop forts, lake palaces, desert villages and vivid folk performance.',
    bestMonths: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    tags: ['heritage', 'history', 'desert', 'forts', 'palaces', 'culture',
           'family', 'village', 'warm'],
    packages: ['ind-5'],
  },

  // ---- International, remaining ----
  {
    slug: 'thailand', name: 'Thailand (Bangkok & Phuket)', country: 'Thailand',
    lat: 13.756, lon: 100.502, type: 'beach', rank: 10,
    description:
      'Tropical beaches and islands, night markets, Buddhist temples and famously good street food at a budget-friendly price.',
    bestMonths: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    tags: ['beach', 'warm', 'budget', 'friends', 'temples', 'street-food',
           'islands', 'nightlife'],
    packages: ['int-3'],
  },
  {
    slug: 'dubai', name: 'Dubai', country: 'UAE',
    lat: 25.205, lon: 55.271, type: 'metro', rank: 8,
    description:
      'Futuristic skyline, desert safaris and tax-free shopping, with polished family attractions throughout.',
    bestMonths: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    tags: ['city', 'luxury', 'shopping', 'desert', 'family', 'warm', 'packed',
           'modern'],
    packages: ['int-1'],
  },
  {
    slug: 'bali', name: 'Bali', country: 'Indonesia',
    lat: -8.409, lon: 115.189, type: 'beach', rank: 11,
    description:
      'Emerald rice terraces around Ubud, cliffside temples, volcanic sunsets and quiet village homestays alongside beach clubs.',
    bestMonths: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    tags: ['beach', 'warm', 'village', 'peaceful', 'calm', 'slow', 'couples',
           'temples', 'rice-terrace', 'nature', 'honeymoon', 'yoga'],
    packages: ['int-6'],
  },
  {
    slug: 'singapore', name: 'Singapore', country: 'Singapore',
    lat: 1.352, lon: 103.820, type: 'metro', rank: 13,
    description:
      'Compact garden city of Gardens by the Bay, Sentosa resorts and world-class theme parks — easy and efficient with family.',
    bestMonths: ['Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Nov', 'Dec'],
    tags: ['city', 'family', 'modern', 'warm', 'theme-park', 'gardens', 'packed',
           'clean'],
    packages: ['int-2'],
  },
  {
    slug: 'maldives', name: 'Maldives', country: 'Maldives',
    lat: 3.202, lon: 73.220, type: 'beach', rank: 14,
    description:
      'Overwater villas on turquoise atolls, complete privacy and nothing at all to do but rest. The slowest pace on this list.',
    bestMonths: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
    tags: ['beach', 'warm', 'luxury', 'honeymoon', 'couples', 'peaceful', 'calm',
           'slow', 'private', 'island', 'snorkelling'],
    packages: ['int-5'],
  },
  {
    slug: 'japan', name: 'Japan (Tokyo & Kyoto)', country: 'Japan',
    lat: 35.012, lon: 135.768, type: 'heritage', rank: 16,
    description:
      'Mount Fuji, bullet trains, ancient Kyoto shrines and tea houses, and the neon density of Tokyo. Cherry blossom in spring.',
    bestMonths: ['Mar', 'Apr', 'May', 'Oct', 'Nov'],
    tags: ['heritage', 'culture', 'technology', 'city', 'temples', 'tea',
           'tea-ceremony', 'cherry-blossom', 'mountains', 'train', 'village'],
    packages: ['int-8'],
  },
  {
    slug: 'europe', name: 'Europe (Paris, Rome & Venice)', country: 'Europe',
    lat: 45.440, lon: 12.316, type: 'heritage', rank: 17,
    description:
      'A grand multi-city arc through Paris, the Swiss Alps, Rome and Venice — art, architecture and cafe culture across two weeks.',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    tags: ['heritage', 'city', 'luxury', 'couples', 'art', 'architecture',
           'cafe', 'packed', 'multi-city'],
    packages: ['int-4'],
  },
];

/** best_for text -> traveller_type array the recommender can filter on. */
function travellerTypes(bestFor: string | null): string[] {
  if (!bestFor) return [];
  return bestFor
    .split(/[,/]/)
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, '_'))
    .filter(Boolean);
}

async function main() {
  const pool = getPool();
  let created = 0;
  let linked = 0;

  await withTransaction(async (c) => {
    for (const seed of SEEDS) {
      const { rows } = await c.query<{ id: string }>(
        `INSERT INTO destinations
           (slug, name, city, state, country, latitude, longitude,
            destination_type, description, popularity_rank, best_months, tags,
            data_source, source_reference)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'REAL_PUBLIC',NULL)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           destination_type = EXCLUDED.destination_type,
           best_months = EXCLUDED.best_months,
           tags = EXCLUDED.tags,
           updated_at = now()
         RETURNING id`,
        [
          seed.slug, seed.name, seed.city ?? null, seed.state ?? null,
          seed.country ?? 'India', seed.lat ?? null, seed.lon ?? null,
          seed.type, seed.description, seed.rank, seed.bestMonths,
          JSON.stringify(seed.tags),
        ]
      );
      const destinationId = Number(rows[0].id);
      created++;

      for (const packageId of seed.packages) {
        const res = await c.query<{ best_for: string | null }>(
          `SELECT best_for FROM packages WHERE id = $1`,
          [packageId]
        );
        if (res.rowCount === 0) {
          console.warn(`  package ${packageId} not found — skipped`);
          continue;
        }

        await c.query(
          `UPDATE packages
           SET destination_id = $2,
               status = 'active',
               traveller_type = $3
           WHERE id = $1`,
          [packageId, destinationId, travellerTypes(res.rows[0].best_for)]
        );
        linked++;
      }
    }

    // Enrich the two that already existed so preference matching can reach
    // them on the same footing as the new rows.
    await c.query(
      `UPDATE destinations SET tags = $1::jsonb, updated_at = now() WHERE slug = 'munnar'`,
      [
        JSON.stringify([
          'hill-station', 'tea', 'tea-plantation', 'mountains', 'village',
          'peaceful', 'calm', 'slow', 'nature', 'misty', 'family', 'cool',
        ]),
      ]
    );
    await c.query(
      `UPDATE destinations SET tags = $1::jsonb, updated_at = now() WHERE slug = 'ooty'`,
      [
        JSON.stringify([
          'hill-station', 'tea', 'mountains', 'village', 'peaceful', 'calm',
          'slow', 'nature', 'heritage-railway', 'family', 'cool',
        ]),
      ]
    );
    await c.query(
      `UPDATE destinations SET tags = $1::jsonb, updated_at = now() WHERE slug = 'madurai'`,
      [JSON.stringify(['pilgrimage', 'temples', 'heritage', 'culture', 'street-food', 'warm'])]
    );

    // South India Temple Tour covers Tamil Nadu and Karnataka; Madurai is its
    // anchor and already exists as a destination.
    await c.query(
      `UPDATE packages SET destination_id = (SELECT id FROM destinations WHERE slug = 'madurai'),
                           status = 'active',
                           traveller_type = ARRAY['pilgrimage','culture']
       WHERE id = 'ind-3'`
    );
    linked++;
  });

  const summary = await pool.query<{ total: string; linked: string }>(
    `SELECT count(*)::text AS total,
            count(destination_id)::text AS linked
     FROM packages`
  );
  const dests = await pool.query<{ n: string }>(`SELECT count(*)::text AS n FROM destinations`);

  console.log(`  destinations upserted : ${created}`);
  console.log(`  package links set     : ${linked}`);
  console.log(`\n  destinations total    : ${dests.rows[0].n}`);
  console.log(`  packages linked       : ${summary.rows[0].linked} / ${summary.rows[0].total}`);
  console.log(`\n  (the 3 Theme packages stay unlinked — they are bespoke, not place-based)`);
}

main()
  .catch((err) => {
    console.error('\nLinking failed:\n', err);
    process.exit(1);
  })
  .finally(closePool);
