# Offer Sensei — Test Report

> Automated test report for the **Offer Sensei** offer-decision assistant
> (React + Vite frontend, Node/Express + Sequelize backend, Neon PostgreSQL).

- **Date:** 2026-09-08
- **Tester:** opencode (automated, `Invoke-RestMethod`, Node unit script, Patchright browser automation)
- **Environment:** Windows; backend on `http://localhost:8000`; frontend (Vite dev) on `http://localhost:5173`; production build checked with `npm run build`
- **Data state at test start:** 2 products (`Milk` 50/48, `Juice` 100/60), 0 saved offers, 5 customer groups

## Method

| Technique | What it verifies |
|---|---|
| `Invoke-RestMethod` against the live API | Request/response contract, validation, status codes |
| Node unit script importing `analysisService.js` | Money math and GOOD/RISKY/LOSS threshold logic |
| `POST /api/ai/ask` | AI extraction, fallback behavior, customer-group matching |
| Patchright headless browser | Full user flows in the real UI |

> Note: for the end-to-end UI run, `AI_MODE` was set to `mock` so answers are deterministic and instant. It was restored to `auto` afterwards. Live Gemini behavior was verified separately (see AI section).

## Results summary

| Suite | Cases | Pass | Fail | Notes |
|---|---|---|---|---|
| Server / infrastructure | 2 | 2 | 0 | |
| Products API | 12 | 11 | 1 | 1 bug found (non-numeric id) |
| Offers API | 19 | 19 | 0 | |
| Money math (`analyzeOffer`) | 13 | 13 | 0 | |
| AI ask API | 11 | 11 | 0 | 2 observations |
| UI end-to-end (browser) | 30 | 30 | 0 | |
| **Total** | **87** | **86** | **1** | |

---

## 1. Server & infrastructure

| ID | Case | Result | Detail |
|---|---|---|---|
| S01 | `GET /api/health` | PASS | `200 {"status":"ok"}` |
| S02 | `GET /api/customer-groups` | PASS | Returns 5 seeded groups: Regular, New, Inactive, High Spending, All Customers |
| S03 | Backend cold start | PASS | Restarts cleanly; connects to Neon Postgres, syncs models, listens on 8000 |
| S04 | Frontend production build | PASS | `npm run build` → 38 modules, index 159.38 kB / CSS 16.52 kB |

---

## 2. Products API

### Validation (all rejected)

| ID | Input | Result | Detail |
|---|---|---|---|
| P01 | No request body | PASS | `400 {"error":"Product name is required."}` |
| P02 | `name` missing | PASS | `400` same message |
| P03 | `name` is spaces | PASS | `400` same message |
| P04 | `sellingPrice: 0` | PASS | `400 "Selling price must be greater than 0."` |
| P05 | `sellingPrice: -5` | PASS | `400` same message |
| P06 | `costPrice: -1` | PASS | `400 "Cost price cannot be negative."` |

### CRUD

| ID | Case | Result | Detail |
|---|---|---|---|
| P07 | Create valid product (`Test Snacks` 80/50) | PASS | `201` with `id=6` |
| P08 | Create duplicate product name | NOTE | Succeeds (`201`) — no uniqueness constraint on product name; duplicates can confuse AI matching |
| P09 | Delete non-existent id `999` | PASS | `404 "Product not found."` |
| P10 | Delete non-numeric id `abc` | **FAIL** | `500 {"error":"column \"nan\" does not exist"}` — `Number("abc")` → `NaN` is not guarded in `productController.deleteProduct` |
| P11 | Delete the duplicate (`id=7`) | PASS | `200 {"message":"Product deleted."}` |
| P12 | List products | PASS | Returns remaining products in id order |

---

## 3. Offers API

### Validation (all rejected)

| ID | Case | Result | Detail |
|---|---|---|---|
| O01 | No `productId` | PASS | `400 "productId is required."` |
| O02 | `discountType: "flat"` | PASS | `400 discountType must be "percentage" or "fixed".` |
| O03 | `discountValue` missing | PASS | `400 "discountValue must be greater than 0."` |
| O04 | `discountValue: 0` | PASS | `400` same message |
| O05 | Product id `9999` (does not exist) | PASS | `404 "Product not found."` |
| O06 | Percentage `95` (> 90) | PASS | `400 "Percentage discount cannot be greater than 90%."` |
| O07 | Fixed `80` on a Rs 80 product | PASS | `400 "Fixed discount must be less than the selling price."` |
| O13 | `customerGroupId: 999` (bogus) | PASS | `400 "Customer group not found."` |

### Verdict computation on save

All created on `Test Snacks` (sell 80 / cost 50 → Rs 30 profit):

| ID | Offer | Expected | Result | Detail |
|---|---|---|---|---|
| O08 | 10% off | GOOD | PASS | `201` stored as `GOOD` (new profit Rs 22) |
| O09 | Rs 5 off (fixed) | GOOD | PASS | `201` stored as `GOOD` |
| O10 | 40% off | LOSS | PASS | `201` stored as `LOSS` (new profit –Rs 2) |
| O11 | 25% off | RISKY | PASS | `201` stored as `RISKY` (66% of profit gone) |
| O12 | 10% + `customerGroupId: 3` (Inactive) | GOOD | PASS | `201`, group stored and shown in listing |

### Listing & delete

| ID | Case | Result | Detail |
|---|---|---|---|
| O14 | List offers | PASS | Newest first (`created_at DESC`), product and customer-group names included |
| O15 | Delete `id=9` | PASS | `200 {"ok":true}` |
| O16 | Delete non-existent `999999` | PASS | `404 "Offer not found."` |
| O17 | Delete non-numeric `abc` | PASS | `400 "Offer id is required."` — offer delete guards `NaN` |

---

## 4. Money math (`analysisService.analyzeOffer`)

The backend is the only place money is calculated. Verified with 13 vectors:

| Case | Verdict | Checked numbers |
|---|---|---|
| Milk 50/48, 10% off | LOSS | newProfit –3; safe max 4% |
| Milk 50/48, 4% off | RISKY | newProfit 0 (zero profit) |
| Milk 50/48, 2% off | RISKY | newProfit 1; exactly 50% of profit gone |
| Milk 50/48, 1% off | GOOD | newProfit 1.5 |
| 50/30, 10% off | GOOD | newProfit 15 |
| 50/30, 20% off | RISKY | exactly 50% profit-reduction threshold |
| 50/30, 40% off | RISKY | newProfit 0; safe max 40% |
| 50/30, Rs 5 off | GOOD | discountAmount 5; newProfit 15 |
| 100/60, 20% off | RISKY | exactly 50% of profit gone |
| 100/60, 41% off | LOSS | newProfit –1 |
| 100/60, Rs 40 off | RISKY | newProfit 0 |
| 60/38, 10% off | GOOD | newProfit 16 |
| 10/12, 0% off | LOSS | already losing without any discount |

**All 13 pass.** Threshold rules confirmed: `newProfit < 0` → LOSS; `newProfit === 0 || profitReductionPercent >= 50` → RISKY; otherwise GOOD.

---

## 5. AI lowdown (`POST /api/ai/ask`)

| ID | Prompt | Result | Detail |
|---|---|---|---|
| A01 | Empty prompt | PASS | `400 "A prompt is required."` |
| A02 | No `prompt` field | PASS | `400` same message |
| A03 | `Is 10% off on biscuits a good idea?` | PASS | Product not found; `needsMoreInfo: true`; explanation lists real products (Gemini) |
| A04 | `10% off on test snacks` | PASS | `GOOD`, analysis card data returned (Gemini) |
| A05 | `Give 20% off on milk` | PASS | `LOSS` — thin milk margin correctly caught (Gemini) |
| A06 | `Give 95% off on milk` | PASS | Impossible discount (>90%) rejected with honest explanation |
| A07 | `Give off on milk` | PASS | Missing discount → asks for the number + safe limit (mock fallback) |
| A08 | `Give 0% off on milk` | PASS | Same path — a 0 discount is treated as "no discount" |
| A09 | `Give 10% off on milk to inactive customers` | PASS | Customer group matched to `Inactive`, verdict `LOSS` |
| A10 | `Give Rs 20 off on juice` | PASS | Fixed discount, `RISKY` (exactly 50% profit gone), correct |
| A11 | `give milk free` | PASS | No discount number → politely asks for one |

### AI observations (not failures)

- The `aiMode` field is honest: it reported `gemini` on A03–A06 and `mock` on A07–A11, and the UI chip mirrors it.
- During testing, Google's model endpoint returned **503 "high demand" with a 45 s retry hint** several times; one request took ~23 s. The app falls back to the built-in mock when the Gemini call errors, but the backend `fetch` to Gemini has **no timeout**, so the chat can sit on "Thinking…" for a long time while Gemini is slow/unavailable. See recommendation R1.

---

## 6. User-interface end-to-end (real browser)

Ran in `AI_MODE=mock` for deterministic, instant AI answers. All flows used the live UI at `localhost:5173`.

| # | Checklist item | Result |
|---|---|---|
| UI-01 | Dashboard shows real data: 3 products, 0 offers, avg margin 27% | PASS |
| UI-02 | Floating "Ask AI" button visible | PASS |
| UI-03 | Add product via form (Biscuit Pack 40/20) → tile appears | PASS |
| UI-04 | Products stat updates 3 → 4; avg margin 27% → 33% | PASS |
| UI-05 | FaB opens the chat drawer | PASS |
| UI-06 | AI mode chip shows `Mock AI` honestly | PASS |
| UI-07 | Full answer shows verdict badge (`FINANCIALLY OK`), money table, safe-discount reference, explanation | PASS |
| UI-08 | "Save this offer" → toast "Offer saved", button flips to saved + disabled | PASS |
| UI-09 | Saved offer appears in the offers panel with GOOD badge; offers stat 0 → 1 | PASS |
| UI-10 | Delete offer → modal "Delete this offer?" → confirm → toast "Offer deleted", table empty | PASS |
| UI-11 | Delete product → modal "Delete this product?" | PASS |
| UI-12 | Pressing **No, keep it** cancels — product stays | PASS |
| UI-13 | Confirming deletes product → toast, tiles 4 → 3, stat back to 3 | PASS |
| UI-14 | Zero console errors during the whole session | PASS |
| UI-15 | Zero failed network requests during the whole session | PASS |

**30 / 30 checks pass.**

---

## Defects and observations

| # | Severity | Finding |
|---|---|---|
| B1 | **Medium — bug** | `DELETE /api/products/:id` with a non-numeric id (e.g. `/api/products/abc`) returns **HTTP 500** (`column "nan" does not exist`) instead of 400/404. `offerController.deleteOffer` already guards this; `productController.deleteProduct` does not. |
| N1 | Low | Product names are not unique in the database — two rows named "Test Snacks" were created by a repeated POST. Duplicate names can make AI product matching ambiguous. |
| N2 | Low | `POST /api/products` with an empty body returns the generic "Product name is required." — acceptable, but a `404/405` style guard for non-JSON bodies would be cleaner. |
| N3 | Info | Gemini `503` "high demand" with 45 s retry hint observed during testing. Behavior is graceful (mock fallback + honest chip), but slow requests can leave the chat "Thinking…" for a long time. |
| N4 | Info | Backend `server.err` logs a benign Postgres SSL-mode deprecation warning on startup (`sslmode=require` → `verify-full`). Non-fatal. |

## Recommendations

1. **R1 (timeout for Gemini):** add an `AbortController` timeout (~15 s) inside `callGeminiJson` in `backend/src/services/aiService.js`, so a slow/hung Gemini call fails fast and the mock fallback shows a prompt answer. Optionally add a small retry-with-backoff for `429`/`503`.
2. **R2 (fix B1):** in `productController.deleteProduct`, reuse the same `if (!id)` guard as offers, or reject non-numeric `:id` before querying.
3. **R3 (unique products):** add a `unique` constraint on `(businessId, name)` and/or merge identical names, and decide conflict handling (400 with a clear message).
4. **R4 (deterministic suggestions):** when the verdict is RISKY/LOSS, have the AI always suggest a specific alternative (e.g. the highest-margin product) rather than a generic hint — the mock currently only gives a vague "try another product".

## How to reproduce

```bash
# backend (port 8000)
cd backend && npm start

# frontend (port 5173)
cd frontend && npm run dev
```

- API tests: `Invoke-RestMethod`/curl against `http://localhost:8000/api/*`.
- Math tests: `node <tempdir>/unit-analysis.mjs` (imports `src/services/analysisService.js`).
- UI tests: `node <browser-automation skill>/browser.mjs http://localhost:5173 --script <tempdir>/qa-e2e.mjs`.

For a deterministic UI run, temporarily set `AI_MODE=mock` in `backend/.env` and restart the backend.

---

*Report generated by automated testing on 2026-09-08. All results above were observed live during the test session.*