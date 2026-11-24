# phirst.homes — rules for every Claude chat working on this repo

The owner runs several chats at once (often one per website section). These rules keep
everyone on the same, newest code and keep Netlify untouched until she asks.

## 1. Always work on the newest code: branch `claude/latest`

`claude/latest` holds the newest version of the whole site. It is the only shared branch.

- Before you start, and again right before every push:
  `git fetch origin claude/latest` then `git rebase origin/claude/latest`
  (or merge it). Never start from an older branch, a pull request branch, or `main`-like
  branches without checking `claude/latest` first.
- Push finished work to `claude/latest` (`git push origin HEAD:claude/latest`). The owner
  gives standing permission for this. If the push is rejected because someone else pushed
  first, fetch, rebase onto `origin/claude/latest`, re-run the build, and push again.
  Never force-push.
- Your session may also have its own `claude/...` branch; pushing there as well is fine,
  but `claude/latest` must always end up with your work.

## 2. Do not trigger Netlify

Netlify credits are limited. Until the owner says otherwise:

- Do not open pull requests, and do not push to `claude/stoic-pascal-n74t5s` (production)
  or to any branch that has an open pull request (those start Netlify builds).
- Put `[skip netlify]` in every commit message as a safeguard.
- The owner will ask when she wants a preview or a release.

## 3. Before you push

- `npm run build` must pass.
- If you touched `lib/compute.ts` or `components/calculator.tsx`, the calculator must still
  match the official Excel templates; do not invent prices, rates, discounts or terms.
- Do not change other sections than the one you were asked about.

## 4. Talking to the owner

Reply in Taglish, plainly. She is a designer, not a developer.

## 5. Map of the site (what exists on `claude/latest`)

Vite + React 19 + TypeScript + Tailwind 4 + framer-motion, hosted on Netlify (live site:
www.phirst.homes, Team M-BIGTIME, an accredited PHirst sales team). Scripts: `npm run dev`,
`npm run build` (type-check + build), `npm run preview`, `npm run admin:dev`.
`@/` is the import alias for the repo root.

**Public homepage** (`src/App.tsx`), top to bottom:
Hero (`components/hero-scroll.tsx`, desktop only; `src/hero-config.ts` switches to the original
`hero.tsx`, or add `?hero=original`) -> House Models (`house-models.tsx`, data in
`lib/house-models.ts`, `lib/house-photos.ts`) -> Locations (`locations.tsx`, `lib/locations.ts`,
`lib/ph-map.ts`) -> Calculator (`calculator.tsx`, `requirements-panel.tsx`) -> Book a Viewing
(`book-viewing.tsx`) -> Careers (`careers.tsx`) -> Footer (`site-footer.tsx`). Menu: `site-nav.tsx`
(desktop), `mobile-header.tsx` (phones; below 1024px there is no hero). Shared look: `components/ui/`.

**Clean addresses** are rewrites to `index.html` (`netlify.toml`) that scroll to a section:
`/house-models /locations /calculator /requirements /careers /book-a-viewing /contact`
(`/how-to-buy` becomes `/calculator`). A new section address needs BOTH `SECTIONS` in
`src/App.tsx` and a redirect in `netlify.toml`.

**Other pages:**
- `/application`: Sellers Accreditation Form (`components/application-page.tsx`, `signature-pad.tsx`,
  PDF in `lib/saf/`, uploads `lib/upload.ts`).
- `/login`: homepage with the staff sign-in box open (not indexed).
- `/admin`: private admin, loaded only on that address (`components/admin/`): dashboard,
  applications, Tripping Requests (bookings). Roles in `netlify/lib/config.mjs`
  (superadmin / admin / agent). Passwords are never in the code (Netlify settings, made with
  `tools/phirst-password-tool.html`). Try it locally with `npm run build` then
  `node tools/admin-dev-server.mjs` (made-up data only).
- Old static pages still in `public/` (about, privacy-policy, thank-you, house-models/*).

**Serverless** (`netlify/functions/`): `inventory`, `bookings`, `applications`,
`application-files`, `admin`, `admin-purge`; helpers in `netlify/lib/`. Data is in Netlify Blobs;
preview deploys and live keep their data apart.

## 6. Calculator: current state (keep all of this)

Newest calculator work is NOT in `claude/latest` yet. As of 24 Nov 2026 it sits on
`claude/calculator-v2` (3 commits ahead of `latest`) and `claude/nice-mayer-0dw46o`, which is
`calculator-v2` plus 1 newer commit (20% in 12/18 months, Spot 20%, and the 30/60/90-day and
reservation-month Spot 5% terms). Start calculator work from the newest of these (check with
`git log origin/claude/latest..origin/<branch>`) and merge into `claude/latest` only when the
owner says it is OK. Those branches only touch `components/calculator.tsx`, `lib/compute.ts`,
`lib/inventory.ts`.

- Files: `lib/compute.ts` (formulas), `components/calculator.tsx` (screen),
  `components/requirements-panel.tsx`, `lib/inventory.ts` (online inventory only, `/api/inventory`).
- Formulas follow the two OFFICIAL templates of 7 Nov 2026 (SELLERS-COPY_OCS-TEMPLATE-PIF and
  -BANK). Never invent prices, rates, terms or discounts. Check against the Excel templates
  whenever `lib/compute.ts` changes.
  - Pag-IBIG: 13 terms, 6.25%. Years 30, 25, 20, 15, 10 (template shows 20/15/10; 30 and 25 kept
    on the owner's instruction).
  - Bank: 13 terms, 7.75%, years 20/15/10/5. In-House: same terms, 16% (10 yrs) / 14% (5 yrs) + MRI 7.5%.
  - Cash: Spot Cash (7% or 6% discount), Deferred 24 and 34 months, Spot 5% + 95% in 23 months.
  - Spot DP discount: 10% of the 5% spot (DP up to 12 months), 8% (13 months and up).
- VAT: ALWAYS 12% of the price before VAT when that price is 3.6M or more; otherwise none.
  Do not use the inventory's VAT column.
- Pag-IBIG is blocked for Unna, Dua, Brenna, Cartland, Charles, Christie, Corin.
- Inputs: Location/Project, House Model, Block & Lot (Memo Terms grouped by TCP first, RSBS last),
  Financing, Payment Term, Years to Pay. No RSBS restriction on terms (RSBS is only a tag).
- Heading: "Sample Computation". Menu tabs: Calculator (`/calculator`) and Requirements (`/requirements`).
- Right panel: Initial / Next Requirements tabs until Compute; Reset / Back to Requirements.
- Result buttons: Book a Viewing, Inquire about this unit (Marielle's Messenger), Save / Print (one A4 page).
- Turnover shown = inventory date + 3 months. A house picture per model in the result header.

## 7. Starting a new chat

The owner types `/claudelatest` (`.claude/commands/claudelatest.md`). It fetches `claude/latest`,
reads this file, and reports back before touching anything. The chat must be started on the
`claude/latest` branch, otherwise this file is not there.
