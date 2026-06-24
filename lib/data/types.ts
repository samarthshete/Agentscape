// Domain types — the camelCase objects the DAL returns and renderers consume.
// These are the single shared vocabulary across DB → DAL → renderers (Phase 2).
import type {
  AgentStatus,
  PostStatus,
  PostType,
  VerificationStatus,
  VerifiedVia,
} from "./database.types";

export type { AgentStatus, PostStatus, PostType, VerificationStatus, VerifiedVia };

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
  pricing: string | null;
  modelInfo: string | null;
  metrics: AgentMetrics;
  verified: boolean;
  verifiedVia: VerifiedVia | null;
  // Domain-verification (Phase 5a). `verificationStatus`/`verifiedDomain` are
  // set ONLY by the server-side challenge action (service-role write); the owner
  // cannot set them directly (column-privilege lock in 0004). `verificationToken`
  // is the per-agent challenge nonce shown to the owner; never emitted to
  // machine surfaces.
  verificationStatus: VerificationStatus;
  verifiedDomain: string | null;
  verificationToken: string;
  status: AgentStatus;
  createdAt: string;
  updatedAt: string;
}

// Operator-supplied input for the publishing dashboard (untrusted; validated in
// the server action before reaching the DAL).
export interface AgentInput {
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  capabilities: string[];
  endpointUrl: string | null;
  docsUrl: string | null;
  pricing: string | null;
  modelInfo: string | null;
  metrics: AgentMetrics;
  status: AgentStatus;
}

export interface PostInput {
  type: PostType;
  title: string;
  body: string | null;
  proof: PostProof;
  eventTime: string;
  status: PostStatus;
}

// Write result: expected failures (slug conflict, RLS denial) are values, not
// throws, so server actions can show a friendly message.
export type WriteResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

export interface Post {
  id: string;
  agentId: string;
  type: PostType;
  title: string;
  body: string | null;
  proof: PostProof;
  status: PostStatus;
  // When the work-sample event actually happened (launch/benchmark/changelog/
  // task). Falls back to createdAt if unset. Use this for display + ordering.
  eventTime: string;
  createdAt: string;
}

// --- Interactions (Phase 4c) — human-only affordances, never on machine surfaces.

// The current user's interaction state with one work-sample, plus its public
// like count. `liked`/`bookmarked` are false when logged out.
export interface PostInteraction {
  likeCount: number;
  liked: boolean;
  bookmarked: boolean;
}

// The current user's follow state for one agent, plus its public follower count.
export interface AgentInteraction {
  followerCount: number;
  following: boolean;
}

// What a toggle returns: the authoritative new state + count after the write.
export interface ToggleResult {
  active: boolean;
  count: number;
}
