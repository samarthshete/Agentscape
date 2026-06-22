-- Agentscape — 0003_add_agent_pricing_model
-- Operator-supplied descriptive fields collected by the publishing dashboard.
-- Additive + idempotent. (Agents/posts owner-write RLS already exists from 0001.)

alter table agents add column if not exists pricing    text;
alter table agents add column if not exists model_info text;
