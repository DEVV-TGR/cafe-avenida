/**
 * Barra do site: links das secções na inicial vs outras páginas (como Cafe-Preguica).
 */
(function () {
  function initBarra() {
    const cfg = window.CAFE_CONFIG;
    if (!cfg) return;

    const isHome = document.body.dataset.page === "home";

    document.querySelectorAll(".pg-indice__seccao").forEach((link) => {
      const hash = link.getAttribute("data-section-hash");
      if (!hash) return;
      link.href = isHome ? hash : `./${hash}`;
    });

    const marca = document.querySelector(".pg-barra__marca");
    if (marca) {
      marca.href = isHome ? "#main" : "./";
    }

    document.querySelectorAll("[data-phone-display]").forEach((el) => {
      el.textContent = cfg.phoneDisplay;
    });

    initMenuTelemovel();
  }

  function initMenuTelemovel() {
    const barra = document.querySelector(".pg-barra");
    const indice = barra?.querySelector(".pg-indice");
    if (!barra || !indice) return;
    const i18n = window.CafeI18n;
    const label = (key, fallback) => {
      const value = i18n?.t(key);
      return value && value !== key ? value : fallback;
    };

    let botao = barra.querySelector(".pg-barra__menu");
    if (!botao) {
      if (!indice.id) indice.id = "pg-indice";
      botao = document.createElement("button");
      botao.type = "button";
      botao.className = "pg-barra__menu";
      botao.setAttribute("aria-controls", indice.id);
      botao.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';
      barra.appendChild(botao);

      const fechar = () => definir(false);
      botao.addEventListener("click", () => definir(!barra.classList.contains("is-menu-open")));
      indice.addEventListener("click", (e) => {
        if (e.target.closest("a")) fechar();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && barra.classList.contains("is-menu-open")) {
          fechar();
          botao.focus();
        }
      });
      document.addEventListener("click", (e) => {
        if (!barra.contains(e.target)) fechar();
      });
      window.matchMedia("(min-width: 58rem)").addEventListener("change", fechar);
    }

    function definir(aberto) {
      barra.classList.toggle("is-menu-open", aberto);
      botao.setAttribute("aria-expanded", String(aberto));
      botao.setAttribute("aria-label", aberto ? label("nav.closeMenu", "Fechar menu") : label("nav.openMenu", "Abrir menu"));
    }

    definir(barra.classList.contains("is-menu-open"));
  }

  window.CafeBarra = { init: initBarra };
})();
