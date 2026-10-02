/**
 * Internacionalização: deteção de idioma, localStorage, ?lang= e atualização do DOM.
 */
(function () {
  const STORAGE_KEY = "cafe-lang";
  const SUPPORTED = ["pt", "en", "fr"];
  const DEFAULT_LANG = "pt";

  function normalizeLang(value) {
    if (!value) return null;
    const code = String(value).toLowerCase().slice(0, 2);
    return SUPPORTED.includes(code) ? code : null;
  }

  function langFromUrl() {
    return normalizeLang(new URLSearchParams(window.location.search).get("lang"));
  }

  function langFromStorage() {
    try {
      return normalizeLang(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  }

  function langFromBrowser() {
    const langs = navigator.languages || [navigator.language];
    for (const raw of langs) {
      const code = normalizeLang(raw);
      if (code) return code;
    }
    return DEFAULT_LANG;
  }

  function getInitialLang() {
    return langFromUrl() || langFromStorage() || langFromBrowser() || DEFAULT_LANG;
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
      a.href = `ementa.html?lang=${currentLang}`;
    });
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
    if (!options?.skipUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", currentLang);
      window.history.replaceState({}, "", url);
    }
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
          btn.parentElement?.querySelector("[data-lang-btn]:not(.is-active)")?.focus({ preventScroll: true });
        };
        if (window.CafeLanguageTransition) window.CafeLanguageTransition(change);
        else change();
      });
    });
  }

  window.CafeI18n = {
    getLang: () => currentLang,
    t,
    dayNames,
    setLang,
    applyTranslations,
    bindLangButtons,
    init() {
      if (langFromUrl()) {
        try {
          localStorage.setItem(STORAGE_KEY, currentLang);
        } catch {
          /* ignore */
        }
      }
      bindLangButtons();
      applyTranslations();
    },
  };
})();
