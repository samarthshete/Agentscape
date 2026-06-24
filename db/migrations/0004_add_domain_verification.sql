-- Agentscape — 0004_add_domain_verification
-- Real HTTPS /.well-known domain-verification handshake (Phase 5a).
--
-- An operator proves control of their agent's domain by hosting a per-agent
-- token at https://<domain>/.well-known/agentscape-challenge.txt; a server-side
-- action fetches + validates it (SSRF-guarded) and flips the badge.
--
-- SECURITY CORE — the column-privilege lock below. RLS lets an owner UPDATE
-- their OWN agent row, which would otherwise let them set verified=true by hand.
-- Postgres treats a table-level INSERT/UPDATE grant as covering every column, so
-- the only way to make specific columns unwritable by a role is to withhold the
-- table grant and re-grant just the allowed columns. We therefore lock all trust
-- columns (verified, verified_via, verification_status, verified_domain,
-- verification_token) to service_role only. The badge becomes unforgeable even
-- by the agent's own owner — the sole path to 'domain_verified' is the verify
-- action, which writes with the service-role (admin) client after the handshake.
--
-- Additive + idempotent: re-runnable in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------
alter table agents add column if not exists verification_token  text;
alter table agents add column if not exists verification_status text not null default 'unverified';
alter table agents add column if not exists verified_domain     text;

-- Backfill a random per-agent token for existing rows, then make it mandatory
-- with a server-generated default for new rows. (pgcrypto enabled in 0001.)
update agents set verification_token = encode(gen_random_bytes(16), 'hex')
  where verification_token is null;
alter table agents alter column verification_token set default encode(gen_random_bytes(16), 'hex');
alter table agents alter column verification_token set not null;

-- Constrain the status to known values.
alter table agents drop constraint if exists agents_verification_status_check;
alter table agents add  constraint agents_verification_status_check
  check (verification_status in ('unverified', 'domain_verified'));

-- ---------------------------------------------------------------------------
-- 2. Column-privilege lock (the security core — see header)
--    Withhold table-wide INSERT/UPDATE from the client roles, then grant back
--    ONLY the operator-editable business columns. The five trust columns are
--    omitted from the grant, so only service_role can ever write them.
-- ---------------------------------------------------------------------------
revoke insert on agents from anon, authenticated;
revoke update on agents from anon, authenticated;

grant insert (
  owner_id, slug, name, tagline, description, capabilities,
  endpoint_url, docs_url, metrics, status, pricing, model_info
) on agents to authenticated;

grant update (
  owner_id, slug, name, tagline, description, capabilities,
  endpoint_url, docs_url, metrics, status, pricing, model_info
) on agents to authenticated;

-- anon writes nothing (RLS already blocked it; now privilege does too).
-- service_role is never restricted here and remains the sole writer of
-- verified / verified_via / verification_status / verified_domain /
-- verification_token.
