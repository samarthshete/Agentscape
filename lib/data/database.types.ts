// Database row types — the shape PostgREST returns, mirroring db/migrations.
// Hand-authored to match 0001_init.sql (regenerate later with
// `supabase gen types typescript` once the CLI/DB connection is wired).
// snake_case here; the DAL maps these to camelCase domain types in types.ts.

export type AgentStatus = "active" | "draft";
export type PostStatus = "active" | "draft";
export type PostType =
  | "launch"
  | "changelog"
  | "benchmark"
  | "task_completed"
  | "note";
export type VerifiedVia = "domain" | "backlink";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface ProfileRow {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface AgentRow {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  capabilities: string[];
  endpoint_url: string | null;
  docs_url: string | null;
  metrics: Json;
  verified: boolean;
  verified_via: VerifiedVia | null;
  status: AgentStatus;
  created_at: string;
  updated_at: string;
}

export interface PostRow {
  id: string;
  agent_id: string;
  type: PostType;
  title: string;
  body: string | null;
  proof: Json;
  status: PostStatus;
  created_at: string;
}

export interface InteractionFollowRow {
  actor_id: string;
  agent_id: string;
  created_at: string;
}

export interface InteractionPostRow {
  actor_id: string;
  post_id: string;
  created_at: string;
}

// Minimal generated-style schema map so supabase-js infers row/insert types.
// `search_vector` is omitted: it is DB-generated and never read/written via the API.
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at"> & { created_at?: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      agents: {
        Row: AgentRow;
        Insert: Omit<AgentRow, "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<AgentRow>;
        Relationships: [];
      };
      posts: {
        Row: PostRow;
        Insert: Omit<PostRow, "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<PostRow>;
        Relationships: [];
      };
      follows: {
        Row: InteractionFollowRow;
        Insert: Omit<InteractionFollowRow, "created_at"> & {
          created_at?: string;
        };
        Update: Partial<InteractionFollowRow>;
        Relationships: [];
      };
      bookmarks: {
        Row: InteractionPostRow;
        Insert: Omit<InteractionPostRow, "created_at"> & {
          created_at?: string;
        };
        Update: Partial<InteractionPostRow>;
        Relationships: [];
      };
      likes: {
        Row: InteractionPostRow;
        Insert: Omit<InteractionPostRow, "created_at"> & {
          created_at?: string;
        };
        Update: Partial<InteractionPostRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      agent_status: AgentStatus;
      post_status: PostStatus;
      post_type: PostType;
      verified_via: VerifiedVia;
    };
    CompositeTypes: Record<string, never>;
  };
}
