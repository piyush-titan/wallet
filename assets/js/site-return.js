/* Return Item / Return Order: replica of the live #returnOrderModal and #returnConfirm-modal (stg.miabytanishq.com order details),
   with a Refund Summary card that shows where the money goes (card / Mia Wallet) and what happens to the order's cashback. */
(function () {
  const M = MIA, { rs, esc } = M;
  const IMG = "assets/img/";
  const REASONS = ["Size incorrect", "Not Required anymore", "it is not same as product image", "Quality concerns", "Others"];
  const PICKUP = { initial: "H", name: "Hinduja S", line: "No 16/4 Selva Vinayagar Street Hebbal BENGALURU URBAN India - 560100", email: "hinduja.subburajan@quality-ai.com", phone: "+91 8072441445" };

  function overlay(cls, html, onClose) {
    const ov = document.createElement("div");
    ov.className = "sr-ov";
    ov.innerHTML = `<div class="sr-dialog ${cls}" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(ov);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => ov.classList.add("is-in"));
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      ov.classList.remove("is-in");
      document.removeEventListener("keydown", onKey, true);
      setTimeout(() => { ov.remove(); if (!document.querySelector(".sr-ov, .sc-ov, .ov")) document.body.style.overflow = ""; onClose && onClose(); }, 150);
    };
    const onKey = (e) => {
      if (e.key === "Escape" && !ov.dataset.busy) { e.stopPropagation(); close(); }
      if (e.key === "Tab") {
        const f = [...ov.querySelectorAll("button:not([disabled]), [tabindex='0'], textarea:not([hidden]), input:not([disabled])")].filter((x) => x.offsetParent);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener("keydown", onKey, true);
    ov.addEventListener("click", (e) => { if (e.target === ov && !ov.dataset.busy) close(); });
    return { ov, close };
  }

  function pickupCard(title = "Pickup Address") {
    return `<div class="sr-pick">
        <p class="sr-pick__t">${title}</p>
        <div class="sr-pick__row"><div class="sr-av">${PICKUP.initial}</div>
          <div class="sr-pick__m"><p class="sr-pick__n">${PICKUP.name}</p><p class="sr-pick__a">${PICKUP.line}</p><p class="sr-pick__e">${PICKUP.email}</p><p class="sr-pick__e">${PICKUP.phone}</p></div>
        </div>
        <div class="sr-same"><img src="${IMG}rt-info.svg" alt=""><span>Pickup and delivery address are the same.</span></div>
      </div>`;
  }

  /* Refund Summary card (new). q comes from the mock quote server; the UI never computes money. */
  function refundCard(state, q, o) {
    if (state === "loading")
      return `<div class="sr-ref" aria-busy="true" aria-label="Loading your return details"><p class="sr-ref__t">Refund Summary</p>
          ${[70, 55, 62].map((w) => `<div class="sr-ref__r"><i class="dot" aria-hidden="true"></i><div class="skel" style="height:14px;width:${w}%"></div><div class="skel v" style="height:14px;width:60px"></div></div>`).join("")}</div>`;
    if (state === "error")
      return `<div class="sr-ref"><p class="sr-ref__t">Refund Summary</p><div class="sr-ref__err" role="alert"><img src="${IMG}rt-info.svg" alt=""><span>We couldn’t load your return details. Please try again.</span><button type="button" class="sr-link" data-retry>Retry</button></div></div>`;
    const card = q.refundTo.find((r) => r.method === "CARD");
    const wal = q.refundTo.find((r) => r.method === "WALLET");
    const cb = q.cashback;
    return `<div class="sr-ref" aria-live="polite"><p class="sr-ref__t">Refund Summary</p>
        <div class="sr-ref__r"><i class="dot" aria-hidden="true"></i><b>Your refund goes back to the payment methods you used for this order.</b><small>Refund starts after we pick up your item and it passes quality check.</small></div>
        ${wal ? `<div class="sr-ref__r"><img src="${IMG}ic-wallet.svg" alt=""><b>Money paid from your Mia Wallet goes back to your Mia Wallet.</b><small>It comes back with the days it had left when you used it.</small></div>` : ""}
        ${cb ? `<div class="sr-ref__r sr-ref__cb"><img src="${IMG}ic-cashback.svg" alt=""><b>Cashback on hold</b><b class="v num"><s>${rs(cb.current)}</s> ${cb.effect === "VOIDED" ? "₹0" : rs(cb.afterReturn)}</b><small>${cb.effect === "VOIDED" ? "Cancelled, as nothing is left in this order" : "The returned item’s share is removed"}. Paused until the return is complete.</small></div>` : ""}
        <p class="sr-ref__f">You get back the full amount you paid. NeuCoins used on this order are refunded to your Tata Neu account.</p>
      </div>`;
  }

  /* opts: { mode: "item" | "order", order, lines, quote(), showWallet, quoteResp: "ok" | "loading" | "error", resp: "ok" | "returnError", onDone() } */
  M.openSiteReturn = (opts) => {
    const { mode, order: o, showWallet } = opts;
    const trigger = document.activeElement;
    let reason = null, qState = showWallet && opts.quote() ? (opts.quoteResp === "error" ? "error" : "loading") : "none", quote = null;
    const { ov, close } = overlay("sr-ret", `
      <div class="sr-content">
        <div class="sr-hd"><h5 class="sr-title" id="sr-title">${mode === "order" && o.items.length > 1 ? "Return Order" : "Return Item"}</h5>
          <button type="button" class="sr-x" aria-label="Close"><img class="sr-x__d" src="${IMG}cancel-x.svg" alt=""><img class="sr-x__m" src="${IMG}rt-close-m.svg" alt=""></button></div>
        <div class="sr-body">
          <div class="sr-reason">
            <div class="sr-reason__t" id="sr-rl">Select a reason to return</div>
            <div class="sr-sel">
              <div class="sr-sel__v" tabindex="0" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="sr-rl">Select reasons</div>
              <img class="sr-sel__a" src="${IMG}arrow-down.svg" alt="">
              <div class="sr-opts" role="listbox" aria-labelledby="sr-rl">${REASONS.map((r, i) => `<div class="sr-opt" role="option" tabindex="-1" aria-selected="false" data-i="${i}">${esc(r)}<span class="sr-radio" aria-hidden="true"></span><img class="sr-radio__on" src="${IMG}rt-radio.svg" alt=""></div>`).join("")}</div>
              <textarea class="sr-ta" rows="4" maxlength="500" placeholder="Type your reason (Max 500 characters.)" aria-label="Type your reason" hidden></textarea>
            </div>
          </div>
          <div data-ref></div>
          ${pickupCard()}
        </div>
        <div class="sr-ft"><button type="button" class="sr-confirm" disabled>Confirm return</button></div>
      </div>`, () => trigger && trigger.focus && trigger.focus());
    ov.querySelector(".sr-dialog").setAttribute("aria-labelledby", "sr-title");
    M.track("return_modal_open", { mode, orderNo: o.orderNo });

    const $ = (s) => ov.querySelector(s);
    const val = $(".sr-sel__v"), opts_ = $(".sr-opts"), ta = $(".sr-ta"), btn = $(".sr-confirm"), refBox = $("[data-ref]");
    const sync = () => {
      const reasonOk = reason !== null && (REASONS[reason] !== "Others" || ta.value.trim().length >= 1);
      btn.disabled = !reasonOk || qState === "loading" || qState === "error";
    };
    const renderRef = () => {
      refBox.innerHTML = qState === "none" ? "" : refundCard(qState, quote, o);
      refBox.querySelector("[data-retry]")?.addEventListener("click", () => loadQuote(true));
      sync();
    };
    const loadQuote = async (retry) => {
      if (qState === "none") return;
      qState = "loading"; renderRef();
      await M.wait(opts.quoteResp === "loading" && !retry ? 60000 : 700);
      if (!ov.isConnected) return;
      if (opts.quoteResp === "error" && !retry) { qState = "error"; renderRef(); return; }
      quote = opts.quote(); qState = "ok"; renderRef();
      M.track("return_quote_view", { orderNo: o.orderNo, cashbackEffect: quote.cashback && quote.cashback.effect });
    };
    if (opts.quoteResp === "error") renderRef(); else loadQuote(false);

    // Live behaviour: opening the list also tints the Pickup Address card grey.
    const setOpen = (on) => {
      opts_.classList.toggle("show", on);
      val.setAttribute("aria-expanded", String(on));
      $(".sr-pick").classList.toggle("is-dim", on);
      if (on) (opts_.querySelector('[aria-selected="true"]') || opts_.querySelector(".sr-opt")).focus();
    };
    const pick = (i) => {
      reason = i;
      val.textContent = REASONS[i];
      opts_.querySelectorAll(".sr-opt").forEach((x, j) => { x.setAttribute("aria-selected", String(i === j)); x.classList.toggle("on", i === j); });
      setOpen(false);
      const other = REASONS[i] === "Others";
      ta.hidden = !other;
      if (!other) ta.value = "";
      other ? ta.focus() : val.focus();
      sync();
    };
    val.addEventListener("click", () => setOpen(!opts_.classList.contains("show")));
    $(".sr-sel__a").addEventListener("click", () => setOpen(!opts_.classList.contains("show")));
    val.addEventListener("keydown", (e) => { if (["Enter", " ", "ArrowDown"].includes(e.key)) { e.preventDefault(); setOpen(true); } });
    opts_.querySelectorAll(".sr-opt").forEach((li, i, all) => {
      li.addEventListener("click", () => pick(i));
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(i); }
        if (e.key === "ArrowDown") { e.preventDefault(); all[Math.min(i + 1, all.length - 1)].focus(); }
        if (e.key === "ArrowUp") { e.preventDefault(); i ? all[i - 1].focus() : (setOpen(false), val.focus()); }
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setOpen(false); val.focus(); }
      });
    });
    ov.addEventListener("mousedown", (e) => { if (!e.target.closest(".sr-sel")) setOpen(false); });
    ta.addEventListener("input", sync);
    $(".sr-x").addEventListener("click", () => !ov.dataset.busy && close());
    ov.querySelector(".sr-dialog").tabIndex = -1;
    setTimeout(() => ov.querySelector(".sr-dialog").focus({ preventScroll: true }), 60);

    btn.addEventListener("click", async () => {
      if (btn.disabled || ov.dataset.busy) return;
      ov.dataset.busy = "1";
      M.track("return_submit", { mode, orderNo: o.orderNo, reason: REASONS[reason], cashbackEffect: quote && quote.cashback && quote.cashback.effect });
      M.siteSpinner(true);
      await M.wait(1200);
      M.siteSpinner(false);
      delete ov.dataset.busy;
      close();
      if (opts.resp === "returnError") {
        M.siteToast("We couldn’t place your return right now. Please try again later.", "error");
        return;
      }
      opts.onDone && opts.onDone({ mode, reason: REASONS[reason], other: ta.value.trim(), quote });
      M.openReturnConfirm({ quote, showWallet });
    });
  };

  /* Success: replica of #returnConfirm-modal, plus where the refund goes and the cashback pause. */
  M.openReturnConfirm = ({ quote: q, showWallet }) => {
    const card = q && q.refundTo.find((r) => r.method === "CARD");
    const wal = q && q.refundTo.find((r) => r.method === "WALLET");
    const cb = q && q.cashback;
    const rows = [];
    if (showWallet && q) {
      rows.push(`<li${wal ? ' class="w"' : ""}>${wal ? `<img src="${IMG}ic-wallet.svg" alt="">` : ""}<span>Refund to your payment methods${wal ? " and Mia Wallet" : ""}</span><small>Starts after quality check</small></li>`);
      if (cb) rows.push(`<li class="c"><img src="${IMG}ic-cashback.svg" alt=""><span>Cashback ${cb.effect === "VOIDED" ? `of ${rs(cb.current)} will be cancelled` : `paused, then updated to ${rs(cb.afterReturn)}`}</span><small>Once the return is complete</small></li>`);
    }
    const { ov, close } = overlay("sr-ok", `
      <button type="button" class="sr-ok__x" aria-label="Close"><img src="${IMG}rt-close-w.svg" alt=""></button>
      <div class="sr-ok__c">
        <div class="sr-ok__hero"><div class="sr-ok__gn">Great news!</div><div class="sr-ok__h" id="sr-ok-h">Returned Confirmed!</div><div class="sr-ok__s">Your order will be picked up.</div></div>
        <div class="sr-ok__card"><p class="sr-ok__t">Pickup Address</p>
          <div class="sr-pick__row"><div class="sr-av">${PICKUP.initial}</div><div class="sr-pick__m"><p class="sr-pick__n sr-ok__n">Hinduja</p><p class="sr-pick__a">No 16/4 Selva Vinayagar Street Hebbal BENGALURU URBAN <br>India 560100</p><p class="sr-pick__e">8072441445</p></div></div>
        </div>
        ${rows.length ? `<div class="sr-ok__card sr-ok__ref"><p class="sr-ok__t">Your refund</p><ul>${rows.join("")}</ul></div>` : ""}
      </div>`);
    ov.querySelector(".sr-dialog").setAttribute("aria-labelledby", "sr-ok-h");
    ov.querySelector(".sr-ok__x").addEventListener("click", close);
    setTimeout(() => ov.querySelector(".sr-ok__x").focus(), 60);
    M.track("return_confirmed_view");
  };
})();
