(function () {
  "use strict";

  var config = window.LP_CONFIG || {};

  // ---- 設定値の反映 ----
  if (config.FORM_URL) {
    document.querySelectorAll("[data-cta]").forEach(function (a) { a.href = config.FORM_URL; });
  }
  if (config.LINE_URL) {
    document.querySelectorAll("[data-line]").forEach(function (a) { a.href = config.LINE_URL; });
  }
  if (config.SLOTS_LEFT != null) {
    document.querySelectorAll("[data-slots]").forEach(function (el) { el.textContent = config.SLOTS_LEFT; });
  }
  if (config.MONTH_LABEL) {
    document.querySelectorAll("[data-month]").forEach(function (el) { el.textContent = config.MONTH_LABEL; });
  }

  // ---- CTAクリック計測（Google Analytics 導入時のみ送信） ----
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-cta], [data-line]");
    if (!a || typeof window.gtag !== "function") return;
    window.gtag("event", a.hasAttribute("data-cta") ? "cta_click" : "line_click", {
      cta_location: a.getAttribute("data-cta") || "line"
    });
  });

  // ---- 固定申込バー：FVのボタン通過後に表示、料金・最終CTAが見えている間は隠す ----
  var bar = document.getElementById("sticky-cta");
  var fvCta = document.getElementById("fv-cta");
  if (bar && fvCta && "IntersectionObserver" in window) {
    var barLink = bar.querySelector("a");
    var state = { fvPassed: false, blockers: new Set() };
    var update = function () {
      var show = state.fvPassed && state.blockers.size === 0;
      bar.classList.toggle("is-visible", show);
      bar.setAttribute("aria-hidden", show ? "false" : "true");
      barLink.tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        state.fvPassed = !en.isIntersecting && en.boundingClientRect.top < 0;
      });
      update();
    }).observe(fvCta);

    var blockObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) state.blockers.add(en.target);
        else state.blockers.delete(en.target);
      });
      update();
    });
    ["price-cta", "final-cta"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) blockObserver.observe(el);
    });
  }

  // ---- 受講生の声カルーセル ----
  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var track = root.querySelector(".carousel__track");
    var slides = Array.prototype.slice.call(track.children);
    var prev = root.querySelector("[data-prev]");
    var next = root.querySelector("[data-next]");
    var dotsWrap = root.querySelector("[data-dots]");
    var total = slides.length;

    var dots = slides.map(function (slide, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "受講生の声 " + (i + 1) + "/" + total + " を表示");
      b.addEventListener("click", function () { goTo(i); });
      dotsWrap.appendChild(b);
      return b;
    });

    function slideStep() {
      return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth;
    }
    function currentIndex() {
      return Math.round(track.scrollLeft / slideStep());
    }
    function goTo(i) {
      i = Math.max(0, Math.min(total - 1, i));
      track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: "smooth" });
    }
    function sync() {
      var i = Math.min(total - 1, currentIndex());
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (atEnd) i = total - 1;
      dots.forEach(function (d, n) { d.setAttribute("aria-current", n === i ? "true" : "false"); });
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = atEnd;
    }

    prev.addEventListener("click", function () { goTo(currentIndex() - 1); });
    next.addEventListener("click", function () { goTo(currentIndex() + 1); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(currentIndex() + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(currentIndex() - 1); }
    });

    var ticking = false;
    track.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { sync(); ticking = false; });
    }, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  });
})();
