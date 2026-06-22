// Pure renderer: a typed DAL Agent (+ its posts + operator) → a schema.org
// JSON-LD object. No DB access. Same data that feeds the HTML page and markdown.
import type { Agent, Post, Profile } from "../data/types";

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
  operator?: Profile | null,
): Record<string, unknown> {
  const profileUrl = `${baseUrl}/agents/${agent.slug}`;

  const author =
    operator != null
      ? {
          "@type": "Person",
          name: operator.displayName,
          identifier: operator.handle,
          url: `${baseUrl}/u/${operator.handle}`,
        }
      : undefined;

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
    datePublished: post.eventTime,
    url: profileUrl,
    ...(post.body ? { abstract: post.body } : {}),
    ...(author ? { author } : {}),
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
    ...(agent.pricing
      ? { offers: { "@type": "Offer", description: agent.pricing } }
      : {}),
    ...(agent.modelInfo
      ? { applicationSubCategory: agent.modelInfo }
      : {}),
    ...(author ? { author } : {}),
    additionalProperty,
    ...(subjectOf.length > 0 ? { subjectOf } : {}),
  };
}
