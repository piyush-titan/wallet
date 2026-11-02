/* Order confirmation (spec 6.5) */
(function () {
  const M = MIA, { rs, date, esc, icon, config: C } = M;
  const estDelivery = M.addDays(M.TODAY_ISO, 5);

  const SC = {
    walletUsed: { orderNo: "MIA1031999", items: [M.LINES.ring, M.LINES.studs], walletUsed: 1500, paid: 8500, method: "UPI", cashback: 425, creditOn: M.addDays(estDelivery, C.otherReturnDays) },
    noWallet: { orderNo: "MIA1032001", items: [M.LINES.ring, M.LINES.studs], walletUsed: 0, paid: 10000, method: "UPI", cashback: 500, creditOn: M.addDays(estDelivery, C.otherReturnDays) },
    silver: { orderNo: "MIA1032004", items: [{ ...M.LINES.studs, name: "Twisted Beam Silver Hoop Earrings", price: 1900, kind: "silver" }], walletUsed: 0, paid: 1900, method: "Credit card", cashback: 95, creditOn: M.addDays(estDelivery, C.silverReturnDays) },
    noCashback: { orderNo: "MIA1032002", items: [M.LINES.pendant, M.LINES.coin], walletUsed: 0, paid: 12933, discounts: 1280, method: "UPI", cashback: 0 },
    walletOnly: { orderNo: "MIA1032003", items: [{ ...M.LINES.studs, price: 1200, name: "Tiny Star 14KT Gold Nose Pin" }], walletUsed: 1200, paid: 0, method: null, cashback: 0 },
  };

  M.page({
    id: "confirm",
    layout: "shop",
    scenarios: [
      { id: "walletUsed", label: "Cashback on hold · wallet used", desc: "Banner + ‘Mia Wallet −₹1,500’ line. Cashback earned only on the ₹8,500 paid with real money." },
      { id: "noWallet", label: "Cashback on hold · no wallet", desc: "Banner, no wallet line." },
      { id: "silver", label: "Silver order (7-day window)", desc: "‘around {date}’ uses delivery + 7 days." },
      { id: "noCashback", label: "Order earns nothing (offer + coin)", desc: "No banner at all." },
      { id: "walletOnly", label: "Paid entirely with wallet", desc: "Wallet money never earns: no banner. Payable ₹0." },
    ],
    render(ctx) {
      const o = SC[ctx.s];
      const sub = o.items.reduce((s, l) => s + l.price, 0);
      const showWallet = ctx.eligible;
      return `<div style="max-width:720px;margin:0 auto" class="stack">
        <section class="card success-hero"><div class="tick">${icon("check", 30)}</div><h1>Thank you, your order is placed</h1>
          <p class="muted" style="margin-top:6px">Order #${esc(o.orderNo)} · Arriving by ${date(estDelivery)}</p></section>
        ${showWallet && o.cashback > 0
          ? `<section class="banner" aria-labelledby="cbb"><div class="banner__ico">${icon("sparkle", 24)}</div><div>
              <div class="display" id="cbb" style="font-size:19px">${M.t("bm.cashback.confirm.title", { amount: rs(o.cashback) })}</div>
              <p class="muted small" style="margin-top:4px">${M.t("bm.cashback.confirm.body", { creditOn: date(o.creditOn) })}</p>
              <p class="small" style="margin-top:10px">${M.t("bm.cashback.confirm.note")}</p>
              <button class="link small" style="margin-top:10px" data-how>How cashback works</button></div></section>`
          : ""}
        <section class="card"><h2>Order summary</h2>
          ${o.items.map((l) => `<div class="item">${M.thumb(l.kind)}<div class="item__main"><div class="item__name small">${esc(l.name)}</div><div class="strong num" style="margin-top:4px">${rs(l.price)}</div></div></div>`).join("")}
          <div style="margin-top:4px">
            <div class="kv"><span class="k">Sub Total</span><span class="v">${rs(sub)}</span></div>
            ${o.discounts ? `<div class="kv"><span class="k">Offers and discounts</span><span class="v pos">\u2212${rs(o.discounts)}</span></div>` : ""}
            ${showWallet && o.walletUsed ? `<div class="kv"><span class="k row" style="gap:8px">${icon("wallet", 16)}Mia Wallet</span><span class="v rose">\u2212${rs(o.walletUsed)}</span></div>` : ""}
            <div class="kv kv--total"><span class="k">Paid${o.method ? " · " + o.method : ""}</span><span class="v">${rs(o.paid)}</span></div>
          </div></section>
        <div class="row" style="gap:12px;flex-wrap:wrap;justify-content:center"><a class="btn btn--primary" href="order-details.html?s=pending">View order</a><a class="btn btn--ghost" href="pdp.html">Continue shopping</a></div>
      </div>`;
    },
    mount(root, ctx) {
      root.querySelector("[data-how]")?.addEventListener("click", M.openHowItWorks);
      if (root.querySelector(".banner")) M.track("cashback_banner_view", { page: "confirmation", state: "ON_HOLD_PENDING_DELIVERY" });
    },
  });
})();
