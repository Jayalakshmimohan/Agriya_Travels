import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { getPool, closePool } from './client';

const MIGRATIONS_DIR = path.join(process.cwd(), 'src', 'server', 'db', 'migrations');

async function main() {
  const pool = getPool();

  // A tiny table whose only job is remembering what has already run.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await pool.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations'
  );
  const applied = new Set(rows.map((r) => r.filename));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log(`No .sql files found in ${MIGRATIONS_DIR}`);
    return;
  }

  let ran = 0;

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  skip   ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8').trim();
    if (!sql) {
      throw new Error(`${file} is empty — did you save the file?`);
    }

    console.log(`  apply  ${file}`);
    const client = await pool.connect();
    try {
      // The .sql file manages its own BEGIN/COMMIT.
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      );
      ran++;
    } finally {
      client.release();
    }
  }

  console.log(ran === 0 ? 'Already up to date.' : `Applied ${ran} migration(s).`);
}

main()
  .catch((err) => {
    console.error('\nMigration failed:\n', err);
    process.exit(1);
  })
  .finally(closePool);
