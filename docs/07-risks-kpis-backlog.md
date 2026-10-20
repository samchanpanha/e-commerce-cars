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
Status reflects this repository, not the production programme.

| ID | Priority | Area | Task | Effort | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| AEV-001 | P0 | Security | Tenant + platform page guards and role checks | M | `/admin` redirects non-staff; `/tenant` redirects non-members; tested | **Done** |
| AEV-002 | P0 | Data | Deterministic seed with 3 tenants, 16 listings, 11 reports | M | `npm run db:seed` rebuilds demo from zero; refuses in production | **Done** |
| AEV-003 | P0 | Product | Public pages: dealers, compare, pricing, safety, reports index, invite | M | All return 200 and render Khmer/English | **Done** |
| AEV-004 | P0 | Security | Automated security regression suite | M | 18 tests cover isolation, escalation, suspension, documents, reports, invitations | **Done** |
| AEV-005 | P0 | Infrastructure | Migrate SQLite → PostgreSQL with RLS | L | Schema parity; RLS policies on tenant tables; security tests run on Postgres; backup/restore rehearsed | Next |
| AEV-006 | P0 | Security | Shared rate limiter + CSRF review for cookie-auth writes | M | Limits survive multi-instance; state-changing endpoints require same-site origin or token | Next |
| AEV-007 | P0 | Infrastructure | Object storage for public photos and private documents | M | Presigned uploads; documents bucket private; no app-server file writes | Next |
| AEV-008 | P0 | Infra | Error tracking, uptime checks, structured logs | S | Report-engine failures alert; no PII in logs | Next |
| AEV-009 | P0 | Legal | Khmer/English terms, privacy notice, dealer agreement, report disclaimer | M | Counsel-reviewed; linked in footer; versioned acceptance | Next |
| AEV-010 | P0 | Trust | Dealer verification workflow for business documents | M | Admin can request/review business registration; status visible; audited | Next |
| AEV-011 | P1 | Notifications | Transactional email (invitations, lead alerts, report ready) | M | Invite link delivered by email; opt-out respected; no secrets in links beyond token | Next |
| AEV-012 | P1 | Analytics | Consent-safe funnel events and dashboards | M | Search, view, favourite, inquiry, report, payment intent measured; no PII | Next |
| AEV-013 | P1 | Accessibility | Keyboard, focus, labels, contrast and 200% zoom audit | M | No critical axe violations on search, listing, report, dashboards | Next |
| AEV-014 | P1 | i18n | Native Khmer copy review and truncation QA | M | 100% keys translated; no clipped text at 360 px | Next |
| AEV-015 | P1 | Testing | Playwright E2E for three critical journeys | M | Buyer inquiry, dealer publish, admin moderation pass in CI | Next |
| AEV-016 | P1 | Testing | Report engine unit tests | S | Every status/severity branch covered; no "no accidents" string possible | Next |
| AEV-017 | P1 | Trust | Report queue + worker with retries and SLA metric | L | Jobs survive restart; failed jobs retried; turnaround dashboard | Later |
| AEV-018 | P1 | Product | Saved-search alerts (email/in-app) | M | New matching listing triggers one digest; unsubscribe works | Later |
| AEV-019 | P1 | Billing | Invoice-based subscription management via licensed PSP | L | No card data stored; invoices in USD; VAT treatment confirmed; dunning manual | Later |
| AEV-020 | P1 | Moderation | Case assignment, SLA timers and escalation | M | Cases have owner, due date, escalation; admin dashboard shows breaches | Later |
| AEV-021 | P1 | Privacy | Retention and deletion job | M | Documents/reports deleted per policy; audit retained; user export/delete route | Later |
| AEV-022 | P2 | Product | Featured listing purchase flow | M | Dealer can buy 7-day feature; expiry automatic; receipts | Later |
| AEV-023 | P2 | Growth | Dealer QR codes and shareable report links | S | QR per storefront; report links require auth for private data | Later |
| AEV-024 | P2 | SEO | Sitemap, structured data, hreflang, canonical URLs | M | Cars and dealers indexed; Khmer/English alternates; no private pages indexed | Later |
| AEV-025 | P2 | Performance | Image pipeline (AVIF/WebP, responsive sizes) and Lighthouse CI | M | LCP <2.5 s on 3G; JS budget enforced | Later |
| AEV-026 | P2 | AI | OCR extraction with human confirmation | L | Extracted fields shown with confidence; no finding verified without human confirm | Blocked by gates |
| AEV-027 | P2 | Data | Provider adapter interface for lawful history sources | L | Returns `NO_DATA` when unavailable; contract/legal review complete | Blocked |
| AEV-028 | P2 | Product | Province expansion (Siem Reap, Battambang) | L | Province filters, local dealers, Khmer support hours | Later |
| AEV-029 | P2 | Ops | Backup/restore drill and incident runbook | S | Restore verified in staging; RTO/RPO documented | Next |
| AEV-030 | P2 | Research | Pricing experiments (report fee, dealer tiers) | M | E4/E5 run with pre-registered pass/fail; decision memo | Later |

### Recommended next sprint (two weeks)

1. AEV-005 Postgres/RLS (engineering).
2. AEV-009 legal pages (counsel + copy).
3. AEV-007 storage, AEV-008 observability, AEV-029 backups (engineering).
4. AEV-011 email invitations (needed for real dealer onboarding).
5. AEV-016 report engine tests (fast, high value).

**Definition of done for every item:** typecheck clean, tests added or updated, Khmer/English copy present, permission check reviewed, audit entry where the action is sensitive, and documentation updated.
