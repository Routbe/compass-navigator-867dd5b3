/** Google Wallet "Save" link: RS256 JWT signed with the service account key. */
import { googleSaveClaims, type WalletSubject } from "./wallet-pass";

export async function googleSaveUrl(subject: WalletSubject, origin: string): Promise<string> {
  const env = process.env;
  const { SignJWT, importPKCS8 } = await import("jose");
  const claims = googleSaveClaims(subject, {
    issuerId: env["GOOGLE_WALLET_ISSUER_ID"]!.trim(),
    serviceAccountEmail: env["GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL"]!.trim(),
    origins: [origin],
  });
  const key = await importPKCS8((env["GOOGLE_WALLET_PRIVATE_KEY"] ?? "").replace(/\\n/g, "\n").trim(), "RS256");
  const { iss, aud, ...rest } = claims;
  const jwt = await new SignJWT(rest as Record<string, unknown>)
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(iss)
    .setAudience(aud)
    .setIssuedAt()
    .sign(key);
  return `https://pay.google.com/gp/v/save/${jwt}`;
}
