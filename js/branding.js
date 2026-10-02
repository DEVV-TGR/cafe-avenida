/**
 * Nome e logótipo a partir de config.js.
 */
(function () {
  function apply(cfg) {
    if (!cfg) return;

    document.querySelectorAll("[data-config='name']").forEach((el) => {
      el.textContent = cfg.name;
    });

    const logo = cfg.logo;
    if (!logo?.src) return;

    document.querySelectorAll("[data-logo]").forEach((img) => {
      img.src = logo.src;
      img.alt = logo.alt || cfg.name;
    });
  }

  window.CafeBranding = { apply };
})();
