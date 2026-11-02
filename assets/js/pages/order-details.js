/* Order details: replica of the live order details view (spec 6.7) + Claim cashback early (6.8) */
(function () {
  const M = MIA, { rs, date, esc, icon } = M;
  const IMG = "assets/img/";
  const dmy = (iso) => iso.split("-").reverse().join("/");
  const sp = (n) => "₹ " + n; // site renders breakdown figures as "₹ 73827"
  let o = null, key = "", focusClaim = false, scrolled = false;

  const imgFor = (it) => it.img || ({ coin: "coin.jpg", silver: "silver.jpg", earring: "studs.jpg" }[it.kind] || (/pendant|necklace/i.test(it.name) ? "pendant.jpg" : "ring.jpg"));

  const STATUS = {
    PROCESSING: ["", "Order Processing"],
    SHIPPED: ["", "Order Shipped"],
    DELIVERED: ["delivered", "Delivered"],
    CANCELLED: ["muted", "Cancelled"],
    RETURNED: ["muted", "Returned"],
    UNDELIVERABLE: ["muted", "Not Delivered"],
  };

  function cashbackCard(cb) {
    if (!cb || cb.state === "NONE") return "";
    const amt = rs(cb.amount);
    let cls = "", title = "", body = "", acts = "", extra = "";
    const tl = (stage) => {
      const steps = [["Order placed", date(o.placedOn, true)], ["Delivered", cb.deliveredOn ? date(cb.deliveredOn, true) : "Pending"], ["Added to wallet", cb.creditOn ? date(cb.creditOn, true) : "After return window"]];
      return `<div class="timeline" aria-label="Cashback timeline">${steps.map((s, i) => `<div class="tl ${i < stage ? "done" : i === stage ? "now" : ""}"><b>${s[0]}</b>${s[1]}</div>`).join("")}</div>`;
    };
    const how = `<button class="s-link" data-how>How cashback works</button>`;
    switch (cb.state) {
      case "ON_HOLD_PENDING_DELIVERY":
        title = M.t("res.cashback.block.onHold", { amount: amt });
        body = "It’ll be added to your Mia Wallet after the return window closes. You can claim it early once your order is delivered.";
        extra = tl(1); acts = how; break;
      case "ON_HOLD":
        title = M.t("res.cashback.block.onHold", { amount: amt });
        body = cb.claim && cb.claim.available
          ? `It’ll be added on ${date(cb.creditOn)}, when the return window closes. Want it now? Claim it early, but you won’t be able to return any item in this order.`
          : `It’ll be added on ${date(cb.creditOn)}, when the return window closes.`;
        if (cb.originalAmount && cb.originalAmount !== cb.amount) body += ` Updated from ${rs(cb.originalAmount)} after your return.`;
        extra = tl(2);
        acts = cb.claim && cb.claim.available ? `<button class="s-btn-rose" style="height:44px;padding:0 26px;font-size:15px" data-claim>${M.t("res.cashback.claim.cta", { amount: amt })}</button>${how}` : how;
        break;
      case "PAUSED":
        cls = "paused"; title = M.t("res.cashback.block.paused");
        body = `${amt} is paused. Your return is in progress. We’ll update this order’s cashback once it’s complete.`;
        acts = `<a class="s-link" href="return.html?s=requested">Return details</a>`; break;
      case "CREDITED":
        cls = "credited"; title = M.t("res.cashback.block.credited", { amount: amt });
        if (cb.claimedEarly) body = M.t("res.cashback.block.claimedNote", { date: date(cb.claimedOn) });
        else if (cb.originalAmount && cb.originalAmount !== cb.amount) body = `Updated from ${rs(cb.originalAmount)} after your return. Added on ${date(cb.creditedOn)} · valid till ${date(cb.expiresOn)}.`;
        else body = `Added on ${date(cb.creditedOn)} · valid till ${date(cb.expiresOn)}.`;
        acts = `<a class="s-btn-soft" style="height:44px" href="wallet.html">Go to Mia Wallet</a>`; break;
      case "VOIDED":
        cls = "voided"; title = M.t("res.cashback.block.voided");
        body = `This order was ${cb.voidReason || "cancelled"}, so its cashback was cancelled. Your refund was not affected.`; break;
    }
    const focus = focusClaim && cb.state === "ON_HOLD" && cb.claim && cb.claim.available ? "is-focus" : "";
    return `<section class="s-cb ${cls} ${focus}" id="cashback" aria-labelledby="cb-t">
      <div class="s-cb__hd"><img src="${IMG}ic-cashback.svg" alt=""><div style="flex:1;min-width:0"><div class="row-between" style="align-items:flex-start;gap:10px"><div class="s-cb__t" id="cb-t">${title}</div>${M.cashbackBadge(cb.state)}</div><p class="s-cb__b">${body}</p></div></div>
      ${extra}${acts ? `<div class="s-cb__acts" style="padding-left:52px">${acts}</div>` : ""}
    </section>`;
  }

  function itemButtons(it) {
    const cb = o.cashback;
    if ((o.returned || []).includes(it.lineId)) return `<span class="badge badge--mute">${icon("undo", 13)}Returned</span>`;
    if ((o.returning || []).includes(it.lineId)) return `<span class="badge badge--warn">${icon("pause", 13)}Return requested</span>`;
    if (o.status !== "DELIVERED") return "";
    const rate = `<button class="s-btn-soft">Rate and Review</button>`;
    if (cb.claimedEarly || o.wholeOrderOnly) return rate;
    if (it.kind === "coin") return `<span class="xs" style="color:var(--s-grey3);align-self:center">Coins can’t be returned</span>${rate}`;
    const end = M.returnWindowEnd(o, it);
    if (M.daysUntil(end) < 0) return `<span class="xs" style="color:var(--s-grey3);align-self:center">Return window closed on ${date(end, true)}</span>${rate}`;
    return `<a class="s-btn-soft" href="return.html?s=${o.items.length > 1 ? "standard" : "single"}&line=${it.lineId}">Return</a>${rate}`;
  }

  function productCard() {
    const st = STATUS[o.status];
    const cb = o.cashback;
    const statusText = o.status === "DELIVERED" ? `Delivered on ${date(o.deliveredOn, true)}` : st[1];
    return `<section class="s-prod">
      <div class="s-prod__top"><span class="s-status ${st[0]}"><img src="${IMG}order-star.png" alt="">${statusText}</span>${o.status === "PROCESSING" || o.status === "SHIPPED" ? `<button class="s-track">${icon("pin", 12)} Track</button>` : ""}</div>
      ${o.items
        .map((it) => `<div class="s-li" style="flex-wrap:wrap"><img src="${IMG}${imgFor(it)}" alt=""><div style="flex:1;min-width:0">
            <div class="s-li__p">₹ ${new Intl.NumberFormat("en-IN").format(it.price).replace(/,/g, " ")}</div>
            <div class="s-li__n">${esc(it.name)}</div>
            <div class="s-li__attrs"><span>Qty: <b>${it.qty}</b></span>${it.size ? `<span>Size: <b>${it.size}</b></span>` : ""}<span>Gross Weight: <b>${it.weight || "2.575 g"}</b></span></div>
            ${it.offer ? `<span class="s-li__tag s-btag--offer">${esc(it.offer)}</span>` : ""}
          </div>
          ${itemButtons(it) ? `<div class="s-prod__ft" style="width:100%;padding-top:14px">${itemButtons(it)}</div>` : ""}</div>`)
        .join("")}
      ${cb.claimedEarly ? `<div class="s-prod__note">${icon("lock", 18)}<span>${M.t("res.return.closedByClaim", { date: date(cb.claimedOn) })}</span></div>` : ""}
      ${o.status === "DELIVERED" && o.wholeOrderOnly && !cb.claimedEarly ? `<div class="s-prod__note">${icon("info", 18)}<span>${M.t("res.return.wholeOrder", { offer: esc(o.offerName || "an offer") })}</span></div><div class="s-prod__ft"><a class="s-btn-soft" href="return.html?s=wholeOrder">Return whole order</a></div>` : ""}
      ${o.status === "PROCESSING" ? `<div class="s-prod__ft"><a class="s-btn-soft" href="cancel.html">Cancel Order</a></div>` : ""}
    </section>`;
  }

  function breakdown(showWallet) {
    const grand = o.subTotal - o.saved - (showWallet ? o.walletUsed : 0);
    const wr = o.walletRefund;
    return `<section class="s-otb">
      <div class="s-otb__t">Order Total Breakdown <small>(${M.plural(o.items.length, "Item", "Items")})</small></div>
      <div class="s-otb__r"><span>Sub Total</span><b>${sp(o.subTotal)}</b></div>
      <div class="s-otb__r"><span>You saved</span><b class="green">- ${sp(o.saved)}</b></div>
      ${showWallet && o.walletUsed ? `<div class="s-otb__r"><span style="display:flex;gap:8px;align-items:center"><img src="${IMG}ic-wallet.svg" alt="" style="width:22px">Wallet Applied</span><b class="rose">- ${sp(o.walletUsed)}</b></div>` : ""}
      <div class="s-otb__r"><span>Delivery Charges</span><b>Free</b></div>
      <div class="s-otb__gt"><span>Grand Total</span><b>${sp(grand)}</b></div>
      ${showWallet && wr ? `<div class="s-otb__refund" style="background:${wr.done ? "#eefaf2" : "var(--s-canvas)"};color:${wr.done ? "#1c5c3b" : "var(--s-grey)"}">${icon(wr.done ? "undo" : "clock", 18)}<span>${wr.done ? `Returned to your Mia Wallet <b>${rs(wr.amount)}</b>${wr.expiresOn ? ` · valid till ${date(wr.expiresOn)}` : ""}` : `Refund to Mia Wallet in progress · <b>${rs(wr.amount)}</b>`}</span></div>` : ""}
    </section>
    <section class="s-card s-bill">
      <div class="s-bill__t">Billing Information</div>
      <div class="s-bill__h"><span>Method</span><span>Amount</span></div>
      <div class="s-bill__r"><span>Prepaid</span><span>${sp(o.payment.amount)}</span></div>
      ${showWallet && o.walletUsed ? `<div class="s-bill__r"><span>Wallet</span><span>${sp(o.walletUsed)}</span></div>` : ""}
    </section>`;
  }

  // Shown when the customer arrives from a Claim entry point (hold picker, Orders list).
  function claimContext(ctx) {
    const back = ctx.q.get("back");
    const backLink = back ? `<a class="s-btn-line claim-ctx__a" href="${esc(back)}">${icon("arrowLeft", 14)}&nbsp;${M.backLabel(back)}</a>` : "";
    const cb = o.cashback;
    if (cb.state === "CREDITED" && cb.claimedEarly && cb.claimedOn === M.TODAY_ISO)
      return `<div class="claim-ctx done" role="status">${icon("checkCircle", 22)}<div><div class="claim-ctx__t">${rs(cb.amount)} is now in your Mia Wallet</div><div class="claim-ctx__b">${back ? "Head back to use it straight away." : "You can use it on your next order."} Returns are closed for this order.</div></div>${back ? `<a class="s-pill-rose claim-ctx__a" style="display:inline-flex;align-items:center;text-decoration:none" href="${esc(back)}">${M.backLabel(back)}</a>` : ""}</div>`;
    if (!ctx.q.get("claim") && !back) return "";
    if (cb.state !== "ON_HOLD" || !cb.claim || !cb.claim.available)
      return back ? `<div class="claim-ctx">${icon("info", 22)}<div><div class="claim-ctx__t">This order’s cashback can’t be claimed early</div><div class="claim-ctx__b">See the cashback card for when it’s added.</div></div>${backLink}</div>` : "";
    const n = o.items.length;
    const windows = M.returnWindowsText(o);
    return `<div class="claim-ctx">${icon("clock", 22)}<div><div class="claim-ctx__t">Claim ${rs(cb.amount)} from this order</div><div class="claim-ctx__b">Check the ${n === 1 ? "item" : `${n} items`} below first. Claiming closes returns for ${n === 1 ? "it" : "all of them"}. If you don’t claim, you can still return ${n === 1 ? "it" : "them"} (${windows}) and the cashback is added automatically on ${date(cb.creditOn, true)}.</div></div>${backLink}</div>`;
  }

  function support() {
    return `<section class="s-card s-sup">
      <div class="s-sup__img"><img src="${IMG}support.png" alt=""><img src="${IMG}green-dot.png" alt=""></div>
      <div><h6>Delivery Support</h6><p>If you have any question or issue with an order please contact them.</p></div>
      <div class="s-sup__c"><div><img src="${IMG}contact.png" alt="">Mia Customer care</div><div><img src="${IMG}call.png" alt="">18002660123</div></div>
    </section>`;
  }

  M.page({
    id: "order",
    layout: "raw",
    darkCrumb: true,
    crumbs: () => [["Home", "index.html"], ["My Orders", "orders.html"], ["#OrderID: " + (o ? o.orderNo : "")]],
    responses: {
      label: "Claim response (server)",
      options: [
        { id: "ok", label: "200 · Claimed" },
        { id: "network", label: "Network / 5xx error" },
        { id: "RETURN_IN_PROGRESS", label: "409 · Return in progress (stale page)" },
        { id: "WINDOW_CLOSED", label: "409 · Window closed meanwhile" },
        { id: "SUPPRESSED", label: "409 · Suppressed" },
      ],
    },
    scenarios: [
      { id: "pending", group: "On hold", label: "Placed, not delivered", desc: "ON_HOLD_PENDING_DELIVERY. No Claim before delivery. Cancel available. ₹800 wallet used shows in both breakdowns." },
      { id: "shipped", group: "On hold", label: "Shipped (no cancel)", desc: "Still ON_HOLD_PENDING_DELIVERY, already dispatched so no Cancel." },
      { id: "claimable", group: "On hold", label: "Delivered · Claim available", desc: "ON_HOLD + claim.available. Tap ‘Claim ₹1,000 now’. Try each server response above. Success hides every Return button and updates the header balance." },
      { id: "suppressed", group: "On hold", label: "High value · claim suppressed", desc: "CONFIG claimSuppressAboveOrderValue on. On hold with no Claim CTA." },
      { id: "mixed", group: "On hold", label: "Mixed silver + gold order", desc: "Credit date = delivery + 30 days (longest window wins)." },
      { id: "silver", group: "On hold", label: "Silver-only order (7-day window)", desc: "Credit date = delivery + 7 days." },
      { id: "wholeOrder", group: "On hold", label: "Whole-order return only (custom promo)", desc: "Per-item Return hidden; one ‘Return whole order’ with explanation." },
      { id: "rejected", group: "Return outcomes", label: "Return rejected · window open", desc: "Back to ON_HOLD with Claim available, plus the outcome message." },
      { id: "partialHold", group: "Return outcomes", label: "Partial return · window open", desc: "ON_HOLD with the new ₹600 (updated from ₹1,000). Claim available again." },
      { id: "partialCredited", group: "Return outcomes", label: "Partial return · window closed", desc: "CREDITED with the new amount." },
      { id: "withdrawnClosed", group: "Return outcomes", label: "Return withdrawn · window closed", desc: "Credited at once with the outcome message." },
      { id: "paused", group: "Return outcomes", label: "Return in progress", desc: "PAUSED. Claim hidden. Item shows ‘Return requested’." },
      { id: "credited", group: "Credited", label: "Credited automatically", desc: "Window closed with no return." },
      { id: "claimed", group: "Credited", label: "Claimed early · returns closed", desc: "claimedEarly = true. Return buttons hidden with the explanation." },
      { id: "voidCancelled", group: "Voided / none", label: "Cancelled · wallet refunded", desc: "VOIDED. ‘Returned to your Mia Wallet ₹800’ as a new credit." },
      { id: "voidReturned", group: "Voided / none", label: "Fully returned · refund in progress", desc: "VOIDED. Wallet refund still in progress." },
      { id: "undeliverable", group: "Voided / none", label: "Undeliverable", desc: "VOIDED for an order that couldn’t be delivered." },
      { id: "none", group: "Voided / none", label: "Order earns no cashback", desc: "Discounted item + coin. No cashback card, no wallet lines." },
    ],
    balance: (ctx) => (ctx.cust === "loading" ? null : M.chromeWallet().available),
    onHold: () => M.chromeWallet().onHold,
    render(ctx) {
      const k = ctx.s + "|" + ctx.cust;
      if (k !== key) {
        key = k; o = M.ORDERS[ctx.s](); scrolled = false;
        focusClaim = ctx.q.get("claim") === "1";
        // A claim already made for this order in this tab (e.g. before going back to the bag) stays claimed.
        const prior = M.claims.get(o.orderNo);
        if (prior && prior.sid === ctx.s && o.cashback.state === "ON_HOLD")
          Object.assign(o.cashback, { state: "CREDITED", claimedEarly: true, claimedOn: M.TODAY_ISO, creditedOn: M.TODAY_ISO, expiresOn: o.cashback.expiresIfClaimedToday, claim: { available: false } });
      }
      const show = ctx.eligible;
      return `<div class="s-od"><div class="s-od__inner">
        <div class="s-od__title"><a href="orders.html" aria-label="Back to orders"><img src="${IMG}arrow-left.png" alt=""></a><h3>Order Details</h3></div>
        ${show ? claimContext(ctx) : ""}
        ${o.flash && show ? `<div class="note note--${o.flash.tone}" role="status" style="margin-bottom:20px">${icon(o.flash.tone === "pos" ? "checkCircle" : "info")}<span>${esc(o.flash.text)}</span></div>` : ""}
        <div class="s-od__grid od">
          <div class="s-od__col stack">
            <section class="s-oid"><div class="s-oid__in"><div><div class="s-oid__id">#Order ID <i></i> ${esc(o.orderNo)}</div><div class="s-oid__date">Order Date: ${dmy(o.placedOn)}</div></div><button class="s-copy" data-copy><img src="${IMG}copy.png" alt="">Copy</button></div></section>
            ${productCard()}
            <section class="s-card s-ship"><h4>Shipping Details</h4><div class="s-ship__row"><div class="s-ship__av">t</div><div><div class="s-ship__nm">test test</div><p class="addr">Test, Bengaluru Urban, India - 560111</p><p>kkkkk@gmail.com</p><p>+91 9521005220</p></div></div></section>
          </div>
          <div class="s-od__col stack">${show ? cashbackCard(o.cashback) : ""}${breakdown(show)}${support()}</div>
        </div></div></div>`;
    },
    mount(root, ctx) {
      const app = document.getElementById("app");
      app.querySelector("[data-copy]")?.addEventListener("click", () => { navigator.clipboard?.writeText(o.orderNo); M.toast("Order ID copied"); });
      app.querySelectorAll("[data-how]").forEach((b) => b.addEventListener("click", M.openHowItWorks));
      const claimBtn = app.querySelector("[data-claim]");
      const back = ctx.q.get("back");
      claimBtn?.addEventListener("click", () =>
        M.openClaimModal({
          orderNo: o.orderNo, amount: o.cashback.amount, items: o.items, returnsTill: o.cashback.creditOn, deliveredOn: o.deliveredOn,
          expiresIfClaimedToday: o.cashback.expiresIfClaimedToday, resp: ctx.resp,
          back: back ? { href: back, label: M.backLabel(back) } : null,
          onSuccess: () => {
            M.claims.add(o.orderNo, { amount: o.cashback.amount, sid: ctx.s });
            Object.assign(o.cashback, { state: "CREDITED", claimedEarly: true, claimedOn: M.TODAY_ISO, creditedOn: M.TODAY_ISO, expiresOn: o.cashback.expiresIfClaimedToday, claim: { available: false } });
            o.flash = null; focusClaim = false;
            setTimeout(ctx.rerender, 50);
          },
          onConflict: (code) => {
            if (code === "RETURN_IN_PROGRESS") { o.cashback.state = "PAUSED"; o.returning = [o.items[0].lineId]; }
            else if (code === "WINDOW_CLOSED") Object.assign(o.cashback, { state: "CREDITED", creditedOn: M.TODAY_ISO, expiresOn: M.addDays(M.TODAY_ISO, M.config.cashbackValidityDays) });
            o.cashback.claim = { available: false, reason: code };
            o.flash = null; focusClaim = false;
            ctx.rerender();
          },
        })
      );
      if (focusClaim && !scrolled && claimBtn) {
        scrolled = true;
        setTimeout(() => app.querySelector("#cashback")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
      }
    },
  });
})();
