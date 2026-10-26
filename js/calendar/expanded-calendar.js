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
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
}

function closeExpandedCalendar() {
    const modal = document.getElementById("expanded-calendar-modal");
    if (modal) {
        modal.classList.add("hidden");
    }
    isExpandedCalendarOpen = false;
    document.body.classList.remove("modal-open");
}

function renderExpandedCalendarContent(modal) {
    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const expDict = dict && dict.expandedCal ? dict.expandedCal : null;
    const fd = (typeof toFarsiNumber === "function" && (currentLanguage === "fa" || currentLanguage === "ar"))
        ? toFarsiNumber
        : (x => x);

    const calType = typeof currentCalendarType !== "undefined" ? currentCalendarType : "jalali";

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
        pill.className = `expanded-task-pill ${colorClass} ${isDone ? 'is-done' : ''}`;
        pill.title = `${item.note.title ? item.note.title + ': ' : ''}${item.task.text}`;

        pill.innerHTML = `
            <input type="checkbox" class="expanded-pill-check" ${isDone ? 'checked' : ''}>
            <span class="expanded-pill-text">${escapeHTML(item.task.text || 'تسک')}</span>
        `;

        const check = pill.querySelector(".expanded-pill-check");
        check.addEventListener("change", (e) => {
            e.stopPropagation();
            if (notes[item.noteIndex] && notes[item.noteIndex].tasks[item.taskIndex]) {
                notes[item.noteIndex].tasks[item.taskIndex].checked = check.checked;
                if (typeof saveNotes === "function") saveNotes();
                if (typeof renderAllNotes === "function") renderAllNotes();
                if (typeof renderCalendar === "function") renderCalendar();
                if (typeof updateDeadlinePanel === "function" && typeof selectedDeadlineKey !== "undefined") {
                    updateDeadlinePanel(selectedDeadlineKey);
                }
                if (typeof updateReminderBell === "function") updateReminderBell();

                pill.classList.toggle("is-done", check.checked);
            }
        });

        // Pill click triggers checkbox toggle
        pill.addEventListener("click", (e) => {
            if (e.target.tagName !== "INPUT") {
                check.checked = !check.checked;
                check.dispatchEvent(new Event("change"));
            }
        });

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
        html += `
            <div class="popover-task-item ${colorClass} ${isDone ? 'is-done' : ''}">
                <input type="checkbox" class="popover-check" ${isDone ? 'checked' : ''} data-note="${item.noteIndex}" data-task="${item.taskIndex}">
                <span class="popover-text">${escapeHTML(item.task.text)}</span>
            </div>
        `;
    });

    html += `</div>`;
    popover.innerHTML = html;

    popover.querySelector(".popover-close-btn").addEventListener("click", () => popover.remove());

    popover.querySelectorAll(".popover-check").forEach(chk => {
        chk.addEventListener("change", (e) => {
            const nIdx = Number(e.target.dataset.note);
            const tIdx = Number(e.target.dataset.task);
            if (notes[nIdx] && notes[nIdx].tasks[tIdx]) {
                notes[nIdx].tasks[tIdx].checked = e.target.checked;
                if (typeof saveNotes === "function") saveNotes();
                if (typeof renderAllNotes === "function") renderAllNotes();
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
