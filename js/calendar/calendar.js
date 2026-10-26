//////////////////////////////////////////////////////////////////
// ----------------------
//       CALENDAR
// ----------------------

let currentCalendarType = localStorage.getItem("calendarType") || (currentLanguage === "ar" ? "hijri" : "jalali"); // "jalali" | "gregorian" | "hijri"

let currentGregorianDate = new Date();
let todayJalali = jalaali.toJalaali(currentGregorianDate);
let todayGregorian = {
    gy: currentGregorianDate.getFullYear(),
    gm: currentGregorianDate.getMonth() + 1,
    gd: currentGregorianDate.getDate()
};
let todayHijri = getHijriParts(currentGregorianDate);

let currentJy = todayJalali.jy;
let currentJm = todayJalali.jm;

let currentGy = todayGregorian.gy;
let currentGm = todayGregorian.gm;

let currentHy = todayHijri.hy;
let currentHm = todayHijri.hm;

let selectedDeadlineKey = formatJalaliKey(todayJalali.jy, todayJalali.jm, todayJalali.jd);

// ----------------------
//   HIJRI ENGINE (Umm al-Qura via Intl)
// ----------------------
function getHijriParts(date) {
    try {
        const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
            year: 'numeric', month: 'numeric', day: 'numeric'
        });
        const parts = fmt.formatToParts(date);
        let hy = 1448, hm = 1, hd = 1;
        for (const p of parts) {
            if (p.type === 'year') hy = parseInt(p.value.replace(/[^0-9]/g, ''), 10) || 1448;
            if (p.type === 'month') hm = parseInt(p.value.replace(/[^0-9]/g, ''), 10) || 1;
            if (p.type === 'day') hd = parseInt(p.value.replace(/[^0-9]/g, ''), 10) || 1;
        }
        return { hy, hm, hd };
    } catch(e) {
        return { hy: 1448, hm: 5, hd: 9 };
    }
}

function hijriToGregorianDate(hy, hm, hd = 1) {
    // Reference epoch: 1448-05-01 is 2026-10-12
    const refTime = Date.UTC(2026, 9, 12, 12, 0, 0);
    const approxDays = (hy - 1448) * 354.36707 + (hm - 5) * 29.53058 + (hd - 1);
    const approxTime = refTime + approxDays * 86400000;

    for (let offset = -4; offset <= 4; offset++) {
        const testD = new Date(approxTime + offset * 86400000);
        const h = getHijriParts(testD);
        if (h.hy === hy && h.hm === hm && h.hd === hd) {
            return testD;
        }
    }
    return new Date(approxTime);
}

function getHijriMonthInfo(hy, hm) {
    const d1 = hijriToGregorianDate(hy, hm, 1);
    const d30 = new Date(d1.getTime() + 29 * 86400000);
    const h30 = getHijriParts(d30);
    const totalDays = (h30.hy === hy && h30.hm === hm && h30.hd === 30) ? 30 : 29;
    const jsDay = d1.getDay();
    const firstDayIndex = (jsDay + 1) % 7; // Saturday = 0, Friday = 6
    return { totalDays, firstDayIndex, startDate: d1 };
}

function formatHijriKey(hy, hm, hd) {
    const mm = String(hm).padStart(2, "0");
    const dd = String(hd).padStart(2, "0");
    return `${hy}-${mm}-${dd}`;
}

// ----------------------
//   TASK DEADLINE MAPPING
// ----------------------
function parseAnyDeadlineKey(key) {
    if (!key) return null;
    const parts = String(key).split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [y, m, d] = parts;
    if (y > 1800) {
        // Gregorian key
        const gDate = new Date(y, m - 1, d, 12, 0, 0);
        const j = jalaali.toJalaali(y, m, d);
        const h = getHijriParts(gDate);
        return {
            type: "gregorian",
            g: { gy: y, gm: m, gd: d },
            j,
            h,
            jKey: formatJalaliKey(j.jy, j.jm, j.jd),
            gKey: key,
            hKey: formatHijriKey(h.hy, h.hm, h.hd),
            gDate
        };
    } else if (y >= 1430 && y < 1600) {
        // Hijri key
        const gDate = hijriToGregorianDate(y, m, d);
        const gy = gDate.getFullYear(), gm = gDate.getMonth() + 1, gd = gDate.getDate();
        const j = jalaali.toJalaali(gy, gm, gd);
        return {
            type: "hijri",
            g: { gy, gm, gd },
            j,
            h: { hy: y, hm: m, hd: d },
            jKey: formatJalaliKey(j.jy, j.jm, j.jd),
            gKey: `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`,
            hKey: key,
            gDate
        };
    } else {
        // Jalali key
        const g = jalaali.toGregorian(y, m, d);
        const gDate = new Date(g.gy, g.gm - 1, g.gd, 12, 0, 0);
        const h = getHijriParts(gDate);
        return {
            type: "jalali",
            g,
            j: { jy: y, jm: m, jd: d },
            h,
            jKey: key,
            gKey: `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`,
            hKey: formatHijriKey(h.hy, h.hm, h.hd),
            gDate
        };
    }
}

function getTaskDeadlineKey(task) {
    if (!task || !task.deadline) return null;
    if (typeof task.deadline === "string") return task.deadline;
    if (typeof task.deadline === "object" && task.deadline.jy && task.deadline.jm && task.deadline.jd) {
        return formatJalaliKey(task.deadline.jy, task.deadline.jm, task.deadline.jd);
    }
    return null;
}

function getTasksMatchingDayKey(dayKey) {
    const targetParsed = parseAnyDeadlineKey(dayKey);
    if (!targetParsed) return [];

    const items = [];
    notes.forEach((note, noteIndex) => {
        if (note.deletedAt) return;
        (note.tasks || []).forEach((task, taskIndex) => {
            const rawKey = getTaskDeadlineKey(task);
            if (!rawKey) return;
            const taskParsed = parseAnyDeadlineKey(rawKey);
            if (!taskParsed) return;

            if (taskParsed.jKey === targetParsed.jKey) {
                items.push({
                    noteIndex,
                    taskIndex,
                    note,
                    task
                });
            }
        });
    });

    return items;
}

function getTasksByDeadlineKey(deadlineKey) {
    return getTasksMatchingDayKey(deadlineKey);
}

function getAllDeadlineJalaliKeys() {
    const keys = new Set();
    notes.forEach(note => {
        if (note.deletedAt) return;
        (note.tasks || []).forEach(task => {
            const rawKey = getTaskDeadlineKey(task);
            if (rawKey) {
                const parsed = parseAnyDeadlineKey(rawKey);
                if (parsed) keys.add(parsed.jKey);
            }
        });
    });
    return keys;
}

function formatDayTitleForCurrentCalendar(key, includeYear = false) {
    const parsed = parseAnyDeadlineKey(key);
    if (!parsed) return "";

    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const isEn = (currentLanguage === "en");
    const isKo = (currentLanguage === "ko");

    let monthName = "";
    let day = 1;
    let year = 1400;

    if (currentCalendarType === "hijri") {
        monthName = dict ? dict.months.hijri[parsed.h.hm - 1] : `ماه ${parsed.h.hm}`;
        day = parsed.h.hd;
        year = parsed.h.hy;
    } else if (currentCalendarType === "gregorian") {
        monthName = dict ? dict.months.gregorian[parsed.g.gm - 1] : `Month ${parsed.g.gm}`;
        day = parsed.g.gd;
        year = parsed.g.gy;
    } else {
        monthName = dict ? dict.months.jalali[parsed.j.jm - 1] : `ماه ${parsed.j.jm}`;
        day = parsed.j.jd;
        year = parsed.j.jy;
    }

    const dayStr = typeof formatDigits === "function" ? formatDigits(day) : day;
    const yearStr = typeof formatDigits === "function" ? formatDigits(year) : year;

    if (includeYear) {
        if (isKo) return `${yearStr}년 ${monthName} ${dayStr}일`;
        if (isEn) return `${monthName} ${dayStr}, ${yearStr}`;
        return `${dayStr} ${monthName} ${yearStr}`;
    }

    if (isKo) return `${monthName} ${dayStr}일`;
    if (isEn) return `${monthName} ${dayStr}`;
    return `${dayStr} ${monthName}`;
}

function getMultiCalendarTooltip(key) {
    const parsed = parseAnyDeadlineKey(key);
    if (!parsed) return "";
    const fd = typeof formatDigits === "function" ? formatDigits : (x => x);

    const jalaliStr = `${fd(parsed.j.jd)} / ${fd(parsed.j.jm)} / ${fd(parsed.j.jy)}`;
    const gregStr = `${parsed.g.gy}-${String(parsed.g.gm).padStart(2, "0")}-${String(parsed.g.gd).padStart(2, "0")}`;
    const hijriStr = `${fd(parsed.h.jd)} / ${fd(parsed.h.hm)} / ${fd(parsed.h.hy)}`;

    return `شمسی: ${jalaliStr} | میلادی: ${gregStr} | قمری: ${hijriStr}`;
}

const DEADLINE_EXPAND_THRESHOLD = 2;
const STANDARD_DEADLINE_LIST_MAX_HEIGHT = 220;

let isDeadlinePanelUserCollapsed = false;
let isOverdueSectionCollapsed = localStorage.getItem("overdueSectionCollapsed") === "true";
let currentPanelDeadlineKey = null;
let previousDeadlineItemsCount = 0;

function getDeadlineInfo(deadlineKey, isChecked) {
    if (!deadlineKey) return null;

    try {
        const parsed = parseAnyDeadlineKey(deadlineKey);
        if (!parsed) return null;

        const g = parsed.g;
        const deadlineEnd = new Date(g.gy, g.gm - 1, g.gd, 23, 59, 59, 999).getTime();
        const now = Date.now();
        const diffMs = deadlineEnd - now;
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
        const dict = typeof TRANSLATIONS !== "undefined" ? TRANSLATIONS[currentLanguage] : null;
        const fd = typeof formatDigits === "function" ? formatDigits : (x => x);

        if (isChecked) {
            return {
                status: "done",
                isOverdue: false,
                color: "#10b981",
                bgColor: "rgba(16, 185, 129, 0.08)",
                borderColor: "rgba(16, 185, 129, 0.35)",
                badgeText: `✓ ${dict ? dict.doneLabel : "انجام شد"}`,
                badgeClass: "badge-done",
                diffMs,
                deadlineEnd
            };
        }

        if (diffMs < 0) {
            const overdueDays = Math.ceil(Math.abs(diffMs) / (24 * 60 * 60 * 1000));
            const badgeText = dict && typeof dict.overdueDaysAgo === "function"
                ? `⚠️ ${dict.overdueDaysAgo(fd(overdueDays))}`
                : `⚠️ ${fd(overdueDays)} روز عقب‌افتاده`;

            return {
                status: "overdue",
                isOverdue: true,
                color: "#ef4444",
                bgColor: "rgba(239, 68, 68, 0.08)",
                borderColor: "rgba(239, 68, 68, 0.35)",
                badgeText,
                badgeClass: "badge-overdue",
                diffMs,
                deadlineEnd
            };
        }

        if (diffMs <= THREE_DAYS_MS) {
            const ratio = Math.max(0, Math.min(1, 1 - (diffMs / THREE_DAYS_MS)));
            const hue = Math.round(48 * (1 - ratio));
            const color = `hsl(${hue}, 92%, 46%)`;
            const bgColor = `hsla(${hue}, 92%, 46%, 0.08)`;
            const borderColor = `hsla(${hue}, 92%, 46%, 0.35)`;

            let badgeText = "";
            const oneDayMs = 24 * 60 * 60 * 1000;
            if (diffMs <= oneDayMs) {
                const hoursLeft = Math.max(1, Math.ceil(diffMs / (60 * 60 * 1000)));
                badgeText = dict && typeof dict.todayRemaining === "function"
                    ? `⏳ ${dict.todayRemaining(fd(hoursLeft))}`
                    : `⏳ امروز (${fd(hoursLeft)} ساعت)`;
            } else {
                const daysLeft = Math.ceil(diffMs / oneDayMs);
                badgeText = `⏳ ${fd(daysLeft)} روز`;
            }

            return {
                status: "approaching",
                isOverdue: false,
                ratio,
                hue,
                color,
                bgColor,
                borderColor,
                badgeText,
                badgeClass: "badge-urgent",
                diffMs,
                deadlineEnd
            };
        }

        const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
        return {
            status: "normal",
            isOverdue: false,
            color: "#6366f1",
            bgColor: "rgba(99, 102, 241, 0.06)",
            borderColor: "rgba(99, 102, 241, 0.25)",
            badgeText: `📅 ${fd(daysLeft)} روز`,
            badgeClass: "badge-normal",
            diffMs,
            deadlineEnd
        };
    } catch (err) {
        console.error("Error computing deadline info:", err);
        return null;
    }
}

function getOverdueTasks() {
    const overdue = [];
    const now = Date.now();

    notes.forEach((note, noteIndex) => {
        if (note.deletedAt) return;

        (note.tasks || []).forEach((task, taskIndex) => {
            if (task.checked) return;
            const key = getTaskDeadlineKey(task);
            if (!key) return;

            try {
                const parsed = parseAnyDeadlineKey(key);
                if (!parsed) return;
                const g = parsed.g;
                const deadlineEnd = new Date(g.gy, g.gm - 1, g.gd, 23, 59, 59, 999).getTime();

                if (deadlineEnd < now) {
                    overdue.push({
                        noteIndex,
                        taskIndex,
                        note,
                        task,
                        deadlineKey: parsed.jKey,
                        deadlineEnd
                    });
                }
            } catch (e) {}
        });
    });

    overdue.sort((a, b) => a.deadlineEnd - b.deadlineEnd);
    return overdue;
}

function getDayUrgencyColor(dayKey) {
    const dayTasks = getTasksByDeadlineKey(dayKey);
    if (!dayTasks.length) return null;

    const uncompleted = dayTasks.filter(item => !item.task.checked);
    if (!uncompleted.length) {
        return "#10b981";
    }

    const info = getDeadlineInfo(dayKey, false);
    return info ? info.color : "#ef4444";
}

function getAvailableDeadlineListHeight() {
    const eraser = document.getElementById("eraser");
    const pen = document.getElementById("pen");
    const deadlineList = document.getElementById("deadline-list");
    const deadlinePanel = document.getElementById("deadline-panel");

    if (!deadlineList || !deadlinePanel) return STANDARD_DEADLINE_LIST_MAX_HEIGHT;

    let barrier = window.innerHeight - 110;
    if (eraser && pen) {
        const eraserTop = eraser.getBoundingClientRect().top;
        const penTop = pen.getBoundingClientRect().top;
        if (eraserTop > 0 && penTop > 0) {
            barrier = Math.min(eraserTop, penTop);
        } else if (eraserTop > 0) {
            barrier = eraserTop;
        } else if (penTop > 0) {
            barrier = penTop;
        }
    } else if (eraser) {
        const eraserTop = eraser.getBoundingClientRect().top;
        if (eraserTop > 0) barrier = eraserTop;
    } else if (pen) {
        const penTop = pen.getBoundingClientRect().top;
        if (penTop > 0) barrier = penTop;
    }

    const targetBottom = barrier - 18;
    const panelRect = deadlinePanel.getBoundingClientRect();
    let panelTop = panelRect.top;
    if (!panelTop || panelTop <= 0) {
        const calendarEl = document.getElementById("calendar");
        const calHeight = (calendarEl && !calendarEl.classList.contains("minimized")) ? 445 : 38;
        panelTop = 30 + calHeight + 10;
    }

    const headerHeight = deadlinePanel.querySelector(".deadline-panel-header")?.offsetHeight || 42;
    const available = Math.floor(targetBottom - panelTop - headerHeight - 4);
    return Math.max(available, 60);
}

function applyDeadlinePanelState() {
    if (typeof updateSidePanelHeightAndCollapse === "function") {
        updateSidePanelHeightAndCollapse();
    }
}

function createDeadlineItemElement({ note, task, noteIndex, info, isOverdue }) {
    const item = document.createElement("div");
    item.className = `deadline-item ${task.checked ? "done" : ""} ${isOverdue ? "overdue" : ""}`;
    if (info) {
        item.style.setProperty("--deadline-item-color", info.color);
        if (document.documentElement.getAttribute("dir") === "ltr") {
            item.style.borderLeftColor = info.color;
        } else {
            item.style.borderRightColor = info.color;
        }
        item.style.backgroundColor = info.bgColor || "#f9fafb";
    }

    const noteTitleText = escapeHTML(note.title?.trim() || "---");
    const taskContentText = escapeHTML(task.text?.trim() || "(...)");

    let badgeHTML = "";
    if (info && info.badgeText) {
        badgeHTML = `
            <span class="deadline-item-badge ${info.badgeClass || ''}" style="color: ${info.color}; border-color: ${info.borderColor}; background-color: ${info.bgColor}">
                ${info.badgeText}
            </span>
        `;
    }

    item.innerHTML = `
        <div class="deadline-item-header">
            <span class="deadline-item-note" title="${noteTitleText}">${noteTitleText}</span>
            ${badgeHTML}
        </div>
        <div class="deadline-item-text">${taskContentText}</div>
    `;

    item.addEventListener("click", () => {
        activeNoteIndex = noteIndex;
        if (note.stackId && typeof stacks !== "undefined" && stacks[note.stackId]) {
            stacks[note.stackId].activeNoteId = note.id;
            if (typeof activeStackId !== "undefined") activeStackId = note.stackId;
            if (typeof saveNotes === "function") saveNotes();
        }
        renderAllNotes();
    });

    return item;
}

function updateDeadlinePanel(deadlineKey) {
    const titleTextEl = document.getElementById("deadline-panel-title-text");
    const countBadge = document.getElementById("deadline-count-badge");
    const tabBadge = document.getElementById("tab-badge-deadlines");
    const listEl = document.getElementById("deadline-list");

    if (!listEl) return;

    if (currentPanelDeadlineKey !== deadlineKey) {
        currentPanelDeadlineKey = deadlineKey;
        isDeadlinePanelUserCollapsed = false;
        previousDeadlineItemsCount = 0;
    }

    const targetParsed = parseAnyDeadlineKey(deadlineKey);
    const todayJalaliKey = formatJalaliKey(todayJalali.jy, todayJalali.jm, todayJalali.jd);
    const isToday = targetParsed && targetParsed.jKey === todayJalaliKey;

    const allOverdueTasks = getOverdueTasks();
    const currentDayItems = getTasksByDeadlineKey(deadlineKey);
    const otherOverdueTasks = allOverdueTasks.filter(item => item.deadlineKey !== (targetParsed ? targetParsed.jKey : ""));

    const totalCount = currentDayItems.length + otherOverdueTasks.length;

    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const fd = typeof formatDigits === "function" ? formatDigits : (x => x);

    let titleText = "";
    if (isToday) {
        const formattedToday = formatDayTitleForCurrentCalendar(todayJalaliKey);
        titleText = dict ? `${dict.deadlineTitleToday} (${formattedToday})` : `ددلاین‌های امروز (${formattedToday})`;
    } else {
        const formattedDate = formatDayTitleForCurrentCalendar(deadlineKey);
        titleText = dict && typeof dict.deadlineTitleFor === "function"
            ? dict.deadlineTitleFor(formattedDate)
            : `ددلاین‌های ${formattedDate}`;
    }

    if (titleTextEl) {
        titleTextEl.textContent = titleText;
        titleTextEl.parentElement.title = `${titleText} — ${getMultiCalendarTooltip(deadlineKey)}`;
    }
    if (countBadge) countBadge.textContent = fd(totalCount);
    if (tabBadge) tabBadge.textContent = fd(totalCount);

    listEl.innerHTML = "";

    function renderOtherOverdueSection(container, tasks, sectionTitle) {
        if (!tasks.length) return;

        const overdueHeader = document.createElement("div");
        overdueHeader.className = "deadline-section-header overdue";
        overdueHeader.id = "overdue-section-header";

        const updateOverdueHeaderContent = () => {
            const icon = isOverdueSectionCollapsed ? "◀" : "▼";
            const btnText = isOverdueSectionCollapsed ? "+ " : "− ";
            overdueHeader.innerHTML = `
                <div class="deadline-section-title">
                    <span class="overdue-collapse-icon">${icon}</span>
                    <span>⚠️ ${sectionTitle} (${fd(tasks.length)})</span>
                </div>
                <button type="button" class="overdue-toggle-btn">${btnText}</button>
            `;
        };

        updateOverdueHeaderContent();

        const overdueContainer = document.createElement("div");
        overdueContainer.className = `overdue-items-container ${isOverdueSectionCollapsed ? "collapsed" : ""}`;
        overdueContainer.id = "overdue-items-container";

        overdueHeader.addEventListener("click", (e) => {
            e.stopPropagation();
            isOverdueSectionCollapsed = !isOverdueSectionCollapsed;
            localStorage.setItem("overdueSectionCollapsed", String(isOverdueSectionCollapsed));
            overdueContainer.classList.toggle("collapsed", isOverdueSectionCollapsed);
            updateOverdueHeaderContent();
            if (typeof updateSidePanelHeightAndCollapse === "function") {
                updateSidePanelHeightAndCollapse();
            }
        });

        tasks.forEach(({ note, task, noteIndex, deadlineKey: taskKey }) => {
            const info = getDeadlineInfo(taskKey, false);
            const itemEl = createDeadlineItemElement({ note, task, noteIndex, info, isOverdue: true });
            overdueContainer.appendChild(itemEl);
        });

        container.appendChild(overdueHeader);
        container.appendChild(overdueContainer);
    }

    function renderCurrentDaySection(container, items, showHeader, headerText) {
        if (showHeader && items.length > 0) {
            const currentHeader = document.createElement("div");
            currentHeader.className = "deadline-section-header current";
            currentHeader.innerHTML = `
                <span>📅 ${headerText} (${fd(items.length)})</span>
            `;
            container.appendChild(currentHeader);
        }

        if (items.length > 0) {
            items.forEach(({ note, task, noteIndex }) => {
                const info = getDeadlineInfo(deadlineKey, task.checked);
                const itemEl = createDeadlineItemElement({
                    note,
                    task,
                    noteIndex,
                    info,
                    isOverdue: info ? info.isOverdue : false
                });
                container.appendChild(itemEl);
            });
        }
    }

    const overdueLabel = dict ? dict.overdueSectionTitle : "کارهای عقب‌افتاده";
    const currentDayLabel = isToday
        ? (dict ? dict.deadlineTitleToday : "کارهای امروز")
        : formatDayTitleForCurrentCalendar(deadlineKey);

    if (isToday) {
        renderOtherOverdueSection(listEl, otherOverdueTasks, overdueLabel);
        renderCurrentDaySection(listEl, currentDayItems, otherOverdueTasks.length > 0, currentDayLabel);
    } else {
        renderCurrentDaySection(listEl, currentDayItems, otherOverdueTasks.length > 0, currentDayLabel);
        renderOtherOverdueSection(listEl, otherOverdueTasks, overdueLabel);
    }

    if (totalCount === 0) {
        listEl.innerHTML = `<div class="deadline-empty">${dict ? dict.deadlineEmpty : "هیچ ددلاینی برای این روز ثبت نشده است."}</div>`;
    }

    // Also update the separate routines panel and unified side panel header
    if (typeof updateRoutinePanel === "function") {
        updateRoutinePanel(deadlineKey);
    }
    if (typeof updateSidePanelHeader === "function") {
        updateSidePanelHeader(deadlineKey);
    }
    if (typeof updateSidePanelHeightAndCollapse === "function") {
        updateSidePanelHeightAndCollapse();
    }
}

// Deadline panel collapse listener
document.addEventListener("DOMContentLoaded", () => {
    const dCollapseBtn = document.getElementById("deadline-panel-collapse-btn");
    const dPanel = document.getElementById("deadline-panel");
    if (dCollapseBtn && dPanel) {
        const isCollapsed = localStorage.getItem("deadlinePanelCollapsed") === "true";
        dPanel.classList.toggle("collapsed", isCollapsed);
        dCollapseBtn.textContent = isCollapsed ? "+" : "−";

        dCollapseBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const nowCollapsed = dPanel.classList.toggle("collapsed");
            dCollapseBtn.textContent = nowCollapsed ? "+" : "−";
            localStorage.setItem("deadlinePanelCollapsed", String(nowCollapsed));
        });
    }
});

function updateWeekdaysHeader() {
    const weekdaysContainer = document.querySelector('.weekdays');
    if (!weekdaysContainer) return;

    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;

    const weekdays = dict && dict.weekdays && dict.weekdays[currentCalendarType]
        ? dict.weekdays[currentCalendarType]
        : ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

    weekdaysContainer.innerHTML = weekdays.map(w => `<div>${w}</div>`).join('');
}

function renderCalendar() {
    const daysContainer = document.getElementById('daysContainer');
    const monthYearDisplay = document.getElementById('monthYear');
    if (!daysContainer || !monthYearDisplay) return;

    updateWeekdaysHeader();
    daysContainer.innerHTML = '';
    const deadlineJalaliKeys = getAllDeadlineJalaliKeys();
    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const fd = typeof formatDigits === "function" ? formatDigits : (x => x);

    updateCalendarTypeButton();

    if (currentCalendarType === "hijri") {
        // -------------------------
        //     HIJRI CALENDAR
        // -------------------------
        const monthName = dict ? dict.months.hijri[currentHm - 1] : `Month ${currentHm}`;
        monthYearDisplay.textContent = `${monthName} ${fd(currentHy)}`;

        const { totalDays, firstDayIndex, startDate } = getHijriMonthInfo(currentHy, currentHm);

        for (let i = 0; i < firstDayIndex; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('day', 'empty');
            daysContainer.appendChild(emptyDiv);
        }

        for (let i = 1; i <= totalDays; i++) {
            const dayDiv = document.createElement('div');
            const dayGDate = new Date(startDate.getTime() + (i - 1) * 86400000);
            const gy = dayGDate.getFullYear(), gm = dayGDate.getMonth() + 1, gd = dayGDate.getDate();
            const j = jalaali.toJalaali(gy, gm, gd);
            const dayJalaliKey = formatJalaliKey(j.jy, j.jm, j.jd);

            dayDiv.classList.add('day');
            dayDiv.textContent = fd(i);
            dayDiv.dataset.dateKey = dayJalaliKey;
            dayDiv.title = `شمسی: ${fd(j.jd)}/${fd(j.jm)}/${fd(j.jy)} | میلادی: ${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;

            if ((firstDayIndex + i - 1) % 7 === 6) {
                dayDiv.classList.add('friday');
            }

            if (
                currentHy === todayHijri.hy &&
                currentHm === todayHijri.hm &&
                i === todayHijri.hd
            ) {
                dayDiv.classList.add('today');
            }

            if (deadlineJalaliKeys.has(dayJalaliKey)) {
                dayDiv.classList.add('has-deadline');
                const dotColor = getDayUrgencyColor(dayJalaliKey);
                if (dotColor) {
                    dayDiv.style.setProperty('--deadline-dot-color', dotColor);
                }
            }

            if (selectedDeadlineKey === dayJalaliKey) {
                dayDiv.classList.add('selected-deadline-day');
            }

            dayDiv.addEventListener("click", () => {
                selectedDeadlineKey = dayJalaliKey;
                renderCalendar();
                updateDeadlinePanel(dayJalaliKey);
            });

            daysContainer.appendChild(dayDiv);
        }
    } else if (currentCalendarType === "gregorian") {
        // -------------------------
        //    GREGORIAN CALENDAR
        // -------------------------
        const monthName = dict ? dict.months.gregorian[currentGm - 1] : `Month ${currentGm}`;
        monthYearDisplay.textContent = `${monthName} ${fd(currentGy)}`;

        const dateObj = new Date(currentGy, currentGm - 1, 1);
        let firstDayOfWeek = (dateObj.getDay() + 1) % 7; // Saturday = 0, Friday = 6
        const monthLength = new Date(currentGy, currentGm, 0).getDate();

        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('day', 'empty');
            daysContainer.appendChild(emptyDiv);
        }

        for (let i = 1; i <= monthLength; i++) {
            const dayDiv = document.createElement('div');
            const j = jalaali.toJalaali(currentGy, currentGm, i);
            const dayJalaliKey = formatJalaliKey(j.jy, j.jm, j.jd);

            dayDiv.classList.add('day');
            dayDiv.textContent = fd(i);
            dayDiv.dataset.dateKey = dayJalaliKey;
            dayDiv.title = `شمسی: ${fd(j.jd)}/${fd(j.jm)}/${fd(j.jy)}`;

            if ((firstDayOfWeek + i - 1) % 7 === 6) {
                dayDiv.classList.add('friday');
            }

            if (
                currentGy === todayGregorian.gy &&
                currentGm === todayGregorian.gm &&
                i === todayGregorian.gd
            ) {
                dayDiv.classList.add('today');
            }

            if (deadlineJalaliKeys.has(dayJalaliKey)) {
                dayDiv.classList.add('has-deadline');
                const dotColor = getDayUrgencyColor(dayJalaliKey);
                if (dotColor) {
                    dayDiv.style.setProperty('--deadline-dot-color', dotColor);
                }
            }

            if (selectedDeadlineKey === dayJalaliKey) {
                dayDiv.classList.add('selected-deadline-day');
            }

            dayDiv.addEventListener("click", () => {
                selectedDeadlineKey = dayJalaliKey;
                renderCalendar();
                updateDeadlinePanel(dayJalaliKey);
            });

            daysContainer.appendChild(dayDiv);
        }
    } else {
        // -------------------------
        //     JALALI CALENDAR
        // -------------------------
        const monthName = dict ? dict.months.jalali[currentJm - 1] : `ماه ${currentJm}`;
        monthYearDisplay.textContent = `${monthName} ${fd(currentJy)}`;

        const firstDayGregorian = jalaali.toGregorian(currentJy, currentJm, 1);
        const dateObj = new Date(
            firstDayGregorian.gy,
            firstDayGregorian.gm - 1,
            firstDayGregorian.gd
        );

        let firstDayOfWeek = (dateObj.getDay() + 1) % 7;
        const monthLength = jalaali.jalaaliMonthLength(currentJy, currentJm);

        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('day', 'empty');
            daysContainer.appendChild(emptyDiv);
        }

        for (let i = 1; i <= monthLength; i++) {
            const dayDiv = document.createElement('div');
            const dayJalaliKey = formatJalaliKey(currentJy, currentJm, i);
            const g = jalaali.toGregorian(currentJy, currentJm, i);

            dayDiv.classList.add('day');
            dayDiv.textContent = fd(i);
            dayDiv.dataset.dateKey = dayJalaliKey;
            dayDiv.title = `میلادی: ${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`;

            if ((firstDayOfWeek + i - 1) % 7 === 6) {
                dayDiv.classList.add('friday');
            }

            if (
                currentJy === todayJalali.jy &&
                currentJm === todayJalali.jm &&
                i === todayJalali.jd
            ) {
                dayDiv.classList.add('today');
            }

            if (deadlineJalaliKeys.has(dayJalaliKey)) {
                dayDiv.classList.add('has-deadline');
                const dotColor = getDayUrgencyColor(dayJalaliKey);
                if (dotColor) {
                    dayDiv.style.setProperty('--deadline-dot-color', dotColor);
                }
            }

            if (selectedDeadlineKey === dayJalaliKey) {
                dayDiv.classList.add('selected-deadline-day');
            }

            dayDiv.addEventListener("click", () => {
                selectedDeadlineKey = dayJalaliKey;
                renderCalendar();
                updateDeadlinePanel(dayJalaliKey);
            });

            daysContainer.appendChild(dayDiv);
        }
    }
}

document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentCalendarType === "hijri") {
        currentHm--;
        if (currentHm < 1) {
            currentHm = 12;
            currentHy--;
        }
    } else if (currentCalendarType === "gregorian") {
        currentGm--;
        if (currentGm < 1) {
            currentGm = 12;
            currentGy--;
        }
    } else {
        currentJm--;
        if (currentJm < 1) {
            currentJm = 12;
            currentJy--;
        }
    }
    renderCalendar();
});

document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentCalendarType === "hijri") {
        currentHm++;
        if (currentHm > 12) {
            currentHm = 1;
            currentHy++;
        }
    } else if (currentCalendarType === "gregorian") {
        currentGm++;
        if (currentGm > 12) {
            currentGm = 1;
            currentGy++;
        }
    } else {
        currentJm++;
        if (currentJm > 12) {
            currentJm = 1;
            currentJy++;
        }
    }
    renderCalendar();
});

function toggleCalendarType(e) {
    if (e && e.stopPropagation) {
        e.stopPropagation();
    }
    const btn = document.getElementById("calendar-type-btn");
    if (btn) {
        btn.classList.add("switching");
        setTimeout(() => btn.classList.remove("switching"), 450);
    }

    // Determine next calendar type in cycle
    let nextType = "jalali";
    if (currentLanguage === "ar") {
        // Arabic preference: hijri -> gregorian -> jalali -> hijri
        if (currentCalendarType === "hijri") nextType = "gregorian";
        else if (currentCalendarType === "gregorian") nextType = "jalali";
        else nextType = "hijri";
    } else if (currentLanguage === "en" || currentLanguage === "ko") {
        // English/Korean preference: gregorian -> hijri -> jalali -> gregorian
        if (currentCalendarType === "gregorian") nextType = "hijri";
        else if (currentCalendarType === "hijri") nextType = "jalali";
        else nextType = "gregorian";
    } else {
        // Persian preference: jalali -> gregorian -> hijri -> jalali
        if (currentCalendarType === "jalali") nextType = "gregorian";
        else if (currentCalendarType === "gregorian") nextType = "hijri";
        else nextType = "jalali";
    }

    switchCalendarTo(nextType);
}

function switchCalendarTo(type) {
    if (!["jalali", "gregorian", "hijri"].includes(type)) return;
    currentCalendarType = type;
    saveCalendarType(currentCalendarType);

    const sel = parseAnyDeadlineKey(selectedDeadlineKey);
    if (sel) {
        currentJy = sel.j.jy;
        currentJm = sel.j.jm;
        currentGy = sel.g.gy;
        currentGm = sel.g.gm;
        currentHy = sel.h.hy;
        currentHm = sel.h.hm;
    }

    updateCalendarTypeButton();
    renderCalendar();
    updateDeadlinePanel(selectedDeadlineKey);
}

function saveCalendarType(type) {
    localStorage.setItem("calendarType", type);
    if (typeof isExtension !== "undefined" && isExtension) {
        chrome.storage.local.set({ calendarType: type });
    }
}

function updateCalendarTypeButton() {
    const btn = document.getElementById("calendar-type-btn");
    const badge = document.getElementById("calendar-type-badge");
    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;

    const calName = dict && dict.calendarNames && dict.calendarNames[currentCalendarType]
        ? dict.calendarNames[currentCalendarType]
        : currentCalendarType;

    if (badge) {
        badge.textContent = calName;
    }

    if (btn) {
        btn.title = dict ? `${dict.calendarTypeTitle}: ${calName}` : `تقویم: ${calName}`;
        btn.setAttribute("aria-label", btn.title);
    }
}

const calendarTypeBtn = document.getElementById("calendar-type-btn");
if (calendarTypeBtn) {
    calendarTypeBtn.addEventListener("click", toggleCalendarType);
    updateCalendarTypeButton();
}

// ----------------------
//     CALENDAR TOGGLE
// ----------------------
const toggleBtn = document.getElementById('calendar-btn');
const calendar = document.getElementById('calendar');

function getSavedCalendarState() {
    return localStorage.getItem("calendarMinimized") === "true";
}

function saveCalendarState(isMinimized) {
    localStorage.setItem("calendarMinimized", String(isMinimized));
    if (isExtension) {
        chrome.storage.local.set({ calendarMinimized: isMinimized });
    }
}

function applyCalendarState(isMinimized) {
    calendar.classList.toggle('minimized', isMinimized);
    document.body.classList.toggle('calendar-closed', isMinimized);

    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;

    toggleBtn.title = isMinimized
        ? (dict ? dict.calendarOpen : 'نمایش تقویم')
        : (dict ? dict.calendarClose : 'بستن تقویم');

    toggleBtn.innerHTML = isMinimized
        ? `<svg class="maximize-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
           </svg>`
        : `<svg class="minimize-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
           </svg>`;

    setTimeout(() => {
        applyDeadlinePanelState();
        if (typeof updateNotesLayout === 'function') {
            updateNotesLayout();
        }
    }, 320);
}

document.body.addEventListener('transitionend', (e) => {
    if (e.target === document.body && e.propertyName === 'padding-right') {
        if (typeof updateNotesLayout === 'function') {
            updateNotesLayout();
        }
    }
});

if (toggleBtn && calendar) {
    const savedMinimized = getSavedCalendarState();
    applyCalendarState(savedMinimized);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.classList.remove('no-calendar-transition');
        });
    });

    const calendarTopBar = document.querySelector('.calendar-top-bar');
    if (calendarTopBar) {
        calendarTopBar.addEventListener('click', function (e) {
            if (e.target.closest('#calendar-type-btn, #reminder-bell-btn, #btn-expand-calendar')) return;
            const isMinimized = !calendar.classList.contains('minimized');
            applyCalendarState(isMinimized);
            saveCalendarState(isMinimized);
        });
    } else {
        toggleBtn.addEventListener('click', function () {
            const isMinimized = !calendar.classList.contains('minimized');
            applyCalendarState(isMinimized);
            saveCalendarState(isMinimized);
        });
    }
}

const deadlineToggleBtn = document.getElementById('deadline-panel-toggle-btn');
if (deadlineToggleBtn) {
    deadlineToggleBtn.addEventListener('click', () => {
        isDeadlinePanelUserCollapsed = !isDeadlinePanelUserCollapsed;
        applyDeadlinePanelState();
    });
}

window.addEventListener('resize', () => {
    applyDeadlinePanelState();
});

if (calendar) {
    calendar.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'height') {
            applyDeadlinePanelState();
        }
    });
}

if (typeof isExtension !== "undefined" && isExtension) {
    chrome.storage.local.get(["calendarType"], (result) => {
        if (result.calendarType && result.calendarType !== currentCalendarType) {
            currentCalendarType = result.calendarType;
            updateCalendarTypeButton();
            renderCalendar();
            updateDeadlinePanel(selectedDeadlineKey);
        }
    });
}

renderCalendar();
updateDeadlinePanel(selectedDeadlineKey);
