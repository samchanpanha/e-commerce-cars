# Market research — Cambodian used and EV car market

**Status:** desk research for product decisions, compiled 20 October 2026.
**Rule:** figures below are quoted with source and date. Anything not sourced is labelled as an assumption. We did **not** find a reliable public figure for used-car transaction volume or average transaction price, so none is asserted.

---

## 1. What the data says

### 1.1 Vehicle stock is large and overwhelmingly two-wheeled

As of October 2024, Cambodia had **7,618,669 registered vehicles**: 6,470,917 motorcycles and tricycles, **847,189 light vehicles** and 300,563 heavy vehicles. Of these, 4,320 were electric vehicles (2,513 electric cars, 1,329 electric motorcycles, 478 electric tricycles). — [Khmer Times, 29 Nov 2024, citing the General Department of Land Transport / MPWT](https://www.khmertimeskh.com/501600074/ev-a-high-potential-sector-in-cambodia/)

Implication: the addressable car universe is the ~847k light-vehicle fleet, not the 7.6m total. "Light vehicles" includes pickups and vans, so the passenger-car subset is smaller. We treat 847k as an upper bound for four-wheeled supply, not as a car count.

### 1.2 EVs are growing fast from a small base

- MPWT registered **2,253 EVs in 2024, up 620% from 313 in 2023**. BYD led registrations, followed by Toyota and Tesla. — [AKP (Agence Kampuchea Presse), 15 Jan 2025](https://www.akp.gov.kh/post/detail/326151)
- **14,534 EVs registered by February 2026**, including 10,363 electric cars; monthly registrations doubled from 488 in January to 1,078 in February 2026. — [AKP, 27 Mar 2026](https://www.akp.gov.kh/post/detail/366087)
- **6,174 EVs registered in H1 2026**, more than double the 2,459 in H1 2025; one report puts the cumulative fleet at 15,239 units. — [VietnamPlus, 14 Aug 2026](https://en.vietnamplus.vn/cambodia-moves-to-keep-pace-with-growing-ev-market-post350092.vnp), [Cambodge Mag, 20 Jul 2026](https://www.cambodgemag.com/en/post/cambodia-s-electric-vehicle-rush-accelerates-as-fuel-prices-surge)

⚠️ **Data conflict:** 14,534 cumulative in Feb 2026 and 6,174 registrations in H1 2026 cannot both reconcile with a 15,239 cumulative total in mid-2026. Different sources may use different cut-offs (cars vs all EVs, "since 2021" vs all-time). Treat EV totals as directional and quote the source alongside the number.

- The National Policy on EV Development 2024–2030 targets **30,000 electric cars, 720,000 electric motorcycles and 20,000 electric three-wheelers by 2030**. — [MPWT presentation via UNESCAP, 2025](https://www.unescap.org/sites/default/d8files/event-documents/2_5Cambodia.pdf); see also [Cambodia Automotive, 18 Sep 2024](https://cambodia-automotive.org/2024/09/18/unveiling-the-national-policy-on-electric-vehicles-development-2024-2030/)
- EV sales were about **8% of the new auto market in 2024**. — [US International Trade Administration, Cambodia Country Commercial Guide](https://www.trade.gov/country-commercial-guides/cambodia-passenger-cars-truck-and-automotive-parts) (page content refers to 2024; verify the current edition before external use)
- Only **21 public EV charging stations** were reported in January 2025. — [AKP, 15 Jan 2025](https://www.akp.gov.kh/post/detail/326151)

Implication for AngkorEV: the brand name and EV focus are ahead of the current volume. The marketplace must work for **used petrol and hybrid cars first**; EV-specific content (battery state-of-health, charging) is a differentiator for a minority of listings, not the whole product.

### 1.3 New cars overtook used imports — a structural shift

"By 2025 new cars had passed used imports for the first time, at about **55% of the market**, and Chinese brands had more than doubled their share in a year, **from 12% to 29%**." — [Khmer Times, 24 Jul 2026](https://www.khmertimeskh.com/501949266/as-cambodia-moves-to-new-cars-keep-the-used-car-instinct/)

Implication: used-car demand is not disappearing, but the mix is shifting toward newer, financed and brand-warranty vehicles. Trust problems move from "is this salvage import safe?" to "is this two-year-old EV's battery and history what the seller says?" Both are evidence problems.

### 1.4 The information gap is the product opportunity

A Khmer Times analysis of depreciation notes there is **no auction house setting a weekly clearing price and no published residual value guide**; the only public mirror is classifieds, which "reflects hope rather than fact." It gives a concrete spread: a BYD Atto 3 sells new for about **$26,800**, while two-to-three-year-old used listings start around **$18,800**, with a 2023 car at **$19,900**. — [Khmer Times, 6 Aug 2026](https://www.khmertimeskh.com/501991289/what-new-car-depreciation-really-looks-like-in-cambodia/)

This is the strongest available evidence for the trust thesis: buyers cannot easily distinguish a good car from a repaired one, and asking prices are not transaction prices. It also means **we must not present our own price context as a valuation**.

### 1.5 Where buyers look today

| Channel | What it is | Evidence | Implication |
|---|---|---|---|
| **Khmer24** | General classifieds, founded 2009, large cars & vehicles section with hundreds of listings, Khmer-first | [khmer24.com cars](https://www.khmer24.com/c-cars-and-vehicles); [Tracxn profile, 3 Sep 2026](https://tracxn.com/d/companies/khmer24/__AfdE9L7lONFa7DzeMsAfzObMdU90YLe6Otc_KaFgoJM) | Default place to browse; weak structure, no evidence layer, no dealer workflow |
| **MyKhmerCar / Liberty Carz / similar** | Car-specific classifieds / app; Liberty Carz markets valuation and escrow features | [Similarweb competitor listing, Aug 2026](https://www.similarweb.com/ja/website/khmer24.com/competitors/); [DG Motors blog, 12 Dec 2025](https://dgmotorscar.com/blog/cheapest-used-cars-in-cambodia/) | Competitors already claim escrow/valuation. Claims are **not verified**; treat as positioning, not fact |
| **Facebook groups / Marketplace / Telegram** | Informal listings, direct chat, high reach | Facebook had ~12.9m users in Cambodia in early 2025 — [Khmer Times, 14 May 2025, citing DataReportal](https://www.khmertimeskh.com/501683396/over-72-of-cambodians-active-on-social-media-platforms/); Facebook is 72.8% of social media traffic — [StatCounter, Sep 2026](https://gs.statcounter.com/social-media-stats/all/cambodia) | Acquisition and re-engagement happen on Facebook/Telegram; the marketplace cannot ignore them |
| **Dealer showrooms / word of mouth** | Relationship-driven, especially in Phnom Penh | Qualitative; no public data found | Dealer tooling (leads, inventory, staff) may be an easier first sale than consumer subscriptions |
| **Bank/finance repossessions** | Not researched | — | Open research question for counsel/partners |

### 1.6 Digital readiness supports a mobile-first, low-bandwidth product

- Internet users: **68.48% of individuals (2025)**; internet subscriptions 19.62m; mobile subscriptions 20.69m; mobile penetration 117.75%. — [Cambodia Digital Economy & Business Committee, digital landscape](https://digitaleconomy.gov.kh/en/supporting-sector/digital-landscape)
- Mobile connectivity dominates; fixed broadband was historically limited. Median mobile download speed was ~16 Mbps in 2022 — [Freedom House, Freedom on the Net 2022](https://freedomhouse.org/country/cambodia/freedom-net/2022). This is an older figure; use it only as a caution, not a current benchmark.
- Khmer is the default consumer language. Facebook and Telegram are familiar interaction models.

Product implications (adopted):
- Khmer + English from day one; language switch persisted in a cookie.
- Mobile-first layouts, single-column search results, no decorative video/3D or heavy animation in search/listing flows.
- Server-rendered pages, compressed generated images, lazy loading below the fold.
- Telegram-style expectations for responsiveness: lead notifications, saved searches, and a clear "message seller" path.

---

## 2. Market sizing — what we know, what we assume

We do **not** have a reliable public estimate of annual used-car transactions, average transaction price, or dealer count in Cambodia. We therefore do not present a TAM/SAM/SOM number as fact.

### 2.1 Bottom-up pilot model (all assumptions explicitly labelled)

| Input | Value | Basis |
|---|---|---|
| Light vehicles registered | 847,189 | MPWT/GDLT via Khmer Times, Oct 2024 |
| Share in Phnom Penh metro | **Assumption: 35%** | Urban concentration; not sourced |
| Annual used-turnover rate | **Assumption: 8%** | Emerging-market assumption; not sourced |
| Implied Phnom Penh used transactions / year | ~23,700 | Calculated from the two assumptions above |
| Average transaction price | **Assumption: $18,000** | Between the Atto 3 and Prado examples; not a measured average |
| Implied GMV / year | ~$427m | Calculated |

These are planning assumptions for interviews, not market facts. We will replace them with dealer-reported data during the pilot (see §4).

### 2.2 Why a dealer-first wedge

- Dealers have repeated inventory, staff, and a commercial reason to pay for leads and trust tooling.
- Private sellers are numerous but one-shot; monetising them is harder and support-heavy.
- The dealer dashboard, team roles and audit trail are built; the private-seller flow exists but is deliberately simpler.

---

## 3. Competitive position

**Positioning:** "A marketplace where every listing shows what is verified, what is unverified and what nobody knows yet."

| Capability | Khmer24-style classifieds | Facebook / Telegram | AngkorEV (this build) |
|---|---|---|---|
| Structured car search | Basic | No | Yes (make, model, price, year, mileage, province, fuel, body) |
| Dealer storefront + inventory tools | Paid listings only | No | Yes, multi-tenant dashboards |
| Evidence ledger per car | No | No | Yes: status per check, sources, confidence, limitations |
| Document review by a human | No | No | Yes: pending/verified/rejected with audit trail |
| Duplicate/reused-photo detection | No | No | Yes (hash comparison across platform) |
| Dispute and correction path | No | Report to group admin | Yes: report-level dispute → moderation case |
| Escrow / payments | No (classifieds) | Informal | **No** — deliberately out of scope |
| Khmer + English | Khmer-first | Khmer | Both |

We are **not** claiming to check government accident records, insurer databases, or auction history. That is the gap we will research with partners, not fake.

---

## 4. Open research questions (must be answered before scale)

1. How many used-car transactions happen per year in Phnom Penh, and at what average price? Method: 10–15 dealer interviews + consignment records; do not scrape personal data.
2. Which documents do buyers actually see at transfer, and which are routinely missing? Method: accompany 5 transfers with consent.
3. Will dealers pay $29/month, and for what? Method: paid pilot with 10 dealers; measure conversion from free.
4. What does a "verified document review" cost in staff time? Method: time-track 100 reviews.
5. Do buyers understand the five evidence statuses without training? Method: 5-second test + task-based usability sessions in Khmer.
6. Can any Cambodian registry or insurer legally expose vehicle history to a private platform? Method: formal enquiries with MPWT, insurers; legal counsel memo. **No integration is assumed.**
7. Are competitor escrow claims licensed and insured? Method: ask competitors and NBC; do not copy the claim.

---

## 5. Source log

| # | Source | Date | Used for |
|---|---|---|---|
| 1 | [Khmer Times — EV high-potential sector](https://www.khmertimeskh.com/501600074/ev-a-high-potential-sector-in-cambodia/) | 29 Nov 2024 | Registered vehicle stock; EV breakdown |
| 2 | [AKP — MPWT registers 2,253 EVs](https://www.akp.gov.kh/post/detail/326151) | 15 Jan 2025 | 2024 EV registrations; brands; charging stations |
| 3 | [AKP — 14,534 EVs](https://www.akp.gov.kh/post/detail/366087) | 27 Mar 2026 | EV stock to Feb 2026 |
| 4 | [VietnamPlus — Cambodia EV market](https://en.vietnamplus.vn/cambodia-moves-to-keep-pace-with-growing-ev-market-post350092.vnp) | 14 Aug 2026 | H1 2026 EV registrations |
| 5 | [Cambodge Mag — EV rush](https://www.cambodgemag.com/en/post/cambodia-s-electric-vehicle-rush-accelerates-as-fuel-prices-surge) | 20 Jul 2026 | H1 2026 comparison, fuel-price driver |
| 6 | [US ITA — Cambodia passenger cars guide](https://www.trade.gov/country-commercial-guides/cambodia-passenger-cars-truck-and-automotive-parts) | Page reviewed 2026 | EV ~8% of new market |
| 7 | [UNESCAP — MPWT presentation](https://www.unescap.org/sites/default/d8files/event-documents/2_5Cambodia.pdf) | 2025 | 2030 EV targets |
| 8 | [Khmer Times — new vs used](https://www.khmertimeskh.com/501949266/as-cambodia-moves-to-new-cars-keep-the-used-car-instinct/) | 24 Jul 2026 | 2025 new-car share; Chinese brand share |
| 9 | [Khmer Times — depreciation](https://www.khmertimeskh.com/501991289/what-new-car-depreciation-really-looks-like-in-cambodia/) | 6 Aug 2026 | No residual guide; Atto 3 price spread |
| 10 | [Khmer24 cars](https://www.khmer24.com/c-cars-and-vehicles) | Accessed 20 Oct 2026 | Existing classifieds behaviour |
| 11 | [Tracxn — Khmer24](https://tracxn.com/d/companies/khmer24/__AfdE9L7lONFa7DzeMsAfzObMdU90YLe6Otc_KaFgoJM) | 3 Sep 2026 | Founded 2009; competitor list |
| 12 | [Similarweb — Khmer24 competitors](https://www.similarweb.com/ja/website/khmer24.com/competitors/) | Aug 2026 | Car-specific competitor names |
| 13 | [DG Motors — cheapest used cars](https://dgmotorscar.com/blog/cheapest-used-cars-in-cambodia/) | 12 Dec 2025 | Liberty Carz marketing claims (not verified) |
| 14 | [Khmer Times — social media](https://www.khmertimeskh.com/501683396/over-72-of-cambodians-active-on-social-media-platforms/) | 14 May 2025 | Facebook reach |
| 15 | [StatCounter — social media Cambodia](https://gs.statcounter.com/social-media-stats/all/cambodia) | Sep 2026 | Facebook share |
| 16 | [Cambodia Digital Economy — digital landscape](https://digitaleconomy.gov.kh/en/supporting-sector/digital-landscape) | 2025 data | Internet and mobile penetration |
| 17 | [Freedom House — Freedom on the Net 2022](https://freedomhouse.org/country/cambodia/freedom-net/2022) | 2022 | Historical mobile speed caution |
