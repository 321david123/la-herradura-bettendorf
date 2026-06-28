/* =========================================================
   LA HERRADURA — interactions
   ========================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Smooth scroll (Lenis) — single RAF driver ---------- */
  let lenis = null;
  if (window.Lenis && !prefersReduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---------- GSAP / ScrollTrigger ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) lenis.on("scroll", ScrollTrigger.update);
  }

  /* ---------- Anchor links via Lenis ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70 });
      else target.scrollIntoView({ behavior: "smooth" });
      closeOverlay();
    });
  });

  /* ---------- NAV: transparent -> solid ---------- */
  const nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 60) nav.classList.add("is-solid");
    else nav.classList.remove("is-solid");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile overlay ---------- */
  const toggle = document.getElementById("navToggle");
  const overlay = document.getElementById("overlay");
  const overlayClose = document.getElementById("overlayClose");

  function openOverlay() {
    overlay.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
  }
  function closeOverlay() {
    if (!overlay.classList.contains("is-open")) return;
    overlay.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (lenis) lenis.start();
  }
  if (toggle) toggle.addEventListener("click", openOverlay);
  if (overlayClose) overlayClose.addEventListener("click", closeOverlay);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeOverlay(); });

  /* ---------- Menu tabs ---------- */
  const tabs = document.querySelectorAll(".menu__tab");
  const panels = document.querySelectorAll(".menu__panel");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.getAttribute("data-tab");
      tabs.forEach((t) => { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      panels.forEach((p) => {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === name);
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* ---------- Reveals ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Hero parallax ---------- */
  const heroImg = document.getElementById("heroImg");
  if (heroImg && window.gsap && window.ScrollTrigger && !prefersReduced) {
    gsap.to(heroImg, {
      yPercent: 14, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }

  /* ---------- Section image parallax ---------- */
  if (window.gsap && window.ScrollTrigger && !prefersReduced) {
    document.querySelectorAll("[data-parallax]").forEach((img) => {
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: "none",
        scrollTrigger: { trigger: img.closest("[data-parallax-wrap]") || img, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  }

  /* ---------- Stat counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  function animateCount(el) {
    const target = parseFloat(el.getAttribute("data-count"));
    const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    const suffix = el.getAttribute("data-suffix") || "";
    if (prefersReduced) { el.textContent = target.toFixed(decimals) + suffix; return; }
    const dur = 1500;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(tick);
  }
  if (counters.length) {
    const cObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { animateCount(entry.target); cObs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => cObs.observe(c));
  }

  /* ---------- Highlight current hours row ---------- */
  (function markHours() {
    const rows = document.querySelectorAll("#hours tr");
    if (!rows.length) return;
    const day = new Date().getDay(); // 0 = Sun
    const idx = day === 0 ? 6 : day - 1; // Mon-first table order
    if (rows[idx]) rows[idx].classList.add("is-now");
  })();

  /* ---------- Swiper: Gallery ---------- */
  if (window.Swiper) {
    new Swiper(".gallery__swiper", {
      slidesPerView: "auto",
      spaceBetween: 18,
      grabCursor: true,
      navigation: { nextEl: ".gallery__btn--next", prevEl: ".gallery__btn--prev" },
      breakpoints: { 760: { spaceBetween: 28 } },
    });

    new Swiper(".reviews__swiper", {
      slidesPerView: 1,
      loop: true,
      autoplay: prefersReduced ? false : { delay: 5200, disableOnInteraction: false },
      pagination: { el: ".reviews__dots", clickable: true },
    });
  }

})();
