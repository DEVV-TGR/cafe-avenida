/**
 * Página 404: marca, traduções e título.
 */
(function () {
  const cfg = window.CAFE_CONFIG;
  window.CafeBranding?.apply(cfg);
  window.CafeI18n?.init?.();
  document.title = `${window.CafeI18n?.t("error.docTitle") || "Página não encontrada"} — ${cfg?.name || "Café Avenida"}`;
})();
