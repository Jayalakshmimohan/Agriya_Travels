import { getPool } from '../db/client';
import { generateWithFallback, hasGeminiKey } from '../ai/gemini';

export interface DemandRow {
  destination: string;
  enquiries: number;
  avgTravellers: number;
  lastEnquiry: string;
}

export interface InsightsData {
  totals: {
    leads: number;
    contactable: number;
    newLeads: number;
    won: number;
    plansGenerated: number;
  };
  bySource: { source: string; count: number }[];
  byStatus: { status: string; count: number }[];
  topDestinations: DemandRow[];
  byMonth: { month: string; count: number }[];
  unservedDestinations: string[];
}

/** Every aggregate the dashboard shows, in one round trip each. */
export async function collectInsights(): Promise<InsightsData> {
  const pool = getPool();

  const [totals, bySource, byStatus, topDestinations, byMonth, unserved] =
    await Promise.all([
      pool.query(`
        SELECT
          (SELECT count(*) FROM leads)::int AS leads,
          (SELECT count(*) FROM leads WHERE phone IS NOT NULL OR email IS NOT NULL)::int AS contactable,
          (SELECT count(*) FROM leads WHERE status = 'new')::int AS new_leads,
          (SELECT count(*) FROM leads WHERE status = 'won')::int AS won,
          (SELECT count(*) FROM trip_plans)::int AS plans
      `),
      pool.query(`SELECT source, count(*)::int AS count FROM leads GROUP BY source ORDER BY count DESC`),
      pool.query(`SELECT status, count(*)::int AS count FROM leads GROUP BY status ORDER BY count DESC`),
      pool.query(`
        SELECT destination,
               count(*)::int AS enquiries,
               round(avg(travellers))::int AS avg_travellers,
               max(created_at) AS last_enquiry
        FROM leads
        WHERE destination IS NOT NULL AND destination <> ''
        GROUP BY destination
        ORDER BY count(*) DESC, max(created_at) DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT to_char(date_trunc('month', created_at), 'Mon YYYY') AS month,
               count(*)::int AS count
        FROM leads
        GROUP BY date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at)
      `),
      // Destinations people ask about that no package covers — the gap
      // between what the agency sells and what the market wants.
      pool.query(`
        SELECT DISTINCT l.destination
        FROM leads l
        WHERE l.destination IS NOT NULL AND l.destination <> ''
          AND NOT EXISTS (
            SELECT 1 FROM packages p
            WHERE lower(p.title) LIKE '%' || lower(l.destination) || '%'
               OR lower(coalesce(p.description,'')) LIKE '%' || lower(l.destination) || '%'
          )
        LIMIT 10
      `),
    ]);

  const t = totals.rows[0];

  return {
    totals: {
      leads: t.leads,
      contactable: t.contactable,
      newLeads: t.new_leads,
      won: t.won,
      plansGenerated: t.plans,
    },
    bySource: bySource.rows,
    byStatus: byStatus.rows,
    topDestinations: topDestinations.rows.map((r) => ({
      destination: r.destination,
      enquiries: r.enquiries,
      avgTravellers: r.avg_travellers ?? 0,
      lastEnquiry: r.last_enquiry,
    })),
    byMonth: byMonth.rows,
    unservedDestinations: unserved.rows.map((r) => r.destination),
  };
}

const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Turns the aggregates into plain English. Cached in ai_insights so opening
 * the dashboard doesn't spend a Gemini call every time.
 */
export async function narrateInsights(data: InsightsData): Promise<string | null> {
  if (!hasGeminiKey()) return null;
  if (data.totals.leads === 0) return null;

  const pool = getPool();
  const period = new Date().toISOString().slice(0, 10);

  const cached = await pool.query<{ narration: string; generated_at: Date }>(
    `SELECT narration, generated_at FROM ai_insights WHERE kind = 'dashboard' AND period = $1`,
    [period]
  );
  const hit = cached.rows[0];
  if (hit && Date.now() - hit.generated_at.getTime() < CACHE_TTL_MS) {
    return hit.narration;
  }

  try {
    const { text: narrationText, model: usedModel } = await generateWithFallback({
      contents: `You advise the owner of Agriya Travels, a Chennai travel agency.

Here is their enquiry data:
${JSON.stringify(data, null, 2)}

Write 3 to 5 short bullet points telling the owner what to DO about this.
Be specific and commercial: name destinations, point out gaps between demand
and the packages they sell, and flag anything being neglected. If the dataset
is too small to draw conclusions, say so plainly instead of inventing trends.
Plain text bullets starting with "- ". No preamble.`,
    });

    const narration = narrationText.trim() || null;
    if (!narration) return null;

    await pool.query(
      `INSERT INTO ai_insights (kind, period, data, narration, model)
       VALUES ('dashboard', $1, $2, $3, $4)
       ON CONFLICT (kind, period) DO UPDATE
         SET data = EXCLUDED.data,
             narration = EXCLUDED.narration,
             model = EXCLUDED.model,
             generated_at = now()`,
      [period, JSON.stringify(data), narration, usedModel]
    );

    return narration;
  } catch (err) {
    console.warn('Insight narration unavailable:', (err as Error).message);
    return hit?.narration ?? null;
  }
}
