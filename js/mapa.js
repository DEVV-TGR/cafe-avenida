/**
 * Mapa estático SVG + alfinete com logótipo.
 */
(function () {
  function initMap(cfg) {
    const img = document.querySelector("[data-map-img]");
    if (img && cfg?.map?.image) {
      img.src = cfg.map.image;
      const lang = window.CafeI18n?.getLang() ?? "pt";
      img.alt = cfg.map.alt?.[lang] ?? `Mapa — ${cfg.name}`;
    }

    const pinImg = document.querySelector("[data-map-pin-logo]");
    if (pinImg && cfg?.logo?.src) {
      pinImg.src = new URL(cfg.logo.src, window.location.href).href;
    }

    const frame = document.querySelector("[data-map-pin]")?.parentElement;
    const pos = cfg.map?.pinPosition ?? { x: "64%", y: "50%" };
    if (frame) {
      frame.style.setProperty("--pin-x", parseFloat(pos.x) / 100);
      frame.style.setProperty("--pin-y", parseFloat(pos.y) / 100);
    }
  }

  window.CafeMapa = { init: initMap };
})();
