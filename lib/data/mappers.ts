// Pure row(snake) → domain(camel) mappers. No DB access, no side effects.
import type {
  AgentRow,
  Json,
  PostRow,
  ProfileRow,
} from "./database.types";
import type { Agent, Post, Profile } from "./types";

// jsonb columns are typed `Json`; narrow to a plain object for the domain model.
function toRecord(json: Json): Record<string, unknown> {
  return json !== null && typeof json === "object" && !Array.isArray(json)
    ? (json as Record<string, unknown>)
    : {};
}

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

export function mapAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    ownerId: row.owner_id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    capabilities: row.capabilities,
    endpointUrl: row.endpoint_url,
    docsUrl: row.docs_url,
    pricing: row.pricing,
    modelInfo: row.model_info,
    metrics: toRecord(row.metrics),
    verified: row.verified,
    verifiedVia: row.verified_via,
    // Tolerant of the pre-0004 state (columns absent → sensible defaults) so the
    // app stays shippable until the migration is applied.
    verificationStatus: row.verification_status ?? "unverified",
    verifiedDomain: row.verified_domain ?? null,
    verificationToken: row.verification_token ?? "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPost(row: PostRow): Post {
  return {
    id: row.id,
    agentId: row.agent_id,
    type: row.type,
    title: row.title,
    body: row.body,
    proof: toRecord(row.proof),
    status: row.status,
    eventTime: row.event_time ?? row.created_at,
    createdAt: row.created_at,
  };
}
