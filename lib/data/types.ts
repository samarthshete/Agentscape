// Domain types — the camelCase objects the DAL returns and renderers consume.
// These are the single shared vocabulary across DB → DAL → renderers (Phase 2).
import type {
  AgentStatus,
  PostStatus,
  PostType,
  VerifiedVia,
} from "./database.types";

export type { AgentStatus, PostStatus, PostType, VerifiedVia };

// Structured payloads are intentionally open-ended (jsonb) but never `any`.
export type AgentMetrics = Record<string, unknown>;
export type PostProof = Record<string, unknown>;

export interface Profile {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Agent {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  capabilities: string[];
  endpointUrl: string | null;
  docsUrl: string | null;
  metrics: AgentMetrics;
  verified: boolean;
  verifiedVia: VerifiedVia | null;
  status: AgentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  agentId: string;
  type: PostType;
  title: string;
  body: string | null;
  proof: PostProof;
  status: PostStatus;
  createdAt: string;
}
