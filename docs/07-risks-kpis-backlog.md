# Risk register, KPIs and ordered backlog

---

## 1. Risk register

Scale: likelihood (L) and impact (I) 1–5; score = L × I. Owner is a role, not a person, until the team is hired.

| ID | Risk | L | I | Score | Mitigation | Early trigger | Owner |
|---|---|---|---|---|---|---|---|
| R-01 | Fabricated or overstated history claim damages trust and creates legal exposure | 3 | 5 | 15 | Rules engine only; five explicit statuses; sources; limitations; human review; banned "no accidents" language | Any public page implying registry/insurer checks | Product |
| R-02 | Forged documents pass review | 3 | 5 | 15 | Human review checklist; hash and duplicate detection; dispute path; audit; no claim of authenticity | A dispute confirms a forged document | Trust & safety |
| R-03 | Cross-tenant data leak | 2 | 5 | 10 | Session-derived tenant, layered guards, 18 security tests, audit; Postgres RLS before launch | Any 403 test regression or suspicious access log | Engineering |
| R-04 | Payment/escrow feature triggers NBC licensing breach | 2 | 5 | 10 | Never hold funds; no wallet; licensed PSP for collections; counsel before change | A feature request to "hold a deposit" | Founder |
| R-05 | Dealers do not pay (free-classifieds expectation) | 4 | 4 | 16 | Paid pilot with written offer; prove lead volume; per-report pricing alternative; keep free tier useful | <2 of 10 dealers accept after 30 days | Growth |
| R-06 | Insufficient quality inventory (few photos, missing documents) | 4 | 3 | 12 | Onboarding checklist, minimum photo rules, document upload incentives, dealer training | >40% of listings with <3 photos or no docs | Supply |
| R-07 | Low buyer demand / disintermediation to Facebook | 4 | 3 | 12 | Khmer SEO, dealer QR codes, saved search alerts (later), report as shareable proof, appointment tooling | <200 weekly sessions by week 8 | Growth |
| R-08 | Report review does not scale at $29 | 3 | 4 | 12 | Time-track reviews; cap included reports; OCR only after gate; raise price if needed | Turnaround >48h or review cost >$1.50 | Ops |
| R-09 | Regulatory change (data protection, e-commerce, payments) | 3 | 3 | 9 | Counsel review; minimised data; retention/deletion; no cross-border transfer without approval | New law/prakas published | Founder |
| R-10 | Fraudulent sellers (deposits, stolen cars, duplicate VIN) | 4 | 4 | 16 | Moderation flags, duplicate detection, deposit language detection, reporting, suspension, audit; no money held | A confirmed deposit scam on-platform | Trust & safety |
| R-11 | Photo copyright claims | 3 | 3 | 9 | Uploader rights warranty; takedown process; duplicate hash detection | Rights-holder complaint | Legal |
| R-12 | Seed/demo data mistaken for real listings | 2 | 3 | 6 | Prominent demo notice in README and footer; deterministic seeded slugs; no production seeding | A real buyer contacts a demo seller | Product |
| R-13 | Single-instance SQLite failure/corruption | 3 | 4 | 12 | Backups, WAL, migration to Postgres before launch | Any failed health check | Engineering |
| R-14 | Khmer UX quality (translation, font, truncation) | 3 | 3 | 9 | Native review, typographic tests, no fixed-height text containers | Usability test failures | Design |
| R-15 | Competitor with capital copies evidence-led positioning | 2 | 3 | 6 | Speed, dealer relationships, published methodology, dispute transparency | Competitor launches similar badge | Founder |
| R-16 | Abuse of reports/AI features to scrape or overload | 3 | 3 | 9 | Auth, rate limits, per-user quotas, no external provider in prototype | Spike in report requests | Engineering |
| R-17 | Legal claim over a "wrong" report | 3 | 4 | 12 | Precise language, limitations, correction path, audit trail, terms reviewed by counsel | First formal complaint | Legal |

### Top 3 to watch weekly
1. **R-01 / R-02** — any drift toward implying verified history.
2. **R-05** — willingness to pay.
3. **R-10** — fraudulent sellers and deposit requests.

---

## 2. KPIs

**Instrumentation status:** the prototype does not ship analytics. Funnel events must be added (`AEV-012`) before targets can be measured. Current dashboard aggregates (views, favourites, leads, reports) are real database counts, not event analytics.

### 2.1 Supply

| KPI | Definition | 90-day target | Source |
|---|---|---|---|
| Verified dealers | Tenants with `verification_status = VERIFIED` and ≥1 published listing | 10 | DB |
| Active listings | Published, unexpired listings | 150 | DB |
| Listing completeness | Listings with ≥3 photos and a registration document | ≥70% | DB |
| Dealer activation | Invited dealers who publish ≥3 listings within 14 days | ≥60% | DB |
| Time to first listing | From tenant creation to first `PENDING` listing | <48h | DB |

### 2.2 Demand

| KPI | Definition | Target | Source |
|---|---|---|---|
| Weekly buyer sessions | Unique sessions on public listing pages | 500 | Analytics (future) |
| Search → listing click-through | Listing views / search results impressions | ≥25% | Analytics |
| Listing → inquiry rate | Inquiries / listing detail views | ≥3% | DB + analytics |
| Save rate | Favourites / listing views | ≥5% | DB |
| Inquiry response time | First seller reply within 24h | ≥70% | Messages |
| Report request rate | Reports / listing views | ≥5% | DB |

### 2.3 Trust

| KPI | Definition | Target | Source |
|---|---|---|---|
| Report coverage | Published listings with a `READY`/`NEEDS_REVIEW` report | ≥50% | DB |
| Reviewed document coverage | Listings with ≥1 `VERIFIED` document | ≥60% | DB |
| Median report turnaround | Request → `completedAt` | <24h | DB |
| Dispute rate | Disputes / delivered reports | <3% | DB |
| Report comprehension | Users correctly explaining `NO_DATA` | ≥60% | Usability test |
| Correction SLA | Disputes resolved within 7 days | ≥90% | DB |

### 2.4 Revenue

| KPI | Definition | Target |
|---|---|---|
| Paying dealers | Active paid subscriptions or invoices | ≥4 |
| MRR | Recurring subscription + featured revenue | ≥$120 |
| Free → paid conversion | Paid / eligible pilot dealers | ≥40% |
| Featured attach rate | Paying dealers buying featured | ≥20% |
| Revenue per report | Report fees − review cost | ≥$0 at pilot |

### 2.5 Safety, operations and performance

| KPI | Definition | Target |
|---|---|---|
| Fraud reports per 1,000 listings | Opened cases | Baseline, then −30% |
| Moderation first response | Time to first human action on a case | <24h |
| Listing approval time | PENDING → decision | <12h |
| p95 search response (local) | Server response | <800 ms |
| LCP on emulated 3G | Listing page | <2.5 s |
| Uptime | Monthly | ≥99.5% (pilot) |
| Security defects | Open P0/P1 | 0 |

---

## 3. Ordered backlog

Priority: **P0** = required before public launch; **P1** = required for a credible paid pilot; **P2** = valuable after validation. Effort: S (<1 day), M (1–3 days), L (1–2 weeks).

Rows are in **recommended dependency order**; task IDs are stable references used across the documentation and code comments. Status reflects this repository, not the wider production programme. The same list, with the supporting rationale, appears in [`00-project-plan.md`](00-project-plan.md) §19.

| # | ID | P | Module · layer | Task | Depends on | Effort | Acceptance criteria | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | AEV-001 | P0 | Security<br>`src/app/(dash)/**/layout.tsx`, `src/lib/rbac.ts` | Tenant and platform page guards plus shared RBAC helpers | — | M | Non-staff cannot open `/admin`; non-members cannot open `/tenant`; every check is a server-side helper | Done |
| 2 | AEV-002 | P0 | Data<br>`scripts/seed.ts`, `src/db/schema.ts` | Deterministic demo seed covering 3 tenants, 16 listings, 12 reports, leads and moderation cases | AEV-001 | M | `npm run db:seed` rebuilds the database from zero; production reseed refuses to run | Done |
| 3 | AEV-003 | P0 | Product<br>`src/app/(site)/**` | Public marketplace pages: home, search, listing, dealers, compare, reports, pricing, safety | AEV-002 | M | All return 200, render in Khmer and English, and pass a link/image crawl | Done |
| 4 | AEV-004 | P0 | Security<br>`tests/security.test.ts` | Automated security regression suite | AEV-001, AEV-002 | M | 18 tests cover isolation, escalation, suspension, private documents and reports, and invitations | Done |
| 5 | AEV-005 | P0 | Data infrastructure<br>`src/db/**`, `infra/db` | Migrate SQLite to PostgreSQL with tenant RLS policies and backups | AEV-002, AEV-004 | L | Schema parity; RLS enabled on every tenant table; security suite green on Postgres; restore rehearsed | Next |
| 6 | AEV-009 | P0 | Legal<br>`src/app/(site)/legal/**`, `docs/04` | Terms, privacy notice, dealer agreement, report disclaimer and versioned acceptance | — | M | Counsel-reviewed copy linked in the footer; acceptance stored with version and timestamp | Next |
| 7 | AEV-029 | P0 | Operations<br>`infra/runbooks`, `docs/06` | Backup, restore drill and incident runbook | AEV-005 | S | Restore verified in staging; RTO under 4 h and RPO under 24 h documented | Next |
| 8 | AEV-007 | P0 | Storage<br>`src/app/api/uploads`, `src/lib/storage.ts` | Presigned object storage for public photos and private documents | AEV-005 | M | Uploads go browser→bucket; documents bucket is private; app server stores no files | Next |
| 9 | AEV-008 | P0 | Observability<br>`src/lib/logger.ts`, `infra/monitoring` | Error tracking, uptime checks and structured logs with PII redaction | AEV-005 | S | Report-engine failures alert within 5 min; logs contain no emails, phones or documents | Next |
| 10 | AEV-010 | P0 | Trust<br>`src/app/admin/tenants`, `src/app/api/admin` | Dealer verification workflow for business registration documents | AEV-007 | M | Admin can request, review and revoke verification; status is public and audited | Next |
| 11 | AEV-006 | P0 | Security<br>`src/lib/rate-limit.ts`, `src/middleware.ts` | Shared rate limiter and CSRF/origin review for cookie-authenticated writes | AEV-005 | M | Limits survive multiple instances; every state-changing route rejects cross-site origins | Next |
| 12 | AEV-016 | P1 | Testing<br>`tests/report-engine.test.ts` | Unit tests for the report engine | AEV-002 | S | Every status and severity branch covered; a test proves "no accidents" cannot be emitted | Next |
| 13 | AEV-011 | P1 | Notifications<br>`src/lib/notifications.ts`, worker` | Transactional email for invitations, lead alerts and report readiness | AEV-008 | M | Invitation delivered by email; opt-out honoured; no secrets beyond the token in links | Next |
| 14 | AEV-013 | P1 | Accessibility<br>`src/components/**` | Keyboard, focus, label, contrast and 200% zoom audit | AEV-003 | M | No critical axe violations on search, listing, report and dashboards | Next |
| 15 | AEV-014 | P1 | Localisation<br>`src/i18n/dictionary.ts` | Native Khmer review and truncation QA | AEV-003 | M | 100% of keys translated; no clipped text at 360 px; Khmer line height verified | Next |
| 16 | AEV-015 | P1 | Testing<br>`tests/e2e/**` | Playwright end-to-end tests for buyer inquiry, dealer publish and admin moderation | AEV-005, AEV-011 | M | Three journeys pass in CI against a seeded database | Next |
| 17 | AEV-021 | P1 | Privacy<br>`worker/retention.ts`, `src/app/api/account` | Retention and deletion job plus user export/delete requests | AEV-005, AEV-009 | M | Documents and reports deleted per policy; audit retained; request tracked end to end | Next |
| 18 | AEV-017 | P1 | Trust<br>`src/lib/reports.ts`, `worker/reports.ts` | Durable report queue and worker with retries and SLA metric | AEV-005, AEV-007, AEV-008 | L | Jobs survive restart; failures retry with backoff; turnaround visible to operations | Next |
| 19 | AEV-012 | P1 | Analytics<br>`src/lib/analytics.ts`, dashboards` | Consent-safe funnel events and reporting | AEV-009 | M | Search, view, favourite, inquiry, report and payment intent measured without PII | Next |
| 20 | AEV-020 | P1 | Moderation<br>`src/app/admin/moderation` | Case assignment, SLA timers and escalation | AEV-012 | M | Each case has an owner and due date; breaches surface on the admin dashboard | Next |
| 21 | AEV-018 | P1 | Product<br>`src/app/api/saved-searches`, worker` | Saved-search alerts by email or in-app digest | AEV-011, AEV-012 | M | A new matching listing triggers one digest; unsubscribe works | Next |
| 22 | AEV-019 | P1 | Billing<br>`src/lib/billing.ts`, `src/app/api/tenant/subscription` | Invoice-based subscription management through a licensed PSP | AEV-009, AEV-012 | L | No card data stored; invoices in USD; VAT treatment confirmed; dunning is manual | Next |
| 23 | AEV-022 | P2 | Product<br>`src/app/api/listings/[id]/feature`, billing` | Featured-listing purchase and automatic expiry | AEV-019 | M | Dealer buys seven days of placement; expiry and receipts are automatic | Next |
| 24 | AEV-023 | P2 | Growth<br>`src/app/(site)/dealers/[slug]` | Dealer QR codes and shareable report links | AEV-003 | S | QR resolves to the storefront; shared report links never expose private documents | Later |
| 25 | AEV-024 | P2 | SEO<br>`src/app/sitemap.ts`, `robots.ts` | Sitemap, structured data, hreflang and canonical URLs | AEV-003, AEV-014 | M | Cars and dealers indexed; Khmer/English alternates; private pages excluded | Later |
| 26 | AEV-025 | P2 | Performance<br>`next.config.ts`, `src/components/listing/car-card.tsx` | Responsive image pipeline, AVIF/WebP and Lighthouse CI | AEV-007 | M | LCP under 2.5 s on emulated 3G; JS budget enforced in CI | Later |
| 27 | AEV-030 | P2 | Research<br>`docs/05` | Pricing experiments for reports, tiers and featured placement | AEV-012, AEV-019 | M | E4/E5 run with pre-registered pass/fail rules; decision memo written | Later |
| 28 | AEV-028 | P2 | Product<br>`src/app/(site)/cars`, `src/lib/listings.ts` | Province expansion: Siem Reap and Battambang | AEV-024 | L | Province filters, local dealers and Khmer support hours live | Later |
| 29 | AEV-026 | P2 | AI<br>`src/lib/ai/ocr.ts`, `src/lib/report-engine.ts` | OCR extraction with mandatory human confirmation | AEV-017; gate G2 | L | Extracted fields show confidence; no finding is verified without a reviewer | Blocked |
| 30 | AEV-027 | P2 | Data<br>`src/lib/providers/**` | Provider adapter interface for lawful history sources | AEV-026; signed contracts | L | Adapter returns `NO_DATA` when unavailable; legal review complete per provider | Blocked |

### Recommended next sprint (two weeks)

1. AEV-005 Postgres/RLS (engineering).
2. AEV-009 legal pages (counsel + copy).
3. AEV-007 storage, AEV-008 observability, AEV-029 backups (engineering).
4. AEV-011 email invitations (needed for real dealer onboarding).
5. AEV-016 report engine tests (fast, high value).

**Definition of done for every item:** typecheck clean, tests added or updated, Khmer/English copy present, permission check reviewed, audit entry where the action is sensitive, and documentation updated.
