/**
 * Transições Avenida:
 * - Início / refresh → portas de vidro + logo
 * - Ir à ementa → panfleto abre na página actual e dissolve-se na ementa
 * - Voltar ao início → panfleto fecha e desaparece, sem as portas
 */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NAV_KEY = "ca-nav-transition";
  const SEEN_KEY = "ca-entrada-vista";
  /** Se a página demorou a carregar, a animação de entrada só atrasaria mais o visitante. */
  const SLOW_LOAD_MS = 2500;

  let navigating = false;
  let activeTimer = null;
  let activeRunId = 0;

  // Animate a clipping wrapper so padding, grid rows and surrounding content move together.
  window.CafeDisclosure = (content, setOpen, { timeScale = 1, followClose = null } = {}) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flow-root';
    content.before(wrapper);
    wrapper.append(content);
    const isGallery = content.matches('[data-gallery]');
    let releaseLayout = () => {};
    let animation;
    let fades = [];
    let stopFollowing = () => {};
    let opened = false;
    return next => {
      stopFollowing();
      const scrollStart = window.scrollY;
      const destination = !next && followClose ? followClose() : null;
      const start = wrapper.getBoundingClientRect().height;
      // Gallery photos stay still: only the containing viewport is animated.
      const targets = isGallery ? [] : [content];
      const opacities = targets.map(target => getComputedStyle(target).opacity);
      const wasHidden = content.hidden || (content.matches('[data-gallery]') && !content.classList.contains('is-expanded'));
      animation?.cancel();
      releaseLayout();
      fades.forEach(fade => fade.cancel());
      fades = [];
      setOpen(next);
      const end = wrapper.getBoundingClientRect().height;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        wrapper.style.overflow = '';
        opened = next;
        if (destination !== null) window.scrollTo({ top: destination, behavior: 'instant' });
        return;
      }
      if (!next) setOpen(true);
      wrapper.style.overflow = 'clip';
      if (isGallery) {
        // Isolate the full-size grid from the changing wrapper height.
        const previousHeight = content.style.height;
        const previousContain = content.style.contain;
        content.style.height = `${content.getBoundingClientRect().height}px`;
        content.style.contain = 'layout';
        wrapper.style.contain = 'layout';
        releaseLayout = () => {
          content.style.height = previousHeight;
          content.style.contain = previousContain;
          wrapper.style.contain = '';
          releaseLayout = () => {};
        };
      }
      fades = targets.map((target, index) => target.animate([
        { opacity: next && wasHidden ? 0 : opacities[index] },
        { opacity: next ? 1 : 0 }
      ], {
        duration: (next ? 720 : 420) * timeScale,
        delay: (next ? Math.min(index, 5) * 55 + 100 : 0) * timeScale,
        easing: 'cubic-bezier(.4, 0, .2, 1)',
        fill: 'both'
      }));
      animation = wrapper.animate([
        { height: `${start}px` }, { height: `${end}px` }
      ], { duration: 1100 * timeScale, delay: (next || isGallery ? 0 : 120) * timeScale, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'both' });
      opened = next;
      const current = animation;
      let following = false;
      if (destination !== null) {
        following = true;
        const root = document.documentElement;
        const previousAnchor = root.style.overflowAnchor;
        root.style.overflowAnchor = 'none';
        let frame;
        const inputs = ['wheel', 'touchstart', 'keydown'];
        const stop = () => {
          following = false;
          cancelAnimationFrame(frame);
          root.style.overflowAnchor = previousAnchor;
          inputs.forEach(type => window.removeEventListener(type, stop));
          stopFollowing = () => {};
        };
        stopFollowing = stop;
        inputs.forEach(type => window.addEventListener(type, stop, { passive: true }));
        // Use the height animation's eased progress, including its initial delay.
        const follow = () => {
          const progress = current.effect.getComputedTiming().progress ?? 0;
          window.scrollTo({ top: scrollStart + (destination - scrollStart) * progress, behavior: 'instant' });
          frame = requestAnimationFrame(follow);
        };
        follow();
      }
      current.onfinish = () => {
        if (animation !== current) return;
        // Finish at the exact destination only while automatic following is active.
        const progress = current.effect.getComputedTiming().progress;
        if (following && progress === 1) {
          window.scrollTo({ top: destination, behavior: 'instant' });
        }
        stopFollowing();
        setOpen(opened);
        current.cancel();
        releaseLayout();
        fades.forEach(fade => fade.cancel());
        fades = [];
        wrapper.style.overflow = '';
      };
    };
  };

  let languageBusy = false;
  window.CafeLanguageTransition = async change => {
    if (languageBusy) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { change(); return; }
    languageBusy = true;
    const veil = document.createElement('div');
    veil.className = 'ca-language';
    veil.setAttribute('aria-hidden', 'true');
    // Reuse the entrance frame without its glass doors.
    for (const className of [
      'ca-tr__caixilho ca-tr__caixilho--sup',
      'ca-tr__caixilho ca-tr__caixilho--lat ca-tr__caixilho--lat-esq',
      'ca-tr__caixilho ca-tr__caixilho--lat ca-tr__caixilho--lat-dir',
      'ca-tr__soleira'
    ]) {
      const edge = document.createElement('div');
      edge.className = className;
      veil.append(edge);
    }
    const logo = document.createElement('img');
    logo.src = window.CAFE_CONFIG?.logo?.src || 'images/logo-320.png';
    logo.alt = '';
    logo.className = 'ca-tr__logo';
    const frame = document.createElement('div');
    frame.className = 'ca-tr__logo-slot';
    frame.append(logo);
    veil.append(frame);
    document.body.append(veil);
    try {
      await veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease-in-out', fill: 'both' }).finished;
      change();
      await veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, delay: 1100, easing: 'ease-in-out', fill: 'both' }).finished;
    } finally {
      veil.remove();
      languageBusy = false;
    }
  };

  /** "/", "/index.html" → "index.html"; "/ementa" (URL sem extensão) ou "/ementa.html" → "ementa.html". */
  function pageName(pathname) {
    const last = pathname.replace(/\/$/, "").split("/").pop();
    if (!last || last === "index" || last === "index.html") return "index.html";
    return last.includes(".") ? last : `${last}.html`;
  }

  function isHistoryNavigation() {
    const nav = performance.getEntriesByType("navigation")[0];
    return nav?.type === "back_forward";
  }

  /** A entrada animada aparece uma vez por sessão (por página); nas visitas seguintes a página abre logo. */
  function entrySeen(page) {
    try {
      const seen = sessionStorage.getItem(`${SEEN_KEY}:${page}`) === "1";
      sessionStorage.setItem(`${SEEN_KEY}:${page}`, "1");
      return seen;
    } catch { return false; }
  }

  function readNavFlag() {
    try {
      const value = sessionStorage.getItem(NAV_KEY);
      sessionStorage.removeItem(NAV_KEY);
      return value;
    } catch { return null; }
  }

  function revealPage() {
    document.documentElement.classList.remove("ca-loading");
    document.documentElement.classList.add("ca-page-ready");
    document.documentElement.style.overflow = "";
  }

  function clearActiveTimer() {
    if (activeTimer !== null) {
      window.clearTimeout(activeTimer);
      activeTimer = null;
    }
  }

  function finishOverlay(overlay) {
    navigating = false;
    clearActiveTimer();
    activeRunId += 1;
    if (overlay) {
      overlay.classList.add("is-done");
      overlay.dataset.saltar = "";
      overlay.style.opacity = "";
      overlay.style.visibility = "";
    }
    revealPage();
  }

  function loadLogo(overlay) {
    const logo = overlay?.querySelector(".ca-tr__logo");
    if (logo?.dataset.src && !logo.getAttribute("src")) {
      logo.src = logo.dataset.src;
    }
  }

  function resetOverlay(overlay) {
    overlay.classList.remove(
      "is-done",
      "ca-tr--anim",
      "ca-tr--portas",
      "ca-tr--panfleto",
      "ca-tr--abre",
      "ca-tr--fecha",
      "ca-tr--revela",
      "ca-tr--saida",
      "ca-tr--cobre"
    );
    overlay.removeAttribute("data-saltar");
    overlay.style.opacity = "";
    overlay.style.visibility = "";
  }

  function setScene(overlay, scene, variant) {
    resetOverlay(overlay);
    if (scene === "portas") {
      overlay.classList.add("ca-tr--portas");
    } else {
      overlay.classList.add("ca-tr--panfleto");
      if (variant === "fecha") overlay.classList.add("ca-tr--fecha");
      else if (variant === "revela") overlay.classList.add("ca-tr--revela");
      else if (variant === "saida") overlay.classList.add("ca-tr--abre", "ca-tr--saida");
      else overlay.classList.add("ca-tr--abre");
    }
  }

  function runTimed(overlay, ms, onDone) {
    const runId = ++activeRunId;
    clearActiveTimer();

    let finished = false;
    const done = () => {
      if (finished || runId !== activeRunId) return;
      finished = true;
      clearActiveTimer();
      stopListen();
      onDone();
    };

    const saltar = (event) => { if (event.key === "Escape") done(); };
    const events = ["keydown"];
    const stopListen = () => events.forEach((ev) => window.removeEventListener(ev, saltar));
    events.forEach((ev) => window.addEventListener(ev, saltar, { passive: true }));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (runId !== activeRunId) return;
        overlay.classList.add("ca-tr--anim");
        activeTimer = window.setTimeout(done, ms);
      });
    });

  }

  function initEntry() {
    const overlay = document.getElementById("ca-transicao");
    const page = document.body.dataset.page;
    const nav = readNavFlag();

    if (!overlay || reduced) {
      finishOverlay(overlay);
      return;
    }

    if (isHistoryNavigation()) {
      finishOverlay(overlay);
      return;
    }

    // As transições entre páginas (flag) continuam; só a entrada direta é poupada.
    if (!nav && (entrySeen(page) || performance.now() > SLOW_LOAD_MS)) {
      finishOverlay(overlay);
      return;
    }

    loadLogo(overlay);

    const uncover = () => {
      document.documentElement.classList.remove("ca-loading");
      document.documentElement.classList.add("ca-page-ready");
      document.documentElement.style.overflow = "hidden";
      overlay.style.visibility = "visible";
      overlay.style.opacity = "1";
      if (window.location.hash) {
        requestAnimationFrame(() => {
          const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
          target?.scrollIntoView({ behavior: "instant", block: "start" });
        });
      }
    };

    if (page === "home") {
      if (nav === "from-ementa") {
        setScene(overlay, "panfleto", "saida");
        uncover();
        runTimed(overlay, 400, () => finishOverlay(overlay));
        return;
      }
      setScene(overlay, "portas");
      runTimed(overlay, 1650, () => finishOverlay(overlay));
      return;
    }

    if (page === "ementa") {
      if (nav === "to-ementa-played") {
        setScene(overlay, "panfleto", "revela");
        uncover();
        runTimed(overlay, 400, () => finishOverlay(overlay));
        return;
      }
      setScene(overlay, "panfleto", "abre");
      runTimed(overlay, 780, () => finishOverlay(overlay));
    }
  }

  function navigateWithTransition(href, { scene, variant, flag, duration }) {
    const overlay = document.getElementById("ca-transicao");
    if (!overlay || reduced) {
      window.location.href = href;
      return;
    }

    if (navigating) return;
    navigating = true;
    try { sessionStorage.setItem(NAV_KEY, flag); } catch { /* Navegação continua sem armazenamento. */ }
    loadLogo(overlay);

    setScene(overlay, scene, variant);
    overlay.classList.add("ca-tr--cobre");
    overlay.style.opacity = "";
    overlay.style.visibility = "visible";

    runTimed(overlay, duration, () => {
      window.location.href = href;
    });
  }

  function bindCrossPageLinks() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link || event.defaultPrevented) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const from = pageName(window.location.pathname);
      const to = pageName(url.pathname);
      if (from === to) return;

      const allowed = new Set(["index.html", "ementa.html"]);
      if (!allowed.has(from) || !allowed.has(to)) return;

      event.preventDefault();

      if (from === "index.html" && to === "ementa.html") {
        navigateWithTransition(link.href, {
          scene: "panfleto",
          variant: "abre",
          flag: "to-ementa-played",
          duration: 780,
        });
        return;
      }

      if (from === "ementa.html" && to === "index.html") {
        navigateWithTransition(link.href, {
          scene: "panfleto",
          variant: "fecha",
          flag: "from-ementa",
          duration: 720,
        });
      }
    });
  }

  /** Evita página em cache com overlay a meio da animação (voltar no browser). */
  function snapshotCleanStateForCache() {
    const overlay = document.getElementById("ca-transicao");
    navigating = false;
    clearActiveTimer();
    activeRunId += 1;
    if (overlay) {
      overlay.classList.add("is-done");
      overlay.dataset.saltar = "";
    }
    revealPage();
  }

  function boot() {
    if (window.__caTransicaoBooted) return;
    window.__caTransicaoBooted = true;

    initEntry();
    bindCrossPageLinks();

    window.addEventListener("pagehide", (event) => {
      if (event.persisted) snapshotCleanStateForCache();
    });
    window.addEventListener("pageshow", (event) => {
      if (!event.persisted) return;
      finishOverlay(document.getElementById("ca-transicao"));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
