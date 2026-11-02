/* Mia Wallet & Cashback prototype: shared domain components (spec sections 4.3, 6, 7, 13). */
(function () {
  const M = window.MIA;
  const { rs, date, esc, icon, config: C } = M;

  /* ---------- Content keys (section 13). bm.* are BM-configurable, res.* are resource strings. ---------- */
  const T = {
    "bm.wallet.section.title": "Use your Mia Wallet",
    "bm.wallet.section.available": "{available} available",
    "bm.wallet.section.redeem": "Redeem",
    "bm.wallet.section.applied": "{amount} applied from your Mia Wallet",
    "bm.wallet.section.left": "{amount} left",
    "bm.wallet.section.edit": "Edit",
    "bm.wallet.section.remove": "Remove",
    "bm.wallet.section.zero": "₹0 in your Mia Wallet",
    "bm.wallet.section.zeroHint": "Earn cashback on eligible orders.",
    "bm.wallet.section.pending": "{amount} cashback on hold. You can use it once the return window closes, or claim it early from your order.",
    "bm.wallet.section.coupon": "Remove your coupon to use your Mia Wallet.",
    "bm.wallet.section.monthly": "You’ve used your Mia Wallet {limit} times this month. You can use it again from {resetsOn}.",
    "bm.wallet.section.noEligible": "Items in your bag can’t use Mia Wallet.",
    "bm.wallet.section.someIneligible": "Mia Wallet can’t be used on {n} in your bag.",
    "bm.wallet.section.down": "Mia Wallet is unavailable right now. You can still place your order.",
    "bm.wallet.section.guest": "Log in to use your Mia Wallet",
    "bm.wallet.removed.cart": "We removed your wallet amount because your bag changed. Apply it again to use it.",
    "bm.wallet.removed.oos": "An item went out of stock, so we removed your wallet amount. Apply it again to use it.",
    "bm.wallet.removed.address": "Your address can’t be delivered to, so we removed your wallet amount.",
    "bm.wallet.removed.international": "Mia Wallet can only be used for delivery in India. We removed your wallet amount.",
    "bm.wallet.removed.currency": "Mia Wallet is only available in INR. We removed your wallet amount.",
    "bm.wallet.coupon.blocked": "Remove your Mia Wallet amount to use a coupon.",
    "bm.wallet.modal.title": "Use your Mia Wallet",
    "bm.wallet.modal.available": "Available: {available}",
    "bm.wallet.modal.limit": "You can use up to {limit} on this bag",
    "bm.wallet.modal.max": "Use maximum",
    "bm.wallet.modal.apply": "Apply",
    "bm.wallet.modal.err.balance": "You have {available} in your Mia Wallet.",
    "bm.wallet.modal.err.percent": "This bag can use up to {max} from your Mia Wallet.",
    "bm.wallet.modal.err.cap": "You can use up to {cap} per order.",
    "bm.wallet.modal.err.changed": "Your wallet balance changed. You now have {available}.",
    "bm.wallet.modal.err.down": "Mia Wallet is unavailable right now.",
    "bm.wallet.toast.applied": "{amount} applied",
    "bm.wallet.toast.removed": "Wallet amount removed",
    "bm.wallet.sheet.mixed.title": "Some items can’t use Mia Wallet",
    "bm.wallet.sheet.mixed.body": "Mia Wallet works on products without an offer or coupon. Coins and gift cards aren’t included.",
    "bm.wallet.sheet.none.title": "Mia Wallet can’t be used on this bag",
    "bm.wallet.sheet.coupon.title": "Coupons and Mia Wallet can’t be used together",
    "bm.wallet.sheet.coupon.body": "Remove your coupon to use your wallet, or keep your coupon and pay the rest another way.",
    "bm.wallet.payment.line": "Mia Wallet",
    "bm.wallet.checkout.balanceChanged": "Your wallet balance changed. Please apply your wallet amount again.",
    "bm.wallet.checkout.giftAdjusted": "We adjusted your gift card / Tata Neu amount to match your new total.",
    "bm.wallet.payment.failedSafe": "Your wallet amount is safe.",
    "bm.cashback.confirm.title": "{amount} cashback is on hold for this order",
    "bm.cashback.confirm.body": "It’ll be added to your Mia Wallet when the return window closes, around {creditOn}.",
    "bm.cashback.confirm.note": "Want it sooner? You can claim it early from your order page once it’s delivered. Claiming early closes returns for this order.",
    "res.cashback.block.onHold": "{amount} cashback on hold",
    "res.cashback.block.paused": "Cashback paused",
    "res.cashback.block.credited": "{amount} cashback credited",
    "res.cashback.block.claimedNote": "You claimed this cashback early on {date}, so returns are closed for this order.",
    "res.cashback.block.voided": "No cashback on this order",
    "res.cashback.claim.cta": "Claim {amount} now",
    "res.cashback.claim.title": "Claim {amount} cashback now?",
    "res.cashback.claim.body": "It’ll be added to your Mia Wallet straight away, valid till {date}.",
    "res.cashback.claim.warning": "Once you claim, you can’t return any item in this order. This can’t be undone.",
    "res.cashback.claim.confirm": "Claim and close returns",
    "res.cashback.claim.cancel": "Keep return option",
    "res.cashback.claim.success": "{amount} added to your Mia Wallet. Returns are now closed for this order.",
    "res.cashback.claim.error": "We couldn’t claim your cashback. Nothing has changed. Please try again.",
    "res.return.closedByClaim": "Returns are closed for this order because you claimed cashback early on {date}.",
    "res.return.summary.notAffected": "Your refund is not affected.",
    "res.return.requested.paused": "Return requested. This order’s cashback is paused until your return is complete.",
    "res.return.wholeOrder": "This order can only be returned in full because it used {offer}.",
    "res.return.quoteError": "We couldn’t calculate your refund. Please try again.",
    "res.wallet.title": "My Wallet",
    "res.wallet.secure": "SECURE WALLET",
    "res.wallet.tab.balance": "Total Current Balance",
    "res.wallet.tab.expiring": "Expiring Balance",
    "res.wallet.available.sub": "Ready to use on eligible products.",
    "res.wallet.viewAll": "View all",
    "res.wallet.empty.title": "Your Mia Wallet is empty",
    "res.wallet.empty.body": "Earn cashback on eligible orders. It’ll show up here.",
    "res.wallet.error": "We couldn’t load your Mia Wallet.",
    "res.wallet.expiring.headline": "{amount} expiring in the next {days} days",
    "res.wallet.expiring.none": "Nothing expiring in the next {days} days.",
    "res.wallet.chip.active": "Active",
    "res.wallet.chip.soon": "Expiring soon",
    "res.wallet.chip.expired": "Expired",
    "res.wallet.chip.projected": "Projected",
  };
  M.t = (key, vars = {}) => (T[key] || key).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? "{" + k + "}"));

  /* ---------- CashbackBadge (section 3) ---------- */
  M.cashbackBadge = (state) => {
    const map = {
      ON_HOLD_PENDING_DELIVERY: ["neutral", "clock", "On hold"],
      ON_HOLD: ["neutral", "clock", "On hold"],
      PAUSED: ["warn", "pause", "Paused for return"],
      CREDITED: ["pos", "check", "Credited"],
      VOIDED: ["mute", "ban", "Not applicable"],
    };
    const m = map[state];
    return m ? `<span class="badge badge--${m[0]}">${icon(m[1], 13)}${m[2]}</span>` : "";
  };

  /* ---------- How it works (6.10), CONFIG-driven ---------- */
  M.howItWorksList = () => `<dl>
      <div><dt>Earning</dt><dd>Eligible orders earn cashback, worked out on the part you pay with card, UPI and similar. It’s held until the return window closes (${C.silverReturnDays} days for silver, ${C.otherReturnDays} days for other jewellery), then added to your Mia Wallet.</dd></div>
      <div><dt>Claim early</dt><dd>Want it sooner? Claim it from your order page after delivery. Claiming closes returns for that order.</dd></div>
      <div><dt>Spending</dt><dd>Use it on products without an offer or coupon, up to ${C.redemptionPercent}% of their value. Coins and gift cards aren’t included.</dd></div>
      <div><dt>Returns</dt><dd>Refunds are always in full. Returning an order cancels or reduces its cashback on hold.</dd></div>
      <div><dt>Expiry</dt><dd>Each credit has its own expiry date, shown in the Expiring Balance tab. We use the one expiring soonest first.</dd></div>
    </dl>`;
  M.howItWorks = (open = false) => `<details class="acc" ${open ? "open" : ""}><summary>How Mia Wallet works ${icon("chevronDown", 18)}</summary>${M.howItWorksList()}</details>`;
  M.openHowItWorks = () =>
    M.modal({ label: "How Mia Wallet works", html: `<h2>How Mia Wallet works</h2><div class="acc" style="border:0;margin-top:12px">${M.howItWorksList()}</div><div class="dlg__actions"><button class="btn btn--soft" data-close>Got it</button></div>` })
      .el.querySelector("[data-close]")
      .addEventListener("click", (e) => e.target.closest(".ov").querySelector(".dlg__x").click());

  /* ---------- Cashback block on order details (6.7) ---------- */
  // cb: { state, amount, originalAmount, delivered, deliveredOn, creditOn, creditedOn, expiresOn, claimedEarly, claimedOn, claim:{available, reason}, voidReason, returnOutcome }
  M.cashbackBlock = (cb, order) => {
    if (!cb || cb.state === "NONE") return "";
    const amt = rs(cb.amount);
    let cls = "hold", ico = "clock", title = "", body = "", actions = "", extra = "";
    const timeline = (stage) => {
      const steps = [
        ["Order placed", date(order.placedOn, true)],
        ["Delivered", cb.deliveredOn ? date(cb.deliveredOn, true) : "Pending"],
        ["Added to wallet", cb.creditOn ? date(cb.creditOn, true) : "After return window"],
      ];
      return `<div class="timeline" aria-label="Cashback timeline">${steps
        .map((s, i) => `<div class="tl ${i < stage ? "done" : i === stage ? "now" : ""}"><b>${s[0]}</b>${s[1]}</div>`)
        .join("")}</div>`;
    };
    switch (cb.state) {
      case "ON_HOLD_PENDING_DELIVERY":
        title = M.t("res.cashback.block.onHold", { amount: amt });
        body = "It’ll be added to your Mia Wallet after the return window closes. You can claim it early once your order is delivered.";
        extra = timeline(1);
        actions = `<button class="link" data-how>How cashback works</button>`;
        break;
      case "ON_HOLD":
        title = M.t("res.cashback.block.onHold", { amount: amt });
        if (cb.claim && cb.claim.available) {
          body = `It’ll be added on ${date(cb.creditOn)}, when the return window closes. Want it now? Claim it early, but you won’t be able to return any item in this order.`;
          actions = `<button class="btn btn--primary btn--sm" data-claim>${M.t("res.cashback.claim.cta", { amount: amt })}</button><button class="link link--muted" data-how>How cashback works</button>`;
        } else {
          body = `It’ll be added on ${date(cb.creditOn)}, when the return window closes.`;
          actions = `<button class="link" data-how>How cashback works</button>`;
        }
        if (cb.originalAmount && cb.originalAmount !== cb.amount) body += ` Updated from ${rs(cb.originalAmount)} after your return.`;
        extra = timeline(2);
        break;
      case "PAUSED":
        cls = "paused"; ico = "pause";
        title = M.t("res.cashback.block.paused");
        body = `${amt} is paused. Your return is in progress. We’ll update this order’s cashback once it’s complete.`;
        actions = `<a class="link" href="return.html?s=requested">Return details ${icon("arrowRight", 14)}</a>`;
        break;
      case "CREDITED":
        cls = "credited"; ico = "checkCircle";
        title = M.t("res.cashback.block.credited", { amount: amt });
        if (cb.claimedEarly) body = M.t("res.cashback.block.claimedNote", { date: date(cb.claimedOn) });
        else if (cb.originalAmount && cb.originalAmount !== cb.amount) body = `Updated from ${rs(cb.originalAmount)} after your return. Added on ${date(cb.creditedOn)} · valid till ${date(cb.expiresOn)}.`;
        else body = `Added on ${date(cb.creditedOn)} · valid till ${date(cb.expiresOn)}.`;
        actions = `<a class="btn btn--soft btn--sm" href="wallet.html">Go to Mia Wallet ${icon("arrowRight", 16)}</a>`;
        break;
      case "VOIDED":
        cls = "voided"; ico = "ban";
        title = M.t("res.cashback.block.voided");
        body = `This order was ${cb.voidReason || "cancelled"}, so its cashback was cancelled. Your refund was not affected.`;
        break;
    }
    return `<section class="cb cb--${cls}" aria-labelledby="cb-title">
      <div class="cb__hd"><div class="cb__ico">${icon(ico, 22)}</div>
        <div style="flex:1;min-width:0"><div class="row-between" style="align-items:flex-start"><div class="cb__title" id="cb-title">${title}</div>${M.cashbackBadge(cb.state)}</div>
        <p class="cb__body">${body}</p></div></div>
      ${extra}
      ${actions ? `<div class="cb__actions">${actions}</div>` : ""}
    </section>`;
  };

  /* ---------- Claim cashback early modal (6.8) ---------- */
  // opts: { orderNo, amount, items (count or item list), returnsTill, expiresIfClaimedToday, resp, back:{href,label}, onSuccess(cb), onConflict(code) }
  M.openClaimModal = (opts) => {
    const key = M.uuid(); // one idempotency key per modal open
    M.track("cashback_claim_open", { orderNo: opts.orderNo });
    const amt = rs(opts.amount);
    const list = Array.isArray(opts.items) ? opts.items : null;
    // Each item keeps its own return window (7 days silver, 30 days others), so show it per item.
    const itemWindow = (it) => {
      const end = opts.deliveredOn && M.returnWindowEnd ? M.returnWindowEnd({ deliveredOn: opts.deliveredOn }, it) : opts.returnsTill;
      if (!end) return "";
      return M.daysUntil(end) < 0 ? "return window already closed" : `returnable till ${date(end, true)} if you don’t claim`;
    };
    const count = list ? list.length : opts.items || 1;
    const itemsBlock = list
      ? `<div class="claim-items"><div class="claim-items__hd">You won’t be able to return ${count === 1 ? "this item" : `these ${count} items`}</div>${list
          .map((it) => `<div class="claim-item"><img src="assets/img/${esc(it.img || "ring.jpg")}" alt=""><div><div class="claim-item__n">${esc(it.name)}</div><div class="claim-item__s">${rs(it.price)} · ${itemWindow(it)}</div></div></div>`)
          .join("")}<div class="claim-items__ft">Order #${esc(opts.orderNo)}</div></div>`
      : `<div class="row small muted" style="margin-top:16px;gap:8px">${icon("box", 16)}<span>Order #${esc(opts.orderNo)} · ${M.plural(count, "item", "items")}</span></div>`;
    const confirmView = (err) => `
      <h2 id="claim-title">${M.t("res.cashback.claim.title", { amount: amt })}</h2>
      <p class="muted" style="margin-top:8px">${M.t("res.cashback.claim.body", { date: date(opts.expiresIfClaimedToday) })}</p>
      <div class="warn-box" style="margin-top:18px">${icon("lock", 20)}<div><strong>Once you claim, you can’t return any item in this order.</strong> This can’t be undone.</div></div>
      ${itemsBlock}
      <div class="note note--err" role="alert" style="margin-top:14px;${err ? "" : "display:none"}" data-err>${icon("alert")}<span>${M.t("res.cashback.claim.error")}</span></div>
      <div class="dlg__actions">
        <button class="btn btn--primary" data-confirm>${M.t("res.cashback.claim.confirm")}</button>
        <button class="btn btn--ghost" data-keep autofocus>${M.t("res.cashback.claim.cancel")}</button>
      </div>`;
    const m = M.modal({
      label: "Claim cashback",
      html: confirmView(false),
      onClose: (r) => { if (state === "confirm") M.track("cashback_claim_cancel", { orderNo: opts.orderNo }); },
    });
    let state = "confirm";
    let inFlight = false;
    const wire = () => {
      m.body.querySelector("[data-keep]")?.addEventListener("click", () => m.close("keep"));
      m.body.querySelector("[data-confirm]")?.addEventListener("click", async (e) => {
        if (inFlight) return;
        inFlight = true;
        m.locked = true;
        const btn = e.currentTarget;
        m.body.querySelector("[data-err]").style.display = "none";
        m.body.querySelector("[data-keep]").disabled = true;
        M.btnBusy(btn, true, "Claiming…");
        M.track("cashback_claim_confirm", { orderNo: opts.orderNo, amount: opts.amount, idempotencyKey: key });
        await M.wait(1100);
        inFlight = false;
        m.locked = false;
        const r = opts.resp || "ok";
        if (r === "ok") {
          state = "done";
          m.setHTML(`<div style="text-align:center;padding-top:8px">
              <div class="success-hero" style="padding:8px 0 4px"><div class="tick">${icon("check", 30)}</div></div>
              <h2 style="padding:0">${amt} added</h2>
              <p class="muted" style="margin-top:8px">${M.t("res.cashback.claim.success", { amount: amt })}</p>
            </div>
            <div class="dlg__actions">${opts.back
              ? `<a class="btn btn--primary" href="${esc(opts.back.href)}">${esc(opts.back.label)}</a><button class="btn btn--ghost" data-done autofocus>Stay on this order</button>`
              : `<a class="btn btn--primary" href="wallet.html">Go to Mia Wallet</a><button class="btn btn--ghost" data-done autofocus>Done</button>`}</div>`);
          m.body.querySelector("[data-done]").addEventListener("click", () => m.close("done"));
          opts.onSuccess && opts.onSuccess();
        } else if (r === "network") {
          M.track("cashback_claim_error", { code: "NETWORK" });
          m.setHTML(confirmView(true));
          wire();
          m.body.querySelector("[data-confirm]").focus();
        } else {
          state = "conflict";
          M.track("cashback_claim_error", { code: r });
          const msg = {
            RETURN_IN_PROGRESS: "You have a return in progress, so cashback can’t be claimed right now.",
            WINDOW_CLOSED: "The return window has closed, so your cashback is being added automatically.",
          }[r] || "Cashback can’t be claimed for this order.";
          m.setHTML(`<h2>Cashback not claimed</h2><div class="note note--info" role="alert" style="margin-top:14px">${icon("info")}<span>${msg}</span></div><div class="dlg__actions"><button class="btn btn--primary" data-ok autofocus>OK</button></div>`);
          m.body.querySelector("[data-ok]").addEventListener("click", () => { m.close("conflict"); opts.onConflict && opts.onConflict(r); });
        }
      });
    };
    wire();
    return m;
  };

  /* ---------- On-hold cashback (manual claim) shared across pages ---------- */
  M.holdSum = (list) => (list || []).reduce((t, o) => t + o.amount, 0);
  M.claimableSum = (list) => (list || []).filter((o) => o.claim && o.claim.available).reduce((t, o) => t + o.amount, 0);

  // Where the customer came from, so the order page can send them back after claiming.
  M.backLabel = (href) => (/^cart/.test(href) ? "Back to bag" : /^checkout/.test(href) ? "Back to checkout" : /^wallet/.test(href) ? "Back to My Wallet" : /^orders/.test(href) ? "Back to My Orders" : "Go back");
  M.here = () => location.pathname.split("/").pop() + location.search;
  M.claimHref = (o, back, review = true) => `order-details.html?s=${o.sid}${review ? "&claim=1" : ""}${back ? "&back=" + encodeURIComponent(back) : ""}`;

  // One on-hold order: which order, what was bought, how much, and what claiming costs.
  M.holdOrderCard = (o, back) => {
    const can = o.claim && o.claim.available;
    const shown = o.items.slice(0, 3);
    const thumbs = shown.map((it) => `<img src="assets/img/${esc(it.img || "ring.jpg")}" alt="">`).join("") + (o.items.length > 3 ? `<span class="hoc__more">+${o.items.length - 3}</span>` : "");
    const names = o.items.map((it) => esc(it.name)).join(", ");
    const days = o.creditOn ? M.daysUntil(o.creditOn) : null;
    const status = can
      ? `${icon("undo", 14)}<span>Returns open <b>${M.returnWindowsText(o)}</b>. If you don’t claim, it’s added automatically ${days <= 1 ? "tomorrow" : `in ${days} days`}.</span>`
      : o.claim && o.claim.reason === "NOT_DELIVERED"
        ? `${icon("truck", 14)}<span>Not delivered yet. You can claim it after delivery.</span>`
        : o.claim && o.claim.reason === "RETURN_IN_PROGRESS"
          ? `${icon("pause", 14)}<span>Return in progress. Cashback is paused.</span>`
          : `${icon("clock", 14)}<span>Added automatically on <b>${date(o.creditOn, true)}</b>. Early claim isn’t available for this order.</span>`;
    return `<article class="hoc ${can ? "" : "is-off"}">
      <div class="hoc__top">
        <div><div class="hoc__no">Order #${esc(o.orderNo)}</div><div class="hoc__meta">${o.delivered ? `Delivered ${date(o.deliveredOn, true)}` : `Placed ${date(o.placedOn, true)}`} · ${M.plural(o.items.length, "item", "items")}</div></div>
        <div class="hoc__amt"><span class="num">${rs(o.amount)}</span><small>on hold</small></div>
      </div>
      <div class="hoc__items"><div class="hoc__thumbs">${thumbs}</div><div class="hoc__names">${names}</div></div>
      <div class="hoc__ft"><div class="hoc__st">${status}</div>${can ? `<a class="s-pill-rose hoc__cta" href="${M.claimHref(o, back)}">Review &amp; claim</a>` : `<a class="s-link small hoc__cta" href="${M.claimHref(o, back, false)}">View order</a>`}</div>
    </article>`;
  };

  // Picker shown from every Claim entry point. Each order links to its order page, where the claim is confirmed.
  M.openHoldSheet = ({ orders, back }) => {
    const list = [...orders].sort((x, y) => (y.claim && y.claim.available ? 1 : 0) - (x.claim && x.claim.available ? 1 : 0));
    const total = M.holdSum(list), can = M.claimableSum(list);
    M.track("cashback_hold_sheet_open", { orders: list.length, total });
    const m = M.modal({
      label: "Cashback on hold",
      cls: "dlg--wide",
      html: `<h2>Cashback on hold</h2>
        <p class="muted" style="margin-top:6px"><b class="num" style="color:var(--ink)">${rs(total)}</b> across ${M.plural(list.length, "order", "orders")}${can && can !== total ? `, ${rs(can)} can be claimed now` : ""}. Choose an order to see its items and claim its cashback.</p>
        <div class="hoc-list">${list.map((o) => M.holdOrderCard(o, back)).join("")}</div>
        <div class="note note--warn" style="margin-top:14px">${icon("lock")}<span>Claiming closes returns for <b>every item</b> in that order. You’ll confirm on the order page, and you can come straight back here afterwards.</span></div>
        <div class="dlg__actions"><button class="btn btn--ghost" data-close>Not now</button></div>`,
    });
    m.body.querySelector("[data-close]").addEventListener("click", () => m.close());
    return m;
  };

  // Strip that sits under a wallet summary wherever the customer might want to spend.
  M.holdStrip = (orders, { cta = true, context = "" } = {}) => {
    const total = M.holdSum(orders);
    if (!total) return "";
    const can = M.claimableSum(orders);
    const n = orders.length;
    const text = can
      ? `<span><b class="num">${rs(total)}</b> cashback on hold from ${M.plural(n, "order", "orders")}${can < total ? ` (${rs(can)} claimable now)` : ""}. Claim it to use it${context}.</span>`
      : `<span><b class="num">${rs(total)}</b> cashback on hold from ${M.plural(n, "order", "orders")}. It’s added when the return window closes.</span>`;
    return `<div class="s-hold">${icon("clock", 18)}${text}<button class="s-link" data-ws="claim">${can && cta ? "View orders" : "See orders"}</button></div>`;
  };

  /* ---------- Wallet section for cart and checkout (6.3), styled as a row of the live cart totals card ---------- */
  // cw: { guest, loading, serviceDown, available, holdOrders[], limit, maxByPercent, absoluteCap, usedThisMonth, monthlyLimit, resetsOn, blockers[], ineligibleItems[], applied, notice }
  M.walletSection = (cw, { page = "cart", hidden = false } = {}) => {
    if (hidden) return "";
    const wic = `<img class="wic" src="assets/img/ic-wallet.svg" alt="">`;
    const row = (title, sub, action = "", extra = "", cls = "") =>
      `<section class="s-row ${cls}" aria-label="Mia Wallet" data-wallet-section>${wic}<div class="s-row__m"><div class="s-row__t">${title}</div>${sub ? `<div class="s-row__s">${sub}</div>` : ""}</div>${action}</section>${extra ? `<div class="s-wsx">${extra}</div>` : ""}`;
    if (cw.guest) return row(M.t("bm.wallet.section.guest"), "See your balance and cashback after you log in.", `<button class="s-btn-line" data-ws="login">Log in</button>`);
    if (cw.loading)
      return `<section class="s-row" aria-busy="true" aria-label="Loading Mia Wallet"><div class="skel" style="width:38px;height:38px;border-radius:50%"></div><div class="s-row__m"><div class="skel" style="height:14px;width:45%"></div><div class="skel" style="height:12px;width:30%;margin-top:8px"></div></div><div class="skel" style="height:38px;width:84px;border-radius:30px"></div></section>`;
    if (cw.serviceDown) return row("Mia Wallet", M.t("bm.wallet.section.down"));

    const holds = cw.holdOrders || [];
    const holdTotal = M.holdSum(holds);
    const can = M.claimableSum(holds);
    const notice = cw.notice ? `<div class="note note--warn" role="status">${icon("info")}<span>${esc(cw.notice)}</span><button class="x" aria-label="Dismiss" data-ws="dismiss">${icon("x", 16)}</button></div>` : "";
    const claimedList = cw.justClaimed || [];
    const done = claimedList.length && !cw.applied
      ? `<div class="note note--pos" role="status">${icon("checkCircle")}<span><b>${rs(M.holdSum(claimedList))}</b> claimed from order${claimedList.length > 1 ? "s" : ""} ${claimedList.map((x) => "#" + esc(x.orderNo)).join(", ")} is now available. Tap Redeem to use it on this bag.</span></div>`
      : "";
    const nInel = (cw.ineligibleItems || []).length;
    const mixed = nInel ? `<div class="row small" style="gap:8px;color:var(--s-grey)">${icon("info", 16)}<span>${M.t("bm.wallet.section.someIneligible", { n: M.plural(nInel, "item", "items") })}</span><button class="s-link small" data-ws="why" data-reason="MIXED">See why</button></div>` : "";
    const sub = `<b class="num">${rs(cw.available)}</b> available${holdTotal ? ` · <span class="num">${rs(holdTotal)}</span> on hold` : ""}`;

    if (cw.applied)
      return row(
        M.t("bm.wallet.section.applied", { amount: `<span class="num">${rs(cw.applied)}</span>` }),
        M.t("bm.wallet.section.left", { amount: rs(cw.available - cw.applied) }) + (holdTotal ? ` · ${rs(holdTotal)} on hold` : ""),
        `<button class="s-btn-line" data-ws="edit">${M.t("bm.wallet.section.edit")}</button><button class="s-btn-line" data-ws="remove">${M.t("bm.wallet.section.remove")}</button>`,
        mixed + (holdTotal ? M.holdStrip(holds, { context: " on this bag" }) : "") + notice
      );
    if (cw.available === 0 && holdTotal > 0)
      return row(
        `<span class="num">${rs(holdTotal)}</span> cashback on hold`,
        `From ${M.plural(holds.length, "order", "orders")}. ${can ? "Claim it to use it on this bag, or wait till the return window closes." : "You can use it once the return window closes."}`,
        `<button class="${can ? "s-pill-rose" : "s-btn-line"}" data-ws="claim">${can ? "Claim cashback" : "See orders"}</button>`,
        can ? `<div class="xs" style="color:var(--s-grey)">Claiming closes returns for that order.</div>` + notice : notice
      );
    if (cw.available === 0) return row(M.t("bm.wallet.section.zero"), M.t("bm.wallet.section.zeroHint"), `<button class="s-btn-line" data-ws="how">How it works</button>`, notice);
    const b = cw.blockers || [];
    if (b.includes("COUPON_APPLIED"))
      return row("Mia Wallet", sub, "", `<div class="note note--info">${icon("tag")}<span>${M.t("bm.wallet.section.coupon")}</span></div><div class="row" style="gap:16px"><button class="s-btn-line" data-ws="remove-coupon">Remove coupon</button><button class="s-link small" data-ws="why" data-reason="COUPON">Why?</button></div>`);
    if (b.includes("MONTHLY_LIMIT"))
      return row("Mia Wallet", sub, "", `<div class="note note--info">${icon("clock")}<span>${M.t("bm.wallet.section.monthly", { limit: cw.monthlyLimit, resetsOn: date(cw.resetsOn, true) })}</span></div>`);
    if (b.includes("NO_ELIGIBLE_ITEMS"))
      return row("Mia Wallet", sub, "", `<div class="note note--info">${icon("info")}<span>${M.t("bm.wallet.section.noEligible")}</span><button class="s-link small" style="margin-left:auto" data-ws="why" data-reason="NO_ELIGIBLE">Why?</button></div>`);
    return row(M.t("bm.wallet.section.title"), sub, `<button class="s-pill-rose" data-ws="redeem">${M.t("bm.wallet.section.redeem")}</button>`, done + mixed + M.holdStrip(holds, { context: " on this bag" }) + notice);
  };

  /* ---------- Wallet info sheet (BM-configurable per reason) ---------- */
  const REASON = { OFFER: "Offer applied", DISCOUNT: "Discount applied", COUPON: "Coupon applied", COIN: "Coins aren’t included", GIFT_CARD: "Gift cards aren’t included" };
  M.openInfoSheet = (reason, items = []) => {
    M.track("wallet_info_sheet_view", { reason });
    const title = { MIXED: M.t("bm.wallet.sheet.mixed.title"), NO_ELIGIBLE: M.t("bm.wallet.sheet.none.title"), COUPON: M.t("bm.wallet.sheet.coupon.title") }[reason];
    const body = reason === "COUPON" ? M.t("bm.wallet.sheet.coupon.body") : M.t("bm.wallet.sheet.mixed.body");
    const list = items.length
      ? `<ul class="list" style="margin-top:12px">${items.map((it) => `<li class="li">${M.thumb(it.kind)}<div class="li__main"><div class="li__title" style="font-weight:500">${esc(it.name)}</div><div class="li__sub">${REASON[it.reason] || ""}</div></div></li>`).join("")}</ul>`
      : "";
    const m = M.modal({
      label: title,
      html: `<div class="empty__art" style="width:64px;height:64px;margin:4px 0 14px">${icon(reason === "COUPON" ? "tag" : "wallet", 28)}</div><h2>${title}</h2><p class="muted" style="margin-top:8px">${body}</p>${list}<div class="dlg__actions"><button class="btn btn--soft" data-close autofocus>Got it</button></div>`,
    });
    m.body.querySelector("[data-close]").addEventListener("click", () => m.close());
  };

  /* ---------- Redeem modal (section 7) ---------- */
  // opts: { cw, page, resp, onApplied(amount), onBlocked(code), onFigures(cw) }
  M.openRedeemModal = (opts) => {
    const cw = { ...opts.cw };
    M.track("wallet_redeem_open", { page: opts.page });
    const limits = () => {
      const l = [["balance", cw.available], ["percent", cw.maxByPercent]];
      if (cw.absoluteCap) l.push(["cap", cw.absoluteCap]);
      l.sort((a, b) => a[1] - b[1]);
      return { limit: l[0][1], binding: l[0][0] };
    };
    const msgFor = (binding, figs = cw) =>
      binding === "balance" ? M.t("bm.wallet.modal.err.balance", { available: rs(figs.available) })
        : binding === "percent" ? M.t("bm.wallet.modal.err.percent", { max: rs(figs.maxByPercent) })
        : M.t("bm.wallet.modal.err.cap", { cap: rs(figs.absoluteCap) });

    const html = () => {
      const { limit } = limits();
      return `<h2 id="rd-title">${M.t("bm.wallet.modal.title")}</h2>
        <div class="row-between" style="margin-top:14px;padding:14px 16px;background:var(--canvas);border-radius:14px">
          <div><div class="xs muted">Available</div><div class="strong num" data-avail>${rs(cw.available)}</div></div>
          <div style="text-align:right"><div class="xs muted">Usable on this bag</div><div class="strong num" style="color:var(--rose)" data-limit>${rs(limit)}</div></div>
        </div>
        <label for="rd-amt" class="small strong" style="display:block;margin:18px 0 8px">Amount to use</label>
        <div class="amount-field" data-field><span aria-hidden="true">₹</span><input id="rd-amt" type="text" inputmode="numeric" autocomplete="off" maxlength="7" placeholder="0" aria-describedby="rd-help rd-err" autofocus></div>
        <div class="row-between" style="margin-top:10px"><span id="rd-help" class="xs muted">${M.t("bm.wallet.modal.limit", { limit: rs(limit) })}</span><button type="button" class="chip-btn" data-max>${M.t("bm.wallet.modal.max")}</button></div>
        <div id="rd-err" class="field-err" role="alert" aria-live="polite"></div>
        <div class="dlg__actions"><button class="btn btn--primary" data-apply disabled>${M.t("bm.wallet.modal.apply")}</button><button class="btn btn--ghost" data-cancel>Cancel</button></div>`;
    };
    const m = M.modal({ label: "Use your Mia Wallet", html: html() });
    let inFlight = false;
    const $ = (s) => m.body.querySelector(s);
    const input = $("#rd-amt"), err = $("#rd-err"), field = $("[data-field]"), apply = $("[data-apply]");
    const setErr = (msg) => { err.textContent = msg || ""; field.classList.toggle("is-err", !!msg); input.setAttribute("aria-invalid", msg ? "true" : "false"); };
    const validate = () => {
      const v = parseInt(input.value || "0", 10);
      const { limit, binding } = limits();
      if (!v) { setErr(""); apply.disabled = true; return 0; }
      if (v > limit) { setErr(msgFor(binding)); apply.disabled = true; return 0; }
      setErr(""); apply.disabled = false; return v;
    };
    const refreshFigures = () => {
      const { limit } = limits();
      $("[data-avail]").textContent = rs(cw.available);
      $("[data-limit]").textContent = rs(limit);
      $("#rd-help").textContent = M.t("bm.wallet.modal.limit", { limit: rs(limit) });
      opts.onFigures && opts.onFigures(cw);
    };
    input.addEventListener("input", () => {
      // Digits only, no leading zeros, max 7 digits, whole rupees.
      const clean = input.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 7);
      if (clean !== input.value) input.value = clean;
      validate();
    });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !apply.disabled) apply.click(); });
    $("[data-max]").addEventListener("click", () => { input.value = String(limits().limit); validate(); input.focus(); });
    $("[data-cancel]").addEventListener("click", () => m.close("cancel"));
    apply.addEventListener("click", async () => {
      if (inFlight) return; // spam guard
      const v = validate();
      if (!v) return;
      inFlight = true; m.locked = true;
      input.readOnly = true; $("[data-max]").disabled = true; $("[data-cancel]").disabled = true;
      M.btnBusy(apply, true, "Applying…");
      await M.wait(900);
      inFlight = false; m.locked = false;
      input.readOnly = false; $("[data-max]").disabled = false; $("[data-cancel]").disabled = false;
      M.btnBusy(apply, false);
      const r = opts.resp || "ok";
      if (r === "ok") {
        M.track("wallet_apply_success", { page: opts.page, amount: v });
        m.close("applied");
        M.toast(M.t("bm.wallet.toast.applied", { amount: rs(v) }));
        opts.onApplied(v);
        return;
      }
      M.track("wallet_apply_error", { page: opts.page, code: r });
      if (r === "OVER_PERCENT" || r === "OVER_BALANCE" || r === "OVER_ABS_CAP") {
        // Server returns its own (lower) figures; show the matching message and refresh the limit.
        const serverFig = Math.max(100, Math.floor((v * 0.7) / 100) * 100);
        if (r === "OVER_PERCENT") cw.maxByPercent = serverFig;
        if (r === "OVER_BALANCE") cw.available = serverFig;
        if (r === "OVER_ABS_CAP") cw.absoluteCap = serverFig;
        refreshFigures();
        setErr(msgFor(r === "OVER_PERCENT" ? "percent" : r === "OVER_BALANCE" ? "balance" : "cap"));
        apply.disabled = true;
        input.focus();
      } else if (r === "BALANCE_CHANGED") {
        cw.available = Math.max(100, Math.floor((cw.available * 0.6) / 10) * 10);
        refreshFigures();
        setErr(M.t("bm.wallet.modal.err.changed", { available: rs(cw.available) }));
        validate() || setErr(M.t("bm.wallet.modal.err.changed", { available: rs(cw.available) }));
        input.focus();
      } else if (r === "COUPON_APPLIED" || r === "MONTHLY_LIMIT") {
        m.close("blocked");
        opts.onBlocked(r);
      } else if (r === "DOWN") {
        setErr(M.t("bm.wallet.modal.err.down"));
        apply.disabled = true; input.readOnly = true; m.locked = true;
        setTimeout(() => { m.locked = false; m.close("down"); opts.onBlocked("DOWN"); }, 2000);
      }
    });
    return m;
  };

  /* ---------- Refund summary (6.9, manual approach) ---------- */
  // q: { itemValue, refundTo:[{method,label,amount}], cashback:{current, afterReturn, effect} | null }
  M.refundSummary = (q, { title = "Refund summary", loading = false, error = false } = {}) => {
    if (loading)
      return `<section class="rs" aria-busy="true"><div class="rs__hd"><h3>${title}</h3></div><div class="rs__bd"><div class="kv"><div class="skel" style="height:14px;width:40%"></div><div class="skel" style="height:14px;width:20%"></div></div><div class="kv"><div class="skel" style="height:14px;width:55%"></div><div class="skel" style="height:14px;width:24%"></div></div></div><div class="rs__cb"><div class="skel" style="height:14px;width:70%"></div></div></section>`;
    if (error)
      return `<section class="rs"><div class="rs__hd"><h3>${title}</h3></div><div class="rs__bd" style="padding:16px 20px"><div class="note note--err" role="alert">${icon("alert")}<span>${M.t("res.return.quoteError")}</span><button class="link" style="margin-left:auto" data-retry>${icon("refresh", 14)} Retry</button></div></div></section>`;
    const meth = { CARD: "card", UPI: "card", NETBANKING: "card", BANK_TRANSFER: "card", WALLET: "wallet" };
    const cb = q.cashback;
    const effect = cb
      ? cb.effect === "VOIDED"
        ? `<span class="rs__flow"><s>${rs(cb.current)}</s>${icon("arrowRight", 14)}${rs(0)}</span> <span class="badge badge--mute" style="height:22px">Cancelled</span>`
        : cb.effect === "RECALCULATED"
          ? `<span class="rs__flow"><s>${rs(cb.current)}</s>${icon("arrowRight", 14)}${rs(cb.afterReturn)}</span> <span class="badge badge--neutral" style="height:22px">Updated</span>`
          : `<span class="rs__flow">${rs(cb.current)}</span> <span class="badge badge--neutral" style="height:22px">No change</span>`
      : "";
    return `<section class="rs" aria-live="polite">
      <div class="rs__hd"><h3>${title}</h3><span class="xs muted">Full refund</span></div>
      <div class="rs__bd">
        <div class="kv"><span class="k">Item value</span><span class="v">${rs(q.itemValue)}</span></div>
        ${q.refundTo
          .map((d) => `<div class="kv"><span class="k row" style="gap:8px">${icon(meth[d.method] || "card", 16)}You’ll receive <span class="muted">to your ${esc(d.label)}</span></span><span class="v strong">${rs(d.amount)}</span></div>`)
          .join("")}
      </div>
      ${cb ? `<div class="rs__cb"><div class="row-between" style="flex-wrap:wrap"><span>Cashback for this order</span><span class="row" style="gap:8px">${effect}</span></div><div class="row xs" style="gap:6px;color:var(--pos)">${icon("shield", 14)}${M.t("res.return.summary.notAffected")}</div></div>` : ""}
    </section>`;
  };
})();
