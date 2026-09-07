import { getPool } from '../client';

export interface PackageRow {
  id: string;
  title: string;
  category: 'India' | 'International' | 'Theme';
  duration: string | null;
  best_for: string | null;
  starting_price: string | null;
  price_inr: number | null;
  description: string | null;
  image_url: string | null;
  weather_info: unknown | null;
  synced_at: Date;
}

export interface PackageUpsert {
  id: string;
  title: string;
  category: string;
  duration?: string;
  bestFor?: string;
  startingPrice?: string;
  priceInr: number | null;
  description?: string;
  imageUrl?: string;
  weatherInfo?: unknown;
}

/**
 * Replaces the catalogue mirror in one statement per row.
 * src/data/index.ts stays the source of truth for what the site displays;
 * this table exists so AI services and recommendations can query inventory.
 */
export async function upsertPackages(items: PackageUpsert[]): Promise<number> {
  const pool = getPool();
  let count = 0;

  for (const item of items) {
    await pool.query(
      `INSERT INTO packages (
         id, title, category, duration, best_for,
         starting_price, price_inr, description, image_url, weather_info, synced_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
       ON CONFLICT (id) DO UPDATE SET
         title          = EXCLUDED.title,
         category       = EXCLUDED.category,
         duration       = EXCLUDED.duration,
         best_for       = EXCLUDED.best_for,
         starting_price = EXCLUDED.starting_price,
         price_inr      = EXCLUDED.price_inr,
         description    = EXCLUDED.description,
         image_url      = EXCLUDED.image_url,
         weather_info   = EXCLUDED.weather_info,
         synced_at      = now()`,
      [
        item.id,
        item.title,
        item.category,
        item.duration ?? null,
        item.bestFor ?? null,
        item.startingPrice ?? null,
        item.priceInr,
        item.description ?? null,
        item.imageUrl ?? null,
        item.weatherInfo ? JSON.stringify(item.weatherInfo) : null,
      ]
    );
    count++;
  }

  return count;
}

export async function allPackages(): Promise<PackageRow[]> {
  const { rows } = await getPool().query<PackageRow>(
    'SELECT * FROM packages ORDER BY category, price_inr NULLS LAST'
  );
  return rows;
}

export async function findPackagesByIds(ids: string[]): Promise<PackageRow[]> {
  if (ids.length === 0) return [];
  const { rows } = await getPool().query<PackageRow>(
    'SELECT * FROM packages WHERE id = ANY($1)',
    [ids]
  );
  return rows;
}

export async function findPackagesByCategory(
  category: string
): Promise<PackageRow[]> {
  const { rows } = await getPool().query<PackageRow>(
    'SELECT * FROM packages WHERE category = $1 ORDER BY price_inr NULLS LAST',
    [category]
  );
  return rows;
}
