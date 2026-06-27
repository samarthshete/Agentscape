"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import type { NavAccount } from "./TopNav";
import { SearchBar } from "./SearchBar";
import { CloseIcon, MenuIcon } from "./icons";

interface NavLink {
  label: string;
  href: string;
}

// Thin client island: the mobile replacement for the desktop nav. Below `md` the
// inline links + search collapse into this menu so a phone user can still reach
// every discovery destination. The panel is portaled to <body> because the nav has
// `backdrop-blur` (which would otherwise contain a `fixed` child). Accessible:
// labelled toggle, Escape + outside-click + route-change close, focus moved into
// the panel on open and back to the button on close. Any motion is covered by the
// global prefers-reduced-motion guard in globals.css.
export function MobileNav({
  account,
  links,
}: {
  account: NavAccount | null;
  links: NavLink[];
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const panelId = useId();

  useEffect(() => setMounted(true), []);

  // Close on navigation — covers the nav links and the search submit (→ /search).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // While open: Escape closes; resizing up to desktop closes (the toggle is
  // md:hidden, so a lingering panel would be orphaned); move focus into the panel.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onResize() {
      if (window.innerWidth >= 768) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const linkCls =
    "rounded-control px-3 py-2.5 text-[14px] text-muted transition-colors hover:bg-subtle hover:text-foreground";

  return (
    <div className="flex md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 flex-none items-center justify-center rounded-control border border-border bg-subtle text-muted transition-colors hover:border-faint hover:text-foreground"
      >
        {open ? (
          <CloseIcon className="h-[15px] w-[15px]" />
        ) : (
          <MenuIcon className="h-[15px] w-[15px]" />
        )}
      </button>

      {mounted && open
        ? createPortal(
            <>
              <div
                className="fixed inset-0 top-14 z-40 bg-background/50"
                aria-hidden="true"
                onClick={() => setOpen(false)}
              />
              <div
                ref={panelRef}
                id={panelId}
                role="region"
                aria-label="Site navigation"
                tabIndex={-1}
                className="fixed inset-x-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-divider bg-background px-4 pb-5 pt-3 outline-none"
              >
                <div className="mb-3">
                  <SearchBar showShortcut={false} />
                </div>

                <nav aria-label="Primary" className="flex flex-col">
                  {links.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      prefetch={false}
                      onClick={() => setOpen(false)}
                      className={linkCls}
                    >
                      {l.label}
                    </Link>
                  ))}
                </nav>

                <div className="my-3 h-px bg-divider" />

                {account === null ? (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className={linkCls}
                  >
                    Sign in
                  </Link>
                ) : (
                  <div className="flex flex-col">
                    {account.handle ? (
                      <>
                        <Link
                          href="/bookmarks"
                          onClick={() => setOpen(false)}
                          className={linkCls}
                        >
                          Saved
                        </Link>
                        <Link
                          href={`/u/${account.handle}`}
                          onClick={() => setOpen(false)}
                          className={`${linkCls} font-mono text-[13px]`}
                        >
                          @{account.handle}
                        </Link>
                      </>
                    ) : (
                      <Link
                        href="/onboarding"
                        onClick={() => setOpen(false)}
                        className={`${linkCls} text-accent`}
                      >
                        Finish setup
                      </Link>
                    )}
                    <form action={signOut}>
                      <button type="submit" className={`${linkCls} w-full text-left`}>
                        Sign out
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
