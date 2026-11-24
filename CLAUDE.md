# PHIRST.HOMES: project notes for Claude

Read this at the start of every session. Update it when something important changes.
Reply to the owner in Taglish (casual Tagalog-English); they write that way too.

## 1. About the business (not code)

- Site: https://phirst.homes. Sales site of **Team M-BIGTIME**, an accredited PHirst sales team.
- Sells PHirst house models (Unna, Calista, Amani, Alora) in Cavite and Batangas.
- Audience: first-time home buyers in the Philippines. Tone: <FILL IN, e.g. warm, simple, trustworthy>
- Main goals of the site: <FILL IN, e.g. calculator leads, viewing bookings, recruiting agents>
- Brand: dark theme (#05070d), Montserrat + Playfair Display, PHIRST.HOMES wordmark.
- Things never to say or do (legal/compliance, pricing claims): <FILL IN>

## 2. Current status / what's next

- Done: hero (scroll-expansion, with a switch back to the original), Locations, Calculator,
  Careers, Book a Viewing, footer, fixed nav.
- Not built yet: private admin page for reading bookings.
- Next up: <FILL IN>
- Open decisions: <FILL IN>

## 3. Tech

- Vite + React 19 + TypeScript + Tailwind 4 + framer-motion. Hosted on Netlify.
- Scripts: `npm run dev`, `npm run build` (type-checks, then builds), `npm run preview`.
- `@/` import alias is used (see tsconfig.json / vite.config.ts).
- Layout:
  - `src/` app entry (`App.tsx`), `hero-config.ts` (hero switch: `HERO_VARIANT`, or `?hero=original|scroll`)
  - `components/` page sections (hero, locations, calculator, careers, book-viewing, footer, nav)
  - `lib/` logic and data (`compute.ts`, `inventory.ts`, `locations.ts`, `ph-map.ts`)
  - `netlify/functions/` serverless: `inventory.mjs`, `bookings.mjs` (stored in Netlify Blobs)
  - `public/` static assets and legacy static pages
- The site is a single page. `/calculator`, `/locations`, `/careers`, `/book-a-viewing` and
  `/contact` are rewrites to `index.html` (see `netlify.toml`) that scroll to a section.
  Adding a section route means editing both `SECTIONS` in `src/App.tsx` and `netlify.toml`.
- Bookings from Deploy Previews are kept separate from the live site's bookings.

## 4. How we work

- Develop on the branch the session assigns; don't push elsewhere or open PRs unless asked.
- Make small commits with clear messages.
- Run `npm run build` before saying something is done.
