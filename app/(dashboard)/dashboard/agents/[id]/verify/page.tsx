import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getAgentById } from "@/lib/data";
import { CHALLENGE_PATH, hostnameFromUrl } from "@/lib/verification/challenge";
import { isVerified } from "@/lib/verification/status";
import { CopyButton } from "@/components/CopyButton";
import { VerificationBadge } from "@/components/VerificationBadge";
import { verifyAgentDomainAction } from "../../../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Verify domain · Agentscape" };

const INPUT =
  "h-9 w-full rounded-control border border-border bg-subtle px-3 font-mono text-[13px] text-foreground outline-none focus-visible:border-accent";

export default async function VerifyAgentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const agent = await getAgentById(id);
  // Only the owner may verify; hide others' agents entirely.
  if (!agent || !user || agent.ownerId !== user.id) notFound();

  const { error, status } = await searchParams;
  const verified = isVerified(agent);
  const defaultDomain =
    agent.verifiedDomain ??
    hostnameFromUrl(agent.endpointUrl) ??
    hostnameFromUrl(agent.docsUrl) ??
    "";
  const exampleUrl = defaultDomain
    ? `https://${defaultDomain}${CHALLENGE_PATH}`
    : `https://<your-domain>${CHALLENGE_PATH}`;
  const action = verifyAgentDomainAction.bind(null, agent.id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center gap-2.5">
        <h1 className="text-[24px] font-[600] tracking-[-0.02em] text-foreground">
          Verify {agent.name}
        </h1>
        {agent.verificationStatus === "domain_verified" ? (
          <VerificationBadge verified verifiedVia="domain" variant="pill" />
        ) : null}
      </div>
      <p className="mt-1.5 font-mono text-[12px] text-faint">
        /agents/{agent.slug}
      </p>

      {status === "verified" ? (
        <p className="mt-4 rounded-control border border-verified-border bg-verified-bg px-3 py-2 font-mono text-[12px] text-verified">
          Verified — {agent.verifiedDomain} is confirmed. The badge now shows on
          the profile, markdown twin, and JSON-LD.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-control border border-border bg-subtle px-3 py-2 font-mono text-[12px] text-foreground">
          {error}
        </p>
      ) : null}

      {verified ? (
        <div className="mt-6 rounded-card border border-divider bg-card p-5">
          <p className="text-[14px] text-foreground">
            This agent is{" "}
            <span className="text-verified">domain-verified</span>
            {agent.verifiedDomain ? (
              <>
                {" "}
                for{" "}
                <span className="font-mono text-verified">
                  {agent.verifiedDomain}
                </span>
              </>
            ) : null}
            .
          </p>
          <p className="mt-2 text-[13px] text-muted">
            You can re-run the check below against a different domain at any time.
          </p>
        </div>
      ) : null}

      <section className="mt-6 rounded-card border border-divider bg-card p-5">
        <h2 className="text-[13px] font-[560] text-foreground">
          How domain verification works
        </h2>
        <ol className="mt-3 flex flex-col gap-3 text-[13.5px] leading-[1.6] text-muted">
          <li>
            <span className="text-foreground">1.</span> Copy your agent&rsquo;s
            verification token:
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-control border border-border bg-subtle px-2.5 py-1.5 font-mono text-[12px] text-foreground/90">
                {agent.verificationToken || "— (apply migration 0004 to generate)"}
              </code>
              {agent.verificationToken ? (
                <CopyButton
                  value={agent.verificationToken}
                  label="Copy verification token"
                />
              ) : null}
            </div>
          </li>
          <li>
            <span className="text-foreground">2.</span> Host it as plain text at
            this exact path on your domain (HTTPS, no redirects):
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-control border border-border bg-subtle px-2.5 py-1.5 font-mono text-[12px] text-foreground/90">
                {exampleUrl}
              </code>
              <CopyButton value={CHALLENGE_PATH} label="Copy challenge path" />
            </div>
            <span className="mt-1 block font-mono text-[11px] text-faint">
              path: {CHALLENGE_PATH}
            </span>
          </li>
          <li>
            <span className="text-foreground">3.</span> Enter the domain and run
            the check. We fetch the file over HTTPS and compare its contents to
            your token.
          </li>
        </ol>

        <form action={action} className="mt-5 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-[540] text-foreground">Domain</span>
            <input
              name="domain"
              defaultValue={defaultDomain}
              placeholder="example.com"
              className={INPUT}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <span className="font-mono text-[11px] text-faint">
              bare hostname · no scheme or path
            </span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex h-[34px] items-center justify-center rounded-control bg-accent px-[15px] text-[13px] font-[560] text-accent-foreground transition-[filter] hover:brightness-110"
            >
              Verify domain
            </button>
            <Link
              href="/dashboard"
              className="font-mono text-[12px] text-muted transition-colors hover:text-foreground"
            >
              Back to dashboard
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
