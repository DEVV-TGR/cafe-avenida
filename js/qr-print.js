/**
 * Cartão imprimível com QR: idioma do QR e botão de impressão.
 */
(function () {
  function qrSrc(lang) {
    return lang === "fr" ? "qr/ementa.png" : `qr/ementa-${lang}.png`;
  }

  function init() {
    window.CafeI18n.init();
    window.CafeBranding.apply(window.CAFE_CONFIG);
    const img = document.getElementById("qr-image");
    if (img) img.src = qrSrc(window.CafeI18n.getLang());
    window.addEventListener("cafe:langchange", (e) => {
      if (img) img.src = qrSrc(e.detail.lang);
      window.CafeI18n.applyTranslations();
    });
    document.querySelector("[data-print]")?.addEventListener("click", () => window.print());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
