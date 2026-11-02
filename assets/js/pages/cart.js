/* Cart: replica of stg.miabytanishq.com/en_IN/cart with Mia Wallet (spec 6.3, 7, 9) */
(function () {
  const M = MIA, { rs, esc, icon } = M;
  const IMG = "assets/img/";
  let cart, key = "", couponMsg = "", busy = false, couponInput = "", couponOpen = false;

  const TAG = { CUSTOM_OFFER: ["offer", "Custom offer"], DISCOUNT: ["disc", "Discount"], COUPON: ["coupon", "Coupon"], WALLET: ["wallet", "Wallet"] };
  const tag = (b) => (TAG[b] ? `<span class="s-btag s-btag--${TAG[b][0]}">${b === "WALLET" ? icon("wallet", 13) : ""}${TAG[b][1]}</span>` : "");

  function lineItems(q) {
    return q.lines
      .map((l) => `<article class="s-ci">
        <img src="${IMG}${l.img}" alt="">
        <div class="s-ci__b">
          <a class="s-ci__n" href="pdp.html" style="color:#000">${esc(l.name)}</a>
          <div class="s-ci__p">₹${new Intl.NumberFormat("en-IN").format(l.price - (l.discount || 0))}${l.discount ? `<s>₹${new Intl.NumberFormat("en-IN").format(l.price)}</s>` : ""}</div>
          ${tag(l.benefit) ? `<div class="s-ci__tags">${tag(l.benefit)}</div>` : ""}
          ${l.oos ? `<div class="s-oos">Out of stock</div>` : `<div class="s-qty" aria-label="Quantity"><button data-qty="${l.lineId}" data-d="-1" aria-label="Decrease quantity"><img src="${IMG}minus.svg" alt=""></button><span>${l.qty}</span><button data-qty="${l.lineId}" data-d="1" aria-label="Increase quantity"><img src="${IMG}plus.svg" alt=""></button></div>`}
        </div>
        <button class="s-trash" data-del="${l.lineId}" aria-label="Remove ${esc(l.name)}"><img src="${IMG}trash.svg" alt=""></button>
      </article>`)
      .join("");
  }

  function offersCard() {
    return `<section class="s-offers">
      <div class="s-offers__hd"><img src="${IMG}offer.svg" alt=""><div><div class="s-offers__t">Offers &amp; Discounts <a href="#">View Details</a></div><div class="s-offers__s">Applicable only on Select Products</div></div><button class="s-offers__btn">Explore Applicable Products</button></div>
      <div class="s-offers__lbls"><span>Unlock Savings</span><span>Next Offer</span></div>
      <div class="s-offers__vals"><span>Add products to your cart to unlock discounts</span><span>30% Off on making charges</span></div>
      <div class="s-offers__bar"></div>
      <div class="s-offers__rng"><span>₹0</span><span>₹10,000</span></div>
      <div class="s-offers__cv"><div class="l">Cart Value <small>(for Discount Applicable Products)</small><b>₹0</b></div><div class="r">Unlock Discounts<small>Add products worth ₹10,000 to unlock 30% Off</small></div></div>
    </section>`;
  }

  function couponRow(q) {
    if (cart.coupon)
      return `<section class="s-row"><img src="${IMG}promo.svg" alt=""><div class="s-row__m"><div class="s-row__t">${esc(cart.coupon)} applied</div><div class="s-row__s">You save ${rs(q.totals.coupon)}</div></div><button class="s-btn-line" data-coupon-remove>Remove</button></section>`;
    return `<section class="s-row"><img src="${IMG}promo.svg" alt=""><div class="s-row__m"><div class="s-row__t">Apply Coupons</div><div class="s-row__s">Coupons available</div></div><button class="s-btn-line" data-coupon-view>View</button></section>
      ${couponOpen || couponMsg ? `<div class="s-coupon-in"><input id="coupon" placeholder="Enter coupon code" aria-label="Coupon code" aria-describedby="coupon-err" value="${esc(couponInput)}"><button class="s-pill-rose" data-coupon-apply>Apply</button></div><div id="coupon-err" class="s-coupon-err" role="alert" aria-live="polite">${couponMsg ? esc(couponMsg) : ""}</div>` : ""}`;
  }

  M.page({
    id: "cart",
    layout: "raw",
    footer: true,
    responses: {
      label: "Apply response (server)",
      options: [
        { id: "ok", label: "200 · Success" },
        { id: "OVER_PERCENT", label: "Apply 422 · OVER_PERCENT" },
        { id: "OVER_BALANCE", label: "Apply 422 · OVER_BALANCE" },
        { id: "OVER_ABS_CAP", label: "Apply 422 · OVER_ABS_CAP" },
        { id: "BALANCE_CHANGED", label: "Apply 409 · BALANCE_CHANGED" },
        { id: "COUPON_APPLIED", label: "Apply 409 · COUPON_APPLIED" },
        { id: "MONTHLY_LIMIT", label: "Apply 409 · MONTHLY_LIMIT" },
        { id: "DOWN", label: "Apply 5xx · Service down" },
      ],
    },
    scenarios: [
      { id: "default", group: "Redeem", label: "₹1,560 available · 2 orders on hold", desc: "₹1,910 on hold from 2 orders. ‘View orders’ opens a picker showing each order, its items and amount. ‘Review & claim’ takes you to that order’s page to confirm; ‘Back to bag’ brings you here with the money added. Redeem: try ₹1,561, ₹1,560 exactly, letters, leading zeros." },
      { id: "holdOne", group: "Redeem", label: "₹1,560 available · 1 order on hold", desc: "The picker still opens with one order so the customer sees exactly which order and items." },
      { id: "noHold", group: "Redeem", label: "₹1,560 available · nothing on hold", desc: "Plain Redeem state." },
      { id: "holdMulti", group: "Redeem", label: "4 orders on hold (mixed states)", desc: "₹200 available. Two claimable, one not delivered, one high-value order where early claim is off. Claimable orders are listed first." },
      { id: "percentBinding", group: "Redeem", label: "Limit = 80% of eligible", desc: "₹25,000 balance, ₹10,000 eligible. Type ₹8,001." },
      { id: "capBinding", group: "Redeem", label: "Absolute cap on (₹1,000)", desc: "CONFIG absoluteCapPerOrder = ₹1,000 is the binding limit." },
      { id: "applied", group: "Redeem", label: "₹1,500 applied", desc: "Applied state with Edit (fresh empty modal) and Remove. ‘Wallet’ tag on eligible tiles; ‘Mia Wallet’ line in Payment Details. Change a quantity to see auto-removal." },
      { id: "mixed", group: "Redeem", label: "Mixed bag (offer + coin + eligible)", desc: "Redeem available; ‘can’t be used on 2 items’ with See why." },
      { id: "mixedApplied", group: "Redeem", label: "Mixed bag · applied", desc: "Tile tags: Custom offer / none (coin) / Wallet." },
      { id: "pending", group: "On hold only", label: "₹0 available · ₹1,910 on hold", desc: "Nothing spendable yet. ‘Claim cashback’ opens the order picker. After claiming on the order page and coming back, Redeem appears." },
      { id: "pendingNotDelivered", group: "On hold only", label: "₹0 available · on hold, not delivered", desc: "Can’t be claimed before delivery: How it works only." },
      { id: "zero", group: "On hold only", label: "₹0, nothing on hold", desc: "‘₹0 in your Mia Wallet’ + How it works." },
      { id: "noEligible", group: "Blocked", label: "All items ineligible", desc: "State 9 + info sheet." },
      { id: "coupon", group: "Blocked", label: "Coupon in bag", desc: "Remove coupon recalculates the cart first, then a fresh wallet quote." },
      { id: "couponBlocked", group: "Blocked", label: "Wallet applied, then coupon entered", desc: "Coupon blocked under the field (RED-17 build default)." },
      { id: "monthly", group: "Blocked", label: "Monthly limit reached (3 of 3)", desc: "Limit message with reset date." },
      { id: "autoCart", group: "Auto-removal", label: "Removed: bag changed", desc: "Applied amount removed after a quantity change." },
      { id: "autoOos", group: "Auto-removal", label: "Removed: item out of stock", desc: "Reason-specific notice." },
      { id: "loading", group: "System", label: "Loading", desc: "Skeleton row. Never ₹0." },
      { id: "down", group: "System", label: "Wallet service down", desc: "Checkout still works." },
    ],
    customerNote: (ctx) => (ctx.cust === "guest" ? "Guest: ‘Log in to use your Mia Wallet’ row; no estimate." : ctx.cust === "usd" ? "USD: no wallet row, no wallet line, no cashback estimate." : ctx.cust === "intl" ? "Address is chosen at checkout; switch to Checkout to test international removal." : ""),
    balance: (ctx) => (ctx.cust === "loading" || ctx.s === "loading" ? null : cart ? cart.available : 1560),
    onHold: () => (cart ? M.holdSum(cart.holdOrders) : 0),
    bagCount: () => (cart ? cart.lines.reduce((s, l) => s + l.qty, 0) : 2),
    render(ctx) {
      const k = ctx.s + "|" + ctx.cust;
      if (k !== key) {
        key = k;
        cart = new M.Cart(M.CART_FIX[ctx.s]);
        couponMsg = cart.couponError ? M.t("bm.wallet.coupon.blocked") : "";
        couponInput = cart.couponError ? "FESTIVE10" : "";
        couponOpen = !!cart.couponError;
        cart.noticeText = cart.notice ? M.t(M.REMOVED[cart.notice]) : null;
      }
      const q = cart.quote();
      const cw = { ...q, justClaimed: cart.justClaimed, notice: cart.noticeText, loading: ctx.s === "loading" || ctx.cust === "loading", guest: ctx.cust === "guest" };
      const hideWallet = ctx.cust === "usd";
      const count = cart.lines.reduce((s, l) => s + l.qty, 0);
      const worth = cart.lines.reduce((s, l) => s + (l.price - (l.discount || 0)) * l.qty, 0);
      const t = q.totals;
      return `<div class="s-cart">
        <div class="s-steps" aria-label="Checkout progress"><div class="s-step on"><i></i>Bag</div><span class="s-step-line on"></span><div class="s-step"><i></i>Order Details</div><span class="s-step-line"></span><div class="s-step"><i></i>Payment</div></div>
        <div class="s-cart__title"><b>Bag</b> <small>(${M.plural(count, "item", "items")})</small></div>
        <div class="s-cart__grid">
          <div class="s-cart__l">
            <section class="s-card s-pin"><img src="${IMG}availability.svg" alt=""><span>Check Availability</span><button class="s-link s-link--u" style="font-size:14px">Enter Pincode</button></section>
            <section class="s-prebook"><div><p class="h">Plan your Dhanteras purchase</p><p class="s">Prebook your order to get it right on time. Skip the last-minute rush.</p></div><button>Pre Book Now</button></section>
            <div class="s-worth">${count} ${count === 1 ? "item" : "items"} added worth <b>₹ ${worth}</b></div>
            ${busy ? `<div class="note note--info" role="status" style="margin-top:-12px"><span class="spin" style="width:16px;height:16px;border:2px solid var(--s-rose);border-right-color:transparent;border-radius:50%;animation:spin .7s linear infinite"></span><span>Updating your bag…</span></div>` : ""}
            <div class="s-items">${lineItems(q)}</div>
            <div class="s-wl__h">ADD FROM YOUR WISH LIST</div>
            <div class="s-wl">
              <div class="s-wl__c"><img src="${IMG}studs.jpg" alt=""><button class="add" aria-label="Add to bag">+</button><div class="n">Ballet of Heart 14KT Gold & Diamond Stud Earrings</div><div class="p">₹21,928</div></div>
              <div class="s-wl__c"><img src="${IMG}pendant.jpg" alt=""><button class="add" aria-label="Add to bag">+</button><div class="n">Dangling Hearts 14KT Gold Pendant for Her</div><div class="p">₹10,307<s>₹ 10535</s></div></div>
              <div class="s-wl__c"><img src="${IMG}silver.jpg" alt=""><button class="add" aria-label="Add to bag">+</button><div class="n">Triple Glow Silver Stud Earrings</div><div class="p">₹2,099</div></div>
            </div>
          </div>
          <div class="s-cart__r">
            ${offersCard()}
            <div>
              <section class="s-card s-tot">
                ${M.walletSection(cw, { page: "cart", hidden: hideWallet })}
                ${couponRow(q)}
                ${M.sitePaymentDetails(q, { count, showWallet: !hideWallet, showEstimate: ctx.eligible && !hideWallet })}
                <div class="s-tata"><img src="${IMG}tata.svg" alt="A Tata Product"></div>
              </section>
              <p class="s-copyr">© 2026 Titan Company Limited. All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </div>
      <div class="s-foot"><div class="s-foot__in">
        <div class="s-foot__l">Total (${count}) <span><b>₹${new Intl.NumberFormat("en-IN").format(t.payable)}</b>${t.walletApplied && !hideWallet ? `<small>${rs(t.walletApplied)} paid from Mia Wallet</small>` : ""}</span></div>
        <a class="s-btn-rose" href="checkout.html?s=${cart.applied ? "applied" : "default"}${ctx.cust !== "ok" ? "&c=" + ctx.cust : ""}">Proceed to Checkout</a>
      </div></div>`;
    },
    mount(root, ctx) {
      const app = document.getElementById("app");
      const q = () => cart.quote();
      if (!ctx._wsViewed && app.querySelector("[data-wallet-section]")) { ctx._wsViewed = true; M.track("wallet_section_view", { page: "cart", state: ctx.s }); }
      app.querySelectorAll("[data-ws]").forEach((b) =>
        b.addEventListener("click", async () => {
          const a = b.dataset.ws;
          if (a === "redeem" || a === "edit")
            M.openRedeemModal({
              cw: q(), page: "cart", resp: ctx.resp,
              onApplied: (v) => { cart.applied = v; cart.noticeText = null; ctx.rerender(); },
              onBlocked: (code) => {
                if (code === "COUPON_APPLIED") cart.coupon = "MIA500";
                if (code === "MONTHLY_LIMIT") cart.usedThisMonth = 3;
                if (code === "DOWN") cart.serviceDown = true;
                ctx.rerender();
              },
              onFigures: (cw) => { cart.available = cw.available; },
            });
          if (a === "claim") M.openHoldSheet({ orders: cart.holdOrders, back: M.here() });
          if (a === "remove") {
            M.btnBusy(b, true, "");
            await M.wait(500);
            cart.applied = 0;
            M.track("wallet_remove", { page: "cart" });
            M.toast(M.t("bm.wallet.toast.removed"));
            ctx.rerender();
          }
          if (a === "why") M.openInfoSheet(b.dataset.reason, b.dataset.reason === "COUPON" ? [] : q().ineligibleItems);
          if (a === "how") M.openHowItWorks();
          if (a === "dismiss") { cart.noticeText = null; ctx.rerender(); }
          if (a === "login") M.toast("Opens the existing login popup", "info");
          if (a === "remove-coupon") removeCoupon(ctx);
        })
      );
      app.querySelectorAll("[data-qty]").forEach((b) =>
        b.addEventListener("click", () => {
          const l = cart.lines.find((x) => x.lineId === b.dataset.qty);
          const nq = l.qty + Number(b.dataset.d);
          if (nq < 1) return;
          l.qty = nq;
          autoRemove(ctx, "cart");
        })
      );
      app.querySelectorAll("[data-del]").forEach((b) =>
        b.addEventListener("click", () => {
          if (cart.lines.length === 1) return M.toast("Prototype keeps at least one item", "info");
          cart.lines = cart.lines.filter((l) => l.lineId !== b.dataset.del);
          autoRemove(ctx, "cart");
        })
      );
      app.querySelector("[data-coupon-view]")?.addEventListener("click", () => { couponOpen = !couponOpen; ctx.rerender(); document.getElementById("coupon")?.focus(); });
      const ci = app.querySelector("#coupon");
      ci?.addEventListener("input", () => { couponInput = ci.value; });
      app.querySelector("[data-coupon-apply]")?.addEventListener("click", async (e) => {
        couponInput = ci.value.trim();
        if (!couponInput) { couponMsg = "Enter a coupon code."; return ctx.rerender(); }
        if (cart.applied) { couponMsg = M.t("bm.wallet.coupon.blocked"); ctx.rerender(); return document.getElementById("coupon")?.focus(); }
        M.btnBusy(e.currentTarget, true, "");
        await M.wait(600);
        cart.coupon = couponInput.toUpperCase(); couponMsg = ""; couponInput = ""; couponOpen = false;
        ctx.rerender();
      });
      app.querySelector("[data-coupon-remove]")?.addEventListener("click", () => removeCoupon(ctx));
    },
  });

  function autoRemove(ctx, reason) {
    if (cart.applied) {
      cart.applied = 0;
      cart.noticeText = M.t(M.REMOVED[reason]);
      M.track("wallet_auto_removed", { page: "cart", reason: reason === "cart" ? "CART_CHANGED" : "OUT_OF_STOCK" });
    }
    ctx.rerender();
  }
  async function removeCoupon(ctx) {
    // Cart recalculates first (a custom promotion may now apply), then the wallet quote refreshes.
    busy = true; ctx.rerender();
    await M.wait(900);
    cart.coupon = null; busy = false;
    ctx.rerender();
  }
})();
