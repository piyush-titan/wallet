/* Mock cart service for GET/POST/DELETE /cart/wallet (spec 6.3, 10, 11.4, 11.5).
   The UI renders the quote it returns; it never computes money itself. */
(function () {
  const M = MIA, C = M.config;

  M.LINES = {
    ring: { lineId: "L1", name: "Infinite Shimmer 14KT Gold & Diamond Ring", price: 7200, qty: 1, kind: "ring", size: "14.20 MM", img: "ring.jpg" },
    studs: { lineId: "L2", name: "Petal Glow 14KT Gold Stud Earrings", price: 2800, qty: 1, kind: "earring", img: "studs.jpg" },
    pendant: { lineId: "L3", name: "Charming Heart 14KT Gold Pendant", price: 6400, qty: 1, kind: "ring", offer: "CUSTOM_OFFER", discount: 1280, img: "pendant.jpg" },
    bangle: { lineId: "L5", name: "Floral Vine 14KT Gold Bangle", price: 18400, qty: 1, kind: "ring", offer: "DISCOUNT", discount: 2200, img: "pendant.jpg" },
    coin: { lineId: "L4", name: "0.5 Gram 24KT Mango Leaf Gold Coin", price: 7813, qty: 1, kind: "coin", img: "coin.jpg" },
  };
  const clone = (x) => JSON.parse(JSON.stringify(x));

  M.Cart = class {
    constructor(f) {
      Object.assign(this, { lines: [], available: 0, onHold: 0, applied: 0, coupon: null, usedThisMonth: 1, absoluteCap: C.absoluteCapPerOrder, serviceDown: false, giftCard: 0, neu: 0, released: null, holdOrders: M.DEFAULT_HOLD }, clone(f));
      // Hold orders come from the order fixtures; anything claimed in this tab is already in the balance.
      const { holds, claimedAmt, claimed } = M.applyClaims(this.holdOrders.map((x) => (typeof x === "string" ? M.holdOrder(x) : x)));
      this.holdOrders = holds;
      this.available += claimedAmt;
      this.justClaimed = claimed;
    }
    isEligible(l) {
      return !l.offer && l.kind !== "coin" && l.kind !== "giftcard" && !l.oos;
    }
    quote() {
      const L = this.lines.filter((l) => !l.oos);
      const eligibleLines = this.coupon ? [] : L.filter((l) => this.isEligible(l));
      const eligibleValue = eligibleLines.reduce((s, l) => s + l.price * l.qty, 0);
      const maxByPercent = Math.floor((eligibleValue * C.redemptionPercent) / 100);
      const limit = Math.min(this.available, maxByPercent, this.absoluteCap ?? Infinity);
      const blockers = [];
      if (this.coupon) blockers.push("COUPON_APPLIED");
      if (this.usedThisMonth >= C.maxRedemptionsPerMonth) blockers.push("MONTHLY_LIMIT");
      if (!this.coupon && !eligibleValue) blockers.push("NO_ELIGIBLE_ITEMS");
      const ineligibleItems = this.coupon ? [] : L.filter((l) => !this.isEligible(l)).map((l) => ({ lineId: l.lineId, name: l.name, kind: l.kind, reason: l.offer === "CUSTOM_OFFER" ? "OFFER" : l.offer === "DISCOUNT" ? "DISCOUNT" : l.kind === "coin" ? "COIN" : "GIFT_CARD" }));
      const benefit = (l) => (l.offer ? l.offer : this.coupon && l.kind !== "coin" ? "COUPON" : this.applied && this.isEligible(l) ? "WALLET" : "NONE");

      const mrp = L.reduce((s, l) => s + l.price * l.qty, 0);
      const discounts = L.reduce((s, l) => s + (l.discount || 0) * l.qty, 0);
      const couponAmt = this.coupon ? 500 : 0;
      let left = mrp - discounts - couponAmt - this.applied;
      const gc = Math.min(this.giftCard, Math.max(0, left));
      left -= gc;
      const neu = Math.min(this.neu, Math.max(0, left));
      left -= neu;
      const released = this.giftCard - gc + (this.neu - neu) || null;
      const realMoneyOnEligible = Math.max(0, eligibleValue - this.applied);
      return {
        eligible: true,
        serviceDown: this.serviceDown,
        available: this.available,
        onHold: M.holdSum(this.holdOrders),
        holdOrders: this.holdOrders,
        eligibleValue, maxByPercent, absoluteCap: this.absoluteCap, limit,
        usedThisMonth: this.usedThisMonth, monthlyLimit: C.maxRedemptionsPerMonth, resetsOn: "2026-11-01",
        blockers, ineligibleItems,
        applied: this.applied || null,
        lines: this.lines.map((l) => ({ ...l, benefit: benefit(l) })),
        cashbackEstimate: Math.floor(realMoneyOnEligible * 0.05),
        totals: { mrp, discounts, coupon: couponAmt, walletApplied: this.applied, giftCard: gc, tataNeu: neu, released, payable: Math.max(0, left) },
      };
    }
  };

  M.CART_FIX = {
    default: { lines: [M.LINES.ring, M.LINES.studs], available: 1560 },
    applied: { lines: [M.LINES.ring, M.LINES.studs], available: 1560, applied: 1500 },
    percentBinding: { lines: [M.LINES.ring, M.LINES.studs], available: 25000 },
    capBinding: { lines: [M.LINES.ring, M.LINES.studs], available: 5000, absoluteCap: 1000 },
    mixed: { lines: [M.LINES.ring, M.LINES.pendant, M.LINES.coin, M.LINES.studs], available: 5000 },
    mixedApplied: { lines: [M.LINES.ring, M.LINES.pendant, M.LINES.coin, M.LINES.studs], available: 5000, applied: 5000 },
    noEligible: { lines: [M.LINES.pendant, M.LINES.coin], available: 900 },
    coupon: { lines: [M.LINES.ring, M.LINES.studs], available: 900, coupon: "MIA500" },
    monthly: { lines: [M.LINES.ring, M.LINES.studs], available: 900, usedThisMonth: 3 },
    zero: { lines: [M.LINES.ring, M.LINES.studs], available: 0, holdOrders: [] },
    pending: { lines: [M.LINES.ring, M.LINES.studs], available: 0 },
    pendingNotDelivered: { lines: [M.LINES.ring, M.LINES.studs], available: 0, holdOrders: ["pending"] },
    holdOne: { lines: [M.LINES.ring, M.LINES.studs], available: 1560, holdOrders: ["claimable"] },
    holdMulti: { lines: [M.LINES.ring, M.LINES.studs], available: 200, holdOrders: ["claimable", "mixed", "pending", "suppressed"] },
    noHold: { lines: [M.LINES.ring, M.LINES.studs], available: 1560, holdOrders: [] },
    loading: { lines: [M.LINES.ring, M.LINES.studs], available: 1560 },
    down: { lines: [M.LINES.ring, M.LINES.studs], available: 1560, serviceDown: true },
    autoCart: { lines: [M.LINES.ring, { ...M.LINES.studs, qty: 2 }], available: 1560, notice: "cart" },
    autoOos: { lines: [M.LINES.ring, { ...M.LINES.studs, oos: true }], available: 1560, notice: "oos" },
    couponBlocked: { lines: [M.LINES.ring, M.LINES.studs], available: 1560, applied: 1500, couponError: true },
    // checkout
    giftNeu: { lines: [M.LINES.ring, M.LINES.studs], available: 1560, applied: 1500, giftCard: 2000, neu: 500 },
    giftAdjusted: { lines: [M.LINES.ring, M.LINES.studs], available: 9000, applied: 8000, giftCard: 2000, neu: 500, notice: "gift" },
    zeroPayable: { lines: [M.LINES.ring, M.LINES.studs], available: 9000, applied: 8000, giftCard: 2000 },
    intl: { lines: [M.LINES.ring, M.LINES.studs], available: 1560, notice: "international", address: "intl" },
    unserviceable: { lines: [M.LINES.ring, M.LINES.studs], available: 1560, notice: "address", address: "bad" },
  };

  M.REMOVED = { cart: "bm.wallet.removed.cart", oos: "bm.wallet.removed.oos", address: "bm.wallet.removed.address", international: "bm.wallet.removed.international", currency: "bm.wallet.removed.currency" };

  M.benefitTag = (b) =>
    ({ CUSTOM_OFFER: '<span class="tag tag--offer">Custom offer</span>', DISCOUNT: '<span class="tag tag--disc">Discount</span>', COUPON: '<span class="tag tag--coupon">Coupon</span>', WALLET: '<span class="tag tag--wallet">Wallet</span>' }[b] || "");

  // Payment details block shared by cart and checkout.
  M.paymentDetails = (q, { showWallet = true, showEstimate = true, extra = "" } = {}) => {
    const { rs, icon } = M, t = q.totals;
    return `<section class="card" aria-labelledby="pd-h">
      <h2 id="pd-h">Payment Details</h2>
      <div style="margin-top:8px">
        <div class="kv"><span class="k">Sub Total</span><span class="v">${rs(t.mrp)}</span></div>
        ${t.discounts ? `<div class="kv"><span class="k">Offers and discounts</span><span class="v pos">\u2212${rs(t.discounts)}</span></div>` : ""}
        ${t.coupon ? `<div class="kv"><span class="k">Coupon (MIA500)</span><span class="v pos">\u2212${rs(t.coupon)}</span></div>` : ""}
        ${showWallet && t.walletApplied ? `<div class="kv"><span class="k row" style="gap:8px">${icon("wallet", 16)}${M.t("bm.wallet.payment.line")}</span><span class="v rose">\u2212${rs(t.walletApplied)}</span></div>` : ""}
        ${t.giftCard ? `<div class="kv"><span class="k">Gift card</span><span class="v">\u2212${rs(t.giftCard)}</span></div>` : ""}
        ${t.tataNeu ? `<div class="kv"><span class="k">Tata Neu points</span><span class="v">\u2212${rs(t.tataNeu)}</span></div>` : ""}
        <div class="kv"><span class="k">Delivery Charges</span><span class="v">Free</span></div>
        <div class="kv kv--total"><span class="k">Amount payable</span><span class="v" aria-live="polite">${rs(t.payable)}</span></div>
      </div>
      ${showEstimate && q.cashbackEstimate > 0 ? `<div class="note note--rose" style="margin-top:12px">${icon("sparkle")}<span><strong>You’ll earn ${rs(q.cashbackEstimate)} cashback on this order.</strong><br><span class="small muted">Added after the return window, or claim it early.</span></span></div>` : ""}
      ${extra}
    </section>`;
  };
})();

/* Payment Details block, replica of the live cart totals (row labels and number style as on the site). */
(function () {
  const M = MIA;
  const g = (n) => new Intl.NumberFormat("en-IN").format(n);
  M.sitePaymentDetails = (q, { count = 1, showWallet = true, showEstimate = true } = {}) => {
    const t = q.totals;
    return `<div class="s-pd__t"><b>Payment Details</b><small>(${M.plural(count, "item", "items")})</small></div>
      <div class="s-pd__r"><span>Sub Total</span><span>₹ ${t.mrp}</span></div>
      <div class="s-pd__r"><span>You Saved</span><span class="g">- ₹ ${t.discounts}</span></div>
      <div class="s-pd__r"><span>Discount</span><span>- ₹ ${t.coupon}</span></div>
      ${showWallet && t.walletApplied ? `<div class="s-pd__r"><span class="k"><img src="assets/img/ic-wallet.svg" alt="" style="width:22px">${M.t("bm.wallet.payment.line")}</span><span class="w">- ₹ ${g(t.walletApplied)}</span></div>` : ""}
      ${t.giftCard ? `<div class="s-pd__r"><span>Gift Card</span><span>- ₹ ${g(t.giftCard)}</span></div>` : ""}
      ${t.tataNeu ? `<div class="s-pd__r"><span>Tata NeuCoins</span><span>- ₹ ${g(t.tataNeu)}</span></div>` : ""}
      <div class="s-pd__r"><span>Delivery Charge</span><span>FREE</span></div>
      <div class="s-pd__gt"><span>Grand Total</span><span aria-live="polite">₹${g(t.payable)}</span></div>
      ${showEstimate && q.cashbackEstimate > 0 ? `<div class="s-pd__earn">${M.icon("sparkle", 18)}<span><b>You’ll earn ${M.rs(q.cashbackEstimate)} cashback on this order.</b><br>Added after the return window, or claim it early from your order.</span></div>` : ""}`;
  };
})();
