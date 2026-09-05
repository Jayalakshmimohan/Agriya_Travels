import type { PoolClient } from 'pg';
import { getPool } from '../client';

export type LeadEventType =
  | 'created'
  | 'scored'
  | 'contacted'
  | 'status_changed'
  | 'plan_generated'
  | 'note';

export interface LeadEventRow {
  id: string;
  lead_id: string;
  type: LeadEventType;
  payload: unknown | null;
  created_at: Date;
}

type Executor = Pick<PoolClient, 'query'>;
const exec = (client?: Executor): Executor => client ?? getPool();

export async function appendEvent(
  leadId: string | number,
  type: LeadEventType,
  payload: unknown = null,
  client?: Executor
): Promise<void> {
  await exec(client).query(
    `INSERT INTO lead_events (lead_id, type, payload) VALUES ($1, $2, $3)`,
    [leadId, type, payload === null ? null : JSON.stringify(payload)]
  );
}

export async function listEventsForLead(
  leadId: string | number
): Promise<LeadEventRow[]> {
  const { rows } = await getPool().query<LeadEventRow>(
    `SELECT * FROM lead_events WHERE lead_id = $1 ORDER BY created_at DESC`,
    [leadId]
  );
  return rows;
}
