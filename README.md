# Mia Wallet and Cashback: UI prototype (Approach B, manual claim)

A clickable prototype of every customer-facing screen in `Mia-Wallet-Cashback-UI-Spec-B-Manual.md`.
It uses static HTML, CSS and vanilla JS with no build step, so it maps directly onto SFCC ISML and jQuery.

## Run

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 5178   # then open http://localhost:5178
```

## Edge-case switcher

Every page has an **Edge cases** pill in the bottom-right corner. Use it to:

- **Page**: jump between modules.
- **Screen / state**: every state from the spec, grouped. Press `[` and `]` to cycle through them.
- **Server response**: simulate API outcomes (claim 200/409/network, apply 422/409/5xx, wallet hold, quote failure).
- **Customer**: eligible, loading, guest, USD, international address (spec 2.1).

The current state lives in the URL (`?s=…&r=…&c=…`), so you can share a link to an exact screen.
Each state shows a short description, and the last `dataLayer` event appears in the panel.

## Modules

| File | Spec | Notes |
| --- | --- | --- |
| `wallet.html` | 6.10 | Both tabs (`#balance`, `#expiring`), on hold with Claim, paused, history + View all, empty, loading, error |
| `order-details.html` | 6.7, 6.8 | Cashback block for every state, claim modal, wallet lines, refund lines |
| `orders.html` | 6.6 | Cashback status line per order; Claim now opens order details with the modal |
| `return.html` | 6.9 | Live refund summary, whole-order lock, closed windows, requested screen |
| `order-details.html?s=cancelOrder` | 6.9 | Replica of the live Cancel Order / Cancel Item modals (reason dropdown, validation, toasts) plus wallet and cashback notes. `cancel.html` redirects here |
| `cart.html` | 6.3, 7 | Wallet section (10 states), redeem modal, info sheet, tags, coupon conflict, auto-removal |
| `checkout.html` | 6.4 | Replica of the live "Order Details" checkout step. Mia Wallet is a row in "Redeem Points & Gift Cards" and a line in Payment Details. Covers address selection, hold responses, international/undeliverable address, gift card + NeuCoins, ₹0 payable, out of stock on continue, payment failed/pending |
| `confirmation.html` | 6.5 | Cashback banner |
| `pdp.html` | 6.2 | "Earn up to" line (P2) |

## Fidelity to the live site

`cart.html`, `orders.html` and `order-details.html` (plus the shared header, nav bar, breadcrumb and account
sidebar) are replicas of stg.miabytanishq.com. Their sizes, spacing, colours, fonts, radii and shadows were
measured from the live pages at 1440px, and they use the site's own icons and product images (`assets/img/`).
These styles live in `assets/css/site.css`. New wallet and cashback elements follow the same patterns:

- **Cart:** a wallet row sits in the totals card above Apply Coupons, styled like the coupon row. A "Mia Wallet" line is added to Payment Details.
- **Order History:** a one-line cashback strip is added inside each order card.
- **Order Details:** a cashback card sits at the top of the right column. "Wallet Applied" is added to the breakdown and "Wallet" to Billing Information.

## On-hold cashback and the claim journey

Claiming is manual, so on-hold cashback is shown wherever the customer might want to spend it:

- **Header and sidebar:** "+₹X on hold".
- **My Wallet:** Total balance, plus an On hold tile and a list of on-hold orders.
- **Cart and checkout:** an on-hold strip in the wallet row.
- **Order History:** a line on each order card.

Every Claim entry point follows the same three steps:

1. **Pick the order.** A panel lists every order with cashback on hold. Each card shows:
   - the order number and delivery date;
   - item thumbnails and names;
   - the amount;
   - the return deadline (per item type when silver and gold are mixed);
   - when the cashback will be added automatically anyway.

   Claimable orders come first. Orders that can't be claimed early (not delivered, high value, return in progress) explain why and link to the order instead.
2. **Review on the order page.** The page opens with a banner ("Claim ₹910 from this order"), the cashback card highlighted and the items in view. The claim pop-up lists each item with its own return deadline.
3. **Come back and use it.** The success state offers "Back to bag", "Back to checkout" or "Back to My Wallet". The amount is already available there, with a confirmation and Redeem.

Claims are stored for the browser tab (`sessionStorage`), so a claim made on an order page shows on every other page. Picking a state in the Edge cases panel resets them.

## Structure

```
assets/css/mia.css          tokens and wallet/cashback components
assets/css/site.css         replica of the live header, sidebar, cart, order history, order details
assets/img/                 icons and product images from the live site, plus ic-wallet.svg / ic-cashback.svg
assets/js/core.js           formatting, CONFIG, icons, modal/sheet, toast, chrome, edge-case pill
assets/js/components.js     content keys (spec 13), CashbackBadge/Block, ClaimCashbackModal,
                            WalletSection, RedeemModal, WalletInfoSheet, RefundSummary, HowItWorks
assets/js/orders-data.js    order fixtures + mock return/cancel quote
assets/js/cart-data.js      mock /cart/wallet service + PaymentDetails
assets/js/pages/*.js        one file per page: scenarios + render + interactions
```

## Handover notes for SFCC

- **Content keys:** all strings go through `MIA.t(key)` with the keys from spec 13. `bm.*` keys map to Business Manager content, and `res.*` keys map to resource bundles.
- **CONFIG values:** these live in `MIA.config` (redemption %, monthly limit, validity, return days and so on). Read them from site preferences in production.
- **Mock data:** the mock services in `*-data.js` stand in for the real API. The UI renders the figures they return and never does money calculations itself.
- **Fixed date:** "Today" is fixed at 30 Oct 2026 (`MIA.TODAY_ISO`), so fixture dates stay consistent.
- **Design review:** the cashback banner, cashback block, claim modal, refund summary and the On hold / Paused sections are new designs and need a design review (spec 12).
