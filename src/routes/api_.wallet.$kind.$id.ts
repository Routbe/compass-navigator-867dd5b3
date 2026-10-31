import { createFileRoute } from "@tanstack/react-router";

/**
 * GET /api/wallet/<profile|event>/<handle|slug>?type=apple|google
 * Apple: returns the signed .pkpass. Google: redirects to the "Save to Google Wallet" link.
 * Only public profiles/events are issued; without certificates it answers 503 wallet_not_configured.
 */
export const Route = createFileRoute("/api_/wallet/$kind/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { isWalletKind, walletStatus } = await import("@/lib/wallet/wallet-pass");
        const url = new URL(request.url);
        const type = url.searchParams.get("type");
        if (!isWalletKind(params.kind) || (type !== "apple" && type !== "google") || !/^[\w.-]{1,100}$/.test(params.id)) {
          return Response.json({ error: "invalid_request" }, { status: 400 });
        }
        const { guardShared } = await import("@/lib/rate-limit-db.server");
        const limited = await guardShared(request, "wallet-pass", { limit: 30, windowSec: 60 });
        if (limited) return limited;
        const status = walletStatus(process.env as Record<string, string | undefined>);
        if (!status[type]) return Response.json({ error: "wallet_not_configured", wallet: type }, { status: 503 });

        const { loadWalletSubject } = await import("@/lib/wallet/wallet.server");
        const subject = await loadWalletSubject(params.kind, params.id, url.origin);
        if (!subject) return Response.json({ error: "not_found" }, { status: 404 });

        try {
          if (type === "google") {
            const { googleSaveUrl } = await import("@/lib/wallet/google-wallet.server");
            return Response.redirect(await googleSaveUrl(subject, url.origin), 302);
          }
          const img = async (path: string) => new Uint8Array(await (await fetch(`${url.origin}${path}`)).arrayBuffer());
          const [icon, icon2x, logo] = await Promise.all([img("/favicon.png"), img("/icon-192.png"), img("/apple-touch-icon.png")]);
          const { buildPkpass } = await import("@/lib/wallet/apple-wallet.server");
          const pkpass = await buildPkpass(subject, { "icon.png": icon, "icon@2x.png": icon2x, "logo.png": logo });
          return new Response(pkpass as unknown as BodyInit, {
            headers: {
              "content-type": "application/vnd.apple.pkpass",
              "content-disposition": `attachment; filename="rout-${subject.kind}.pkpass"`,
              "cache-control": "no-store",
            },
          });
        } catch (e) {
          console.error("[wallet] issue failed", type, (e as Error)?.message);
          return Response.json({ error: "wallet_issue_failed", wallet: type }, { status: 500 });
        }
      },
    },
  },
});
