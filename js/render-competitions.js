document.addEventListener("DOMContentLoaded", async () => {
  const board = document.getElementById("competitions-board");
  if (!board) return;

  const calendarGrid = document.getElementById("calendar-grid");
  const monthLabel = document.getElementById("calendar-month-label");
  const topPicks = document.getElementById("ic-top-picks");
  const topPicksCount = document.getElementById("top-picks-count");
  const filterStatus = document.getElementById("competition-filter-status");
  const fromInput = document.getElementById("competition-date-from");
  const throughInput = document.getElementById("competition-date-through");
  const instituteSelect = document.getElementById("competition-institute-filter");
  const clearButton = document.getElementById("clear-competition-filters");
  const previousButton = document.getElementById("calendar-previous");
  const nextButton = document.getElementById("calendar-next");
  const todayButton = document.getElementById("calendar-today");
  const dayDialog = document.getElementById("competition-day-dialog");
  const dayDialogTitle = document.getElementById("competition-day-title");
  const dayDialogCount = document.getElementById("competition-day-count");
  const dayDialogEvents = document.getElementById("competition-day-events");
  const closeDialogButton = document.getElementById("close-day-dialog");

  let competitions = [];
  let activeMonth = firstOfMonth(new Date());
  let focusedDateKey = toDateKey(new Date());
  let selectedDateKey = "";

  monthLabel.textContent = formatMonth(activeMonth);
  topPicks.innerHTML = `<p class="agenda-empty">Loading committee picks…</p>`;

  previousButton.addEventListener("click", () => changeMonth(-1));
  nextButton.addEventListener("click", () => changeMonth(1));
  todayButton.addEventListener("click", () => {
    const today = new Date();
    activeMonth = firstOfMonth(today);
    focusedDateKey = toDateKey(today);
    selectedDateKey = "";
    render();
  });
  instituteSelect.addEventListener("change", () => {
    selectedDateKey = "";
    render();
  });
  fromInput.addEventListener("change", onDateRangeChange);
  throughInput.addEventListener("change", onDateRangeChange);
  clearButton.addEventListener("click", () => {
    fromInput.value = "";
    throughInput.value = "";
    fromInput.max = "";
    throughInput.min = "";
    instituteSelect.value = "";
    activeMonth = firstOfMonth(new Date());
    focusedDateKey = toDateKey(new Date());
    selectedDateKey = "";
    render();
  });
  calendarGrid.addEventListener("click", event => {
    const dayButton = event.target.closest("[data-calendar-date]");
    if (!dayButton) return;
    focusedDateKey = dayButton.dataset.calendarDate;
    selectedDateKey = focusedDateKey;
    render();
    openDayDialog(selectedDateKey);
  });
  calendarGrid.addEventListener("keydown", handleCalendarKeydown);
  closeDialogButton.addEventListener("click", () => dayDialog.close());
  dayDialog.addEventListener("click", event => {
    if (event.target === dayDialog) dayDialog.close();
  });
  dayDialog.addEventListener("close", () => {
    const trigger = calendarGrid.querySelector(`[data-calendar-date="${selectedDateKey}"]`);
    if (trigger) trigger.focus();
  });

  try{
    const rows = await ICData.getCompetitions();
    competitions = rows.map(row => {
      const deadlineDate = parseDeadlineDate(row.deadline);
      const pickOrderValue = Number.parseInt(row.pickOrder, 10);
      return {
        ...row,
        name: String(row.name || "Untitled competition").trim(),
        institute: String(row.institute || "").trim(),
        pickNote: String(row.pickNote || "").trim(),
        pickOrder: Number.isFinite(pickOrderValue) && pickOrderValue > 0 ? pickOrderValue : Number.MAX_SAFE_INTEGER,
        deadlineDate,
        dateKey: deadlineDate ? toDateKey(deadlineDate) : ""
      };
    }).sort((a, b) => {
      if (a.dateKey && b.dateKey) return a.dateKey.localeCompare(b.dateKey);
      if (a.dateKey) return -1;
      if (b.dateKey) return 1;
      return a.name.localeCompare(b.name);
    });

    populateInstitutes();
    render();
    renderTopPicks();
    showDisclaimer(board, "Deadlines can change. Confirm the exact date on the competition’s official page before applying.");
  }catch(err){
    filterStatus.textContent = "Competition deadlines could not be loaded.";
    calendarGrid.innerHTML = `<p class="agenda-empty calendar-load-error">${escapeHtml(err.message)}</p>`;
    topPicksCount.textContent = "";
    topPicks.innerHTML = `<p class="agenda-empty">Try refreshing the page in a moment.</p>`;
  }

  function populateInstitutes(){
    const institutes = [...new Set(competitions.map(item => item.institute).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    instituteSelect.innerHTML = `<option value="">All institutes</option>${institutes.map(institute =>
      `<option value="${escapeHtml(institute)}">${escapeHtml(institute)}</option>`
    ).join("")}`;
  }

  function renderTopPicks(){
    const picks = competitions.filter(item => item.isTopPick).sort((a, b) => {
      if (a.pickOrder !== b.pickOrder) return a.pickOrder - b.pickOrder;
      if (a.dateKey && b.dateKey) return a.dateKey.localeCompare(b.dateKey);
      if (a.dateKey) return -1;
      if (b.dateKey) return 1;
      return a.name.localeCompare(b.name);
    });

    topPicksCount.textContent = `${picks.length} ${picks.length === 1 ? "committee pick" : "committee picks"}`;
    if (!picks.length){
      topPicks.innerHTML = `<p class="top-picks-empty">The committee’s selected competitions will appear here.</p>`;
      return;
    }
    topPicks.innerHTML = picks.map(item => renderCompetitionItem(item, true)).join("");
  }

  function onDateRangeChange(){
    throughInput.min = fromInput.value;
    fromInput.max = throughInput.value;
    const anchor = fromInput.value || throughInput.value;
    if (anchor){
      const date = parseDeadlineDate(anchor);
      if (date){
        activeMonth = firstOfMonth(date);
        focusedDateKey = toDateKey(date);
      }
    }
    selectedDateKey = "";
    render();
  }

  function changeMonth(offset){
    activeMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + offset, 1);
    focusedDateKey = toDateKey(activeMonth);
    selectedDateKey = "";
    render();
  }

  function handleCalendarKeydown(event){
    const dayButton = event.target.closest("[data-calendar-date]");
    if (!dayButton) return;

    const current = parseDeadlineDate(dayButton.dataset.calendarDate);
    let nextDate = null;
    if (event.key === "ArrowLeft") nextDate = shiftDate(current, -1);
    if (event.key === "ArrowRight") nextDate = shiftDate(current, 1);
    if (event.key === "ArrowUp") nextDate = shiftDate(current, -7);
    if (event.key === "ArrowDown") nextDate = shiftDate(current, 7);
    if (event.key === "Home") nextDate = new Date(current.getFullYear(), current.getMonth(), 1);
    if (event.key === "End") nextDate = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    if (!nextDate) return;

    event.preventDefault();
    focusedDateKey = toDateKey(nextDate);
    selectedDateKey = "";
    if (nextDate.getMonth() !== activeMonth.getMonth() || nextDate.getFullYear() !== activeMonth.getFullYear()){
      activeMonth = firstOfMonth(nextDate);
    }
    render();
    calendarGrid.querySelector(`[data-calendar-date="${focusedDateKey}"]`)?.focus();
  }

  function render(){
    const monthKey = toDateKey(activeMonth).slice(0, 7);
    const rangeStart = fromInput.value;
    const rangeEnd = throughInput.value;
    const invalidRange = Boolean(rangeStart && rangeEnd && rangeStart > rangeEnd);
    const hasFilters = Boolean(rangeStart || rangeEnd || instituteSelect.value);
    clearButton.disabled = !hasFilters;
    monthLabel.textContent = formatMonth(activeMonth);

    const filtered = invalidRange ? [] : competitions.filter(item => {
      if (instituteSelect.value && item.institute !== instituteSelect.value) return false;
      if (rangeStart && (!item.dateKey || item.dateKey < rangeStart)) return false;
      if (rangeEnd && (!item.dateKey || item.dateKey > rangeEnd)) return false;
      return true;
    });

    if (selectedDateKey && !filtered.some(item => item.dateKey === selectedDateKey)) selectedDateKey = "";

    if (invalidRange){
      filterStatus.textContent = "Choose an end date that falls on or after the start date.";
    }else{
      filterStatus.textContent = `${filtered.length} ${filtered.length === 1 ? "competition" : "competitions"}${hasFilters ? " match your filters" : " listed"}`;
    }

    renderCalendar(filtered, monthKey);
  }

  function renderCalendar(filtered, monthKey){
    const year = activeMonth.getFullYear();
    const month = activeMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const numberOfCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    const monthItems = filtered.filter(item => item.dateKey.startsWith(monthKey));
    const itemsByDate = new Map();
    monthItems.forEach(item => {
      if (!itemsByDate.has(item.dateKey)) itemsByDate.set(item.dateKey, []);
      itemsByDate.get(item.dateKey).push(item);
    });

    const focusedDate = parseDeadlineDate(focusedDateKey);
    if (!focusedDate || focusedDate.getFullYear() !== year || focusedDate.getMonth() !== month){
      focusedDateKey = toDateKey(new Date(year, month, 1));
    }

    const cells = [];
    for (let index = 0; index < numberOfCells; index++){
      const day = index - firstWeekday + 1;
      if (day < 1 || day > daysInMonth){
        cells.push(`<div class="calendar-blank" aria-hidden="true"></div>`);
        continue;
      }

      const date = new Date(year, month, day);
      const key = toDateKey(date);
      const dayItems = itemsByDate.get(key) || [];
      const today = key === toDateKey(new Date());
      const selected = key === selectedDateKey;
      const classes = ["calendar-day", dayItems.length ? "has-deadline" : "is-empty", today ? "is-today" : "", selected ? "is-selected" : ""].filter(Boolean).join(" ");
      const markers = dayItems.slice(0, 2).map(item =>
        `<span class="calendar-event-marker${item.isTopPick ? " is-top-pick" : ""}" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>`
      ).join("");
      const more = dayItems.length > 2 ? `<span class="calendar-event-more">+${dayItems.length - 2} more</span>` : "";
      const summary = dayItems.length ? `: ${dayItems.map(item => item.name).join(", ")}` : ": no competition deadlines";
      const label = `${formatLongDate(date)}${summary}`;
      const current = today ? ` aria-current="date"` : "";

      cells.push(`<button class="${classes}" type="button" data-calendar-date="${key}" tabindex="${key === focusedDateKey ? "0" : "-1"}" aria-label="${escapeHtml(label)}" aria-pressed="${selected}"${current}>
        <span class="calendar-day-number">${day}</span>
        <span class="calendar-event-markers">${markers}${more}</span>
      </button>`);
    }
    calendarGrid.innerHTML = cells.join("");
  }

  function openDayDialog(dateKey){
    const date = parseDeadlineDate(dateKey);
    const hasFilters = Boolean(fromInput.value || throughInput.value || instituteSelect.value);
    const items = getFilteredCompetitions().filter(item => item.dateKey === dateKey);
    dayDialogTitle.textContent = formatLongDate(date);
    dayDialogCount.textContent = `${items.length} ${items.length === 1 ? "competition deadline" : "competition deadlines"}`;
    dayDialogEvents.innerHTML = items.length
      ? items.map(item => renderCompetitionItem(item, item.isTopPick)).join("")
      : `<p class="day-dialog-empty">No competitions are listed for this date${hasFilters ? " with the current filters" : ""}.</p>`;
    dayDialog.showModal();
    closeDialogButton.focus();
  }

  function getFilteredCompetitions(){
    const rangeStart = fromInput.value;
    const rangeEnd = throughInput.value;
    if (rangeStart && rangeEnd && rangeStart > rangeEnd) return [];
    return competitions.filter(item => {
      if (instituteSelect.value && item.institute !== instituteSelect.value) return false;
      if (rangeStart && (!item.dateKey || item.dateKey < rangeStart)) return false;
      if (rangeEnd && (!item.dateKey || item.dateKey > rangeEnd)) return false;
      return true;
    });
  }

  function renderCompetitionItem(item, isTopPick){
    const date = item.deadlineDate;
    const dateBlock = date
      ? `<div class="deadline-date-block${isTopPick ? " is-top-pick" : ""}" aria-hidden="true"><strong>${date.getDate()}</strong><span>${date.toLocaleDateString("en-IN", { month:"short" })}</span></div>`
      : `<div class="deadline-date-block is-undated${isTopPick ? " is-top-pick" : ""}" aria-hidden="true"><strong>—</strong><span>TBC</span></div>`;
    const dateCopy = date ? `<p class="deadline-exact">Due ${formatShortDate(date)}</p>` : `<p class="deadline-exact">Deadline not announced</p>`;
    const details = item.link
      ? `<a class="deadline-details" href="${escapeHtml(item.link)}" target="_blank" rel="noopener">Competition details ${ICIcons.externalLink}</a>`
      : "";
    const note = isTopPick && item.pickNote ? `<p class="top-pick-note">${escapeHtml(item.pickNote)}</p>` : "";
    const pickLabel = isTopPick ? `<span class="top-pick-label">IC pick</span>` : "";

    return `<article class="deadline-item${isTopPick ? " is-top-pick" : ""}">
      ${dateBlock}
      <div class="deadline-item-copy">
        ${pickLabel}
        <h3>${escapeHtml(item.name)}</h3>
        <p class="deadline-institute">${escapeHtml(item.institute || "Institute not listed")}</p>
        ${note}
        ${dateCopy}
        ${details}
      </div>
    </article>`;
  }

  function parseDeadlineDate(value){
    const raw = String(value || "").trim();
    if (!raw) return null;

    const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDate){
      const year = Number(isoDate[1]);
      const month = Number(isoDate[2]);
      const day = Number(isoDate[3]);
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  function firstOfMonth(date){ return new Date(date.getFullYear(), date.getMonth(), 1); }
  function shiftDate(date, days){ return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days); }

  function toDateKey(date){
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function formatMonth(date){
    return date.toLocaleDateString("en-IN", { month:"long", year:"numeric" });
  }

  function formatLongDate(date){
    return date.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  }

  function formatShortDate(date){
    return date.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" });
  }

  function showDisclaimer(afterEl, text){
    let note = document.getElementById("competitions-disclaimer");
    if (!note){
      note = document.createElement("p");
      note.id = "competitions-disclaimer";
      note.className = "page-disclaimer";
      afterEl.insertAdjacentElement("afterend", note);
    }
    note.textContent = text;
  }
});
