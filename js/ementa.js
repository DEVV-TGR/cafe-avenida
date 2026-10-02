/**
 * Ementa: carrega menu.json, tabs de categorias e tags.
 */
(function () {
  const cfg = window.CAFE_CONFIG;
  const i18n = window.CafeI18n;
  let menuData = null;

  function localized(obj) {
    return obj?.[i18n.getLang()] ?? obj?.pt ?? "";
  }

  const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  /** Escapa texto de menu.json / i18n antes de o inserir em templates HTML. */
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
  }

  function formatPrice(value) {
    return new Intl.NumberFormat(({ pt: "pt-PT", en: "en-GB", fr: "fr-FR" })[i18n.getLang()], {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }

  function tagLabel(tag) {
    const map = {
      vegetarian: "menuPage.tags.vegetarian",
      glutenFree: "menuPage.tags.glutenFree",
    };
    return i18n.t(map[tag] || tag);
  }

  function renderTags(item) {
    const tags = item.tags || [];
    const parts = tags.map(
      (t) => `<span class="menu-tag menu-tag--${esc(t)}">${esc(tagLabel(t))}</span>`
    );
    if (item.allergens) {
      const label = i18n.t("menuPage.tags.allergens");
      parts.push(
        `<span class="menu-tag menu-tag--allergens" title="${esc(localized(item.allergens))}">${esc(label)}</span>`
      );
    }
    return parts.length ? `<div class="menu-item__tags">${parts.join("")}</div>` : "";
  }

  function renderPrice(item) {
    if (!item.prices?.length) {
      return `<span class="menu-item__price">${esc(formatPrice(item.price))}</span>`;
    }
    const sizes = item.prices
      .map(
        (p) =>
          `<span class="menu-item__size"><abbr class="menu-item__size-label" title="${esc(i18n.t(`menuPage.sizes.${p.size}`))}">${esc(i18n.t(`menuPage.sizesShort.${p.size}`))}</abbr> ${esc(formatPrice(p.value))}</span>`
      )
      .join("");
    return `<span class="menu-item__price menu-item__price--sizes">${sizes}</span>`;
  }

  function renderItems(category, heading = "h3") {
    if (!category.items?.length) {
      return `<p class="menu-empty">${esc(i18n.t("menuPage.empty"))}</p>`;
    }
    return category.items
      .map((item) => {
        const desc = localized(item.description);
        return `
      <article class="menu-item" id="item-${esc(item.id)}">
        <div class="menu-item__head">
          <${heading} class="menu-item__name">${esc(localized(item.name))}</${heading}>
          <span class="menu-item__leader" aria-hidden="true"></span>
          ${renderPrice(item)}
        </div>
        ${desc ? `<p class="menu-item__desc">${esc(desc)}</p>` : ""}
        ${renderTags(item)}
      </article>`;
      })
      .join("");
  }

  function renderFigures(category) {
    if (!category.figures?.length) return "";
    const figs = category.figures
      .map(
        (src) =>
          `<span class="menu-figura"><span class="menu-figura__foto"><img src="${esc(src)}" alt="" loading="lazy" decoding="async" /></span></span>`
      )
      .join("");
    return `<div class="menu-section__figuras" aria-hidden="true">${figs}</div>`;
  }

  function renderSubcategories(category) {
    return category.subcategories.map(sub => {
      const note = localized(sub.note);
      const figCount = Math.min(sub.figures?.length || 0, 2);
      return `<section class="menu-subsection ${sub.items.length > 4 ? "menu-section--cols" : ""} ${figCount ? `menu-section--figs-${figCount}` : ""}" id="cat-${esc(sub.id)}" aria-labelledby="title-${esc(sub.id)}">
        ${renderFigures(sub)}
        <div class="menu-subsection__head"><h3 class="menu-subsection__title" id="title-${esc(sub.id)}">${esc(localized(sub.name))}</h3></div>
        ${note ? `<p class="menu-section__note">${esc(note)}</p>` : ""}
        <div class="menu-section__items">${renderItems(sub, "h4")}</div>
      </section>`;
    }).join("");
  }

  function renderMenu() {
    const nav = document.querySelector("[data-menu-nav]");
    const sections = document.querySelector("[data-menu-sections]");
    if (!nav || !sections || !menuData) return;

    nav.innerHTML = "";
    sections.innerHTML = "";

    menuData.categories.forEach((cat, index) => {
      const id = `cat-${cat.id}`;
      const btn = document.createElement("a");
      btn.href = `#${id}`;
      btn.className = "menu-nav__link";
      btn.textContent = localized(cat.name);
      btn.setAttribute("data-category", cat.id);
      if (index === 0) btn.classList.add("is-active");
      nav.appendChild(btn);

      const section = document.createElement("section");
      section.className = "menu-section";
      section.id = id;
      const figCount = Math.min(cat.figures?.length || 0, 2);
      if (figCount) section.classList.add(`menu-section--figs-${figCount}`);
      if ((cat.items?.length || 0) > 4) section.classList.add("menu-section--cols");
      const note = localized(cat.note);
      const bodyId = `${id}-body`;
      section.innerHTML = `
        ${renderFigures(cat)}
        <button type="button" class="menu-section__head" aria-expanded="true" aria-controls="${esc(bodyId)}" data-menu-toggle>
          <span class="menu-section__head-text">
            <span class="menu-section__num" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
            <h2 class="menu-section__title">${esc(localized(cat.name))}</h2>
          </span>
          <span class="menu-section__chevron" aria-hidden="true"></span>
        </button>
        <div class="menu-section__body" id="${esc(bodyId)}">
          <div class="menu-section__body-inner">
            ${note ? `<p class="menu-section__note">${esc(note)}</p>` : ""}
            ${cat.subcategories ? renderSubcategories(cat) : `<div class="menu-section__items">${renderItems(cat)}</div>`}
          </div>
        </div>`;
      sections.appendChild(section);
    });

    bindCategoryNav();
    bindCollapse();
  }

  function setCollapsed(section, collapsed, instant) {
    if (!section) return;
    const head = section.querySelector("[data-menu-toggle]");
    const body = section.querySelector(".menu-section__body");
    if (!head || !body) return;

    const reduce = instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (collapsed) {
      if (reduce) {
        section.classList.add("is-collapsed");
        body.style.height = "0px";
      } else {
        const start = body.getBoundingClientRect().height || body.scrollHeight;
        body.style.height = `${start}px`;
        body.getBoundingClientRect();
        section.classList.add("is-collapsed");
        body.style.height = "0px";
      }
    } else {
      section.classList.remove("is-collapsed");
      if (reduce) {
        body.style.height = "";
      } else {
        body.style.height = "0px";
        const target = body.scrollHeight;
        body.getBoundingClientRect();
        body.style.height = `${target}px`;
        const clear = (e) => {
          if (e.propertyName !== "height") return;
          if (!section.classList.contains("is-collapsed")) body.style.height = "";
          body.removeEventListener("transitionend", clear);
        };
        body.addEventListener("transitionend", clear);
      }
    }

    head.setAttribute("aria-expanded", collapsed ? "false" : "true");
    head.setAttribute("aria-label", collapsed ? i18n.t("menuPage.expand") : i18n.t("menuPage.collapse"));
  }

  function bindCollapse() {
    document.querySelectorAll("[data-menu-toggle]").forEach((btn) => {
      const section = btn.closest(".menu-section");
      setCollapsed(section, false, true);
      btn.addEventListener("click", () => {
        setCollapsed(section, !section.classList.contains("is-collapsed"));
      });
    });
  }

  let navCleanup = null;

  function bindCategoryNav() {
    navCleanup?.();

    const nav = document.querySelector("[data-menu-nav]");
    const links = [...document.querySelectorAll("[data-menu-nav] .menu-nav__link")];
    const sections = [...document.querySelectorAll(".menu-section")];
    if (!nav || !links.length) return;

    const controller = new AbortController();
    const options = { passive: true, signal: controller.signal };
    let manualNav = false;
    let queued = 0;
    const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function sync() {
      queued = 0;
      const marker = document.querySelector(".menu-header").getBoundingClientRect().bottom + 32;
      let current = sections[0];
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= marker) current = section;
      }
      if (scrollY + innerHeight >= document.documentElement.scrollHeight - 8) current = sections.at(-1);
      let active;
      links.forEach(link => {
        const on = link.hash === `#${current.id}`;
        link.classList.toggle("is-active", on);
        if (on) { link.setAttribute("aria-current", "location"); active = link; }
        else link.removeAttribute("aria-current");
      });
      if (manualNav || !active) return;
      const navRect = nav.getBoundingClientRect();
      const rect = active.getBoundingClientRect();
      if (rect.left < navRect.left + 12 || rect.right > navRect.right - 12) {
        nav.scrollTo({ left: nav.scrollLeft + rect.left - navRect.left - (nav.clientWidth - rect.width) / 2, behavior: reduced() ? "instant" : "smooth" });
      }
    }
    function schedule() { if (!queued) queued = requestAnimationFrame(sync); }
    nav.addEventListener("pointerdown", () => { manualNav = true; }, options);
    nav.addEventListener("touchstart", () => { manualNav = true; }, options);
    nav.addEventListener("wheel", () => { manualNav = true; }, options);
    nav.addEventListener("keydown", () => { manualNav = true; }, { signal: controller.signal });
    window.addEventListener("scroll", () => { manualNav = false; schedule(); }, options);
    window.addEventListener("resize", schedule, options);
    nav.addEventListener("click", event => {
      const link = event.target.closest(".menu-nav__link");
      if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const section = document.getElementById(link.hash.slice(1));
      if (!section) return;
      event.preventDefault();
      manualNav = false;
      if (section.classList.contains("is-collapsed")) setCollapsed(section, false, true);
      history.replaceState({}, "", link.hash);
      section.scrollIntoView({ behavior: reduced() ? "instant" : "smooth", block: "start" });
      schedule();
    }, { signal: controller.signal });
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(document.querySelector("[data-menu-sections]"));
    sync();
    navCleanup = () => {
      controller.abort();
      resizeObserver.disconnect();
      cancelAnimationFrame(queued);
    };
  }

  async function loadMenu() {
    const res = await fetch("menu.json", { cache: "no-cache" });
    menuData = await res.json();
    renderMenu();
    if (location.hash) {
      requestAnimationFrame(() => {
        document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: "instant", block: "start" });
      });
    }
  }

  function applyTheme() {
    const root = document.documentElement;
    Object.entries(cfg.colors || {}).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`, value);
    });
  }

  function init() {
    applyTheme();
    i18n.init();
    window.CafeBranding?.apply(cfg);
    document.querySelectorAll("[data-config='phone']").forEach((el) => {
      el.textContent = cfg.phoneDisplay;
    });
    document.querySelectorAll("[data-tel-link]").forEach((el) => {
      el.href = `tel:${cfg.phone.replace(/\s/g, "")}`;
    });
    window.CafeBarra?.init();
    window.CafeSeo.applyPageMeta(cfg, i18n, "menu");
    loadMenu();

    window.addEventListener("cafe:langchange", () => {
      renderMenu();
      window.CafeSeo.applyPageMeta(cfg, i18n, "menu");
      window.CafeBarra?.init();
      window.CafeBranding?.apply(cfg);
      document.querySelectorAll("[data-config='phone']").forEach((el) => {
        el.textContent = cfg.phoneDisplay;
      });
      document.querySelectorAll("[data-tel-link]").forEach((el) => {
        el.href = `tel:${cfg.phone.replace(/\s/g, "")}`;
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
