/* Checkout: replica of the live "Order Details" step (stg.miabytanishq.com/en_IN/checkout) with Mia Wallet added
   to "Redeem Points & Gift Cards", a Mia Wallet line in Payment Details and the cashback estimate (spec 6.4, 9). */
(function () {
  const M = MIA, { rs, esc, icon } = M;
  const IMG = "assets/img/";
  const g = (n) => new Intl.NumberFormat("en-IN").format(n);
  let released = 0, cart, key = "", addrId = "home", stage = "selected", addrError = null, topNote = null, oosOnContinue = false, afterPay = null;

  const ADDR = [
    { id: "home", name: "test test", line: "test ,BENGALURU URBAN 560111", phone: "6061161616" },
    { id: "bad", name: "test test", line: "Kibithu ,ANJAW 792104", phone: "6061161616", unserviceable: true },
    { id: "intl", name: "test test", line: "Business Bay ,DUBAI United Arab Emirates", phone: "6061161616", isd: "971", intl: true },
  ];
  const addr = () => ADDR.find((a) => a.id === addrId);
  const DETAILS = { L1: { weight: "1.467 g" }, L2: { weight: "1.2 g" }, L3: { weight: "2.1 g" }, L4: { weight: "0.5 g" }, L5: { weight: "6.8 g" } };
  const NEU_COINS = 500;
  const GIFT = 2000;

  /* ---------- Left column ---------- */
  function addressList() {
    return ADDR.map((a) => `<div class="co-ad">
        <div class="co-ad__m">
          <div class="co-ad__n">${esc(a.name)}</div>
          <div class="co-ad__l">${esc(a.line)}</div>
          <div class="co-ad__p">+ ${a.isd || "91"} ${esc(a.phone)}</div>
          <div class="co-ad__act"><button class="co-ad__edit" type="button" data-toast>Edit</button><button class="co-ad__del" type="button" aria-label="Delete address" data-toast><img src="${IMG}trash.svg" alt=""></button></div>
        </div>
        <button class="co-use" type="button" data-use="${a.id}">Use this Address</button>
      </div>`).join("");
  }

  function selectedAddress() {
    const a = addr();
    return `<div class="co-sel">
        <div class="co-sel__top">
          <div class="co-sel__m">
            <div class="co-ad__n">${esc(a.name)}</div>
            <div class="co-sel__l">${esc(a.line)}</div>
            <div class="co-ad__p">+ ${a.isd || "91"} ${esc(a.phone)}</div>
          </div>
          <button class="co-chg" type="button" data-change>Change Address</button>
        </div>
        ${addrError ? `<p class="co-err" role="alert">${esc(addrError)}</p>` : ""}
        <label class="co-chk"><input type="checkbox" checked><span>Billing address is same as shipping address</span></label>
      </div>
      <p class="co-hint">Please click “Change Address” to edit Shipping/Billing address</p>`;
  }

  function shippingBlock() {
    return `<div class="co-sec">
        <span class="co-ic"><img src="${IMG}co-shipping.png" alt=""></span>
        <div class="co-sec__hd"><h2>Shipping &amp; Billing Address</h2>${stage === "shipping" ? `<a class="co-add" href="#">Add address</a>` : ""}</div>
        ${stage === "shipping"
          ? `<div class="co-card co-addr">${addressList()}<label class="co-chk"><input type="checkbox" checked><span>Billing address is same as shipping address</span></label></div>`
          : selectedAddress()}
      </div>`;
  }

  function walletRow(q, ctx) {
    const a = addr();
    const hide = !ctx.eligible || a.intl;
    if (hide) return topNote ? `<div class="co-rr co-rr--note"><div class="note note--warn" role="alert">${icon("alert")}<span>${esc(topNote)}</span></div></div>` : "";
    const cw = { ...q, justClaimed: cart.justClaimed, notice: cart.noticeText, loading: ctx.cust === "loading", guest: ctx.cust === "guest" };
    return `<div class="co-rr co-rr--wallet">${topNote ? `<div class="note note--warn" role="alert" style="margin-top:20px">${icon("alert")}<span>${esc(topNote)}</span></div>` : ""}${M.walletSection(cw, { page: "checkout" })}</div>`;
  }

  function redeemBlock(q, ctx) {
    const t = q.totals;
    const off = stage === "shipping";
    const neuSub = t.tataNeu ? `<b>${rs(t.tataNeu)}</b> applied from ${g(NEU_COINS)} Coins` : `${g(NEU_COINS)} Coins available`;
    const gcSub = t.giftCard ? `Card ending 4821 · <b>${rs(t.giftCard)}</b> applied` : "";
    return `<div class="co-sec ${off ? "is-off" : ""}">
        <span class="co-ic"><img src="${IMG}co-giftcard-step.png" alt=""></span>
        <div class="co-sec__hd"><h2>Redeem Points &amp; Gift Cards</h2></div>
        <div class="co-card co-redeem" ${off ? 'aria-disabled="true"' : ""}>
          ${walletRow(q, ctx)}
          <div class="co-rr"><section class="s-row" aria-label="Loyalty redemption"><img src="${IMG}co-neu.svg" alt=""><div class="s-row__m"><div class="s-row__t">Loyalty redemption</div><div class="s-row__s">${neuSub}</div></div><button class="s-btn-line" type="button" data-neu>${t.tataNeu ? "Remove" : "Apply"}</button></section></div>
          <div class="co-rr"><section class="s-row" aria-label="Gift card"><img src="${IMG}co-giftcard.svg" alt=""><div class="s-row__m"><div class="s-row__t">Have a gift card?</div>${gcSub ? `<div class="s-row__s">${gcSub}</div>` : ""}</div><button class="s-btn-line" type="button" data-gift>${t.giftCard ? "Remove" : "Apply"}</button></section></div>
          ${t.released || cart.notice === "gift" ? `<div class="co-rr co-rr--note"><div class="note note--info" role="status">${icon("info")}<span>${M.t("bm.wallet.checkout.giftAdjusted")}</span></div></div>` : ""}
        </div>
      </div>`;
  }

  function whatsapp() {
    return `<div class="co-wa"><img src="${IMG}co-whatsapp.png" alt=""><span>Get updates on Whatsapp</span><button class="co-tg is-on" type="button" role="switch" aria-checked="true" aria-label="Get updates on Whatsapp" data-wa></button></div>`;
  }

  /* ---------- Right column ---------- */
  function paymentDetails(q, ctx, count) {
    const t = q.totals;
    const a = addr();
    const showWallet = ctx.eligible && !a.intl;
    const saved = t.discounts + t.coupon;
    return `<section class="co-card co-pd" aria-labelledby="co-pd-h">
        <h3 id="co-pd-h">Payment Details <small>(${M.plural(count, "item", "items")} )</small></h3>
        <div class="co-pd__r"><span>Sub Total</span><b>₹ ${t.mrp}</b></div>
        ${t.coupon ? `<div class="co-pd__r"><span>Coupon Discount</span><b class="g">- ₹ ${t.coupon}</b></div>` : ""}
        ${saved ? `<div class="co-pd__r"><span>You Saved</span><b class="g">- ₹ ${saved}</b></div>` : ""}
        ${showWallet && t.walletApplied ? `<div class="co-pd__r"><span class="k"><img src="${IMG}ic-wallet.svg" alt="">${M.t("bm.wallet.payment.line")}</span><b class="w">- ₹ ${t.walletApplied}</b></div>` : ""}
        ${t.giftCard ? `<div class="co-pd__r"><span>Gift Card</span><b class="g">- ₹ ${t.giftCard}</b></div>` : ""}
        ${t.tataNeu ? `<div class="co-pd__r"><span>NeuCoins</span><b class="g">- ₹ ${t.tataNeu}</b></div>` : ""}
        <div class="co-pd__r"><span>Delivery Charge</span><b>FREE</b></div>
        <div class="co-pd__gt"><span>Grand Total</span><b aria-live="polite">₹${g(t.payable)}</b></div>
        ${showWallet && !a.unserviceable && q.cashbackEstimate > 0
          ? `<div class="co-earn"><img src="${IMG}ic-cashback.svg" alt=""><span><b>You’ll earn ${rs(q.cashbackEstimate)} cashback</b> on this order. It’s added to your Mia Wallet after the return window, or claim it early from My Orders.</span></div>`
          : ""}
      </section>`;
  }

  function orderSummary(q) {
    const del = stage !== "shipping";
    return `<section class="co-card co-os"><h3>Order Summary</h3>
        ${q.lines.map((l) => `<div class="co-it">
            <img src="${IMG}${esc(l.img || "ring.jpg")}" alt="">
            <div class="co-it__m">
              <div class="co-it__p">₹ ${l.price - (l.discount || 0)}</div>
              <div class="co-it__n">${esc(l.name)}</div>
              <div class="co-it__c"><span>Qty: <b>${l.qty}</b></span>${l.size && del ? `<span>Size: <b>${esc(l.size)}</b></span>` : ""}<span>Weight : <b>${(DETAILS[l.lineId] || {}).weight || "1 g"}</b></span></div>
              ${del ? `<div class="co-it__d">· Expected Delivery <b>9th Nov</b></div>` : ""}
            </div>
          </div>`).join("")}
      </section>`;
  }

  function footer(q, ctx, count) {
    const t = q.totals;
    const a = addr();
    const ready = stage !== "shipping" && !a.unserviceable;
    const label = !ready ? "Select Address to Proceed" : t.payable === 0 ? "Place Order" : "Continue to payment";
    const walletNote = t.walletApplied && ctx.eligible && !a.intl ? `<small>${rs(t.walletApplied)} paid from Mia Wallet</small>` : "";
    return `<div class="co-foot"><div class="co-foot__in">
        <div class="co-foot__l"><span>Total (${count}) :</span> <span><b>₹ ${t.payable}</b>${walletNote}</span></div>
        <button class="co-go ${ready ? "" : "is-off"}" type="button" data-go ${ready ? "" : 'aria-disabled="true"'}>${label}</button>
      </div></div>`;
  }

  /* ---------- Overlays (replicas of the site modals) ---------- */
  function overlay(html, { cls = "", lock = false, label = "" } = {}) {
    const el = document.createElement("div");
    el.className = "co-ov";
    el.innerHTML = `<div class="co-ov__box ${cls}" role="dialog" aria-modal="true" aria-label="${esc(label)}">${html}</div>`;
    document.body.appendChild(el);
    document.body.style.overflow = "hidden";
    const close = () => { el.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape" && !lock) close(); };
    document.addEventListener("keydown", onKey);
    if (!lock) el.addEventListener("click", (e) => { if (e.target === el) close(); });
    el.querySelectorAll("[data-ov-close]").forEach((b) => b.addEventListener("click", close));
    requestAnimationFrame(() => el.classList.add("is-in"));
    return { el, close };
  }

  function openGiftCard(ctx) {
    const o = overlay(`<button class="co-gc__x" type="button" aria-label="Close" data-ov-close>${icon("x", 20)}</button>
        <div class="co-gc__card"><div class="co-gc__top"><span>Redeem your Mia</span><b>Gift Card</b></div><div class="co-gc__bot"><img src="${IMG}co-giftcard-step.png" alt=""><img class="lg" src="${IMG}logo.png" alt="Mia by Tanishq"></div></div>
        <form class="co-gc__f" novalidate>
          <label><span>Gift Card Number</span><input inputmode="numeric" autocomplete="off" maxlength="16" placeholder="16 Digit Card Number" data-gcn></label>
          <label><span>Pin</span><input inputmode="numeric" autocomplete="off" maxlength="6" placeholder="6 Digit Pin" data-gcp></label>
          <p class="co-err" data-gce hidden></p>
          <button class="co-gc__v" type="submit" disabled>Verify</button>
        </form>`, { cls: "co-gc", label: "Redeem your Mia Gift Card" });
    const n = o.el.querySelector("[data-gcn]"), p = o.el.querySelector("[data-gcp]"), v = o.el.querySelector(".co-gc__v"), err = o.el.querySelector("[data-gce]");
    const sync = () => { n.value = n.value.replace(/\D/g, ""); p.value = p.value.replace(/\D/g, ""); v.disabled = !(n.value.length === 16 && p.value.length === 6); err.hidden = true; };
    n.addEventListener("input", sync); p.addEventListener("input", sync);
    setTimeout(() => n.focus({ preventScroll: true }), 50);
    o.el.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (v.disabled) return;
      v.textContent = "Verifying…"; v.disabled = true;
      await M.wait(700);
      if (/^0+$/.test(n.value)) { err.textContent = "This gift card number or pin is not valid."; err.hidden = false; v.textContent = "Verify"; v.disabled = false; return; }
      cart.giftCard = GIFT; cart.notice = null;
      o.close();
      M.toast(`Gift card applied. ${rs(Math.min(GIFT, cart.quote().totals.giftCard))} will be used on this order.`);
      ctx.keepScroll = true; ctx.rerender();
    });
  }

  function openOos(ctx, removed) {
    const l = cart.lines.find((x) => x.lineId === "L2") || cart.lines[0];
    const o = overlay(`<h4>Items are out of stock</h4>
        <p class="co-oos__t">Following items are out of stock. Please remove them from your bag to proceed.</p>
        <div class="co-oos__it"><img src="${IMG}${esc(l.img || "studs.jpg")}" alt=""><div><div class="n">${esc(l.name)}</div><div class="id">ID: 50D4FFNEDAA02</div></div></div>
        ${removed ? `<div class="co-oos__w"><img src="${IMG}ic-wallet.svg" alt=""><span>We removed the <b>${rs(removed)}</b> Mia Wallet amount from this order. It’s back in your wallet. Apply it again from your bag.</span></div>` : ""}
        <a class="co-oos__b" href="cart.html">Back To Bag</a>`, { cls: "co-oos", lock: true, label: "Items are out of stock" });
    return o;
  }

  function openAfterPay(kind, ctx) {
    const applied = cart.applied || released;
    const V = {
      failed: ["Payment failed", "Your payment didn’t go through. No money was taken.", applied ? `<b>Your wallet amount is safe.</b> ${rs(applied)} is still applied to this order. Retry to use it.` : "", "Retry payment"],
      failedReapply: ["Payment failed", "Your payment didn’t go through. No money was taken.", applied ? `<b>Your wallet amount is safe.</b> ${rs(applied)} is back in your Mia Wallet. Apply it again before you retry.` : "", "Back to checkout"],
      payPending: ["Payment pending", "We’re waiting for your bank to confirm. This can take up to 30 minutes.", applied ? `Your ${rs(applied)} wallet amount stays held for this order until the payment is confirmed.` : "", "Go to My Orders"],
      notCreated: ["We couldn’t place your order", "Something went wrong after your payment. Any amount taken will be refunded in 5 to 7 working days.", applied ? `The ${rs(applied)} Mia Wallet amount you used is back in your wallet.` : "", "Back To Bag"],
    }[kind];
    const o = overlay(`<h4>${V[0]}</h4><p class="co-oos__t">${V[1]}</p>${ctx.eligible && V[2] ? `<div class="co-oos__w"><img src="${IMG}ic-wallet.svg" alt=""><span>${V[2]}</span></div>` : ""}<button class="co-oos__b" type="button" data-ap>${V[3]}</button>`, { cls: "co-oos", lock: true, label: V[0] });
    o.el.querySelector("[data-ap]").addEventListener("click", () => {
      if (kind === "payPending") return (location.href = "orders.html");
      if (kind === "notCreated") return (location.href = "cart.html");
      released = 0;
      afterPay = null; o.close(); ctx.keepScroll = true; ctx.rerender();
    });
  }

  /* ---------- Page ---------- */
  M.page({
    id: "checkout",
    layout: "raw",
    chrome: false,
    footer: true,
    responses: {
      label: "Continue to payment · wallet hold",
      options: [
        { id: "ok", label: "200 · Hold OK → confirmation" },
        { id: "BALANCE_CHANGED", label: "409 · BALANCE_CHANGED" },
        { id: "SERVICE_DOWN", label: "503 · SERVICE_DOWN" },
      ],
    },
    scenarios: [
      { id: "default", group: "Address", label: "Address selected · Redeem", desc: "Live ‘Order Details’ step after choosing an address. Mia Wallet is the first row in ‘Redeem Points & Gift Cards’, with the on-hold strip and ‘View orders’. Try Redeem, then gift card and loyalty Apply." },
      { id: "selectAddress", group: "Address", label: "Step 1 · choose an address", desc: "As on the live site, the redeem section is faded and the footer button reads ‘Select Address to Proceed’ until an address is chosen. Pick Bengaluru, the undeliverable pincode or the Dubai address." },
      { id: "applied", group: "Wallet", label: "Carried over from bag (₹1,500)", desc: "The amount applied in the bag carries over. Payment Details shows a Mia Wallet line and the footer says how much is paid from the wallet. Try Continue to payment with each hold response." },
      { id: "holdOnly", group: "Wallet", label: "₹0 available · cashback on hold", desc: "Nothing to redeem yet, but ₹1,910 is on hold. ‘Claim cashback’ opens the order picker; after claiming, ‘Back to checkout’ returns here with the money added." },
      { id: "giftNeu", group: "Wallet", label: "Wallet + gift card + NeuCoins", desc: "Order of application: discounts → Mia Wallet → gift card and NeuCoins on what’s left. All three appear in Payment Details." },
      { id: "giftAdjusted", group: "Wallet", label: "Gift card / NeuCoins adjusted", desc: "The wallet amount lowered what’s payable below what the gift card covered, so the extra was released with a notice." },
      { id: "zeroPayable", group: "Wallet", label: "Grand Total ₹0 · Place Order", desc: "Fully paid by wallet and gift card; the footer button reads ‘Place Order’." },
      { id: "coupon", group: "Wallet", label: "Coupon applied (wallet blocked)", desc: "Wallet and coupons can’t be combined. ‘Remove coupon’ unlocks Redeem." },
      { id: "intl", group: "Removal", label: "International address", desc: "Wallet row hidden; the applied amount is removed with a notice. ‘Change Address’ and pick Bengaluru to bring it back (not re-applied)." },
      { id: "unserviceable", group: "Removal", label: "Address can’t be delivered to", desc: "Pincode not serviceable: amount removed, button disabled until another address is chosen." },
      { id: "autoOos", group: "Removal", label: "Item out of stock on Continue", desc: "Replica of the live ‘Items are out of stock’ modal, which appears when you press Continue to payment. The wallet amount is removed and returned." },
      { id: "down", group: "Removal", label: "Wallet service down", desc: "Unavailable message; the rest of checkout works." },
      { id: "failed", group: "After payment", label: "Payment failed · amount kept", desc: "Returning from the gateway after a failure. Wallet amount stays applied." },
      { id: "failedReapply", group: "After payment", label: "Payment failed · re-apply", desc: "Hold was released, so the customer applies it again." },
      { id: "payPending", group: "After payment", label: "Payment pending", desc: "Wallet amount stays held until the bank confirms." },
      { id: "notCreated", group: "After payment", label: "Order not created", desc: "Payment taken but order failed: wallet amount returned." },
    ],
    customerNote: (ctx) => (ctx.cust === "intl" ? "International address selected: wallet row hidden and any applied amount removed." : ctx.cust === "usd" ? "USD: no wallet UI." : ctx.cust === "guest" ? "Guest: the wallet row asks the customer to log in." : ""),
    balance: (ctx) => (ctx.cust === "loading" ? null : cart ? cart.available : 1560),
    onHold: () => (cart ? M.holdSum(cart.holdOrders) : 0),
    bagCount: () => (cart ? cart.lines.length : 2),
    render(ctx) {
      const k = ctx.s + "|" + ctx.cust;
      if (k !== key) {
        key = k;
        const fx = { failed: "applied", failedReapply: "applied", payPending: "applied", notCreated: "applied", autoOos: "applied", selectAddress: "default", holdOnly: "pending" }[ctx.s] || ctx.s;
        cart = new M.Cart(M.CART_FIX[fx] || M.CART_FIX.default);
        addrId = cart.address || (ctx.cust === "intl" ? "intl" : "home");
        stage = ctx.s === "selectAddress" ? "shipping" : "selected";
        topNote = null; addrError = null;
        oosOnContinue = ctx.s === "autoOos";
        afterPay = ["failed", "failedReapply", "payPending", "notCreated"].includes(ctx.s) ? ctx.s : null;
        released = afterPay === "failedReapply" ? cart.applied : 0;
        if (afterPay === "failedReapply") cart.applied = 0;
        cart.noticeText = cart.notice && cart.notice !== "gift" ? M.t(M.REMOVED[cart.notice]) : null;
        if (addrId === "intl" && cart.noticeText) { topNote = cart.noticeText; cart.noticeText = null; }
        if (addrId === "bad") addrError = "We can’t deliver to this pincode yet. Change the address to continue.";
      }
      const q = cart.quote();
      const count = q.lines.filter((l) => !l.oos).length;
      return `<div class="co">
          <div class="s-steps co-steps" aria-label="Checkout progress"><div class="s-step chk"><i>${icon("check", 14)}</i>Bag</div><span class="s-step-line on co-l1"></span><div class="s-step on"><i></i>Order Details</div><span class="s-step-line on"></span><div class="s-step"><i></i>Payment</div></div>
          <div class="co-head"><a href="cart.html" aria-label="Back to bag"><img src="${IMG}co-back.svg" alt=""></a><h1>Order Details</h1></div>
          <div class="co-grid">
            <div class="co-l"><div class="co-tl">${shippingBlock()}${redeemBlock(q, ctx)}</div>${whatsapp()}</div>
            <div class="co-r">${paymentDetails(q, ctx, count)}${orderSummary(q)}<p class="co-copy">© 2026 Titan Company Limited. All Rights Reserved.</p></div>
          </div>
        </div>
        ${footer(q, ctx, count)}`;
    },
    mount(root, ctx) {
      const app = document.getElementById("app");
      const rerender = () => { ctx.keepScroll = true; ctx.rerender(); };
      app.querySelectorAll("[data-toast]").forEach((b) => b.addEventListener("click", () => M.toast("Not part of this prototype", "info")));
      app.querySelector("[data-wa]")?.addEventListener("click", (e) => { const on = e.currentTarget.classList.toggle("is-on"); e.currentTarget.setAttribute("aria-checked", String(on)); });

      app.querySelectorAll("[data-use]").forEach((b) =>
        b.addEventListener("click", () => {
          addrId = b.dataset.use;
          stage = "selected";
          const a = addr();
          addrError = a.unserviceable ? "We can’t deliver to this pincode yet. Change the address to continue." : null;
          topNote = null;
          if ((a.intl || a.unserviceable) && cart.applied) {
            cart.applied = 0;
            const msg = M.t(a.intl ? M.REMOVED.international : M.REMOVED.address);
            M.track("wallet_auto_removed", { page: "checkout", reason: a.intl ? "INTERNATIONAL" : "UNSERVICEABLE" });
            if (a.intl) topNote = msg; else cart.noticeText = msg;
          } else if (!a.intl && !a.unserviceable) cart.noticeText = null;
          ctx.rerender();
        })
      );
      app.querySelector("[data-change]")?.addEventListener("click", () => { stage = "shipping"; rerender(); });

      app.querySelector("[data-neu]")?.addEventListener("click", () => { cart.neu = cart.quote().totals.tataNeu ? 0 : NEU_COINS; cart.notice = null; rerender(); });
      app.querySelector("[data-gift]")?.addEventListener("click", () => {
        if (cart.quote().totals.giftCard) { cart.giftCard = 0; cart.notice = null; M.toast("Gift card removed"); rerender(); } else openGiftCard(ctx);
      });

      app.querySelectorAll("[data-ws]").forEach((b) =>
        b.addEventListener("click", async () => {
          const a = b.dataset.ws;
          if (a === "redeem" || a === "edit")
            M.openRedeemModal({
              cw: cart.quote(), page: "checkout", resp: "ok",
              onApplied: (v) => { cart.applied = v; cart.noticeText = null; topNote = null; cart.notice = null; rerender(); },
              onBlocked: () => rerender(),
            });
          if (a === "claim") M.openHoldSheet({ orders: cart.holdOrders, back: M.here() });
          if (a === "remove") { M.btnBusy(b, true, "Removing…"); await M.wait(500); cart.applied = 0; M.toast(M.t("bm.wallet.toast.removed")); M.track("wallet_remove", { page: "checkout" }); rerender(); }
          if (a === "remove-coupon") { cart.coupon = null; M.toast("Coupon removed. You can now use your Mia Wallet."); rerender(); }
          if (a === "why") M.openInfoSheet(b.dataset.reason, cart.quote().ineligibleItems);
          if (a === "how") M.openHowItWorks();
          if (a === "dismiss") { cart.noticeText = null; rerender(); }
          if (a === "login") M.toast("Opens the existing login popup", "info");
        })
      );

      app.querySelector("[data-go]")?.addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        if (btn.classList.contains("is-off")) {
          if (stage === "shipping") M.toast("Select an address to proceed", "info");
          return;
        }
        const label = btn.textContent;
        btn.classList.add("is-busy"); btn.textContent = "Processing…";
        await M.wait(900);
        if (oosOnContinue) {
          const removed = cart.applied;
          cart.applied = 0;
          M.track("wallet_auto_removed", { page: "checkout", reason: "OOS" });
          rerender();
          openOos(ctx, ctx.eligible ? removed : 0);
          return;
        }
        const r = ctx.resp;
        if (!cart.applied || r === "ok") {
          location.href = "confirmation.html?s=" + (cart.applied ? "walletUsed" : "noWallet") + (ctx.cust !== "ok" ? "&c=" + ctx.cust : "");
          return;
        }
        btn.textContent = label;
        cart.applied = 0;
        if (r === "BALANCE_CHANGED") { cart.available = 1100; topNote = M.t("bm.wallet.checkout.balanceChanged"); }
        if (r === "MONTHLY_LIMIT") { cart.usedThisMonth = 3; topNote = null; }
        if (r === "SERVICE_DOWN") { cart.serviceDown = true; topNote = null; }
        rerender();
        document.querySelector(".co-rr--wallet")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      if (afterPay) openAfterPay(afterPay, ctx);
    },
  });
})();
