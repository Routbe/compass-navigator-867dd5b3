# Plan: Neon koppelen, workspaces echt scheiden, verificatie in twee niveaus, interactieve badges

Belangrijk om te weten: een deel van dit werk staat al in de geïmporteerde code: databasewijzigingen 0130 (verificatie in twee niveaus) en 0131 (niveaus + workspace-scheiding), een 5-stappenwizard voor workspaces, een publieke `/w/$slug`-pagina en een "Lid sinds"-regel. Waarschijnlijk werkt het in de preview nog niet omdat de database niet gekoppeld is, en omdat niet elke pagina de gekozen workspace al respecteert. Ik bouw dus verder op wat er is in plaats van het opnieuw te maken.

## 1. Neon koppelen en de database bijwerken
- Je Neon-database koppelen met het verbindingsscherm in de chat (jij plakt de verbindingslink daar, nooit in de chat zelf).
- Controleren welke databasewijzigingen al uitgevoerd zijn, de ontbrekende in volgorde uitvoeren (eerst een proefrun) en de controle op afwijkingen draaien.
- Daarna de geheime sleutels opvragen via het beveiligde formulier: eerst de verplichte (inloggen, sessies), de optionele later.

## 2. Workspaces als een volledig eigen omgeving
- Wisselaar bovenaan: Persoonlijk account / Workspace A / Nieuwe workspace. Bij elke wissel wordt de opgeslagen data van de app gewist, zodat er geen data tussen omgevingen meelekt.
- Na een wissel naar een workspace tonen Profiel Hub, QR-generator, Developer Console (API-sleutels, OAuth-apps, webhooks), Bestanden en Statistieken alleen data van die workspace. Ik loop elk van deze pagina's na en voeg de ontbrekende workspace-filter toe, telkens op de server gecontroleerd.
- Database: een `workspace_id` op profielen, links, QR-codes, OAuth-apps, API-sleutels, webhooks en bestanden, met afscherming per rij: leeg = persoonlijk, ingevuld = alleen zichtbaar voor leden. Wat 0131 al dekt, laat ik zoals het is; wat ontbreekt komt in een nieuw bestand (0132), want uitgevoerde wijzigingen pas ik nooit aan.
- Publiek adres `rout.be/w/naam-x89a` (4 willekeurige tekens bij gratis workspaces) toont de Profiel Hub van de workspace en stuurt door naar het eigen domein als dat gekoppeld is.

## 3. Wizard voor een nieuwe workspace (`/studio/workspaces/new`)
Vijf stappen, zoals bij Vercel, GitHub en Notion: (1) naam, logo en omschrijving, (2) adres met live voorbeeld en controle of het nog vrij is, (3) categorie, (4) teamleden uitnodigen met rol (Admin/Developer/Viewer), (5) plan en opslag: gratis en Pro/Max naast elkaar met limieten voor opslag, QR-codes en API, plus de knop "Workspace voltooien & openen". Het oude venster waarin alleen een naam gevraagd werd, verdwijnt.

## 4. Verificatie in twee niveaus
- Niveau 1, "Uniek mens": via World ID, een passkey of Didit. Niveau 2, "Wettelijke identiteit" (blauw vinkje): alleen via een paspoort- of eID-scan met Didit.
- Unieke sleutels zorgen dat één paspoort maar één blauw vinkje geeft, en dat één World ID-account aan maar één ROUT-account gekoppeld kan worden.
- Hoofdprofiel: het vinkje verschijnt alleen bij niveau 2. Alias: nooit de echte naam; een vrijwillige badge "No Bot / Real Human" kan aan bij niveau 1 of 2.
- `/studio/account`: twee aparte blokken: "Geverifieerde wettelijke identiteit" en "Geverifieerd uniek mens".

## 5. Interactieve badges op publieke profielen
- Groen vinkje bij sociale accounts wordt klikbaar en opent een venster met platform, @naam, de controlemethode (bio-link), de datum van de laatste controle, het opgeslagen volgersaantal en de privacybelofte.
- "Lid sinds": de vrije tekst in de bio wordt geweigerd; er komt een systeembadge in de plaats, gebaseerd op de echte aanmaakdatum, met een venster "ROUT Account Genesis" (exacte datum, unieke stempel, status).
- Early Believer-embleem: een eigen tekening (open hand met een kiemplantje, zoals je voorbeeld) in de ROUT-kleuren, naast de naam en als stempel in het Digitaal Paspoort, met een venster dat de datum en het badgenummer toont.
- Alle vensters openen en sluiten vlot op mobiel.

## 6. Controle
- Nieuwe tests: geen data tussen persoonlijk en workspace, regels voor de twee niveaus, regels voor de badges.
- Volledige typecheck en alle tests groen; mobiele controle met schermafbeeldingen, ingelogd zodra de database werkt.

## Technical details
- All DB access stays through `src/lib/neon.ts` / `withDbContext`; RLS keeps the single `rout_scope` policy per table (0120 pattern), with workspace rows going through `rout_is_workspace_member`.
- Scope comes from `activateScopeFromUrl` + the HttpOnly `active_workspace_id` cookie; it is never trusted from the client.
- Tiers are pure rules in `src/lib/identity/` (with tests); nullifiers are peppered HMACs, never raw IDs.
- Genesis stamp = HMAC of user id + created_at with a server secret; the client only gets the hash.
- After migrations, refresh `db/schema.snapshot.json` + `db-types.gen.ts`.
- Blocker: no live checks before Neon is connected and the required secrets are set.
