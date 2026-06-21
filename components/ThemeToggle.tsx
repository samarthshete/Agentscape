"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./icons";

// Thin client island: flips the `.dark` class on <html> and persists the choice.
// Initial class is set pre-paint by the inline script in the root layout.
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore storage failures */
    }
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-8 w-8 flex-none items-center justify-center rounded-control border border-border bg-subtle text-muted transition-colors hover:border-faint hover:text-foreground"
    >
      {isDark ? (
        <SunIcon className="h-[15px] w-[15px]" />
      ) : (
        <MoonIcon className="h-[15px] w-[15px]" />
      )}
    </button>
  );
}
