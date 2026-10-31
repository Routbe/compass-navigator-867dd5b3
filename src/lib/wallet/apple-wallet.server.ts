/**
 * Apple Wallet .pkpass builder: pass.json + images + manifest.json (SHA-1),
 * signed as a detached PKCS#7 with the Pass Type ID certificate and Apple WWDR.
 * Secrets are read per call; nothing is cached at module level.
 */
import { applePassJson, type WalletSubject } from "./wallet-pass";

const pem = (v: string | undefined) => (v ?? "").replace(/\\n/g, "\n").trim();

async function sha1Hex(bytes: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-1", bytes);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toBinaryString(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return s;
}

/** Builds the signed .pkpass. `images` must contain at least icon.png. */
export async function buildPkpass(subject: WalletSubject, images: Record<string, Uint8Array>): Promise<Uint8Array> {
  const env = process.env;
  const passJson = applePassJson(subject, {
    passTypeId: env["APPLE_WALLET_PASS_TYPE_ID"]!.trim(),
    teamId: env["APPLE_WALLET_TEAM_ID"]!.trim(),
  });
  const files: Record<string, Uint8Array> = {
    "pass.json": new TextEncoder().encode(JSON.stringify(passJson)),
    ...images,
  };
  const manifest: Record<string, string> = {};
  for (const [name, bytes] of Object.entries(files)) manifest[name] = await sha1Hex(bytes);
  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));

  const forge = (await import("node-forge")).default;
  const cert = forge.pki.certificateFromPem(pem(env["APPLE_WALLET_CERT_PEM"]));
  const wwdr = forge.pki.certificateFromPem(pem(env["APPLE_WALLET_WWDR_PEM"]));
  const passphrase = env["APPLE_WALLET_KEY_PASSPHRASE"];
  const keyPem = pem(env["APPLE_WALLET_KEY_PEM"]);
  const key = passphrase ? forge.pki.decryptRsaPrivateKey(keyPem, passphrase) : forge.pki.privateKeyFromPem(keyPem);
  if (!key) throw new Error("apple_wallet_key_unreadable");

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(toBinaryString(manifestBytes), "raw");
  p7.addCertificate(cert);
  p7.addCertificate(wwdr);
  p7.addSigner({
    key,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() as unknown as string },
    ],
  });
  p7.sign({ detached: true });
  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  const signature = Uint8Array.from(der, (c: string) => c.charCodeAt(0));

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const [name, bytes] of Object.entries(files)) zip.file(name, bytes);
  zip.file("manifest.json", manifestBytes);
  zip.file("signature", signature);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
