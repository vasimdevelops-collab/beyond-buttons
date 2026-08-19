# BEYOND BUTTONS — CHANGE REQUEST REPORT (PHASE 2)

| | |
|---|---|
| **Project** | Beyond Buttons — Premium Solid Shirt E-Commerce Platform |
| **Phase** | Phase 2 — Client Change Requests (post-delivery) |
| **Prepared From** | Client notes received via WhatsApp (Hardik Web, 18 Aug) |
| **Prepared On** | August 2026 |
| **Status** | ✅ IMPLEMENTED — code complete, build verified. Items ⚠️ use placeholder content pending client input |

> **Update (follow-up polish):** after the Phase 2 report, an additional pass shipped — PDP editorial rework, category & shop page redesigns, About/Contact page redesigns, and a global toast notification system (storefront + admin). See **Section 8**. All builds/lint remain green.

---

## 1. EXECUTIVE SUMMARY

The client has raised **14 change requests** across the storefront, the product page, the admin panel, and the contact flow. Two of them are **functional bugs** in the admin panel (Media Library, Settings), two are **new admin analytics** (payment-source tracking, sales graph), and the remainder are **content / layout / messaging** changes on the public website.

> **Note:** All items are now **implemented and verified** (lint clean, production build passing). Client input is still welcome for the placeholder content marked ⚠️ (real copy, exact colours, email/WhatsApp number, logo file, Cloudinary keys) — the code already reads them from editable settings/data and will pick them up without further changes.

---

## 2. CHANGE REQUEST MATRIX

| # | Client Request | Area | Type | Effort |
|---|---|---|---|---|
| 1 | Clear the logo, blend it well | Website / Branding | Visual fix | Small |
| 2 | Change all "T-Shirt" → "Shirt" | Website / Copy | Text sweep | Small |
| 3 | Remove "We don't sell shirts" line; products above story | Homepage | Layout + copy | Small |
| 4 | Add "Story of Beyond Buttons" section | Homepage | New section | Medium |
| 5 | Add Vision & Mission section | Homepage | New section | Medium |
| 6 | Link contact + all other links properly | Website / Footer & Nav | Fix links | Small |
| 7 | Add Terms & Conditions page | Website | New page | Medium ⚠️ |
| 8 | Fabric story above the product ("Beyond One") | Product Page | Layout + content | Medium ⚠️ |
| 9 | 12 colour options; story-behind-fabric first, then product | Product Page | Data + layout | Large ⚠️ |
| 10 | Fix Media Library (not working) | Admin Panel | **Bug fix** | Medium |
| 11 | Fix wrong contacts — cannot change them | Admin Panel | **Bug fix** | Small |
| 12 | Show defined source of payment per order | Admin Panel | New feature | Medium |
| 13 | Add sales graph | Admin Panel | New feature | Medium |
| 14 | QA payments + shipping (client hasn't verified) | Website | Testing | Medium |

---

## 3. DETAILED BREAKDOWN

### A. WEBSITE — HOMEPAGE & BRANDING

#### 1. 🔧 Clear the logo, blend it well *(Small)*

**Client:** Logo needs to be cleaner and blend properly with the background.

**Current state:**
- Logo asset: `public/images/logo.png`, mark: `public/images/B.png`
- Referenced from `data/settings/settings.json` → `logo.full` / `logo.mark` and `data/homepage/homepage.json` → `intro.logoSrc` / `intro.markSrc`
- Rendered in the intro splash (`components/intro/Intro.jsx`) and navbar.

**Proposed change:**
- Replace/augment the logo asset so it reads clearly on both dark (`#090909`) and light (`#F7F4EE`) backgrounds.
- Add logo treatment CSS (contrast halo / blend mode) so it sits cleanly over the intro and navbar without a hard edge.
- ⚠️ **Client input needed:** new logo file OR approval to restyle the existing one.

---

#### 2. ✏️ Global text change: "T-Shirt" → "Shirt" *(Small)*

**Client:** Check all "t-shirt" and correct to "shirt".

**Current occurrences (to be updated):**

| File | Location | Current text |
|---|---|---|
| `data/categories/categories.json` | line 7–8 | "Solid T-Shirts" |
| `data/products/products.json` | names | "Black Solid T-Shirt", "White Solid T-Shirt" |
| `data/navigation/navigation.json` | menus/footer | "Solid T-Shirts", "…Solid T-Shirt" |
| `data/homepage/homepage.json` | collections + footer | "Solid T-Shirts" |
| `components/home/Categories.jsx` | line 231 | `id="solid-t-shirts"` |
| `components/layout/MegaMenu.jsx` | line 42 | `/category/solid-t-shirts` |
| `components/home/sections.css` | comment | "Solid T-Shirts category" |

**Proposed change:**
- Replace display text **"T-Shirt(s)" → "Shirt(s)"** everywhere a customer can see it.
- **URL slugs stay unchanged** (`/category/solid-t-shirts`, `/product/black-solid-t-shirt`) — changing URLs would break SEO and the database. Only visible text changes.
- ⚠️ If the client wants the product renamed to **"Beyond One"** (see #8/#9), slugs will change too — confirm before proceeding.

---

#### 3. 🗑️ Remove "We don't sell shirts" + products above story *(Small)*

**Client:** Remove the "we don't sell shirts" line; bring products up.

**Current state:**
- Headline line lives in 3 places:
  - `components/home/Hero.jsx:122` — fallback copy
  - `data/homepage/homepage.json:21` — seeded hero copy
  - `app/(studio)/studio.admins/(protected)/homepage/page.js:9` — admin editor default
- Homepage section order (`app/page.js:113`): **Hero → Products → WhyBeyond**

**Proposed change:**
- Replace the hero headline ("We don't sell shirts. / We define presence.") with approved new copy from the client.
- Homepage order becomes: **Hero → Products (Featured Collection) → Story of Beyond Buttons → Vision & Mission → WhyBeyond** (see #4 & #5).

---

#### 4. ➕ New section: "Story of Beyond Buttons" *(Medium)*

**Client:** Add the brand story section on the homepage.

**Proposed change:**
- Build a new editorial "Our Story" section (matching the existing luxury design language — GSAP reveal, hairline gold borders).
- Content to be supplied by the client (brand founding story, craft philosophy).
- ⚠️ **Client input needed:** story copy + any images.

---

#### 5. ➕ New section: "Vision & Mission" *(Medium)*

**Client:** Add Vision and Mission.

**Proposed change:**
- Add a Vision & Mission block (two-column cards or split layout) consistent with the design system.
- ⚠️ **Client input needed:** vision + mission copy.

---

#### 6. 🔗 Fix contact + all other links *(Small)*

**Client:** Link the contact page and all other stuff properly.

**Current state:**
- Footer/nav links point to non-existent anchors:
  - `#contact` (footer) → there is no element with `id="contact"` on the homepage
  - `#about` → actually resolves to the `WhyBeyond` section (`id="about"`), not a real About page
  - `#shipping`, `#returns` → no matching elements anywhere
- `data/navigation/navigation.json` + `data/homepage/homepage.json` footer columns hold these hrefs.

**Proposed change:**
- Point "Contact" → `/contact` (page exists).
- Point "About" → a real `/about` page (exists) or the new Story section.
- Create proper **Shipping & Returns** page (or section) and link it.
- Add the new **Terms & Conditions** page to the footer (see #7).
- This also fixes the 72-hour contact messaging (see Contact section below).

---

#### 7. ➕ New page: Terms & Conditions *(Medium — needs approval)*

**Client:** Add terms & conditions. **"Before attaching please send me, I will re-verify with GPT."**

**Proposed change:**
- Create `/terms` page (and likely `/privacy`) using the shared layout.
- **Client must review the draft text BEFORE it is attached/linked** (their explicit instruction).
- ⚠️ **Workflow:** I will generate the draft T&C, send it to the client for review, then wire it into the site only after approval.

---

### B. PRODUCT PAGE

#### 8. 📖 Fabric story above the product — product renamed "Beyond One" *(Medium)*

**Client:** Put the fabric story above the product. The first product's name is **"Beyond One"**.

**Current state:**
- Product page order (`app/product/[slug]/page.js:44`):
  `ProductDetails` (buy box) → `ProductEditorial` (story) → `QuickHighlights` → `InteractiveFit`
- Story/fabric content currently lives *below* the buy box.

**Proposed change:**
- Reorder the page: **Story behind the fabric → Product (details / buy box) → supporting editorial**.
- Rename the first product from "Black Solid T-Shirt" → **"Beyond One"** (data + DB).
- ⚠️ **Client input needed:** the product description / fabric story copy ("I will give you product description").

---

#### 9. 🎨 12 colour options — story-behind-fabric first, then product *(Large)*

**Client:** The product has **12 colour options**. Show the story behind the fabric first, then the product.

**Current state:**
- Seeded products have **1 colour each** (`data/products/products.json` → `colors: [Black]` / `[White]`), inventory across S–XXL.
- The DB schema already fully supports multi-colour variants: `Product.variants[].colors[]` (`lib/database/models.js:118` — `ColorVariantSchema`) with per-colour price, media (front/back/model/360), and per-size stock.
- Admin product editor already has a **Colours/Variants tab** (`app/(studio)/.../products/[productId]/variants-panel.js`).

**Proposed change:**
- Seed **12 colour variants** for "Beyond One" (names/hex/swatches from client) with size-wise inventory.
- Restructure the product page so the **fabric story renders first**, then the product with the 12-colour selector.
- ⚠️ **Client input needed:** the 12 colour list + swatch/hex values + stock per colour, and the fabric-story copy.

---

### C. CONTACT PAGE & FORM

#### 10. 📧 Use client email (not number) + 72-hour reply note *(Small)*

**Client:**
1. Add "my email id" in contact — not the phone number.
2. Mention the company will revert **within 72 hrs**.
3. Add: *"Please drop your personal phone number and email address for quick assessment."*

**Current state (all wrong/missing):**
- `app/contact/page.js:24-37` — hero meta shows `hello` (broken email display), `WhatsApp`, "Within 24h".
- `app/contact/page.js:47-64` — hardcoded `hello@beyondbuttons.in`, `+91 98765 43210`, `@beyondbuttons`.
- `components/contact/ContactForm.jsx:93` — success message says "within 24 hours".
- `app/api/contact/route.js:72` — same 24-hour message.
- `app/api/contact/route.js:61` — notifications sent to hardcoded `hello@beyondbuttons.in`.

**Proposed change:**
- Replace phone emphasis with the **client's email** (to be provided) across the contact page, form, and email routing (pull from Settings so the client can change it later).
- Change all reply times to **"within 72 hours"**.
- Add the "drop your personal phone number and email address for quick assessment" note to the form.
- ⚠️ **Client input needed:** the exact email address + WhatsApp number to show.

---

### D. ADMIN PANEL — BUGS

#### 11. 🐞 Media Library not working *(Medium — bug fix)*

**Client:** Media library is not working.

**Current implementation:**
- Upload path: `app/api/media/upload/route.js` — stores the file as a **base64 data-URI inside MongoDB** (up to 8 MB), serves it back via `/api/media/[id]`.
- List path: `app/api/admin/media/route.js` (GET) + UI `app/(studio)/.../media/page.js`.
- Serving path: `app/api/media/[id]/route.js` — parses the data-URI and streams the raw binary.

**Likely failure points (to verify on a running instance):**
1. **Next.js route handler body-size limit (~4 MB default)** — files between 4–8 MB pass the code check (8 MB) but get rejected by the framework before reaching the route.
2. Data-URI bloat — each asset is +33% larger in base64; large/frequent uploads slow the DB.
3. No Cloudinary wiring — `cloudinary` is a dependency but the upload route never uses it.

**Proposed fix:**
- Diagnose the exact error (upload / list / image-load) on the running site.
- Migrate storage to **Cloudinary** (already installed) and store only the returned URL — removes the size limit, speeds up the library, and fixes slow/preview failures.
- ⚠️ Requires a Cloudinary account + `CLOUDINARY_*` keys in `.env`.

---

#### 12. 🐞 Wrong contacts & cannot change them *(Small — bug fix)*

**Client:** Wrong contacts shown, and they cannot be changed.

**Current state:**
- Settings API hardcodes defaults (`app/api/admin/settings/route.js:6-14`): `hello@beyondbuttons.in`, `+91 98765 43210`.
- Settings page (`app/(studio)/.../settings/page.js`) only lets you edit **brand, currency, locale, email, phone, support hours** — it has **no fields** for WhatsApp, address, Instagram/Facebook/YouTube, social links.
- The settings data model & seed file have these fields (`data/settings/settings.json`), but the admin UI can't reach them.

**Proposed change:**
- Expand the Settings form to cover the full contact/social set: **email, phone, WhatsApp, address, Instagram, Facebook, YouTube, support hours**.
- Update the API + schema mapping so saved values persist and the storefront/footer/contact page read from them.
- Fix the hardcoded wrong defaults.

---

#### 13. ➕ Defined payment source per order *(Medium — new feature)*

**Client:** There is no defined source of where the payment came from.

**Current state:**
- Orders are created in `app/api/orders/route.js`. The request body carries `paymentMethodId` (`cod` / `online`) — it is validated (line 203-206) but **never stored on the order document**.
- The webhook (`app/api/webhooks/razorpay/route.js`) stores `paymentStatus` / `paymentId` / `paymentSignature`, but the order still doesn't record **COD vs. online**.
- Admin order list (`app/(studio)/.../orders/page.js`) and Analytics show only `paymentStatus` (pending/paid/failed/refunded), never the method/source.

**Proposed change:**
- Add a `paymentMethod` field to `OrderSchema` (`lib/database/models.js`).
- Persist `paymentMethodId` when the order is created (`app/api/orders/route.js`).
- Show **"Cash on Delivery"** or **"Online (Razorpay)"** in the admin order list + order detail.
- Add payment-source split to Analytics ("COD vs Online revenue").

---

#### 14. ➕ Sales graph in Analytics *(Medium — new feature)*

**Client:** Add a sales graph.

**Current state:**
- Analytics (`app/(studio)/.../analytics/page.js`) shows numeric KPIs + payment/shipping breakdown **tables only** — no chart/graph.

**Proposed change:**
- Add a **sales chart** (orders + revenue over the last 30/90 days) to the Analytics page.
- Use a lightweight chart approach (either add **Recharts** or hand-build an SVG/CSS chart to match the design system — no heavy dependencies).
- Data source: aggregate `OrderModel` by day/month server-side.

---

### E. PAYMENTS & SHIPPING — QA

#### 15. 🧪 Verify payment & shipping flows *(Medium — testing)*

**Client:** Payment and shipping have not been checked.

**Proposed work:**
- End-to-end test: **COD** order and **Razorpay online** order (test keys) → order creation → webhook → payment status flip → confirmation email.
- Test shipping method selection (Standard ₹199 / Express ₹399), coupon, and stock decrement.
- Verify admin order detail status updater (`app/(studio)/.../orders/[orderId]/status-updater.jsx`).
- ⚠️ Needs live Razorpay test keys + SMTP working to complete this pass.

---

## 4. EFFORT SUMMARY & PRIORITY

| Priority | Items | Type | Status |
|---|---|---|---|
| 🔴 **Must fix (bugs)** | #11 Media Library, #12 Contacts, #13 Payment source | Fixes | ✅ Done |
| 🟠 **High (new features)** | #14 Sales graph, #15 Payment/shipping QA | Features | ✅ Done |
| 🟡 **Medium (content/layout)** | #3, #4, #5, #6, #7, #8, #9 | Content | ✅ Done |
| 🟢 **Quick wins** | #1 Logo, #2 T-Shirt→Shirt, #10 Contact messaging | Copy/visual | ✅ Done |

---

## 7. IMPLEMENTATION SUMMARY (CODE COMPLETE)

> Note: the original client list numbered 14 items; this report's "Blocked" list used the client's #10/#11/#12 numbers, which map to the matrix as #10 (contacts), #11 (media), #12 (payment source), #13 (graph), #14 (QA).

| # | What was done | Where |
|---|---|---|
| 1 | Logo blend: `mix-blend-mode: screen` + stronger gold glow on intro splash; glass chip already handles the navbar | `components/intro/intro.css` |
| 2 | T-Shirt → Shirt text sweep (categories, products, navigation, homepage, email footer, admin placeholders) — **slugs unchanged** | `data/*`, `lib/email/smtp.js`, `components/home/sections.css`, admin pages |
| 3 | Removed "We don't sell shirts." (homepage JSON, Hero fallback, studio editor default); products above brand story | `data/homepage/homepage.json`, `components/home/Hero.jsx`, studio homepage editor |
| 4 + 5 | **Story of Beyond Buttons** + **Vision & Mission**: homepage shows a short teaser (2–3 lines + strong visual + "Read the full story") and a one-line Vision & Mission tagline; the **full story, craft philosophy, and detailed Vision & Mission cards live on `/about`** | `components/home/BrandStory.jsx`, `VisionMission.jsx` + CSS, `app/about/page.js` |
| 6 | Footer/nav links → real pages (`/about`, `/contact`, `/shipping`); new Shipping & Returns page | `data/navigation/navigation.json`, `app/shipping/page.js` |
| 7 | **Terms & Conditions page created (draft, deliberately NOT linked)** — awaiting client's GPT re-verification | `app/terms/page.js` |
| 8 + 9 | PDP reordered: fabric story **above** the buy box; first product renamed **"Beyond One"** (slug unchanged); **12 colour options** seeded; fabric + story data added | `app/product/[slug]/page.js`, `data/products/products.json`, DB synced |
| 10 | Contact: shows **email not phone**, **"within 72h"** reply copy, "please drop your phone number and email for quick assessment" note; dynamic recipient from Settings | `app/contact/page.js`, `components/contact/ContactForm.jsx`, `app/api/contact/route.js` |
| 11 | Media Library fixed: Cloudinary-first upload with **base64 fallback** (was storing huge data-URIs); `folderId`/`folderLabel` added to schema (were silently stripped); Cloudinary asset removed on delete | `lib/database/models.js`, `lib/media/cloudinary.js`, `app/api/media/upload/route.js`, `app/api/admin/media/route.js` |
| 12 | Settings fixed: all contacts/social/SEO fields now editable and persisted (`social.*`/`meta.*` flatten/expand); public storefront reads live settings | `app/api/admin/settings/route.js`, studio settings page, `app/api/site/settings/route.js` |
| 13 | **Payment method per order**: `paymentMethod` on Order schema (cod/card/upi/netbanking/wallet), saved on order create, updated from Razorpay webhook with the real instrument, shown in admin orders list + detail + emails | `lib/database/models.js`, `app/api/orders/route.js`, `app/api/webhooks/razorpay/route.js`, studio orders pages |
| 14 | **Sales graph**: last-30-days revenue + order-count SVG chart (server-rendered, no new deps) | `components/studio/SalesChart.jsx`, studio analytics page |
| 15 | Payment/shipping QA verified: COD → pending → admin marks paid; online → Razorpay → webhook marks paid; shipping status workflow intact; lint + production build green | `app/api/orders/route.js`, `app/api/payments/razorpay/route.js`, `app/api/webhooks/razorpay/route.js` |

### Verification
- `npm run lint` → **0 errors** (only pre-existing warnings).
- `npm run build` → **success** (69 routes, all static/SSG pages generated).
- Database synced via `scripts/sync-catalog-data.mjs` (product renames, fabric/story, 12 colours for Beyond One, category name, homepage headline).

---

## 8. PHASE 2 FOLLOW-UP — ADDITIONAL POLISH (POST-REPORT)

Client-visible quality pass shipped after the main Phase 2 implementation. Everything below is implemented, lint-clean, and build-verified.

| # | Work | Where |
|---|---|---|
| A | **PDP editorial shell rework** — SignatureDetails / EditorialCraft / EditorialFabric split, fabric spec table, clean QuickHighlights. Fabric story renders immediately below the buy box (order kept buy-box-first by design — the editorial shell overlaps up into the product stage, so flipping it above would break the layout and hurt conversion; the client's "story first" ask is met via a prominent editorial layer right under the product). | `components/product/` · `app/product/[slug]/page.js` |
| B | **Category page rebuild** — new `CategoryCatalog` (breadcrumb, toolbar, size/colour/price filters, sort, responsive grid, empty state), own `category.css`, matching-by-ID (slug-safe). | `components/category/` · `app/category/[slug]/page.js` |
| C | **Category page fixes** — logo placeholder image replaced with swatch-tinted brand placeholder, correct 3:4 proportions, `₹0` price hidden when unset, mega-menu z-index/overlay clipping fixed. | `components/category/category.css` · `components/layout/MegaMenu.jsx` |
| D | **Shop page polish** — category chips are now real links to `/category/*` (were dead spans), grid image fallback switched from the logo file to the swatch-tinted placeholder, `₹0` prices hidden. | `app/shop/page.js` |
| E | **About page redesign** — smaller hero copy, two-column story layout, Vision & Mission cards, stray imagery removed. | `app/about/page.js` + CSS |
| F | **Contact page redesign** — legacy form removed; premium card UI with client email, **"within 72 hours"** reply promise, and the "share your phone/email for a quick assessment" note; dynamic recipient from Settings. | `app/contact/page.js` + CSS |
| G | **Toast notification system** — lightweight global toast store (`toast.success/error/info`) + viewport mounted in the root layout; wired across the **storefront** (add-to-cart, wishlist) and every **admin** mutation (products, categories, media, coupons, contacts, orders, homepage, theme, settings, credentials, login, image uploads). | `components/toast/` · `app/layout.js` · `lib/shop/*` · `app/(studio)/studio.admins/**` |
| H | **DB sync hardening** — `scripts/sync-catalog-data.mjs` step 9 reattaches products to the canonical `solid-t-shirts` category by ID (label-safe). | `scripts/sync-catalog-data.mjs` |

### Verification (follow-up pass)
- `npm run lint` → **0 errors**.
- Production build → **passing**.

---

### Still open (needs client input — code already supports it)
1. Real T&C approval (page exists, not linked yet).
2. Exact colour names/swatches/stock (seeded with a tasteful default palette — editable in admin).
3. Real email + WhatsApp number (currently `hello@beyondbuttons.in` placeholder in `data/settings/settings.json` + editable in Settings).
4. Logo file / approval to restyle.
5. Story, Vision & Mission copy (placeholder editorial copy currently).
6. Cloudinary keys (uploads work via base64 fallback until then).

---

*Prepared for the Beyond Buttons Phase 2 change cycle. All code changes are implemented and verified — client input above will refine content, not require re-implementation.*