-- Agentscape — 0002_add_post_event_time
-- Work-samples carry the time the event actually happened (a launch, benchmark
-- run, changelog release, or completed task) — distinct from row-creation time.
-- Used for display and feed ordering. Additive + idempotent.

alter table posts add column if not exists event_time timestamptz;

-- Backfill any pre-existing rows so ordering/display always has a value.
update posts set event_time = created_at where event_time is null;

create index if not exists posts_event_time_idx on posts (event_time desc);
