/** Sugestões editáveis em config.js: category = sweet | snack | meal | drink. */
(function () {
  function init() {
    const root = document.querySelector('[data-chooser]');
    if (!root) return;
    const i18n = window.CafeI18n;
    const local = value => value?.[i18n.getLang()] ?? value?.pt ?? '';
    const toggle = root.querySelector('[data-chooser-toggle]');
    const panel = root.querySelector('[data-chooser-panel]');
    const result = root.querySelector('[data-chooser-result]');
    let selected = null;
    let previous = null;
    function pick(category, keep = false) {
      selected = category;
      root.querySelectorAll('[data-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.choice === category)));
      const pool = (window.CAFE_CONFIG.suggestions || []).filter(item => item.category === category);
      const choices = pool.length > 1 ? pool.filter(item => item !== previous) : pool;
      const item = keep && pool.includes(previous) ? previous : choices[Math.floor(Math.random() * choices.length)];
      result.replaceChildren();
      result.hidden = false;
      if (!item) { result.textContent = i18n.t('chooser.empty'); return; }
      previous = item;
      if (item.image) {
        const image = document.createElement('img');
        window.CafeImagens.apply(image, item.image, '(min-width: 40rem) 22rem, 80vw'); image.alt = local(item.name); image.className = 'chooser__image';
        image.decoding = 'async';
        result.append(image);
      }
      const copy = document.createElement('div'); copy.className = 'chooser__copy';
      const label = document.createElement('p'); label.className = 'section__eyebrow'; label.textContent = i18n.t('chooser.try');
      const title = document.createElement('h4'); title.textContent = local(item.name);
      const description = document.createElement('p'); description.textContent = local(item.description);
      copy.append(label, title, description);
      if (item.menuId) {
        const link = document.createElement('a'); link.textContent = i18n.t('chooser.menu'); link.href = `${i18n.pathFor("/ementa")}#item-${item.menuId}`;
        copy.append(link);
      }
      if (pool.length > 1) {
        const again = document.createElement('button'); again.type = 'button'; again.className = 'chooser__again'; again.textContent = i18n.t('chooser.another');
        again.addEventListener('click', () => { pick(category); root.querySelector('.chooser__again')?.focus({preventScroll:true}); });
        copy.append(again);
      }
      result.append(copy);
    }
    const disclose = window.CafeDisclosure(panel, open => { panel.hidden = !open; }, { timeScale: .5 });
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      panel.inert = !open;
      disclose(open);
    });
    root.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => pick(button.dataset.choice)));
    window.addEventListener('cafe:langchange', () => { if (selected) pick(selected, true); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
