/** Server side of the per-app email choice. */
import { sql } from "@/lib/neon";
import { emailOptions, pickOption, resolveAppEmail, type EmailOption } from "./email-broker";

type Row = Record<string, unknown>;

export async function emailOptionsOf(userId: string): Promise<EmailOption[]> {
  const u = ((await sql`select email, email_confirmed_at from public.users where id = ${userId} limit 1`) as Row[])[0];
  const aliases = (await sql`select id, alias, status from public.email_aliases where user_id = ${userId} order by created_at`) as Row[];
  return emailOptions(
    { email: (u?.["email"] as string | null) ?? null, verified: Boolean(u?.["email_confirmed_at"]) },
    aliases.map((a) => ({ id: String(a["id"]), alias: String(a["alias"]), status: String(a["status"]) })),
  );
}

/** Saves the user's choice; unknown choices are ignored (primary stays the default). */
export async function assignAppEmail(userId: string, clientId: string, choiceId: string | undefined): Promise<void> {
  const opt = pickOption(choiceId, await emailOptionsOf(userId));
  if (!opt) return;
  await sql`insert into public.app_email_assignments (user_id, client_id, source, alias_id, assigned_email, updated_at)
    values (${userId}, ${clientId}, ${opt.source}, ${opt.aliasId}, ${opt.email}, now())
    on conflict (user_id, client_id) do update set source = excluded.source, alias_id = excluded.alias_id,
      assigned_email = excluded.assigned_email, updated_at = now()`;
}

/** Email claim for one app. */
export async function appEmailFor(userId: string, clientId: string | null): Promise<EmailOption | null> {
  const options = await emailOptionsOf(userId);
  if (!clientId) return resolveAppEmail(null, options);
  const r = ((await sql`select source, alias_id from public.app_email_assignments
    where user_id = ${userId} and client_id = ${clientId} limit 1`) as Row[])[0];
  return resolveAppEmail(r ? { source: r["source"] as "primary" | "alias", aliasId: (r["alias_id"] as string | null) ?? null } : null, options);
}
