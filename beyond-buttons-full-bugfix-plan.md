# Beyond Buttons — Full Bug Fix Plan (for AI Coding Agent)

## How to work through this
Fix issues **in the phase order below, one phase at a time.** After finishing each phase:
1. Test the specific flows listed under "Verify" for that phase.
2. Report back in plain language: what was actually broken (root cause), what you changed, and confirmation that the Verify steps pass.
3. Do NOT move to the next phase until the current phase is confirmed working.
4. Do not silently swallow errors or add generic try/catch blocks to hide a symptom — fix the underlying cause. If a fix isn't fully possible without a decision from me (e.g. choosing which cart system to keep), stop and ask instead of guessing.

---

## PHASE 0 — Critical, blocks all checkout (do these first, together)

### 0.1 Dual Cart Implementation (breaks checkout for every user)
**Files:** `lib/shop/commerce.js`, `lib/shop/ShopContext.jsx`, `app/layout.js`, and any component using `useCart()` or `useShop()`.

**Problem:** Two separate, unsynced cart systems exist side by side — `commerce.js` (modern, `useSyncExternalStore`, localStorage key `bb-cart-v1`) and `ShopContext.jsx` (legacy, `useState`, localStorage key `bb-cart`). Product pages add items via one system while the cart view reads from the other, so items added to cart never appear.

**Fix:**
- Pick ONE system as the single source of truth — use `commerce.js` (the modern implementation) and remove `ShopContext.jsx` entirely.
- Migrate every component currently importing `useShop()` (including wishlist usage) to the `commerce.js` equivalents.
- Search the whole codebase for any remaining import of `ShopContext` and remove it.
- Do not leave both systems running "just in case" — that's what caused this bug.

### 0.2 Products Not Seeded to MongoDB (false "out of stock")
**Files:** `app/api/orders/route.js`, `data/products/products.json`.

**Problem:** Product/stock data only exists in the JSON file — MongoDB has no product documents (or stale ones), so any stock-validation query against the DB returns nothing/zero, and every order fails as "out of stock" or "product not found" regardless of real stock.

**Fix:**
- Write (or run, if it already exists) a seed script that loads `products.json` into MongoDB via the Mongoose `ProductModel`, matching the schema fields exactly (field names, nested variant/size structure).
- Confirm that the admin panel's product edits also write to this same MongoDB collection — there should be one source of truth for product/stock data, not JSON file + DB as two separate stores.
- After seeding, query the DB directly (or log it) to confirm all products and their per-size stock counts are actually present before testing checkout.

### 0.3 Razorpay Dummy Keys in .env
**Files:** `.env`, `.env.example`.

**Problem:** `.env` currently has placeholder/dummy values (`rzp_test_dummy`, `test_secret`, `test_webhook_secret`) instead of real Razorpay test-mode credentials.

**Fix:**
- Replace `RAZORPAY_KEY_ID`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` in `.env` with the real test-mode values from the Razorpay dashboard.
- Fully restart the dev server after editing `.env` (hot reload does not pick up new env vars).
- Confirm no extra whitespace/quotes got copied into the values.

**Verify (Phase 0):** Add an item to cart from a product page → it appears in the cart view → place a COD order for an in-stock size → order succeeds and stock decrements → place an online order → Razorpay opens without "Authentication failed" and completes in test mode.

---

## PHASE 1 — High priority (security & correctness)

### 1.1 Admin Middleware Using Node.js `crypto` in Edge Runtime
**Files:** `middleware.js`, `lib/admin/session.js`.
Confirm the constant is inlined in middleware (not imported from a module that pulls in Node `crypto`), or switch the relevant logic to the Web Crypto API so it's Edge-compatible.

### 1.2 Shiprocket Webhook Signature Verification Broken
**File:** `lib/shiprocket/index.js` (`verifyWebhookSignature`).
It currently hashes `JSON.stringify(payload)` instead of the raw request body — signatures will never match. Update the webhook route to pass the raw body string (not the parsed JSON) into the HMAC verification.

### 1.3 Order Stock Decrement Race Condition
**File:** `app/api/orders/route.js`.
Concurrent orders for the same variant can both read the same stock value and both decrement, causing oversell. Use an atomic `$inc` with a condition (e.g. only decrement if `stock >= quantity`) inside the transaction, or optimistic locking, so a second concurrent order correctly fails if stock is now insufficient.

### 1.4 Payment Status Set to "paid" Client-Side Before Verification
**Files:** `lib/shop/commerce.js` (~line 467), `app/api/orders/route.js` (~line 330).
Client-side code sets `paymentStatus: "paid"` for online orders before Razorpay verification even runs. Server already ignores this, but remove the client-side assumption entirely — the client should never claim a payment succeeded; only the Razorpay webhook should set `paymentStatus: "paid"`.

### 1.5 No Rate Limiting on Coupon Validation
**File:** `app/api/coupons/validate/route.js`.
Add rate limiting (per-IP or per-session) to prevent coupon code brute-forcing.

### 1.6 Image Upload Only Checks MIME Type
**File:** `app/api/media/upload/route.js`.
MIME type from the client can be spoofed. Validate actual file signature (magic bytes) server-side before accepting the upload.

**Verify (Phase 1):** Confirm admin login/middleware still works after the Edge fix; trigger a real Shiprocket webhook (or simulate one) and confirm signature now verifies; manually test that two rapid orders for the last unit of a size don't both succeed.

---

## PHASE 2 — Medium priority

- **2.1** Add/confirm proper index usage for admin order pagination with filters (`customerId + createdAt`).
- **2.2** Cart is localStorage-only with no server-side sync — note as a known limitation for now unless you want it addressed this round.
- **2.3** Webhook idempotency check currently compares the wrong signature field — it should dedupe on `paymentId`/`orderId`, not the webhook signature itself.
- **2.4** Add CSRF protection on admin state-changing endpoints (don't rely on `SameSite=Lax` alone).
- **2.5** Add pagination limits to the product search endpoint to prevent unbounded-result DoS.

## PHASE 3 — Low priority / tech debt (only after everything above is verified working)

- **3.1** Deduplicate the order-confirmation email HTML that's currently copy-pasted in two places.
- **3.2** Replace hardcoded email image URLs with a configurable base URL env var.
- **3.3** Remove the hardcoded weak fallback admin session secret (`"bb-admin-insecure-dev-secret"`) — fail loudly instead if no real secret is set.
- **3.4** Fix inconsistent error handling where validation errors return 500 instead of 400/422.
- **3.5** Replace the 8-digit-timestamp order number generation with something collision-resistant (e.g. include a random suffix or a DB-guaranteed sequence).

---

## Ground rules for the agent
- Work phase by phase, report after each phase, wait for my confirmation before continuing.
- Every fix must address the actual root cause described above, not just make the visible error message go away.
- If fixing one issue requires a decision I haven't made (e.g. which cart implementation to standardize on, whether to fully remove `ShopContext.jsx` or keep any part of it for a reason I'm not aware of), stop and ask before proceeding.
- After each phase, explicitly state which files were changed and why.
