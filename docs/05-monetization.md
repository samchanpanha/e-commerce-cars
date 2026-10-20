# Monetisation hypotheses and validation plan

> **Everything in §3 and §4 is a hypothesis**, clearly labelled. No price in this document is a final commercial term, and the prototype does not process card payments.

---

## 1. Principles

1. **Never sell trust.** A dealer cannot pay to turn an inconsistency into a "verified" line, to hide a finding, or to rank above the evidence.
2. **Do not hold customer money.** No escrow, no wallet, no split payments at MVP. Subscriptions are invoiced platform services; vehicle payments happen directly between buyer and seller.
3. **Charge the side with repeat demand.** Dealers list repeatedly and employ staff; private sellers transact once.
4. **Validate willingness to pay before spending on AI infrastructure.** The rules engine and human review come first. OCR and external integrations are unlocked only by revenue evidence.
5. **Price honestly.** Feature the free tier; state that pilot pricing is a hypothesis on the public pricing page.

---

## 2. Revenue streams

| # | Stream | Who pays | Status in build | Hypothesis |
|---|---|---|---|---|
| R1 | **Dealer subscription** — inventory, team roles, leads, analytics, storefront | Dealership owner | Plans and quotas exist; billing is **not** connected | $29/month for up to 30 listings; $79 for multi-site/100 listings |
| R2 | **Featured listing** | Dealer or private seller | `featuredUntil` and admin/dealer action exist; no payment | $5–10 per 7 days, capped per plan |
| R3 | **Premium vehicle report** | Buyer or dealer | Reports are free in the pilot; no fee logic | $3–5 per report once review SLA and accuracy are proven |
| R4 | **Dealer verification / onboarding** | Dealer | Free during pilot | One-off $20–50 only if a real document review is performed |
| R5 | **Lead or appointment fee** | Dealer | Not implemented | Avoid at pilot; conflicts with subscription and encourages low-quality leads |
| R6 | **Data / market reports** | Banks, insurers, OEMs | Not implemented | Only with aggregated, non-personal data and legal review |

**Explicitly rejected for now:** escrow fees, financing commissions, insurance referral fees, paid removal of moderation flags, paid "verified seller" badges, selling leads to third parties.

---

## 3. Pricing hypotheses (labelled)

### 3.1 Dealer plans shown in the product

| Plan | Price (hypothesis) | Listing quota | Featured/month | Team | Reports | Analytics |
|---|---|---|---|---|---|---|
| Free pilot | $0 | 5 | 0 | — | Basic | — |
| Growth | **$29/month** | 30 | 2 | Yes | Included | Yes |
| Dealer Pro | **$79/month** | 100 | 8 | Yes | Included | Yes + priority support |

These figures appear on `/pricing` with the label "pilot pricing hypothesis, not final commercial terms".

### 3.2 Why these numbers

- They are **anchored to a target**, not to measured willingness to pay: at 50 paying dealers, $29 average gives ~$1,450 MRR, which covers a small support/moderation team in Phnom Penh only partially.
- The pilot's purpose is to discover the real number. A dealer who sells two cars a month at $500–1,500 gross margin can justify $29 if the platform produces one incremental sale every few months.
- The free tier is deliberately useful (5 listings, reports included) so that "free" is not a crippled demo.

### 3.3 Report pricing

Reports are free during the pilot because:
- review quality and turnaround are not yet measured;
- charging before the evidence process is proven would create pressure to overclaim;
- buyers are unlikely to pay before they trust the report format.

Once the pilot shows ≥90% of reports delivered within 24h and a dispute rate below 3%, test **$3** and **$5** price points with a "free for the first report" offer. Do not charge for "no data available" reports.

---

## 4. Unit economics (assumptions, not measurements)

| Input | Assumption | Confidence |
|---|---|---|
| Human document review | 8–12 minutes per document set | Low — time-track 100 reviews |
| Reviewer cost | $2.50–4.00/hour fully loaded | Low — local hiring data needed |
| Cost per reviewed report | **$0.40–0.80** | Derived from above |
| OCR/extraction (future) | $0.01–0.05/page | Low — provider quotes needed |
| Hosting (pilot) | $20–60/month | Medium |
| Payment processing | 2–3% + fixed fee via licensed PSP | Low — provider quotes needed |
| Support | 0.2 FTE for first 50 dealers | Low |
| CAC (dealer) | $30–80 via direct sales | Low — test |

Illustrative monthly gross margin at 50 Growth dealers (hypothesis):

```
Revenue            50 × $29                    = $1,450
Featured add-ons   assume 20% × 2 × $5         =   200
Gross revenue                                  = $1,650
Report review      assume 150 reports × $0.60  =   -90
Hosting                                        =   -40
Payment fees       assume 3%                   =   -50
Contribution before support and salaries        = $1,470
```

This does **not** prove profitability: support, moderation and engineering are not included. It shows the model can cover variable costs per report, which is the relevant gate before buying OCR capacity.

---

## 5. Validation experiments

Each experiment has a pass/fail rule set **before** it runs.

### E1 — Dealer problem interviews (weeks 1–3)

- 12–15 semi-structured interviews with Phnom Penh dealers (independent + brand dealers).
- Test: do they describe lead quality, pricing opacity or buyer trust as a top-3 problem?
- **Pass:** ≥8/15 rank at least one of those in the top 3, and ≥5 will share anonymised inventory data for a pilot.
- **Fail:** pivot to a dealer-only inventory/CRM tool or a buyer education product.

### E2 — Paid pilot conversion (weeks 5–10)

- 10 dealers get Growth free for 30 days, then a written $29/month offer.
- **Pass:** ≥4/10 convert to paid (or sign a 3-month invoice), and ≥3 cite leads or trust tooling as the reason.
- **Fail:** keep free longer; investigate whether dealers will pay per verified report or per featured listing instead.

### E3 — Report usefulness (weeks 4–8)

- 30 buyers receive a report; 15-minute follow-up.
- **Pass:** ≥60% can correctly explain what "no data available" means; ≥50% say the report changed a question they would ask the seller; <10% believe the report proves the car is accident-free.
- **Fail:** rewrite the report UX and re-test before charging.

### E4 — Price point for reports (weeks 8–12)

- Conjoint or simple A/B: $0 vs $3 vs $5, measuring request completion, not stated intent.
- **Pass:** at $3, ≥15% of listing viewers who open the report modal complete a (mock or real) purchase; refund rate <5%.
- **Fail:** keep reports bundled in dealer subscriptions and free for buyers.

### E5 — Featured listing demand

- Offer 7-day featured placement at $5 to 20 dealers.
- **Pass:** ≥5 purchases and ≥20% increase in views/leads vs control.
- **Fail:** drop the feature from the paid tier.

### E6 — Disintermediation check

- Track how often a conversation moves to Telegram/phone before a viewing is recorded.
- **Pass (for the business):** dealers still log leads and appointments because the dashboard is useful.
- **Fail:** build value after the lead (inspection scheduling, document checklist) rather than trying to block contact.

---

## 6. Decision gates before spending on AI infrastructure

| Gate | Threshold | Consequence |
|---|---|---|
| G1 — Paid dealers | ≥10 paying dealers for 2 consecutive months | Hire part-time report reviewer |
| G2 — Report volume | ≥300 reports/month | Automate extraction (OCR) for document fields |
| G3 — Revenue | ≥$3,000 MRR | Invest in provider integrations and a queue/worker |
| G4 — Accuracy | Dispute rate <3%, review SLA <24h for 8 weeks | Consider charging for reports |
| G5 — Data partnership | Signed, lawful agreement with a registry/insurer/auction source | Display "verified by source" beyond platform documents |

Until G5, the product must not imply any external history source exists.

---

## 7. Risks to the model

| Risk | Mitigation |
|---|---|
| Dealers expect free leads (classifieds norm) | Sell workflow + trust, not just exposure; prove lead volume; keep a free tier |
| Buyers will not pay for reports | Bundle reports into dealer plans; charge dealers for verification, not buyers |
| Report review does not scale at $29 | Raise price or limit included reports; automate extraction only after G2 |
| Competitors copy the badge language | Publish methodology and source references; brand the evidence ledger; keep the dispute log public |
| Disintermediation after the first message | Provide appointment, inspection and document tools both sides value |
| Regulatory reclassification of payments | Never hold funds; use licensed partners; obtain advice before any wallet/escrow |
| Cost of fraud/moderation | Rate limits, duplicate detection, human review, suspension and audit trail |

---

## 8. What success looks like at 90 days

- 10 dealers onboarded, ≥4 paying or invoiced.
- 150+ published listings, ≥60% with at least one reviewed document.
- 100 reports generated, ≥50 buyer follow-ups, dispute rate <5%.
- MRR ≥ $120–$300 (small on purpose; the goal is evidence, not scale).
- A written decision: double down on subscriptions, switch to report fees, or stop.
