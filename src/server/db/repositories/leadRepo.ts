import type { PoolClient } from 'pg';
import { getPool } from '../client';
import type { LeadInput } from '../../schemas/lead';

export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost';

export interface LeadRow {
  id: string;
  created_at: Date;
  updated_at: Date;
  source: string;
  focus: string | null;
  page_path: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  destination: string | null;
  starting_city: string | null;
  travel_date: Date | null;
  travellers: number | null;
  duration_days: number | null;
  budget: string | null;
  travel_type: string | null;
  hotel_preference: string | null;
  vehicle_type: string | null;
  trip_type: string | null;
  pickup_location: string | null;
  pickup_time: string | null;
  message: string | null;
  score: number | null;
  score_breakdown: unknown | null;
  ai_summary: string | null;
  status: LeadStatus;
}

/** Lets a call run either on the pool or inside an open transaction. */
type Executor = Pick<PoolClient, 'query'>;
const exec = (client?: Executor): Executor => client ?? getPool();

export async function insertLead(
  input: LeadInput,
  client?: Executor
): Promise<LeadRow> {
  const { rows } = await exec(client).query<LeadRow>(
    `INSERT INTO leads (
       source, focus, page_path,
       name, phone, email,
       destination, starting_city, travel_date, travellers, duration_days,
       budget, travel_type, hotel_preference,
       vehicle_type, trip_type, pickup_location, pickup_time,
       message
     ) VALUES (
       $1, $2, $3,
       $4, $5, $6,
       $7, $8, $9, $10, $11,
       $12, $13, $14,
       $15, $16, $17, $18,
       $19
     )
     RETURNING *`,
    [
      input.source,
      input.focus ?? null,
      input.pagePath ?? null,
      input.name ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.destination ?? null,
      input.startingCity ?? null,
      input.travelDate ?? null,
      input.travellers ?? null,
      input.durationDays ?? null,
      input.budget ?? null,
      input.travelType ?? null,
      input.hotelPreference ?? null,
      input.vehicleType ?? null,
      input.tripType ?? null,
      input.pickupLocation ?? null,
      input.pickupTime ?? null,
      input.message ?? null,
    ]
  );
  return rows[0];
}

export async function findLeadById(id: string | number): Promise<LeadRow | null> {
  const { rows } = await getPool().query<LeadRow>(
    'SELECT * FROM leads WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

export interface ListLeadsFilters {
  status?: LeadStatus;
  source?: string;
  destination?: string;
  limit?: number;
  offset?: number;
}

export async function listLeads(filters: ListLeadsFilters = {}): Promise<LeadRow[]> {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    params.push(filters.status);
    where.push(`status = $${params.length}`);
  }
  if (filters.source) {
    params.push(filters.source);
    where.push(`source = $${params.length}`);
  }
  if (filters.destination) {
    params.push(`%${filters.destination.toLowerCase()}%`);
    where.push(`lower(destination) LIKE $${params.length}`);
  }

  params.push(Math.min(filters.limit ?? 50, 200));
  const limitParam = `$${params.length}`;
  params.push(filters.offset ?? 0);
  const offsetParam = `$${params.length}`;

  const { rows } = await getPool().query<LeadRow>(
    `SELECT * FROM leads
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY score DESC NULLS LAST, created_at DESC
     LIMIT ${limitParam} OFFSET ${offsetParam}`,
    params
  );
  return rows;
}

export async function updateLeadStatus(
  id: string | number,
  status: LeadStatus
): Promise<LeadRow | null> {
  const { rows } = await getPool().query<LeadRow>(
    `UPDATE leads SET status = $2, updated_at = now()
     WHERE id = $1 RETURNING *`,
    [id, status]
  );
  return rows[0] ?? null;
}

export async function updateLeadScore(
  id: string | number,
  score: number,
  breakdown: unknown,
  summary: string | null
): Promise<void> {
  await getPool().query(
    `UPDATE leads
     SET score = $2, score_breakdown = $3, ai_summary = $4, updated_at = now()
     WHERE id = $1`,
    [id, score, JSON.stringify(breakdown), summary]
  );
}
