/* Product detail page cashback line (spec 6.2, P2) */
(function () {
  const M = MIA, { rs, esc, icon } = M;

  const SC = {
    gold: { name: "Infinite Shimmer 14KT Gold & Diamond Ring", price: 7200, kind: "ring", estimate: 360 },
    silver: { name: "Twisted Beam Silver Hoop Earrings", price: 1900, kind: "silver", estimate: 95 },
    discounted: { name: "Charming Heart 14KT Gold Pendant", price: 6400, sale: 5120, kind: "ring", estimate: 0, offer: "Diwali: 20% off making charges" },
    coin: { name: "0.5 Gram 24KT Mango Leaf Gold Coin", price: 7813, kind: "coin", estimate: 0 },
    zero: { name: "Tiny Star 14KT Gold Nose Pin", price: 1200, kind: "ring", estimate: 0 },
    loading: { name: "Infinite Shimmer 14KT Gold & Diamond Ring", price: 7200, kind: "ring", estimate: 360, loading: true },
  };

  M.page({
    id: "pdp",
    layout: "shop",
    crumbs: () => [["Home", "index.html"], ["Rings", "#"], ["Product"]],
    scenarios: [
      { id: "gold", label: "Eligible gold product", desc: "‘Earn up to ₹360 cashback’ from GET /cashback/estimate (single unit). Always ‘up to’." },
      { id: "silver", label: "Eligible silver product", desc: "Same line; the return window for silver is 7 days." },
      { id: "discounted", label: "Product with a discount (hidden)", desc: "Discounted products never earn: no line." },
      { id: "coin", label: "Gold coin (hidden)", desc: "Coins and gift cards never earn: no line." },
      { id: "zero", label: "Estimate is ₹0 (hidden)", desc: "API returns 0: no line." },
      { id: "loading", label: "Estimate loading", desc: "Small skeleton, never ‘₹0’." },
    ],
    render(ctx) {
      const p = SC[ctx.s];
      const earn = !ctx.eligible || p.offer || p.kind === "coin"
        ? ""
        : p.loading
          ? `<div class="earn" aria-busy="true"><div class="skel" style="width:24px;height:24px;border-radius:50%"></div><div style="flex:1"><div class="skel" style="height:14px;width:60%"></div><div class="skel" style="height:11px;width:80%;margin-top:6px"></div></div></div>`
          : p.estimate > 0
            ? `<div class="earn">${icon("sparkle", 22)}<div><div class="strong">Earn up to ${rs(p.estimate)} cashback</div><div class="xs muted">Added to your Mia Wallet after the return window</div></div><button class="link xs" style="margin-left:auto" data-how aria-label="How cashback works">${icon("info", 18)}</button></div>`
            : "";
      return `<div class="pdp">
        <div class="pdp__img ${p.kind === "coin" ? "pdp__img--coin" : ""}" aria-hidden="true">${icon(p.kind === "coin" ? "coin" : p.kind === "silver" ? "sparkle" : "ring", 120)}</div>
        <div class="stack">
          <div><div class="eyebrow">Mia by Tanishq</div><h1 style="margin-top:6px">${esc(p.name)}</h1></div>
          <div class="row" style="gap:10px;align-items:baseline"><span class="pdp__price">${rs(p.sale || p.price)}</span>${p.sale ? `<s class="muted">${rs(p.price)}</s>` : ""}<span class="xs muted">Incl. of all taxes</span></div>
          ${p.offer ? `<span class="tag tag--disc" style="width:max-content">${esc(p.offer)}</span>` : ""}
          ${earn}
          <div class="row" style="gap:12px"><a class="btn btn--primary" style="flex:1" href="cart.html">Add to bag</a><button class="btn btn--ghost" aria-label="Add to wishlist">${icon("heart")}</button></div>
          <div class="note note--info">${icon("truck")}<span>Free delivery by ${M.date(M.addDays(M.TODAY_ISO, 5), true)} to 560038</span></div>
        </div></div>`;
    },
    mount(root) { root.querySelector("[data-how]")?.addEventListener("click", M.openHowItWorks); },
  });
})();
