/* Product detail page: replica of the stg PDP with Mia Wallet + cashback additions (spec 6.2, P2) */
(function () {
  const M = MIA, { rs, esc, icon } = M;
  const IMG = "assets/img/";
  const fmt = (n) => "₹" + new Intl.NumberFormat("en-IN").format(n);

  // Arch Sparkle Diamond Ring, copied from the stg PDP (price breakup, sizes and weights as on the live page).
  const DIAMOND = {
    name: "Arch Sparkle Diamond Ring", cat: "Diamond Jewellery", crumb: "Rings", price: 23168, kind: "ring",
    metal: ["14", "Karat", "Yellow Gold", "gold"], net: "1.287gm",
    extra: [["Diamonds", "Round · 0.065 Ct"], ["Occasion", "Classic"], ["Gross Weight", "1.3g"]],
    imgs: ["dr-1.jpg", "dr-2.jpg", "dr-3.jpg", "dr-4.jpg"], ribbon: "", returns: "30-Day Returns",
    pbu: { gold: ["10524.15", "1.287g", "8177.27"], diamond: ["7563.1", "0.065 ct · 0.013 g"], making: "4406.00", sub: "22493.25", gst: "674.8", grand: "23168" },
    sizes: [["16.40 MM"], ["16.80 MM", "disabled"], ["17.20 MM", "active"]],
    weights: [["1.063 g"], ["1.153 g"], ["1.203 g"], ["1.225 g"], ["1.3 g", "active"], ["1.359 g"]],
  };
  // Same ring with the festive "30% off on making charges" offer (Oracle discount): never earns cashback, can't use the wallet.
  const DIAMOND_OFFER = {
    ...DIAMOND, price: 23168, sale: 21807, offer: "30% off on making charges", ribbon: "30% OFF ON MC",
    pbu: { ...DIAMOND.pbu, mcOff: "1321.80", sub: "21171.45", gst: "635.14", grand: "21807" },
  };
  const COIN = {
    name: "0.5 Gram 24 Karat Mango Leaf Gold Coin", cat: "Gold Coins", crumb: "Coins", price: 7813, kind: "coin",
    metal: ["24", "Karat", "Yellow Gold", "gold"], net: "0.5gm", extra: [["Purity", "999.9"], ["Gross Weight", "0.5g"]],
    imgs: ["coin.jpg"], ribbon: "", returns: "No Returns",
    pbu: { gold: ["7585.44", "0.5g", "15170.87"], making: "0.00", sub: "7585.44", gst: "227.56", grand: "7813" },
  };

  // Estimate comes from GET /cashback/estimate?productId=&qty=1 (single unit). The UI never computes it.
  const SC = {
    diamond: { p: DIAMOND, estimate: 1158 },
    walletZero: { p: DIAMOND, estimate: 1158, wallet: { available: 0, onHold: 0 } },
    holdOnly: { p: DIAMOND, estimate: 1158, wallet: { available: 0, onHold: 1910 } },
    offerMC: { p: DIAMOND_OFFER, estimate: 0, reason: "offer" },
    coin: { p: COIN, estimate: 0, reason: "coin" },
    zero: { p: DIAMOND, estimate: 0 },
    loading: { p: DIAMOND, estimate: 1158, loading: true },
  };

  function breakup(p) {
    const b = p.pbu;
    if (!b) return "";
    return `<div class="p-pbu" data-pbu>
      <button class="p-pbu__btn" type="button" aria-expanded="false" data-pbu-btn><span>${icon("receipt", 14)}Price Breakup</span><i aria-hidden="true"></i></button>
      <div class="p-pbu__body">
        <div class="p-pbu__sec"><div class="p-pbu__hd"><span class="p-pbu__h gold">Gold Value</span><span class="p-pbu__v">₹ ${b.gold[0]}</span></div><div class="p-pbu__det">Weight <b>${b.gold[1]}</b> Rate <b>₹ ${b.gold[2]}/g</b></div></div>
        ${b.diamond ? `<div class="p-pbu__sec"><div class="p-pbu__hd"><span class="p-pbu__h diamond">Diamond Value</span><span class="p-pbu__v">₹ ${b.diamond[0]}</span></div><div class="p-pbu__det">Weight <b>${b.diamond[1]}</b></div></div>` : ""}
        <div class="p-pbu__rows">
          <div class="p-pbu__row"><span>Making Charges</span><b>₹ ${b.making}</b></div>
          ${b.mcOff ? `<div class="p-pbu__row"><span>Making Charges Discount (30%)</span><b class="disc">- ₹ ${b.mcOff}</b></div>` : ""}
          <div class="p-pbu__row bold"><span>Sub Total</span><b>₹ ${b.sub}</b></div>
          <div class="p-pbu__row"><span>GST</span><b>₹ ${b.gst}</b></div>
        </div>
        <div class="p-pbu__gt"><span>Grand Total</span><b>₹ ${b.grand}</b></div>
      </div></div>`;
  }

  function variations(p) {
    if (!p.sizes) return "";
    const chips = (list, key) => `<ul>${list.map(([v, st]) => `<li><button type="button" data-var="${key}" class="${st === "active" ? "active" : ""}" ${st === "disabled" ? "disabled" : ""} aria-pressed="${st === "active"}">${v}</button></li>`).join("")}</ul>`;
    return `<div class="p-var">
      <div class="p-var__item"><div class="p-var__hd"><span class="p-var__t">${icon("ring", 18)}Choose Size</span><button class="p-var__guide" type="button">Size Guide</button></div>${chips(p.sizes, "size")}</div>
      <div class="p-var__item"><div class="p-var__hd"><span class="p-var__t">${icon("sliders", 18)}Choose Gross Weight</span></div>${chips(p.weights, "weight")}</div>
    </div>`;
  }

  // Mock of the backend wallet quote for one unit: the most wallet credit usable on this product and the price after it.
  // The UI only displays these figures; in production they come from the API.
  const walletQuote = (price, credit) => {
    const use = Math.min(credit, Math.floor((price * M.config.redemptionPercent) / 100));
    return { use, pay: price - use };
  };

  // One compact card above the coupons: what you earn (cashback) and what you can pay with your wallet.
  function miaCard(c, ctx) {
    if (!ctx.eligible) return "";
    if (c.reason)
      return `<section class="p-mw" aria-label="Mia Wallet"><div class="p-mw__row is-note">${icon("info", 16)}<span>${c.reason === "coin" ? "Coins don’t earn cashback and can’t be paid for with Mia Wallet." : "Making-charge offer applied, so this ring doesn’t earn cashback or use Mia Wallet."}</span></div></section>`;
    const w = c.wallet || M.chromeWallet();
    const price = c.p.sale || c.p.price;
    const row = (ico, title, sub, action = "", cls = "") =>
      `<div class="p-mw__row ${cls}"><img class="p-mw__ic" src="${IMG}${ico}" alt=""><div class="p-mw__txt"><div class="p-mw__t">${title}</div><div class="p-mw__s">${sub}</div></div>${action}</div>`;
    const earn = c.loading
      ? `<div class="p-mw__row" aria-busy="true"><div class="skel p-mw__ic" style="border-radius:50%"></div><div class="p-mw__txt"><div class="skel" style="height:12px;width:58%"></div><div class="skel" style="height:10px;width:78%;margin-top:6px"></div></div></div>`
      : c.estimate
        ? row("ic-cashback.svg", `Earn up to <b class="rose">${rs(c.estimate)}</b> cashback`, "Added to your wallet once returns close", `<button class="p-mw__a" data-how aria-label="How cashback works"><span>How it works</span>${icon("info", 15)}</button>`)
        : "";
    let spend = "";
    if (w.available > 0) {
      const q = walletQuote(price, w.available);
      spend = row("ic-wallet.svg", `Pay <b>${fmt(q.pay)}</b> with Mia Wallet <span class="p-mw__save">−${rs(q.use)}</span>`, q.use < w.available ? `Uses ${rs(q.use)} of your ${rs(w.available)} credit · apply in bag` : `Uses your ${rs(q.use)} credit · apply in bag`);
    } else if (w.onHold > 0) {
      const q = walletQuote(price, w.onHold);
      spend = row("ic-wallet.svg", `Pay as low as <b>${fmt(q.pay)}</b>`, `Claim your ${rs(w.onHold)} cashback on hold`, `<a class="p-mw__a" href="wallet.html"><span>Claim</span>${icon("chevronRight", 15)}</a>`);
    }
    if (!earn && !spend) return "";
    return `<section class="p-mw" aria-label="Cashback and Mia Wallet">${earn}${spend}</section>`;
  }

  M.page({
    id: "pdp",
    layout: "raw",
    crumbs: null,
    scenarios: [
      { id: "diamond", group: "Earns cashback", label: "Diamond ring (as on stg)", desc: "Replica of the live PDP for Arch Sparkle Diamond Ring (₹23,168): price breakup, Choose Size / Gross Weight chips, sticky bar with size pill. New: one compact card above the coupons with ‘Earn up to ₹1,158 cashback’ and ‘Pay ₹21,608 with Mia Wallet (−₹1,560)’, plus a cashback chip in the sticky bar. Amount comes from GET /cashback/estimate (one unit) and is always ‘up to’." },
      { id: "walletZero", group: "Wallet balance", label: "₹0 wallet, nothing on hold", desc: "Only the cashback row; no wallet row." },
      { id: "holdOnly", group: "Wallet balance", label: "₹0 available, ₹1,910 on hold", desc: "Wallet row shows the price they could pay by claiming their cashback on hold, with a Claim link." },
      { id: "offerMC", group: "No cashback", label: "Ring with 30% off on making charges", desc: "Festive making-charge offer (Oracle discount): price shows the strike-through and the discount in the breakup. Discounted products never earn and can’t use the wallet, so a short explanation replaces the cashback line and there’s no chip." },
      { id: "coin", group: "No cashback", label: "Gold coin", desc: "Coins never earn and can’t use the wallet." },
      { id: "zero", group: "No cashback", label: "Estimate is ₹0", desc: "API returns 0: cashback row hidden, wallet row still shown." },
      { id: "loading", group: "System", label: "Estimate loading", desc: "Small skeleton, never ‘₹0’." },
    ],
    customerNote: (ctx) => (ctx.cust === "guest" || ctx.cust === "usd" ? "Not eligible: no cashback line, wallet row or sticky-bar chip." : ""),
    render(ctx) {
      document.body.classList.add("has-pdp-bar");
      const c = SC[ctx.s], p = c.p;
      const showCb = ctx.eligible && c.estimate > 0 && !c.loading;
      return `<div class="p-wrap">
        <nav class="p-crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a>${icon("chevronRight", 7)}<a href="#">${esc(p.crumb)}</a>${icon("chevronRight", 7)}<b>${esc(p.name)}</b></nav>
        <div class="p-grid">
          <div class="p-gal">
            <div class="p-gal__box">
              <div class="p-thumbs">${p.imgs.map((im, i) => `<button class="p-thumb ${i ? "" : "active"}" data-img="${im}" aria-label="Image ${i + 1}"><img src="${IMG}${im}" alt=""></button>`).join("")}${p.kind === "ring" ? `<button class="p-thumb" aria-label="Video"><span class="play"></span></button>` : ""}</div>
              <div class="p-main"><img src="${IMG}${p.imgs[0]}" alt="${esc(p.name)}" data-main>${p.ribbon ? `<span class="p-ribbon">${esc(p.ribbon)} ✦</span>` : ""}<span class="p-similar">${icon("search", 12)}Show Similar</span></div>
            </div>
            <div class="p-trust"><div><img src="${IMG}cert-bis.svg" alt="BIS hallmark"></div><div><img src="${IMG}tata.svg" alt="A Tata product"></div><div><img src="${IMG}cert-1yr.svg" alt="1 year warranty"></div></div>
          </div>
          <div class="p-info">
            <div>
              <div class="p-cat">${esc(p.cat)}</div>
              <div class="p-title"><h1>${esc(p.name)}</h1><div class="p-acts"><button aria-label="Add to wishlist">${icon("heart", 17)}</button><button aria-label="Share">${icon("arrowUpRight", 17)}</button></div></div>
            </div>
            <section class="p-specs">
              <h3>Metal</h3>
              <div class="p-metal"><b class="${p.metal[3] || ""}">${p.metal[0]} ${p.metal[1]}</b><span>${p.metal[2]}</span>${p.net ? `<small style="font:400 11px 'Albert Sans',sans-serif;color:#8a7a80;margin-left:4px">· Net <b style="background:none;-webkit-text-fill-color:#43323a;color:#43323a;font:600 12px 'Albert Sans',sans-serif">${p.net}</b></small>` : ""}</div>
              <div class="p-extra">${p.extra.map((x) => `<div><small>${x[0]}</small><span>${esc(x[1])}</span></div>`).join("")}</div>
              <button class="p-more">View Full Product Details <span aria-hidden="true">+</span></button>
            </section>
            <section class="p-buy">
              <div class="p-price"><div class="v">${fmt(p.sale || p.price)}${p.sale ? `<s>${fmt(p.price)}</s><span class="off">${esc(p.offer)}</span>` : ""}</div></div>
              ${breakup(p)}
              ${variations(p)}
              ${miaCard(c, ctx)}
              <div class="p-coupons__hd"><span><img src="${IMG}pdp-offer.svg" alt=""></span><b>Available coupons</b></div>
              <div class="p-coupons__stage">
                <button class="p-arrow l" aria-label="Previous coupon">${icon("chevronRight", 12, 'style="transform:rotate(180deg)"')}</button>
                <div class="p-coupon side-l"><div class="h">Anniversary Special</div><div class="f">Flat ₹2000/- Off</div><div class="d">Applicable on your anniversary month</div><div class="c">Use code: <b>ANNIV500</b></div></div>
                <div class="p-coupon side-r"><div class="h">Birthday Special</div><div class="f">Flat ₹2000/- Off</div><div class="d">Applicable on your birthday month</div><div class="c">Use code: <b>BIRTHDAY500</b></div></div>
                <div class="p-coupon active"><div class="h">MIA 500</div><div class="f">Flat ₹500/- Off</div><div class="d">Applicable for your first purchase</div><div class="c">Use code: <b>MIA500</b><u>View Details</u></div></div>
                <button class="p-arrow r" aria-label="Next coupon">${icon("chevronRight", 12)}</button>
              </div>
              <div class="p-dots"><i class="on"></i><i></i><i></i></div>
              <div class="p-cta">
                <button class="p-cta__buy">Buy Now <span style="display:inline-flex;gap:5px;color:#5f259f;font-weight:900">पे <span style="color:#4285f4">G</span> <span style="color:#eb001b">●</span></span></button>
                <div class="p-cta__row"><button class="p-cta__pre">Pre Book Now</button><a class="p-cta__add" href="cart.html" style="text-decoration:none">${icon("bag", 18)} Add to Bag</a></div>
                <div class="p-green">100% Recycled Gold for a Greener World</div>
              </div>
              <div class="p-deliv">
                <div class="p-deliv__hd">${icon("truck", 28)}Delivery &amp; Availability</div>
                <div class="p-deliv__row"><span class="cc">🇮🇳 IN</span><input placeholder="Enter Pincode" aria-label="Pincode"><button>Check</button></div>
                <div class="p-badges"><div>${icon("truck")}Free Shipping</div><div>${icon("refresh")}Lifetime Exchange</div><div>${icon("undo")}${esc(p.returns)}</div></div>
              </div>
              <div class="p-fis"><img class="bg" src="${IMG}pdp-fis-bg.svg" alt=""><div class="t"><img src="${IMG}pdp-fis.svg" alt="">Find In Store</div><p class="s">Locate this product at a Mia store near you</p><button><img src="${IMG}pdp-search.svg" alt="" style="width:14px">Check Store Availability</button></div>
            </section>
          </div>
        </div>
      </div>
      <div class="p-sticky" role="region" aria-label="Buy">
        <div class="p-sticky__l"><div class="p-sticky__n">${esc(p.name)}</div><div class="p-sticky__p">${fmt(p.sale || p.price)}${showCb ? `<span class="p-sticky__cb">${icon("sparkle", 11)}Earn <span class="long">up to</span> ${rs(c.estimate)} cashback</span>` : ""}</div></div>
        ${p.sizes ? `<span class="p-sticky__var" data-sticky-var>${p.sizes.find((x) => x[1] === "active")[0]}<i></i>${p.weights.find((x) => x[1] === "active")[0]}</span>` : ""}
        <div class="p-sticky__btns"><button class="p-sticky__buy">Buy Now</button><button class="p-sticky__add" onclick="location.href='cart.html'">${icon("bag", 16)} Add to Bag</button></div>
      </div>`;
    },
    mount(root) {
      const app = document.getElementById("app");
      app.querySelectorAll("[data-how]").forEach((b) => b.addEventListener("click", M.openHowItWorks));
      app.querySelector("[data-pbu-btn]")?.addEventListener("click", (e) => {
        const box = app.querySelector("[data-pbu]");
        box.classList.toggle("open");
        e.currentTarget.setAttribute("aria-expanded", String(box.classList.contains("open")));
      });
      app.querySelectorAll("[data-var]").forEach((b) =>
        b.addEventListener("click", () => {
          app.querySelectorAll(`[data-var="${b.dataset.var}"]`).forEach((x) => { x.classList.toggle("active", x === b); x.setAttribute("aria-pressed", String(x === b)); });
          const pick = (k) => app.querySelector(`[data-var="${k}"].active`)?.textContent || "";
          const pill = app.querySelector("[data-sticky-var]");
          if (pill) pill.innerHTML = `${pick("size")}<i></i>${pick("weight")}`;
        })
      );
      app.querySelectorAll("[data-img]").forEach((b) =>
        b.addEventListener("click", () => {
          app.querySelector("[data-main]").src = IMG + b.dataset.img;
          app.querySelectorAll(".p-thumb").forEach((t) => t.classList.toggle("active", t === b));
        })
      );
    },
  });
})();
