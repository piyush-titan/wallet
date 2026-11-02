/* Return flow with refund summary (spec 6.9, manual approach) */
(function () {
  const M = MIA, { rs, date, esc, icon } = M;
  const T = M.TODAY_ISO, add = M.addDays;

  const SC = {
    standard: () => M.ORDERS.claimable(),
    single: () => ({ ...M.ORDERS.claimable(), items: [M.ORDERS.claimable().items[0]], subTotal: 7200, walletUsed: 0, payment: { label: "HDFC credit card", amount: 7200 }, cashback: { ...M.ORDERS.claimable().cashback, amount: 720 } }),
    noWallet: () => ({ ...M.ORDERS.claimable(), walletUsed: 0, payment: { label: "UPI · priya@okhdfc", amount: 10000 } }),
    wholeOrder: () => M.ORDERS.wholeOrder(),
    windowClosed: () => {
      const o = M.ORDERS.mixed();
      o.deliveredOn = add(T, -10);
      o.cashback.creditOn = add(T, 20);
      return o;
    },
    coin: () => {
      const o = M.ORDERS.claimable();
      o.items = [o.items[0], { lineId: "L4", name: "1 Gram 24KT Gold Coin", price: 15600, kind: "coin", qty: 1 }];
      o.subTotal += 15600;
      return o;
    },
    noCashback: () => ({ ...M.ORDERS.none(), items: [M.ORDERS.none().items[0]], subTotal: 6400, saved: 1280 }),
    quoteLoading: () => M.ORDERS.claimable(),
    quoteError: () => M.ORDERS.claimable(),
    review: () => M.ORDERS.claimable(),
    requested: () => M.ORDERS.claimable(),
    closedByClaim: () => M.ORDERS.claimed(),
  };

  let o, key = "", step = 1, selected = [], reason = "", quote = null, qState = "idle", qSeq = 0;

  const REASONS = ["Size or fit isn’t right", "Looks different from the photos", "Changed my mind", "Received a damaged item", "Other"];

  function lineState(it) {
    if (it.kind === "coin") return { disabled: true, note: "Coins can’t be returned" };
    const end = M.returnWindowEnd(o, it);
    if (M.daysUntil(end) < 0) return { disabled: true, note: `Return window closed on ${date(end, true)}` };
    return { disabled: false, note: `Return by ${date(end, true)}` };
  }

  async function fetchQuote(ctx, force) {
    const seq = ++qSeq;
    if (!selected.length) { qState = "idle"; quote = null; return ctx.rerender(); }
    qState = "loading"; ctx.rerender();
    if (ctx.s === "quoteLoading" && !force) return; // stays loading so Continue stays disabled
    await M.wait(700);
    if (seq !== qSeq) return; // a newer selection superseded this request
    if (!force && (ctx.resp === "error" || (ctx.s === "quoteError" && !ctx._retried))) { qState = "error"; return ctx.rerender(); }
    quote = M.mockQuote(o, selected);
    qState = "ok";
    if (quote.cashback) M.track("return_summary_view", { cashbackEffect: quote.cashback.effect });
    ctx.rerender();
  }

  function stepper() {
    const s = (n, label) => `<div class="step ${step === n ? "on" : step > n ? "done" : ""}"><i>${step > n ? "✓" : n}</i>${label}</div>`;
    return `<div class="steps" aria-label="Progress">${s(1, "Select items")}<span class="step-sep"></span>${s(2, "Review refund")}<span class="step-sep"></span>${s(3, "Done")}</div>`;
  }

  function summary() {
    if (qState === "idle") return `<section class="rs"><div class="rs__hd"><h3>Refund summary</h3></div><div class="rs__bd" style="padding:20px"><p class="small muted">Select the items you want to return to see your refund.</p></div></section>`;
    return M.refundSummary(quote, { loading: qState === "loading", error: qState === "error" });
  }

  function step1(ctx) {
    const locked = o.wholeOrderOnly;
    return `<div class="grid-2">
      <section class="card">
        <h2>Which items are you returning?</h2>
        ${locked ? `<div class="note note--info" style="margin-top:14px">${icon("lock")}<span>${M.t("res.return.wholeOrder", { offer: esc(o.offerName || "an offer") })}</span></div>` : ""}
        <div style="margin-top:8px">${o.items
          .map((it) => {
            const ls = lineState(it);
            const dis = ls.disabled || locked;
            return `<label class="check ${ls.disabled ? "is-disabled" : ""}"><input type="checkbox" data-line="${it.lineId}" ${selected.includes(it.lineId) ? "checked" : ""} ${dis ? "disabled" : ""} ${locked ? 'aria-describedby="lock-why"' : ""}>${M.thumb(it.kind)}<div style="flex:1;min-width:0"><div class="item__name">${esc(it.name)}</div><div class="row" style="gap:10px;margin-top:2px"><span class="strong num">${rs(it.price)}</span><span class="xs ${ls.disabled ? "" : "muted"}" ${ls.disabled ? 'style="color:var(--err)"' : ""}>${ls.note}</span></div></div></label>`;
          })
          .join("")}</div>
        <label for="reason" class="small strong" style="display:block;margin:18px 0 8px">Reason for return</label>
        <select id="reason" class="input" style="appearance:auto;border-radius:14px"><option value="">Choose a reason</option>${REASONS.map((r) => `<option ${r === reason ? "selected" : ""}>${r}</option>`).join("")}</select>
      </section>
      <div class="stack">${summary()}
        <button class="btn btn--primary btn--block" data-continue ${qState === "ok" && reason ? "" : "disabled"}>Continue</button>
        ${qState === "ok" && !reason ? `<p class="xs muted" style="text-align:center">Choose a reason to continue.</p>` : ""}
      </div>
    </div>`;
  }

  function step2() {
    return `<div class="grid-2">
      <div class="stack">
        <section class="card"><h2>You’re returning</h2>
          ${o.items.filter((i) => selected.includes(i.lineId)).map((it) => `<div class="item">${M.thumb(it.kind)}<div class="item__main"><div class="item__name">${esc(it.name)}</div><div class="strong num" style="margin-top:4px">${rs(it.price)}</div></div></div>`).join("")}
          <div class="kv small"><span class="k muted">Reason</span><span class="v">${esc(reason)}</span></div>
        </section>
        <section class="card"><h2>Pickup from</h2><p class="small muted" style="margin-top:8px">Test Test · Indiranagar, Bengaluru 560038 · +91 95210 05220</p></section>
      </div>
      <div class="stack">${M.refundSummary(quote)}
        ${quote.cashback ? `<p class="xs muted">While your return is in progress, this order’s cashback is paused and can’t be claimed.</p>` : ""}
        <button class="btn btn--primary btn--block" data-submit>Confirm return</button>
        <button class="btn btn--ghost btn--block" data-back>Back</button>
      </div>
    </div>`;
  }

  function step3() {
    const q = quote || M.mockQuote(o, [o.items[0].lineId]);
    return `<section class="card success-hero" style="max-width:640px;margin:0 auto">
        <div class="tick">${icon("check", 30)}</div>
        <h1>Return requested</h1>
        <p class="muted" style="margin-top:6px">We’ll pick it up in 2 to 3 days. Return ID R-55821.</p>
        ${q.cashback ? `<div class="note note--warn" style="margin:18px auto 0;max-width:460px;text-align:left">${icon("pause")}<span>${M.t("res.return.requested.paused")}</span></div>` : ""}
      </section>
      <div style="max-width:640px;margin:0 auto;width:100%" class="stack">${M.refundSummary(q, { title: "Your refund" })}
        <div class="row" style="gap:12px;flex-wrap:wrap"><a class="btn btn--primary" href="order-details.html?s=paused">View order</a><a class="btn btn--ghost" href="wallet.html?s=returning">Go to Mia Wallet</a></div>
      </div>`;
  }

  M.page({
    id: "return",
    layout: "account",
    nav: "orders",
    crumbs: () => [["Home", "index.html"], ["Orders", "orders.html"], ["#" + (o ? o.orderNo : ""), "order-details.html?s=claimable"], ["Return"]],
    responses: { label: "Refund quote (server)", options: [{ id: "ok", label: "200 · Quote" }, { id: "error", label: "Error · quote fails" }] },
    scenarios: [
      { id: "standard", group: "Select items", label: "Two items · wallet used", desc: "Select one item → cashback recalculated (₹1,000 → lower). Select both → cancelled. Refund splits into card + Mia Wallet; always in full. Quote refreshes on every change; Continue waits for it." },
      { id: "single", group: "Select items", label: "Single item · full return", desc: "Returning the only item cancels the cashback. Refund is not affected." },
      { id: "noWallet", group: "Select items", label: "No wallet used (one refund line)", desc: "Only one ‘You’ll receive’ row." },
      { id: "wholeOrder", group: "Select items", label: "Whole order only (locked)", desc: "Every item preselected and locked with the reason. Cashback all or nothing." },
      { id: "windowClosed", group: "Select items", label: "Silver item past its 7-day window", desc: "Silver item disabled with ‘Return window closed on…’; gold item still returnable." },
      { id: "coin", group: "Select items", label: "Order contains a coin", desc: "Coins can’t be returned: row disabled." },
      { id: "noCashback", group: "Select items", label: "Order without cashback", desc: "No cashback line or reassurance in the summary." },
      { id: "quoteLoading", group: "Refund quote", label: "Quote loading", desc: "Summary skeleton; Continue stays disabled until the quote loads." },
      { id: "quoteError", group: "Refund quote", label: "Quote failed · Retry", desc: "‘We couldn’t calculate your refund.’ Retry succeeds." },
      { id: "review", group: "Steps", label: "Step 2 · Review and confirm", desc: "Final summary before submitting. Confirm → Return requested." },
      { id: "requested", group: "Steps", label: "Step 3 · Return requested", desc: "Cashback paused note. Order details then shows PAUSED with Claim hidden." },
      { id: "closedByClaim", group: "Blocked", label: "Deep link after claiming early", desc: "Returns are closed because cashback was claimed early. Link back to the order." },
    ],
    render(ctx) {
      const k = ctx.s + "|" + ctx.cust + "|" + ctx.resp;
      if (k !== key) {
        key = k; o = SC[ctx.s](); ctx._retried = false;
        step = ctx.s === "review" ? 2 : ctx.s === "requested" ? 3 : 1;
        reason = step > 1 ? REASONS[0] : "";
        const line = ctx.q.get("line");
        selected = o.wholeOrderOnly ? o.items.map((i) => i.lineId) : step > 1 ? [o.items[0].lineId] : line ? [line] : ctx.s === "single" ? [o.items[0].lineId] : [];
        selected = selected.filter((id) => { const it = o.items.find((x) => x.lineId === id); return it && !lineState(it).disabled; });
        quote = selected.length ? M.mockQuote(o, selected) : null;
        qState = selected.length ? (ctx.s === "quoteLoading" ? "loading" : ctx.s === "quoteError" || ctx.resp === "error" ? "error" : "ok") : "idle";
      }
      const head = `<div><a class="link small" href="order-details.html?s=claimable">${icon("arrowLeft", 14)} Back to order</a><h1 style="margin-top:10px">Return items</h1><p class="small muted">Order #${esc(o.orderNo)} · Delivered ${date(o.deliveredOn, true)}</p></div>`;
      if (ctx.s === "closedByClaim")
        return head + `<section class="card empty"><div class="empty__art">${icon("lock")}</div><h2>Returns are closed</h2><p class="muted" style="margin:6px auto 0;max-width:420px">${M.t("res.return.closedByClaim", { date: date(o.cashback.claimedOn) })}</p><a class="btn btn--soft" style="margin-top:20px" href="order-details.html?s=claimed">Back to order</a></section>`;
      return head + stepper() + (step === 1 ? step1(ctx) : step === 2 ? step2() : step3());
    },
    mount(root, ctx) {
      root.querySelectorAll("[data-line]").forEach((cb) =>
        cb.addEventListener("change", () => {
          selected = [...root.querySelectorAll("[data-line]:checked")].map((x) => x.dataset.line);
          fetchQuote(ctx).then(() => document.querySelector(`[data-line="${cb.dataset.line}"]`)?.focus());
        })
      );
      root.querySelector("#reason")?.addEventListener("change", (e) => { reason = e.target.value; ctx.rerender(); document.getElementById("reason")?.focus(); });
      root.querySelector("[data-retry]")?.addEventListener("click", () => { ctx._retried = true; fetchQuote(ctx, true); });
      root.querySelector("[data-continue]")?.addEventListener("click", () => { step = 2; ctx.render(); });
      root.querySelector("[data-back]")?.addEventListener("click", () => { step = 1; ctx.render(); });
      root.querySelector("[data-submit]")?.addEventListener("click", async (e) => {
        M.btnBusy(e.currentTarget, true, "Submitting…");
        await M.wait(1000);
        step = 3; ctx.render();
      });
    },
  });
})();
