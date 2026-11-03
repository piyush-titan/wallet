/* Product detail page: replica of the stg PDP with Mia Wallet + cashback additions (spec 6.2, P2) */
(function () {
  const M = MIA, { rs, esc, icon } = M;
  const IMG = "assets/img/";
  const fmt = (n) => "₹" + new Intl.NumberFormat("en-IN").format(n);

  const SILVER = { name: "Triple Glow Silver Stud Earrings", cat: "Silver Jewellery", crumb: "Earrings", price: 2099, kind: "silver", metal: ["925", "Karat", "Silver"], extra: [["Gemstone", "24 · Synthetic white Pearl, White Cubic Zirconia"]], imgs: ["pdp-1.jpg", "pdp-2.jpg", "pdp-3.jpg", "pdp-4.jpg"], ribbon: "BEST SELLER", ucp: true, returns: "7-Day Returns" };
  const GOLD = { name: "Infinite Shimmer 14KT Gold & Diamond Ring", cat: "Diamond Jewellery", crumb: "Rings", price: 7200, kind: "ring", metal: ["14", "Karat", "Yellow Gold", "gold"], extra: [["Diamonds", "Round · 0.046 Ct"], ["Occasion", "Everydays/Workwear"], ["Gross Weight", "2.410g"]], imgs: ["ring.jpg", "studs.jpg", "pendant.jpg"], ribbon: "NEW ARRIVAL", returns: "30-Day Returns" };

  // Estimate comes from GET /cashback/estimate?productId=&qty=1 (single unit). The UI never computes it.
  const SC = {
    silver: { p: SILVER, estimate: 105 },
    gold: { p: GOLD, estimate: 360 },
    walletZero: { p: SILVER, estimate: 105, wallet: { available: 0, onHold: 0 } },
    holdOnly: { p: GOLD, estimate: 360, wallet: { available: 0, onHold: 1910 } },
    discounted: { p: { ...GOLD, name: "Charming Heart 14KT Gold Pendant", price: 6400, sale: 5120, offer: "20% off on making charges", imgs: ["pendant.jpg", "ring.jpg"], ribbon: "30% OFF ON MC" }, estimate: 0, reason: "offer" },
    coin: { p: { ...GOLD, name: "0.5 Gram 24 Karat Mango Leaf Gold Coin", cat: "Gold Coins", crumb: "Coins", price: 7813, kind: "coin", metal: ["24", "Karat", "Yellow Gold", "gold"], extra: [["Weight", "0.5 g"], ["Purity", "999.9"]], imgs: ["coin.jpg"], ribbon: "", returns: "No Returns" }, estimate: 0, reason: "coin" },
    zero: { p: SILVER, estimate: 0 },
    loading: { p: SILVER, estimate: 105, loading: true },
  };

  function cashbackCard(c, ctx) {
    if (!ctx.eligible) return "";
    const w = c.wallet || M.chromeWallet();
    const walletRow = w.available > 0
      ? `<div class="p-cb__wallet"><img src="${IMG}ic-wallet.svg" alt=""><span><b>${rs(w.available)}</b> in your Mia Wallet. Use up to ${M.config.redemptionPercent}% of this product’s price at checkout.</span><a href="wallet.html">View</a></div>`
      : w.onHold > 0
        ? `<div class="p-cb__wallet"><img src="${IMG}ic-wallet.svg" alt=""><span><b>${rs(w.onHold)}</b> cashback on hold in your Mia Wallet. Claim it to use it on this product.</span><a href="wallet.html">View</a></div>`
        : "";
    // Wallet money can't be used on coins or on products carrying an offer.
    const walletUsable = !c.reason;
    if (c.loading)
      return `<div class="p-cb" aria-busy="true"><div class="p-cb__row"><div class="skel" style="width:36px;height:36px;border-radius:50%"></div><div style="flex:1"><div class="skel" style="height:13px;width:62%"></div><div class="skel" style="height:10px;width:85%;margin-top:6px"></div></div></div></div>`;
    if (!c.estimate) {
      if (!walletRow || !walletUsable) return c.reason ? `<div class="p-cb"><div class="p-cb__no">${icon("info", 16)}<span>${c.reason === "coin" ? "Coins don’t earn cashback, and Mia Wallet can’t be used on them." : "Products with an offer don’t earn cashback, and Mia Wallet can’t be used on them."}</span></div></div>` : "";
      return `<div class="p-cb">${walletRow.replace("p-cb__wallet", "p-cb__wallet\" style=\"border-top:0")}</div>`;
    }
    return `<div class="p-cb" aria-label="Cashback">
      <div class="p-cb__row"><span class="p-cb__ic"><img src="${IMG}ic-cashback.svg" alt=""></span>
        <div><div class="p-cb__t">Earn up to <b>${rs(c.estimate)}</b> cashback</div><div class="p-cb__s">Added to your Mia Wallet after the return window</div></div>
        <button class="p-cb__link" data-how>How it works</button></div>
      ${walletRow}</div>`;
  }

  M.page({
    id: "pdp",
    layout: "raw",
    crumbs: null,
    scenarios: [
      { id: "silver", group: "Earns cashback", label: "Silver earrings (as on stg)", desc: "Replica of the live PDP for Triple Glow Silver Stud Earrings. New: ‘Earn up to ₹105 cashback’ under the price, the customer’s Mia Wallet balance, and a cashback chip in the sticky bar. The amount comes from GET /cashback/estimate (one unit) and is always ‘up to’." },
      { id: "gold", group: "Earns cashback", label: "Gold & diamond ring", desc: "Same layout with gold metal styling and more specs." },
      { id: "walletZero", group: "Wallet balance", label: "₹0 wallet, nothing on hold", desc: "Cashback line only; no wallet row." },
      { id: "holdOnly", group: "Wallet balance", label: "₹0 available, ₹1,910 on hold", desc: "Wallet row nudges the customer to claim cashback on hold so they can use it on this product." },
      { id: "discounted", group: "No cashback", label: "Product with an offer", desc: "Discounted products never earn and can’t use the wallet: a short explanation replaces the cashback line, and there’s no chip in the sticky bar." },
      { id: "coin", group: "No cashback", label: "Gold coin", desc: "Coins never earn and can’t use the wallet." },
      { id: "zero", group: "No cashback", label: "Estimate is ₹0", desc: "API returns 0: cashback line hidden, wallet row still shown." },
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
              <div class="p-thumbs">${p.imgs.map((im, i) => `<button class="p-thumb ${i ? "" : "active"}" data-img="${im}" aria-label="Image ${i + 1}"><img src="${IMG}${im}" alt=""></button>`).join("")}${p.kind === "silver" ? `<button class="p-thumb" aria-label="Video"><span class="play"></span></button>` : ""}</div>
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
              <div class="p-metal"><b class="${p.metal[3] || ""}">${p.metal[0]} ${p.metal[1]}</b><span>${p.metal[2]}</span></div>
              <div class="p-extra">${p.extra.map((x) => `<div><small>${x[0]}</small><span>${esc(x[1])}</span></div>`).join("")}</div>
              <button class="p-more">View Full Product Details <span aria-hidden="true">+</span></button>
            </section>
            <section class="p-buy">
              <div class="p-price"><div class="v">${fmt(p.sale || p.price)}${p.sale ? `<s>${fmt(p.price)}</s><span class="off">${esc(p.offer)}</span>` : ""}</div>${p.ucp ? `<div class="note">UCP Products do not have Price Breakup.</div>` : ""}</div>
              ${cashbackCard(c, ctx)}
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
        <div class="p-sticky__btns"><button class="p-sticky__buy">Buy Now</button><button class="p-sticky__add" onclick="location.href='cart.html'">${icon("bag", 16)} Add to Bag</button></div>
      </div>`;
    },
    mount(root) {
      const app = document.getElementById("app");
      app.querySelectorAll("[data-how]").forEach((b) => b.addEventListener("click", M.openHowItWorks));
      app.querySelectorAll("[data-img]").forEach((b) =>
        b.addEventListener("click", () => {
          app.querySelector("[data-main]").src = IMG + b.dataset.img;
          app.querySelectorAll(".p-thumb").forEach((t) => t.classList.toggle("active", t === b));
        })
      );
    },
  });
})();
