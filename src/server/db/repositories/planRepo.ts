import { getPool } from '../client';

export interface TripPlanRow {
  id: string;
  lead_id: string | null;
  request: unknown;
  plan: unknown;
  model: string | null;
  grounded_package_ids: string[];
  token_usage: unknown | null;
  is_fallback: boolean;
  created_at: Date;
}

export interface InsertTripPlanArgs {
  leadId?: string | number | null;
  request: unknown;
  plan: unknown;
  model: string | null;
  groundedPackageIds: string[];
  tokenUsage?: unknown;
  isFallback?: boolean;
}

export async function insertTripPlan(
  args: InsertTripPlanArgs
): Promise<TripPlanRow> {
  const { rows } = await getPool().query<TripPlanRow>(
    `INSERT INTO trip_plans
       (lead_id, request, plan, model, grounded_package_ids, token_usage, is_fallback)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      args.leadId ?? null,
      JSON.stringify(args.request),
      JSON.stringify(args.plan),
      args.model,
      args.groundedPackageIds,
      args.tokenUsage ? JSON.stringify(args.tokenUsage) : null,
      args.isFallback ?? false,
    ]
  );
  return rows[0];
}

export async function listPlansForLead(
  leadId: string | number
): Promise<TripPlanRow[]> {
  const { rows } = await getPool().query<TripPlanRow>(
    'SELECT * FROM trip_plans WHERE lead_id = $1 ORDER BY created_at DESC',
    [leadId]
  );
  return rows;
}
