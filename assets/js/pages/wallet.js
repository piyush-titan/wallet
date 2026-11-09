/* My Wallet page (spec 6.10) */
(function () {
  const M = MIA, { rs, date, esc, icon, config: C } = M;
  const add = M.addDays;

  const tx = (id, type, amount, d, orderNo = null, message = null) => ({
    id, type, amount, date: d, orderNo, message,
    direction: type === "REDEEMED" || type === "EXPIRED" ? "debit" : "credit",
  });
  const baseTx = [
    tx("t9", "CASHBACK_CREDITED", 1000, "2026-10-28", "MIA1029384"),
    tx("t8", "BRAND_CREDIT", 500, "2026-10-20", null, "Happy Diwali from Mia"),
    tx("t7", "REDEEMED", 800, "2026-10-12", "MIA1027001"),
    tx("t6", "CASHBACK_CREDITED", 60, "2026-08-03", "MIA1019920"),
    tx("t5", "EXPIRED", 120, "2026-09-30", null, "Cashback · order #MIA1011112"),
    tx("t4b", "GOODWILL_CREDIT", 50, "2026-08-20", "MIA1021450"),
    tx("t4", "REFUND_TO_WALLET", 400, "2026-07-14", "MIA1018870"),
    tx("t3", "REDEEMED", 180, "2026-07-02", "MIA1017555"),
    tx("t2", "CASHBACK_CREDITED", 300, "2026-07-02", "MIA1011112"),
    tx("t1", "BRAND_CREDIT", 250, "2026-06-01", null, "Welcome to Mia"),
  ];
  const longTx = () => {
    const out = [...baseTx];
    const types = ["REDEEMED", "CASHBACK_CREDITED", "BRAND_CREDIT", "REFUND_TO_WALLET", "EXPIRED"];
    for (let i = 0; i < 38; i++) {
      const t = types[i % types.length];
      out.push(tx("h" + i, t, [150, 420, 90, 1200, 75][i % 5], add("2026-05-20", -i * 6), t === "BRAND_CREDIT" || t === "EXPIRED" ? null : "MIA10" + (16000 - i * 37), t === "BRAND_CREDIT" ? "Birthday treat from Mia" : t === "EXPIRED" ? "Cashback · order #MIA1009" + i : null));
    }
    return out;
  };
  const credit = (id, source, orderNo, message, originalAmount, remaining, expiresOn, status, extra = {}) => ({ id, source, orderNo, message, originalAmount, remaining, expiresOn, status, ...extra });
  const regularCredits = [
    credit("c3", "CASHBACK", "MIA1029384", null, 1000, 1000, add(M.TODAY_ISO, 88), "ACTIVE"),
    credit("c2", "BRAND_CREDIT", null, "Happy Diwali from Mia", 500, 500, add(M.TODAY_ISO, 6), "EXPIRING_SOON"),
    credit("c4", "CASHBACK", "MIA1019920", null, 300, 60, add(M.TODAY_ISO, 2), "EXPIRING_SOON"),
    credit("c1", "CASHBACK", "MIA1011112", null, 300, 0, "2026-09-30", "EXPIRED", { expiredAmount: 120 }),
  ];

  const FIX = {
    regular: () => ({ available: 1560, onHold: ["claimable", "mixed"], paused: [], tx: baseTx, credits: regularCredits }),
    busy: () => ({
      available: 1560,
      onHold: ["claimable", "mixed", "pending", "suppressed"],
      paused: [{ orderNo: "MIA1029455", amount: 1000, returnId: "R-55821" }],
      tx: baseTx,
      credits: regularCredits,
    }),
    new: () => ({ available: 0, onHold: [], paused: [], tx: [], credits: [] }),
    waiting: () => ({ available: 0, onHold: ["pending"], paused: [], tx: [], credits: [] }),
    claimable: () => ({
      available: 200,
      onHold: ["claimable"],
      paused: [],
      tx: [tx("b1", "BRAND_CREDIT", 200, "2026-10-01", null, "A little something from Mia")],
      credits: [credit("b1", "BRAND_CREDIT", null, "A little something from Mia", 200, 200, add(M.TODAY_ISO, 45), "ACTIVE")],
    }),
    claimed: () => ({
      available: 1000, onHold: [], paused: [],
      tx: [tx("k1", "CASHBACK_CLAIMED", 1000, "2026-10-27", "MIA1028800")],
      credits: [credit("k1", "CASHBACK", "MIA1028800", null, 1000, 1000, add("2026-10-27", C.cashbackValidityDays), "ACTIVE")],
    }),
    returning: () => ({ available: 0, onHold: [], paused: [{ orderNo: "MIA1029455", amount: 1000, returnId: "R-55821" }], tx: [], credits: [] }),
    zeroHistory: () => ({
      available: 0, onHold: [], paused: [],
      tx: [tx("z3", "EXPIRED", 140, "2026-10-02", null, "Cashback · order #MIA1012001"), tx("z2", "REDEEMED", 860, "2026-08-11", "MIA1015090"), tx("z1", "CASHBACK_CREDITED", 1000, "2026-07-05", "MIA1012001")],
      credits: [credit("z1", "CASHBACK", "MIA1012001", null, 1000, 0, "2026-10-02", "EXPIRED", { expiredAmount: 140 })],
    }),
    expNone: () => ({ available: 1000, onHold: [], paused: [], tx: [baseTx[0]], credits: [credit("c3", "CASHBACK", "MIA1029384", null, 1000, 1000, add(M.TODAY_ISO, 88), "ACTIVE")] }),
    historyShort: () => ({ available: 1560, onHold: [], paused: [], tx: baseTx.slice(0, 4), credits: regularCredits }),
  };
  FIX.expiring = FIX.regular;
  FIX.expProjected = () => ({ ...FIX.busy(), available: 1560 });
  FIX.viewAll = () => ({ ...FIX.regular(), tx: longTx() });
  FIX.viewAllEnd = () => ({ ...FIX.regular(), tx: longTx().slice(0, 24) });

  let data = null, key = "", view = "main", page = 1;

  const ORDER_LINK = (no) => `<a href="order-details.html?s=${no === "MIA1028800" ? "claimed" : no === "MIA1030017" ? "claimable" : no === "MIA1031988" ? "pending" : no === "MIA1029455" ? "paused" : "credited"}">#${esc(no)}</a>`;

  const TX = {
    CASHBACK_CREDITED: ["checkCircle", "pos", "Cashback credited", (t) => "Order " + ORDER_LINK(t.orderNo)],
    CASHBACK_CLAIMED: ["sparkle", "pos", "Cashback claimed early", (t) => "Order " + ORDER_LINK(t.orderNo) + " · returns closed"],
    BRAND_CREDIT: ["gift", "rose", null, () => "Gift from Mia"],
    REDEEMED: ["bag", "", "Used on an order", (t) => "Order " + ORDER_LINK(t.orderNo)],
    REFUND_TO_WALLET: ["undo", "pos", "Refunded to wallet", (t) => "Order " + ORDER_LINK(t.orderNo) + " returned"],
    GOODWILL_CREDIT: ["gift", "pos", "Goodwill credit", (t) => "Order " + ORDER_LINK(t.orderNo) + " cancelled by Mia"],
    EXPIRED: ["clock", "mute", "Expired", (t) => esc(t.message || "")],
  };
  const txRow = (t) => {
    const d = TX[t.type];
    return `<li class="li"><div class="li__ico ${d[1]}">${icon(d[0])}</div><div class="li__main"><div class="li__title">${esc(d[2] || t.message)}</div><div class="li__sub">${d[3](t)}</div></div><div class="li__end"><div class="amt ${t.direction === "credit" ? "pos" : t.type === "EXPIRED" ? "mute" : ""}">${M.signed(t.amount, t.direction)}</div><div class="xs faint">${date(t.date, true)}</div></div></li>`;
  };

  function hero(ctx) {
    const sum = (arr) => arr.reduce((t, x) => t + x.amount, 0);
    const active = data.credits.filter((c) => c.status === "ACTIVE" || c.status === "EXPIRING_SOON");
    const soonList = active.filter((c) => M.daysUntil(c.expiresOn) <= C.expiringSoonDays).sort((x, y) => x.expiresOn.localeCompare(y.expiresOn));
    const soon = soonList.reduce((t, c) => t + c.remaining, 0);
    const hold = sum(data.onHold), paused = sum(data.paused);
    const can = M.claimableSum(data.onHold);
    const total = data.available + hold + paused;
    const tile = (cls, ico, label, val, sub, act = "") => `<div class="w-tile ${cls}"><div class="w-tile__hd">${icon(ico, 16)}${label}</div><div class="w-tile__v num">${val}</div><div class="w-tile__s">${sub}</div>${act}</div>`;
    return `<section class="card w-hero2">
      <div class="row-between" style="align-items:flex-start">
        <h1>${M.t("res.wallet.title")}</h1>
        <span class="secure">${icon("shield", 16)}${M.t("res.wallet.secure")}</span>
      </div>
      <div style="margin-top:14px">
        <div class="xs muted">Total balance</div>
        <div class="money-xl" aria-live="polite">${rs(total)}</div>
        ${hold || paused ? `<p class="small muted" style="margin-top:6px">Includes ${[hold ? rs(hold) + " on hold" : "", paused ? rs(paused) + " paused for returns" : ""].filter(Boolean).join(" and ")}. Only the available amount can be used at checkout.</p>` : `<p class="small muted" style="margin-top:6px">${M.t("res.wallet.available.sub")}</p>`}
      </div>
      <div class="w-tiles">
        ${tile("avail", "wallet", "Available now", rs(data.available), "Ready to use on eligible products.")}
        ${tile("hold", "clock", "On hold", rs(hold), hold ? `From ${M.plural(data.onHold.length, "order", "orders")}${can ? ` · ${rs(can)} claimable now` : ""}` : "Nothing waiting right now", hold ? `<button class="${can ? "s-pill-rose" : "s-link small"} w-tile__btn" data-claim-any>${can ? "View &amp; claim" : "See orders"}</button>` : "")}
        ${paused ? tile("paused", "pause", "Paused for returns", rs(paused), "Updated once your return is complete") : ""}
        ${tile("exp", "clock", `Expiring in ${C.expiringSoonDays} days`, rs(soon), soon ? `Soonest: ${rs(soonList[0].remaining)} on ${date(soonList[0].expiresOn, true)}` : "Nothing expiring soon", soon ? `<a class="s-link small w-tile__btn" href="#expiring" data-goexp>View expiry dates</a>` : "")}
      </div>
    </section>`;
  }

  function tabs(active) {
    const t = (id, label) => `<button class="tab" role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${active === id}" tabindex="${active === id ? 0 : -1}" data-tab="${id}">${label}</button>`;
    return `<div class="tabs" role="tablist" aria-label="Wallet views">${t("balance", M.t("res.wallet.tab.balance"))}${t("expiring", M.t("res.wallet.tab.expiring"))}</div>`;
  }

  function onHoldCard() {
    if (!data.onHold.length) return "";
    const sum = data.onHold.reduce((t, x) => t + x.amount, 0);
    const list = [...data.onHold].sort((x, y) => (y.claim.available ? 1 : 0) - (x.claim.available ? 1 : 0));
    return `<section class="card" aria-labelledby="oh-h">
      <div class="sec-hd"><h2 id="oh-h">On hold · <span class="num">${rs(sum)}</span></h2><span class="xs muted">${M.plural(list.length, "order", "orders")}</span></div>
      <p class="small muted" style="margin:4px 0 0">Each order’s cashback is added automatically when its return window closes. Claim it sooner from the order page; that closes returns for the order.</p>
      <div class="hoc-list">${list.map((o) => M.holdOrderCard(o, M.here())).join("")}</div>
    </section>`;
  }

  function pausedCard() {
    if (!data.paused.length) return "";
    const sum = data.paused.reduce((s, x) => s + x.amount, 0);
    return `<section class="card" aria-labelledby="pz-h" style="border-color:var(--warn-line);background:#fffcf6">
      <div class="sec-hd"><h2 id="pz-h">Paused for returns · <span class="num">${rs(sum)}</span></h2></div>
      <p class="small muted" style="margin:4px 0 12px">We’ll update this cashback once your return is complete.</p>
      <ul class="list">${data.paused
        .map((p) => `<li class="li"><div class="li__ico warn">${icon("pause")}</div><div class="li__main"><div class="li__title"><span class="num">${rs(p.amount)}</span> · return of order ${ORDER_LINK(p.orderNo)} in progress</div><div class="li__sub">Return ${esc(p.returnId)}</div></div><div class="li__end"><a class="link small" href="order-details.html?s=paused">View return</a></div></li>`)
        .join("")}</ul>
    </section>`;
  }

  function recentCard() {
    if (!data.tx.length) return "";
    const n = C.historyPreviewCount;
    return `<section class="card" aria-labelledby="tx-h">
      <div class="sec-hd"><h2 id="tx-h">Recent transactions</h2>${data.tx.length > n ? `<button class="link small" data-viewall>${M.t("res.wallet.viewAll")} ${icon("arrowRight", 14)}</button>` : ""}</div>
      <ul class="list" style="margin-top:6px">${data.tx.slice(0, n).map(txRow).join("")}</ul>
    </section>`;
  }

  function allHistory() {
    const per = 20, shown = data.tx.slice(0, page * per), more = data.tx.length > shown.length;
    return `<section class="card" aria-labelledby="all-h">
      <button class="link small" data-back style="margin-bottom:14px">${icon("arrowLeft", 14)} Back to My Wallet</button>
      <div class="sec-hd"><h1 id="all-h" style="font-size:24px">All transactions</h1><span class="xs muted">${shown.length} of ${data.tx.length}</span></div>
      <ul class="list" style="margin-top:10px">${shown.map(txRow).join("")}</ul>
      ${more ? `<div style="text-align:center;margin-top:16px"><button class="btn btn--ghost" data-more>Load more</button></div>` : `<p class="xs muted" style="text-align:center;margin-top:16px">That’s everything.</p>`}
    </section>`;
  }

  function creditRow(c) {
    const src = c.source === "CASHBACK" ? `Cashback · order ${ORDER_LINK(c.orderNo)}` : esc(c.message);
    const sub = c.source === "BRAND_CREDIT" ? "Gift from Mia" : "";
    if (c.status === "PROJECTED")
      return `<div class="credit credit--projected"><div><div class="li__title">${src}</div><div class="li__sub">${c.creditOn ? `If added on ${date(c.creditOn, true)}, valid till ${date(c.expiresOn)}` : "Added after the return window, then valid " + C.cashbackValidityDays + " days"}</div></div><div style="text-align:right"><div class="money-lg">${rs(c.remaining)}</div><span class="badge badge--mute">${M.t("res.wallet.chip.projected")}</span></div></div>`;
    if (c.status === "EXPIRED")
      return `<div class="credit credit--expired"><div><div class="li__title" style="color:var(--muted)">${src}</div><div class="li__sub">${rs(c.expiredAmount)} expired on ${date(c.expiresOn, true)}${c.originalAmount !== c.expiredAmount ? ` · ${rs(c.originalAmount - c.expiredAmount)} was used` : ""}</div></div><div style="text-align:right"><div class="money-lg">${rs(c.expiredAmount)}</div><span class="badge badge--mute">${M.t("res.wallet.chip.expired")}</span></div></div>`;
    const soon = M.daysUntil(c.expiresOn) <= 7;
    const used = c.originalAmount - c.remaining;
    return `<div class="credit"><div><div class="li__title">${src}</div><div class="li__sub">${sub ? sub + " · " : ""}<span ${soon ? 'style="color:var(--warn);font-weight:600"' : ""}>${M.expiryText(c.expiresOn)}</span></div></div>
      <div style="text-align:right"><div class="money-lg">${rs(c.remaining)}</div>${used ? `<div class="xs muted">left of ${rs(c.originalAmount)} · ${rs(used)} used</div>` : ""}<span class="badge ${soon ? "badge--warn" : "badge--pos"}" style="margin-top:4px">${soon ? M.t("res.wallet.chip.soon") : M.t("res.wallet.chip.active")}</span></div></div>`;
  }

  function expiringPanel() {
    const active = data.credits.filter((c) => c.status === "ACTIVE" || c.status === "EXPIRING_SOON").sort((a, b) => a.expiresOn.localeCompare(b.expiresOn));
    const projected = data.onHold.map((o) => ({ id: "p" + o.orderNo, source: "CASHBACK", orderNo: o.orderNo, remaining: o.amount, originalAmount: o.amount, creditOn: o.creditOn, expiresOn: o.creditOn ? add(o.creditOn, C.cashbackValidityDays) : null, status: "PROJECTED" }));
    const expired = data.credits.filter((c) => c.status === "EXPIRED");
    const soonAmt = active.filter((c) => M.daysUntil(c.expiresOn) <= C.expiringSoonDays).reduce((s, c) => s + c.remaining, 0);
    const within7 = active.filter((c) => M.daysUntil(c.expiresOn) <= 7);
    if (!active.length && !projected.length && !expired.length)
      return `<section class="card empty"><div class="empty__art">${icon("clock")}</div><h2>No credits yet</h2><p class="muted" style="margin-top:6px">When cashback or a gift from Mia arrives, its expiry date shows up here.</p></section>`;
    return `<section class="card">
        <div class="eyebrow">Next ${C.expiringSoonDays} days</div>
        <div class="money-lg" style="margin-top:6px;font-size:26px">${soonAmt ? M.t("res.wallet.expiring.headline", { amount: rs(soonAmt), days: C.expiringSoonDays }) : M.t("res.wallet.expiring.none", { days: C.expiringSoonDays })}</div>
        ${within7.length ? `<div class="note note--warn" style="margin-top:14px">${icon("clock")}<span><strong>${rs(within7.reduce((s, c) => s + c.remaining, 0))}</strong> expires within 7 days. Use it on your next order. We always use what expires soonest first.</span></div>` : soonAmt ? "" : `<p class="small muted" style="margin-top:6px">We always use what expires soonest first.</p>`}
      </section>
      ${active.length ? `<section class="card"><div class="sec-hd"><h2>Active credits</h2><span class="xs muted">Soonest first</span></div>${active.map(creditRow).join("")}</section>` : ""}
      ${projected.length ? `<section class="card"><div class="sec-hd"><h2>Coming after the return window</h2></div><p class="small muted" style="margin-top:4px">Cashback on hold. Not spendable yet.</p>${projected.map(creditRow).join("")}</section>` : ""}
      ${expired.length ? `<section class="card"><div class="sec-hd"><h2>Expired</h2></div>${expired.map(creditRow).join("")}</section>` : ""}`;
  }

  function emptyState() {
    return `<section class="card empty"><div class="empty__art">${icon("wallet")}</div><h2>${M.t("res.wallet.empty.title")}</h2><p class="muted" style="margin-top:6px;max-width:340px;margin-inline:auto">${M.t("res.wallet.empty.body")}</p><a class="btn btn--primary" style="margin-top:20px" href="pdp.html">Start shopping</a></section>`;
  }

  function skeleton() {
    const line = (w, h = 14) => `<div class="skel" style="height:${h}px;width:${w}"></div>`;
    return `<section class="card" aria-busy="true" aria-label="Loading your Mia Wallet"><div class="row-between">${line("140px", 28)}${line("110px", 16)}</div><div style="margin-top:22px">${line("90px", 12)}<div style="height:10px"></div>${line("180px", 44)}<div style="height:10px"></div>${line("220px", 12)}</div></section>
      <div class="tabs">${line("170px", 40)}${line("140px", 40)}</div>
      <section class="card">${[1, 2, 3, 4].map(() => `<div class="li"><div class="skel" style="width:40px;height:40px;border-radius:12px"></div><div class="li__main">${line("60%")}<div style="height:6px"></div>${line("35%", 12)}</div>${line("64px")}</div>`).join("")}</section>`;
  }

  M.page({
    id: "wallet",
    layout: "account",
    nav: "wallet",
    pageView: "wallet_page_view",
    crumbs: () => [["Home", "index.html"], ["My Account", "#"], ["My Wallet"]],
    scenarios: [
      { id: "regular", group: "Customers", label: "Regular · ₹1,560 + 2 orders on hold", desc: "Total ₹3,470 = ₹1,560 available + ₹1,910 on hold from 2 orders. The On hold section lists each order with its items, amount and return deadline. ‘Review & claim’ opens the order page; after claiming, ‘Back to My Wallet’ returns here with the amount moved into Available." },
      { id: "busy", group: "Customers", label: "Everything at once · on hold + paused", desc: "Four on-hold orders (two claimable, one not delivered, one high-value with early claim off) and one paused by a return. Claimable orders are listed first." },
      { id: "new", group: "Customers", label: "New customer · empty wallet", desc: "Fixture 1. ₹0, nothing pending, no history → empty state. Menu chip still shows ₹0 (allowed when loaded)." },
      { id: "waiting", group: "Customers", label: "₹0 available · ₹1,000 on hold (not delivered)", desc: "Fixture 3. Nothing spendable, cashback waiting for delivery. No Claim CTA before delivery." },
      { id: "claimable", group: "Customers", label: "₹200 available · 1 order claimable", desc: "Fixture 4. One delivered order with ₹1,000 claimable. After claiming on the order page, it moves into Available with a ‘Cashback claimed early’ transaction." },
      { id: "claimed", group: "Customers", label: "Claimed early · ₹1,000 credited", desc: "Fixture 5. History shows ‘Cashback claimed early · returns closed’." },
      { id: "returning", group: "Customers", label: "Return in progress · ₹1,000 paused", desc: "Fixture 6. Paused cashback appears only in the Paused section, never in the balance or history." },
      { id: "zeroHistory", group: "Customers", label: "₹0 balance with past history", desc: "Everything was used or expired. Not the empty state: history still shows." },
      { id: "expiring", group: "Expiring Balance tab", label: "Credits with every chip state", desc: "Active, Expiring soon (≤ 7 days), Expired (kept in the list). Partly used credit shows ‘of ₹300’ with a bar." },
      { id: "expProjected", group: "Expiring Balance tab", label: "With projected (on-hold) credits", desc: "On-hold cashback appears greyed as Projected with ‘if added on…, valid till…’." },
      { id: "expNone", group: "Expiring Balance tab", label: "Nothing expiring in 30 days", desc: "Headline switches to ‘Nothing expiring in the next 30 days.’" },
      { id: "viewAll", group: "History", label: "View all · 47 transactions (paged)", desc: "Full list, 20 per page with Load more. Recent list shows CONFIG historyPreviewCount (10)." },
      { id: "viewAllEnd", group: "History", label: "View all · end of list", desc: "Second page reaches the end: ‘That’s everything.’" },
      { id: "historyShort", group: "History", label: "Fewer than 10 transactions", desc: "No View all link when everything fits in the preview." },
      { id: "loading", group: "System", label: "Loading (skeletons)", desc: "Skeletons only. Never a placeholder ₹0. Header chip is hidden while loading." },
      { id: "error", group: "System", label: "Couldn’t load wallet", desc: "Error state with Retry. Retry loads the Regular fixture after a short delay." },
    ],
    customerNote: (ctx) => (ctx.cust === "guest" || ctx.cust === "usd" ? "Not eligible: menu item hidden and direct visits redirect to My Profile." : ctx.cust === "intl" ? "International address only affects cart and checkout. The wallet page stays visible." : ""),
    onHold: (ctx) => (data && !["loading", "error"].includes(ctx.s) ? data.onHold.reduce((t, x) => t + x.amount, 0) : 0),
    balance: (ctx) => {
      if (ctx.s === "loading" || ctx.s === "error" || ctx.cust === "loading") return null;
      ensure(ctx);
      return data.available;
    },
    render(ctx) {
      ensure(ctx);
      if (!ctx.eligible)
        return `<div class="note note--info">${icon("info")}<span>Mia Wallet is available for logged-in customers shopping in INR. You’ve been taken to My Profile.</span></div>
          <section class="card"><h1>My Profile</h1><p class="muted" style="margin-top:8px">Hellynewnnn Shah · 6061161616</p></section>`;
      if (ctx.s === "loading" || ctx.cust === "loading") return skeleton();
      if (ctx.s === "error")
        return `<section class="card empty" role="alert"><div class="empty__art" style="background:var(--err-bg);color:var(--err)">${icon("alert")}</div><h2>${M.t("res.wallet.error")}</h2><p class="muted" style="margin-top:6px">Check your connection and try again.</p><button class="btn btn--primary" style="margin-top:20px" data-retry>${icon("refresh", 18)} Retry</button></section>`;
      if (view === "all") return allHistory();
      const isEmpty = !data.available && !data.onHold.length && !data.paused.length && !data.tx.length;
      const tab = location.hash === "#expiring" ? "expiring" : "balance";
      const panel =
        tab === "balance"
          ? isEmpty
            ? emptyState() + `<section class="card">${M.howItWorks(true)}</section>`
            : onHoldCard() + pausedCard() + recentCard() + `<section class="card" style="padding-top:8px;padding-bottom:8px">${M.howItWorks()}</section>`
          : expiringPanel();
      return hero(ctx) + tabs(tab) + `<div id="panel-${tab}" role="tabpanel" aria-labelledby="tab-${tab}" class="stack">${panel}</div>`;
    },
    mount(root, ctx) {
      root.querySelectorAll("[data-tab]").forEach((b, i, all) => {
        b.addEventListener("click", () => switchTab(b.dataset.tab, ctx));
        b.addEventListener("keydown", (e) => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          const next = all[(i + (e.key === "ArrowRight" ? 1 : -1) + all.length) % all.length];
          switchTab(next.dataset.tab, ctx, true);
        });
      });
      root.querySelectorAll('a[href="#expiring"]').forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); switchTab("expiring", ctx); }));
      root.querySelector("[data-scroll-hold]")?.addEventListener("click", () => document.getElementById("oh-h")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      root.querySelector("[data-claim-any]")?.addEventListener("click", () => M.openHoldSheet({ orders: data.onHold, back: M.here() }));
      root.querySelector("[data-retry]")?.addEventListener("click", async (e) => { M.btnBusy(e.currentTarget, true, "Retrying…"); await M.wait(900); ctx.go("regular"); });
      root.querySelector("[data-viewall]")?.addEventListener("click", () => { view = "all"; page = 1; M.track("wallet_history_view_all"); ctx.render(); });
      root.querySelector("[data-back]")?.addEventListener("click", () => { view = "main"; ctx.render(); });
      root.querySelector("[data-more]")?.addEventListener("click", async (e) => { M.btnBusy(e.currentTarget, true, "Loading…"); await M.wait(600); page++; ctx.rerender(); });
    },
  });

  function ensure(ctx) {
    const k = ctx.s + "|" + ctx.cust;
    if (k === key && data) return;
    key = k;
    view = ctx.s.startsWith("viewAll") ? "all" : "main";
    page = ctx.s === "viewAllEnd" ? 2 : 1;
    data = (FIX[ctx.s] || FIX.regular)();
    data = JSON.parse(JSON.stringify(data));
    // On-hold orders come from the order fixtures; anything claimed on an order page in this tab is already credited.
    const { holds, claimed } = M.applyClaims(data.onHold.map((x) => (typeof x === "string" ? M.holdOrder(x) : x)));
    data.onHold = holds;
    claimed.forEach((o) => {
      data.available += o.amount;
      data.tx = [tx("cl" + o.orderNo, "CASHBACK_CLAIMED", o.amount, M.TODAY_ISO, o.orderNo), ...data.tx];
      data.credits = [credit("cl" + o.orderNo, "CASHBACK", o.orderNo, null, o.amount, o.amount, o.expiresIfClaimedToday, "ACTIVE"), ...data.credits];
    });
    if (ctx.s.startsWith("exp") && location.hash !== "#expiring") history.replaceState(null, "", location.pathname + location.search + "#expiring");
    else if (!ctx.s.startsWith("exp") && location.hash === "#expiring" && ctx._booted) history.replaceState(null, "", location.pathname + location.search + "#balance");
    ctx._booted = true;
  }
  function switchTab(tab, ctx, focus) {
    history.replaceState(null, "", location.pathname + location.search + "#" + tab);
    M.track("wallet_tab_switch", { tab });
    ctx.rerender();
    if (focus) document.getElementById("tab-" + tab)?.focus();
  }
})();
