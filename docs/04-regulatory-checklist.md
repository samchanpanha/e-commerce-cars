# Cambodian regulatory checklist

> **Not legal advice.** This is an engineering and product checklist of questions raised by the build. Cambodian rules change by prakas, sub-decree and notification, and several of the sources below are secondary. Every item marked **[counsel]** must be confirmed by qualified Cambodian counsel before launch, paid features, or any data partnership.

Compiled 20 October 2026.

---

## 1. Entity, licensing and tax

| # | Item | What we know | Product action | Status |
|---|---|---|---|---|
| 1.1 | Operating company | A marketplace contracting with dealers and consumers needs a registered legal entity (Ministry of Commerce), tax registration (GDT) and the relevant patent tax. | Incorporate before taking fees; keep platform and dealer funds separate. | **[counsel]** |
| 1.2 | E-commerce intermediary obligations | The **Law on Electronic Commerce** was promulgated 2 Nov 2019 and came into force in 2020 (12 chapters, 67 articles). It covers electronic records/signatures, intermediary duties, consumer information and data protection. — [Law text (PDF)](https://commerce-cambodia.com/wp-content/uploads/2021/06/eCommerceLawEN.pdf), [Open Development record](https://data.opendevelopmentcambodia.net/laws_record/law-on-e-commerce), [Tilleke summary](https://www.tilleke.com/insights/cambodia-enacts-new-e-commerce-law-and-consumer-protection-law/) | Publish legal name, registered address, contact channel, terms, payment methods and complaint route (Art. 29). Keep records of electronic acceptances. | **[counsel]** verify whether a specific e-commerce permit/licence applies to our model |
| 1.3 | Consumer protection | The **Law on Consumer Protection** was enacted with the e-commerce law in 2019 and applies to traders dealing with consumers in Cambodia. — [Tilleke](https://www.tilleke.com/insights/cambodia-enacts-new-e-commerce-law-and-consumer-protection-law/) | No misleading "verified" claims; clear pricing in USD and KHR; complaint and correction workflow; do not disclaim statutory rights in the terms. | **[counsel]** review terms, disclaimers and the dispute process |
| 1.4 | VAT and invoicing | Standard VAT rate is 10%. E-commerce VAT (Sub-Decree 65 / Prakas 542) applies from 1 Apr 2022 to **non-resident** suppliers of digital goods/services/e-commerce above KHR 250m annual or KHR 60m over three consecutive months, with simplified registration. — [GDT FAQ](https://www.tax.gov.kh/u6rhf7ogbi6/gdtstream/b0766b9e-34c4-4bee-a0e1-8d33d7bcf2d5), [DFDL on Instruction 2520](https://www.dfdl.com/insights/legal-and-tax-updates/cambodia-non-resident-vat-e-commerce-update/) | Model fees as platform services with invoices. Confirm whether subscriptions, featured placement and report fees are VATable, and how KHR/USD invoicing works. | **[counsel]** / accountant |
| 1.5 | Withholding tax on payments to dealers | Not researched. | Do not process dealer payouts; dealers pay us, not the reverse, at MVP. | **[counsel]** if we ever collect on behalf of dealers |

---

## 2. Data protection and privacy

| # | Item | What we know | Product action | Status |
|---|---|---|---|---|
| 2.1 | Data protection law | Article 32 of the E-Commerce Law requires reasonable security safeguards for personal data held electronically, and allows correction/deletion of inaccurate data entered into automated systems. Commentators note there is no comprehensive standalone data-protection statute. — [Law text](https://commerce-cambodia.com/wp-content/uploads/2021/06/eCommerceLawEN.pdf), [DLA Piper Cambodia](https://www.dlapiperdataprotection.com/index.html?t=law&c=KH) | Privacy notice in Khmer and English; purpose limitation; retention schedule; data subject request route. | **[counsel]** confirm the status of any draft personal-data-protection law and implementing rules |
| 2.2 | Consent for document processing | Registration cards, IDs and import papers are personal data and can reveal identity, address and ownership history. | Explicit consent at report request and document upload; documents visible only to authorised staff; no public URLs; access logged where feasible. | Implemented |
| 2.3 | Cross-border processing / AI providers | Sending document images to an overseas OCR or LLM provider is a transfer of personal data. | Do not send documents to an external provider until counsel approves the transfer, the provider contract, retention and deletion. The current build sends nothing externally. | **[counsel]** before Phase 4 |
| 2.4 | Retention and deletion | Reports and documents may be needed for disputes, but keeping them forever increases risk. | Define retention (e.g. documents 24 months after listing closure; audit logs 5 years) and a deletion job. Do not promise deletion in the privacy notice until the job exists. | Backlog `AEV-041` |
| 2.5 | Cookies and analytics | Session cookie is essential; any analytics would be non-essential. | No third-party analytics in the prototype. If added, disclose and consider consent. | **[counsel]** |

---

## 3. Vehicle registration, transfer and history data

| # | Item | What we know | Product action | Status |
|---|---|---|---|---|
| 3.1 | Registration | MPWT runs vehicle registration through `vehicle.mpwt.gov.kh`; the published fee is 125,000 riel plus optional plate fees, with documents including import-tax receipt, dealer letter, inspection certificate and ID/residency documents. — [MPWT vehicle registration](https://www.mpwt.gov.kh/en/public-services/vehicle-registration) | Show a generic, sourced checklist; never promise a registration outcome. | Source-linked, not legal advice |
| 3.2 | Ownership transfer | MPWT has an online transfer process; reporting says buyer and seller may need to appear in person, with stamp duty paid to the tax authority. A 2024 notification clarified the procedure. — [Advance Group summary, 2025](https://www.advancegroupkh.com/newsEn/transfer-of-vehicle-ownership/); [MPWT](https://www.mpwt.gov.kh/en/public-services/vehicle-registration) | Safety page tells buyers to transfer at the ministry/tax office with both parties; no "we handle transfer" claim. | **[counsel]** verify current steps and fees |
| 3.3 | Transfer deadline | Sources conflict (30 days vs 90 days) and secondary pages are unreliable. | Do not state a deadline. Link to MPWT and advise confirming locally. | **[counsel]** |
| 3.4 | Used-vehicle import rules | Import age, eligibility and duty rules were **not** verified from an official source. | Do not describe import eligibility. Treat "imported from" as a seller claim unless a customs document is reviewed. | **Do not assert**; research with GDCE/MPWT |
| 3.5 | History databases | No Cambodian government or insurer vehicle-history API was identified. | The report engine never claims registry or insurer checks. "No records found" is shown as `NO_DATA`, not "no accidents". | Implemented |
| 3.6 | Data partnership terms | Any future registry/insurer feed needs a lawful basis, contract, audit and correction path. | Negotiation item, not an engineering assumption. | Open |

---

## 4. Payments, money handling and financial services

| # | Item | What we know | Product action | Status |
|---|---|---|---|---|
| 4.1 | Payment services licensing | Providing payment facilities is reserved to banking/financial institutions under the Law on Banking and Financial Institutions 1999; payment service institutions need an NBC licence under the 2017 Prakas. — [NBC/PSI Prakas record](https://cambodiantr.gov.kh/en/document/?title=prakas-on-the-management-of-payment-service-institution), [Tilleke e-wallet note](https://www.tilleke.com/insights/cambodia-increases-oversight-of-e-wallet-customer-programs/26/) | The platform does not hold, route or guarantee buyer funds. No escrow, no wallet, no "safe payment" badge. | Implemented |
| 4.2 | E-money / stored value | NBC's 6 Aug 2026 notification requires non-financial businesses issuing single-purpose e-money (e.g. stored-value wallets) to notify the NBC within 90 days, i.e. by 4 Nov 2026; above the exemption thresholds or multi-merchant use, a licence may be required. Thresholds cited: KHR 200,000 per account and KHR 800 million aggregate. — [Kaohoon summary](https://www.kaohooninternational.com/aseanupdates/588766), [B2B Asia News](https://b2b-asianews.com/news/nbc-tightens-restrictions-on-e-wallet-issuances/) | Do not add deposits, prepaid balances or dealer credits. If we ever do, obtain NBC advice first. | **[counsel]** |
| 4.3 | Capital and licence terms | Secondary sources disagree on minimum capital (e.g. USD 0.5m vs 1.5m vs 2m+). | Do not quote capital figures. Use a licensed PSP for any future collection. | **Do not rely on secondary figures** |
| 4.4 | Escrow and split payments | Third-party competitor marketing claims escrow; this is not evidence that the model is licensed. | Position any future escrow as a partner product, with separate legal and provider review. | **[counsel]** / partner |
| 4.5 | Lending, insurance, guarantees | Out of scope. | No financing, insurance or "guaranteed" transaction language. | Implemented |

---

## 5. Advertising, claims and marketplace conduct

| # | Item | Risk | Control |
|---|---|---|---|
| 5.1 | "Verified" wording | A buyer may read it as "car is safe". | Every badge names what was checked and what it does not mean; report page repeats limitations. |
| 5.2 | AI claims | Claiming AI detects accidents would be false. | Product says "rules-based checks"; provider string is `rules-v1`. No LLM recall. |
| 5.3 | Price context | Could be read as a valuation. | Labelled "comparable listings on AngkorEV — not a valuation". |
| 5.4 | Seller claims | Accident/maintenance claims are seller statements. | Stored as `accidentClaim` / `maintenanceClaim` and displayed as seller statements, not findings. |
| 5.5 | Prohibited listings | Stolen vehicles, smuggling, right-hand-drive issues. | Moderation queue, duplicate VIN/plate checks, user reporting, suspension and audit trail. |
| 5.6 | Photo rights | Dealers may upload images they do not own. | Terms include a rights warranty and takedown process; duplicate hashes help detect reuse. |

---

## 6. Employment, contractors and operations

| # | Item | Question |
|---|---|---|
| 6.1 | Moderators | Are document reviewers employees or contractors? What training and confidentiality undertakings apply? **[counsel/HR]** |
| 6.2 | Dealer staff accounts | Tenant owners invite staff; the platform must not be treated as the employer. Terms should say dealers are responsible for their staff accounts. |
| 6.3 | Record keeping | How long must audit logs, invoices and dispute records be kept? **[accountant/counsel]** |
| 6.4 | Accessibility and language | Consumer terms in Khmer; English translation for reference. Khmer version should prevail for consumers unless counsel advises otherwise. |

---

## 7. Launch gate — questions for local counsel

1. Does our model require a specific e-commerce licence/permit or registration with MoC beyond company registration?
2. Do our Terms of Service, privacy notice, dealer agreement and report disclaimer comply with the E-Commerce Law and Consumer Protection Law? Which language version prevails?
3. What is the lawful basis and retention period for storing scanned registration cards and import declarations? Can we rely on consent alone?
4. May we send document images to an overseas OCR/AI provider? What contractual and cross-border safeguards are required?
5. Is there any current data-protection or cybersecurity statute, sub-decree or draft that we must plan for?
6. What exactly is the current ownership-transfer procedure and deadline, and what may a marketplace publish about it without giving legal advice?
7. Can a private platform lawfully obtain vehicle registration or insurance history from MPWT, GDT, insurers or auction houses? Under what agreement?
8. If we later accept dealer subscription payments via a licensed PSP, do we need any NBC authorisation? What wording may we use about payments?
9. How should VAT be applied to subscription, featured-listing and report fees, and what invoices are required in USD/KHR?
10. What are our obligations when a seller uploads a document that appears forged or belongs to someone else? What takedown and reporting steps are required?

---

## 8. Sources

| Source | Date | Used for |
|---|---|---|
| [Law on Electronic Commerce (PDF)](https://commerce-cambodia.com/wp-content/uploads/2021/06/eCommerceLawEN.pdf) | Promulgated 2 Nov 2019 | Arts. 29, 32; intermediary and consumer duties |
| [Open Development Cambodia — E-commerce Law](https://data.opendevelopmentcambodia.net/laws_record/law-on-e-commerce) | Record | Effective date |
| [Tilleke — E-commerce and Consumer Protection Laws](https://www.tilleke.com/insights/cambodia-enacts-new-e-commerce-law-and-consumer-protection-law/) | 2020 | Scope of both laws |
| [DLA Piper — Cambodia data protection](https://www.dlapiperdataprotection.com/index.html?t=law&c=KH) | Accessed 2026 | Art. 32; no standalone statute identified |
| [MPWT — vehicle registration](https://www.mpwt.gov.kh/en/public-services/vehicle-registration) | Accessed 2026 | Registration portal and fee |
| [Advance Group — ownership transfer](https://www.advancegroupkh.com/newsEn/transfer-of-vehicle-ownership/) | 2025 | Transfer procedure, stamp duty, in-person appearance |
| [Khmer Today — Prakas 123](https://www.thekhmertoday.news/news/232) | 17 Jul 2026 | Registration document requirements (secondary) |
| [GDT — VAT on e-commerce FAQ](https://www.tax.gov.kh/u6rhf7ogbi6/gdtstream/b0766b9e-34c4-4bee-a0e1-8d33d7bcf2d5) | Accessed 2026 | Effective date, thresholds |
| [DFDL — Instruction 2520](https://www.dfdl.com/insights/legal-and-tax-updates/cambodia-non-resident-vat-e-commerce-update/) | 2023 | Non-resident VAT registration and exemptions |
| [NBC/PSI Prakas record](https://cambodiantr.gov.kh/en/document/?title=prakas-on-the-management-of-payment-service-institution) | 2017 | Licence requirement (Art. 8), e-money (Art. 20) |
| [Tilleke — e-wallet notification](https://www.tilleke.com/insights/cambodia-increases-oversight-of-e-wallet-customer-programs/26/) | Aug 2026 | 6 Aug 2026 notice, 90-day deadline |
| [Kaohoon — single-purpose e-money](https://www.kaohooninternational.com/aseanupdates/588766) | Aug 2026 | Thresholds and scope |
