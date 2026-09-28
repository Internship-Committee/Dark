document.addEventListener("DOMContentLoaded", async () => {
  const board = document.getElementById("competitions-board");
  if (!board) return;

  const calendarGrid = document.getElementById("calendar-grid");
  const monthLabel = document.getElementById("calendar-month-label");
  const agendaKicker = document.getElementById("agenda-kicker");
  const agendaTitle = document.getElementById("agenda-title");
  const agendaCount = document.getElementById("agenda-count");
  const agenda = document.getElementById("competition-agenda");
  const filterStatus = document.getElementById("competition-filter-status");
  const fromInput = document.getElementById("competition-date-from");
  const throughInput = document.getElementById("competition-date-through");
  const instituteSelect = document.getElementById("competition-institute-filter");
  const clearButton = document.getElementById("clear-competition-filters");
  const previousButton = document.getElementById("calendar-previous");
  const nextButton = document.getElementById("calendar-next");
  const todayButton = document.getElementById("calendar-today");

  let competitions = [];
  let activeMonth = firstOfMonth(new Date());
  let selectedDateKey = "";

  previousButton.addEventListener("click", () => changeMonth(-1));
  nextButton.addEventListener("click", () => changeMonth(1));
  todayButton.addEventListener("click", () => {
    activeMonth = firstOfMonth(new Date());
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
    selectedDateKey = "";
    render();
  });
  calendarGrid.addEventListener("click", event => {
    const dayButton = event.target.closest("[data-calendar-date]");
    if (!dayButton) return;
    selectedDateKey = selectedDateKey === dayButton.dataset.calendarDate ? "" : dayButton.dataset.calendarDate;
    render();
  });

  try{
    const rows = await ICData.getCompetitions();
    competitions = rows.map((row, index) => {
      const deadlineDate = parseDeadlineDate(row.deadline);
      return {
        ...row,
        name: String(row.name || "Untitled competition").trim(),
        institute: String(row.institute || "").trim(),
        deadlineDate,
        dateKey: deadlineDate ? toDateKey(deadlineDate) : "",
        originalIndex: index
      };
    }).sort((a, b) => {
      if (a.dateKey && b.dateKey) return a.dateKey.localeCompare(b.dateKey);
      if (a.dateKey) return -1;
      if (b.dateKey) return 1;
      return a.name.localeCompare(b.name);
    });

    populateInstitutes();
    render();
    showDisclaimer(board, "Deadlines can change. Confirm the exact date on the competition’s official page before applying.");
  }catch(err){
    filterStatus.textContent = "Competition deadlines could not be loaded.";
    calendarGrid.innerHTML = `<p class="agenda-empty calendar-load-error">${escapeHtml(err.message)}</p>`;
    agendaTitle.textContent = "Unavailable";
    agendaCount.textContent = "";
    agenda.innerHTML = `<p class="agenda-empty">Try refreshing the page in a moment.</p>`;
  }

  function populateInstitutes(){
    const institutes = [...new Set(competitions.map(item => item.institute).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    instituteSelect.innerHTML = `<option value="">All institutes</option>${institutes.map(institute =>
      `<option value="${escapeHtml(institute)}">${escapeHtml(institute)}</option>`
    ).join("")}`;
  }

  function onDateRangeChange(){
    throughInput.min = fromInput.value;
    fromInput.max = throughInput.value;
    const anchor = fromInput.value || throughInput.value;
    if (anchor){
      const date = parseDeadlineDate(anchor);
      if (date) activeMonth = firstOfMonth(date);
    }
    selectedDateKey = "";
    render();
  }

  function changeMonth(offset){
    activeMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + offset, 1);
    selectedDateKey = "";
    render();
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
    renderAgenda(filtered, monthKey, invalidRange);
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

    if (!competitions.length){
      calendarGrid.innerHTML = `<p class="agenda-empty calendar-load-error">No competition deadlines are listed yet.</p>`;
      return;
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
      const hasDeadline = dayItems.length > 0;
      const today = key === toDateKey(new Date());
      const selected = key === selectedDateKey;
      const classes = ["calendar-day", hasDeadline ? "has-deadline" : "is-empty", today ? "is-today" : "", selected ? "is-selected" : ""].filter(Boolean).join(" ");
      const markers = dayItems.slice(0, 2).map(item =>
        `<span class="calendar-event-marker" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>`
      ).join("");
      const more = dayItems.length > 2 ? `<span class="calendar-event-more">+${dayItems.length - 2} more</span>` : "";
      const summary = dayItems.length ? `: ${dayItems.map(item => item.name).join(", ")}` : "";
      const label = `${formatLongDate(date)}${summary}`;

      if (hasDeadline){
        cells.push(`<button class="${classes}" type="button" data-calendar-date="${key}" aria-label="${escapeHtml(label)}" aria-pressed="${selected}">
          <span class="calendar-day-number">${day}</span>
          <span class="calendar-event-markers">${markers}${more}</span>
        </button>`);
      }else{
        cells.push(`<div class="${classes}"><span class="calendar-day-number">${day}</span></div>`);
      }
    }
    calendarGrid.innerHTML = cells.join("");
  }

  function renderAgenda(filtered, monthKey, invalidRange){
    if (!competitions.length){
      agendaKicker.textContent = "Coming up";
      agendaTitle.textContent = "No competitions yet";
      agendaCount.textContent = "";
      agenda.innerHTML = `<p class="agenda-empty">New competitions will appear here when they’re added.</p>`;
      return;
    }

    if (selectedDateKey){
      const selectedDate = parseDeadlineDate(selectedDateKey);
      const items = filtered.filter(item => item.dateKey === selectedDateKey);
      agendaKicker.textContent = "Selected date";
      agendaTitle.textContent = formatAgendaDate(selectedDate);
      agendaCount.textContent = `${items.length} ${items.length === 1 ? "competition" : "competitions"} due`;
      agenda.innerHTML = items.map(renderAgendaItem).join("");
      return;
    }

    const monthItems = filtered.filter(item => item.dateKey.startsWith(monthKey));
    const undatedItems = filtered.filter(item => !item.dateKey);
    agendaKicker.textContent = "This month";
    agendaTitle.textContent = formatMonth(activeMonth);
    agendaCount.textContent = `${monthItems.length} ${monthItems.length === 1 ? "deadline" : "deadlines"}`;

    if (invalidRange){
      agenda.innerHTML = `<p class="agenda-empty">Adjust the date range to see matching competitions.</p>`;
      return;
    }
    if (!monthItems.length && !undatedItems.length){
      const message = filtered.length
        ? "No matching deadlines this month. Use the arrows to browse other months."
        : "No competitions match these filters.";
      agenda.innerHTML = `<p class="agenda-empty">${message}</p>`;
      return;
    }

    let content = monthItems.map(renderAgendaItem).join("");
    if (undatedItems.length){
      content += `<h3 class="agenda-subheading">Date not listed</h3>${undatedItems.map(renderAgendaItem).join("")}`;
    }
    agenda.innerHTML = content;
  }

  function renderAgendaItem(item){
    const date = item.deadlineDate;
    const dateBlock = date
      ? `<div class="deadline-date-block" aria-hidden="true"><strong>${date.getDate()}</strong><span>${date.toLocaleDateString("en-IN", { month:"short" })}</span></div>`
      : `<div class="deadline-date-block is-undated" aria-hidden="true"><strong>—</strong><span>TBC</span></div>`;
    const dateCopy = date ? `<p class="deadline-exact">Due ${formatShortDate(date)}</p>` : `<p class="deadline-exact">Deadline not announced</p>`;
    const details = item.link
      ? `<a class="deadline-details" href="${escapeHtml(item.link)}" target="_blank" rel="noopener">Competition details ${ICIcons.externalLink}</a>`
      : "";

    return `<article class="deadline-item">
      ${dateBlock}
      <div class="deadline-item-copy">
        <h3>${escapeHtml(item.name)}</h3>
        <p class="deadline-institute">${escapeHtml(item.institute || "Institute not listed")}</p>
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

  function toDateKey(date){
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function formatMonth(date){
    return date.toLocaleDateString("en-IN", { month:"long", year:"numeric" });
  }

  function formatLongDate(date){
    return date.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  }

  function formatAgendaDate(date){
    return date.toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });
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
