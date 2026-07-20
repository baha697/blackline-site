/* ============================================================
   BLACKLINE — interactions (header, menu, reveal, lightbox)
   Le balisage header/footer est statique dans chaque page (SEO).
   ============================================================ */
(function () {
  "use strict";

  function init() {
    // --- Header : état au défilement -------------------------
    var header = document.getElementById("siteHeader");
    if (header) {
      var onScroll = function () {
        if (window.scrollY > 24) header.classList.add("scrolled");
        else header.classList.remove("scrolled");
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    // --- Menu mobile plein écran -----------------------------
    var burger = document.getElementById("burger");
    var mmenu = document.getElementById("mmenu");
    if (burger && mmenu) {
      var setMenu = function (open) {
        document.body.classList.toggle("menu-open", open);
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      };
      burger.addEventListener("click", function () {
        setMenu(!document.body.classList.contains("menu-open"));
      });
      mmenu.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { setMenu(false); });
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") setMenu(false);
      });
    }

    // --- Reveal au défilement --------------------------------
    var reveals = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach(function (r) { io.observe(r); });
    } else {
      reveals.forEach(function (r) { r.classList.add("in"); });
    }

    // --- Année dynamique -------------------------------------
    var y = String(new Date().getFullYear());
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = y; });

    // --- Lightbox (galeries) ---------------------------------
    initLightbox();
  }

  function initLightbox() {
    var figs = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox] img"));
    if (!figs.length) return;
    var srcs = figs.map(function (im) { return im.currentSrc || im.getAttribute("src"); });
    var alts = figs.map(function (im) { return im.getAttribute("alt") || ""; });
    var cur = 0;

    var lb = document.createElement("div");
    lb.className = "lb";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Visionneuse de photos");
    lb.innerHTML =
      '<button class="lb__close" aria-label="Fermer">&times;</button>' +
      '<button class="lb__nav lb__prev" aria-label="Photo précédente">&#8249;</button>' +
      '<img alt="">' +
      '<button class="lb__nav lb__next" aria-label="Photo suivante">&#8250;</button>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector("img");

    function show(i) {
      cur = (i + srcs.length) % srcs.length;
      lbImg.src = srcs[cur];
      lbImg.alt = alts[cur];
    }
    function open(i) { show(i); lb.classList.add("open"); document.body.style.overflow = "hidden"; }
    function close() { lb.classList.remove("open"); document.body.style.overflow = ""; }

    figs.forEach(function (im, i) { im.addEventListener("click", function () { open(i); }); });
    lb.querySelector(".lb__close").addEventListener("click", close);
    lb.querySelector(".lb__prev").addEventListener("click", function (e) { e.stopPropagation(); show(cur - 1); });
    lb.querySelector(".lb__next").addEventListener("click", function (e) { e.stopPropagation(); show(cur + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(cur - 1);
      else if (e.key === "ArrowRight") show(cur + 1);
    });

    // Balayage tactile
    var x0 = null;
    lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 48) show(dx < 0 ? cur + 1 : cur - 1);
      x0 = null;
    }, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
