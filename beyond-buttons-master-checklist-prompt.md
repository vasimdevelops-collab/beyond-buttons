# Beyond Buttons — Master Checklist Prompt (Verify + Implement, Not Just Plan)

## CRITICAL RULE — read this first
For every item below: **investigate the current code, then actually implement/fix it by editing the files.** Do NOT respond with only a plan, thoughts, or a description of what you *would* do. If you catch yourself writing an explanation of an approach without having made any file edit yet, stop and go back and actually make the edit. At the end of each item, state clearly: what you found (already working / missing / broken), what file(s) you changed, and how you verified it now works.

Go through the items **one at a time, in order**. After each item, briefly report status before moving to the next one.

---

## Item 1 — Stock Auto-Decrement on Purchase

**Check:** When a customer completes an order (both COD and online/Razorpay payment), does the ordered quantity actually get subtracted from that product/size's stock count in the database? Confirm this by tracing the order-creation code path end to end — do not assume it works just because no error is thrown.

**If it's missing or broken:** Implement it properly:
- On successful order creation, decrement the stock for the exact color + size ordered by the ordered quantity, using an atomic database update (not a read-then-write pattern, which can cause overselling under concurrent orders).
- This must happen for both payment methods — COD orders (decrement immediately on order placement) and online orders (decrement only after payment is confirmed via the Razorpay webhook, not before).
- If an order is cancelled or fails after stock was already decremented, make sure stock is restored (only relevant if that flow exists).

**Verify:** Place a real test order for a known stock count (e.g. a size with 10 in stock), confirm the admin panel now shows 9, and confirm this reflects on the storefront too.

---

## Item 2 — Out-of-Stock Messaging

**Check:** When a product size actually has 0 stock, what does the customer currently see/experience — on the product page (size selector) and if they somehow try to check out with it?

**If it's missing or shows a generic/broken message:** Implement clean, clear UX:
- On the product page, a size with 0 stock should be visibly disabled/greyed out in the size selector (not selectable), with a small label like "Out of Stock" next to it — not just a plain error after the fact.
- If checkout is attempted anyway (e.g. stale cart data), show a clear, friendly message such as: *"Sorry, [Product Name] in size [X] just sold out. Please choose another size or remove it from your cart."* — not a raw error code or generic failure message.

**Verify:** Set a real product's size stock to 0, confirm it's disabled on the product page, and confirm the checkout message is clear if triggered.

---

## Item 3 — Search Box UI (Still Broken — Remove Images Entirely This Time)

**Check:** The search results UI is still showing broken/ugly small thumbnail images when clicking the search box — the previous fix attempt did not resolve this properly.

**Requirement — this time, remove images from the search results completely:**
- Do **not** show any product thumbnail/image in the search results dropdown at all — no small images, no broken image placeholders, nothing visual except text.
- Search results should be a clean, simple list: product name and price only, in a plain readable row — no image element in the markup at all for this component (don't just hide it with CSS, remove it from the component so there's nothing that can render broken).
- Keep the dropdown/list container itself simple and minimal (per the earlier simplification requirement) — no heavy box styling, consistent on desktop and mobile.
- Test and confirm visually on both desktop and mobile that no image ever renders in this component.

---

## Item 4 — Wishlist: No Way to Remove an Item

**Check:** Items can be added to the wishlist, but there's currently no button/option to remove an item from the wishlist page.

**Fix:** Add a clear remove action (e.g. an "X" icon, a heart toggle that un-hearts it, or a "Remove" button) on each wishlist item, that actually removes it from the user's wishlist in the database — not just visually hides it client-side.

**Verify:** Add an item to the wishlist, go to the wishlist page, remove it, refresh the page, and confirm it's actually gone (not just hidden until refresh).

---

## Item 5 — PDP: "Delivery & Returns" Accordion Is Empty

**Check:** On the Product Detail Page, there are two dropdown/accordion sections — "The Story" (which has content: Story + The Craft text) and "Delivery & Returns" (which is currently a completely empty placeholder with no content inside it).

**Fix:**
- Write real, genuinely useful Delivery & Returns content (e.g. estimated delivery timelines, COD availability, return/exchange window and process, who pays return shipping) and wire it into that accordion so it's no longer empty. If exact policy details aren't available in the codebase, use clearly reasonable placeholder policy text and flag it to the client to confirm the real numbers/policy before launch — don't leave it blank.
- Consider (and note this as a suggestion, not a requirement) whether Delivery & Returns might read better somewhere more visible than a second accordion tab on the PDP — e.g. a small line near the Buy/Add to Cart button ("Free delivery in X days · Easy 7-day returns") plus the full policy in this accordion or on the cart page. Implement whichever placement makes sense, but at minimum the accordion must show complete, non-empty content.

**Verify:** Open the Delivery & Returns accordion on a real product page and confirm it shows complete written content, not a blank space.

---

## Item 6 — Checkout: "Amount exceeds maximum amount allowed" + Console Errors + Razorpay Test Payment Failing

**Check:** Placing an order shows the error "Amount exceeds maximum amount allowed" and the browser console shows repeated `net::ERR_CONNECTION_REFUSED` errors for random `.png` files loading from unusual local ports (e.g. `:37857`, `:7070`) — and Razorpay test-mode payment fails as a result.

**Investigate root cause (don't just suppress the error message):**
1. **Amount conversion bug:** Razorpay expects the order amount in the smallest currency unit (paise for INR), i.e. `amountInRupees * 100`. Check the code that builds the Razorpay order — a very common bug is converting to paise twice (e.g. the amount is already in paise somewhere upstream, then multiplied by 100 again downstream), which can produce a number far larger than Razorpay's actual maximum allowed order amount and trigger exactly this error. Trace the amount from cart total → order creation → Razorpay order API call, and confirm it's converted to paise exactly once, correctly, right before the Razorpay API call.
2. **The broken `.png` requests on odd local ports:** these are very likely Razorpay's checkout widget trying to load payment-method icons (UPI apps, cards, etc.) through a proxy/rewrite rule in the Next.js config that's incorrectly intercepting or rewriting third-party asset URLs to a local dev port instead of letting them load directly from Razorpay's CDN. Check `next.config.js` (or any custom proxy/middleware) for overly broad rewrite/proxy rules that might be catching these external requests, and exclude Razorpay's domains from any such rule.
3. After fixing both of the above, re-test a full Razorpay test-mode payment end to end and confirm it completes successfully with no console errors.

**Verify:** Place a real test order through Razorpay test mode, confirm no "Amount exceeds maximum" error, confirm no `ERR_CONNECTION_REFUSED` errors in console, and confirm the payment completes successfully.

---

## Item 7 — COD Order Confirmation Page: UI Needs Improvement

**Check/Reference:** The current COD order confirmation page layout works functionally but looks under-designed/unpolished compared to the rest of the site's premium look and feel.

**Fix:** Redesign this confirmation page to match the site's overall premium visual style (typography, spacing, card styling already used elsewhere on the site) — keep all the existing information (order number, payment status, items ordered, subtotal/shipping/total, shipping address, action buttons) but improve the visual polish, spacing, and hierarchy so it feels like a finished, considered page rather than a default/placeholder layout.

**Verify:** Place a real test order and visually confirm the confirmation page now matches the site's design quality.

---

## Item 8 — Account Page "Recent Orders": Poor Formatting

**Check:** On the account page, the Recent Orders list shows raw order IDs (e.g. `BB-MT2KKX83OHPU`) with no product name shown, and the status appears to show "pending" twice in a row, and the overall card styling is rough/unpolished.

**Fix:**
- Show the actual product name(s) in the order (e.g. "Cloud White Boxy Shirt" or "Cloud White Boxy Shirt +1 more" if multiple items) instead of only the raw order ID as the primary text — the order ID can still be shown, but smaller/secondary.
- Check why status is displaying twice (likely two separate status fields — e.g. order status and payment status — both showing "pending" with no label distinguishing them). Either label them clearly (e.g. "Order: Pending" / "Payment: Pending") or consolidate into one clear status if they're redundant.
- Improve the overall visual styling of each order card to match the site's design system (matches Item 7's polish level).

**Verify:** Place a test order, go to the account page, and confirm the order card shows the product name clearly, clearly labeled statuses, and improved visual styling.

---

## Item 9 — [Add more items here as they come up]
Use this same format for any additional bug or feature — Check → Fix if broken → Verify — so this document can keep growing into the running checklist for the site instead of writing a brand new prompt from scratch every time.

---

## Final Report Format
After going through all items, summarize in this format:

| Item | Status before | What was changed | Verified? |
|---|---|---|---|
| 1. Stock auto-decrement | ... | ... | Yes/No |
| 2. Out-of-stock messaging | ... | ... | Yes/No |
| 3. Search box UI (no images) | ... | ... | Yes/No |
| 4. Wishlist remove | ... | ... | Yes/No |
| 5. Delivery & Returns content | ... | ... | Yes/No |
| 6. Checkout amount error + Razorpay | ... | ... | Yes/No |
| 7. COD confirmation UI | ... | ... | Yes/No |
| 8. Account recent orders UI | ... | ... | Yes/No |

Do not mark anything "Verified: Yes" unless you actually tested it (placed a real order, checked the DB/admin panel value, or visually confirmed the UI at the stated breakpoints) — not just because the code looks correct to you.
