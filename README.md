# AngkorEV — trust-first car marketplace for Cambodia

A multi-tenant, bilingual (Khmer/English) car marketplace built around one idea: **show buyers what is verified, what is merely claimed, and what nobody knows.**

Every vehicle report is an evidence ledger, not a score. The platform never invents accident or service history, never calls an AI guess "verified", and never says "no records found" means "no accidents".

> **Demo data:** every tenant, listing, document and report in the seeded database is fictional. Do not use the demo seed in production.

---

## What works

### Marketplace
- Public search with make/model/price/year/mileage/province/fuel/transmission/body/seller-type filters, sorting, facets and pagination.
- Listing pages with gallery, specs, seller card, safety guidance, inquiry/viewing request, favourites, compare (up to 3) and report request.
- Dealer directory and storefronts; suspended dealers are hidden from search and return 404.
- Private-seller listings alongside dealer inventory.
- Customer dashboard: favourites, saved searches, reports, appointments, messages.
- Dealer dashboard: inventory, leads, team, analytics, settings, staff invitations, listing wizard.
- Super-admin dashboard: overview, tenants, listing review queue, moderation cases, documents, reports, users, audit log.

### Evidence-based verification
- Private document upload (JPG/PNG/WebP/PDF, SHA-256, outside `public/`) with human review: pending → verified/rejected.
- Rules engine checks:
  - VIN/chassis format and presence
  - human-reviewed documents by type
  - duplicate VIN / plate across active listings
  - reused photos across the platform (hash match)
  - mileage and price plausibility against comparable listings
  - inspection availability
- Five explicit statuses: `VERIFIED_BY_SOURCE`, `EVIDENCE_FOUND`, `POTENTIAL_INCONSISTENCY`, `NOT_VERIFIED`, `NO_DATA`.
- Confidence + attention level + source reference per finding; any critical inconsistency forces `NEEDS_REVIEW`.
- Report access limited to requester, seller, tenant staff and platform staff; dispute path creates a moderation case.
- No external registry, insurer, auction or AI-history provider is connected. That is deliberate and visible in the UI.

### Revenue plumbing (not billing)
- Dealer plans, quotas and subscriptions in the data model; featured-listing state.
- Public pricing page labelled as a **pilot pricing hypothesis**.
- **No card payments, no wallet, no escrow, no holding customer funds.**

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React 19, server components) |
| Language | TypeScript strict |
| Styling | Tailwind CSS 4, custom ink/brand/gold design tokens |
| Database | SQLite via libSQL + Drizzle ORM |
| Auth | Session cookies, SHA-256 token hashes, scrypt passwords |
| Validation | Zod |
| Tests | Vitest (18 security regression tests) |
| Fonts | Bundled Inter + Noto Sans Khmer (`@fontsource`) |

See [`docs/02-architecture.md`](docs/02-architecture.md) for the Mermaid diagrams and ERD.

---

## Quick start

Requirements: Node 20+ and npm.

```bash
npm install
cp .env.example .env        # then change AUTH_SECRET for anything non-local
npm run setup               # create the schema and seed the demo database
npm run dev                 # http://localhost:3000 (binds 0.0.0.0)
```

Useful commands:

| Command | Purpose |
|---|---|
| `npm run dev` | Development server on `0.0.0.0:3000` |
| `npm run build` / `npm start` | Production build / start |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Security regression suite (run `npm run db:seed` first) |
| `npm run db:push` | Apply `src/db/schema.sql` |
| `npm run db:seed` | Reset and reseed demo data (refuses in production) |

### Demo accounts

Password for all accounts: **`Demo1234!`**

| Email | Role | What to try |
|---|---|---|
| `admin@angkorev.kh` | Super admin | Tenants, moderation, reports, users, audit |
| `support@angkorev.kh` | Platform support | Moderation without user-management rights |
| `dealer@angkorev.kh` | Dealer owner (Angkor Auto Group) | Inventory, leads, team, analytics, settings |
| `sales@angkorev.kh` | Sales agent | Limited dashboard: leads and read-only inventory |
| `owner2@angkorev.kh` | Dealer owner (Phnom Penh Auto Hub) | Second tenant; useful for isolation demos |
| `mekong@angkorev.kh` | Owner of a suspended tenant | Suspension behaviour |
| `seller@angkorev.kh` | Private seller | Private listings, no tenant |
| `buyer@angkorev.kh` | Customer | Favourites, compare, reports, messages, appointments |
| `newhire@angkorev.kh` | Invited staff | Accept the seeded invitation |

The seed prints a fresh invitation URL (`/invite/<token>`) on every run.

---

## Key routes

| Route | Description |
|---|---|
| `/` | Homepage with trust explanation and featured cars |
| `/cars`, `/cars/[slug]` | Search and listing detail |
| `/dealers`, `/dealers/[slug]` | Dealer directory and storefront |
| `/compare` | Side-by-side comparison with evidence counts |
| `/reports`, `/reports/sample`, `/reports/[publicId]` | Report explanation, sample and private report |
| `/safety`, `/pricing` | Safety guidance, pilot plans |
| `/login`, `/register`, `/invite/[token]` | Auth and staff invitation |
| `/dashboard`, `/customer/*`, `/seller/*`, `/tenant/*`, `/admin/*` | Role dashboards |
| `/messages`, `/messages/[id]` | Buyer–seller conversations |

---

## Security model

- Tenant identity is derived from the **authenticated membership**, never from a request body.
- Layered checks: middleware auth gate → dashboard layout guards → shared RBAC helpers → tenant-scoped queries → audit log.
- Tenant suspension removes permissions, hides listings and blocks invitation acceptance without deleting data.
- Documents are never public: downloads go through `GET /api/documents/[id]` with owner/tenant/platform checks and `no-store`.
- Sensitive actions (`user.suspend`, `user.role_change`, `tenant.suspend`, `document.verify`, `report.review`, …) are written to an append-only audit table.
- `tests/security.test.ts` proves cross-tenant denial, role-escalation denial, suspended-tenant denial, private document/report access, and invitation email binding.

**Known limitation:** SQLite has no row-level security. This prototype enforces isolation in the service layer and tests it. Production requires PostgreSQL + RLS as defence in depth (`docs/07-risks-kpis-backlog.md`, AEV-005).

---

## Documentation

| Document | Contents |
|---|---|
| [`docs/00-project-plan.md`](docs/00-project-plan.md) | The consolidated 20-section plan, 30-task backlog and first-week plan |
| [`docs/01-market-research.md`](docs/01-market-research.md) | Sourced Cambodian market data, assumptions, competitors, open questions |
| [`docs/02-architecture.md`](docs/02-architecture.md) | Context/container diagrams, auth and report sequences, ERD, threat model |
| [`docs/03-api-spec.md`](docs/03-api-spec.md) | REST API, envelopes, permissions, examples, error codes |
| [`docs/04-regulatory-checklist.md`](docs/04-regulatory-checklist.md) | Cambodian legal/regulatory checklist and questions for local counsel |
| [`docs/05-monetization.md`](docs/05-monetization.md) | Labelled revenue hypotheses, unit economics, validation experiments, gates |
| [`docs/06-roadmap-and-launch.md`](docs/06-roadmap-and-launch.md) | Phased roadmap with acceptance criteria, testing strategy, 90-day plan |
| [`docs/07-risks-kpis-backlog.md`](docs/07-risks-kpis-backlog.md) | Risk register, KPI definitions, ordered backlog with IDs/effort/acceptance criteria |

---

## Repository map

```
src/
  app/
    (site)/        public pages: home, cars, dealers, compare, reports, pricing, safety, invite
    (auth)/        login, register
    (dash)/        customer, seller, tenant, admin, messages dashboards
    api/           REST route handlers
  components/      UI, layout, auth, dashboard, listing widgets
  db/              Drizzle schema, DDL, libSQL client
  i18n/            typed en/km dictionary, finding copy, locale helpers
  lib/             auth, RBAC, listings, reports, report engine, dashboard, audit, money
scripts/           init-db.ts, seed.ts
tests/             security.test.ts
docs/              product and engineering documentation
data/              SQLite database (ignored) + private documents (ignored)
public/images/     generated demo photography
```

---

## Deviations and production notes

| Prototype decision | Why | Production requirement |
|---|---|---|
| SQLite + service-layer isolation | Zero-ops demo; no RLS in SQLite | PostgreSQL + RLS, backups, connection pooling |
| App-server file uploads | No object storage credentials in the sandbox | S3/R2 with presigned uploads; private bucket for documents |
| Rules engine only (`provider: rules-v1`) | Prevents fabricated history; no external access confirmed | Keep rules as baseline; add providers only with lawful access |
| No billing integration | Avoids holding funds and NBC licensing questions | Licensed PSP, invoiced subscriptions, VAT review |
| In-memory rate limiter | Single-process prototype | Shared limiter (Redis/Postgres) |
| Generated demo photography | Stock licensing not cleared | Licensed dealer photos or owned photography |

**Not implemented on purpose:** escrow, wallets, split payments, lending, insurance, government registry lookups, insurer history, auction data, LLM recall of vehicle history.

---

## License / data

No license is granted for the demo photography or seed data. Market figures in `docs/` are attributed to their sources; assumptions are labelled as assumptions.
