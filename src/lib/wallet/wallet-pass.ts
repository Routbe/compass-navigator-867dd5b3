/**
 * Wallet pass content for profiles and events (pure, browser-safe).
 * Apple (.pkpass pass.json) and Google (Generic pass object) are built from the
 * same subject so both wallets always show the same card.
 */

export type WalletKind = "profile" | "event";
export type WalletSubject = {
  kind: WalletKind;
  /** Stable id: profile handle or event slug. */
  id: string;
  title: string;
  subtitle: string;
  url: string;
  /** ISO start time (events only). */
  startsAt?: string | null;
  venue?: string | null;
};

export type WalletStatus = { apple: boolean; google: boolean };

type Env = Record<string, string | undefined>;
const has = (env: Env, k: string) => Boolean(env[k]?.trim());

/** Which wallets can issue passes; partial configuration counts as off. */
export function walletStatus(env: Env): WalletStatus {
  return {
    apple: ["APPLE_WALLET_PASS_TYPE_ID", "APPLE_WALLET_TEAM_ID", "APPLE_WALLET_CERT_PEM", "APPLE_WALLET_KEY_PEM", "APPLE_WALLET_WWDR_PEM"].every((k) => has(env, k)),
    google: ["GOOGLE_WALLET_ISSUER_ID", "GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL", "GOOGLE_WALLET_PRIVATE_KEY"].every((k) => has(env, k)),
  };
}

export function isWalletKind(v: unknown): v is WalletKind {
  return v === "profile" || v === "event";
}

/** Serial/object suffix: only [a-z0-9._-], max 64 chars, kind-prefixed so ids never collide. */
export function walletSerial(s: Pick<WalletSubject, "kind" | "id">): string {
  return `${s.kind}-${s.id.toLowerCase().replace(/[^a-z0-9._-]/g, "-")}`.slice(0, 64);
}

const clip = (v: string | null | undefined, n: number) => (v ?? "").slice(0, n);

/** Apple pass.json (generic style). */
export function applePassJson(s: WalletSubject, cfg: { passTypeId: string; teamId: string }) {
  const isEvent = s.kind === "event";
  return {
    formatVersion: 1,
    passTypeIdentifier: cfg.passTypeId,
    teamIdentifier: cfg.teamId,
    serialNumber: walletSerial(s),
    organizationName: "ROUT",
    description: isEvent ? `Evenement: ${clip(s.title, 60)}` : `ROUT-visitekaartje van ${clip(s.title, 60)}`,
    logoText: "ROUT",
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: "rgb(17, 17, 17)",
    labelColor: "rgb(180, 180, 180)",
    ...(isEvent && s.startsAt ? { relevantDate: s.startsAt } : {}),
    barcodes: [{ format: "PKBarcodeFormatQR", message: s.url, messageEncoding: "iso-8859-1", altText: clip(s.url.replace(/^https?:\/\//, ""), 60) }],
    generic: {
      primaryFields: [{ key: "title", label: isEvent ? "EVENEMENT" : "PROFIEL", value: clip(s.title, 60) }],
      secondaryFields: [{ key: "subtitle", label: isEvent ? "WANNEER" : "HANDLE", value: clip(s.subtitle, 60) }],
      ...(isEvent && s.venue ? { auxiliaryFields: [{ key: "venue", label: "LOCATIE", value: clip(s.venue, 60) }] } : {}),
      backFields: [{ key: "link", label: "Link", value: s.url }],
    },
  };
}

/** Google Wallet "Save to Google Wallet" JWT claims (class + object inline). */
export function googleSaveClaims(s: WalletSubject, cfg: { issuerId: string; serviceAccountEmail: string; origins: string[] }) {
  const classId = `${cfg.issuerId}.rout_${s.kind}`;
  const object = {
    id: `${cfg.issuerId}.${walletSerial(s).replace(/[^a-zA-Z0-9._-]/g, "_")}`,
    classId,
    state: "ACTIVE",
    hexBackgroundColor: "#111111",
    cardTitle: { defaultValue: { language: "nl", value: "ROUT" } },
    header: { defaultValue: { language: "nl", value: clip(s.title, 60) } },
    subheader: { defaultValue: { language: "nl", value: s.kind === "event" ? "Evenement" : "Profiel" } },
    textModulesData: [
      { id: "subtitle", header: s.kind === "event" ? "Wanneer" : "Handle", body: clip(s.subtitle, 120) },
      ...(s.venue ? [{ id: "venue", header: "Locatie", body: clip(s.venue, 120) }] : []),
    ],
    barcode: { type: "QR_CODE", value: s.url, alternateText: clip(s.url.replace(/^https?:\/\//, ""), 60) },
    linksModuleData: { uris: [{ uri: s.url, description: "Open in ROUT", id: "open" }] },
  };
  return {
    iss: cfg.serviceAccountEmail,
    aud: "google",
    typ: "savetowallet",
    origins: cfg.origins,
    payload: { genericClasses: [{ id: classId }], genericObjects: [object] },
  };
}
