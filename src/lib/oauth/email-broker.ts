/** Per-app email choice ("Sovereign Email Broker"). Pure and browser-safe. */

export type EmailOption = { id: string; source: "primary" | "alias"; aliasId: string | null; email: string; verified: boolean };
export type EmailAssignment = { source: "primary" | "alias"; aliasId: string | null } | null;

/** Primary first, then active aliases; duplicates removed. */
export function emailOptions(
  primary: { email: string | null; verified: boolean },
  aliases: { id: string; alias: string; status: string }[],
): EmailOption[] {
  const out: EmailOption[] = [];
  const seen = new Set<string>();
  if (primary.email) {
    out.push({ id: "primary", source: "primary", aliasId: null, email: primary.email, verified: primary.verified });
    seen.add(primary.email.toLowerCase());
  }
  for (const a of aliases) {
    if (a.status !== "active" || !a.alias.includes("@") || seen.has(a.alias.toLowerCase())) continue;
    seen.add(a.alias.toLowerCase());
    out.push({ id: a.id, source: "alias", aliasId: a.id, email: a.alias, verified: true });
  }
  return out;
}

/** The email an app receives. A removed alias falls back to the primary address. */
export function resolveAppEmail(assignment: EmailAssignment, options: EmailOption[]): EmailOption | null {
  if (assignment?.source === "alias") {
    const hit = options.find((o) => o.source === "alias" && o.aliasId === assignment.aliasId);
    if (hit) return hit;
  }
  return options.find((o) => o.source === "primary") ?? null;
}

/** Validates a consent-screen choice against the user's own options. */
export function pickOption(choiceId: string | undefined, options: EmailOption[]): EmailOption | null {
  if (!choiceId) return null;
  return options.find((o) => o.id === choiceId) ?? null;
}
