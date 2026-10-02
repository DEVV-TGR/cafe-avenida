/**
 * Página principal: conteúdo dinâmico a partir de config.js.
 */
(function () {
  const cfg = window.CAFE_CONFIG;
  const i18n = window.CafeI18n;

  function applyTheme() {
    const root = document.documentElement;
    Object.entries(cfg.colors || {}).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`, value);
    });
  }

  function localized(obj) {
    return obj?.[i18n.getLang()] ?? obj?.pt ?? "";
  }

  function fillConfigText() {
    window.CafeBranding?.apply(cfg);
    document.querySelectorAll("[data-config]").forEach((el) => {
      const key = el.getAttribute("data-config");
      if (key === "name") el.textContent = cfg.name;
      if (key === "areaLabel") el.textContent = localized(cfg.areaLabel);
      if (key === "tagline") el.textContent = localized(cfg.tagline);
      if (key === "about") el.textContent = localized(cfg.about);
      if (key === "address") el.textContent = cfg.address.full;
      if (key === "phone") el.textContent = cfg.phoneDisplay;
      if (key === "email") el.textContent = cfg.email;
    });

    const telHref = `tel:${cfg.phone.replace(/\s/g, "")}`;
    document.querySelectorAll("[data-tel-link]").forEach((el) => {
      el.href = telHref;
    });

    const email = cfg.email?.trim();
    document.querySelectorAll("[data-mail-row]").forEach((el) => {
      el.hidden = !email;
    });
    document.querySelectorAll("[data-mail-link]").forEach((el) => {
      if (email) el.href = `mailto:${email}`;
      else el.removeAttribute("href");
    });

    const placeLabel = encodeURIComponent(`${cfg.name}, ${cfg.address.full}`);
    const mapsPlace = cfg.googleReviews?.placeId
      ? `https://www.google.com/maps/place/?q=place_id:${cfg.googleReviews.placeId}`
      : `https://www.google.com/maps/search/?api=1&query=${placeLabel}`;

    document.querySelectorAll("[data-maps-open]").forEach((el) => {
      el.href = mapsPlace;
    });

    document.querySelectorAll("[data-social]").forEach((a) => {
      const network = a.getAttribute("data-social");
      const url = cfg.social?.[network];
      if (url) a.href = url;
    });
  }

  function buildHero() {
    const hero = cfg.media?.hero;
    if (!hero) return;
    const img = document.querySelector("[data-hero-img]");
    if (img) {
      // Foto em ecrã inteiro com object-fit: cover; num ecrã mais estreito que 16:9 é a altura que manda.
      window.CafeImagens.apply(img, hero.image, "(max-aspect-ratio: 16/9) 176vh, 100vw");
      img.alt = localized(hero.alt);
      img.loading = "eager";
      img.fetchPriority = "high";
    }
  }

  function stars(rating) {
    const n = Math.min(5, Math.max(0, Math.round(rating)));
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  function buildReviewsSummary() {
    const summary = document.querySelector("[data-reviews-summary]");
    const google = cfg.googleReviews;
    if (!summary) return;
    if (!google) {
      summary.hidden = true;
      return;
    }
    const locale = ({ pt: "pt-PT", en: "en-GB", fr: "fr-FR" })[i18n.getLang()];
    const score = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
      google.rating
    );
    const outOf = i18n.t("reviews.outOf").replace("{rating}", score);

    summary.querySelector("[data-reviews-score]").textContent = score;

    const starsEl = summary.querySelector("[data-reviews-stars]");
    starsEl.setAttribute("role", "img");
    starsEl.setAttribute("aria-label", outOf);
    starsEl.innerHTML = "";
    const fill = document.createElement("span");
    fill.className = "reviews-summary__stars-fill";
    fill.style.width = `${(Math.min(5, Math.max(0, google.rating)) / 5) * 100}%`;
    fill.textContent = "★★★★★";
    const base = document.createElement("span");
    base.textContent = "★★★★★";
    starsEl.append(base, fill);

    const placeQuery = google.placeId
      ? `https://www.google.com/maps/place/?q=place_id:${google.placeId}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cfg.name}, ${cfg.address.full}`)}`;

    const all = summary.querySelector("[data-reviews-all]");
    all.href = placeQuery;
    all.textContent = i18n.t("reviews.count").replace("{count}", google.count.toLocaleString(locale));

    const write = summary.querySelector("[data-reviews-write]");
    write.href = google.placeId
      ? `https://search.google.com/local/writereview?placeid=${google.placeId}`
      : placeQuery;
  }

  function buildReviews() {
    buildReviewsSummary();
    const grid = document.querySelector("[data-reviews]");
    if (!grid) return;
    grid.innerHTML = "";
    (cfg.reviews || []).forEach((item) => {
      const card = document.createElement("article");
      card.className = "review-card";
      if (item.rating) {
        const starsEl = document.createElement("p");
        starsEl.className = "review-card__stars";
        starsEl.setAttribute("aria-label", i18n.t("reviews.outOf").replace("{rating}", item.rating));
        starsEl.textContent = stars(item.rating);
        card.appendChild(starsEl);
      }
      const text = document.createElement("p");
      text.className = "review-card__text";
      text.textContent = localized(item.text);
      const author = document.createElement("p");
      author.className = "review-card__author";
      author.textContent = typeof item.author === "string" ? item.author : localized(item.author);
      card.append(text, author);
      grid.appendChild(card);
    });
  }

  function buildSuggestions() {
    const grid = document.querySelector("[data-suggestions]");
    if (!grid) return;
    const photoLabel = i18n.t("suggestions.photoSoon");
    grid.innerHTML = "";
    const suggestions = (cfg.suggestions || []).filter(item => item.featured !== false);
    const photos = suggestions.filter((item) => item.image).map((item) => ({
      src: item.image, alt: localized(item.name), description: localized(item.description),
    }));
    suggestions.forEach((item) => {
      const card = document.createElement("article");
      card.className = "suggestion-card";
      const media = document.createElement("div");
      media.className = "suggestion-card__media";
      if (item.image) {
        const img = document.createElement("img");
        window.CafeImagens.apply(img, item.image, "(min-width: 64rem) 30vw, (min-width: 40rem) 45vw, 85vw");
        img.alt = localized(item.name);
        img.loading = "lazy";
        img.decoding = "async";
        if (item.imagePosition) img.style.objectPosition = item.imagePosition;
        media.appendChild(img);
        media.classList.add("is-zoomable");
        window.CafeLightbox?.bind(
          media,
          () => window.CafeLightbox.open(photos, photos.findIndex((photo) => photo.src === item.image)),
          localized(item.name)
        );
      } else {
        media.textContent = photoLabel;
      }
      const name = document.createElement("h3");
      name.className = "suggestion-card__name";
      name.textContent = localized(item.name);
      const desc = document.createElement("p");
      desc.className = "suggestion-card__desc";
      desc.textContent = localized(item.description);
      card.append(media, name, desc);
      if (item.menuId) {
        const link = document.createElement("a");
        link.className = "suggestion-card__menu";
        link.textContent = i18n.t("chooser.menu");
        link.href = `ementa?lang=${i18n.getLang()}#item-${item.menuId}`;
        card.appendChild(link);
      }
      grid.appendChild(card);
    });
  }

  function buildGallery() {
    const grid = document.querySelector("[data-gallery]");
    const moreBtn = document.querySelector("[data-gallery-more]");
    if (!grid) return;
    const wasExpanded = moreBtn?.getAttribute('aria-expanded') === 'true';
    grid.innerHTML = "";
    grid.classList.toggle("is-expanded", wasExpanded);

    const gallery = cfg.media?.gallery || [];
    const photos = gallery
      .filter((item) => item.type !== "video")
      .map((item) => ({ src: item.src, alt: localized(item.alt) }));
    const previewCount = 5;

    gallery.forEach((item, index) => {
      const figure = document.createElement("figure");
      figure.className = "gallery__item";
      if (index >= previewCount) figure.classList.add("is-gallery-more");

      if (item.type === "video") {
        const video = document.createElement("video");
        video.controls = true;
        video.preload = "metadata";
        video.playsInline = true;
        video.poster = item.poster || "";
        video.setAttribute("aria-label", localized(item.alt));
        const source = document.createElement("source");
        source.src = item.src;
        source.type = "video/mp4";
        video.appendChild(source);
        figure.appendChild(video);
      } else {
        const img = document.createElement("img");
        window.CafeImagens.apply(img, item.src, index === 0 ? "(min-width: 40rem) 66vw, 100vw" : "(min-width: 40rem) 33vw, 50vw");
        img.alt = localized(item.alt);
        img.loading = "lazy";
        img.decoding = "async";
        img.width = 800;
        img.height = 600;
        figure.appendChild(img);

        figure.classList.add("is-zoomable");
        const photoIndex = photos.findIndex((p) => p.src === item.src);
        window.CafeLightbox?.bind(figure, () => window.CafeLightbox.open(photos, photoIndex), img.alt);
      }
      grid.appendChild(figure);
    });

    if (!moreBtn) return;
    const extras = grid.querySelectorAll(".is-gallery-more").length;
    moreBtn.hidden = extras === 0;
    moreBtn.setAttribute("aria-expanded", String(wasExpanded));
    grid.id = "gallery-photos";
    moreBtn.setAttribute("aria-controls", grid.id);
    moreBtn.textContent = i18n.t(wasExpanded ? "gallery.less" : "gallery.more");
    const disclose = grid._disclose || (grid._disclose = window.CafeDisclosure(grid, open => grid.classList.toggle('is-expanded', open), {
      followClose: () => {
        const section = grid.closest('#galeria');
        const header = document.querySelector('.pg-barra');
        const top = section.getBoundingClientRect().top + window.scrollY;
        return Math.max(0, top - (header?.getBoundingClientRect().height || 0) - 16);
      }
    }));
    moreBtn.onclick = () => {
      const open = moreBtn.getAttribute('aria-expanded') !== 'true';
      disclose(open);
      moreBtn.setAttribute("aria-expanded", String(open));
      moreBtn.textContent = i18n.t(open ? "gallery.less" : "gallery.more");
    };
  }

  function refreshHours() {
    window.CafeHours.renderHoursPanel(
      document.querySelector("[data-hours-panel]"),
      cfg.openingHours,
      i18n
    );
  }

  function init() {
    applyTheme();
    i18n.init();
    fillConfigText();
    buildHero();
    buildGallery();
    buildReviews();
    buildSuggestions();
    window.CafeBarra?.init();
    refreshHours();
    window.CafeMapa?.init(cfg);
    window.CafeSeo.applyPageMeta(cfg, i18n, "home");

    window.addEventListener("cafe:langchange", () => {
      fillConfigText();
      buildHero();
      buildGallery();
      buildReviews();
      buildSuggestions();
      window.CafeBarra?.init();
      refreshHours();
      window.CafeMapa?.init(cfg);
      window.CafeSeo.applyPageMeta(cfg, i18n, "home");
    });

    setInterval(refreshHours, 60_000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
