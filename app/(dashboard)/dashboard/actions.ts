"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createAgent,
  updateAgent,
  createPost,
  getAgentById,
} from "@/lib/data";
import type { AgentInput, AgentMetrics, PostInput, PostType } from "@/lib/data";

// --- parsing helpers (all form input is untrusted) ---------------------------

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function nullable(s: string): string | null {
  return s.length > 0 ? s : null;
}
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
function numberField(fd: FormData, key: string, target: AgentMetrics): void {
  const raw = str(fd, key);
  if (!raw) return;
  const n = Number(raw);
  if (Number.isFinite(n)) target[key] = n;
}

type Parsed<T> = T | { error: string };

function parseAgentInput(fd: FormData): Parsed<AgentInput> {
  const name = str(fd, "name");
  if (name.length < 2 || name.length > 80) {
    return { error: "Name must be 2–80 characters." };
  }
  const slug = slugify(str(fd, "slug") || name);
  if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(slug)) {
    return { error: "Slug must be 3–40 chars: letters, numbers, hyphens." };
  }

  const endpointUrl = nullable(str(fd, "endpoint_url"));
  if (endpointUrl && !/^https?:\/\/.+/.test(endpointUrl)) {
    return { error: "Endpoint must be an http(s) URL." };
  }
  const docsUrl = nullable(str(fd, "docs_url"));
  if (docsUrl && !/^https?:\/\/.+/.test(docsUrl)) {
    return { error: "Docs must be an http(s) URL." };
  }

  const capabilities = Array.from(
    new Set(
      str(fd, "capabilities")
        .split(",")
        .map((c) => slugify(c))
        .filter(Boolean),
    ),
  ).slice(0, 12);

  const metrics: AgentMetrics = {};
  numberField(fd, "tasks_completed", metrics);
  numberField(fd, "success_rate", metrics);
  numberField(fd, "avg_latency_ms", metrics);

  return {
    name,
    slug,
    tagline: nullable(str(fd, "tagline")),
    description: nullable(str(fd, "description")),
    capabilities,
    endpointUrl,
    docsUrl,
    pricing: nullable(str(fd, "pricing")),
    modelInfo: nullable(str(fd, "model_info")),
    metrics,
    status: "active",
  };
}

const POST_TYPES: readonly PostType[] = [
  "launch",
  "changelog",
  "benchmark",
  "task_completed",
  "note",
];

function isPostType(v: string): v is PostType {
  return (POST_TYPES as readonly string[]).includes(v);
}

function parsePostInput(fd: FormData): Parsed<PostInput> {
  const type = str(fd, "type");
  if (!isPostType(type)) return { error: "Pick a valid work-sample type." };

  const title = str(fd, "title");
  if (title.length < 2 || title.length > 140) {
    return { error: "Title must be 2–140 characters." };
  }

  let proof: Record<string, unknown> = {};
  const proofRaw = str(fd, "proof");
  if (proofRaw) {
    try {
      const parsed: unknown = JSON.parse(proofRaw);
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { error: "Proof must be a JSON object, e.g. {\"metric\": 0.94}." };
      }
      proof = parsed as Record<string, unknown>;
    } catch {
      return { error: "Proof is not valid JSON." };
    }
  }

  const dateRaw = str(fd, "event_time");
  const eventTime = dateRaw ? `${dateRaw}T12:00:00Z` : new Date().toISOString();
  if (Number.isNaN(Date.parse(eventTime))) return { error: "Invalid date." };

  return {
    type,
    title,
    body: nullable(str(fd, "body")),
    proof,
    eventTime,
    status: "active",
  };
}

// Every public + machine surface that could show the change. (List routes are
// force-dynamic so this is belt-and-suspenders, but keeps any cached route fresh.)
function revalidateAffected(slug?: string): void {
  for (const p of ["/", "/agents", "/feed", "/llms.txt", "/sitemap.xml", "/dashboard"]) {
    revalidatePath(p);
  }
  if (slug) {
    revalidatePath(`/agents/${slug}`);
    revalidatePath(`/agents/${slug}/markdown`);
  }
}

// --- actions -----------------------------------------------------------------

export async function createAgentAction(formData: FormData): Promise<void> {
  const parsed = parseAgentInput(formData);
  if ("error" in parsed) {
    redirect(`/dashboard/agents/new?error=${encodeURIComponent(parsed.error)}`);
  }
  const result = await createAgent(parsed);
  if (!result.ok) {
    redirect(`/dashboard/agents/new?error=${encodeURIComponent(result.message)}`);
  }
  revalidateAffected(result.data.slug);
  redirect(`/agents/${result.data.slug}`);
}

export async function updateAgentAction(
  id: string,
  formData: FormData,
): Promise<void> {
  const parsed = parseAgentInput(formData);
  if ("error" in parsed) {
    redirect(`/dashboard/agents/${id}/edit?error=${encodeURIComponent(parsed.error)}`);
  }
  const result = await updateAgent(id, parsed);
  if (!result.ok) {
    redirect(`/dashboard/agents/${id}/edit?error=${encodeURIComponent(result.message)}`);
  }
  revalidateAffected(result.data.slug);
  redirect(`/agents/${result.data.slug}`);
}

export async function createPostAction(
  agentId: string,
  formData: FormData,
): Promise<void> {
  const parsed = parsePostInput(formData);
  if ("error" in parsed) {
    redirect(`/dashboard/agents/${agentId}/posts/new?error=${encodeURIComponent(parsed.error)}`);
  }
  const result = await createPost(agentId, parsed);
  if (!result.ok) {
    redirect(`/dashboard/agents/${agentId}/posts/new?error=${encodeURIComponent(result.message)}`);
  }
  const agent = await getAgentById(agentId);
  revalidateAffected(agent?.slug);
  redirect(agent ? `/agents/${agent.slug}` : "/dashboard");
}
