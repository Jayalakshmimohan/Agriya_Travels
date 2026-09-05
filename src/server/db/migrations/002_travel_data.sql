-- Travel data platform: structured inventory the AI assistant retrieves over.
--
-- Design rules encoded here:
--  1. Every row declares where it came from (data_source). Synthetic inventory
--     must never be presentable as confirmed real-world availability.
--  2. Definitions are separate from date-specific inventory. A schedule says
--     "runs Mon-Sat at 06:10"; availability says "on 2026-09-07 there were 42
--     seats at Rs.690". Without that split you cannot answer "on September 7"
--     without inventing data.
--  3. Anything the cost engine or the recommendation scorer reads is a column,
--     never JSON. A price inside JSONB cannot be indexed, constrained or summed
--     reliably. JSON is only for unordered tag sets nobody joins on.
--  4. Money is NUMERIC. Never float.

BEGIN;

-- ============================================================
-- Provenance
-- ============================================================
DO $$ BEGIN
  CREATE TYPE data_source AS ENUM (
    'REAL_VERIFIED',      -- authoritative source, manually checked
    'REAL_PUBLIC',        -- open data (Wikidata, data.gov.in, OSM)
    'SYNTHETIC',          -- generated; realistic but NOT real-world
    'DEMO',               -- hand-crafted for demonstration
    'CLIENT_PROVIDED',    -- Agriya's own business data
    'EXTERNAL_PROVIDER'   -- live from a partner API (Phase 3)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Confidence travels with inventory rows and degrades to the weakest link
-- when components are combined into a quote.
DO $$ BEGIN
  CREATE TYPE availability_confidence AS ENUM (
    'CONFIRMED',      -- live-checked with a provider
    'INDICATIVE',     -- real schedule and published fare, availability unverified
    'ILLUSTRATIVE'    -- synthetic/demo; must be disclosed as such
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Destinations
-- ============================================================
CREATE TABLE IF NOT EXISTS destinations (
  id                BIGSERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  city              TEXT,
  state             TEXT,
  country           TEXT NOT NULL DEFAULT 'India',
  latitude          NUMERIC(9,6),
  longitude         NUMERIC(9,6),
  destination_type  TEXT CHECK (destination_type IN
                      ('pilgrimage','hill_station','beach','heritage','metro',
                       'wildlife','adventure','other')),
  description       TEXT,
  popularity_rank   INTEGER,
  best_months       TEXT[] NOT NULL DEFAULT '{}',
  tags              JSONB NOT NULL DEFAULT '[]',
  data_source       data_source NOT NULL,
  source_reference  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS destinations_name_idx ON destinations (lower(name));
CREATE INDEX IF NOT EXISTS destinations_type_idx ON destinations (destination_type);

-- ============================================================
-- Transport
-- ============================================================
CREATE TABLE IF NOT EXISTS transport_operators (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  code         TEXT,
  mode         TEXT NOT NULL CHECK (mode IN ('train','flight','bus','cab')),
  data_source  data_source NOT NULL,
  UNIQUE (name, mode)
);

-- Stations are distinct from destinations: Chennai has MAS, MSB and TBM.
CREATE TABLE IF NOT EXISTS transport_stations (
  id              BIGSERIAL PRIMARY KEY,
  destination_id  BIGINT REFERENCES destinations(id) ON DELETE SET NULL,
  code            TEXT NOT NULL,
  name            TEXT NOT NULL,
  mode            TEXT NOT NULL CHECK (mode IN ('train','flight','bus')),
  latitude        NUMERIC(9,6),
  longitude       NUMERIC(9,6),
  data_source     data_source NOT NULL,
  UNIQUE (code, mode)
);

CREATE INDEX IF NOT EXISTS stations_destination_idx ON transport_stations (destination_id);

CREATE TABLE IF NOT EXISTS transport_routes (
  id                    BIGSERIAL PRIMARY KEY,
  operator_id           BIGINT REFERENCES transport_operators(id) ON DELETE SET NULL,
  mode                  TEXT NOT NULL CHECK (mode IN
                          ('train','flight','bus','cab','private_vehicle')),
  service_number        TEXT,
  service_name          TEXT,
  -- Lets "Vande Bharat" in free text resolve without string-matching titles.
  service_class_family  TEXT,
  origin_station_id     BIGINT NOT NULL REFERENCES transport_stations(id) ON DELETE CASCADE,
  dest_station_id       BIGINT NOT NULL REFERENCES transport_stations(id) ON DELETE CASCADE,
  distance_km           INTEGER,
  data_source           data_source NOT NULL,
  source_reference      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (service_number, origin_station_id, dest_station_id)
);

CREATE INDEX IF NOT EXISTS routes_od_idx ON transport_routes (origin_station_id, dest_station_id);
CREATE INDEX IF NOT EXISTS routes_family_idx ON transport_routes (service_class_family);
CREATE INDEX IF NOT EXISTS routes_name_idx ON transport_routes (lower(service_name));

CREATE TABLE IF NOT EXISTS transport_schedules (
  id                BIGSERIAL PRIMARY KEY,
  route_id          BIGINT NOT NULL REFERENCES transport_routes(id) ON DELETE CASCADE,
  departure_time    TIME NOT NULL,
  arrival_time      TIME NOT NULL,
  duration_minutes  INTEGER,
  -- ISO day-of-week: 1 = Monday .. 7 = Sunday
  operating_days    SMALLINT[] NOT NULL,
  valid_from        DATE,
  valid_to          DATE,
  data_source       data_source NOT NULL
);

CREATE INDEX IF NOT EXISTS schedules_route_idx ON transport_schedules (route_id);

CREATE TABLE IF NOT EXISTS transport_classes (
  id             BIGSERIAL PRIMARY KEY,
  route_id       BIGINT NOT NULL REFERENCES transport_routes(id) ON DELETE CASCADE,
  class_code     TEXT NOT NULL,
  class_name     TEXT,
  base_fare_inr  NUMERIC(10,2) NOT NULL CHECK (base_fare_inr >= 0),
  data_source    data_source NOT NULL,
  UNIQUE (route_id, class_code)
);

CREATE TABLE IF NOT EXISTS transport_availability (
  id                BIGSERIAL PRIMARY KEY,
  schedule_id       BIGINT NOT NULL REFERENCES transport_schedules(id) ON DELETE CASCADE,
  class_code        TEXT NOT NULL,
  travel_date       DATE NOT NULL,
  total_seats       INTEGER CHECK (total_seats >= 0),
  available_seats   INTEGER CHECK (available_seats >= 0),
  fare_inr          NUMERIC(10,2) NOT NULL CHECK (fare_inr >= 0),
  status            TEXT NOT NULL CHECK (status IN
                      ('AVAILABLE','WAITLIST','RAC','SOLD_OUT','UNKNOWN')),
  data_source       data_source NOT NULL,
  confidence        availability_confidence NOT NULL DEFAULT 'ILLUSTRATIVE',
  UNIQUE (schedule_id, class_code, travel_date)
);

CREATE INDEX IF NOT EXISTS transport_avail_date_idx
  ON transport_availability (travel_date, schedule_id);

-- ============================================================
-- Accommodation
-- ============================================================
CREATE TABLE IF NOT EXISTS hotels (
  id                       BIGSERIAL PRIMARY KEY,
  destination_id           BIGINT NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  name                     TEXT NOT NULL,
  address                  TEXT,
  latitude                 NUMERIC(9,6),
  longitude                NUMERIC(9,6),
  category                 SMALLINT CHECK (category BETWEEN 1 AND 5),
  hotel_type               TEXT CHECK (hotel_type IN
                             ('hotel','guesthouse','dharamshala','resort','lodge','homestay')),
  star_rating              NUMERIC(2,1) CHECK (star_rating BETWEEN 0 AND 5),
  review_count             INTEGER DEFAULT 0,
  amenities                JSONB NOT NULL DEFAULT '[]',
  check_in_time            TIME,
  check_out_time           TIME,
  distance_to_landmark_km  NUMERIC(6,2),
  landmark_name            TEXT,
  cancellation_policy      TEXT,
  data_source              data_source NOT NULL,
  source_reference         TEXT
);

CREATE INDEX IF NOT EXISTS hotels_destination_idx ON hotels (destination_id, category);

CREATE TABLE IF NOT EXISTS hotel_room_types (
  id                        BIGSERIAL PRIMARY KEY,
  hotel_id                  BIGINT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name                      TEXT NOT NULL,
  max_occupancy             SMALLINT NOT NULL DEFAULT 2 CHECK (max_occupancy > 0),
  bed_config                TEXT,
  base_price_per_night_inr  NUMERIC(10,2) NOT NULL CHECK (base_price_per_night_inr >= 0),
  data_source               data_source NOT NULL
);

CREATE INDEX IF NOT EXISTS room_types_hotel_idx ON hotel_room_types (hotel_id);

CREATE TABLE IF NOT EXISTS hotel_availability (
  id                   BIGSERIAL PRIMARY KEY,
  room_type_id         BIGINT NOT NULL REFERENCES hotel_room_types(id) ON DELETE CASCADE,
  stay_date            DATE NOT NULL,
  rooms_total          INTEGER CHECK (rooms_total >= 0),
  rooms_available      INTEGER CHECK (rooms_available >= 0),
  price_per_night_inr  NUMERIC(10,2) NOT NULL CHECK (price_per_night_inr >= 0),
  data_source          data_source NOT NULL,
  confidence           availability_confidence NOT NULL DEFAULT 'ILLUSTRATIVE',
  UNIQUE (room_type_id, stay_date)
);

CREATE INDEX IF NOT EXISTS hotel_avail_date_idx ON hotel_availability (stay_date, room_type_id);

-- ============================================================
-- Food
-- ============================================================
CREATE TABLE IF NOT EXISTS food_options (
  id                     BIGSERIAL PRIMARY KEY,
  destination_id         BIGINT REFERENCES destinations(id) ON DELETE CASCADE,
  -- Set for onboard catering, so "food for the journey" resolves to the train
  -- the traveller is actually on rather than a restaurant at the destination.
  available_on_route_id  BIGINT REFERENCES transport_routes(id) ON DELETE CASCADE,
  provider_name          TEXT NOT NULL,
  provider_type          TEXT NOT NULL CHECK (provider_type IN
                           ('restaurant','onboard_catering','hotel','package_meal','tiffin')),
  meal_type              TEXT NOT NULL CHECK (meal_type IN
                           ('breakfast','lunch','dinner','snack','combo')),
  cuisine                TEXT,
  diet_type              TEXT NOT NULL CHECK (diet_type IN
                           ('veg','non_veg','jain','vegan','satvik')),
  price_inr              NUMERIC(8,2) NOT NULL CHECK (price_inr >= 0),
  serves_count           SMALLINT NOT NULL DEFAULT 1 CHECK (serves_count > 0),
  description            TEXT,
  latitude               NUMERIC(9,6),
  longitude              NUMERIC(9,6),
  data_source            data_source NOT NULL,
  CHECK (destination_id IS NOT NULL OR available_on_route_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS food_dest_idx ON food_options (destination_id, meal_type, diet_type);
CREATE INDEX IF NOT EXISTS food_route_idx ON food_options (available_on_route_id);

-- ============================================================
-- Darshan / religious services
-- ============================================================
CREATE TABLE IF NOT EXISTS temples (
  id                  BIGSERIAL PRIMARY KEY,
  destination_id      BIGINT NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  deity               TEXT,
  managing_body       TEXT,
  latitude            NUMERIC(9,6),
  longitude           NUMERIC(9,6),
  dress_code          TEXT,
  general_guidelines  TEXT,
  official_url        TEXT,
  data_source         data_source NOT NULL,
  source_reference    TEXT
);

CREATE INDEX IF NOT EXISTS temples_destination_idx ON temples (destination_id);

CREATE TABLE IF NOT EXISTS darshan_types (
  id                        BIGSERIAL PRIMARY KEY,
  temple_id                 BIGINT NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
  name                      TEXT NOT NULL,
  code                      TEXT,
  price_inr                 NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (price_inr >= 0),
  typical_duration_minutes  INTEGER,
  booking_mode              TEXT CHECK (booking_mode IN
                              ('online_quota','offline_only','walk_in','tatkal')),
  eligibility               TEXT,
  restrictions              JSONB NOT NULL DEFAULT '[]',
  advance_booking_days      INTEGER,
  notes                     TEXT,
  data_source               data_source NOT NULL,
  source_reference          TEXT,
  UNIQUE (temple_id, name)
);

-- Quota data here is synthetic for the foreseeable future: TTD publishes no
-- third-party availability API, and scraping their booking system would be
-- inappropriate. The table exists so the architecture is correct; the
-- confidence column keeps the UI honest about it.
CREATE TABLE IF NOT EXISTS darshan_availability (
  id               BIGSERIAL PRIMARY KEY,
  darshan_type_id  BIGINT NOT NULL REFERENCES darshan_types(id) ON DELETE CASCADE,
  slot_date        DATE NOT NULL,
  slot_start       TIME,
  slot_end         TIME,
  quota_total      INTEGER CHECK (quota_total >= 0),
  quota_available  INTEGER CHECK (quota_available >= 0),
  data_source      data_source NOT NULL,
  confidence       availability_confidence NOT NULL DEFAULT 'ILLUSTRATIVE',
  UNIQUE (darshan_type_id, slot_date, slot_start)
);

CREATE INDEX IF NOT EXISTS darshan_avail_date_idx ON darshan_availability (slot_date, darshan_type_id);

-- ============================================================
-- Packages: evolve from marketing blurb to composable product
-- Additive only. Nothing existing is dropped or renamed.
-- ============================================================
ALTER TABLE packages ADD COLUMN IF NOT EXISTS destination_id BIGINT
  REFERENCES destinations(id) ON DELETE SET NULL;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS duration_days SMALLINT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS duration_nights SMALLINT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS traveller_type TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE packages ADD COLUMN IF NOT EXISTS inclusions JSONB NOT NULL DEFAULT '[]';
ALTER TABLE packages ADD COLUMN IF NOT EXISTS exclusions JSONB NOT NULL DEFAULT '[]';
ALTER TABLE packages ADD COLUMN IF NOT EXISTS valid_from DATE;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS valid_to DATE;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE packages ADD COLUMN IF NOT EXISTS is_composable BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS data_source data_source NOT NULL DEFAULT 'CLIENT_PROVIDED';

DO $$ BEGIN
  ALTER TABLE packages ADD CONSTRAINT packages_status_check
    CHECK (status IN ('active','draft','archived'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS packages_destination_idx ON packages (destination_id, status);

-- Polymorphic on purpose: a package holds 3-15 components across eight types.
-- Eight nullable FK columns would be mostly NULL and awkward to iterate; a JSON
-- blob could not be indexed or joined. The trade-off is no DB-level FK on
-- component_ref_id, enforced instead in the repository layer.
CREATE TABLE IF NOT EXISTS package_components (
  id                   BIGSERIAL PRIMARY KEY,
  package_id           TEXT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  component_type       TEXT NOT NULL CHECK (component_type IN
                         ('transport','hotel','food','darshan','activity',
                          'transfer','guide','insurance')),
  component_ref_table  TEXT,
  component_ref_id     BIGINT,
  day_number           SMALLINT,
  quantity             NUMERIC(6,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit                 TEXT NOT NULL DEFAULT 'per_person' CHECK (unit IN
                         ('per_person','per_room','per_night','per_meal','per_trip','per_group')),
  is_optional          BOOLEAN NOT NULL DEFAULT false,
  description          TEXT,
  sort_order           SMALLINT NOT NULL DEFAULT 0,
  CHECK (component_ref_id IS NOT NULL OR description IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS package_components_pkg_idx ON package_components (package_id, component_type);
CREATE INDEX IF NOT EXISTS package_components_ref_idx ON package_components (component_ref_table, component_ref_id);

-- ============================================================
-- Pricing: fees, taxes and discounts the cost engine applies
-- ============================================================
CREATE TABLE IF NOT EXISTS price_components (
  id          BIGSERIAL PRIMARY KEY,
  owner_type  TEXT NOT NULL CHECK (owner_type IN ('package','package_component','global')),
  owner_id    TEXT,
  kind        TEXT NOT NULL CHECK (kind IN ('base','service_fee','tax','discount','surcharge')),
  label       TEXT NOT NULL,
  amount_inr  NUMERIC(12,2),
  percent     NUMERIC(5,2),
  unit        TEXT CHECK (unit IN ('per_person','per_room','per_night','per_meal','per_trip','per_group')),
  applies_to  TEXT,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  CHECK (amount_inr IS NOT NULL OR percent IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS price_components_owner_idx ON price_components (owner_type, owner_id);

-- ============================================================
-- Assistant conversation state
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                 BIGINT REFERENCES leads(id) ON DELETE SET NULL,
  session_id              TEXT,
  extracted_requirements  JSONB,
  status                  TEXT NOT NULL DEFAULT 'gathering' CHECK (status IN
                            ('gathering','ready','recommended','handed_off','abandoned')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversations_lead_idx ON conversations (lead_id);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id               BIGSERIAL PRIMARY KEY,
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content          TEXT NOT NULL,
  extracted        JSONB,
  -- Audit trail proving a recommendation came from real rows rather than the
  -- model's imagination.
  retrieved_ids    JSONB,
  model            TEXT,
  token_usage      JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conv_messages_idx ON conversation_messages (conversation_id, created_at);

COMMIT;
