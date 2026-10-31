# Roadmap

## Done
- [x] Neon connected, migrations to 0134 applied
- [x] Two-tier identity + workspace-scoped console
- [x] Round 1: "Niet opgeslagen" root cause + help window + Brevo error reports
- [x] Round 2: short-link trust rule + new "Je verlaat ROUT" screen
- [x] Round 3: SSRF (calendar fetches), Stripe replay window, workspace permission tests
- [x] Round 4: YouTube theme, 15-min TTL, push updates, LIVE badge, /live link
- [x] Round 5: Studio cleanup (avatar shape in Vormgeving + squircle, presets icon, share icon)
- [x] Round 6: Feedback & reviews (0134 applied, tests green)
- [x] Round 7: Events engine (0135 applied, Studio panel, /event/:slug with QR + .ics)
- [x] Round 8: Steam card + CSS effects (STEAM_WEB_API_KEY still to set)
- [x] Re-import 1:1 from compass-navigator-500baf53, Neon linked in this project
- [x] Task A: migration 0136 (per-app email choice) applied on Neon
- [x] Migration 0125: legacy password column dropped on Neon
- [x] OIDC email broker (RFC-004): per-app email routing + pairwise app IDs

- [x] Round 9 B: private e-mail relay (priv-…@mail.rout.be → verified email), 0137 applied, Brevo inbound webhook, tests
- [x] Round 9 C: Apple Wallet (.pkpass) + Google Wallet for profiles and events, "Add to Wallet" in share menu + event page, fallback without certificates
- [x] Round 9 D: 1077 tests green, typecheck clean

## Open (audit round 10)
- [ ] Wallet: accept APPLE_PASS_* / GOOGLE_WALLET_SERVICE_ACCOUNT names, demo payload when not configured, pass-generator.server.ts
- [ ] Short link /e/:slug → /event/:slug (301)
- [ ] Profile agenda card fed by published profile_events (detail, .ics, Google)
- [ ] Steam QR type (official mark, steamcommunity.com/id|profiles validation, Steam style)
- [ ] Missing keys never crash UI (Steam, social login, Brevo, wallet) — audit
- [ ] Relay address as a choice on the "Login met ROUT" consent screen (forwarding pipeline is ready; ensureForwardingAddress not yet offered to apps)

## Waiting on user
- [ ] Secrets in this project: BETTER_AUTH_SECRET, ROUT_PROVIDER_*, Google/Apple sign-in, BREVO_API_KEY, Stripe/Wise, storage, STEAM_WEB_API_KEY, Apple/Google Wallet certificates, EMAIL_INBOUND_TOKEN
- [ ] Live sign-in test (needs secrets)
