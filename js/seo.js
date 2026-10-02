/**
 * Meta tags dinâmicas e JSON-LD CafeOrCoffeeShop.
 */
(function () {
  const LOCALES = { pt: "pt_PT", en: "en_GB", fr: "fr_FR" };

  function setLink(rel, href) {
    let el = document.querySelector(`link[rel="${rel}"]:not([hreflang])`);
    if (!el) {
      el = document.createElement("link");
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
  }

  /** URL público da página no idioma atual: /, /en, /fr (e /ementa, /en/ementa, /fr/ementa), como no hreflang. */
  function pageUrl(cfg, isMenu, i18n) {
    const path = i18n.pathFor(isMenu ? "/ementa" : "/");
    return `${cfg.domain}${path === "/" ? "/" : path}`;
  }

  function setMeta(name, content, attr) {
    if (!content) return;
    const key = attr || "name";
    let el = document.querySelector(`meta[${key}="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(key, name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function openingHoursSpecification(schedule) {
    const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const specs = [];
    for (let d = 0; d < 7; d++) {
      const slot = schedule?.[d];
      if (!slot) continue;
      specs.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: dayMap[d],
        opens: slot.open,
        closes: slot.closeNextDay ? `23:59` : slot.close,
      });
    }
    return specs;
  }

  function injectJsonLd(cfg) {
    const id = "cafe-jsonld";
    document.getElementById(id)?.remove();
    const script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    const data = {
      "@context": "https://schema.org",
      "@type": "CafeOrCoffeeShop",
      name: cfg.name,
      telephone: cfg.phone,
      email: cfg.email?.trim() || undefined,
      url: cfg.domain,
      image: `${cfg.domain}/${cfg.shareImage || cfg.media?.hero?.image}`,
      logo: cfg.logo?.src ? `${cfg.domain}/${cfg.logo.src}` : undefined,
      hasMenu: `${cfg.domain}/ementa`,
      priceRange: cfg.priceRange || undefined,
      servesCuisine: cfg.servesCuisine || undefined,
      sameAs: Object.values(cfg.social || {}).filter(Boolean),
      address: {
        "@type": "PostalAddress",
        streetAddress: cfg.address.street,
        postalCode: cfg.address.postalCode,
        addressLocality: cfg.address.city,
        addressCountry: cfg.address.country,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: cfg.coordinates.lat,
        longitude: cfg.coordinates.lng,
      },
      openingHoursSpecification: openingHoursSpecification(cfg.openingHours),
    };
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  function applyPageMeta(cfg, i18n, page) {
    const isMenu = page === "menu";
    const title = `${cfg.name} — ${i18n.t(isMenu ? "meta.menuTitle" : "meta.homeTitle")}`;
    const desc = i18n.t(isMenu ? "meta.menuDescription" : "meta.homeDescription");
    document.title = title;
    setMeta("description", desc);
    setMeta("og:title", title, "property");
    setMeta("og:description", desc, "property");
    setMeta("og:type", "website", "property");
    const url = pageUrl(cfg, isMenu, i18n);
    setMeta("og:url", url, "property");
    setLink("canonical", url);
    setMeta("og:locale", LOCALES[i18n.getLang()], "property");
    const ogImage = cfg.shareImage || cfg.media?.hero?.image;
    if (ogImage) {
      setMeta("og:image", `${cfg.domain}/${ogImage}`, "property");
    }
    setMeta("twitter:card", "summary_large_image");
    injectJsonLd(cfg);
  }

  window.CafeSeo = { applyPageMeta };
})();
