import type { Config } from "tailwindcss";

// Tokens come from the Claude Design handoff ("Agentscape — Design Language").
// Colors are CSS variables so the same utility classes resolve to dark (primary
// canvas) or light (full parity) depending on the `.dark` class on <html>.
// Spacing follows Tailwind's default 4/8 scale (1:1 with the handoff).
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)", // bg / base
        subtle: "var(--subtle)", // bg / subtle (inputs, code wells)
        card: "var(--card)", // surface / card
        border: "var(--border)", // border / default
        divider: "var(--divider)", // border / subtle
        foreground: "var(--foreground)", // text / primary
        muted: "var(--muted)", // text / secondary
        faint: "var(--faint)", // text / muted
        accent: {
          DEFAULT: "var(--accent)",
          strong: "var(--accent-strong)",
          foreground: "var(--accent-foreground)",
        },
        verified: {
          DEFAULT: "var(--verified)",
          bg: "var(--verified-bg)",
          border: "var(--verified-border)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        // handoff: badge/pill 6, control 8, card 12
        badge: "6px",
        control: "8px",
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
