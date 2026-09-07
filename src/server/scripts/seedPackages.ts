import 'dotenv/config';
import { tourPackages } from '../../data';
import { upsertPackages, type PackageUpsert } from '../db/repositories/packageRepo';
import { closePool } from '../db/client';

/**
 * Copies the package catalogue from src/data/index.ts into the database.
 *
 * src/data/index.ts remains the source of truth for what the site renders.
 * The table is a read model so AI services can ground itineraries in real
 * inventory and recommendations can filter by price. Re-run after any
 * catalogue edit — it upserts, so running it twice is harmless.
 */

/** '₹15,000' -> 15000. Returns null when no number can be read. */
function parsePriceInr(price: string | undefined): number | null {
  if (!price) return null;
  const match = price.match(/[\d,]+/);
  if (!match) return null;
  const value = parseInt(match[0].replace(/,/g, ''), 10);
  return Number.isNaN(value) ? null : value;
}

async function main() {
  const items: PackageUpsert[] = tourPackages.map((pkg) => ({
    id: pkg.id,
    title: pkg.title,
    category: pkg.category,
    duration: pkg.duration,
    bestFor: pkg.bestFor,
    startingPrice: pkg.startingPrice,
    priceInr: parsePriceInr(pkg.startingPrice),
    description: pkg.description,
    imageUrl: pkg.imageUrl,
    weatherInfo: pkg.weatherInfo,
  }));

  const unpriced = items.filter((i) => i.priceInr === null);
  if (unpriced.length > 0) {
    console.warn(
      `Warning: no price parsed for ${unpriced.map((i) => i.id).join(', ')}`
    );
  }

  const count = await upsertPackages(items);
  console.log(`Synced ${count} packages.`);
}

main()
  .catch((err) => {
    console.error('\nPackage sync failed:\n', err);
    process.exit(1);
  })
  .finally(closePool);
