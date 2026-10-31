# ROUT: Neon koppelen en de open roadmap afwerken

## Stap 1 - Neon koppelen
- Neon-koppelkaart openen; jij kiest je bestaande Neon-verbinding.
- Controleren welke migraties al gedraaid zijn en de ontbrekende toepassen (0125 blijft vast: destructief).
- Testen: één keer lezen en één keer schrijven, en de schema-snapshot vernieuwen.

## Stap 2 - Ronde 6: Feedback & reviews afronden
- Migratie 0134 controleren, de opslag- en moderatieregels nalopen, tests voor wie mag reageren en wie mag verbergen.

## Stap 3 - Ronde 7: Evenementen-engine
- Migratie 0135: evenementen met start/eind, locatie, tickets en zichtbaarheid per profiel/workspace.
- Studio-beheer, publieke agenda op het profiel, .ics-download en Google Agenda-link, eigen evenementpagina met QR-code.
- Tests: alleen de eigenaar beheert, verborgen of voorbije evenementen zijn niet publiek.

## Stap 4 - Ronde 8: Steam-kaart en effecten
- Migratie 0136, server-side ophalen met 5 minuten cache, live-kaart op het profiel (zichtbaar zodra de Steam-sleutel er is).
- Glas- en gloei-effecten uniform via het thema-systeem.

## Stap 5 - Controle
- Volledige testsuite groen, inloggen in de preview met een testaccount en de nieuwe schermen doorklikken.
- Roadmap bijwerken.

## Blijft open (wacht op jou)
- Steam-sleutel, en sleutels voor live inlogtests (Google/Apple).
- 0125 pas na jouw akkoord.

## Technisch
- Neon alleen via src/lib/neon.ts; migraties via scripts/migrate-gateway.ts, nieuwe bestanden 4-cijferig.
- Rechten server-side (createServerFn + sessie, withDbContext), RLS-policy per nieuwe tabel.
