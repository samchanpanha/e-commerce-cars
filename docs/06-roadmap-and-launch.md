# Phased roadmap, testing strategy and 90-day launch plan

---

## 1. Build order (non-negotiable)

The sequence follows the product thesis: **a working marketplace first, evidence-based verification second, revenue validation third, expensive AI infrastructure last.** Each phase must meet its exit criteria before the next phase is funded.

| Phase | Name | Question answered | Status in this repository |
|---|---|---|---|
| **0** | Foundations | Can we run a multi-tenant, bilingual, secure marketplace cheaply? | **Built** (prototype) |
| **1** | Marketplace MVP | Will dealers list and will buyers search, save, compare and contact? | **Built** (prototype) |
| **2** | Trust and evidence | Can we produce honest, useful reports without inventing history? | **Built** (prototype, rules-based) |
| **3** | Revenue validation | Will anyone pay, and for what? | **Instrumented, not billed** |
| **4** | Scale AI / integrations | Only after paid demand and a lawful data source | **Not started** |

---

## 2. Phase 0 — Foundations

### Delivered
- Next.js App Router + TypeScript strict, Tailwind 4 design system, Khmer and English typography.
- Drizzle schema with 22 tables, applied via `scripts/init-db.ts`.
- Session auth (scrypt), RBAC matrix, tenant membership resolution, audit log.
- Typed i18n dictionary (~1,200 lines of en/km strings), locale switcher.
- Seed dataset: 3 tenants (one suspended), 9 users, 16 vehicles/listings, 11 reports, conversations, leads, moderation cases, audit entries.
- Security regression suite (18 tests) and `tsc --noEmit` clean.

### Acceptance criteria
- [x] `npm run setup` creates a working demo database from scratch.
- [x] Every protected page redirects unauthenticated users.
- [x] `/admin` and `/tenant` are inaccessible to customers and other tenants.
- [x] Login works for all demo roles; demo password documented.
- [x] Khmer text renders with a bundled Khmer font (no CDN).
- [x] No secrets in client bundles; `.env` ignored by git.

### Production gaps (must close before public launch)
- PostgreSQL + RLS, managed backups, object storage, email delivery, error tracking, shared rate limiter.

---

## 3. Phase 1 — Marketplace MVP

### Delivered
- Listing wizard (4 steps), draft/publish/reject/archive/sold states, photo uploads with hashing.
- Public search with make/model/price/year/mileage/province/fuel/transmission/body/seller type/verified-only filters, sorting and facets.
- Listing detail with gallery, specs, seller card, safety guidance, report request, inquiry/viewing form, compare and favourite.
- Dealer storefronts and directory; suspended dealers return 404 and their cars disappear from search.
- Seller dashboard (my listings, create/edit), customer dashboard (favourites, saved searches, reports, appointments), messages inbox and thread.
- Compare up to 3 cars, including report status and evidence counts.
- Multi-tenant dealer dashboard: inventory, leads, team, analytics, settings, staff invitations.

### Acceptance criteria
- [x] A dealer owner can create a listing and publish it to search.
- [x] A buyer can filter, open, favourite and compare cars without an account.
- [x] A buyer can message a seller and request a viewing; the dealer sees the lead.
- [x] Private seller listings appear alongside dealer listings with a different badge.
- [x] Mobile layout works at 360 px; no horizontal scrolling in search/listing flows.
- [x] Suspended tenant listings are excluded from search (tested).
- [x] Saved searches persist and can be deleted.

### Known limitations
- No email/SMS notifications (in-app only).
- No image CDN/presigned uploads; the app server carries image bytes.
- No sitemap/structured data yet.
- Listing wizard does not autosave drafts.

---

## 4. Phase 2 — Trust and evidence

### Delivered
- Private document upload (registration, import, ownership transfer, service, inspection), SHA-256 hash, private storage, authorised streaming route.
- Human review workflow: pending → verified/rejected with notes; admin moderation queue.
- Rules-based report engine: identity formats, document status, duplicate VIN/plate, reused photos, mileage claims, price context, inspection availability.
- Five explicit evidence statuses, per-finding source references and confidence; overall confidence and attention level.
- `NEEDS_REVIEW` routing when a critical inconsistency exists or confidence is low; admin rerun/approve/send-back.
- Report access control (requester, seller, tenant staff, platform staff); dispute path that creates a moderation case.
- Bilingual report view; limitations block; "not an inspection / not a valuation" disclaimers throughout.
- Public explanation pages (`/reports`, `/reports/sample`, `/safety`) with the same status vocabulary.

### Acceptance criteria
- [x] A report never states "no accidents"; missing data appears as `NO_DATA`.
- [x] Each finding names a source and a status; the UI explains what each status means.
- [x] A critical inconsistency forces human review.
- [x] A stranger cannot open a document or a report.
- [x] Disputes create an auditable moderation case.
- [x] A report with no verified documents cannot show high confidence.
- [x] Documents are absent from the public API and public pages.

### Exit criteria to Phase 3
- 30 reports reviewed by a human; <10% of findings judged misleading by the reviewer.
- Report page comprehension test: ≥60% of buyers explain "no data" correctly.
- Median time from request to completed report <24h during business hours.

---

## 5. Phase 3 — Revenue validation

### Delivered
- Plans (`starter`, `growth`, `pro`), tenant subscriptions, listing/featured quotas (data model).
- Public pricing page clearly labelled as a pilot hypothesis.
- Featured listing state and dealer/admin controls.
- Subscription and usage data available to the dealer dashboard.

### Not delivered (deliberately)
- No card processing, no invoices, no dunning, no tax handling.
- No escrow, wallet, split payment or financing.

### Acceptance criteria for the phase
- [ ] 10 dealers onboarded with real inventory.
- [ ] At least 4 dealers accept a written $29/month offer or sign an invoice.
- [ ] Billing is outsourced to a licensed provider; the platform never holds buyer funds.
- [ ] VAT/invoice treatment confirmed by an accountant.
- [ ] Churn reason captured for every dealer who declines.

### Gate to Phase 4
Do **not** start OCR/provider integration until G1–G4 in `05-monetization.md` are met (≥10 paying dealers, ≥300 reports/month, ≥$3k MRR, dispute rate <3%).

---

## 6. Phase 4 — Scale AI and external data (not started)

Candidate work, each requiring a separate decision:
1. OCR extraction of registration/import fields, with human confirmation before a finding becomes `VERIFIED_BY_SOURCE`.
2. A queue/worker for report jobs; idempotent retries; SLA tracking.
3. Provider adapters for any lawfully accessible registry/insurer/auction data. Adapter interface returns `NO_DATA` when the source is unavailable — never inferred history.
4. Photo forensics (EXIF consistency, duplicate crops) as `EVIDENCE_FOUND`, never as proof.
5. Dealer verification upgrades (business registration checks) with a documented review rubric.

**Hard rule:** an integration that cannot be lawfully accessed is not replaced by an LLM guess. It stays `NO_DATA`.

---

## 7. Testing strategy

| Layer | Scope | Tooling | Current state |
|---|---|---|---|
| Type safety | Whole repo | `tsc --noEmit` (strict) | Clean |
| Unit | RBAC matrix, report engine, money/i18n formatting | Vitest | RBAC covered; report engine unit tests are backlog `AEV-016` |
| Integration | Route handlers against the seeded DB; cross-tenant, documents, reports, invitations | Vitest + mocked `requireUser` | 18 tests passing |
| Contract | Response envelope, status codes, validation errors | Supertest-style route tests (future) | Partial via integration tests |
| E2E | Buyer search → inquiry; dealer listing → lead; admin moderation | Playwright (backlog `AEV-015`) | Not yet |
| Security | Tenant isolation, role escalation, suspended tenants, private files, upload validation | Vitest + manual review | Covered for core paths |
| Accessibility | Keyboard, labels, contrast, focus, 200% zoom | axe + manual | Not yet (`AEV-013`) |
| i18n | Khmer line length, font fallback, no truncation | Manual + visual snapshots | Manual |
| Performance | LCP <2.5s on emulated 3G, JS budget, image weight | Lighthouse CI | Manual; images local |
| Data | Seed idempotency, report reproducibility | Script run | Verified |

### Test commands

```bash
npm run typecheck
npm test          # requires npm run db:seed
npm run build     # production build check
```

### Security test coverage (implemented)

`tests/security.test.ts` asserts:
1. Cross-tenant reads and edits are denied, including a spoofed `tenantId` in the body.
2. A sales agent cannot manage members, settings, listings or subscriptions.
3. Platform support cannot change roles or administer tenants; super admin can.
4. Suspended tenant memberships grant no permissions and resolve to no tenant.
5. Report access is limited to requester/seller/tenant staff/platform staff; disputes by strangers return 403.
6. Documents from another tenant return 403; the owning dealer gets a `no-store` PDF stream.
7. Published listings of a suspended tenant disappear from search; an active tenant control still appears.
8. Cross-tenant listing GET returns 403.
9. Invitations cannot be accepted with the wrong email, and no membership is created.

### What is not yet tested (honest list)
- Full browser flows, file upload edge cases (magic bytes, oversized files), session fixation, CSRF on cookie-auth POSTs (same-site lax helps but is not a full answer), rate-limit behaviour under concurrency, Postgres-specific SQL, backup/restore.

---

## 8. 90-day launch plan (Phnom Penh)

Assumes a team of 2–3 (product/engineering + ops/sales), part-time moderation.

### Weeks 1–2 — Harden and recruit
- Postgres migration + RLS (or documented compensating controls), backups, error tracking.
- Close the top 5 security/test gaps; add legal pages; Khmer copy review.
- Recruit 15 dealer interviews from Toul Kork, Chamkar Mon, Sen Sok; prepare demo on a laptop with mobile hotspot.
- **Exit:** 12 interviews booked, staging deployment stable, no P0 security issue.

### Weeks 3–4 — Pilot onboarding (5 dealers)
- Onboard 5 dealers: verify business documents, create tenants, import 10–20 listings each with photos.
- Train staff on inventory, leads and document upload; agree a moderation SLA.
- Run buyer usability sessions (5 users) on search, listing and report pages in Khmer.
- **Exit:** ≥50 published listings, ≥30 with a reviewed document, ≥3 staff accounts per dealer.

### Weeks 5–6 — Demand and evidence
- Launch to a small buyer audience via Facebook/Telegram dealer networks and QR flyers at dealerships.
- Generate 30+ reports; time-track reviews; publish the sample report and safety guide.
- Fix the top 10 usability defects; instrument search → listing → inquiry funnel.
- **Exit:** ≥100 buyer sessions/week, ≥20 inquiries, median report turnaround <24h.

### Weeks 7–8 — Paid offer
- Present written $29 Growth and $79 Pro offers to 10 dealers (including the 5 pilot dealers).
- Enable featured listings as a paid add-on test.
- Run E3/E4 experiments (report comprehension, price point).
- **Exit:** ≥4 paid/invoiced dealers, ≥2 featured purchases, decision memo on pricing.

### Weeks 9–10 — Reliability and moderation
- Load test search at 50 concurrent users; optimise slow queries and images.
- Implement retention/deletion job draft; audit log review; incident runbook.
- Start weekly moderation review; measure dispute rate and time-to-resolution.
- **Exit:** p95 search <800 ms locally, no unresolved P0/P1 security issue, dispute rate <5%.

### Weeks 11–12 — Decide and prepare province expansion
- Review KPIs against go/no-go thresholds.
- If pass: plan Siem Reap/Battambang onboarding, hire a part-time reviewer, scope OCR.
- If fail: narrow to dealer tooling or report-only, with a written rationale.
- **Exit:** board-style decision note, 90-day financials, next-quarter backlog.

### Go/no-go thresholds at day 90

| Metric | Go | Investigate | Stop/pivot |
|---|---|---|---|
| Paying dealers | ≥4 | 2–3 | ≤1 |
| Published listings | ≥150 | 80–149 | <80 |
| Weekly buyer sessions | ≥500 | 200–499 | <200 |
| Reports delivered | ≥100 | 40–99 | <40 |
| Report dispute rate | <3% | 3–7% | >7% |
| Report comprehension | ≥60% | 40–59% | <40% |
| Median report turnaround | <24h | 24–48h | >48h |

---

## 9. Launch checklist

- [ ] Legal: terms, privacy, dealer agreement, report disclaimer reviewed in Khmer.
- [ ] Security: Postgres/RLS or equivalent, backups tested, rate limits shared, CSRF review.
- [ ] Operations: moderation rota, escalation contact, refund/dispute policy.
- [ ] Content: 10 verified dealers, 100+ listings, 20+ photos per dealer, no placeholder text.
- [ ] Payments: none enabled, or fully outsourced to a licensed provider with invoices.
- [ ] Analytics: funnel events defined and consent-safe.
- [ ] Support: Khmer/English email + Telegram channel, response target <1 business day.
- [ ] Monitoring: uptime, error tracking, report failure alerts.
