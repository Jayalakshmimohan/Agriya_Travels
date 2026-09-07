-- Widen destination_type, and stop packages claiming a provenance they cannot
-- support.
--
-- The original eight types could not express a salt desert, an atoll, Kerala
-- backwaters or an Ayurveda retreat, so a diversified catalogue would have had
-- to file all of them under 'other' and lean entirely on tags. Discovery
-- scores destination_type directly, so that loses real signal.

BEGIN;

ALTER TABLE destinations DROP CONSTRAINT IF EXISTS destinations_destination_type_check;

ALTER TABLE destinations ADD CONSTRAINT destinations_destination_type_check
  CHECK (destination_type IN (
    'pilgrimage', 'hill_station', 'beach', 'heritage', 'metro',
    'wildlife', 'adventure',
    'desert', 'island', 'backwaters', 'wellness', 'nature',
    'other'
  ));

-- The 21 original packages were labelled CLIENT_PROVIDED by assumption when
-- migration 002 added the column. The evidence says otherwise: 17 appeared in
-- a single "initialize project" commit, 7 more inside a commit about build
-- process and dark mode, and every one of the 18 real prices ends in 000 or
-- 500. That is scaffold content from the site build, not a rate card.
--
-- This matters beyond tidiness. priceTrip anchors quotes on package prices and
-- tagged those lines CLIENT_PROVIDED / INDICATIVE, so a quote built on a
-- possibly-invented figure was presented as MORE trustworthy than the
-- synthetic train fare beside it — the exact inversion the provenance design
-- exists to prevent.
--
-- Reverse with a single UPDATE if the client confirms these are real:
--   UPDATE packages SET data_source = 'CLIENT_PROVIDED' WHERE id IN (...);
UPDATE packages SET data_source = 'DEMO' WHERE data_source = 'CLIENT_PROVIDED';

COMMIT;
