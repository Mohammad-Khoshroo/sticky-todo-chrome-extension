//////////////////////////////////////////////////////////////////
// ---------------------------------------------------------------
//   EXPANDED FULL-SCREEN CALENDAR WITH IN-CELL DEADLINES
// ---------------------------------------------------------------
//////////////////////////////////////////////////////////////////

let isExpandedCalendarOpen = false;
let expJy = null;
let expJm = null;
let expGy = null;
let expGm = null;
let expHy = null;
let expHm = null;
let isOverdueDrawerOpen = false;

function initExpandedCalendarState() {
    const today = new Date();
    if (typeof jalaali !== "undefined") {
        const j = jalaali.toJalaali(today);
        expJy = (typeof currentJy !== "undefined" && currentJy) ? currentJy : j.jy;
        expJm = (typeof currentJm !== "undefined" && currentJm) ? currentJm : j.jm;
    }
    expGy = (typeof currentGy !== "undefined" && currentGy) ? currentGy : today.getFullYear();
    expGm = (typeof currentGm !== "undefined" && currentGm) ? currentGm : today.getMonth() + 1;

    if (typeof getHijriParts === "function") {
        const h = getHijriParts(today);
        expHy = (typeof currentHy !== "undefined" && currentHy) ? currentHy : h.hy;
        expHm = (typeof currentHm !== "undefined" && currentHm) ? currentHm : h.hm;
    }
}

function openExpandedCalendar() {
    initExpandedCalendarState();
    let modal = document.getElementById("expanded-calendar-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "expanded-calendar-modal";
        modal.className = "expanded-calendar-modal";
        document.body.appendChild(modal);
    }

    isExpandedCalendarOpen = true;
    renderExpandedCalendarContent(modal);
    modal.classList.remove("hidden", "is-closing");
    document.body.classList.add("modal-open");
}

function closeExpandedCalendar(immediate = false) {
    const modal = document.getElementById("expanded-calendar-modal");
    if (!modal) return;

    if (immediate) {
        modal.classList.add("hidden");
        modal.classList.remove("is-closing");
        isExpandedCalendarOpen = false;
        document.body.classList.remove("modal-open");
        return;
    }

    modal.classList.add("is-closing");
    setTimeout(() => {
        if (modal.classList.contains("is-closing")) {
            modal.classList.add("hidden");
            modal.classList.remove("is-closing");
            isExpandedCalendarOpen = false;
            document.body.classList.remove("modal-open");
        }
    }, 220);
}

function renderOverdueTasksCards(list, fd, remDict) {
    if (!list || list.length === 0) return '';
    return list.map(item => {
        const colorClass = item.note.colorClass || 'color-0';
        const noteTitle = item.note.title || (remDict ? remDict.untitledNote : 'یادداشت');
        const diffDays = Math.abs(item.diffDays || 1);
        const daysAgoStr = (remDict && typeof remDict.relDaysAgo === "function")
            ? remDict.relDaysAgo(fd(diffDays))
            : `${fd(diffDays)} روز پیش`;

        return `
            <div class="exp-overdue-card ${colorClass}">
                <div class="exp-overdue-top">
                    <label class="exp-overdue-check-label">
                        <input type="checkbox" class="exp-overdue-check" data-note="${item.noteIndex}" data-task="${item.taskIndex}">
                        <span class="exp-overdue-text">${escapeHTML(item.task.text || 'تسک')}</span>
                    </label>
                    <button type="button" class="exp-overdue-jump-btn" data-note="${item.noteIndex}" data-task="${item.taskIndex}" title="${remDict ? remDict.jumpToNote : 'مشاهده روی برگه'}">🔍</button>
                </div>
                <div class="exp-overdue-bottom">
                    <span class="exp-overdue-note-badge">${escapeHTML(noteTitle)}</span>
                    <span class="exp-overdue-date-badge">${daysAgoStr}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderExpandedCalendarContent(modal) {
    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const expDict = dict && dict.expandedCal ? dict.expandedCal : null;
    const remDict = dict && dict.reminder ? dict.reminder : null;
    const fd = (typeof toFarsiNumber === "function" && (currentLanguage === "fa" || currentLanguage === "ar"))
        ? toFarsiNumber
        : (x => x);

    const calType = typeof currentCalendarType !== "undefined" ? currentCalendarType : "jalali";

    const dlData = (typeof getThreeWeekDeadlines === "function") ? getThreeWeekDeadlines() : null;
    const overdueList = dlData ? dlData.overdue.filter(x => !x.isChecked) : [];
    const overdueCount = overdueList.length;
    const todayCount = dlData ? dlData.today.filter(x => !x.isChecked).length : 0;
    const thisWeekCount = dlData ? dlData.thisWeekRemaining.filter(x => !x.isChecked).length : 0;
    const nextWeekCount = dlData ? dlData.nextWeek.filter(x => !x.isChecked).length : 0;
    const totalCount = dlData ? dlData.totalActive : 0;

    let monthTitle = "";
    if (calType === "jalali") {
        const mNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
        monthTitle = `${mNames[expJm - 1]} ${fd(expJy)}`;
    } else if (calType === "gregorian") {
        const gDate = new Date(expGy, expGm - 1, 1);
        const mName = gDate.toLocaleDateString(currentLanguage || "en", { month: "long" });
        monthTitle = `${mName} ${expGy}`;
    } else if (calType === "hijri") {
        const hNames = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
        monthTitle = `${hNames[expHm - 1]} ${fd(expHy)}`;
    }

    const typeBadgeText = (calType === "jalali") ? "شمسی" : (calType === "gregorian" ? "میلادی" : "قمری");

    modal.innerHTML = `
        <div class="expanded-cal-backdrop" id="expanded-cal-backdrop"></div>
        <div class="expanded-cal-container">
            <!-- Header -->
            <div class="expanded-cal-header">
                <div class="expanded-cal-header-left">
                    <button type="button" class="expanded-cal-nav-btn" id="exp-prev-btn" title="ماه قبل">❮</button>
                    <h2 class="expanded-cal-month-title">${monthTitle}</h2>
                    <button type="button" class="expanded-cal-nav-btn" id="exp-next-btn" title="ماه بعد">❯</button>
                    <button type="button" class="expanded-cal-today-btn" id="exp-today-btn">${expDict ? expDict.today : 'امروز'}</button>
                </div>
                <div class="expanded-cal-header-right">
                    <button type="button" class="expanded-cal-type-btn" id="exp-type-btn" title="تغییر نوع تقویم">
                        <span>🌐</span>
                        <span class="exp-type-badge">${typeBadgeText}</span>
                    </button>
                    <button type="button" class="close-expanded-cal-btn" id="btn-close-expanded-cal" title="بستن">✕</button>
                </div>
            </div>

            <!-- Overdue Tasks Accordion Banner -->
            ${overdueCount > 0 ? `
            <div class="expanded-overdue-banner ${isOverdueDrawerOpen ? 'is-open' : ''}">
                <div class="expanded-overdue-header" id="exp-overdue-toggle">
                    <div class="expanded-overdue-title">
                        <span class="overdue-warning-icon">⚠️</span>
                        <span>${fd(overdueCount)} ${remDict ? remDict.kpiOverdue : 'کار عقب افتاده'} نیاز به رسیدگی دارند</span>
                    </div>
                    <button type="button" class="expanded-overdue-toggle-btn">
                        <span>${isOverdueDrawerOpen ? 'بستن' : 'مشاهده کارهای عقب افتاده'}</span>
                        <span>${isOverdueDrawerOpen ? '▲' : '▼'}</span>
                    </button>
                </div>
                <div class="expanded-overdue-body">
                    ${renderOverdueTasksCards(overdueList, fd, remDict)}
                </div>
            </div>
            ` : ''}

            <!-- Weekdays Row -->
            <div class="expanded-cal-weekdays">
                ${renderExpandedWeekdays(calType)}
            </div>

            <!-- Days Grid -->
            <div class="expanded-cal-days-grid" id="expanded-cal-days-grid">
                <!-- Injected via renderExpandedGridDays -->
            </div>
        </div>
    `;

    // Bind event listeners
    modal.querySelector("#expanded-cal-backdrop").addEventListener("click", closeExpandedCalendar);
    modal.querySelector("#btn-close-expanded-cal").addEventListener("click", closeExpandedCalendar);

    modal.querySelector("#exp-prev-btn").addEventListener("click", () => {
        changeExpandedMonth(-1);
    });

    modal.querySelector("#exp-next-btn").addEventListener("click", () => {
        changeExpandedMonth(1);
    });

    modal.querySelector("#exp-today-btn").addEventListener("click", () => {
        const now = new Date();
        if (calType === "jalali" && typeof jalaali !== "undefined") {
            const j = jalaali.toJalaali(now);
            expJy = j.jy;
            expJm = j.jm;
        } else if (calType === "gregorian") {
            expGy = now.getFullYear();
            expGm = now.getMonth() + 1;
        } else if (calType === "hijri" && typeof getHijriParts === "function") {
            const h = getHijriParts(now);
            expHy = h.hy;
            expHm = h.hm;
        }
        renderExpandedCalendarContent(modal);
    });

    modal.querySelector("#exp-type-btn").addEventListener("click", () => {
        if (typeof cycleCalendarType === "function") {
            cycleCalendarType();
        } else {
            if (currentCalendarType === "jalali") currentCalendarType = "gregorian";
            else if (currentCalendarType === "gregorian") currentCalendarType = "hijri";
            else currentCalendarType = "jalali";
        }
        initExpandedCalendarState();
        renderExpandedCalendarContent(modal);
    });

    // Overdue toggle
    const overdueToggle = modal.querySelector("#exp-overdue-toggle");
    if (overdueToggle) {
        overdueToggle.addEventListener("click", () => {
            isOverdueDrawerOpen = !isOverdueDrawerOpen;
            const banner = modal.querySelector(".expanded-overdue-banner");
            if (banner) {
                banner.classList.toggle("is-open", isOverdueDrawerOpen);
                const btn = banner.querySelector(".expanded-overdue-toggle-btn");
                if (btn) {
                    btn.innerHTML = `<span>${isOverdueDrawerOpen ? 'بستن' : 'مشاهده کارهای عقب افتاده'}</span> <span>${isOverdueDrawerOpen ? '▲' : '▼'}</span>`;
                }
            }
        });
    }

    // Overdue check events
    modal.querySelectorAll(".exp-overdue-check").forEach(chk => {
        chk.addEventListener("change", (e) => {
            e.stopPropagation();
            const nIdx = Number(e.target.dataset.note);
            const tIdx = Number(e.target.dataset.task);
            if (notes[nIdx] && notes[nIdx].tasks[tIdx]) {
                notes[nIdx].tasks[tIdx].checked = e.target.checked;
                if (typeof saveNotes === "function") saveNotes();
                if (typeof syncFridgeTaskCheckbox === "function") syncFridgeTaskCheckbox(nIdx, tIdx, e.target.checked);
                if (typeof renderCalendar === "function") renderCalendar();
                if (typeof updateDeadlinePanel === "function" && typeof selectedDeadlineKey !== "undefined") {
                    updateDeadlinePanel(selectedDeadlineKey);
                }
                if (typeof updateReminderBell === "function") updateReminderBell();

                renderExpandedCalendarContent(modal);
            }
        });
    });

    // Overdue jump events
    modal.querySelectorAll(".exp-overdue-jump-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const nIdx = Number(btn.dataset.note);
            const tIdx = Number(btn.dataset.task);
            if (typeof jumpToNoteOnFridge === "function") {
                jumpToNoteOnFridge(nIdx, tIdx);
            }
        });
    });

    renderExpandedGridDays(modal.querySelector("#expanded-cal-days-grid"), calType);
}

function renderExpandedWeekdays(calType) {
    const isLtr = document.documentElement.getAttribute("dir") !== "rtl";
    let days;

    if (!isLtr) {
        // Persian / Arabic: Sat to Fri
        days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
    } else {
        // English / Korean: Sun to Sat
        days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        if (currentLanguage === "ko") {
            days = ['일', '월', '화', '수', '목', '금', '토'];
        }
    }

    return days.map(d => `<div class="expanded-weekday-cell">${d}</div>`).join("");
}

function changeExpandedMonth(delta) {
    const calType = typeof currentCalendarType !== "undefined" ? currentCalendarType : "jalali";

    if (calType === "jalali") {
        expJm += delta;
        if (expJm < 1) {
            expJm = 12;
            expJy--;
        } else if (expJm > 12) {
            expJm = 1;
            expJy++;
        }
    } else if (calType === "gregorian") {
        expGm += delta;
        if (expGm < 1) {
            expGm = 12;
            expGy--;
        } else if (expGm > 12) {
            expGm = 1;
            expGy++;
        }
    } else if (calType === "hijri") {
        expHm += delta;
        if (expHm < 1) {
            expHm = 12;
            expHy--;
        } else if (expHm > 12) {
            expHm = 1;
            expHy++;
        }
    }

    const modal = document.getElementById("expanded-calendar-modal");
    if (modal) {
        renderExpandedCalendarContent(modal);
    }
}

function renderExpandedGridDays(gridEl, calType) {
    if (!gridEl) return;
    gridEl.innerHTML = "";

    const fd = (typeof toFarsiNumber === "function" && (currentLanguage === "fa" || currentLanguage === "ar"))
        ? toFarsiNumber
        : (x => x);

    const now = new Date();
    const todayJalali = (typeof jalaali !== "undefined") ? jalaali.toJalaali(now) : null;
    const isLtr = document.documentElement.getAttribute("dir") !== "rtl";

    if (calType === "jalali" && typeof jalaali !== "undefined") {
        const gFirst = jalaali.toGregorian(expJy, expJm, 1);
        const firstDate = new Date(gFirst.gy, gFirst.gm - 1, gFirst.gd);
        const jsDay = firstDate.getDay();
        const startDayIndex = (jsDay + 1) % 7; // Saturday = 0

        const totalDays = jalaali.jalaaliMonthLength(expJy, expJm);

        // Prepend empty cells
        for (let i = 0; i < startDayIndex; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "expanded-day-cell empty";
            gridEl.appendChild(emptyCell);
        }

        for (let day = 1; day <= totalDays; day++) {
            const gCur = jalaali.toGregorian(expJy, expJm, day);
            const gDate = new Date(gCur.gy, gCur.gm - 1, gCur.gd, 12, 0, 0);
            const dayKey = (typeof formatJalaliKey === "function")
                ? formatJalaliKey(expJy, expJm, day)
                : `${expJy}-${String(expJm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const isToday = (todayJalali && todayJalali.jy === expJy && todayJalali.jm === expJm && todayJalali.jd === day);
            renderExpandedDayCell(gridEl, day, dayKey, gDate, isToday, fd);
        }
    } else if (calType === "gregorian") {
        const firstDate = new Date(expGy, expGm - 1, 1);
        const jsDay = firstDate.getDay(); // 0: Sun
        const startDayIndex = isLtr ? jsDay : ((jsDay + 1) % 7);

        const totalDays = new Date(expGy, expGm, 0).getDate();

        for (let i = 0; i < startDayIndex; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "expanded-day-cell empty";
            gridEl.appendChild(emptyCell);
        }

        for (let day = 1; day <= totalDays; day++) {
            const gDate = new Date(expGy, expGm - 1, day, 12, 0, 0);
            const dayKey = `${expGy}-${String(expGm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = (now.getFullYear() === expGy && now.getMonth() + 1 === expGm && now.getDate() === day);
            renderExpandedDayCell(gridEl, day, dayKey, gDate, isToday, fd);
        }
    } else if (calType === "hijri" && typeof hijriToGregorianDate === "function") {
        const firstGDate = hijriToGregorianDate(expHy, expHm, 1);
        const jsDay = firstGDate.getDay();
        const startDayIndex = (jsDay + 1) % 7;
        const totalDays = (typeof getHijriMonthLength === "function") ? getHijriMonthLength(expHy, expHm) : 30;

        for (let i = 0; i < startDayIndex; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "expanded-day-cell empty";
            gridEl.appendChild(emptyCell);
        }

        for (let day = 1; day <= totalDays; day++) {
            const gDate = hijriToGregorianDate(expHy, expHm, day);
            const dayKey = (typeof formatHijriKey === "function")
                ? formatHijriKey(expHy, expHm, day)
                : `${expHy}-${String(expHm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const hToday = (typeof getHijriParts === "function") ? getHijriParts(now) : null;
            const isToday = (hToday && hToday.hy === expHy && hToday.hm === expHm && hToday.hd === day);
            renderExpandedDayCell(gridEl, day, dayKey, gDate, isToday, fd);
        }
    }
}

function renderExpandedDayCell(gridEl, dayNumber, dayKey, gDate, isToday, fd) {
    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const remDict = dict && dict.reminder ? dict.reminder : null;

    const cell = document.createElement("div");
    cell.className = `expanded-day-cell ${isToday ? 'is-today' : ''}`;
    cell.dataset.dayKey = dayKey;

    // Get tasks matching this date
    const tasks = (typeof getTasksMatchingDayKey === "function")
        ? getTasksMatchingDayKey(dayKey)
        : [];

    const cellHeader = document.createElement("div");
    cellHeader.className = "expanded-cell-top";
    cellHeader.innerHTML = `
        <span class="expanded-day-num ${isToday ? 'today-pill' : ''}">${fd(dayNumber)}</span>
        ${tasks.length > 0 ? `<span class="expanded-task-counter">${fd(tasks.length)}</span>` : ''}
    `;
    cell.appendChild(cellHeader);

    const taskListWrap = document.createElement("div");
    taskListWrap.className = "expanded-cell-tasks-wrap";

    const MAX_VISIBLE_TASKS = 3;
    const visibleTasks = tasks.slice(0, MAX_VISIBLE_TASKS);
    const hiddenCount = tasks.length - MAX_VISIBLE_TASKS;

    visibleTasks.forEach(item => {
        const pill = document.createElement("div");
        const colorClass = item.note.colorClass || "color-0";
        const isDone = !!item.task.checked;
        const noteTitle = item.note.title || (remDict ? remDict.untitledNote : 'یادداشت');
        pill.className = `expanded-task-pill ${colorClass} ${isDone ? 'is-done' : ''}`;
        pill.title = `${noteTitle}: ${item.task.text}`;

        const jumpTitle = (remDict && remDict.jumpToNote) ? remDict.jumpToNote : 'مشاهده روی برگه';
        pill.innerHTML = `
            <div class="expanded-pill-main">
                <input type="checkbox" class="expanded-pill-check" ${isDone ? 'checked' : ''}>
                <span class="expanded-pill-text">${escapeHTML(item.task.text || 'تسک')}</span>
            </div>
            <div class="expanded-pill-actions">
                <span class="expanded-pill-note-badge" title="${escapeHTML(noteTitle)}">${escapeHTML(noteTitle)}</span>
                <button type="button" class="expanded-pill-jump-btn" title="${jumpTitle}">🔍</button>
            </div>
        `;

        const check = pill.querySelector(".expanded-pill-check");
        check.addEventListener("change", (e) => {
            e.stopPropagation();
            if (notes[item.noteIndex] && notes[item.noteIndex].tasks[item.taskIndex]) {
                notes[item.noteIndex].tasks[item.taskIndex].checked = check.checked;
                if (typeof saveNotes === "function") saveNotes();
                if (typeof syncFridgeTaskCheckbox === "function") syncFridgeTaskCheckbox(item.noteIndex, item.taskIndex, check.checked);
                if (typeof renderCalendar === "function") renderCalendar();
                if (typeof updateDeadlinePanel === "function" && typeof selectedDeadlineKey !== "undefined") {
                    updateDeadlinePanel(selectedDeadlineKey);
                }
                if (typeof updateReminderBell === "function") updateReminderBell();

                pill.classList.toggle("is-done", check.checked);
                const modal = document.getElementById("expanded-calendar-modal");
                if (modal) {
                    renderExpandedCalendarContent(modal);
                }
            }
        });

        // Pill click triggers checkbox toggle (except when clicking actions)
        pill.addEventListener("click", (e) => {
            if (e.target.tagName !== "INPUT" && !e.target.closest(".expanded-pill-actions")) {
                check.checked = !check.checked;
                check.dispatchEvent(new Event("change"));
            }
        });

        // Clicking jump button or note badge jumps directly to note on fridge
        const jumpBtn = pill.querySelector(".expanded-pill-jump-btn");
        if (jumpBtn) {
            jumpBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (typeof jumpToNoteOnFridge === "function") {
                    jumpToNoteOnFridge(item.noteIndex, item.taskIndex);
                }
            });
        }

        const noteBadge = pill.querySelector(".expanded-pill-note-badge");
        if (noteBadge) {
            noteBadge.addEventListener("click", (e) => {
                e.stopPropagation();
                if (typeof jumpToNoteOnFridge === "function") {
                    jumpToNoteOnFridge(item.noteIndex, item.taskIndex);
                }
            });
        }

        taskListWrap.appendChild(pill);
    });

    if (hiddenCount > 0) {
        const morePill = document.createElement("div");
        morePill.className = "expanded-task-more-pill";
        morePill.textContent = `+${fd(hiddenCount)} بیشتر`;
        morePill.addEventListener("click", (e) => {
            e.stopPropagation();
            showDayDeadlinesPopover(cell, tasks, dayKey);
        });
        taskListWrap.appendChild(morePill);
    }

    cell.appendChild(taskListWrap);

    // Clicking cell selects it in the regular calendar too
    cell.addEventListener("click", () => {
        if (typeof selectedDeadlineKey !== "undefined") {
            selectedDeadlineKey = dayKey;
            if (typeof updateDeadlinePanel === "function") {
                updateDeadlinePanel(dayKey);
            }
        }
    });

    gridEl.appendChild(cell);
}

function showDayDeadlinesPopover(cellEl, tasks, dayKey) {
    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const remDict = dict && dict.reminder ? dict.reminder : null;

    const existing = document.querySelector(".expanded-cal-popover");
    if (existing) existing.remove();

    const popover = document.createElement("div");
    popover.className = "expanded-cal-popover";

    let html = `
        <div class="popover-header">
            <span>ددلاین‌های این روز (${tasks.length})</span>
            <button type="button" class="popover-close-btn">✕</button>
        </div>
        <div class="popover-list">
    `;

    tasks.forEach(item => {
        const isDone = !!item.task.checked;
        const colorClass = item.note.colorClass || "color-0";
        const noteTitle = item.note.title || (remDict ? remDict.untitledNote : 'یادداشت');
        const jumpTitle = (remDict && remDict.jumpToNote) ? remDict.jumpToNote : 'مشاهده روی برگه';
        html += `
            <div class="popover-task-item ${colorClass} ${isDone ? 'is-done' : ''}" title="${escapeHTML(noteTitle)}: ${escapeHTML(item.task.text)}">
                <div class="popover-task-main">
                    <input type="checkbox" class="popover-check" ${isDone ? 'checked' : ''} data-note="${item.noteIndex}" data-task="${item.taskIndex}">
                    <span class="popover-text">${escapeHTML(item.task.text)}</span>
                </div>
                <div class="popover-actions">
                    <span class="popover-note-badge" title="${escapeHTML(noteTitle)}">${escapeHTML(noteTitle)}</span>
                    <button type="button" class="popover-jump-btn" title="${jumpTitle}">🔍</button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    popover.innerHTML = html;

    popover.querySelector(".popover-close-btn").addEventListener("click", () => popover.remove());

    popover.querySelectorAll(".popover-jump-btn, .popover-note-badge").forEach(el => {
        el.addEventListener("click", (e) => {
            e.stopPropagation();
            const parent = el.closest(".popover-task-item");
            const check = parent ? parent.querySelector(".popover-check") : null;
            if (check) {
                const nIdx = Number(check.dataset.note);
                const tIdx = Number(check.dataset.task);
                if (typeof jumpToNoteOnFridge === "function") {
                    jumpToNoteOnFridge(nIdx, tIdx);
                }
            }
        });
    });

    popover.querySelectorAll(".popover-check").forEach(chk => {
        chk.addEventListener("change", (e) => {
            const nIdx = Number(e.target.dataset.note);
            const tIdx = Number(e.target.dataset.task);
            if (notes[nIdx] && notes[nIdx].tasks[tIdx]) {
                notes[nIdx].tasks[tIdx].checked = e.target.checked;
                if (typeof saveNotes === "function") saveNotes();
                if (typeof syncFridgeTaskCheckbox === "function") syncFridgeTaskCheckbox(nIdx, tIdx, e.target.checked);
                if (typeof renderCalendar === "function") renderCalendar();
                if (typeof updateDeadlinePanel === "function") updateDeadlinePanel(dayKey);
                if (typeof updateReminderBell === "function") updateReminderBell();

                // Re-render expanded grid
                const modal = document.getElementById("expanded-calendar-modal");
                if (modal) {
                    renderExpandedGridDays(modal.querySelector("#expanded-cal-days-grid"), currentCalendarType);
                }
            }
        });
    });

    cellEl.appendChild(popover);
}

// ----------------------
//   INITIALIZATION
// ----------------------

function initExpandedCalendarUI() {
    const expandBtn = document.getElementById("btn-expand-calendar");
    if (expandBtn) {
        expandBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openExpandedCalendar();
        });
    }

    // Escape key closes expanded calendar or reminder modal
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (isExpandedCalendarOpen) {
                closeExpandedCalendar();
            } else if (document.getElementById("reminder-modal") && !document.getElementById("reminder-modal").classList.contains("hidden")) {
                if (typeof closeReminderModal === "function") closeReminderModal();
            }
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initExpandedCalendarUI);
} else {
    initExpandedCalendarUI();
}

window.openExpandedCalendar = openExpandedCalendar;
window.closeExpandedCalendar = closeExpandedCalendar;
