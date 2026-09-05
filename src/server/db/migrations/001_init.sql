-- Agriya Travels core data model
-- Every enquiry, every AI-generated plan, and a mirror of the package
-- catalogue so AI services can query real inventory.

BEGIN;

-- ============================================================
-- leads: one row per enquiry, from any of the four forms
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id                BIGSERIAL PRIMARY KEY,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- where it came from
  source            TEXT NOT NULL
                    CHECK (source IN ('contact_form','quick_quote','trip_planner','inspiration')),
  focus             TEXT CHECK (focus IN ('general','rentals','corporate')),
  page_path         TEXT,

  -- who they are (nullable: see note below)
  name              TEXT,
  phone             TEXT,
  email             TEXT,

  -- what they want
  destination       TEXT,
  starting_city     TEXT,
  travel_date       DATE,
  travellers        INTEGER CHECK (travellers IS NULL OR travellers BETWEEN 1 AND 500),
  duration_days     INTEGER CHECK (duration_days IS NULL OR duration_days BETWEEN 1 AND 30),
  budget            TEXT,
  travel_type       TEXT,
  hotel_preference  TEXT,

  -- rentals-specific
  vehicle_type      TEXT,
  trip_type         TEXT,
  pickup_location   TEXT,
  pickup_time       TEXT,

  message           TEXT,

  -- filled in by the scoring service (Phase 3)
  score             INTEGER CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  score_breakdown   JSONB,
  ai_summary        TEXT,

  -- sales pipeline
  status            TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','contacted','quoted','won','lost'))
);

-- ============================================================
-- lead_events: append-only history per lead
-- ============================================================
CREATE TABLE IF NOT EXISTS lead_events (
  id          BIGSERIAL PRIMARY KEY,
  lead_id     BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type        TEXT NOT NULL
              CHECK (type IN ('created','scored','contacted','status_changed','plan_generated','note')),
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- trip_plans: every itinerary the AI generates
-- ============================================================
CREATE TABLE IF NOT EXISTS trip_plans (
  id                    BIGSERIAL PRIMARY KEY,
  lead_id               BIGINT REFERENCES leads(id) ON DELETE SET NULL,
  request               JSONB NOT NULL,
  plan                  JSONB NOT NULL,
  model                 TEXT,
  grounded_package_ids  TEXT[] NOT NULL DEFAULT '{}',
  token_usage           JSONB,
  is_fallback           BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- packages: mirror of src/data/index.ts, refreshed by a script
-- ============================================================
CREATE TABLE IF NOT EXISTS packages (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('India','International','Theme')),
  duration        TEXT,
  best_for        TEXT,
  starting_price  TEXT,
  price_inr       INTEGER,
  description     TEXT,
  image_url       TEXT,
  weather_info    JSONB,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- package_views: which packages get looked at
-- ============================================================
CREATE TABLE IF NOT EXISTS package_views (
  id          BIGSERIAL PRIMARY KEY,
  package_id  TEXT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  session_id  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ai_insights: cached dashboard analysis
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_insights (
  id            BIGSERIAL PRIMARY KEY,
  kind          TEXT NOT NULL,
  period        TEXT NOT NULL,
  data          JSONB NOT NULL,
  narration     TEXT,
  model         TEXT,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kind, period)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS leads_created_at_idx   ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_score_idx ON leads (status, score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS leads_destination_idx  ON leads (lower(destination));
CREATE INDEX IF NOT EXISTS leads_source_idx       ON leads (source);
CREATE INDEX IF NOT EXISTS lead_events_lead_idx   ON lead_events (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS trip_plans_lead_idx    ON trip_plans (lead_id);
CREATE INDEX IF NOT EXISTS package_views_pkg_idx  ON package_views (package_id, created_at DESC);

COMMIT;