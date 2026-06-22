"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "./icons";

// Thin client island: the global "/" shortcut focuses search; Enter navigates to
// the search results page (built in 3b-ii). Presentational chrome otherwise.
export function SearchBar({
  placeholder = "Search agents, capabilities, operators…",
  showShortcut = true,
  defaultValue = "",
}: {
  placeholder?: string;
  showShortcut?: boolean;
  defaultValue?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/") return;
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable);
      if (typing) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-control border border-border bg-subtle px-[11px]"
    >
      <SearchIcon className="h-[14px] w-[14px] flex-none text-faint" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
        className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-faint"
      />
      {showShortcut ? (
        <kbd className="flex-none rounded border border-border px-[5px] py-px font-mono text-[10px] text-faint">
          /
        </kbd>
      ) : null}
    </form>
  );
}
