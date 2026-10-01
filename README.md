# Vedøy portefølje

Statisk Vedøy-side med Vedøy CSS, Motion og et administratorpanel koblet til Supabase.

## Kjør lokalt

Server `dist/` med en lokal HTTP-server. Eksempel: `npx serve dist`.

## Publisering

Vercel-prosjekt: `vedoy-portfolio`. Publiser `dist/` som statisk rot. Den offentlige siden er `https://vedoy-portfolio.vercel.app/`, og adminpanelet ligger på `/admin.html`.

## Data og tilgang

Den offentlige porteføljen leser bare publiserte rader i `public.projects`. Admin kan opprette, redigere, publisere og arkivere via Supabase RLS. Økonomiposter i `public.vedoy_economy_entries` er interne, manuelle NOK-poster. De er ikke regnskap eller tall synkronisert fra Stripe, Shopify eller annonsekontoer.

Innlogging bruker Supabase Auth. GitHub-knappen krever at OAuth-returadresse for produksjonsdomenet er riktig konfigurert i Supabase. E-postlenke er reserveflyt for eksisterende brukere. Autorisasjon skjer i databasen via `public.vedoy_profiles.role`; synligheten til panelet i nettleseren er ikke sikkerhetsgrensen.

## Integrasjoner

Supabase API og offentlig GitHub API brukes direkte av siden. Shopify-rapporten for september 2026 ble hentet gjennom den tilkoblede Shopify-appen og lagret som en datert rapport i en tabell som bare administratorer kan lese. Denne importen oppdateres ikke automatisk og summeres ikke inn i manuelle poster.

Stripe-tilkoblingen krevde ny autentisering ved kontroll 2026-10-01. Ads Manager returnerte ingen tilgjengelige kontoer. Løpende tredjeparts økonomidata krever egne serverstyrte tilkoblinger for hver leverandør. Tilgang til ChatGPT-apper kan ikke brukes som produksjonsnøkler på nettsiden.

Databaseskjemaet for endringene ligger i `database/20261001_admin_and_economy.sql`. Det bygger på eksisterende `projects` og `vedoy_profiles` og endrer ingen brukeres administratorrolle ved kjøring. Rolletildeling gjøres separat av en betrodd administrator.
