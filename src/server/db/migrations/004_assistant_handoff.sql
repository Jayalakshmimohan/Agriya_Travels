-- Let the assistant hand a conversation to the team.
--
-- It was already offering to "pass your requirements on" and then doing
-- nothing: there was no source value for an assistant-originated lead, and no
-- conversation state for "I have asked for their number and am waiting". So
-- answering "yes" fell back into the same branch and repeated the question.

BEGIN;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check
  CHECK (source IN (
    'contact_form', 'quick_quote', 'trip_planner', 'inspiration',
    'assistant'
  ));

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_status_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_status_check
  CHECK (status IN (
    'gathering',
    -- We have offered to pass it to the team and are waiting for a name and
    -- number. Without this state the next message is just re-extracted and
    -- the assistant loops.
    'awaiting_contact',
    'ready', 'recommended', 'handed_off', 'abandoned'
  ));

COMMIT;
