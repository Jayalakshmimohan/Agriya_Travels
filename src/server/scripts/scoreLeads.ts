import 'dotenv/config';
import { listLeads } from '../db/repositories/leadRepo';
import { scoreLead } from '../services/scoringService';
import { closePool, getPool } from '../db/client';

/**
 * Scores leads that have no score yet — for leads captured before the
 * scoring service existed, or any the background scorer missed.
 *
 * Pass --all to re-score everything, e.g. after changing the rules.
 */
async function main() {
  const rescoreAll = process.argv.includes('--all');

  const { rows } = await getPool().query<{ id: string }>(
    rescoreAll
      ? 'SELECT id FROM leads ORDER BY id'
      : 'SELECT id FROM leads WHERE score IS NULL ORDER BY id'
  );

  if (rows.length === 0) {
    console.log('Nothing to score.');
    return;
  }

  console.log(`Scoring ${rows.length} lead(s)${rescoreAll ? ' (full re-score)' : ''}...`);

  const all = await listLeads({ limit: 200 });
  const wanted = new Set(rows.map((r) => r.id));

  let done = 0;
  for (const lead of all) {
    if (!wanted.has(lead.id)) continue;
    await scoreLead(lead);
    done++;
    process.stdout.write(`  #${lead.id} `);
  }

  console.log(`\nScored ${done} lead(s).`);
}

main()
  .catch((err) => {
    console.error('\nScoring run failed:\n', err);
    process.exit(1);
  })
  .finally(closePool);
