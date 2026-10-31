# Plan: hardening, save-error fix and new features (in order of priority)

This is a lot of work. I'll build it in 8 rounds, one after the other. After each round I run the type check and the full test suite.

## Round 1 — Fix the "Niet opgeslagen" error (top priority)
- Find what actually causes it: trace the Studio auto-save (the hook that shows `studio.editor.notSaved`) and its server function. Check it against the live Neon database: the session, the `display_prefs`/theme data checks, and timeouts.
- Fix that cause first. Then make the server return a clear error (`code`, `message`, `status`) instead of a bare 500. The codes: `session_expired`, `validation_failed`, `db_unavailable`, `db_timeout`, `conflict`, `unknown`.
- Make the red text clickable. It opens a "Concept kon niet worden opgeslagen" window with:
  - a plain-language explanation
  - a technical section you can expand (code, HTTP status, time)
  - two buttons: "Nu opnieuw opslaan" and "Foutrapport sturen naar beheerder"
- Add a Brevo error reporter that sends the admin the error name, stack trace, user/workspace ID, endpoint, method and user-agent.
  - It runs when the user clicks the report button, or automatically on a critical save error.
  - Auto mode sends at most 1 email per error type per 15 minutes, using the existing `rate_limits` table.
- Tests: the reporter is called when a save fails, and the 15-minute limit works.

## Round 2 — Short-link redirect policy
- Visitors go straight through without the warning screen when the link owner is Tier 1 or Tier 2 verified, or has a confirmed email address.
- The "Je verlaat ROUT" warning screen stays for anonymous, unconfirmed or brand-new accounts.
  - The screen shows the destination domain, a safety-check status and a "Ga door naar externe site" button.
- All of this lives in one pure rule, with tests.

## Round 3 — Security review (RFC-003)
- **IDOR:** check every workspace, QR and vault server function and route for a role check (owner/admin/developer) inside the active workspace. Close any gaps and add tests.
- **SSRF:** add one central `safe-fetch` guard and route these through it: custom domain checks, outgoing webhooks, favicon/OG fetchers and the image proxy.
  - It blocks localhost, 127/8, 10/8, 172.16/12, 192.168/16, 169.254/16, IPv6 loopback/ULA/link-local and non-http(s) URLs.
  - It also checks redirects.
  - Tests cover each blocked range.
- **Webhook replay:** incoming Stripe, Mollie and Didit webhooks must carry a timestamp within 300 seconds, with the signature checked first. Tests included.

## Round 4 — YouTube live status
- The YouTube card uses the theme's colours instead of white, matching Spotify and Chess. Only the red logo keeps its own colour.
- A live status older than 15 minutes counts as offline, and the card falls back to the channel link or latest video.
- Push updates through YouTube's notification hub:
  - When a channel is connected, ROUT subscribes to its feed.
  - The callback route checks the hub's signature and the verify challenge, then updates the stored presence.
- When the channel is live, the profile shows a "LIVE NOW" badge.
- `/u/:handle/live` (and `/:handle/live`) sends visitors to the live stream, or to the profile when offline.
- Tests: the TTL rule and the parsing of feed notifications.

## Round 5 — Studio cleanup
- The Inhoud tab no longer has the avatar shape option.
- The Vormgeving tab drops the duplicate name/bio/upload fields and gets the avatar shape picker (Rond, Afgerond, Zeshoek, Squircle), which updates the preview live.
- The large "Mijn ontwerpen" card is replaced by a small presets icon in the top action bar, which opens a compact save/load window.
- The copy icon becomes a Share icon. It opens the same share window as the public profile: copy link, QR download, business card as PNG, and business card as PDF.

## Round 6 — Feedback & reviews
- New tables `feedback_forms` and `feedback_responses`, each with one access policy, plus workspace scope.
- New QR type "Feedback & Reviews", a Feedback card on the profile (more than one allowed), and a feedback page at `/u/:handle/feedback` and `/w/:slug/feedback`.
- Anonymous submissions are rate-limited.
- A Studio tab shows the average score, the list of responses and a "show on profile" switch. Featured reviews appear in a testimonial slider on the profile.
- Tests: creating forms and submitting anonymously.

## Round 7 — Events
- New `events` table.
- New QR type "Evenement" with a live preview.
- An `.ics` calendar download.
- An event card on the profile with a countdown and Agenda/Route/Tickets buttons.
- Event pages at `/e/:slug` and `/u/:handle/e/:slug`.
- Tests: the `.ics` output (escaping, UTC, line folding) and slug lookup.

## Round 8 — Steam and lightweight effects
- New `steam_integrations` table.
- A server-side Steam fetcher with a 5-minute cache that resolves vanity names. Visitors' browsers never contact Steam, and game images go through the image proxy (Steam CDN added to the allowlist).
- A Steam card with in-game, online and offline states, the Steam icon, and a "Steam Profiel" QR type.
- Tests: the cache logic and the vanity resolver.
- CSS-only effects:
  - an animated laser border
  - a refined glass style
  - a pulsing status aura that keeps up with the avatar via anchor positioning, with a fallback for browsers that lack it
- About the other AI's advice: I agree with your own assessment. No WebGL, Three.js or canvas text, because of battery drain, accessibility and bundle size. Everything is CSS and SVG, and it respects reduced-motion settings.

## What you need to provide
- `STEAM_WEB_API_KEY` for round 8.
- An admin email address to receive error reports (round 1). The existing Brevo connection is used for sending.

## Technical notes
- Migration number 0132 is already taken. New files will be 0133 (feedback), 0134 (events) and 0135 (steam), and they go only into `db/`. After each one I refresh the snapshot and types.
- YouTube logic lives in `src/lib/youtube.server.ts`; I extend that file rather than create a new `presence/` file.
- New public endpoints go under `/api/public/...` and check signatures, tokens or rate limits themselves.
- AGENTS.md gets new rules: the safe-fetch guard, the webhook timestamp window and the error-reporter rate limit.
