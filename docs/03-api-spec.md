# REST API specification

Base URL: `/api`. All responses are JSON.
Authentication: session cookie `aev_session` (httpOnly). There are no bearer tokens in the prototype.

---

## 1. Conventions

### Response envelope

Success:

```json
{ "data": { "...": "..." } }
```

Error:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You cannot edit this dealership.",
    "details": null,
    "requestId": "6f1c…"
  }
}
```

Validation errors use HTTP 422 with `details` holding field errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted data is invalid.",
    "details": { "email": ["Invalid email"] },
    "requestId": "…"
  }
}
```

### Status codes

| Code | When |
|---|---|
| 200 | Read or update succeeded |
| 201 | Resource created (listing, report, upload, offer, invitation, dispute) |
| 400 | Malformed body / business rule (e.g. own listing inquiry) |
| 401 | No valid session |
| 403 | Authenticated but not permitted (tenant, role, document, report) |
| 404 | Not found, or intentionally hidden from the caller |
| 409 | Conflict / invalid state (duplicate offer, used invitation, self-suspension) |
| 410 | Expired invitation |
| 413 / 415 | Upload too large / wrong file type |
| 422 | Schema validation failed |
| 429 | Rate limited |
| 500 | Unhandled server error (logged with request id) |

### Pagination

Search endpoints accept `page` (default 1) and `pageSize` (default 12, max 48) and return:

```json
{
  "data": {
    "items": [],
    "pagination": { "page": 1, "pageSize": 12, "total": 0, "totalPages": 0 },
    "filters": {}
  }
}
```

### Rate limits (in-memory, per process)

| Scope | Limit |
|---|---|
| Login per IP | 12 / 10 min |
| Login per IP + email | 6 / 10 min |
| Registration per IP | 6 / 10 min |
| Uploads per user | 40 / 10 min (80 / IP) |
| Inquiries per user | 20 / hour |
| Reports per user | 10 / day |
| Content reports per user | 15 / hour |
| Document uploads per user | 20 / hour |

> Production note: replace the in-memory limiter with a shared store (Redis/Postgres) before running multiple instances.

---

## 2. Public endpoints (no session)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness + database probe |
| GET | `/api/listings` | Search published listings |
| GET | `/api/listings/compare?ids=a,b,c` | Up to 3 published listings for comparison |
| POST | `/api/auth/register` | Create buyer / private seller / dealer account |
| POST | `/api/auth/login` | Start session |
| POST | `/api/auth/logout` | Revoke session |

### `GET /api/listings`

Query parameters: `q, make, model, province, minPrice, maxPrice, minYear, maxYear, maxMileage, fuel, transmission, bodyType, sellerType(all|dealer|private), verifiedOnly(true|false), sort(relevance|price_asc|price_desc|mileage_asc|year_desc|newest), page, pageSize`.

Only `PUBLISHED`, unexpired listings from `ACTIVE` tenants are returned. Suspended dealers disappear from search and facets without deleting data.

```json
{
  "data": {
    "items": [
      {
        "id": "lst_…",
        "slug": "2021-toyota-prius-1-8-hybrid-3852d",
        "priceUsd": 23800,
        "province": "Phnom Penh",
        "make": "Toyota",
        "model": "Prius",
        "year": 2021,
        "mileageKm": 38000,
        "transmission": "AUTOMATIC",
        "fuelType": "HYBRID",
        "bodyType": "HATCHBACK",
        "image": "/images/cars/prius-white.jpg",
        "imageCount": 3,
        "sellerType": "dealer",
        "tenantName": "Angkor Auto Group",
        "tenantVerified": true,
        "inspectionAvailable": true,
        "ownershipDocStatus": "ORIGINAL_AVAILABLE",
        "hasVerifiedDoc": true
      }
    ],
    "pagination": { "page": 1, "pageSize": 12, "total": 1, "totalPages": 1 },
    "filters": { "sort": "relevance" }
  }
}
```

### `GET /api/listings/compare?ids=…`

Returns published listings only, max 3, with first image, seller type, ownership/inspection state, VIN status, and a **report summary** (public id, status, confidence, risk, counts by evidence status). No vehicle documents are included.

### `POST /api/auth/register`

```json
{
  "name": "Sokha Buyer",
  "email": "sokha@example.com",
  "phone": "+855 12 345 678",
  "password": "at-least-8-characters",
  "accountType": "BUYER",
  "dealerName": "Only for DEALER",
  "locale": "en",
  "acceptTerms": true
}
```

Returns `{ data: { redirectTo } }` and sets the session cookie. A `DEALER` registration creates a tenant, owner membership and storefront slug in one transaction-like sequence.

### `POST /api/auth/login`

```json
{ "email": "buyer@angkorev.kh", "password": "Demo1234!", "next": "/customer" }
```

`next` is sanitised to a same-site path (`safeNextPath`). Returns `{ data: { redirectTo } }`.

---

## 3. Listings

| Method | Path | Auth | Permission |
|---|---|---|---|
| POST | `/api/listings?tenantId=` | session | `listing:create` in tenant, or private seller |
| GET | `/api/listings/[id]` | session | `listing:read` (seller, tenant member, platform staff) |
| PATCH | `/api/listings/[id]` | session | `listing:edit` |
| DELETE | `/api/listings/[id]` | session | `listing:delete` (soft archive) |
| POST | `/api/listings/[id]/publish` | session | `listing:publish` or moderator |
| POST | `/api/listings/[id]/sold` | session | `listing:edit` |
| POST | `/api/listings/[id]/feature` | session | `listing:feature` (tenant) or platform |
| POST | `/api/listings/[id]/documents` | session | `listing:edit` |
| POST | `/api/uploads` | session | any active user |

### `POST /api/listings`

Creates vehicle + listing. Images are URLs previously returned by `/api/uploads`.

```json
{
  "make": "Toyota", "model": "Prius", "variant": "1.8 Hybrid", "year": 2021,
  "mileageKm": 38000, "transmission": "AUTOMATIC", "fuelType": "HYBRID",
  "bodyType": "HATCHBACK", "engineCc": 1798, "drivetrain": "FWD",
  "exteriorColor": "White", "seats": 5, "vin": "JTDKB3FU7N3123456",
  "chassisNumber": "ZVW51-3123456", "plateNumber": "2AA-1234",
  "priceUsd": 23800, "condition": "USED", "province": "Phnom Penh",
  "district": "Toul Kork", "descriptionEn": "…", "descriptionKm": "…",
  "ownershipDocStatus": "ORIGINAL_AVAILABLE", "importDocStatus": "COPY_ONLY",
  "inspectionAvailable": true, "inspectionNote": "…",
  "images": ["/uploads/abc.jpg"], "publish": true
}
```

`tenantId` comes from the query string and is validated with `resolveTenantForRequest` + `canInTenant`; a body-supplied tenant is ignored. `publish: true` submits for review (`PENDING`) and requires at least one photo. Returns `201` with the listing id, slug and status.

### `POST /api/listings/[id]/documents`

`multipart/form-data`: `file` (JPG/PNG/WebP/PDF, ≤10 MB), `type` (`REGISTRATION | IMPORT_DECLARATION | OWNERSHIP_TRANSFER | SERVICE_RECORD | INSPECTION_REPORT | OTHER`), optional `note`.

Returns `201 { data: { id, status: "PENDING", type } }`. Files are written to `data/private-documents/`, hashed with SHA-256, and stored as `private://<name>`. They are never returned as public URLs.

### `POST /api/uploads`

`multipart/form-data` with `file` (image). Returns `201 { data: { url, width, height, hash } }`. Production replaces this with S3/R2 presigned uploads; the app server should not carry image bytes at scale.

---

## 4. Buyer features

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST/GET | `/api/favorites` | session | `POST { listingId, action: add|remove }`; lists own favourites |
| POST/DELETE | `/api/saved-searches` | session | Save query JSON; toggle alerts; delete own |
| POST | `/api/inquiries` | session | Creates/reuses a conversation, optional viewing appointment, writes a `SAFETY_NOTICE` message |
| POST/PATCH | `/api/offers` | session | Buyer creates offer; seller/tenant responds |
| POST | `/api/reports` | session | Request an evidence report for a published listing |
| POST | `/api/reports/[publicId]/dispute` | session | Requester/seller/tenant/platform staff only |
| POST | `/api/reports-content` | session | Report a listing/user/message/report for moderation |

### `POST /api/inquiries`

```json
{
  "listingId": "lst_…",
  "message": "Is it available on Saturday?",
  "intent": "VIEWING",
  "appointmentAt": "2026-10-24T09:00:00.000Z"
}
```

Returns `201 { data: { conversationId, appointmentId? } }`. Creates an appointment only for `VIEWING`/`INSPECTION`. The platform adds a safety notice; it never asks for a deposit.

### `POST /api/reports`

```json
{ "listingId": "lst_…", "consent": true }
```

Runs the rules engine synchronously in this build and returns `201 { data: { reportId, publicId, status } }`. Status is `READY` or `NEEDS_REVIEW`. Rate limited to 10/day/user. No external history provider is called.

### `POST /api/reports/[publicId]/dispute`

```json
{ "reason": "INCORRECT_INFO", "details": "The import document is a copy, not pending." }
```

Creates a moderation case and moves a `READY` report to `NEEDS_REVIEW`.

---

## 5. Tenant endpoints

| Method | Path | Permission |
|---|---|---|
| PATCH | `/api/tenant/settings` | `tenant:manage` on `body.tenantId` |
| POST | `/api/tenant/invitations` | `member:manage` |
| PATCH | `/api/tenant/members/[id]` | `member:manage`; owner membership protected |
| PATCH | `/api/tenant/appointments/[id]` | `lead:manage` |
| POST | `/api/invitations/[token]/accept` | signed-in user whose email matches the invitation |

### `PATCH /api/tenant/settings`

```json
{
  "tenantId": "tnt_…", "name": "Angkor Auto Group",
  "descriptionEn": "…", "descriptionKm": "…",
  "phone": "+855 23 900 111", "email": "hello@…",
  "website": "https://…", "addressLine": "#123, St 289",
  "province": "Phnom Penh", "logoUrl": ""
}
```

`tenantId` is a claim, not an authorisation: the route checks the session membership and rejects cross-tenant edits with 403.

### `POST /api/tenant/invitations`

```json
{ "tenantId": "tnt_…", "email": "staff@example.com", "role": "SALES_AGENT" }
```

Returns `201 { data: { id, inviteUrl } }`. In production the link is emailed; in the demo it is returned so it can be copied. Invitations expire after 7 days.

### `PATCH /api/tenant/members/[id]`

`{ "role": "INVENTORY_MANAGER" }` or `{ "status": "INACTIVE" }`. A `TENANT_OWNER` membership can only be changed by a super admin.

### `PATCH /api/tenant/appointments/[id]`

`{ "status": "CONFIRMED" }` — one of `CONFIRMED | DECLINED | COMPLETED | CANCELLED`.

---

## 6. Admin endpoints

All require an active platform role; most require `canPlatform`.

| Method | Path | Required permission | Body |
|---|---|---|---|
| PATCH | `/api/admin/tenants/[id]` | `tenant:admin` (super admin) | `{action: VERIFY\|REJECT\|SUSPEND\|REINSTATE, reason?}` |
| PATCH | `/api/admin/listings/[id]` | `listing:moderate` | `{action: APPROVE\|REJECT\|ARCHIVE, reason?}` |
| PATCH | `/api/admin/cases/[id]` | `moderation:handle` | `{status: REVIEWING\|RESOLVED\|DISMISSED, note?}` |
| PATCH | `/api/admin/reports/[id]` | `report:review` | `{action: RERUN\|APPROVE\|SEND_BACK, note?}` |
| PATCH | `/api/admin/documents/[id]` | `moderation:handle` | `{status: VERIFIED\|REJECTED\|PENDING, note?}` |
| PATCH | `/api/admin/users/[id]` | super admin only | discriminated union below |

### `PATCH /api/admin/users/[id]`

```json
{ "action": "SUSPEND", "reason": "Multiple confirmed fraud reports." }
```

```json
{ "action": "REACTIVATE" }
```

```json
{ "action": "SET_ROLE", "role": "PLATFORM_SUPPORT" }
```

- `SET_ROLE` only accepts `USER | PLATFORM_SUPPORT | SUPER_ADMIN`.
- Suspension revokes all sessions immediately.
- Self-suspension and self-role-change return `409 SELF_ACTION`.
- All three write to `audit_logs` (`user.suspend`, `user.reactivate`, `user.role_change`).

---

## 7. Documents and private files

`GET /api/documents/[id]`

- Requires a session.
- Allowed for: the listing's seller, an active member of the listing's tenant, or platform staff with `moderation:handle`.
- Streams the file inline with `Cache-Control: private, no-store`, `Content-Disposition: inline`, `X-Content-Type-Options: nosniff`.
- 404 if the file is not a private object or is missing.

There is deliberately **no public document URL** and no document path in the public listing API.

---

## 8. Client-facing error examples

| Scenario | Response |
|---|---|
| `PATCH /api/tenant/settings` as `SALES_AGENT` | `403 FORBIDDEN` |
| `PATCH /api/tenant/settings` with another tenant's id | `403 FORBIDDEN`, no data change |
| `GET /api/listings/[id]` for another dealer's car | `403 FORBIDDEN` |
| `GET /api/documents/[id]` for another tenant | `403 FORBIDDEN` |
| `POST /api/reports/[publicId]/dispute` as a stranger | `403 FORBIDDEN` |
| `PATCH /api/admin/users/[id]` as support | `403 FORBIDDEN` |
| Super admin changes own role | `409 SELF_ACTION` |
| Used/expired invitation | `409 INVITE_USED` / `410 INVITE_EXPIRED` |
| Invitation email mismatch | `403 EMAIL_MISMATCH` |
| Suspended tenant invitation | `403 TENANT_SUSPENDED` |
