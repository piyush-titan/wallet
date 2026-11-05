/* Hub: entry point listing every module in the prototype. */
(function () {
  const M = MIA, { icon } = M;
  const MODS = [
    ["wallet.html", "wallet", "My Wallet", "P0", "Balance, on hold (with Claim), paused for returns, transactions with View all, Expiring Balance tab, empty, loading, error.", 16],
    ["order-details.html?s=claimable", "sparkle", "Order details + Claim early", "P0", "Cashback block for every state, early-claim consent modal with every server response, wallet lines and refunds.", 18],
    ["orders.html", "box", "My Orders", "P1", "One-line cashback status per order card, with Claim now deep link.", 4],
    ["order-details.html?s=returnItem", "undo", "Return flow", "P0", "Replica of the live Return Item / Return Order modal and ‘Returned Confirmed!’ popup, plus a Refund Summary (card, Mia Wallet, cashback change).", 12],
    ["order-details.html?s=cancelOrder", "ban", "Cancel order / item", "P0", "Replica of the live Cancel Order and Cancel Item modals, with notes on wallet money and cashback, validation, success and error toasts.", 5],
    ["cart.html", "bag", "Cart", "P0", "Wallet section (all 10 states), redeem modal (17 states), info sheet, benefit tags, coupon conflict, auto-removal.", 16],
    ["checkout.html", "card", "Checkout", "P0", "Replica of the live Order Details step. Mia Wallet in Redeem Points & Gift Cards, hold responses, address removal, gift card + NeuCoins, out of stock, payment failed.", 13],
    ["confirmation.html", "checkCircle", "Order confirmation", "P0", "Cashback-on-hold banner and the wallet line; no banner when nothing is earned.", 5],
    ["pdp.html", "ring", "Product page", "P2", "‘Earn up to’ cashback line and when it’s hidden.", 6],
  ];
  M.page({
    id: "hub",
    layout: "shop",
    customer: true,
    scenarios: [{ id: "all", label: "All screens", desc: "Open any module. On every page, use this pill to jump between states, simulate server responses and switch customer type (guest, USD, international). Press [ and ] to cycle states." }],
    render(ctx) {
      return `<div class="stack" style="gap:28px">
        <div style="max-width:720px">
          <div class="eyebrow">Mia by Tanishq · Approach B · Manual claim</div>
          <h1 style="font-size:36px;margin-top:8px">Mia Wallet and Cashback</h1>
          <p class="muted" style="margin-top:10px">Cashback is held until the return window closes, then added automatically. Customers can claim it early from the order page, which closes returns for that order. Refunds are always paid in full.</p>
          <p class="small" style="margin-top:14px;display:flex;gap:8px;align-items:center">${icon("sliders", 16)}Use the <strong>Edge cases</strong> pill (bottom right) on any screen to switch states.</p>
        </div>
        <div class="hub-grid">${MODS.map((m) => `<a class="hub-card" href="${m[0]}${ctx.cust !== "ok" ? (m[0].includes("?") ? "&" : "?") + "c=" + ctx.cust : ""}"><div class="row-between"><span class="li__ico rose">${icon(m[1])}</span><span class="badge ${m[3] === "P0" ? "badge--neutral" : "badge--mute"}">${m[3]}</span></div><h3>${m[2]}</h3><p class="small muted">${m[4]}</p><p class="xs strong" style="margin-top:12px;color:var(--rose)">${m[5]} states ${icon("arrowRight", 12)}</p></a>`).join("")}</div>
        <section class="card"><h2>Cashback states at a glance</h2>
          <div class="stack-sm" style="margin-top:14px">
            ${[["ON_HOLD_PENDING_DELIVERY", "Order placed, not delivered. Not spendable."], ["ON_HOLD", "Delivered, return window open. Claim early if allowed."], ["PAUSED", "Return in progress. Can’t be claimed."], ["CREDITED", "Window closed or claimed early. Spendable."], ["VOIDED", "Cancelled, undeliverable or fully returned."]].map((s) => `<div class="row" style="gap:14px"><span style="width:150px;flex:none">${M.cashbackBadge(s[0])}</span><span class="small muted">${s[1]}</span></div>`).join("")}
          </div></section>
      </div>`;
    },
  });
})();
