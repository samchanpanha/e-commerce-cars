# Architecture

**Shape:** modular monolith (Next.js App Router) + SQLite/libSQL for the prototype.
**Constraint:** no Kubernetes, no microservices, no paid infrastructure at MVP. The same code should run on a single small VM.

---

## 1. Principles

1. **Tenant identity comes from the session, never from the request body.** The body may name a tenant, but it is only honoured if the authenticated user has an active membership (or is a super admin acting deliberately).
2. **Defence in depth.** Layout guards, route guards, shared RBAC helpers, tenant-scoped queries and audit logging. Postgres RLS is the production target; SQLite has no RLS, so the prototype enforces isolation in the service layer and proves it with tests.
3. **Documents are private by default.** Uploads go outside `public/`, are downloaded only through an authorised route, and are never embedded in a public page.
4. **Reports are computed, not recalled.** The rules engine only emits findings from data the platform holds: submitted documents, identifier formats, photo hashes, duplicate listings, mileage claims, and comparable prices. No LLM is asked to invent history.
5. **Everything sensitive is auditable.** Role changes, suspensions, document decisions, report reviews and tenant settings write to `audit_logs`.
6. **Revenue features must not require holding customer money.** No escrow, no wallet, no split payments in the MVP.

---

## 2. System context

```mermaid
flowchart LR
  B["Buyer (mobile, Khmer/English)"] --> W["AngkorEV web app<br/>Next.js RSC + route handlers"]
  S["Private seller"] --> W
  D["Dealership staff<br/>owner / admin / inventory / sales"] --> W
  A["Platform admin & support"] --> W

  W --> DB[("SQLite / libSQL<br/>data/angkorev.db")]
  W --> FS["Private document store<br/>data/private-documents"]
  W --> PUB["Public assets<br/>photos in /public/images"]

  W -. future, not implemented .-> OCR["OCR / document extraction provider"]
  W -. future, not implemented .-> HIST["Registry or insurer history source"]
  W -. future, not implemented .-> PAY["Licensed payment provider<br/>(platform never holds funds)"]
```

**What is deliberately absent:** government registry APIs, insurer APIs, auction-history feeds, e-signature, escrow, lending and insurance. These are research/negotiation items (see `04-regulatory-checklist.md`).

---

## 3. Containers and modules

```mermaid
flowchart TB
  subgraph Next["Next.js 15 application (single deployment)"]
    UI["Public site<br/>(site) routes: home, cars, listing, dealers, compare, reports, pricing, safety"]
    AUTHUI["Auth & dashboard UI<br/>(auth), (dash) routes"]
    API["REST route handlers<br/>/api/*"]
    MW["middleware<br/>security headers + auth gate"]
    LIB["Domain libraries<br/>auth · rbac · listings · reports · report-engine · dashboard · audit · validation · money"]
    I18N["i18n<br/>typed en/km dictionary + finding copy"]
  end

  UI --> LIB
  AUTHUI --> LIB
  API --> LIB
  MW --> AUTHUI
  MW --> API
  LIB --> DB[("libSQL")]
  LIB --> FS["Private files"]
  I18N --> UI
  I18N --> AUTHUI
```

### Module responsibilities

| Module | Owns | Key files |
|---|---|---|
| Auth | Sessions, password hashing, cookie, auth context | `src/lib/auth.ts`, `src/lib/password.ts` |
| RBAC | Role matrix, tenant resolution, listing access | `src/lib/rbac.ts` |
| Listings | Search, facets, detail, moderation flags, duplicate detection, price context | `src/lib/listings.ts` |
| Reports | Request lifecycle, input gathering, persistence, access rules | `src/lib/reports.ts` |
| Report engine | Pure rule evaluation, confidence, risk, summary | `src/lib/report-engine.ts` |
| Dashboard queries | Aggregates for seller/customer/tenant/admin | `src/lib/dashboard.ts` |
| Audit | Append-only sensitive action log | `src/lib/audit.ts` |
| i18n | Typed Khmer/English strings | `src/i18n/*` |

---

## 4. Request and authorisation flow

```mermaid
sequenceDiagram
  autonumber
  participant U as Browser
  participant M as Middleware
  participant P as Page / Route handler
  participant A as getAuthContext()
  participant R as RBAC
  participant D as DB

  U->>M: GET /tenant/inventory (session cookie)
  M->>M: security headers
  alt no cookie on protected path
    M-->>U: 307 /login?next=...
  else session cookie
    M->>P: continue
    P->>A: read session cookie, hash token
    A->>D: sessions ⋈ users ⋈ memberships ⋈ tenants
    D-->>A: user + memberships (tenant status included)
    A-->>P: AuthContext
    P->>R: canInTenant(ctx, tenantId, "listing:read")
    R-->>P: allow / deny
    P->>D: tenant-scoped query
    P-->>U: HTML or JSON envelope
  end
```

Session handling:
- 32-byte random token, stored only as SHA-256 hash in `sessions.token_hash`.
- 14-day expiry, `httpOnly`, `sameSite=lax`, `secure` in production.
- Suspension and logout revoke sessions. Role changes by a super admin revoke sessions too.
- The active tenant cookie is a **convenience selector**, not an authorisation claim; it is re-checked against memberships.

---

## 5. Report generation pipeline

```mermaid
sequenceDiagram
  autonumber
  participant Buyer
  participant API as POST /api/reports
  participant Rep as reports.ts
  participant Engine as report-engine.ts
  participant DB
  participant Admin

  Buyer->>API: {listingId, consent:true}
  API->>API: requireUser + rate limit
  API->>Rep: createReportRequest()
  Rep->>DB: insert report (QUEUED)
  Rep->>Rep: processReport()
  Rep->>DB: load vehicle, listing, documents, images
  Rep->>DB: duplicate VIN/plate + reused photo hashes + market median
  Rep->>Engine: analyzeVehicle(input)
  Engine-->>Rep: findings[], confidence, risk, status
  Rep->>DB: replace findings + summary + limitations
  alt any CRITICAL inconsistency or confidence < 35
    Rep->>DB: status = NEEDS_REVIEW
    Admin->>DB: human review / rerun / approve
  else
    Rep->>DB: status = READY
  end
  Buyer->>API: GET report page
  API->>Rep: canViewReport() (requester, seller, tenant staff, platform staff)
```

### Evidence statuses

| Status | Meaning | Never means |
|---|---|---|
| `VERIFIED_BY_SOURCE` | A human-reviewed document or a checked platform record supports this line | That the car is accident-free |
| `EVIDENCE_FOUND` | Supporting evidence exists (VIN format, photo count, price context) | Registry confirmation |
| `POTENTIAL_INCONSISTENCY` | Two pieces of evidence disagree or a claim is implausible | Proof of fraud |
| `NOT_VERIFIED` | A check was possible but has not been completed | That the check failed |
| `NO_DATA` | No data exists to check | That nothing happened |

Confidence is a display of **evidence strength**, not a probability that the car is good. Formula: base 32, +12 per verified document (max +30), +2 per evidence finding (max +12), +6 valid VIN, +5 for ≥5 photos, −8 per inconsistency, −10 per critical, clamped 5–95. Any critical finding forces `NEEDS_REVIEW`.

---

## 6. Data model (ERD)

### 6.1 Identity and tenancy

```mermaid
erDiagram
  users ||--o{ sessions : "has"
  users ||--o{ tenant_memberships : "joins"
  tenants ||--o{ tenant_memberships : "employs"
  tenants ||--o{ tenant_invitations : "invites"
  users ||--o{ tenant_invitations : "invited by"
  plans ||--o{ tenant_subscriptions : "chosen plan"
  tenants ||--o{ tenant_subscriptions : "subscribes"

  users {
    text id PK
    text email UK
    text password_hash
    text name
    text locale
    text platform_role "USER|SUPER_ADMIN|PLATFORM_SUPPORT"
    text status "ACTIVE|SUSPENDED|PENDING_DELETION"
  }
  tenants {
    text id PK
    text name
    text slug UK
    text province
    text verification_status "NONE|PENDING|VERIFIED|REJECTED"
    text status "ACTIVE|SUSPENDED|ARCHIVED"
  }
  tenant_memberships {
    text id PK
    text user_id FK
    text tenant_id FK
    text role "TENANT_OWNER|TENANT_ADMIN|INVENTORY_MANAGER|SALES_AGENT"
    text status
  }
  tenant_invitations {
    text id PK
    text tenant_id FK
    text email
    text role
    text token UK
    int expires_at
    int accepted_at
  }
```

### 6.2 Inventory and listings

```mermaid
erDiagram
  vehicles ||--o{ vehicle_images : "has"
  vehicles ||--o{ vehicle_documents : "has"
  vehicles ||--|| listings : "listed as"
  tenants ||--o{ listings : "owns"
  users ||--o{ listings : "sells"

  vehicles {
    text id PK
    text make
    text model
    text variant
    int year
    int mileage_km
    text vin
    text chassis_number
    text plate_number
    text vin_status "MISSING|PROVIDED|INVALID"
  }
  vehicle_images {
    text id PK
    text vehicle_id FK
    text url
    int position
    text hash
  }
  vehicle_documents {
    text id PK
    text vehicle_id FK
    text type
    text status "PENDING|VERIFIED|REJECTED"
    text file_url "private://..."
    text visibility
    int verified_at
  }
  listings {
    text id PK
    text slug UK
    text vehicle_id FK
    text seller_id FK
    text tenant_id FK
    int price_usd
    int price_khr
    text status "DRAFT|PENDING|PUBLISHED|REJECTED|SOLD|ARCHIVED"
    text ownership_doc_status
    int featured_until
    int published_at
    int expires_at
    text moderation_flags "JSON"
  }
```

### 6.3 Trust and reports

```mermaid
erDiagram
  listings ||--o{ report_requests : "reported for"
  vehicles ||--o{ report_requests : "subject"
  report_requests ||--o{ report_findings : "contains"
  report_requests ||--o{ reported_content : "disputed via"

  report_requests {
    text id PK
    text public_id UK
    text vehicle_id FK
    text listing_id FK
    text requested_by_id
    text status "QUEUED|PROCESSING|READY|NEEDS_REVIEW|FAILED"
    int confidence
    text risk_level
    text summary_en
    text summary_km
    text limitations_en
    text limitations_km
  }
  report_findings {
    text id PK
    text report_id FK
    text category
    text code
    text status
    text severity
    int confidence
    text data_json
    text source_ref
  }
```

### 6.4 Marketplace operations

```mermaid
erDiagram
  listings ||--o{ conversations : "about"
  users ||--o{ conversations : "buys"
  users ||--o{ conversations : "sells"
  conversations ||--o{ messages : "contains"
  listings ||--o{ favorites : "saved"
  users ||--o{ favorites : "saves"
  users ||--o{ saved_searches : "saves"
  listings ||--o{ appointments : "viewing"
  listings ||--o{ offers : "offer"
  users ||--o{ notifications : "receives"
  users ||--o{ reported_content : "reports"
  users ||--o{ audit_logs : "acts"

  conversations {
    text id PK
    text listing_id FK
    text buyer_id FK
    text seller_id FK
    text tenant_id FK
    int last_message_at
  }
  messages {
    text id PK
    text conversation_id FK
    text sender_id FK
    text body
    text kind "TEXT|SAFETY_NOTICE|SYSTEM"
    int read_at
  }
  appointments {
    text id PK
    text listing_id FK
    text buyer_id FK
    text seller_id FK
    int preferred_at
    text status "REQUESTED|CONFIRMED|DECLINED|COMPLETED|CANCELLED"
  }
  offers {
    text id PK
    text listing_id FK
    text buyer_id FK
    int amount_usd
    text status "PENDING|ACCEPTED|DECLINED|WITHDRAWN"
  }
  reported_content {
    text id PK
    text reporter_id FK
    text target_type "LISTING|USER|MESSAGE|REPORT"
    text target_id
    text reason
    text status "OPEN|REVIEWING|RESOLVED|DISMISSED"
  }
  audit_logs {
    text id PK
    text actor_id
    text tenant_id
    text action
    text target_type
    text target_id
    text metadata_json
  }
```

There are 22 tables in total; the diagrams cover the relationships that matter for authorisation and product behaviour. `plans` and `tenant_subscriptions` are billing placeholders only (no payment provider in this build).

---

## 7. Tenant isolation and threat model

| Threat | Control (implemented) | Test |
|---|---|---|
| Owner of tenant A reads tenant B leads | Tenant id resolved from membership; queries scoped by `ctx` tenant ids; page and API guards | `tests/security.test.ts` — cross-tenant reads rejected |
| Spoofed `tenantId` in request body | `canInTenant` / `resolveTenantForRequest` check membership and tenant status; body is never trusted | settings route returns 403 and leaves data unchanged |
| Sales agent escalates to admin | Role matrix; `member:manage`, `tenant:manage` denied to `SALES_AGENT` | RBAC matrix tests |
| Support escalates to super admin | `isSuperAdmin` required for role changes; support has no `user:manage` | 403 on `PATCH /api/admin/users/[id]` |
| Suspended dealership keeps selling | Tenant status checked in membership context, dashboard guard, listing visibility, invitation acceptance | Suspended membership has zero permissions; published listings hidden from search |
| Buyer opens seller's documents | Documents served only through authorised route; owner/tenant/platform checks | 403 for other tenant; 200 for owning dealer |
| Stranger reads a report | `canViewReport`: requester, seller, tenant staff, platform staff only | 403 on dispute endpoint; page renders no data |
| Privilege changes go unnoticed | `audit_logs` append-only writes for sensitive actions | Audit page + seed entries |
| Upload path traversal | Filenames generated by server; `path.basename` on read; private directory outside `public/` | Code review + upload constraints |

### SQLite limitation (documented deviation)

Production should run PostgreSQL with row-level security as an **additional** layer. SQLite/libSQL has no RLS, so this build relies on:
1. a single choke point for tenant resolution,
2. every tenant query including the resolved tenant id,
3. explicit route-level permission checks,
4. the security test suite.

This is acceptable for the prototype, not for a multi-region production deployment.

---

## 8. Performance and low-bandwidth design

- Server components render search and listing pages; the client JS budget is limited to interactive widgets (filters, gallery, compare, uploader).
- Listing images are local, compressed JPEGs; no external CDN dependency; `loading="lazy"` below the fold.
- No web fonts fetched from Google; `@fontsource` is bundled and subset by weight.
- Search has server-side pagination and facet counts; no client-side fetch of the full inventory.
- `data/angkorev.db` is file-backed for demo; indexes cover status/published, tenant/status, seller/status, price, make/model/year, VIN, plate, and image hash.
- Cache headers: public pages can be cached at the edge; dashboards and documents are `no-store`.

---

## 9. Deployment and scaling path

| Stage | Deployment | Database | Files | Reports |
|---|---|---|---|---|
| Prototype (this repo) | One Node process, `0.0.0.0:3000` | SQLite file | Local private folder | In-process rules engine |
| Pilot | 1–2 app instances behind a proxy | Managed Postgres + RLS | Object storage with signed URLs | Queue (e.g. Postgres-backed jobs) + worker |
| Scale | App + worker + read replica | Postgres | Object storage + CDN for public photos | Extraction provider(s) with human review queue |

Scaling triggers (not premature): p95 page > 1.5 s on 3G, DB write contention, > 5k listings, or > 20 concurrent report jobs.

---

## 10. Deliberate technical decisions

| Decision | Why | Trade-off |
|---|---|---|
| Next.js modular monolith | One deployable, shared types, simple auth/cookies, low cost | Not independently scalable per module yet |
| Drizzle + libSQL instead of Prisma | Prisma binaries could not be downloaded in the build environment; Drizzle is SQL-first and portable to Postgres | Hand-written SQL migration (`schema.sql`) |
| SQLite for the prototype | Zero-ops, file-based, adequate for demo | No RLS, limited concurrency; Postgres required for production |
| Rules engine, no LLM | Cannot fabricate history; deterministic, testable, free | Less "magical"; must be paired with human review |
| Mock AI provider seam | Keeps the interface for future extraction without pretending it exists | Provider is `rules-v1` only |
| No payment holding | Avoids NBC licensing and consumer-fund risk | Monetisation must be invoiced/subscription-based initially |
| Documents outside `public/` | Prevent accidental public exposure | Requires an authorised streaming route |

---

## 11. Operational runbook (prototype)

```bash
npm run setup       # apply schema + seed demo data
npm run typecheck   # strict TypeScript
npm test            # security regression suite
npm run dev         # 0.0.0.0:3000
```

- Health: `GET /api/health` returns database connectivity and version.
- Reset demo: `npm run db:seed` (refuses when `NODE_ENV=production`).
- Logs: report engine failures are logged and the report is marked `FAILED` rather than silently left `PROCESSING`.
