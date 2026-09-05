import { allPackages, type PackageRow } from '../db/repositories/packageRepo';
import { getPool } from '../db/client';
import type { LeadRow } from '../db/repositories/leadRepo';

export interface Recommendation {
  package: PackageRow;
  score: number;
  reasons: string[];
}

/** '₹15,000' / 'Moderate' -> a rough INR ceiling per person, or null. */
function budgetCeiling(budget: string | null): number | null {
  if (!budget) return null;
  const explicit = budget.match(/[\d,]{4,}/);
  if (explicit) return parseInt(explicit[0].replace(/,/g, ''), 10);

  const b = budget.toLowerCase();
  if (b.includes('luxury')) return 200_000;
  if (b.includes('premium')) return 100_000;
  if (b.includes('moderate') || b.includes('standard')) return 50_000;
  if (b.includes('budget')) return 25_000;
  return null;
}

/**
 * Content-based scoring, so this works from the very first enquiry — a
 * collaborative approach would have nothing to learn from yet.
 *
 * Destination similarity dominates; budget and party fit only reorder
 * packages that already match on place. Recommending a Dubai package for a
 * Kerala enquiry because both suit families is worse than recommending
 * nothing.
 */
export function scorePackagesForLead(
  packages: PackageRow[],
  lead: Pick<LeadRow, 'destination' | 'budget' | 'travellers' | 'travel_type' | 'duration_days'>
): Recommendation[] {
  const destination = (lead.destination ?? '').toLowerCase().trim();
  const words = destination.split(/[\s,]+/).filter((w) => w.length > 3);
  const ceiling = budgetCeiling(lead.budget);

  const scored = packages.map((pkg) => {
    const haystack = `${pkg.title} ${pkg.description ?? ''} ${pkg.best_for ?? ''}`.toLowerCase();
    const reasons: string[] = [];
    let score = 0;
    let matchesDestination = false;

    if (destination && haystack.includes(destination)) {
      score += 50;
      matchesDestination = true;
      reasons.push(`Covers ${lead.destination}`);
    } else {
      for (const word of words) {
        if (haystack.includes(word)) {
          score += 15;
          matchesDestination = true;
          reasons.push(`Mentions "${word}"`);
          break;
        }
      }
    }

    if (ceiling && pkg.price_inr) {
      if (pkg.price_inr <= ceiling) {
        score += 15;
        reasons.push(`Within a ${lead.budget} budget`);
      } else if (pkg.price_inr <= ceiling * 1.3) {
        score += 6;
        reasons.push('Slightly above stated budget');
      }
    }

    if (lead.travel_type && (pkg.best_for ?? '').toLowerCase().includes(lead.travel_type.toLowerCase())) {
      score += 10;
      reasons.push(`Suited to ${lead.travel_type} travel`);
    }

    if (lead.duration_days && pkg.duration) {
      const nights = pkg.duration.match(/(\d+)\s*Night/i);
      if (nights) {
        const pkgDays = parseInt(nights[1], 10) + 1;
        const diff = Math.abs(pkgDays - lead.duration_days);
        if (diff <= 1) {
          score += 10;
          reasons.push(`Matches ${lead.duration_days}-day trip length`);
        } else if (diff <= 3) {
          score += 4;
          reasons.push('Similar trip length');
        }
      }
    }

    return { package: pkg, score, reasons, matchesDestination };
  });

  // A destination match is mandatory, not merely weighted. Budget and party
  // fit reorder packages that already cover the right place — on their own
  // they would surface Tirupati for a Kerala enquiry, which is noise a
  // salesperson has to filter out by hand. Returning one good suggestion, or
  // none, beats returning three where two are wrong.
  return scored
    .filter((s) => s.matchesDestination)
    .sort((a, b) => b.score - a.score)
    .map(({ package: pkg, score, reasons }) => ({ package: pkg, score, reasons }));
}

export async function recommendForLead(
  lead: Pick<LeadRow, 'destination' | 'budget' | 'travellers' | 'travel_type' | 'duration_days'>,
  limit = 3
): Promise<Recommendation[]> {
  const packages = await allPackages();
  return scorePackagesForLead(packages, lead).slice(0, limit);
}

/**
 * Destinations that co-occur with this one across WON leads.
 *
 * Returns nothing until real outcomes exist, which is fine — the content
 * scoring above carries the feature until then. This is the collaborative
 * signal the plan reserved space for.
 */
export async function coBookedDestinations(
  destination: string,
  limit = 5
): Promise<{ destination: string; count: number }[]> {
  const { rows } = await getPool().query<{ destination: string; count: string }>(
    `SELECT destination, count(*)::text AS count
     FROM leads
     WHERE status = 'won'
       AND destination IS NOT NULL
       AND lower(destination) <> lower($1)
     GROUP BY destination
     ORDER BY count(*) DESC
     LIMIT $2`,
    [destination, limit]
  );
  return rows.map((r) => ({ destination: r.destination, count: Number(r.count) }));
}
