/* Shared order fixtures for My Orders, Order details, Return and Cancel (spec 11.7, 14). */
(function () {
  const M = MIA, add = M.addDays, C = M.config, T = M.TODAY_ISO;

  const IMG = { ring: "ring.jpg", earring: "studs.jpg", silver: "silver.jpg", coin: "coin.jpg" };
  const item = (lineId, name, price, kind = "ring", extra = {}) => ({ lineId, name, price, kind, qty: 1, size: kind === "ring" ? "14.20 MM" : null, weight: extra.weight || "2.41 g", img: /pendant|necklace/i.test(name) ? "pendant.jpg" : IMG[kind] || "ring.jpg", ...extra });
  const RING = item("L1", "Infinite Shimmer 14KT Gold & Diamond Ring", 7200);
  const STUDS = item("L2", "Petal Glow 14KT Gold Stud Earrings", 2800, "earring");
  const SILVER = item("L3", "Twisted Beam Silver Hoop Earrings", 1900, "silver");

  const base = (o) => ({
    orderNo: "MIA1030017",
    placedOn: "2026-10-04",
    status: "DELIVERED",
    deliveredOn: "2026-10-12",
    items: [RING, STUDS],
    subTotal: 10000,
    saved: 0,
    walletUsed: 800,
    walletRefund: null,
    payment: { label: "HDFC credit card", amount: 9200 },
    wholeOrderOnly: false,
    offerName: null,
    ...o,
  });
  const cb = (o) => ({ amount: 1000, originalAmount: null, claimedEarly: false, claimedOn: null, claim: { available: false, reason: null }, ...o });

  M.ORDERS = {
    pending: () => base({ orderNo: "MIA1031988", placedOn: "2026-10-27", status: "PROCESSING", deliveredOn: null, cashback: cb({ state: "ON_HOLD_PENDING_DELIVERY", deliveredOn: null, creditOn: null, claim: { available: false, reason: "NOT_DELIVERED" } }) }),
    shipped: () => base({ orderNo: "MIA1031990", placedOn: "2026-10-24", status: "SHIPPED", deliveredOn: null, cashback: cb({ state: "ON_HOLD_PENDING_DELIVERY", deliveredOn: null, creditOn: null, claim: { available: false, reason: "NOT_DELIVERED" } }) }),
    claimable: () => base({ deliveredOn: add(T, -18), cashback: cb({ state: "ON_HOLD", deliveredOn: add(T, -18), creditOn: add(T, 12), expiresIfClaimedToday: add(T, C.cashbackValidityDays), claim: { available: true } }) }),
    suppressed: () => base({ orderNo: "MIA1030550", items: [item("L1", "Eternal Bloom 18KT Diamond Necklace", 240000, "ring", { size: null, weight: "11.8 g" })], subTotal: 240000, walletUsed: 0, payment: { label: "ICICI net banking", amount: 240000 }, deliveredOn: add(T, -9), cashback: cb({ amount: 2400, state: "ON_HOLD", deliveredOn: add(T, -9), creditOn: add(T, 21), claim: { available: false, reason: "SUPPRESSED" } }) }),
    paused: () => base({ orderNo: "MIA1029455", deliveredOn: add(T, -14), returning: ["L1"], cashback: cb({ state: "PAUSED", deliveredOn: add(T, -14), creditOn: add(T, 16), claim: { available: false, reason: "RETURN_IN_PROGRESS" } }) }),
    rejected: () => base({ deliveredOn: add(T, -20), flash: { tone: "info", text: "Your return was rejected. Your cashback is back on hold." }, cashback: cb({ state: "ON_HOLD", deliveredOn: add(T, -20), creditOn: add(T, 10), expiresIfClaimedToday: add(T, C.cashbackValidityDays), claim: { available: true } }) }),
    partialHold: () => base({ deliveredOn: add(T, -16), returned: ["L2"], walletRefund: { amount: 224, done: true }, flash: { tone: "pos", text: "Your return is complete. Refund paid in full. This order’s cashback was updated to ₹600." }, cashback: cb({ amount: 600, originalAmount: 1000, state: "ON_HOLD", deliveredOn: add(T, -16), creditOn: add(T, 14), expiresIfClaimedToday: add(T, C.cashbackValidityDays), claim: { available: true } }) }),
    credited: () => base({ orderNo: "MIA1029384", placedOn: "2026-09-12", deliveredOn: "2026-09-18", cashback: cb({ state: "CREDITED", deliveredOn: "2026-09-18", creditOn: "2026-10-18", creditedOn: "2026-10-18", expiresOn: add("2026-10-18", C.cashbackValidityDays) }) }),
    claimed: () => base({ orderNo: "MIA1028800", deliveredOn: "2026-10-22", cashback: cb({ state: "CREDITED", claimedEarly: true, claimedOn: "2026-10-27", creditedOn: "2026-10-27", deliveredOn: "2026-10-22", expiresOn: add("2026-10-27", C.cashbackValidityDays) }) }),
    partialCredited: () => base({ orderNo: "MIA1027310", placedOn: "2026-08-30", deliveredOn: "2026-09-04", returned: ["L2"], walletRefund: { amount: 224, done: true }, cashback: cb({ amount: 600, originalAmount: 1000, state: "CREDITED", deliveredOn: "2026-09-04", creditedOn: "2026-10-04", expiresOn: add("2026-10-04", C.cashbackValidityDays) }) }),
    withdrawnClosed: () => base({ orderNo: "MIA1028120", placedOn: "2026-09-20", deliveredOn: "2026-09-26", flash: { tone: "pos", text: "Your return was withdrawn. Your cashback is now added to your wallet." }, cashback: cb({ state: "CREDITED", deliveredOn: "2026-09-26", creditedOn: T, expiresOn: add(T, C.cashbackValidityDays) }) }),
    voidCancelled: () => base({ orderNo: "MIA1031501", status: "CANCELLED", deliveredOn: null, placedOn: "2026-10-20", walletRefund: { amount: 800, done: true, expiresOn: add(T, 41) }, cashback: cb({ state: "VOIDED", voidReason: "cancelled" }) }),
    voidReturned: () => base({ orderNo: "MIA1029901", status: "RETURNED", deliveredOn: add(T, -12), returned: ["L1", "L2"], walletRefund: { amount: 800, done: false }, cashback: cb({ state: "VOIDED", voidReason: "returned" }) }),
    undeliverable: () => base({ orderNo: "MIA1031277", status: "UNDELIVERABLE", deliveredOn: null, walletRefund: { amount: 800, done: true, expiresOn: add(T, 15) }, cashback: cb({ state: "VOIDED", voidReason: "undeliverable" }) }),
    none: () => base({ orderNo: "MIA1030911", items: [item("L1", "Charming Heart 14KT Gold Pendant", 6400, "ring", { size: null, offer: "Diwali 20% off making" }), item("L2", "0.5 Gram 24KT Mango Leaf Gold Coin", 7813, "coin", { size: null })], subTotal: 14213, saved: 1280, walletUsed: 0, payment: { label: "UPI", amount: 12933 }, deliveredOn: add(T, -5), cashback: { state: "NONE", amount: 0 } }),
    mixed: () => base({ orderNo: "MIA1030344", items: [RING, SILVER], subTotal: 9100, walletUsed: 0, payment: { label: "UPI", amount: 9100 }, deliveredOn: add(T, -3), cashback: cb({ amount: 910, state: "ON_HOLD", deliveredOn: add(T, -3), creditOn: add(T, 27), expiresIfClaimedToday: add(T, C.cashbackValidityDays), claim: { available: true } }) }),
    mixedClosed: () => base({ orderNo: "MIA1030344", items: [RING, SILVER], subTotal: 9100, walletUsed: 0, payment: { label: "UPI", amount: 9100 }, deliveredOn: add(T, -10), cashback: cb({ amount: 910, state: "ON_HOLD", deliveredOn: add(T, -10), creditOn: add(T, 20), expiresIfClaimedToday: add(T, C.cashbackValidityDays), claim: { available: true } }) }),
    silver: () => base({ orderNo: "MIA1030702", items: [SILVER], subTotal: 1900, walletUsed: 0, payment: { label: "UPI", amount: 1900 }, deliveredOn: add(T, -2), cashback: cb({ amount: 95, state: "ON_HOLD", deliveredOn: add(T, -2), creditOn: add(T, 5), expiresIfClaimedToday: add(T, C.cashbackValidityDays), claim: { available: true } }) }),
    // Cancel flow fixtures (order still processing, so it can be cancelled before dispatch).
    cancelSingle: () => base({ orderNo: "MIA1031995", placedOn: "2026-11-02", status: "PROCESSING", deliveredOn: null, items: [RING], subTotal: 7200, walletUsed: 500, payment: { label: "UPI", amount: 6700 }, cashback: cb({ amount: 670, state: "ON_HOLD_PENDING_DELIVERY", deliveredOn: null, creditOn: null, claim: { available: false, reason: "NOT_DELIVERED" } }) }),
    cancelNoWallet: () => base({ orderNo: "MIA1031996", placedOn: "2026-11-02", status: "PROCESSING", deliveredOn: null, walletUsed: 0, payment: { label: "UPI", amount: 10000 }, cashback: cb({ state: "ON_HOLD_PENDING_DELIVERY", deliveredOn: null, creditOn: null, claim: { available: false, reason: "NOT_DELIVERED" } }) }),
    cancelNoCashback: () => base({ orderNo: "MIA1031997", placedOn: "2026-11-02", status: "PROCESSING", deliveredOn: null, items: [item("L4", "10 GM 22 Karat Sublime Mango Leaf Gold Coin", 147192, "coin", { size: null, weight: "10 g" })], subTotal: 147192, walletUsed: 0, payment: { label: "Prepaid", amount: 147192 }, cashback: { state: "NONE", amount: 0 } }),
    // Return flow fixtures (delivered, return window open).
    returnSingle: () => base({ orderNo: "MIA1030835", items: [RING], subTotal: 7200, walletUsed: 500, payment: { label: "UPI", amount: 6700 }, deliveredOn: add(T, -4), cashback: cb({ amount: 670, state: "ON_HOLD", deliveredOn: add(T, -4), creditOn: add(T, 26), expiresIfClaimedToday: add(T, C.cashbackValidityDays), claim: { available: true } }) }),
    returnNoWallet: () => base({ orderNo: "MIA1030836", walletUsed: 0, payment: { label: "HDFC credit card", amount: 10000 }, deliveredOn: add(T, -4), cashback: cb({ state: "ON_HOLD", deliveredOn: add(T, -4), creditOn: add(T, 26), expiresIfClaimedToday: add(T, C.cashbackValidityDays), claim: { available: true } }) }),
    returnNoCashback: () => base({ orderNo: "MIA1030837", items: [item("L1", "Charming Heart 14KT Gold Pendant", 6400, "ring", { size: null, offer: "Diwali 20% off making" })], subTotal: 6400, saved: 1280, walletUsed: 0, payment: { label: "Prepaid", amount: 5120 }, deliveredOn: add(T, -4), cashback: { state: "NONE", amount: 0 } }),
    wholeOrder: () => base({ orderNo: "MIA1030480", wholeOrderOnly: true, offerName: "the Buy 2 Get 10% Off offer", walletUsed: 0, payment: { label: "HDFC credit card", amount: 10000 }, deliveredOn: add(T, -6), cashback: cb({ state: "ON_HOLD", deliveredOn: add(T, -6), creditOn: add(T, 24), expiresIfClaimedToday: add(T, C.cashbackValidityDays), claim: { available: true } }) }),
  };

  // Return window per item: 7 days silver, 30 days others, from delivery.
  M.returnWindowEnd = (o, it) => (o.deliveredOn ? add(o.deliveredOn, it.kind === "silver" ? C.silverReturnDays : C.otherReturnDays) : null);
})();

/* Mock server for POST /orders/{no}/returns/quote and /cancel/quote (spec 10, 11.9). The UI only displays these figures. */
(function () {
  const M = MIA;
  M.mockQuote = (o, lineIds) => {
    const sel = o.items.filter((i) => lineIds.includes(i.lineId));
    const itemValue = sel.reduce((s, i) => s + i.price, 0);
    const walletPart = o.walletUsed ? Math.round((o.walletUsed * itemValue) / o.subTotal) : 0;
    const refundTo = [{ method: "CARD", label: o.payment.label, amount: itemValue - walletPart }];
    if (walletPart) refundTo.push({ method: "WALLET", label: "Mia Wallet", amount: walletPart });
    let cashback = null;
    const c = o.cashback;
    if (c && c.state !== "NONE" && c.state !== "VOIDED") {
      const kept = o.subTotal - itemValue;
      const after = kept <= 0 || lineIds.length === o.items.length ? 0 : Math.floor((c.amount * kept) / o.subTotal);
      cashback = { current: c.amount, afterReturn: after, effect: after === 0 ? "VOIDED" : after === c.amount ? "NONE" : "RECALCULATED" };
    }
    return { itemValue, walletPart, refundTo, cashback, wholeOrderOnly: o.wholeOrderOnly, offerName: o.offerName };
  };
})();

/* On-hold cashback, derived from the order fixtures so every page shows the same orders and amounts. */
(function () {
  const M = MIA, C = M.config;

  // Order scenario id -> on-hold summary used by the hold sheet, cart, checkout and My Wallet.
  M.holdOrder = (sid) => {
    const o = M.ORDERS[sid]();
    const c = o.cashback;
    return {
      sid, orderNo: o.orderNo, amount: c.amount, placedOn: o.placedOn,
      delivered: o.status === "DELIVERED", deliveredOn: o.deliveredOn,
      creditOn: c.creditOn, expiresIfClaimedToday: c.expiresIfClaimedToday || M.addDays(M.TODAY_ISO, C.cashbackValidityDays),
      claim: c.claim, items: o.items,
    };
  };
  // "till 11 Nov", or per type when silver (7 days) and other jewellery (30 days) are mixed. Soonest first.
  M.returnWindowsText = (o) => {
    const open = o.items
      .filter((it) => it.kind !== "coin" && o.deliveredOn && M.daysUntil(M.returnWindowEnd(o, it)) >= 0)
      .sort((x, y) => M.returnWindowEnd(o, x).localeCompare(M.returnWindowEnd(o, y)));
    const parts = [...new Map(open.map((it) => [it.kind === "silver" ? "silver" : "other", M.returnWindowEnd(o, it)])).entries()];
    if (!parts.length) return "";
    if (new Set(parts.map((p) => p[1])).size === 1) return `till ${M.date(parts[0][1], true)}`;
    return parts.map(([k, d]) => `${k === "silver" ? "silver" : "other jewellery"} till ${M.date(d, true)}`).join(", ");
  };
  M.DEFAULT_HOLD = ["claimable", "mixed"];
  M.defaultHoldOrders = () => M.DEFAULT_HOLD.map(M.holdOrder);

  // Claims made in this browser tab, so a claim on an order page shows up on the cart, checkout and wallet.
  const K = "mia-claimed";
  M.claims = {
    all() { try { return JSON.parse(sessionStorage.getItem(K)) || {}; } catch (e) { return {}; } },
    has(orderNo) { return !!this.all()[orderNo]; },
    get(orderNo) { return this.all()[orderNo]; },
    add(orderNo, info) { const a = this.all(); a[orderNo] = info; sessionStorage.setItem(K, JSON.stringify(a)); },
    reset() { sessionStorage.removeItem(K); },
    total() { return Object.values(this.all()).reduce((t, x) => t + (x.amount || 0), 0); },
  };
  // Removes claimed orders from a hold list and reports how much moved to the available balance.
  M.applyClaims = (holds) => {
    const claimed = holds.filter((o) => M.claims.has(o.orderNo));
    return { holds: holds.filter((o) => !M.claims.has(o.orderNo)), claimedAmt: claimed.reduce((t, o) => t + o.amount, 0), claimed };
  };
  // Header / sidebar figures for pages without their own wallet data.
  M.chromeWallet = () => {
    const { holds } = M.applyClaims(M.defaultHoldOrders());
    return { available: 1560 + M.claims.total(), onHold: holds.reduce((t, o) => t + o.amount, 0) };
  };
})();
