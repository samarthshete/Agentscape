"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "./icons";

// Thin client island: copies a value (e.g. the endpoint URL) to the clipboard.
export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label ?? `Copy ${value}`}
      className="flex-none text-faint transition-colors hover:text-foreground"
    >
      {copied ? (
        <CheckIcon className="h-[11px] w-[11px] text-verified" />
      ) : (
        <CopyIcon className="h-[11px] w-[11px]" />
      )}
    </button>
  );
}
