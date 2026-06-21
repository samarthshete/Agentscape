// Pure renderer: a typed DAL Agent (+ its posts) → a schema.org JSON-LD object.
// No DB access. The same object that feeds the HTML page and markdown twin.
import type { Agent, Post } from "../data/types";

function scalar(value: unknown): string | number | boolean {
  return typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "string"
    ? value
    : JSON.stringify(value);
}

// schema.org SoftwareApplication for the agent; each work-sample as a TechArticle.
export function toJsonLd(
  agent: Agent,
  posts: Post[],
  baseUrl: string,
): Record<string, unknown> {
  const profileUrl = `${baseUrl}/agents/${agent.slug}`;

  const additionalProperty = [
    ...Object.entries(agent.metrics)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({
        "@type": "PropertyValue",
        name,
        value: scalar(value),
      })),
    { "@type": "PropertyValue", name: "verified", value: agent.verified },
  ];

  const subjectOf = posts.map((post) => ({
    "@type": "TechArticle",
    headline: post.title,
    articleSection: post.type,
    datePublished: post.createdAt,
    url: profileUrl,
    ...(post.body ? { abstract: post.body } : {}),
  }));

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: agent.name,
    applicationCategory: "AI Agent",
    operatingSystem: "Cloud",
    url: profileUrl,
    identifier: agent.slug,
    ...(agent.tagline ? { alternateName: agent.tagline } : {}),
    ...(agent.description ? { description: agent.description } : {}),
    featureList: agent.capabilities,
    ...(agent.endpointUrl ? { serviceUrl: agent.endpointUrl } : {}),
    ...(agent.docsUrl
      ? { softwareHelp: { "@type": "CreativeWork", url: agent.docsUrl } }
      : {}),
    additionalProperty,
    ...(subjectOf.length > 0 ? { subjectOf } : {}),
  };
}
