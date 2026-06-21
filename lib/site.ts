import { headers } from "next/headers";

// Resolve the request's origin (scheme + host) for absolute URLs in JSON-LD.
// Works on Vercel (x-forwarded-proto: https) and localhost. Server-only via
// next/headers. Route handlers use `new URL(request.url).origin` instead.
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
