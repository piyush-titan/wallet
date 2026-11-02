/* Order History: replica of the live My Account > Orders list, plus the cashback line (spec 6.6) */
(function () {
  const M = MIA, { rs, date, esc, icon } = M;
  const dmy = (iso) => iso.split("-").reverse().join("/");

  function cbLine(o, sid) {
    const c = o.cashback;
    if (!c || c.state === "NONE" || c.state === "VOIDED") return "";
    const a = `<b class="num">${rs(c.amount)}</b>`;
    let ico = "clock", tone = "", text = "", act = "";
    switch (c.state) {
      case "ON_HOLD_PENDING_DELIVERY": text = `${a} cashback on hold · claim after delivery`; break;
      case "ON_HOLD":
        text = `${a} cashback on hold · added on ${date(c.creditOn, true)}`;
        if (c.claim.available) act = `<a class="s-link" href="${M.claimHref({ sid }, M.here())}">Review &amp; claim</a>`;
        break;
      case "PAUSED": ico = "pause"; tone = "warn"; text = "Return in progress · cashback paused"; break;
      case "CREDITED": ico = "checkCircle"; tone = "pos"; text = `${a} cashback credited${c.claimedEarly ? " · claimed early" : ""}`; break;
    }
    const col = tone === "pos" ? "#1f8a46" : tone === "warn" ? "#8a5a00" : "var(--s-rose)";
    return `<div class="s-oh__cb ${tone}"><span style="color:${col};display:inline-flex">${icon(ico, 18)}</span><span>${text}</span>${act}</div>`;
  }

  function card(sid, ctx) {
    const o = M.ORDERS[sid]();
    const total = o.subTotal - o.saved - o.walletUsed;
    return `<article class="s-oh">
      <div class="s-oh__top"></div>
      <div class="s-oh__rows">
        <div class="s-oh__row"><span>Order Number:</span><span>${esc(o.orderNo)}</span></div>
        <div class="s-oh__row"><span>Order Date:</span><span>${dmy(o.placedOn)}</span></div>
        <div class="s-oh__row"><span>Total Price:</span><span class="price">₹ ${total}</span></div>
      </div>
      ${ctx.eligible ? cbLine(o, sid) : ""}
      <div class="s-oh__ft"><a href="order-details.html?s=${sid}">View Details</a></div>
    </article>`;
  }

  const LISTS = {
    all: ["claimable", "pending", "suppressed", "paused", "credited", "claimed", "voidCancelled", "none"],
    single: ["claimable"],
  };

  M.page({
    id: "orders",
    layout: "account",
    nav: "orders",
    crumbs: () => [["Home", "index.html"], ["My Account", "#"], ["OrderHistory"]],
    scenarios: [
      { id: "all", label: "Every cashback state", desc: "One card per state: claimable (Review & claim → order details with the cashback card highlighted and a Back to My Orders link), on hold before delivery, on hold with no claim (suppressed), paused, credited, claimed early, voided (no line) and no cashback (no line)." },
      { id: "single", label: "One claimable order", desc: "‘Review & claim’ opens the order page to check items before claiming." },
      { id: "empty", label: "No orders yet", desc: "Empty state." },
      { id: "loading", label: "Loading", desc: "Skeleton cards." },
    ],
    render(ctx) {
      const head = `<div class="s-eyebrow s-oh-title">Order History</div>`;
      if (ctx.s === "empty")
        return head + `<div class="s-oh-list"><article class="s-oh" style="text-align:center;padding:48px 24px"><img src="assets/img/ic-order.svg" alt="" style="width:64px;margin:0 auto 12px"><div style="font:600 20px Fraunces,serif">No orders yet</div><p style="color:var(--s-grey);margin:6px 0 20px">Your orders and their cashback will show up here.</p><a class="s-btn-rose" href="pdp.html">Start shopping</a></article></div>`;
      if (ctx.s === "loading")
        return head + `<div class="s-oh-list">${[1, 2, 3].map(() => `<article class="s-oh" aria-busy="true"><div class="s-oh__top"></div><div class="s-oh__rows">${[1, 2, 3].map(() => `<div class="skel" style="height:16px;width:70%"></div>`).join("")}</div><div class="s-oh__ft"><div class="skel" style="height:44px;width:425px;border-radius:24px"></div></div></article>`).join("")}</div>`;
      return head + `<div class="s-oh-list">${LISTS[ctx.s].map((sid) => card(sid, ctx)).join("")}</div>`;
    },
  });
})();
