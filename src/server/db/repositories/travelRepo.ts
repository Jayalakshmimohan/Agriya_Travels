import { getPool } from '../client';

/**
 * SQL retrieval over the travel inventory.
 *
 * Everything a customer could hold us to — fares, dates, seats, quotas, prices
 * — is fetched here as exact rows. Nothing in this file is generated or
 * inferred; the LLM never sees a number it did not receive from these queries.
 */

export interface DestinationRow {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  state: string | null;
  destination_type: string | null;
  description: string | null;
  data_source: string;
}

export interface TransportOption {
  route_id: string;
  schedule_id: string;
  service_number: string | null;
  service_name: string | null;
  service_class_family: string | null;
  mode: string;
  origin_code: string;
  origin_name: string;
  dest_code: string;
  dest_name: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number | null;
  class_code: string;
  class_name: string | null;
  fare_inr: string;
  available_seats: number | null;
  status: string;
  route_source: string;
  availability_source: string;
  confidence: string;
}

export interface FoodOption {
  id: string;
  provider_name: string;
  provider_type: string;
  meal_type: string;
  diet_type: string;
  cuisine: string | null;
  price_inr: string;
  description: string | null;
  data_source: string;
  on_route: boolean;
}

export interface DarshanOption {
  darshan_type_id: string;
  temple_name: string;
  name: string;
  code: string | null;
  price_inr: string;
  booking_mode: string | null;
  typical_duration_minutes: number | null;
  eligibility: string | null;
  notes: string | null;
  slot_start: string | null;
  quota_available: number | null;
  type_source: string;
  availability_source: string | null;
  confidence: string | null;
}

export interface AccommodationOption {
  hotel_id: string;
  room_type_id: string;
  hotel_name: string;
  hotel_type: string | null;
  category: number | null;
  star_rating: string | null;
  room_name: string;
  max_occupancy: number;
  price_per_night_inr: string;
  rooms_available: number | null;
  distance_to_landmark_km: string | null;
  landmark_name: string | null;
  data_source: string;
  confidence: string;
}

export interface FeeRow {
  kind: string;
  label: string;
  amount_inr: string | null;
  percent: string | null;
}

/** Resolve free text to a destination. Exact slug/name first, then prefix. */
export async function findDestination(text: string): Promise<DestinationRow | null> {
  const needle = text.trim().toLowerCase();
  if (!needle) return null;

  const { rows } = await getPool().query<DestinationRow>(
    `SELECT id, slug, name, city, state, destination_type, description, data_source
     FROM destinations
     WHERE slug = $1 OR lower(name) = $1 OR lower(city) = $1
     LIMIT 1`,
    [needle]
  );
  if (rows[0]) return rows[0];

  const { rows: fuzzy } = await getPool().query<DestinationRow>(
    `SELECT id, slug, name, city, state, destination_type, description, data_source
     FROM destinations
     WHERE lower(name) LIKE $1 OR lower(city) LIKE $1
     ORDER BY popularity_rank NULLS LAST
     LIMIT 1`,
    [`${needle}%`]
  );
  return fuzzy[0] ?? null;
}

/**
 * Transport between two destinations on a date.
 *
 * The date filter is two-stage and both stages matter: `operating_days` says
 * the service runs that weekday at all, and the availability join says we hold
 * inventory for that specific date. Skipping either invents a departure.
 */
export async function findTransport(params: {
  originDestinationId: string;
  destDestinationId: string;
  travelDate: string;
  mode?: string | null;
  preference?: string | null;
}): Promise<TransportOption[]> {
  const dow = new Date(params.travelDate + 'T00:00:00Z').getUTCDay();
  const isoDow = dow === 0 ? 7 : dow;
  const preference = params.preference?.toLowerCase().replace(/[\s-]+/g, '_') ?? null;

  const { rows } = await getPool().query<TransportOption>(
    `SELECT r.id AS route_id, s.id AS schedule_id,
            r.service_number, r.service_name, r.service_class_family, r.mode,
            os.code AS origin_code, os.name AS origin_name,
            ds.code AS dest_code, ds.name AS dest_name,
            s.departure_time, s.arrival_time, s.duration_minutes,
            a.class_code, tc.class_name, a.fare_inr, a.available_seats, a.status,
            r.data_source AS route_source,
            a.data_source AS availability_source,
            a.confidence
     FROM transport_routes r
     JOIN transport_stations os ON os.id = r.origin_station_id
     JOIN transport_stations ds ON ds.id = r.dest_station_id
     JOIN transport_schedules s ON s.route_id = r.id
     JOIN transport_availability a ON a.schedule_id = s.id AND a.travel_date = $3
     LEFT JOIN transport_classes tc ON tc.route_id = r.id AND tc.class_code = a.class_code
     WHERE os.destination_id = $1
       AND ds.destination_id = $2
       AND $4 = ANY(s.operating_days)
       AND (s.valid_from IS NULL OR s.valid_from <= $3::date)
       AND (s.valid_to   IS NULL OR s.valid_to   >= $3::date)
       AND ($5::text IS NULL OR r.mode = $5)
     ORDER BY
       CASE WHEN $6::text IS NOT NULL
                 AND (r.service_class_family = $6 OR lower(r.service_name) LIKE '%' || $6 || '%')
            THEN 0 ELSE 1 END,
       a.fare_inr ASC`,
    [
      params.originDestinationId,
      params.destDestinationId,
      params.travelDate,
      isoDow,
      params.mode ?? null,
      preference,
    ]
  );
  return rows;
}

/** Meals, both onboard the chosen service and at the destination. */
export async function findFood(params: {
  destinationId?: string | null;
  routeId?: string | null;
  dietType?: string | null;
}): Promise<FoodOption[]> {
  const { rows } = await getPool().query<FoodOption>(
    `SELECT id, provider_name, provider_type, meal_type, diet_type, cuisine,
            price_inr, description, data_source,
            (available_on_route_id IS NOT NULL) AS on_route
     FROM food_options
     WHERE ( ($1::bigint IS NOT NULL AND destination_id = $1)
          OR ($2::bigint IS NOT NULL AND available_on_route_id = $2) )
       AND ($3::text IS NULL OR diet_type = $3)
     ORDER BY (available_on_route_id IS NOT NULL) DESC, price_inr ASC`,
    [params.destinationId ?? null, params.routeId ?? null, params.dietType ?? null]
  );
  return rows;
}

/** Darshan types with that date's slots. LEFT JOIN so walk-in types still show. */
export async function findDarshan(params: {
  destinationId: string;
  date: string;
}): Promise<DarshanOption[]> {
  const { rows } = await getPool().query<DarshanOption>(
    `SELECT dt.id AS darshan_type_id, te.name AS temple_name, dt.name, dt.code,
            dt.price_inr, dt.booking_mode, dt.typical_duration_minutes,
            dt.eligibility, dt.notes,
            da.slot_start, da.quota_available,
            dt.data_source AS type_source,
            da.data_source AS availability_source,
            da.confidence
     FROM darshan_types dt
     JOIN temples te ON te.id = dt.temple_id
     LEFT JOIN darshan_availability da
       ON da.darshan_type_id = dt.id AND da.slot_date = $2
     WHERE te.destination_id = $1
       AND (da.id IS NULL OR da.quota_available > 0)
     ORDER BY dt.price_inr ASC, da.slot_start ASC`,
    [params.destinationId, params.date]
  );
  return rows;
}

export async function findAccommodation(params: {
  destinationId: string;
  stayDate: string;
  travellers?: number | null;
  maxPricePerNight?: number | null;
  limit?: number;
}): Promise<AccommodationOption[]> {
  const { rows } = await getPool().query<AccommodationOption>(
    `SELECT h.id AS hotel_id, rt.id AS room_type_id, h.name AS hotel_name,
            h.hotel_type, h.category, h.star_rating,
            rt.name AS room_name, rt.max_occupancy,
            ha.price_per_night_inr, ha.rooms_available,
            h.distance_to_landmark_km, h.landmark_name,
            ha.data_source, ha.confidence
     FROM hotel_availability ha
     JOIN hotel_room_types rt ON rt.id = ha.room_type_id
     JOIN hotels h ON h.id = rt.hotel_id
     WHERE h.destination_id = $1
       AND ha.stay_date = $2
       AND ha.rooms_available > 0
       AND ($3::int IS NULL OR rt.max_occupancy >= LEAST($3, 4))
       AND ($4::numeric IS NULL OR ha.price_per_night_inr <= $4)
     ORDER BY ha.price_per_night_inr ASC
     LIMIT $5`,
    [
      params.destinationId,
      params.stayDate,
      params.travellers ?? null,
      params.maxPricePerNight ?? null,
      params.limit ?? 5,
    ]
  );
  return rows;
}

/** Packages the agency already sells for this destination. */
export async function findPackagesForDestination(destinationId: string) {
  const { rows } = await getPool().query(
    `SELECT id, title, category, duration, best_for, starting_price, price_inr,
            description, data_source, is_composable
     FROM packages
     WHERE destination_id = $1 AND status = 'active'
     ORDER BY price_inr NULLS LAST`,
    [destinationId]
  );
  return rows;
}

export async function getGlobalFees(): Promise<FeeRow[]> {
  const { rows } = await getPool().query<FeeRow>(
    `SELECT kind, label, amount_inr, percent
     FROM price_components
     WHERE owner_type = 'global' AND active = true
     ORDER BY sort_order`
  );
  return rows;
}

/** Temple guidance text — the closest thing to a RAG answer we have today. */
export async function getTempleGuidance(destinationId: string) {
  const { rows } = await getPool().query<{
    name: string; dress_code: string | null;
    general_guidelines: string | null; official_url: string | null;
    data_source: string;
  }>(
    `SELECT name, dress_code, general_guidelines, official_url, data_source
     FROM temples WHERE destination_id = $1 LIMIT 1`,
    [destinationId]
  );
  return rows[0] ?? null;
}
