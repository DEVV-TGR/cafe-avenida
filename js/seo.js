/**
 * Meta tags dinâmicas e JSON-LD CafeOrCoffeeShop.
 */
(function () {
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
      image: cfg.domain + "/" + (cfg.logo?.src || cfg.media?.hero?.image),
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
    setMeta("og:url", window.location.href, "property");
    const ogImage = cfg.logo?.src || cfg.media?.hero?.image;
    if (ogImage) {
      setMeta("og:image", `${cfg.domain}/${ogImage}`, "property");
    }
    setMeta("twitter:card", "summary_large_image");
    injectJsonLd(cfg);
  }

  window.CafeSeo = { applyPageMeta };
})();
