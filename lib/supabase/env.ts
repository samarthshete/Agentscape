// Tiny env accessor so every client fails loudly (not with `undefined`) when a
// required variable is missing. No secrets are read here unless explicitly asked.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
