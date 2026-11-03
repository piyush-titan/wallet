/* Cancel Order / Cancel Item modals: replica of stg.miabytanishq.com order details (#cancelordermodal, #cancelitemmodal).
   Same markup idea, copy, validation and success/error toasts as the live site, plus Mia Wallet and cashback notes. */
(function () {
  const M = MIA, { rs, esc } = M;
  const IMG = "assets/img/";

  // Reason values match the live <select>: note the leading spaces on all but the first.
  const REASONS = ["Delayed Shipping", " Found Cheaper Elsewhere", " Change in Shipping Address", " Discount Offer Issues", " Change my Mind", " My Reason is not listed"];
  const OTHER = " My Reason is not listed";
  const priceSpaced = (n) => "₹ " + new Intl.NumberFormat("en-IN").format(n).replace(/,/g, " ");

  /* ---------- Toast: replica of the site's .email-success-updated pill (error uses the same green pill on the live site) ---------- */
  M.siteToast = (msg, kind = "success") => {
    document.querySelector(".sc-toast")?.remove();
    const t = document.createElement("div");
    t.className = "sc-toast " + kind;
    t.setAttribute("role", kind === "success" ? "status" : "alert");
    t.innerHTML = `<span class="sc-toast__ic" aria-hidden="true">${kind === "success" ? "&#10003;" : "&#10005;"}</span><span class="sc-toast__t">${esc(msg)}</span><button type="button" class="sc-toast__x" aria-label="Close">&times;</button>`;
    document.body.appendChild(t);
    t.querySelector(".sc-toast__x").addEventListener("click", () => t.remove());
    setTimeout(() => t.remove(), 5000);
  };
  M.siteSpinner = (on) => {
    let v = document.querySelector(".sc-veil");
    if (on && !v) { v = document.createElement("div"); v.className = "sc-veil"; v.innerHTML = '<span class="sc-spin" role="status" aria-label="Please wait"></span>'; document.body.appendChild(v); }
    if (!on && v) v.remove();
  };

  /* ---------- Modal ---------- */
  // opts: { mode: "order" | "item", order, item, quote, showWallet, resp: "ok" | "cancelError", onDone({ mode, item, reason, other }) }
  M.openSiteCancel = (opts) => {
    const { mode, order: o, item, quote: q, showWallet } = opts;
    const trigger = document.activeElement;
    const notes = [];
    if (showWallet && q) {
      const wal = q.refundTo.find((r) => r.method === "WALLET");
      if (wal && wal.amount) notes.push(`${rs(wal.amount)} paid from your Mia Wallet will go back to your wallet as a new credit.`);
      if (q.cashback) notes.push(q.cashback.effect === "VOIDED" ? `The ${rs(q.cashback.current)} cashback on hold for this ${mode === "item" && o.items.length === 1 ? "order" : mode} will be cancelled.` : `This order’s cashback on hold will change from ${rs(q.cashback.current)} to ${rs(q.cashback.afterReturn)}.`);
    }
    notes.push("You will loose the earned NeuCoins");

    const ov = document.createElement("div");
    ov.className = "sc-ov";
    ov.innerHTML = `<div class="sc-dialog" role="dialog" aria-modal="true" aria-labelledby="sc-title">
      <button type="button" class="sc-close" aria-label="Close"><img class="sc-close__d" src="${IMG}cancel-x.svg" alt=""><img class="sc-close__m" src="${IMG}cancel-x-m.svg" alt=""></button>
      <div class="sc-box">
        <h5 class="sc-title" id="sc-title">${mode === "item" ? "Cancel Item" : "Cancel Order"}</h5>
        <p class="sc-sure">Are you sure you want to cancel this order?</p>
        ${mode === "item" ? `<div class="sc-prod"><img src="${IMG}${esc(item.img || "ring.jpg")}" alt=""><div><p class="sc-prod__p">${priceSpaced(item.price)}</p><p class="sc-prod__n">${esc(item.name)}</p></div></div>` : ""}
        <div class="sc-form">
          <div class="sc-dd" tabindex="0" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-label="Reason For Cancellation"><span class="sc-dd__v">Reason For Cancellation*</span><i class="sc-dd__a" aria-hidden="true"></i></div>
          <ul class="sc-opts" role="listbox" hidden>${REASONS.map((r) => `<li role="option" tabindex="-1" data-v="${esc(r)}">${esc(r.trim())}</li>`).join("")}</ul>
          <p class="sc-err" data-err="reason" hidden>Please choose a reason to cancel</p>
          <textarea class="sc-ta" placeholder="Describe the Reason*" aria-label="Describe the Reason" hidden></textarea>
          <p class="sc-err" data-err="text" hidden>Please add your reason</p>
        </div>
        <div class="sc-notes">${notes.map((n) => `<p class="sc-note"><span>Note:</span><span>${n}</span></p>`).join("")}</div>
        <div class="sc-ft"><button type="button" class="sc-btn sc-btn--no">No, Don’t cancel</button><button type="button" class="sc-btn sc-btn--yes">Yes, Cancel</button></div>
      </div></div>`;
    document.body.appendChild(ov);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => ov.classList.add("is-in"));
    M.track("cancel_modal_open", { mode, orderNo: o.orderNo });

    const $ = (s) => ov.querySelector(s);
    const dd = $(".sc-dd"), opts_ = $(".sc-opts"), ta = $(".sc-ta");
    let reason = null, busy = false;
    const close = () => {
      ov.classList.remove("is-in");
      document.removeEventListener("keydown", onKey, true);
      setTimeout(() => { ov.remove(); if (!document.querySelector(".sc-ov, .ov")) document.body.style.overflow = ""; trigger && trigger.focus && trigger.focus(); }, 150);
    };
    const setOpen = (on) => { opts_.hidden = !on; dd.classList.toggle("is-open", on); dd.setAttribute("aria-expanded", String(on)); if (on) opts_.querySelector("li")?.focus(); };
    const pick = (v) => {
      reason = v;
      $(".sc-dd__v").textContent = v.trim();
      setOpen(false);
      $('[data-err="reason"]').hidden = true;
      ta.hidden = v !== OTHER;
      if (v !== OTHER) $('[data-err="text"]').hidden = true;
      if (v === OTHER) ta.focus(); else dd.focus();
    };
    dd.addEventListener("click", () => setOpen(opts_.hidden));
    dd.addEventListener("keydown", (e) => { if (["Enter", " ", "ArrowDown"].includes(e.key)) { e.preventDefault(); setOpen(true); } });
    opts_.querySelectorAll("li").forEach((li, i, all) => {
      li.addEventListener("click", () => pick(li.dataset.v));
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(li.dataset.v); }
        if (e.key === "ArrowDown") { e.preventDefault(); all[Math.min(i + 1, all.length - 1)].focus(); }
        if (e.key === "ArrowUp") { e.preventDefault(); i ? all[i - 1].focus() : (setOpen(false), dd.focus()); }
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setOpen(false); dd.focus(); }
      });
    });
    ta.addEventListener("input", () => { if (ta.value.trim()) $('[data-err="text"]').hidden = true; });
    ov.addEventListener("mousedown", (e) => { if (!e.target.closest(".sc-form")) setOpen(false); });
    $(".sc-close").addEventListener("click", () => !busy && close());
    $(".sc-btn--no").addEventListener("click", () => !busy && close());
    // Live site: clicking the dark backdrop also dismisses the modal.
    ov.addEventListener("click", (e) => { if (e.target === ov && !busy) close(); });
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) { e.stopPropagation(); close(); }
      if (e.key === "Tab") {
        const f = [...ov.querySelectorAll("button, [tabindex='0'], textarea:not([hidden]), li[tabindex]")].filter((x) => x.offsetParent);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener("keydown", onKey, true);
    setTimeout(() => dd.focus(), 60);

    $(".sc-btn--yes").addEventListener("click", async () => {
      if (busy) return;
      // Same validation order as the live dashboard.js handler.
      if (!reason) { $('[data-err="reason"]').hidden = false; dd.focus(); return; }
      if (reason === OTHER && !ta.value.trim()) { $('[data-err="text"]').hidden = false; ta.focus(); return; }
      busy = true;
      M.track("cancel_submit", { mode, orderNo: o.orderNo, reason: reason.trim() });
      M.siteSpinner(true);
      await M.wait(1200);
      M.siteSpinner(false);
      busy = false;
      close();
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (opts.resp === "cancelError") {
        M.siteToast("We couldn’t cancel your order right now. Please try again later.", "error");
        return;
      }
      M.siteToast(mode === "item" ? "Your item has been cancelled successfully" : "Your order has been cancelled successfully");
      opts.onDone && opts.onDone({ mode, item, reason: reason.trim(), other: ta.value.trim() });
    });
  };
})();
