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

## Open (handoff round 9)
- [ ] Task B: inbound OIDC email forwarding (priv-…@mail.rout.be → verified email), migration 0137, webhook, tests
- [ ] Task C: Apple Wallet (.pkpass) + Google Wallet for profile and event, "Add to Wallet" in share menu + event page, friendly fallback without certificates
- [ ] Task D: full test run, typecheck, roadmap update

## Waiting on user
- [ ] Secrets in this project (Better Auth, Brevo, Stripe/Wise, storage, Steam, wallet certificates, EMAIL_INBOUND_TOKEN)
- [ ] Live sign-in test (needs secrets)
