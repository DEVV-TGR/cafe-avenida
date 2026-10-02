/**
 * Carrossel automático no telemóvel: ida até ao fim, volta atrás, e repete.
 * Galeria mais rápida; sugestões e opiniões mais lentas.
 * Depois de tocares ou dares scroll, retoma sozinho.
 */
(function () {
  const MQ = "(max-width: 39.99rem)";
  const END_DWELL = 520;
  const RESUME_AFTER = 2200;
  const TRACKS = [
    { selector: "[data-suggestions]", speed: 24 },
    { selector: "[data-reviews]", speed: 24 },
  ];

  function prefersReduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function inView(el) {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 48 && r.top < window.innerHeight - 48;
  }

  function lightboxOpen() {
    return document.documentElement.classList.contains("lightbox-open");
  }

  function attach(el, speed) {
    const mq = window.matchMedia(MQ);
    const state = {
      dir: 1,
      pos: 0,
      last: 0,
      dwellUntil: 0,
      userHold: false,
      fingerDown: false,
      resumeTimer: 0,
      writing: false,
      sawLightbox: false,
    };

    function maxScroll() {
      return Math.max(0, el.scrollWidth - el.clientWidth);
    }

    function setAuto(on) {
      el.classList.toggle("is-auto-scrolling", on);
    }

    function resume() {
      state.fingerDown = false;
      state.userHold = false;
      state.pos = el.scrollLeft;
      state.last = performance.now();
      state.resumeTimer = 0;
    }

    function armResume() {
      window.clearTimeout(state.resumeTimer);
      if (state.fingerDown || lightboxOpen()) {
        state.resumeTimer = 0;
        return;
      }
      state.resumeTimer = window.setTimeout(resume, RESUME_AFTER);
    }

    function pauseForUser() {
      state.userHold = true;
      setAuto(false);
      armResume();
    }

    function onFingerDown() {
      state.fingerDown = true;
      pauseForUser();
    }

    function onFingerUp() {
      if (!state.fingerDown) return;
      state.fingerDown = false;
      pauseForUser();
    }

    el.addEventListener("pointerdown", onFingerDown);
    el.addEventListener("touchstart", onFingerDown, { passive: true });
    window.addEventListener("pointerup", onFingerUp);
    window.addEventListener("pointercancel", onFingerUp);
    window.addEventListener("touchend", onFingerUp, { passive: true });
    window.addEventListener("touchcancel", onFingerUp, { passive: true });

    el.addEventListener(
      "wheel",
      () => {
        pauseForUser();
      },
      { passive: true }
    );

    return {
      step(now) {
        const lightbox = lightboxOpen();
        if (lightbox) state.sawLightbox = true;
        if (state.sawLightbox && !lightbox) {
          state.sawLightbox = false;
          resume();
        }

        if (state.userHold && !state.fingerDown && !state.resumeTimer && !lightbox) {
          armResume();
        }

        const can =
          mq.matches &&
          !prefersReduced() &&
          !state.userHold &&
          !document.hidden &&
          !lightbox &&
          inView(el);

        if (!can) {
          setAuto(false);
          state.last = now;
          if (!state.writing) state.pos = el.scrollLeft;
          return;
        }

        const max = maxScroll();
        if (max < 12) {
          setAuto(false);
          state.last = now;
          return;
        }

        setAuto(true);
        if (now < state.dwellUntil) {
          state.last = now;
          return;
        }

        const dt = Math.min(48, now - state.last) / 1000;
        state.last = now;
        state.pos += state.dir * speed * dt;

        if (state.pos >= max) {
          state.pos = max;
          if (state.dir === 1) {
            state.dir = -1;
            state.dwellUntil = now + END_DWELL;
          }
        } else if (state.pos <= 0) {
          state.pos = 0;
          if (state.dir === -1) {
            state.dir = 1;
            state.dwellUntil = now + END_DWELL;
          }
        }

        state.writing = true;
        el.scrollLeft = state.pos;
        requestAnimationFrame(() => {
          state.writing = false;
        });
      },
    };
  }

  function init() {
    const tracks = TRACKS.map(({ selector, speed }) => {
      const el = document.querySelector(selector);
      return el ? attach(el, speed) : null;
    }).filter(Boolean);

    if (!tracks.length) return;

    const mq = window.matchMedia(MQ);

    function loop(now) {
      requestAnimationFrame(loop);
      if (!mq.matches || prefersReduced()) return;
      tracks.forEach((track) => track.step(now));
    }

    requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
