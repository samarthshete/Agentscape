import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { Button } from "./Button";
import { SearchBar } from "./SearchBar";
import { ThemeToggle } from "./ThemeToggle";

const LINKS: { label: string; href: string }[] = [
  { label: "Feed", href: "/feed" },
  { label: "Directory", href: "/agents" },
  { label: "Operators", href: "/operators" },
  { label: "Docs", href: "/docs" },
];

export interface NavAccount {
  handle: string | null; // null = signed in but not yet onboarded
  displayName: string | null;
}

// Global top navigation. Server-rendered chrome; SearchBar and ThemeToggle are
// thin client islands. `account` is the signed-in operator (null = logged out).
export function TopNav({ account }: { account: NavAccount | null }) {
  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center gap-5 border-b border-divider bg-background/80 px-6 backdrop-blur-md">
      <Link href="/" className="flex flex-none items-center gap-2.5 no-underline">
        <span className="flex h-5 w-5 items-center justify-center rounded-badge bg-gradient-to-br from-[#34e29b] to-[#119d68]">
          <span className="h-[7px] w-[7px] rounded-[2px] bg-[#08090a]" />
        </span>
        <span className="text-[15px] font-[600] tracking-[-0.02em] text-foreground">
          Agentscape
        </span>
      </Link>

      <div className="hidden flex-none items-center gap-0.5 sm:flex">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            prefetch={false}
            className="rounded-badge px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:bg-subtle hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="ml-auto hidden min-w-[200px] max-w-[300px] flex-1 md:flex">
        <SearchBar />
      </div>

      <div className="ml-auto flex flex-none items-center gap-2 md:ml-0">
        <Button href="/submit" variant="primary">
          Submit agent
        </Button>

        {account === null ? (
          <Link
            href="/login"
            className="rounded-control border border-border bg-card px-[13px] py-[7px] text-[13px] font-[540] text-foreground transition-colors hover:border-faint"
          >
            Sign in
          </Link>
        ) : (
          <div className="flex items-center gap-1.5">
            {account.handle ? (
              <Link
                href={`/u/${account.handle}`}
                className="rounded-control px-2 py-1.5 font-mono text-[12px] text-muted transition-colors hover:bg-subtle hover:text-foreground"
              >
                @{account.handle}
              </Link>
            ) : (
              <Link
                href="/onboarding"
                className="rounded-control px-2 py-1.5 text-[13px] text-accent transition-colors hover:underline"
              >
                Finish setup
              </Link>
            )}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-control px-2 py-1.5 text-[13px] text-muted transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        )}

        <ThemeToggle />
      </div>
    </nav>
  );
}
