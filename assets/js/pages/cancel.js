/* Cancel flow before dispatch (spec 6.9 Cancellation) */
(function () {
  const M = MIA, { rs, date, esc, icon, config: C } = M;

  const SC = {
    full: () => M.ORDERS.pending(),
    partial: () => ({ ...M.ORDERS.pending(), partialAllowed: true }),
    noWallet: () => ({ ...M.ORDERS.pending(), walletUsed: 0, payment: { label: "UPI · priya@okhdfc", amount: 10000 } }),
    walletOnly: () => ({ ...M.ORDERS.pending(), walletUsed: 10000, payment: { label: "—", amount: 0 }, cashback: { state: "NONE", amount: 0 } }),
    wholeOrder: () => ({ ...M.ORDERS.pending(), wholeOrderOnly: true, offerName: "the Buy 2 Get 10% Off offer", partialAllowed: true }),
    quoteError: () => M.ORDERS.pending(),
    done: () => M.ORDERS.pending(),
  };
  let o, key = "", selected = [], qState = "ok", quote = null, done = false, reason = "";
  const REASONS = ["Ordered by mistake", "Found a better price", "Delivery is taking too long", "Other"];

  function moneyBlock() {
    if (qState === "loading") return M.refundSummary(null, { title: "What happens to your money", loading: true });
    if (qState === "error") return M.refundSummary(null, { title: "What happens to your money", error: true });
    const q = quote;
    const card = q.refundTo.find((r) => r.method !== "WALLET");
    const wal = q.refundTo.find((r) => r.method === "WALLET");
    const exp = M.addDays(M.TODAY_ISO, Math.max(C.minRefundValidityDays, 41));
    const rows = [];
    if (card && card.amount) rows.push([icon("card", 18), `<strong>${rs(card.amount)}</strong> back to your ${esc(card.label)} in 5 to 7 working days.`]);
    if (wal) rows.push([icon("wallet", 18), `<strong>${rs(wal.amount)}</strong> you paid from your Mia Wallet will go back to your wallet as a new credit, valid till ${date(exp)}.`]);
    if (q.cashback)
      rows.push([icon(q.cashback.effect === "VOIDED" ? "ban" : "clock", 18),
        q.cashback.effect === "VOIDED"
          ? `The <strong>${rs(q.cashback.current)}</strong> cashback on hold for this order will be cancelled.`
          : `This order’s cashback will change from <strong>${rs(q.cashback.current)}</strong> to <strong>${rs(q.cashback.afterReturn)}</strong>.`]);
    return `<section class="rs" aria-live="polite"><div class="rs__hd"><h3>What happens to your money</h3><span class="xs muted">${rs(q.itemValue)} cancelled</span></div>
      <ul class="list" style="padding:4px 20px 8px">${rows.map((r) => `<li class="li" style="align-items:flex-start"><div class="li__ico" style="width:34px;height:34px">${r[0]}</div><div class="li__main small" style="padding-top:6px">${r[1]}</div></li>`).join("")}</ul>
      ${q.cashback ? `<div class="rs__cb"><div class="row xs" style="gap:6px;color:var(--pos)">${icon("shield", 14)}${M.t("res.return.summary.notAffected")}</div></div>` : ""}</section>`;
  }

  async function requote(ctx, force) {
    if (!selected.length) { quote = null; return ctx.rerender(); }
    qState = "loading"; ctx.rerender();
    await M.wait(600);
    if (!force && (ctx.resp === "error" || (ctx.s === "quoteError" && !ctx._retried))) qState = "error";
    else { quote = M.mockQuote(o, selected); qState = "ok"; }
    ctx.rerender();
  }

  M.page({
    id: "cancel",
    layout: "account",
    nav: "orders",
    crumbs: () => [["Home", "index.html"], ["Orders", "orders.html"], ["#" + (o ? o.orderNo : ""), "order-details.html?s=pending"], ["Cancel"]],
    responses: { label: "Cancel quote (server)", options: [{ id: "ok", label: "200 · Quote" }, { id: "error", label: "Error · quote fails" }] },
    scenarios: [
      { id: "full", label: "Cancel whole order · wallet used", desc: "₹800 wallet back as a new credit, ₹1,000 cashback on hold cancelled, card part refunded." },
      { id: "partial", label: "Partial cancellation allowed", desc: "Deselect an item: ‘This order’s cashback will change from ₹1,000 to ₹…’." },
      { id: "wholeOrder", label: "Whole-order only (custom promo)", desc: "Partial cancellation not allowed: all items locked." },
      { id: "noWallet", label: "No wallet used", desc: "Only card refund + cashback cancellation." },
      { id: "walletOnly", label: "Paid entirely with wallet", desc: "Earned no cashback (wallet money never earns). Only the wallet credit line." },
      { id: "quoteError", label: "Quote failed · Retry", desc: "Confirm is disabled until the quote loads." },
      { id: "done", label: "After cancellation", desc: "Confirmation, then order details shows VOIDED + ‘Returned to your Mia Wallet’." },
    ],
    render(ctx) {
      const k = ctx.s + "|" + ctx.cust + "|" + ctx.resp;
      if (k !== key) {
        key = k; o = SC[ctx.s](); ctx._retried = false; done = ctx.s === "done"; reason = "";
        selected = o.items.map((i) => i.lineId);
        quote = M.mockQuote(o, selected);
        qState = ctx.s === "quoteError" || ctx.resp === "error" ? "error" : "ok";
      }
      if (done)
        return `<section class="card success-hero" style="max-width:640px;margin:0 auto;width:100%"><div class="tick">${icon("check", 30)}</div><h1>Order cancelled</h1><p class="muted" style="margin-top:6px">Order #${esc(o.orderNo)}</p></section>
          <div style="max-width:640px;margin:0 auto;width:100%" class="stack">${moneyBlock()}<div class="row" style="gap:12px;flex-wrap:wrap"><a class="btn btn--primary" href="order-details.html?s=voidCancelled">View order</a><a class="btn btn--ghost" href="wallet.html">Go to Mia Wallet</a></div></div>`;
      const lock = !o.partialAllowed || o.wholeOrderOnly;
      return `<div><a class="link small" href="order-details.html?s=pending">${icon("arrowLeft", 14)} Back to order</a><h1 style="margin-top:10px">Cancel order</h1><p class="small muted">Order #${esc(o.orderNo)} · Placed ${date(o.placedOn, true)} · Not yet dispatched</p></div>
        <div class="grid-2">
          <section class="card"><h2>${lock ? "Items in this order" : "Which items are you cancelling?"}</h2>
            ${o.wholeOrderOnly ? `<div class="note note--info" style="margin-top:14px">${icon("lock")}<span>This order can only be cancelled in full because it used ${esc(o.offerName)}.</span></div>` : ""}
            ${o.items.map((it) => `<label class="check"><input type="checkbox" data-line="${it.lineId}" ${selected.includes(it.lineId) ? "checked" : ""} ${lock ? "disabled" : ""}>${M.thumb(it.kind)}<div style="flex:1"><div class="item__name">${esc(it.name)}</div><div class="strong num">${rs(it.price)}</div></div></label>`).join("")}
            <label for="creason" class="small strong" style="display:block;margin:18px 0 8px">Reason for cancelling</label>
            <select id="creason" class="input" style="appearance:auto;border-radius:14px"><option value="">Choose a reason</option>${REASONS.map((r) => `<option ${r === reason ? "selected" : ""}>${r}</option>`).join("")}</select>
          </section>
          <div class="stack">${selected.length ? moneyBlock() : `<div class="note note--info">${icon("info")}<span>Select at least one item.</span></div>`}
            <button class="btn btn--primary btn--block" data-confirm ${qState === "ok" && selected.length && reason ? "" : "disabled"}>Cancel ${selected.length === o.items.length ? "order" : M.plural(selected.length, "item", "items")}</button>
            <a class="btn btn--ghost btn--block" href="order-details.html?s=pending">Keep my order</a>
          </div>
        </div>`;
    },
    mount(root, ctx) {
      root.querySelectorAll("[data-line]").forEach((cb) => cb.addEventListener("change", () => { selected = [...root.querySelectorAll("[data-line]:checked")].map((x) => x.dataset.line); requote(ctx); }));
      root.querySelector("#creason")?.addEventListener("change", (e) => { reason = e.target.value; ctx.rerender(); document.getElementById("creason")?.focus(); });
      root.querySelector("[data-retry]")?.addEventListener("click", () => { ctx._retried = true; requote(ctx, true); });
      root.querySelector("[data-confirm]")?.addEventListener("click", async (e) => { M.btnBusy(e.currentTarget, true, "Cancelling…"); await M.wait(1000); done = true; ctx.render(); });
    },
  });
})();
