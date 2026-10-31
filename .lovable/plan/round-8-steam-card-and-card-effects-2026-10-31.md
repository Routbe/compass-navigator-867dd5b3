# Round 8: Steam card and card effects

## Goal
Build the Steam live card and the lightweight, battery-friendly card effects. The effects need no extra keys. The Steam card only goes live once a Steam key is available.

## Steps
1. **Card effects (no key needed)**
   - Animated laser border, using a CSS conic gradient with `@property`. It runs only on active or live cards.
   - Liquid-glass surfaces, built from the existing glass settings in the theme engine.
   - A pulsing live glow for YouTube, Twitch and Steam status.
   - Every effect turns off when the visitor's device asks for reduced motion. No WebGL.
   - A toggle in Studio under Vormgeving, saved through the existing theme engine rules.
2. **Steam engine**
   - New database step `0136_steam_integration.sql`: a Steam ID on the profile link, stored under the same access rules as other profile data.
   - A server-side Steam relay with a 5-minute cache, so visitors never contact Steam directly. Without `STEAM_WEB_API_KEY` it quietly shows "offline" instead of an error.
   - A public status read through the existing presence pattern.
   - A Steam card on the profile, plus the Steam brand icon in the QR generator.
3. **Tests**
   - Effect rules: reduced motion and the toggle.
   - Steam status mapping: in game, online, offline, and a missing key.
   - Cache expiry.
   - Run the full test suite.
4. **Roadmap**: mark Round 8 done. The key and the old-password cleanup (0125) stay open.

## Still open after this
- Steam key: the card goes live once you add it.
- The 0125 cleanup of old passwords: still waits for your OK.
- Google and Apple sign-in keys.

## Technical details
- Effects live in `src/styles.css` as utilities. The rules sit in the pure `theme-engine.ts`.
- The relay follows `custom-presence.server.ts`. Steam images go through `/api/public/proxy-image`: the Steam image host is added to `image-proxy-rules.ts`.
