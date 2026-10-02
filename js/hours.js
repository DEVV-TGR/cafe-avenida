/**
 * Horário com fuso Europe/Lisbon e suporte a encerramento após meia-noite.
 */
(function () {
  const TZ = "Europe/Lisbon";

  function parseTime(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  }

  /** Partes da data/hora em Lisboa */
  function lisbonParts(date) {
    const d = date || new Date();
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(d);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      day: weekdayMap[map.weekday] ?? 0,
      minutes: parseTime(`${map.hour}:${map.minute}`),
    };
  }

  function slotForDay(schedule, dayIndex) {
    return schedule?.[dayIndex] ?? schedule?.[String(dayIndex)] ?? null;
  }

  /**
   * Verifica se o café está aberto no instante `date` (default: agora).
   */
  function isOpenNow(schedule, date) {
    const { day, minutes } = lisbonParts(date);
    const today = slotForDay(schedule, day);
    const yesterday = slotForDay(schedule, (day + 6) % 7);

    if (yesterday?.closeNextDay) {
      const closeMin = parseTime(yesterday.close);
      if (minutes < closeMin) return true;
    }

    if (!today) return false;

    const openMin = parseTime(today.open);
    const closeMin = parseTime(today.close);

    if (today.closeNextDay) {
      return minutes >= openMin;
    }

    return minutes >= openMin && minutes < closeMin;
  }

  /** Ordem segunda → domingo (como Cafe-Preguiça). Índices = Date.getDay(). */
  const DISPLAY_DAYS = [1, 2, 3, 4, 5, 6, 0];

  function formatSlot(slot, closedLabel) {
    if (!slot) return closedLabel;
    return `${slot.open} – ${slot.close}`;
  }

  /** Acrescenta células com textContent (sem interpretar HTML vindo da configuração). */
  function appendCells(row, cells) {
    cells.forEach(([tag, text, scope]) => {
      const cell = document.createElement(tag);
      if (scope) cell.scope = scope;
      cell.textContent = text;
      row.appendChild(cell);
    });
  }

  function renderHoursPanel(container, schedule, i18n) {
    if (!container) return;
    const { day: todayIndex } = lisbonParts();
    const open = isOpenNow(schedule);
    const statusEl = container.querySelector("[data-hours-status]");
    const tbody = container.querySelector("[data-hours-body]");
    const list = container.querySelector("[data-hours-list]");

    if (statusEl) {
      statusEl.textContent = open ? i18n.t("hours.openNow") : i18n.t("hours.closedNow");
      statusEl.classList.toggle("is-open", open);
      statusEl.classList.toggle("is-closed", !open);
    }

    if (list) {
      list.innerHTML = "";
      DISPLAY_DAYS.forEach((d) => {
        const li = document.createElement("li");
        if (d === todayIndex) li.classList.add("is-today");
        const names = i18n.dayNames?.() ?? [];
        const dayName = names[d] ?? String(d);
        const slot = slotForDay(schedule, d);
        appendCells(li, [["span", dayName], ["span", formatSlot(slot, i18n.t("hours.closed"))]]);
        list.appendChild(li);
      });
    }

    if (tbody) {
      tbody.innerHTML = "";
      for (let d = 0; d < 7; d++) {
        const tr = document.createElement("tr");
        if (d === todayIndex) tr.classList.add("is-today");
        const names = i18n.dayNames?.() ?? [];
        const dayName = names[d] ?? String(d);
        const slot = slotForDay(schedule, d);
        appendCells(tr, [["th", dayName, "row"], ["td", formatSlot(slot, i18n.t("hours.closed"))]]);
        tbody.appendChild(tr);
      }
    }

    const note = container.querySelector("[data-hours-note]");
    if (note) {
      note.hidden = false;
      note.textContent = i18n.t("hours.overnightNote");
    }
  }

  /** @deprecated use renderHoursPanel */
  function renderHoursTable(container, schedule, i18n) {
    renderHoursPanel(container, schedule, i18n);
  }

  window.CafeHours = { isOpenNow, renderHoursPanel, renderHoursTable, lisbonParts };
})();
