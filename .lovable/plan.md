# Plan: choosing the relay address at login, then the keys form

You sent two directives at once. This plan does the short one now: choosing an e-mail address on the "Login met ROUT" screen, plus the keys form. The large expansion suite (5 pillars) is split into separate rounds afterwards, because each pillar needs its own database changes and decisions.

## Round A: picking an e-mail address on the login permission screen

When an app asks for your e-mail, the permission screen lets you choose:
1. Your main e-mail address
2. A confirmed extra address (if you have one)
3. ROUT Private Relay (`priv-…@mail.rout.be`), so the app never sees your real address

What the app receives:
- The choice is saved per app.
- The app gets the chosen address in its login details and on the user-info lookup.
- With Private Relay, mail to that address is forwarded to your real address using the forwarding that is already built.
- Removing an extra address falls back to the main one.

Current state: the per-app e-mail logic and its table exist, but the permission screen and the login details do not use them yet. The table only allows "main" or "extra", so it needs one small database update to also allow "relay".

## Round B: keys form, in your order

1. `BREVO_API_KEY`
2. `STEAM_WEB_API_KEY`
3. `APPLE_PASS_CERTIFICATE`, `APPLE_PASS_KEY` (+ pass type ID, team ID, Apple WWDR certificate, all required for signing), `GOOGLE_WALLET_SERVICE_ACCOUNT` + `GOOGLE_WALLET_ISSUER_ID`
4. `GOOGLE_CLIENT_ID`/`SECRET`, `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`

Each form says where to find the value. After Brevo is added, I send one test mail to check it.

## Later rounds (expansion suite), each with its own plan

- C: Proof-of-Encounter handshake + day/evening link rules
- D: 18+ badge without a birth date, VAT (VIES) check, employee badges with revocation, vouching
- E: human-only links/downloads, end-to-end encrypted contact forms
- F: brand kits inherited by workspaces, SEPA QR with a structured payment reference
- G: `rout:human_verified` login claim, `rout.config.json` import/export

Wallet passes (pillar 1A) are already built and are not repeated.

## Technical details

- New migration `0138_app_email_relay.sql`: widen the `source` check to `primary|alias|relay`; relay rows keep `alias_id` null. RLS stays the existing `rout_scope`.
- `email-broker.ts`: add a relay option and resolution (pure, tested). `email-broker.server.ts`: on a relay choice, call `ensureForwardingAddress(userId, clientId)` and store it as `assigned_email`.
- Consent RPC returns the options and accepts the choice; the ID token and userinfo `email` claim come from `appEmailFor()`. The relay address is always `email_verified: true`.
- Tests: choice saved per app, relay resolution, userinfo returns the relay address (with database calls mocked), fallback when an extra address is removed.
- Gates: `tsgo --noEmit`, full Vitest run, migration replay snapshot refreshed.
