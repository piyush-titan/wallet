/* Checkout (spec 6.4, 9) */
(function () {
  const M = MIA, { rs, esc, icon } = M;
  let cart, key = "", address = "home", topNote = null, view = "checkout", useGift = false, useNeu = false;

  const ADDR = {
    home: { label: "Home", line: "Indiranagar, Bengaluru, Karnataka 560038, India" },
    bad: { label: "Parents", line: "Kibithu, Anjaw, Arunachal Pradesh 792104, India", note: "We can’t deliver to this pincode yet" },
    intl: { label: "Office", line: "Business Bay, Dubai, United Arab Emirates" },
  };

  function addressCard() {
    return `<section class="card"><h2>Delivery address</h2><div class="stack-sm" style="margin-top:14px" role="radiogroup" aria-label="Delivery address">
      ${Object.entries(ADDR).map(([id, a]) => `<label class="rcard"><input type="radio" name="addr" value="${id}" ${address === id ? "checked" : ""}><div><div class="strong">${a.label}${id === "intl" ? ' <span class="badge badge--info" style="height:20px">International</span>' : ""}</div><div class="small muted">${a.line}</div>${a.note ? `<div class="xs" style="color:var(--err);margin-top:2px">${a.note}</div>` : ""}</div></label>`).join("")}
    </div></section>`;
  }

  function paymentCard(q, ctx) {
    const hide = !ctx.eligible || address === "intl";
    const zero = q.totals.payable === 0;
    const cw = { ...q, justClaimed: cart.justClaimed, notice: cart.noticeText, loading: ctx.cust === "loading", guest: ctx.cust === "guest" };
    return `<section class="card"><h2>Payment</h2>
      <div class="stack" style="margin-top:14px">
        ${topNote ? `<div class="note note--warn" role="alert">${icon("alert")}<span>${esc(topNote)}</span></div>` : ""}
        ${M.walletSection(cw, { page: "checkout", hidden: hide })}
        ${q.totals.released || cart.notice === "gift" ? `<div class="note note--info" role="status">${icon("info")}<span>${M.t("bm.wallet.checkout.giftAdjusted")}</span></div>` : ""}
        <div class="stack-sm">
          <label class="rcard"><input type="checkbox" data-gift ${useGift ? "checked" : ""}><div style="flex:1"><div class="strong">Gift card</div><div class="small muted">MIA-GC ••••4821 · ${rs(2000)} balance</div></div>${q.totals.giftCard ? `<span class="strong num">\u2212${rs(q.totals.giftCard)}</span>` : ""}</label>
          <label class="rcard"><input type="checkbox" data-neu ${useNeu ? "checked" : ""}><div style="flex:1"><div class="strong">Tata Neu points</div><div class="small muted">500 NeuCoins available</div></div>${q.totals.tataNeu ? `<span class="strong num">\u2212${rs(q.totals.tataNeu)}</span>` : ""}</label>
        </div>
        ${zero
          ? `<div class="note note--pos">${icon("checkCircle")}<span>Your order is fully paid. No payment method needed.</span></div>`
          : `<div><div class="small strong" style="margin-bottom:8px">Pay ${rs(q.totals.payable)} with</div><div class="stack-sm" role="radiogroup" aria-label="Payment method">${["UPI", "Credit or debit card", "Net banking", "EMI", "Cash on delivery"].map((m, i) => `<label class="rcard"><input type="radio" name="pm" ${i === 0 ? "checked" : ""}><div class="strong">${m}</div></label>`).join("")}</div></div>`}
      </div></section>`;
  }

  function summaryCard(q, ctx) {
    const hide = !ctx.eligible || address === "intl";
    const zero = q.totals.payable === 0;
    return `<section class="card"><h2>Order summary</h2>${q.lines.filter((l) => !l.oos).map((l) => `<div class="item">${M.thumb(l.kind)}<div class="item__main"><div class="item__name small">${esc(l.name)}</div><div class="row" style="gap:8px;margin-top:4px"><span class="strong num">${rs(l.price - (l.discount || 0))}</span>${M.benefitTag(l.benefit)}</div></div></div>`).join("")}
      ${q.lines.some((l) => l.oos) ? `<div class="note note--info">${icon("info")}<span>${esc(q.lines.find((l) => l.oos).name)} is out of stock and was removed.</span></div>` : ""}
      </section>
      ${M.paymentDetails(q, { showWallet: !hide, showEstimate: !hide })}
      <button class="btn btn--primary btn--block" data-place ${address === "bad" ? "disabled" : ""}>${zero ? "Place order" : "Pay " + rs(q.totals.payable)}</button>
      ${address === "bad" ? `<p class="xs" style="color:var(--err);text-align:center">Choose an address we can deliver to.</p>` : ""}`;
  }

  function statusView(ctx) {
    const applied = cart.applied;
    const V = {
      failed: ["alert", "err", "Payment failed", "Your payment didn’t go through. No money was taken.", `<div class="note note--pos">${icon("shield")}<span><strong>${M.t("bm.wallet.payment.failedSafe")}</strong> ${rs(applied)} is still applied to this order. Retry to use it.</span></div>`, "Retry payment"],
      failedReapply: ["alert", "err", "Payment failed", "Your payment didn’t go through. No money was taken.", `<div class="note note--info">${icon("shield")}<span><strong>${M.t("bm.wallet.payment.failedSafe")}</strong> Apply your wallet amount again when you retry.</span></div>`, "Back to checkout"],
      pending: ["clock", "warn", "Payment pending", "We’re waiting for your bank to confirm. This can take up to 30 minutes.", `<div class="note note--info">${icon("wallet")}<span>Your ${rs(applied)} wallet amount stays held for this order until the payment is confirmed.</span></div>`, null],
      notCreated: ["alert", "err", "We couldn’t place your order", "Something went wrong after your payment. Any amount taken will be refunded in 5 to 7 working days.", `<div class="note note--pos">${icon("undo")}<span>Any wallet amount you used has been returned to your wallet.</span></div>`, "Back to bag"],
    }[view];
    const tone = { err: ["var(--err-bg)", "var(--err)"], warn: ["var(--warn-bg)", "var(--warn)"] }[V[1]];
    return `<section class="card" style="max-width:560px;margin:0 auto;width:100%;text-align:center">
      <div class="empty__art" style="background:${tone[0]};color:${tone[1]};width:72px;height:72px">${icon(V[0], 32)}</div>
      <h1>${V[2]}</h1><p class="muted" style="margin-top:6px">${V[3]}</p>
      <div style="text-align:left;margin-top:20px">${ctx.eligible && applied ? V[4] : ""}</div>
      ${V[5] ? `<button class="btn btn--primary" style="margin-top:20px" data-back-co>${V[5]}</button>` : `<a class="btn btn--ghost" style="margin-top:20px" href="orders.html">Go to My Orders</a>`}
    </section>`;
  }

  M.page({
    id: "checkout",
    layout: "shop",
    responses: {
      label: "Pay / Place order · wallet hold",
      options: [
        { id: "ok", label: "200 · Hold OK → confirmation" },
        { id: "BALANCE_CHANGED", label: "409 · BALANCE_CHANGED" },
        { id: "MONTHLY_LIMIT", label: "409 · MONTHLY_LIMIT" },
        { id: "SERVICE_DOWN", label: "503 · SERVICE_DOWN" },
      ],
    },
    scenarios: [
      { id: "default", group: "Wallet", label: "Not applied yet · Redeem", desc: "Same WalletSection and RedeemModal as the cart, placed in the payment area." },
      { id: "applied", group: "Wallet", label: "Carried over from cart (₹1,500)", desc: "The applied amount carries over unchanged. Try Pay with each hold response above." },
      { id: "giftNeu", group: "Wallet", label: "Wallet + gift card + Tata Neu", desc: "Order of application: discounts → wallet → gift card and Neu on what’s left. All lines in payment details." },
      { id: "giftAdjusted", group: "Wallet", label: "Gift card / Neu adjusted", desc: "Wallet change lowered payable below what the gift card covered; excess released with a notice." },
      { id: "zeroPayable", group: "Wallet", label: "Payable ₹0 · Place order", desc: "Payment methods hidden; button reads Place order." },
      { id: "intl", group: "Removal", label: "International address chosen", desc: "Section hidden; applied amount removed with notice. Pick Home to bring the section back (amount not re-applied)." },
      { id: "unserviceable", group: "Removal", label: "Address can’t be delivered to", desc: "Amount removed with the address notice." },
      { id: "autoOos", group: "Removal", label: "Item went out of stock", desc: "Amount removed with the out-of-stock notice." },
      { id: "down", group: "Removal", label: "Wallet service down", desc: "Unavailable message; checkout still works." },
      { id: "failed", group: "After Pay", label: "Payment failed · amount kept", desc: "Existing failed page + ‘Your wallet amount is safe.’ Kept for retry." },
      { id: "failedReapply", group: "After Pay", label: "Payment failed · apply again", desc: "API says the amount is no longer applied." },
      { id: "pending", group: "After Pay", label: "Payment pending", desc: "No wallet change; amount stays held." },
      { id: "notCreated", group: "After Pay", label: "Order not created after payment", desc: "‘Any wallet amount you used has been returned to your wallet.’" },
    ],
    customerNote: (ctx) => (ctx.cust === "intl" ? "International address selected: section hidden and any applied amount removed." : ctx.cust === "usd" ? "USD: no wallet UI." : ""),
    balance: (ctx) => (ctx.cust === "loading" ? null : cart ? cart.available : 1560),
    onHold: () => (cart ? M.holdSum(cart.holdOrders) : 0),
    render(ctx) {
      const k = ctx.s + "|" + ctx.cust;
      if (k !== key) {
        key = k;
        const fx = { failed: "applied", failedReapply: "applied", pending: "applied", notCreated: "applied" }[ctx.s] || ctx.s;
        cart = new M.Cart(M.CART_FIX[fx]);
        address = cart.address || (ctx.cust === "intl" ? "intl" : "home");
        useGift = !!cart.giftCard; useNeu = !!cart.neu;
        if (!useGift) cart.giftCard = 0;
        topNote = null;
        view = ["failed", "failedReapply", "pending", "notCreated"].includes(ctx.s) ? ctx.s : "checkout";
        cart.noticeText = cart.notice && cart.notice !== "gift" ? M.t(M.REMOVED[cart.notice]) : null;
        if (address === "intl" && cart.noticeText) topNote = cart.noticeText;
      }
      if (view !== "checkout") return statusView(ctx);
      const q = cart.quote();
      return `<div class="steps"><div class="step done"><i>✓</i>Bag</div><span class="step-sep"></span><div class="step on"><i>2</i>Checkout</div><span class="step-sep"></span><div class="step"><i>3</i>Done</div></div>
        <div class="grid-2"><div class="stack">${addressCard()}${paymentCard(q, ctx)}</div><div class="stack">${summaryCard(q, ctx)}</div></div>`;
    },
    mount(root, ctx) {
      root.querySelectorAll('input[name="addr"]').forEach((r) =>
        r.addEventListener("change", () => {
          address = r.value;
          if (address !== "home" && cart.applied) {
            cart.applied = 0;
            cart.noticeText = M.t(address === "intl" ? M.REMOVED.international : M.REMOVED.address);
            M.track("wallet_auto_removed", { page: "checkout", reason: address === "intl" ? "INTERNATIONAL" : "UNSERVICEABLE" });
            if (address === "intl") topNote = cart.noticeText;
          } else if (address === "home") topNote = null;
          ctx.rerender();
        })
      );
      root.querySelector("[data-gift]")?.addEventListener("change", (e) => { useGift = e.target.checked; cart.giftCard = useGift ? 2000 : 0; cart.notice = null; ctx.rerender(); });
      root.querySelector("[data-neu]")?.addEventListener("change", (e) => { useNeu = e.target.checked; cart.neu = useNeu ? 500 : 0; cart.notice = null; ctx.rerender(); });
      root.querySelectorAll("[data-ws]").forEach((b) =>
        b.addEventListener("click", async () => {
          const a = b.dataset.ws;
          if (a === "redeem" || a === "edit")
            M.openRedeemModal({
              cw: cart.quote(), page: "checkout", resp: "ok",
              onApplied: (v) => { cart.applied = v; cart.noticeText = null; topNote = null; cart.notice = null; ctx.rerender(); },
              onBlocked: () => ctx.rerender(),
            });
          if (a === "claim") M.openHoldSheet({ orders: cart.holdOrders, back: M.here() });
          if (a === "remove") { M.btnBusy(b, true, "Removing…"); await M.wait(500); cart.applied = 0; M.toast(M.t("bm.wallet.toast.removed")); M.track("wallet_remove", { page: "checkout" }); ctx.rerender(); }
          if (a === "why") M.openInfoSheet(b.dataset.reason, cart.quote().ineligibleItems);
          if (a === "how") M.openHowItWorks();
          if (a === "dismiss") { cart.noticeText = null; ctx.rerender(); }
          if (a === "login") M.toast("Opens the existing login popup", "info");
        })
      );
      root.querySelector("[data-place]")?.addEventListener("click", async (e) => {
        M.btnBusy(e.currentTarget, true, "Processing…");
        await M.wait(1000);
        const r = ctx.resp;
        if (!cart.applied || r === "ok") {
          location.href = "confirmation.html?s=" + (cart.applied ? "walletUsed" : "noWallet") + (ctx.cust !== "ok" ? "&c=" + ctx.cust : "");
          return;
        }
        cart.applied = 0;
        if (r === "BALANCE_CHANGED") { cart.available = 1100; topNote = M.t("bm.wallet.checkout.balanceChanged"); }
        if (r === "MONTHLY_LIMIT") { cart.usedThisMonth = 3; topNote = null; }
        if (r === "SERVICE_DOWN") { cart.serviceDown = true; topNote = null; }
        ctx.rerender();
        root.ownerDocument.querySelector(".ws")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      root.querySelector("[data-back-co]")?.addEventListener("click", () => {
        if (view === "notCreated") return (location.href = "cart.html");
        if (view === "failedReapply") cart.applied = 0;
        view = "checkout"; ctx.render();
      });
    },
  });
})();
