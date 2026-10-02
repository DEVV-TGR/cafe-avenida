/**
 * Internacionalização: idioma pelo endereço (/ = PT, /en, /fr), escolha guardada no localStorage
 * e atualização do DOM. ?lang= continua aceite (links antigos) e é trocado pelo endereço limpo.
 */
(function () {
  const STORAGE_KEY = "cafe-lang";
  const SUPPORTED = ["pt", "en", "fr"];
  const DEFAULT_LANG = "pt";
  /** Idiomas com prefixo no endereço; o português fica na raiz. */
  const PREFIXED = ["en", "fr"];
  /** Só estas páginas têm versão por idioma (a 404 e o cartão QR ficam com o endereço que têm). */
  const LOCALIZED_PAGES = ["home", "ementa"];

  function normalizeLang(value) {
    if (!value) return null;
    const code = String(value).toLowerCase().slice(0, 2);
    return SUPPORTED.includes(code) ? code : null;
  }

  function langFromUrl() {
    return normalizeLang(new URLSearchParams(window.location.search).get("lang"));
  }

  function pathSegments() {
    return String(window.location.pathname || "/").split("/").filter(Boolean);
  }

  function langFromPath() {
    const first = pathSegments()[0];
    return PREFIXED.includes(first) ? first : null;
  }

  /** Caminho da página sem o idioma: "/en/ementa" → "/ementa", "/fr" → "/". */
  function basePath() {
    const parts = pathSegments();
    if (PREFIXED.includes(parts[0])) parts.shift();
    return `/${parts.join("/")}`;
  }

  /** Endereço de uma página num idioma: pathFor("/ementa", "en") → "/en/ementa"; em PT → "/ementa". */
  function pathFor(base = basePath(), lang = currentLang) {
    const page = base === "/" ? "" : base;
    return lang === DEFAULT_LANG ? page || "/" : `/${lang}${page}`;
  }

  function langFromStorage() {
    try {
      return normalizeLang(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  }

  /**
   * O endereço manda (/en, /fr; ?lang= nos links antigos). Na raiz vale a escolha guardada;
   * sem escolha, português. Não se adivinha pelo idioma do browser: o robô do Google é "en"
   * e passaria a ver a página portuguesa em inglês.
   */
  function getInitialLang() {
    return langFromPath() || langFromUrl() || langFromStorage() || DEFAULT_LANG;
  }

  let currentLang = getInitialLang();

  function t(path) {
    const parts = path.split(".");
    let node = window.__i18n?.[currentLang];
    for (const p of parts) {
      if (node == null) return path;
      node = node[p];
    }
    if (typeof node === "string" || Array.isArray(node)) return node;
    return path;
  }

  function dayNames() {
    const names = window.__i18n?.[currentLang]?.hours?.dayNames;
    return Array.isArray(names) ? names : [];
  }

  function applyTranslations(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = t(key);
      if (Array.isArray(value)) return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = value;
      } else {
        el.textContent = value;
      }
    });
    scope.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const pairs = el.getAttribute("data-i18n-attr").split(";");
      pairs.forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
    document.documentElement.lang = currentLang === "pt" ? "pt-PT" : currentLang;
    updateLangSwitcher();
    updateMenuLinks();
  }

  function updateMenuLinks() {
    document.querySelectorAll("[data-href-ementa]").forEach((a) => {
      a.href = pathFor("/ementa");
    });
    document.querySelectorAll("[data-href-home]").forEach((a) => {
      a.href = pathFor("/");
    });
  }

  /** Mostra no endereço o idioma atual (/en/ementa…), sem recarregar: o HTML é o mesmo em todos. */
  function syncUrl() {
    if (!LOCALIZED_PAGES.includes(document.body?.dataset.page)) return;
    const params = new URLSearchParams(window.location.search);
    params.delete("lang");
    const query = params.toString();
    const target = `${pathFor()}${query ? `?${query}` : ""}${window.location.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (target !== current) window.history.replaceState(window.history.state, "", target);
  }

  function updateLangSwitcher() {
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      const lang = btn.getAttribute("data-lang-btn");
      const active = lang === currentLang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function setLang(lang, options) {
    const next = normalizeLang(lang);
    if (!next || next === currentLang) return currentLang;
    currentLang = next;
    try {
      localStorage.setItem(STORAGE_KEY, currentLang);
    } catch {
      /* ignore */
    }
    if (!options?.skipUrl) syncUrl();
    applyTranslations();
    window.dispatchEvent(new CustomEvent("cafe:langchange", { detail: { lang: currentLang } }));
    return currentLang;
  }

  function bindLangButtons() {
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const lang = btn.getAttribute("data-lang-btn");
        if (lang === currentLang) return;
        const change = () => {
          setLang(lang);
          btn.focus({ preventScroll: true });
        };
        if (window.CafeLanguageTransition) window.CafeLanguageTransition(change);
        else change();
      });
    });
  }

  window.CafeI18n = {
    getLang: () => currentLang,
    pathFor: (base) => pathFor(base),
    t,
    dayNames,
    setLang,
    applyTranslations,
    bindLangButtons,
    init() {
      if (langFromPath() || langFromUrl()) {
        try {
          localStorage.setItem(STORAGE_KEY, currentLang);
        } catch {
          /* ignore */
        }
      }
      syncUrl();
      bindLangButtons();
      applyTranslations();
    },
  };
})();
