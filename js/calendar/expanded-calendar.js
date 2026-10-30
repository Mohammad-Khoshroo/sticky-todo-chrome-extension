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
let draggedCalendarDeadline = null;
let isDraggingCalendarItem = false;
let schedulingTaskInfo = null; // { noteIndex, taskIndex }

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
    modal.classList.add("is-opening");
    setTimeout(() => {
        modal.classList.remove("is-opening");
    }, 290);
    document.body.classList.add("modal-open");
}

function closeExpandedCalendar(immediate = false) {
    schedulingTaskInfo = null;
    const schedBar = document.getElementById("exp-scheduling-bar");
    if (schedBar) {
        schedBar.style.display = "none";
        schedBar.innerHTML = "";
    }
    const modal = document.getElementById("expanded-calendar-modal");
    if (!modal) return;

    if (immediate) {
        modal.classList.add("hidden");
        modal.classList.remove("is-closing", "is-opening");
        isExpandedCalendarOpen = false;
        document.body.classList.remove("modal-open");
        return;
    }

    modal.classList.add("is-closing");
    setTimeout(() => {
        if (modal.classList.contains("is-closing")) {
            modal.classList.add("hidden");
            modal.classList.remove("is-closing", "is-opening");
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
            <div class="exp-overdue-card ${colorClass}" draggable="true" data-note="${item.noteIndex}" data-task="${item.taskIndex}">
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

function ensureExpandedCalendarSkeleton(modal) {
    if (modal.querySelector(".expanded-cal-container")) return;

    modal.innerHTML = `
        <div class="expanded-cal-backdrop" id="expanded-cal-backdrop"></div>
        <div class="expanded-cal-container">
            <!-- Header -->
            <div class="expanded-cal-header">
                <div class="expanded-cal-header-left">
                    <button type="button" class="expanded-cal-nav-btn" id="exp-prev-btn" title="ماه قبل">❮</button>
                    <h2 class="expanded-cal-month-title"></h2>
                    <button type="button" class="expanded-cal-nav-btn" id="exp-next-btn" title="ماه بعد">❯</button>
                    <button type="button" class="expanded-cal-today-btn" id="exp-today-btn">امروز</button>
                </div>
                <div class="expanded-cal-header-right">
                    <button type="button" class="expanded-cal-type-btn" id="exp-type-btn" title="تغییر نوع تقویم">
                        <span>🌐</span>
                        <span class="exp-type-badge">شمسی</span>
                    </button>
                    <button type="button" class="close-expanded-cal-btn" id="btn-close-expanded-cal" title="بستن">✕</button>
                </div>
            </div>

            <!-- Task Scheduling Banner (Active when setting deadline for a specific task) -->
            <div class="expanded-scheduling-bar" id="exp-scheduling-bar" style="display: none;"></div>

            <!-- Overdue Tasks Accordion Banner -->
            <div class="expanded-overdue-banner" id="exp-overdue-banner" style="display: none;">
                <div class="expanded-overdue-header" id="exp-overdue-toggle">
                    <div class="expanded-overdue-title">
                        <span class="overdue-warning-icon">⚠️</span>
                        <span class="overdue-title-text"></span>
                    </div>
                    <button type="button" class="expanded-overdue-toggle-btn">
                        <span>مشاهده کارهای عقب افتاده</span>
                        <span>▼</span>
                    </button>
                </div>
                <div class="expanded-overdue-body"></div>
            </div>

            <!-- Weekdays Row -->
            <div class="expanded-cal-weekdays"></div>

            <!-- Days Grid -->
            <div class="expanded-cal-days-grid" id="expanded-cal-days-grid"></div>
        </div>
    `;

    // Static event listeners
    modal.querySelector("#expanded-cal-backdrop").addEventListener("click", () => closeExpandedCalendar());
    modal.querySelector("#btn-close-expanded-cal").addEventListener("click", () => closeExpandedCalendar());

    const prevBtn = modal.querySelector("#exp-prev-btn");
    const nextBtn = modal.querySelector("#exp-next-btn");
    prevBtn.addEventListener("click", () => changeExpandedMonth(-1));
    nextBtn.addEventListener("click", () => changeExpandedMonth(1));

    let monthNavTimer = null;
    [prevBtn, nextBtn].forEach(btn => {
        const delta = (btn === prevBtn) ? -1 : 1;
        btn.addEventListener("dragover", (e) => {
            if (!draggedCalendarDeadline) return;
            e.preventDefault();
            if (!monthNavTimer) {
                monthNavTimer = setTimeout(() => {
                    changeExpandedMonth(delta);
                    monthNavTimer = null;
                }, 550);
            }
        });
        btn.addEventListener("dragleave", () => {
            if (monthNavTimer) {
                clearTimeout(monthNavTimer);
                monthNavTimer = null;
            }
        });
    });

    modal.querySelector("#exp-today-btn").addEventListener("click", () => {
        const now = new Date();
        const calType = typeof currentCalendarType !== "undefined" ? currentCalendarType : "jalali";
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
}

function updateExpandedOverdueBanner(modal, overdueList, fd, remDict) {
    if (!modal) modal = document.getElementById("expanded-calendar-modal");
    if (!modal) return;

    if (!overdueList) {
        const dlData = (typeof getThreeWeekDeadlines === "function") ? getThreeWeekDeadlines() : null;
        overdueList = dlData ? dlData.overdue.filter(x => !x.isChecked) : [];
    }
    if (!fd) {
        fd = (typeof toFarsiNumber === "function" && (currentLanguage === "fa" || currentLanguage === "ar"))
            ? toFarsiNumber
            : (x => x);
    }
    if (!remDict) {
        const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
            ? TRANSLATIONS[currentLanguage]
            : null;
        remDict = dict && dict.reminder ? dict.reminder : null;
    }

    const banner = modal.querySelector(".expanded-overdue-banner");
    if (!banner) return;

    const count = overdueList.length;
    if (count === 0) {
        banner.style.display = "none";
        banner.classList.remove("is-open");
        isOverdueDrawerOpen = false;
        return;
    }

    banner.style.display = "";
    banner.classList.toggle("is-open", isOverdueDrawerOpen);

    const titleTextEl = banner.querySelector(".overdue-title-text");
    if (titleTextEl) {
        titleTextEl.textContent = `${fd(count)} ${remDict ? remDict.kpiOverdue : 'کار عقب افتاده'} نیاز به رسیدگی دارند`;
    }

    const toggleBtn = banner.querySelector(".expanded-overdue-toggle-btn");
    if (toggleBtn) {
        toggleBtn.innerHTML = `<span>${isOverdueDrawerOpen ? 'بستن' : 'مشاهده کارهای عقب افتاده'}</span> <span>${isOverdueDrawerOpen ? '▲' : '▼'}</span>`;
    }

    const bodyEl = banner.querySelector(".expanded-overdue-body");
    if (bodyEl) {
        bodyEl.innerHTML = renderOverdueTasksCards(overdueList, fd, remDict);
        bindOverdueCardsEvents(bodyEl);
    }
}

function bindOverdueCardsEvents(container) {
    if (!container) return;

    container.querySelectorAll(".exp-overdue-check").forEach(chk => {
        chk.addEventListener("change", (e) => {
            e.stopPropagation();
            const nIdx = Number(e.target.dataset.note);
            const tIdx = Number(e.target.dataset.task);
            if (notes[nIdx] && notes[nIdx].tasks[tIdx]) {
                notes[nIdx].tasks[tIdx].checked = e.target.checked;
                if (window.SoundEngine) SoundEngine.check(e.target.checked);
                if (typeof saveNotes === "function") saveNotes();
                if (typeof syncFridgeTaskCheckbox === "function") syncFridgeTaskCheckbox(nIdx, tIdx, e.target.checked);
                if (typeof renderCalendar === "function") renderCalendar();
                if (typeof updateDeadlinePanel === "function" && typeof selectedDeadlineKey !== "undefined") {
                    updateDeadlinePanel(selectedDeadlineKey);
                }
                if (typeof updateReminderBell === "function") updateReminderBell();

                const dl = notes[nIdx].tasks[tIdx].deadline;
                updateExpandedOverdueBanner();
                if (dl) refreshExpandedDayCell(dl);
            }
        });
    });

    container.querySelectorAll(".exp-overdue-jump-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const nIdx = Number(btn.dataset.note);
            const tIdx = Number(btn.dataset.task);
            if (typeof jumpToNoteOnFridge === "function") {
                jumpToNoteOnFridge(nIdx, tIdx);
            }
        });
    });

    container.querySelectorAll(".exp-overdue-card").forEach(card => {
        card.addEventListener("dragstart", (e) => {
            if (e.target.closest("input, button, .exp-overdue-jump-btn")) {
                e.preventDefault();
                return;
            }
            isDraggingCalendarItem = true;
            const nIdx = Number(card.dataset.note);
            const tIdx = Number(card.dataset.task);
            draggedCalendarDeadline = {
                noteIndex: nIdx,
                taskIndex: tIdx,
                sourceDayKey: null
            };
            e.dataTransfer.setData("text/plain", JSON.stringify(draggedCalendarDeadline));
            e.dataTransfer.effectAllowed = "move";
            card.classList.add("is-dragging");
        });
        card.addEventListener("dragend", () => {
            card.classList.remove("is-dragging");
            document.querySelectorAll(".expanded-day-cell.drag-over").forEach(c => c.classList.remove("drag-over"));
            draggedCalendarDeadline = null;
            setTimeout(() => { isDraggingCalendarItem = false; }, 60);
        });
    });
}

function renderExpandedCalendarContent(modal) {
    if (!modal) modal = document.getElementById("expanded-calendar-modal");
    if (!modal) return;

    ensureExpandedCalendarSkeleton(modal);

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

    let monthTitle = "";
    if (calType === "jalali") {
        const mNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
        const mName = (dict && dict.months && dict.months.jalali) ? dict.months.jalali[expJm - 1] : mNames[expJm - 1];
        monthTitle = `${mName} ${fd(expJy)}`;
    } else if (calType === "gregorian") {
        const mNames = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];
        const mName = (dict && dict.months && dict.months.gregorian) ? dict.months.gregorian[expGm - 1] : mNames[expGm - 1];
        monthTitle = `${mName} ${fd(expGy)}`;
    } else if (calType === "hijri") {
        const hNames = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
        const mName = (dict && dict.months && dict.months.hijri) ? dict.months.hijri[expHm - 1] : hNames[expHm - 1];
        monthTitle = `${mName} ${fd(expHy)}`;
    }

    const typeBadgeText = (dict && dict.calendarNames && dict.calendarNames[calType])
        ? dict.calendarNames[calType]
        : ((calType === "jalali") ? "شمسی" : (calType === "gregorian" ? "میلادی" : "قمری"));

    // Update dynamic header elements
    const titleEl = modal.querySelector(".expanded-cal-month-title");
    if (titleEl) titleEl.textContent = monthTitle;

    const todayBtn = modal.querySelector("#exp-today-btn");
    if (todayBtn) todayBtn.textContent = expDict ? expDict.today : 'امروز';

    const typeBadge = modal.querySelector(".exp-type-badge");
    if (typeBadge) typeBadge.textContent = typeBadgeText;

    // Update Overdue banner
    updateExpandedOverdueBanner(modal, overdueList, fd, remDict);

    // Update Weekdays
    const weekdaysEl = modal.querySelector(".expanded-cal-weekdays");
    if (weekdaysEl) weekdaysEl.innerHTML = renderExpandedWeekdays(calType);

    // Update Days Grid
    const gridEl = modal.querySelector("#expanded-cal-days-grid");
    if (gridEl) renderExpandedGridDays(gridEl, calType);

    // Update task scheduling bar if in scheduling mode
    updateSchedulingBar(modal);
}

function renderExpandedWeekdays(calType) {
    const isLtr = document.documentElement.getAttribute("dir") !== "rtl";
    let days;

    if (!isLtr) {
        days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
    } else {
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
            const dayKey = (typeof formatGregorianKey === "function")
                ? formatGregorianKey(expGy, expGm, day)
                : `${expGy}-${String(expGm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const isToday = (now.getFullYear() === expGy && (now.getMonth() + 1) === expGm && now.getDate() === day);
            renderExpandedDayCell(gridEl, day, dayKey, gDate, isToday, fd);
        }
    } else if (calType === "hijri") {
        const hFirst = hijriToGregorianDate(expHy, expHm, 1);
        const jsDay = hFirst.getDay();
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

function populateDayCellContent(cell, dayNumber, dayKey, gDate, isToday, fd) {
    if (!fd) {
        fd = (typeof toFarsiNumber === "function" && (currentLanguage === "fa" || currentLanguage === "ar"))
            ? toFarsiNumber
            : (x => x);
    }
    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const remDict = dict && dict.reminder ? dict.reminder : null;

    cell.dataset.dayKey = dayKey;
    cell.dataset.dayNumber = dayNumber;
    cell.dataset.isToday = isToday ? "1" : "0";
    cell.className = `expanded-day-cell ${isToday ? 'is-today' : ''}`;
    cell.innerHTML = "";

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
        pill.draggable = true;
        pill.dataset.noteIndex = item.noteIndex;
        pill.dataset.taskIndex = item.taskIndex;
        pill.dataset.dayKey = dayKey;

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

        let isDraggingThisPill = false;
        pill.addEventListener("dragstart", (e) => {
            if (e.target.closest("input, button, .expanded-pill-jump-btn, .expanded-pill-note-badge")) {
                e.preventDefault();
                return;
            }
            isDraggingThisPill = true;
            isDraggingCalendarItem = true;
            draggedCalendarDeadline = {
                noteIndex: item.noteIndex,
                taskIndex: item.taskIndex,
                sourceDayKey: dayKey
            };
            e.dataTransfer.setData("text/plain", JSON.stringify(draggedCalendarDeadline));
            e.dataTransfer.effectAllowed = "move";
            pill.classList.add("is-dragging");
        });

        pill.addEventListener("dragend", () => {
            pill.classList.remove("is-dragging");
            document.querySelectorAll(".expanded-day-cell.drag-over").forEach(c => c.classList.remove("drag-over"));
            draggedCalendarDeadline = null;
            setTimeout(() => {
                isDraggingThisPill = false;
                isDraggingCalendarItem = false;
            }, 60);
        });

        const check = pill.querySelector(".expanded-pill-check");
        check.addEventListener("change", (e) => {
            e.stopPropagation();
            if (notes[item.noteIndex] && notes[item.noteIndex].tasks[item.taskIndex]) {
                notes[item.noteIndex].tasks[item.taskIndex].checked = check.checked;
                if (window.SoundEngine) SoundEngine.check(check.checked);
                if (typeof saveNotes === "function") saveNotes();
                if (typeof syncFridgeTaskCheckbox === "function") syncFridgeTaskCheckbox(item.noteIndex, item.taskIndex, check.checked);
                if (typeof renderCalendar === "function") renderCalendar();
                if (typeof updateDeadlinePanel === "function" && typeof selectedDeadlineKey !== "undefined") {
                    updateDeadlinePanel(selectedDeadlineKey);
                }
                if (typeof updateReminderBell === "function") updateReminderBell();

                pill.classList.toggle("is-done", check.checked);
                updateExpandedOverdueBanner();
            }
        });

        // Pill click triggers checkbox toggle (except when dragging or clicking actions)
        pill.addEventListener("click", (e) => {
            if (isDraggingThisPill || isDraggingCalendarItem) return;
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
}

function renderExpandedDayCell(gridEl, dayNumber, dayKey, gDate, isToday, fd) {
    const cell = document.createElement("div");
    populateDayCellContent(cell, dayNumber, dayKey, gDate, isToday, fd);

    // Drag and Drop listeners on day cell
    cell.addEventListener("dragover", (e) => {
        if (!draggedCalendarDeadline) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        cell.classList.add("drag-over");
    });

    cell.addEventListener("dragleave", (e) => {
        if (!cell.contains(e.relatedTarget)) {
            cell.classList.remove("drag-over");
        }
    });

    cell.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        cell.classList.remove("drag-over");
        if (!draggedCalendarDeadline) return;

        const { noteIndex, taskIndex, sourceDayKey } = draggedCalendarDeadline;
        draggedCalendarDeadline = null;

        const targetDayKey = cell.dataset.dayKey;
        if (!targetDayKey) return;

        const targetParsed = (typeof parseAnyDeadlineKey === "function") ? parseAnyDeadlineKey(targetDayKey) : null;
        if (!targetParsed) return;

        if (sourceDayKey) {
            const sourceParsed = (typeof parseAnyDeadlineKey === "function") ? parseAnyDeadlineKey(sourceDayKey) : null;
            if (sourceParsed && sourceParsed.jKey === targetParsed.jKey) {
                return; // Dropped on the same date, no update needed
            }
        }

        const note = (typeof notes !== "undefined" && notes[noteIndex]) ? notes[noteIndex] : null;
        if (!note || !note.tasks || !note.tasks[taskIndex]) return;

        // Set deadline to canonical target Jalali key
        note.tasks[taskIndex].deadline = targetParsed.jKey;

        if (typeof saveNotes === "function") saveNotes();
        if (typeof refreshSingleNoteOnFridge === "function") refreshSingleNoteOnFridge(note);
        if (typeof renderCalendar === "function") renderCalendar();
        if (typeof updateDeadlinePanel === "function" && typeof selectedDeadlineKey !== "undefined") {
            updateDeadlinePanel(selectedDeadlineKey);
        }
        if (typeof updateReminderBell === "function") updateReminderBell();

        if (window.SoundEngine) SoundEngine.stick();
        cell.classList.add("cell-drop-success");
        setTimeout(() => cell.classList.remove("cell-drop-success"), 600);

        // Remove any open popover
        const pop = document.querySelector(".expanded-cal-popover");
        if (pop) pop.remove();

        // Seamless in-place drop update
        handleCalendarDropUpdate(sourceDayKey, targetDayKey);
        if (typeof updateSchedulingBar === "function") updateSchedulingBar();
    });

    // Clicking cell assigns deadline if in scheduling mode, or selects it in calendar
    cell.addEventListener("click", () => {
        if (schedulingTaskInfo) {
            const { noteIndex, taskIndex } = schedulingTaskInfo;
            const note = (typeof notes !== "undefined" && notes[noteIndex]) ? notes[noteIndex] : null;
            const task = (note && note.tasks) ? note.tasks[taskIndex] : null;
            if (note && task) {
                const targetParsed = (typeof parseAnyDeadlineKey === "function") ? parseAnyDeadlineKey(dayKey) : null;
                if (targetParsed) {
                    const oldDeadline = task.deadline;
                    if (oldDeadline !== targetParsed.jKey) {
                        task.deadline = targetParsed.jKey;
                        if (typeof saveNotes === "function") saveNotes();
                        if (typeof refreshSingleNoteOnFridge === "function") refreshSingleNoteOnFridge(note);
                        if (typeof renderCalendar === "function") renderCalendar();
                        if (typeof updateDeadlinePanel === "function" && typeof selectedDeadlineKey !== "undefined") {
                            updateDeadlinePanel(selectedDeadlineKey);
                        }
                        if (typeof updateReminderBell === "function") updateReminderBell();

                        if (window.SoundEngine) SoundEngine.stick();
                        cell.classList.add("cell-drop-success");
                        setTimeout(() => cell.classList.remove("cell-drop-success"), 600);

                        handleCalendarDropUpdate(oldDeadline, dayKey);
                        if (typeof updateSchedulingBar === "function") updateSchedulingBar();
                        return;
                    }
                }
            }
        }

        if (typeof selectedDeadlineKey !== "undefined") {
            selectedDeadlineKey = dayKey;
            if (typeof updateDeadlinePanel === "function") {
                updateDeadlinePanel(dayKey);
            }
        }
    });

    gridEl.appendChild(cell);
}

function refreshExpandedDayCell(dayKey) {
    if (!dayKey) return false;
    const modal = document.getElementById("expanded-calendar-modal");
    if (!modal) return false;

    const parsed = (typeof parseAnyDeadlineKey === "function") ? parseAnyDeadlineKey(dayKey) : null;
    let cell = modal.querySelector(`.expanded-day-cell[data-day-key="${dayKey}"]`);
    if (!cell && parsed) {
        cell = modal.querySelector(`.expanded-day-cell[data-day-key="${parsed.jKey}"]`)
            || modal.querySelector(`.expanded-day-cell[data-day-key="${parsed.gKey}"]`)
            || modal.querySelector(`.expanded-day-cell[data-day-key="${parsed.hKey}"]`);
    }
    if (!cell) return false;

    const dayNumber = Number(cell.dataset.dayNumber || 1);
    const isToday = cell.dataset.isToday === "1";
    const actualDayKey = cell.dataset.dayKey || dayKey;
    populateDayCellContent(cell, dayNumber, actualDayKey, null, isToday);
    return true;
}

function handleCalendarDropUpdate(sourceDayKey, targetDayKey) {
    const modal = document.getElementById("expanded-calendar-modal");
    if (!modal) return;

    if (!sourceDayKey) {
        updateExpandedOverdueBanner(modal);
    } else {
        refreshExpandedDayCell(sourceDayKey);
    }

    const targetRefreshed = refreshExpandedDayCell(targetDayKey);
    if (!targetRefreshed) {
        const calType = typeof currentCalendarType !== "undefined" ? currentCalendarType : "jalali";
        const grid = modal.querySelector("#expanded-cal-days-grid");
        if (grid) renderExpandedGridDays(grid, calType);
    }
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

    popover.innerHTML = `
        <div class="popover-arrow"></div>
        <div class="popover-header">
            <span class="popover-title">${escapeHTML(cellEl.querySelector('.expanded-day-num').textContent)}</span>
            <button type="button" class="popover-close-btn">✕</button>
        </div>
        <div class="popover-list">
            ${tasks.map(item => {
                const isDone = !!item.task.checked;
                const colorClass = item.note.colorClass || 'color-0';
                const noteTitle = item.note.title || (remDict ? remDict.untitledNote : 'یادداشت');
                return `
                    <div class="popover-task-item ${colorClass} ${isDone ? 'is-done' : ''}" draggable="true" data-note="${item.noteIndex}" data-task="${item.taskIndex}" data-day="${dayKey}">
                        <label class="popover-label">
                            <input type="checkbox" class="popover-check" data-note="${item.noteIndex}" data-task="${item.taskIndex}" ${isDone ? 'checked' : ''}>
                            <span class="popover-text">${escapeHTML(item.task.text || 'تسک')}</span>
                        </label>
                        <div class="popover-actions">
                            <span class="popover-note-badge">${escapeHTML(noteTitle)}</span>
                            <button type="button" class="popover-jump-btn" data-note="${item.noteIndex}" data-task="${item.taskIndex}" title="${remDict ? remDict.jumpToNote : 'مشاهده روی برگه'}">🔍</button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    popover.querySelector(".popover-close-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        popover.remove();
    });

    const closeHandler = (e) => {
        if (!popover.contains(e.target) && !cellEl.contains(e.target)) {
            popover.remove();
            document.removeEventListener("click", closeHandler);
        }
    };
    setTimeout(() => {
        document.addEventListener("click", closeHandler);
    }, 10);

    popover.querySelectorAll(".popover-jump-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const nIdx = Number(btn.dataset.note);
            const tIdx = Number(btn.dataset.task);
            if (typeof jumpToNoteOnFridge === "function") {
                jumpToNoteOnFridge(nIdx, tIdx);
            }
        });
    });

    popover.querySelectorAll(".popover-task-item").forEach(itemEl => {
        itemEl.addEventListener("click", (e) => {
            if (isDraggingCalendarItem) return;
            if (e.target.tagName !== "INPUT" && !e.target.closest(".popover-actions")) {
                const check = itemEl.querySelector(".popover-check");
                if (check) {
                    check.checked = !check.checked;
                    check.dispatchEvent(new Event("change"));
                }
            }
        });

        const badge = itemEl.querySelector(".popover-note-badge");
        if (badge) {
            badge.addEventListener("click", (e) => {
                e.stopPropagation();
                const check = itemEl.querySelector(".popover-check");
                if (check) {
                    const nIdx = Number(check.dataset.note);
                    const tIdx = Number(check.dataset.task);
                    if (typeof jumpToNoteOnFridge === "function") {
                        jumpToNoteOnFridge(nIdx, tIdx);
                    }
                }
            });
        }
    });

    popover.querySelectorAll(".popover-task-item").forEach(itemEl => {
        itemEl.addEventListener("dragstart", (e) => {
            if (e.target.closest("input, button, .popover-jump-btn, .popover-note-badge")) {
                e.preventDefault();
                return;
            }
            isDraggingCalendarItem = true;
            const nIdx = Number(itemEl.dataset.note);
            const tIdx = Number(itemEl.dataset.task);
            const dKey = itemEl.dataset.day;
            draggedCalendarDeadline = {
                noteIndex: nIdx,
                taskIndex: tIdx,
                sourceDayKey: dKey
            };
            e.dataTransfer.setData("text/plain", JSON.stringify(draggedCalendarDeadline));
            e.dataTransfer.effectAllowed = "move";
            itemEl.classList.add("is-dragging");
        });
        itemEl.addEventListener("dragend", () => {
            itemEl.classList.remove("is-dragging");
            document.querySelectorAll(".expanded-day-cell.drag-over").forEach(c => c.classList.remove("drag-over"));
            draggedCalendarDeadline = null;
            setTimeout(() => { isDraggingCalendarItem = false; }, 60);
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

                refreshExpandedDayCell(dayKey);
                updateExpandedOverdueBanner();
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
window.renderExpandedCalendarContent = renderExpandedCalendarContent;
window.refreshExpandedDayCell = refreshExpandedDayCell;

//////////////////////////////////////////////////////////////////
// ---------------------------------------------------------------
//   TASK DEADLINE DRAG & DROP SCHEDULING SYSTEM
// ---------------------------------------------------------------
//////////////////////////////////////////////////////////////////

function openExpandedCalendarForTask(noteIndex, taskIndex) {
    const note = (typeof notes !== "undefined" && notes[noteIndex]) ? notes[noteIndex] : null;
    if (!note || !note.tasks || !note.tasks[taskIndex]) return;

    schedulingTaskInfo = { noteIndex, taskIndex };
    const task = note.tasks[taskIndex];

    // If task already has a deadline, open the calendar on that deadline's month!
    if (task.deadline && typeof parseAnyDeadlineKey === "function") {
        const parsed = parseAnyDeadlineKey(task.deadline);
        if (parsed) {
            const calType = (typeof currentCalendarType !== "undefined") ? currentCalendarType : "jalali";
            if (calType === "gregorian") {
                expGy = parsed.gDate.getFullYear();
                expGm = parsed.gDate.getMonth() + 1;
            } else if (calType === "hijri") {
                expHy = parsed.h ? parsed.h.hy : (parsed.hYear || expHy);
                expHm = parsed.h ? parsed.h.hm : (parsed.hMonth || expHm);
            } else {
                expJy = parsed.j ? parsed.j.jy : (parsed.jYear || expJy);
                expJm = parsed.j ? parsed.j.jm : (parsed.jMonth || expJm);
            }
        } else {
            initExpandedCalendarState();
        }
    } else {
        initExpandedCalendarState();
    }

    openExpandedCalendar();
    updateSchedulingBar();
}
window.openExpandedCalendarForTask = openExpandedCalendarForTask;

function updateSchedulingBar(modal) {
    if (!modal) modal = document.getElementById("expanded-calendar-modal");
    if (!modal) return;
    const bar = modal.querySelector("#exp-scheduling-bar");
    if (!bar) return;

    if (!schedulingTaskInfo) {
        bar.style.display = "none";
        bar.innerHTML = "";
        return;
    }

    const { noteIndex, taskIndex } = schedulingTaskInfo;
    const note = (typeof notes !== "undefined" && notes[noteIndex]) ? notes[noteIndex] : null;
    const task = (note && note.tasks) ? note.tasks[taskIndex] : null;

    if (!note || !task) {
        schedulingTaskInfo = null;
        bar.style.display = "none";
        bar.innerHTML = "";
        return;
    }

    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage]) ? TRANSLATIONS[currentLanguage] : null;
    const remDict = dict && dict.reminder ? dict.reminder : null;
    const expDict = dict && dict.expandedCal ? dict.expandedCal : null;
    const fd = (typeof toFarsiNumber === "function" && (currentLanguage === "fa" || currentLanguage === "ar"))
        ? toFarsiNumber
        : (x => x);

    const noteTitle = note.title || (remDict ? remDict.untitledNote : 'یادداشت');
    const colorClass = note.colorClass || 'color-0';
    const taskText = task.text || (expDict && expDict.taskFallback ? expDict.taskFallback : 'تسک بدون عنوان');

    let deadlineBadgeText = "";
    let hasDeadline = false;
    if (task.deadline) {
        hasDeadline = true;
        const parsed = (typeof parseAnyDeadlineKey === "function") ? parseAnyDeadlineKey(task.deadline) : null;
        if (parsed) {
            const calType = typeof currentCalendarType !== "undefined" ? currentCalendarType : "jalali";
            let mName = "";
            let dNum = parsed.jDay;
            if (calType === "gregorian") {
                mName = dict && dict.months && dict.months.gregorian ? dict.months.gregorian[parsed.gDate.getMonth()] : `Month ${parsed.gDate.getMonth() + 1}`;
                dNum = parsed.gDate.getDate();
            } else if (calType === "hijri") {
                const hm = parsed.h ? parsed.h.hm : parsed.hMonth;
                const hd = parsed.h ? parsed.h.hd : parsed.hDay;
                mName = dict && dict.months && dict.months.hijri ? dict.months.hijri[hm - 1] : `ماه ${hm}`;
                dNum = hd;
            } else {
                const jm = parsed.j ? parsed.j.jm : parsed.jMonth;
                const jd = parsed.j ? parsed.j.jd : parsed.jDay;
                mName = dict && dict.months && dict.months.jalali ? dict.months.jalali[jm - 1] : `ماه ${jm}`;
                dNum = jd;
            }
            const dateStr = `${fd(dNum)} ${mName}`;
            deadlineBadgeText = (expDict && expDict.schedulingCurrentDeadline ? expDict.schedulingCurrentDeadline : "ددلاین:") + " " + dateStr;
        } else {
            deadlineBadgeText = task.deadline;
        }
    } else {
        deadlineBadgeText = expDict && expDict.schedulingNoDeadline ? expDict.schedulingNoDeadline : "بدون ددلاین";
    }

    const titleMsg = expDict && expDict.schedulingTitle ? expDict.schedulingTitle : "تنظیم ددلاین برای:";
    const dragHint = expDict && expDict.schedulingDragHint ? expDict.schedulingDragHint : "این تسک را بکشید و روی روز مورد نظر در تقویم رها کنید (یا روی هر روز کلیک کنید)";
    const clearBtnText = expDict && expDict.schedulingClear ? expDict.schedulingClear : "حذف ددلاین";
    const doneBtnText = expDict && expDict.schedulingDone ? expDict.schedulingDone : "تأیید و بازگشت";

    bar.style.display = "flex";
    bar.innerHTML = `
        <div class="exp-scheduling-left">
            <div class="exp-scheduling-instruction">
                <div class="exp-scheduling-title-row">
                    <span>📌</span>
                    <span>${titleMsg}</span>
                    <span class="exp-scheduling-note-name">(${escapeHTML(noteTitle)})</span>
                </div>
                <div class="exp-scheduling-subhint">${dragHint}</div>
            </div>

            <div class="exp-scheduling-task-card ${colorClass}" id="exp-scheduling-drag-card" draggable="true" title="برای جابجایی بکشید">
                <span class="exp-scheduling-drag-grip">⠿</span>
                <span class="exp-scheduling-task-text">${escapeHTML(taskText)}</span>
                <span class="exp-scheduling-deadline-tag ${hasDeadline ? 'has-deadline' : ''}">${deadlineBadgeText}</span>
            </div>
        </div>

        <div class="exp-scheduling-right">
            ${hasDeadline ? `<button type="button" class="btn-exp-sched-clear" id="btn-exp-sched-clear">${clearBtnText}</button>` : ''}
            <button type="button" class="btn-exp-sched-done" id="btn-exp-sched-done">${doneBtnText}</button>
        </div>
    `;

    // Draggable card listeners
    const dragCard = bar.querySelector("#exp-scheduling-drag-card");
    if (dragCard) {
        dragCard.addEventListener("dragstart", (e) => {
            isDraggingCalendarItem = true;
            draggedCalendarDeadline = {
                noteIndex,
                taskIndex,
                sourceDayKey: task.deadline || null,
                isFromSchedulingBar: true
            };
            e.dataTransfer.setData("text/plain", JSON.stringify(draggedCalendarDeadline));
            e.dataTransfer.effectAllowed = "move";
            dragCard.classList.add("is-dragging");
        });

        dragCard.addEventListener("dragend", () => {
            dragCard.classList.remove("is-dragging");
            document.querySelectorAll(".expanded-day-cell.drag-over").forEach(c => c.classList.remove("drag-over"));
            draggedCalendarDeadline = null;
            setTimeout(() => {
                isDraggingCalendarItem = false;
            }, 60);
        });
    }

    // Action listeners
    const clearBtn = bar.querySelector("#btn-exp-sched-clear");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (task.deadline) {
                const oldKey = task.deadline;
                task.deadline = null;
                if (window.SoundEngine) SoundEngine.erase();
                if (typeof saveNotes === "function") saveNotes();
                if (typeof refreshSingleNoteOnFridge === "function") refreshSingleNoteOnFridge(note);
                if (typeof renderCalendar === "function") renderCalendar();
                if (typeof updateDeadlinePanel === "function" && typeof selectedDeadlineKey !== "undefined") {
                    updateDeadlinePanel(selectedDeadlineKey);
                }
                if (typeof updateReminderBell === "function") updateReminderBell();
                handleCalendarDropUpdate(oldKey, null);
                updateSchedulingBar();
            }
        });
    }

    const doneBtn = bar.querySelector("#btn-exp-sched-done");
    if (doneBtn) {
        doneBtn.addEventListener("click", () => {
            closeExpandedCalendar();
        });
    }
}
window.updateSchedulingBar = updateSchedulingBar;
