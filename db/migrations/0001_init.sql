-- Agentscape — 0001_init
-- One canonical data model. Five core entities + three interaction tables.
-- ISO-8601 timestamptz everywhere, real UUIDs, deterministic ordering.
-- The human table is named `profiles` (see DECISIONS.md "Naming" note); it is
-- 1:1 with auth.users so RLS can scope writes by auth.uid().
--
-- Re-runnable: drops its own objects first, so it can be pasted into the SQL
-- editor repeatedly (and over a partially-applied state) without manual cleanup.

-- ---------------------------------------------------------------------------
-- Idempotent teardown (reverse dependency order; cascade clears triggers/RLS).
-- ---------------------------------------------------------------------------
drop table if exists likes      cascade;
drop table if exists bookmarks  cascade;
drop table if exists follows    cascade;
drop table if exists posts      cascade;
drop table if exists agents     cascade;
drop table if exists profiles   cascade;

drop type if exists agent_status cascade;
drop type if exists post_status  cascade;
drop type if exists post_type    cascade;
drop type if exists verified_via cascade;

drop function if exists set_updated_at()              cascade;
drop function if exists agents_search_vector_update() cascade;
drop function if exists posts_search_vector_update()  cascade;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists citext;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums (constrain the type system at the database layer)
-- ---------------------------------------------------------------------------
create type agent_status as enum ('active', 'draft');
create type post_status  as enum ('active', 'draft');
create type post_type    as enum ('launch', 'changelog', 'benchmark', 'task_completed', 'note');
create type verified_via as enum ('domain', 'backlink');

-- ---------------------------------------------------------------------------
-- profiles — the authenticated human (supply side). 1:1 with auth.users.
-- ---------------------------------------------------------------------------
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  handle       citext unique not null,
  display_name text   not null,
  bio          text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- agents — the product. Public, addressable home at /agents/[slug].
--   search_vector is maintained by a trigger (below), not a generated column,
--   so the text-search expression has no immutability constraint.
-- ---------------------------------------------------------------------------
create table agents (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references profiles (id) on delete cascade,
  slug          citext unique not null,
  name          text not null,
  tagline       text,
  description   text,
  capabilities  text[] not null default '{}',
  endpoint_url  text,
  docs_url      text,
  metrics       jsonb not null default '{}'::jsonb,
  verified      boolean not null default false,
  verified_via  verified_via,
  status        agent_status not null default 'draft',
  search_vector tsvector,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- posts — verifiable work-samples (never social chatter). Structured proof.
-- ---------------------------------------------------------------------------
create table posts (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references agents (id) on delete cascade,
  type          post_type not null,
  title         text not null,
  body          text,
  proof         jsonb not null default '{}'::jsonb,
  status        post_status not null default 'draft',
  search_vector tsvector,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Interaction tables. A row is writable only by its acting user.
-- ---------------------------------------------------------------------------
create table follows (
  actor_id   uuid not null references profiles (id) on delete cascade,
  agent_id   uuid not null references agents (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (actor_id, agent_id)
);

create table bookmarks (
  actor_id   uuid not null references profiles (id) on delete cascade,
  post_id    uuid not null references posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (actor_id, post_id)
);

create table likes (
  actor_id   uuid not null references profiles (id) on delete cascade,
  post_id    uuid not null references posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (actor_id, post_id)
);

-- ---------------------------------------------------------------------------
-- Full-text search vectors, maintained by triggers.
--   Weights: A = name/title, B = tagline/capabilities/body, C = description.
-- ---------------------------------------------------------------------------
create function agents_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.tagline, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.capabilities, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'C');
  return new;
end;
$$;

create trigger agents_search_vector_tg
  before insert or update on agents
  for each row execute function agents_search_vector_update();

create function posts_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.body, '')), 'B');
  return new;
end;
$$;

create trigger posts_search_vector_tg
  before insert or update on posts
  for each row execute function posts_search_vector_update();

-- ---------------------------------------------------------------------------
-- Indexes
--   GIN on the tsvector search columns; btree on FKs and feed-ordering keys.
--   (UNIQUE on agents.slug / profiles.handle already creates their indexes.)
-- ---------------------------------------------------------------------------
create index agents_search_idx          on agents using gin (search_vector);
create index posts_search_idx           on posts  using gin (search_vector);

create index agents_owner_idx           on agents (owner_id);
create index agents_status_created_idx  on agents (status, created_at desc);

create index posts_agent_idx            on posts (agent_id);
create index posts_status_created_idx   on posts (status, created_at desc);

create index follows_agent_idx          on follows (agent_id);
create index bookmarks_post_idx         on bookmarks (post_id);
create index likes_post_idx             on likes (post_id);

-- ---------------------------------------------------------------------------
-- Keep agents.updated_at honest.
-- ---------------------------------------------------------------------------
create function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger agents_set_updated_at
  before update on agents
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security (security as data law)
--   Public read: anon SELECT on active agents/posts; profiles publicly readable.
--   Owner write: agents/posts writable only by their owner (posts via agent).
--   Self-only:   follows/bookmarks/likes writable only by the acting user.
--   The secret/service key bypasses RLS and is used ONLY by the seed and
--   trusted server actions — never shipped to the client.
-- ---------------------------------------------------------------------------
alter table profiles  enable row level security;
alter table agents    enable row level security;
alter table posts     enable row level security;
alter table follows   enable row level security;
alter table bookmarks enable row level security;
alter table likes     enable row level security;

-- profiles: world-readable; a user may write only their own row.
create policy profiles_select_public on profiles
  for select using (true);
create policy profiles_insert_self on profiles
  for insert with check (id = auth.uid());
create policy profiles_update_self on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- agents: anyone reads ACTIVE; the owner reads/writes their own (incl. drafts).
create policy agents_select_public on agents
  for select using (status = 'active');
create policy agents_modify_owner on agents
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- posts: anyone reads ACTIVE posts of ACTIVE agents; owner writes via the agent.
create policy posts_select_public on posts
  for select using (
    status = 'active'
    and exists (
      select 1 from agents a
      where a.id = posts.agent_id and a.status = 'active'
    )
  );
create policy posts_modify_owner on posts
  for all using (
    exists (
      select 1 from agents a
      where a.id = posts.agent_id and a.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from agents a
      where a.id = posts.agent_id and a.owner_id = auth.uid()
    )
  );

-- interactions: writable only by the acting user.
create policy follows_select_public on follows
  for select using (true);
create policy follows_write_self on follows
  for all using (actor_id = auth.uid()) with check (actor_id = auth.uid());

create policy bookmarks_select_self on bookmarks
  for select using (actor_id = auth.uid());
create policy bookmarks_write_self on bookmarks
  for all using (actor_id = auth.uid()) with check (actor_id = auth.uid());

create policy likes_select_public on likes
  for select using (true);
create policy likes_write_self on likes
  for all using (actor_id = auth.uid()) with check (actor_id = auth.uid());
