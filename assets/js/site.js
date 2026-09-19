// Akadálymentes slideshow + ige-rotátor. Tiszteletben tartja a prefers-reduced-motion-t.
(function () {
  "use strict";
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mobil menü
  var nav = document.querySelector(".main-nav");
  var toggle = document.querySelector(".nav-toggle");
  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Tartalomjegyzék: asztali nézetben mindig nyitva, mobilon összecsukva
  var toc = document.getElementById("toc");
  if (toc) {
    var tocMq = window.matchMedia("(min-width: 900px)");
    var syncToc = function () { toc.open = tocMq.matches; };
    syncToc();
    if (tocMq.addEventListener) tocMq.addEventListener("change", syncToc);
    else tocMq.addListener(syncToc);
  }

  // Hero: 3 kép áttűnéssel, 6 mp-enként
  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
  var heroPauseBtn = document.getElementById("hero-pause");
  var heroIndex = 0;
  var heroTimer = null;
  var heroPaused = prefersReduced;

  function heroShow(i) {
    slides.forEach(function (img, idx) {
      img.classList.toggle("is-active", idx === i);
    });
    heroIndex = i;
  }
  function heroNext() {
    heroShow((heroIndex + 1) % slides.length);
  }
  function heroUpdateBtn() {
    if (!heroPauseBtn) return;
    var icon = heroPauseBtn.querySelector(".ikon");
    var label = heroPauseBtn.querySelector(".felirat");
    if (icon) icon.textContent = heroPaused ? "▶" : "⏸";
    if (label) label.textContent = heroPaused ? "Animáció indítása" : "Animáció szüneteltetése";
    heroPauseBtn.setAttribute("aria-pressed", heroPaused ? "true" : "false");
  }
  if (slides.length > 1 && heroPauseBtn) {
    if (!heroPaused) heroTimer = setInterval(heroNext, 18000);
    heroUpdateBtn();
    heroPauseBtn.addEventListener("click", function () {
      heroPaused = !heroPaused;
      if (heroPaused) clearInterval(heroTimer);
      else heroTimer = setInterval(heroNext, 18000);
      heroUpdateBtn();
    });
  } else if (heroPauseBtn) {
    heroPauseBtn.hidden = true;
  }

  // Vissza a tetejére gomb
  var toTop = document.getElementById("to-top");
  if (toTop) {
    var syncToTop = function () {
      toTop.classList.toggle("is-visible", window.scrollY > 300);
    };
    syncToTop();
    window.addEventListener("scroll", syncToTop, { passive: true });
    toTop.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
      var main = document.getElementById("tartalom");
      if (main) main.focus({ preventScroll: true });
    });
  }

  // Galéria: natív <dialog> lightbox, nyílbillentyűkkel
  var galleryLinks = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
  var dialog = document.getElementById("galeria-dialog");
  if (galleryLinks.length && dialog && typeof dialog.showModal === "function") {
    var bigImg = document.getElementById("galeria-nagy");
    var captionEl = document.getElementById("galeria-leiras");
    var closeBtn = document.getElementById("galeria-close");
    var current = 0;

    var showAt = function (i) {
      current = (i + galleryLinks.length) % galleryLinks.length;
      var link = galleryLinks[current];
      var img = link.querySelector("img");
      bigImg.src = link.getAttribute("href");
      bigImg.alt = img ? img.alt : "";
      captionEl.textContent = link.getAttribute("data-caption") || "";
    };

    galleryLinks.forEach(function (link, i) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        showAt(i);
        dialog.showModal();
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") showAt(current + 1);
      if (e.key === "ArrowLeft") showAt(current - 1);
    });
  }

  // Ige-rotátor a kezdőlapon
  var dataEl = document.getElementById("igek-adat");
  var textEl = document.getElementById("ige-szoveg");
  var refEl = document.getElementById("ige-hely");
  var quoteEl = document.querySelector(".verse-quote");
  var prevBtn = document.getElementById("ige-elozo");
  var nextBtn = document.getElementById("ige-kovetkezo");
  var pauseBtn = document.getElementById("ige-pause");
  if (!dataEl || !textEl) return;

  var igek = [];
  try { igek = JSON.parse(dataEl.textContent); } catch (e) { igek = []; }
  if (typeof igek === "string") {
    try { igek = JSON.parse(igek); } catch (e) { igek = []; }
  }
  if (!Array.isArray(igek) || !igek.length) return;

  var idx = 0;
  var paused = prefersReduced;
  var timer = null;
  var DURATION = 24000;

  function render(i, fade) {
    idx = (i + igek.length) % igek.length;
    function apply() {
      textEl.textContent = "\u201E" + igek[idx].text + "\u201D";
      refEl.textContent = igek[idx].ref;
      quoteEl.classList.remove("is-fading");
    }
    if (fade && !prefersReduced) {
      quoteEl.classList.add("is-fading");
      setTimeout(apply, 1050);
    } else {
      apply();
    }
  }
  function updatePause() {
    if (!pauseBtn) return;
    var icon = pauseBtn.querySelector(".ikon");
    var label = pauseBtn.querySelector(".felirat");
    if (icon) icon.textContent = paused ? "▶" : "⏸";
    if (label) label.textContent = paused ? "Folytatás" : "Szünet";
    pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
  }
  function start() { if (!timer && !paused) timer = setInterval(function () { render(idx + 1, true); }, DURATION); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  if (prevBtn) prevBtn.addEventListener("click", function () { stop(); render(idx - 1, true); if (!paused) start(); });
  if (nextBtn) nextBtn.addEventListener("click", function () { stop(); render(idx + 1, true); if (!paused) start(); });
  if (pauseBtn) pauseBtn.addEventListener("click", function () {
    paused = !paused;
    if (paused) stop(); else start();
    updatePause();
  });

  updatePause();
  if (!paused) start();
})();
