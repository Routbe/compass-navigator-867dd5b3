/** Server side of the per-app email choice (primary, verified alias or private relay). */
import { sql } from "@/lib/neon";
import { emailOptions, pickOption, resolveAppEmail, type EmailOption, type EmailSource } from "./email-broker";

type Row = Record<string, unknown>;

/** Options for one user; with a clientId the app's private relay is offered too. */
export async function emailOptionsOf(userId: string, clientId?: string | null): Promise<EmailOption[]> {
  const u = ((await sql`select email, email_confirmed_at from public.users where id = ${userId} limit 1`) as Row[])[0];
  const aliases = (await sql`select id, alias, status from public.email_aliases where user_id = ${userId} order by created_at`) as Row[];
  let relay: string | null = null;
  if (clientId) {
    const { relayAddressFor } = await import("./email-forwarding.server");
    relay = await relayAddressFor(userId, clientId);
  }
  return emailOptions(
    { email: (u?.["email"] as string | null) ?? null, verified: Boolean(u?.["email_confirmed_at"]) },
    aliases.map((a) => ({ id: String(a["id"]), alias: String(a["alias"]), status: String(a["status"]) })),
    relay,
  );
}

/** Saves the user's choice; unknown choices are ignored (primary stays the default). */
export async function assignAppEmail(userId: string, clientId: string, choiceId: string | undefined): Promise<void> {
  const opt = pickOption(choiceId, await emailOptionsOf(userId, clientId));
  if (!opt) return;
  let email = opt.email;
  if (opt.source === "relay") {
    const { ensureForwardingAddress } = await import("./email-forwarding.server");
    email = await ensureForwardingAddress(userId, clientId);
  }
  await sql`insert into public.app_email_assignments (user_id, client_id, source, alias_id, assigned_email, updated_at)
    values (${userId}, ${clientId}, ${opt.source}, ${opt.aliasId}, ${email}, now())
    on conflict (user_id, client_id) do update set source = excluded.source, alias_id = excluded.alias_id,
      assigned_email = excluded.assigned_email, updated_at = now()`;
}

/** Email claim for one app. A relay counts only while its forwarding rule is active. */
export async function appEmailFor(userId: string, clientId: string | null): Promise<EmailOption | null> {
  const options = await emailOptionsOf(userId, clientId);
  if (!clientId) return resolveAppEmail(null, options);
  const r = ((await sql`select a.source, a.alias_id, a.assigned_email,
      (select f.status from public.oauth_email_forwarding_rules f where f.user_id = a.user_id and f.client_id = a.client_id) as relay_status
    from public.app_email_assignments a where a.user_id = ${userId} and a.client_id = ${clientId} limit 1`) as Row[])[0];
  if (!r) return resolveAppEmail(null, options);
  const source = r["source"] as EmailSource;
  if (source === "relay" && r["relay_status"] !== "active") return resolveAppEmail(null, options);
  const resolved = resolveAppEmail({ source, aliasId: (r["alias_id"] as string | null) ?? null }, options);
  // The stored relay address is the one the forwarding rule knows; prefer it over a re-derived one.
  if (resolved?.source === "relay" && typeof r["assigned_email"] === "string") return { ...resolved, email: r["assigned_email"] };
  return resolved;
}
