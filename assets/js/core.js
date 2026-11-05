/* Mia Wallet & Cashback prototype: core runtime.
   Formatting, icons, page chrome, modal/sheet, toasts, analytics stub and the edge-case switcher. */
(function () {
  const MIA = (window.MIA = window.MIA || {});

  // Fixed "today" so every fixture date stays consistent.
  MIA.TODAY_ISO = "2026-10-30";
  MIA.TODAY = new Date(MIA.TODAY_ISO + "T00:00:00");

  // CONFIG values (spec section 0.6). Read from here, never hard-code in pages.
  MIA.config = {
    redemptionPercent: 80,
    maxRedemptionsPerMonth: 3,
    absoluteCapPerOrder: null,
    historyPreviewCount: 10,
    expiringSoonDays: 30,
    cashbackValidityDays: 90,
    minRefundValidityDays: 15,
    silverReturnDays: 7,
    otherReturnDays: 30,
  };

  MIA.PAGES = [
    { id: "hub", file: "index.html", title: "All screens" },
    { id: "wallet", file: "wallet.html", title: "My Wallet" },
    { id: "orders", file: "orders.html", title: "My Orders" },
    { id: "order", file: "order-details.html", title: "Order details + Claim" },
    { id: "return", file: "order-details.html?s=returnItem", title: "Return flow (order details modal)" },
    { id: "cancel", file: "order-details.html?s=cancelOrder", title: "Cancel flow (order details modal)" },
    { id: "cart", file: "cart.html", title: "Cart" },
    { id: "checkout", file: "checkout.html", title: "Checkout" },
    { id: "confirm", file: "confirmation.html", title: "Order confirmation" },
    { id: "pdp", file: "pdp.html", title: "Product page" },
  ];

  /* ---------- Formatting ---------- */
  const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  MIA.rs = (n) => "₹" + inr.format(Math.round(Number(n) || 0));
  MIA.signed = (n, dir) => (dir === "credit" ? "+" : dir === "debit" ? "\u2212" : "") + MIA.rs(n);
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const parse = (iso) => new Date(iso + "T00:00:00");
  MIA.date = (iso, compact) => {
    if (!iso) return "";
    const d = parse(iso);
    const base = d.getDate() + "\u00a0" + MON[d.getMonth()];
    return compact && d.getFullYear() === MIA.TODAY.getFullYear() ? base : base + " " + d.getFullYear();
  };
  MIA.addDays = (iso, n) => {
    const d = parse(iso || MIA.TODAY_ISO);
    d.setDate(d.getDate() + n);
    const p2 = (x) => String(x).padStart(2, "0");
    return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());
  };
  MIA.daysUntil = (iso) => Math.round((parse(iso) - MIA.TODAY) / 86400000);
  MIA.expiryText = (iso) => {
    const n = MIA.daysUntil(iso);
    if (n < 0) return "Expired " + MIA.date(iso, true);
    if (n === 0) return "Expires today";
    if (n <= 7) return "Expires in " + n + (n === 1 ? " day" : " days");
    return "Expires " + MIA.date(iso, true);
  };
  MIA.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  MIA.plural = (n, one, many) => n + " " + (n === 1 ? one : many);
  MIA.uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
  MIA.wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- Icons (24px, stroke) ---------- */
  const P = {
    wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a1 1 0 0 1 1 1v2"/><path d="M4 7.5v10A2.5 2.5 0 0 0 6.5 20H19a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5Z"/><circle cx="16" cy="14.5" r="1.2" fill="currentColor" stroke="none"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    pause: '<circle cx="12" cy="12" r="8.5"/><path d="M10 9v6M14 9v6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    checkCircle: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3.5 9h17M12 9v11M12 9S10.5 4 8 4.5 7 9 12 9Zm0 0s1.5-5 4-4.5S17 9 12 9Z"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowUpRight: '<path d="M7 17 17 7M9 7h8v8"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    alert: '<path d="M12 4 2.8 19.5h18.4L12 4Z"/><path d="M12 10v4.5M12 17h.01"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    bag: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    heart: '<path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10Z"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
    box: '<path d="M4 8 12 4l8 4v8l-8 4-8-4V8Z"/><path d="m4 8 8 4 8-4M12 12v8"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
    card: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M3.5 10h17M7 15h3"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.4 0-2.5.7-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2-.4-2.5-1.2M12 6.5V8M12 16v1.5"/>',
    sparkle: '<path d="M12 3.5c.6 4.2 2.3 5.9 6.5 6.5-4.2.6-5.9 2.3-6.5 6.5-.6-4.2-2.3-5.9-6.5-6.5 4.2-.6 5.9-2.3 6.5-6.5Z"/><path d="M18.5 15.5c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5Z"/>',
    ring: '<circle cx="12" cy="14" r="6"/><path d="m9.5 8 1-3h3l1 3"/><path d="M10.5 5 12 8l1.5-3"/>',
    lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9"/><path d="M19.5 4.5V9H15"/>',
    tag: '<path d="M3.5 12.3V4.5a1 1 0 0 1 1-1h7.8l8.2 8.2a1.5 1.5 0 0 1 0 2.1l-5.7 5.7a1.5 1.5 0 0 1-2.1 0L3.5 12.3Z"/><circle cx="8" cy="8" r="1.3"/>',
    receipt: '<path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-17Z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
    shield: '<path d="M12 3.5 5 6v5.5c0 4.4 3 7.8 7 9 4-1.2 7-4.6 7-9V6l-7-2.5Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    logout: '<path d="M14 4.5H6.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H14M10 12h10M16.5 8.5 20 12l-3.5 3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12.5h9.4L17.5 7"/>',
    truck: '<path d="M3 6.5h11v9H3zM14 10h4l3 3v2.5h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
    ban: '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    neu: '<path d="M7 18V6l10 12V6"/>',
  };
  MIA.icon = (name, size = 20, extra = "") =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[name] || ""}</svg>`;

  /* ---------- Analytics stub (spec 4.6) ---------- */
  window.dataLayer = window.dataLayer || [];
  MIA.track = (event, params = {}) => {
    window.dataLayer.push({ event, ...params });
    const el = document.querySelector(".dev__evt");
    if (el) el.textContent = "dataLayer → " + event + (Object.keys(params).length ? " " + JSON.stringify(params) : "");
  };

  /* ---------- Toast ---------- */
  MIA.toast = (msg, icon = "checkCircle") => {
    let host = document.querySelector(".toasts");
    if (!host) {
      host = document.createElement("div");
      host.className = "toasts";
      host.setAttribute("role", "status");
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = MIA.icon(icon, 16) + "<span>" + MIA.esc(msg) + "</span>";
    host.appendChild(t);
    setTimeout(() => {
      t.style.transition = "opacity .2s";
      t.style.opacity = "0";
      setTimeout(() => t.remove(), 220);
    }, 2600);
  };

  /* ---------- Modal / bottom sheet with focus trap ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
  MIA.modal = ({ html, label, onClose, dismissable = true, cls = "" }) => {
    const trigger = document.activeElement;
    const ov = document.createElement("div");
    ov.className = "ov";
    ov.innerHTML = `<div class="dlg ${cls}" role="dialog" aria-modal="true" aria-label="${MIA.esc(label || "Dialog")}"><div class="dlg__grab" aria-hidden="true"></div><button class="dlg__x" type="button" aria-label="Close">${MIA.icon("x", 18)}</button><div class="dlg__body">${html}</div></div>`;
    document.body.appendChild(ov);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => ov.classList.add("is-in"));
    const dlg = ov.querySelector(".dlg");
    let closed = false;
    const api = {
      el: dlg,
      body: dlg.querySelector(".dlg__body"),
      locked: false,
      setHTML(h) {
        api.body.innerHTML = h;
        focusFirst();
      },
      close(reason) {
        if (closed) return;
        closed = true;
        ov.classList.remove("is-in");
        document.removeEventListener("keydown", onKey, true);
        setTimeout(() => {
          ov.remove();
          if (!document.querySelector(".ov")) document.body.style.overflow = "";
          if (trigger && document.contains(trigger)) trigger.focus();
        }, 200);
        onClose && onClose(reason);
      },
    };
    const focusFirst = () => {
      const f = api.body.querySelector("[autofocus]") || api.body.querySelector(FOCUSABLE) || dlg.querySelector(".dlg__x");
      f && f.focus();
    };
    const onKey = (e) => {
      if (e.key === "Escape" && dismissable && !api.locked) {
        e.stopPropagation();
        api.close("esc");
      }
      if (e.key === "Tab") {
        const els = [...dlg.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent !== null);
        if (!els.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey, true);
    dlg.querySelector(".dlg__x").addEventListener("click", () => !api.locked && api.close("x"));
    ov.addEventListener("mousedown", (e) => { if (e.target === ov && dismissable && !api.locked) api.close("overlay"); });
    setTimeout(focusFirst, 30);
    return api;
  };

  /* ---------- Chrome: replica of the live site header, nav, breadcrumb and account sidebar ---------- */
  const IMG = "assets/img/";
  const NAV = [
    { id: "profile", label: "My Profile", img: "ic-profile.svg", href: "#" },
    { id: "orders", label: "Orders", img: "ic-order.svg", href: "orders.html" },
    { id: "wallet", label: "My Wallet", img: "ic-wallet.svg", href: "wallet.html", wallet: true },
    { id: "wishlist", label: "Wishlist", img: "ic-wishlist.svg", href: "#" },
    { id: "payments", label: "Saved Payments Method", img: "ic-cards.svg", href: "#" },
    { id: "address", label: "Saved Address", img: "ic-address.svg", href: "#" },
    { id: "neu", label: "NeuCoins", img: "ic-neucoin.png", href: "#" },
  ];

  // Available balance plus the on-hold amount beside it. Renders nothing while loading (never a false ₹0).
  function walletBal(ctx) {
    if (ctx.cust === "loading" || ctx.balance == null) return "";
    const hold = ctx.onHold || 0;
    return `<span class="wbal"><b>${MIA.rs(ctx.balance)}</b>${hold ? `<small>+${MIA.rs(hold)} on hold</small>` : ""}</span>`;
  }
  MIA.walletBal = walletBal;

  function header(ctx) {
    const loggedIn = ctx.cust !== "guest";
    const acct = loggedIn
      ? `<div class="s-acct">
          <button class="s-user" type="button" aria-haspopup="true" aria-expanded="false" data-acct-btn><span class="av">H</span><span class="nm">Hellynewnnn</span><img src="${IMG}arrow-down.svg" alt=""></button>
          <div class="s-menu" role="menu" data-acct-menu>
            ${NAV.filter((n) => !n.wallet || ctx.walletVisible)
              .map((n) => `<a role="menuitem" href="${n.href}"><img src="${IMG}${n.img}" alt=""><span>${n.label}</span>${n.wallet ? walletBal(ctx) : ""}</a>`)
              .join("")}
            <a role="menuitem" href="#"><img src="${IMG}logout.svg" alt="" style="width:24px;height:24px;margin:0 3px"><span>Log Out</span></a>
          </div>
        </div>`
      : `<button class="s-login" type="button">${MIA.icon("user", 24)}Login</button>`;
    return `<header class="s-hdr"><div class="s-hdr__in">
        <a class="s-logo" href="index.html" aria-label="Mia by Tanishq home"><img src="${IMG}logo.png" alt="Mia by Tanishq"></a>
        <div class="s-search" aria-hidden="true"><img src="${IMG}search.svg" alt=""><span>Shop for</span><span style="margin-left:6px">Rings</span><span class="cam">${MIA.icon("search", 0)}</span></div>
        <div class="s-right">
          <a class="s-gold" href="#">Gold Price<i>₹</i></a>
          <a class="s-ic store" href="#" aria-label="Find store"><img src="${IMG}find-store.svg" alt=""></a>
          <a class="s-ic" href="#" aria-label="Wishlist, 3 items"><img src="${IMG}heart.svg" alt=""><b>3</b></a>
          <a class="s-ic" href="cart.html" aria-label="Bag, ${ctx.bagCount ?? 2} items"><img src="${IMG}cart.svg" alt=""><b>${ctx.bagCount ?? 2}</b></a>
          <span class="s-sep" aria-hidden="true"></span>
          ${acct}
        </div></div></header>
      <nav class="s-nav" aria-label="Categories"><div class="s-nav__in">${["Earrings", "Rings", "Bracelets & Bangles", "Necklaces & Pendants", "Mangalsutra", "Silver Jewellery", "Collections", "Gifting", "More Jewellery"].map((x) => `<span>${x}</span>`).join("")}</div></nav>`;
  }

  function sidebar(ctx) {
    const items = NAV.filter((n) => !n.wallet || ctx.walletVisible);
    return {
      desktop: `<aside class="s-side" aria-label="Account">
          <div class="s-hello"><small>Hello</small><h4>Hellynewnnn Shah</h4><img src="${IMG}profile-star.svg" alt=""></div>
          <nav>${items.map((n) => `<a class="s-side__row" href="${n.href}" ${ctx.nav === n.id ? 'aria-current="page"' : ""}><img src="${IMG}${n.img}" alt=""><span>${n.label}</span>${n.wallet ? walletBal(ctx) : ""}</a>`).join("")}</nav>
          <div class="s-side__out"><img src="${IMG}logout.svg" alt=""><span>Log Out</span></div>
        </aside>`,
      mobile: `<nav class="s-mnav" aria-label="Account">${items.map((n) => `<a href="${n.href}" ${ctx.nav === n.id ? 'aria-current="page"' : ""}>${n.label}${n.wallet && ctx.balance != null && ctx.cust !== "loading" ? " · " + MIA.rs(ctx.balance) : ""}</a>`).join("")}</nav>`,
    };
  }

  function crumbs(list, darkLast) {
    const chev = MIA.icon("chevronRight", 14);
    return `<nav class="s-crumbs" aria-label="Breadcrumb">${list
      .map((c, i) => (i === list.length - 1 ? `<span class="cur ${darkLast ? "dark" : ""}" aria-current="page">${c[0]}</span>` : `<a href="${c[1] || "#"}">${c[0]}</a>${chev}`))
      .join("")}</nav>`;
  }
  MIA.crumbs = crumbs;

  /* ---------- Edge-case switcher ---------- */
  const CUSTOMERS = [
    { id: "ok", label: "Eligible · logged in · INR · India" },
    { id: "loading", label: "Eligible · balance still loading" },
    { id: "guest", label: "Guest (logged out)" },
    { id: "usd", label: "Currency switched to USD" },
    { id: "intl", label: "International shipping address" },
  ];

  function devPill(def, ctx) {
    const groups = [];
    def.scenarios.forEach((s) => {
      let g = groups.find((x) => x.name === (s.group || "Scenarios"));
      if (!g) groups.push((g = { name: s.group || "Scenarios", items: [] }));
      g.items.push(s);
    });
    const sel = (id, opts) => `<select id="${id}">${opts}</select>`;
    const scen = groups.map((g) => `<optgroup label="${MIA.esc(g.name)}">${g.items.map((s) => `<option value="${s.id}" ${s.id === ctx.s ? "selected" : ""}>${MIA.esc(s.label)}</option>`).join("")}</optgroup>`).join("");
    const pages = MIA.PAGES.map((p) => `<option value="${p.file}" ${p.id === def.id ? "selected" : ""}>${p.title}</option>`).join("");
    const cust = CUSTOMERS.map((c) => `<option value="${c.id}" ${c.id === ctx.cust ? "selected" : ""}>${c.label}</option>`).join("");
    const resp = def.responses
      ? `<label for="dev-r">${MIA.esc(def.responses.label)}</label>${sel("dev-r", def.responses.options.map((o) => `<option value="${o.id}" ${o.id === ctx.resp ? "selected" : ""}>${MIA.esc(o.label)}</option>`).join(""))}`
      : "";
    return `<div class="dev" data-dev>
      <div class="dev__panel" role="dialog" aria-label="Edge case switcher">
        <div class="dev__hd"><b>Edge cases</b><span class="xs muted"><kbd>[</kbd> <kbd>]</kbd> to cycle</span></div>
        <label for="dev-p">Page</label>${sel("dev-p", pages)}
        ${def.scenarios.length > 1 ? `<label for="dev-s">Screen / state</label>${sel("dev-s", scen)}` : ""}
        ${resp}
        ${def.customer === false ? "" : `<label for="dev-c">Customer</label>${sel("dev-c", cust)}`}
        ${def.scenarios.length > 1 ? `<div class="dev__nav"><button type="button" data-dev-prev>${MIA.icon("arrowLeft", 14)} Prev</button><button type="button" data-dev-next>Next ${MIA.icon("arrowRight", 14)}</button></div>` : ""}
        <button type="button" class="dev__reset" data-dev-reset>${MIA.icon("refresh", 14)} Reset all scenarios</button>
        <div class="dev__desc" data-dev-desc></div>
        <div class="dev__evt">dataLayer → (no events yet)</div>
      </div>
      <button class="dev__pill" type="button" aria-expanded="false" data-dev-toggle><span class="dev__dot">${MIA.icon("sliders", 14)}</span><span>Edge cases</span><span class="lbl" data-dev-lbl></span></button>
    </div>`;
  }

  /* ---------- Reset: undo claims, cancels and redeems so every scenario starts fresh ---------- */
  MIA.resetAll = () => {
    [sessionStorage, localStorage].forEach((st) => {
      Object.keys(st).filter((k) => k.startsWith("mia-") && k !== "mia-dev-open").forEach((k) => st.removeItem(k));
    });
    sessionStorage.setItem("mia-just-reset", "1");
    // Reload the same page and scenario; in-page changes (cancels, applied wallet) live in memory and are cleared too.
    location.reload();
  };

  /* ---------- Page boot ---------- */
  MIA.page = (def) => {
    const boot = () => {
      const q = new URLSearchParams(location.search);
      const ctx = {
        s: def.scenarios.some((s) => s.id === q.get("s")) ? q.get("s") : def.scenarios[0].id,
        cust: CUSTOMERS.some((c) => c.id === q.get("c")) ? q.get("c") : "ok",
        resp: def.responses ? (def.responses.options.some((o) => o.id === q.get("r")) ? q.get("r") : def.responses.options[0].id) : null,
        q,
      };
      document.body.classList.add("site");
      if (def.footer) document.body.classList.add("has-foot");
      document.body.insertAdjacentHTML("beforeend", '<div id="app"></div>');
      const app = document.getElementById("app");
      const syncUrl = () => {
        const u = new URLSearchParams(location.search);
        u.set("s", ctx.s);
        ctx.cust === "ok" ? u.delete("c") : u.set("c", ctx.cust);
        if (ctx.resp) ctx.resp === def.responses.options[0].id ? u.delete("r") : u.set("r", ctx.resp);
        history.replaceState(null, "", location.pathname + "?" + u.toString() + location.hash);
      };

      ctx.render = () => {
        ctx.sc = def.scenarios.find((s) => s.id === ctx.s);
        // Wallet UI is hidden for guests and USD. International address only affects cart/checkout.
        ctx.eligible = !["guest", "usd"].includes(ctx.cust);
        ctx.walletVisible = ctx.eligible;
        ctx.balance = def.balance ? def.balance(ctx) : MIA.chromeWallet ? MIA.chromeWallet().available : 1560;
        ctx.bagCount = def.bagCount ? def.bagCount(ctx) : 2;
        ctx.onHold = def.onHold ? def.onHold(ctx) : MIA.chromeWallet ? MIA.chromeWallet().onHold : 0;
        const scrollY = window.scrollY;
        const body = def.render(ctx);
        let main;
        const cr = def.crumbs ? crumbs(def.crumbs(ctx), def.darkCrumb) : "";
        if (def.layout === "account") {
          const sb = sidebar({ ...ctx, nav: def.nav });
          main = `${cr}<div class="s-acct-wrap">${sb.desktop}<main id="main" class="s-body">${sb.mobile}<div class="stack">${body}</div></main></div>`;
        } else if (def.layout === "raw") {
          main = `${cr}<main id="main">${body}</main>`;
        } else {
          main = `${cr}<div class="wrap" style="max-width:1290px;padding:24px 16px 96px"><main id="main">${body}</main></div>`;
        }
        app.innerHTML = (def.chrome === false ? "" : header(ctx)) + main + devPill(def, ctx);
        wireChrome(ctx);
        wireDev(def, ctx);
        const desc = app.querySelector("[data-dev-desc]");
        if (desc) desc.innerHTML = (ctx.sc.desc || "Interact with the page; use the controls above to jump to other states.") + (def.customerNote && ctx.cust !== "ok" ? "<br><br>" + def.customerNote(ctx) : "");
        const lbl = app.querySelector("[data-dev-lbl]");
        if (lbl) lbl.textContent = def.scenarios.length > 1 ? "· " + ctx.sc.label : "";
        def.mount && def.mount(app.querySelector("#main"), ctx);
        window.scrollTo(0, ctx.keepScroll ? scrollY : 0);
        ctx.keepScroll = false;
      };
      ctx.go = (sid, opts = {}) => {
        ctx.s = sid;
        ctx.keepScroll = !!opts.keepScroll;
        ctx.flash = opts.flash || null;
        syncUrl();
        ctx.render();
      };
      ctx.rerender = () => { ctx.keepScroll = true; ctx.render(); };
      syncUrl();
      ctx.render();
      def.pageView && MIA.track(def.pageView);
      if (sessionStorage.getItem("mia-just-reset")) {
        sessionStorage.removeItem("mia-just-reset");
        setTimeout(() => MIA.toast("All scenarios reset"), 300);
      }

      document.addEventListener("keydown", (e) => {
        if (e.target.closest("input, select, textarea") || document.querySelector(".ov") || e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key === "[" || e.key === "]") {
          MIA.claims && MIA.claims.reset();
          const i = def.scenarios.findIndex((s) => s.id === ctx.s);
          const n = def.scenarios.length;
          ctx.go(def.scenarios[(i + (e.key === "]" ? 1 : -1) + n) % n].id);
          document.querySelector("[data-dev]")?.classList.add("is-open");
        }
      });
    };
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
  };

  function wireChrome(ctx) {
    const btn = document.querySelector("[data-acct-btn]");
    const menu = document.querySelector("[data-acct-menu]");
    if (btn && menu) {
      const set = (open) => {
        menu.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", String(open));
        if (open && ctx.walletVisible) MIA.track("wallet_menu_view");
      };
      btn.addEventListener("click", (e) => { e.stopPropagation(); set(!menu.classList.contains("is-open")); });
      document.addEventListener("click", (e) => { if (!e.target.closest(".s-acct")) set(false); });
      menu.addEventListener("keydown", (e) => { if (e.key === "Escape") { set(false); btn.focus(); } });
    }
    document.querySelectorAll('a[href="#"]').forEach((a) =>
      a.addEventListener("click", (e) => { e.preventDefault(); MIA.toast("Not part of this prototype", "info"); })
    );
  }

  function wireDev(def, ctx) {
    const dev = document.querySelector("[data-dev]");
    if (!dev) return;
    const toggle = dev.querySelector("[data-dev-toggle]");
    const wasOpen = sessionStorage.getItem("mia-dev-open") === "1";
    const setOpen = (o) => { dev.classList.toggle("is-open", o); toggle.setAttribute("aria-expanded", String(o)); sessionStorage.setItem("mia-dev-open", o ? "1" : "0"); };
    setOpen(wasOpen);
    toggle.addEventListener("click", () => setOpen(!dev.classList.contains("is-open")));
    dev.querySelector("#dev-p").addEventListener("change", (e) => {
      const v = e.target.value;
      location.href = v + (ctx.cust !== "ok" ? (v.includes("?") ? "&" : "?") + "c=" + ctx.cust : "");
    });
    dev.querySelector("#dev-s")?.addEventListener("change", (e) => { MIA.claims && MIA.claims.reset(); ctx.go(e.target.value); });
    dev.querySelector("#dev-c")?.addEventListener("change", (e) => { ctx.cust = e.target.value; ctx.go(ctx.s); });
    dev.querySelector("#dev-r")?.addEventListener("change", (e) => { ctx.resp = e.target.value; ctx.go(ctx.s, { keepScroll: true }); });
    const step = (d) => {
      MIA.claims && MIA.claims.reset();
      const i = def.scenarios.findIndex((s) => s.id === ctx.s);
      const n = def.scenarios.length;
      ctx.go(def.scenarios[(i + d + n) % n].id);
    };
    dev.querySelector("[data-dev-prev]")?.addEventListener("click", () => step(-1));
    dev.querySelector("[data-dev-next]")?.addEventListener("click", () => step(1));
    dev.querySelector("[data-dev-reset]").addEventListener("click", () => MIA.resetAll());
  }

  /* ---------- Small shared render helpers ---------- */
  MIA.thumb = (kind = "ring", size = "") => `<div class="thumb ${size} ${kind === "silver" ? "thumb--silver" : kind === "coin" ? "thumb--coin" : ""}" aria-hidden="true">${MIA.icon(kind === "coin" ? "coin" : kind === "silver" ? "sparkle" : "ring", 34)}</div>`;
  MIA.btnBusy = (btn, busy, label) => {
    if (!btn) return;
    if (busy) {
      btn.dataset.label = btn.innerHTML;
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      btn.innerHTML = `<span class="spin" aria-hidden="true"></span>${label || "Please wait"}`;
    } else {
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
      if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
    }
  };
})();
