import { Pool } from 'pg';
import type { PoolClient, QueryResultRow } from 'pg';

let pool: Pool | null = null;

/**
 * Created on first use, not at import time. server.ts calls dotenv.config()
 * *after* its imports evaluate, so reading process.env at module load would
 * see an undefined DATABASE_URL. Lazy init sidesteps that ordering trap.
 */
export function getPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Add it to your .env file.');
  }

  pool = new Pool({
    connectionString,
    ssl: true,                      // Neon rejects unencrypted connections
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  // A pool-level error must never take the process down.
  pool.on('error', (err) => {
    console.error('Unexpected Postgres pool error:', err);
  });

  return pool;
}

/** Run a parameterised query and return the rows. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await getPool().query<T>(sql, params);
  return result.rows;
}

/** Same, for queries expecting at most one row. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Run several statements atomically — all succeed or none do. */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
