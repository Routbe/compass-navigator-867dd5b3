/** Loads a wallet subject from public data only (same visibility rules as the public pages). */
import type { WalletKind, WalletSubject } from "./wallet-pass";

export async function loadWalletSubject(kind: WalletKind, id: string, origin: string): Promise<WalletSubject | null> {
  if (kind === "profile") {
    const { readPublicProfile } = await import("@/lib/studio-profile.server");
    const p = (await readPublicProfile(id)) as Record<string, unknown> | null;
    if (!p) return null;
    const handle = String(p["username"] ?? id);
    return {
      kind,
      id: handle,
      title: String(p["display_name"] || `@${handle}`),
      subtitle: `@${handle}`,
      url: `${origin}/${encodeURIComponent(handle)}`,
    };
  }
  const { readPublicEvents } = await import("@/lib/event-engine.server");
  const e = (await readPublicEvents(id, null, null))[0];
  if (!e) return null;
  const when = new Date(e.startsAt).toLocaleString("nl-BE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Brussels" });
  return {
    kind,
    id: e.slug,
    title: e.title,
    subtitle: when,
    url: `${origin}/event/${encodeURIComponent(e.slug)}`,
    startsAt: e.startsAt,
    venue: e.venue || null,
  };
}
