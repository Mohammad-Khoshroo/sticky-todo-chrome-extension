//////////////////////////////////////////////////////////////////
// ----------------------
//       CALENDAR
// ----------------------

const monthNames = [
    "فروردین", "اردیبهشت", "خرداد",
    "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر",
    "دی", "بهمن", "اسفند"
];

const monthNamesGregorianPersian = [
    "ژانویه", "فوریه", "مارس",
    "آوریل", "مه", "ژوئن",
    "ژوئیه", "اوت", "سپتامبر",
    "اکتبر", "نوامبر", "دسامبر"
];

let currentCalendarType = localStorage.getItem("calendarType") || "jalali"; // "jalali" | "gregorian"

let currentGregorianDate = new Date();
let todayJalali = jalaali.toJalaali(currentGregorianDate);
let todayGregorian = {
    gy: currentGregorianDate.getFullYear(),
    gm: currentGregorianDate.getMonth() + 1,
    gd: currentGregorianDate.getDate()
};

let currentJy = todayJalali.jy;
let currentJm = todayJalali.jm;

let currentGy = todayGregorian.gy;
let currentGm = todayGregorian.gm;

let selectedDeadlineKey = formatJalaliKey(todayJalali.jy, todayJalali.jm, todayJalali.jd);

function getTaskDeadlineKey(task) {
    if (!task || !task.deadline) return null;

    if (typeof task.deadline === "string") {
        return task.deadline;
    }

    if (
        typeof task.deadline === "object" &&
        task.deadline.jy &&
        task.deadline.jm &&
        task.deadline.jd
    ) {
        return formatJalaliKey(task.deadline.jy, task.deadline.jm, task.deadline.jd);
    }

    return null;
}

function getTasksByDeadlineKey(deadlineKey) {
    const items = [];

    notes.forEach((note, noteIndex) => {
        if (note.deletedAt) return;

        (note.tasks || []).forEach((task, taskIndex) => {
            if (getTaskDeadlineKey(task) === deadlineKey) {
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

function getAllDeadlineKeys() {
    const keys = new Set();

    notes.forEach(note => {
        if (note.deletedAt) return;

        (note.tasks || []).forEach(task => {
            const key = getTaskDeadlineKey(task);
            if (key) keys.add(key);
        });
    });

    return keys;
}

function parseJalaliKey(key) {
    const [jy, jm, jd] = String(key).split("-").map(Number);
    return { jy, jm, jd };
}

function formatPersianDeadlineTitle(key) {
    const { jy, jm, jd } = parseJalaliKey(key);
    if (!jy || !jm || !jd) return "";
    const g = jalaali.toGregorian(jy, jm, jd);
    if (currentCalendarType === "gregorian") {
        return `${toFarsiNumber(g.gd)} ${monthNamesGregorianPersian[g.gm - 1]} ${toFarsiNumber(g.gy)}`;
    }
    return `${toFarsiNumber(jd)} ${monthNames[jm - 1]} ${toFarsiNumber(jy)}`;
}

function getDualDateTooltip(key) {
    const { jy, jm, jd } = parseJalaliKey(key);
    if (!jy || !jm || !jd) return "";
    const g = jalaali.toGregorian(jy, jm, jd);
    const jalaliStr = `${toFarsiNumber(jd)} ${monthNames[jm - 1]} ${toFarsiNumber(jy)}`;
    const gregorianStr = `${toFarsiNumber(g.gd)} ${monthNamesGregorianPersian[g.gm - 1]} ${toFarsiNumber(g.gy)}`;
    return `${jalaliStr} ⇄ ${gregorianStr}`;
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
        const { jy, jm, jd } = parseJalaliKey(deadlineKey);
        if (!jy || !jm || !jd) return null;
        const g = jalaali.toGregorian(jy, jm, jd);
        const deadlineEnd = new Date(g.gy, g.gm - 1, g.gd, 23, 59, 59, 999).getTime();
        const now = Date.now();
        const diffMs = deadlineEnd - now;
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

        if (isChecked) {
            return {
                status: "done",
                isOverdue: false,
                color: "#10b981",
                bgColor: "rgba(16, 185, 129, 0.08)",
                borderColor: "rgba(16, 185, 129, 0.35)",
                badgeText: "✓ انجام شد",
                badgeClass: "badge-done",
                diffMs,
                deadlineEnd
            };
        }

        if (diffMs < 0) {
            const overdueDays = Math.ceil(Math.abs(diffMs) / (24 * 60 * 60 * 1000));
            let badgeText = "⚠️ عقب‌افتاده";
            if (overdueDays === 1) {
                badgeText = "⚠️ دیروز (عقب‌افتاده)";
            } else if (overdueDays > 1) {
                badgeText = `⚠️ ${toFarsiNumber(overdueDays)} روز عقب‌افتاده`;
            }

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
                badgeText = `⏳ امروز (${toFarsiNumber(hoursLeft)} ساعت)`;
            } else if (diffMs <= 2 * oneDayMs) {
                badgeText = "⏳ فردا";
            } else {
                const daysLeft = Math.ceil(diffMs / oneDayMs);
                badgeText = `⏳ ${toFarsiNumber(daysLeft)} روز مانده`;
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
            badgeText: `📅 ${toFarsiNumber(daysLeft)} روز مانده`,
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
                const { jy, jm, jd } = parseJalaliKey(key);
                if (!jy || !jm || !jd) return;
                const g = jalaali.toGregorian(jy, jm, jd);
                const deadlineEnd = new Date(g.gy, g.gm - 1, g.gd, 23, 59, 59, 999).getTime();

                if (deadlineEnd < now) {
                    overdue.push({
                        noteIndex,
                        taskIndex,
                        note,
                        task,
                        deadlineKey: key,
                        deadlineEnd
                    });
                }
            } catch (e) {
                // Ignore parsing errors
            }
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

    // Bottom barrier: top of eraser or pen
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

    // Leave a comfortable gap of 18px above eraser & pen
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
    const toggleBtn = document.getElementById("deadline-panel-toggle-btn");
    const listEl = document.getElementById("deadline-list");

    if (!toggleBtn || !listEl) return;

    const allItems = listEl.querySelectorAll('.deadline-item');
    let visibleCount = 0;
    allItems.forEach(item => {
        if (!item.closest('.overdue-items-container.collapsed')) {
            visibleCount++;
        }
    });

    const hasManyItems = visibleCount > DEADLINE_EXPAND_THRESHOLD;

    if (!hasManyItems) {
        toggleBtn.classList.add("hidden");
        listEl.style.maxHeight = `${STANDARD_DEADLINE_LIST_MAX_HEIGHT}px`;
        return;
    }

    toggleBtn.classList.remove("hidden");
    const availableHeight = getAvailableDeadlineListHeight();

    if (isDeadlinePanelUserCollapsed) {
        toggleBtn.innerText = "+ بزرگ کردن";
        toggleBtn.title = "باز کردن و بزرگ‌نمایی پنجره برای مشاهده تمام ددلاین‌ها";
        listEl.style.maxHeight = `${Math.min(STANDARD_DEADLINE_LIST_MAX_HEIGHT, availableHeight)}px`;
    } else {
        toggleBtn.innerText = "− کوچک کردن";
        toggleBtn.title = "بستن و کوچک کردن به اندازه استاندارد";
        listEl.style.maxHeight = `${availableHeight}px`;
    }
}

function createDeadlineItemElement({ note, task, noteIndex, info, isOverdue }) {
    const item = document.createElement("div");
    item.className = `deadline-item ${task.checked ? "done" : ""} ${isOverdue ? "overdue" : ""}`;
    if (info) {
        item.style.setProperty("--deadline-item-color", info.color);
        item.style.borderRightColor = info.color;
        item.style.backgroundColor = info.bgColor || "#f9fafb";
    }

    const noteTitleText = escapeHTML(note.title?.trim() || "بدون عنوان");
    const taskContentText = escapeHTML(task.text?.trim() || "(بدون متن)");

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
    const titleEl = document.getElementById("deadline-panel-title");
    const listEl = document.getElementById("deadline-list");

    if (!titleEl || !listEl) return;

    if (currentPanelDeadlineKey !== deadlineKey) {
        currentPanelDeadlineKey = deadlineKey;
        isDeadlinePanelUserCollapsed = false;
        previousDeadlineItemsCount = 0;
    }

    const todayKey = formatJalaliKey(todayJalali.jy, todayJalali.jm, todayJalali.jd);
    const allOverdueTasks = getOverdueTasks();
    const currentDayItems = getTasksByDeadlineKey(deadlineKey);

    // Overdue tasks that belong to OTHER days (not deadlineKey)
    const otherOverdueTasks = allOverdueTasks.filter(item => item.deadlineKey !== deadlineKey);

    const totalCount = currentDayItems.length + otherOverdueTasks.length;

    if (totalCount > previousDeadlineItemsCount && totalCount > DEADLINE_EXPAND_THRESHOLD) {
        isDeadlinePanelUserCollapsed = false;
    }
    previousDeadlineItemsCount = totalCount;

    const isToday = (deadlineKey === todayKey);
    let todaySuffix = "";
    if (isToday) {
        const { jy, jm, jd } = parseJalaliKey(deadlineKey);
        if (currentCalendarType === "gregorian") {
            const g = jalaali.toGregorian(jy, jm, jd);
            todaySuffix = ` (${toFarsiNumber(g.gd)} ${monthNamesGregorianPersian[g.gm - 1]})`;
        } else {
            todaySuffix = ` (${toFarsiNumber(jd)} ${monthNames[jm - 1]})`;
        }
    }

    const titleText = isToday 
        ? `ددلاین‌های امروز${todaySuffix}`
        : `ددلاین‌های ${formatPersianDeadlineTitle(deadlineKey)}`;

    titleEl.textContent = titleText;
    titleEl.title = `${titleText} — ${getDualDateTooltip(deadlineKey)}`;
    listEl.innerHTML = "";

    if (totalCount === 0) {
        listEl.innerHTML = `<div class="deadline-empty">ددلاینی برای این روز وجود ندارد</div>`;
        applyDeadlinePanelState();
        return;
    }

    function renderOtherOverdueSection(container, tasks, sectionTitle) {
        if (!tasks.length) return;

        const overdueHeader = document.createElement("div");
        overdueHeader.className = "deadline-section-header overdue";
        overdueHeader.id = "overdue-section-header";
        overdueHeader.title = "کلیک برای باز یا جمع کردن کارهای عقب‌افتاده";

        const updateOverdueHeaderContent = () => {
            const icon = isOverdueSectionCollapsed ? "◀" : "▼";
            const btnText = isOverdueSectionCollapsed ? "+ باز کردن" : "− بستن";
            overdueHeader.innerHTML = `
                <div class="deadline-section-title">
                    <span class="overdue-collapse-icon">${icon}</span>
                    <span>⚠️ ${sectionTitle} (${toFarsiNumber(tasks.length)})</span>
                </div>
                <button type="button" class="overdue-toggle-btn" title="تغییر وضعیت نمایش کارهای عقب‌افتاده">${btnText}</button>
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
            applyDeadlinePanelState();
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
                <span>📅 ${headerText} (${toFarsiNumber(items.length)})</span>
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
        } else if (otherOverdueTasks.length > 0) {
            const emptyCurrent = document.createElement("div");
            emptyCurrent.className = "deadline-section-empty";
            emptyCurrent.textContent = isToday
                ? "برای امروز ددلاین جدیدی وجود ندارد."
                : `برای ${formatPersianDeadlineTitle(deadlineKey)} ددلاینی ثبت نشده است.`;
            container.appendChild(emptyCurrent);
        }
    }

    if (isToday) {
        // When viewing today: show overdue tasks from previous days at top, then today's tasks
        renderOtherOverdueSection(listEl, otherOverdueTasks, "کارهای عقب‌افتاده");
        renderCurrentDaySection(listEl, currentDayItems, otherOverdueTasks.length > 0, "کارهای امروز");
    } else {
        // When viewing another day (e.g. a past day or future day):
        // Show the selected day's tasks first (including overdue ones with warning), then other overdue tasks
        renderCurrentDaySection(listEl, currentDayItems, otherOverdueTasks.length > 0, `کارهای ${formatPersianDeadlineTitle(deadlineKey)}`);
        renderOtherOverdueSection(listEl, otherOverdueTasks, "سایر کارهای عقب‌افتاده");
    }

    applyDeadlinePanelState();
}

function renderCalendar() {
    const daysContainer = document.getElementById('daysContainer');
    const monthYearDisplay = document.getElementById('monthYear');
    if (!daysContainer || !monthYearDisplay) return;

    daysContainer.innerHTML = '';
    const deadlineKeys = getAllDeadlineKeys();

    if (currentCalendarType === "gregorian") {
        // GREGORIAN CALENDAR (WITH PERSIAN LABELS)
        monthYearDisplay.textContent = `${monthNamesGregorianPersian[currentGm - 1]} ${toFarsiNumber(currentGy)}`;

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
            const dayKey = formatJalaliKey(j.jy, j.jm, j.jd);

            dayDiv.classList.add('day');
            dayDiv.textContent = toFarsiNumber(i);
            dayDiv.dataset.dateKey = dayKey;
            dayDiv.title = `معادل شمسی: ${toFarsiNumber(j.jd)} ${monthNames[j.jm - 1]} ${toFarsiNumber(j.jy)}`;

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

            if (deadlineKeys.has(dayKey)) {
                dayDiv.classList.add('has-deadline');
                const dotColor = getDayUrgencyColor(dayKey);
                if (dotColor) {
                    dayDiv.style.setProperty('--deadline-dot-color', dotColor);
                }
            }

            if (selectedDeadlineKey === dayKey) {
                dayDiv.classList.add('selected-deadline-day');
            }

            dayDiv.addEventListener("click", () => {
                selectedDeadlineKey = dayKey;
                renderCalendar();
                updateDeadlinePanel(dayKey);
            });

            daysContainer.appendChild(dayDiv);
        }
    } else {
        // JALALI (SHAMSI) CALENDAR
        monthYearDisplay.textContent = `${monthNames[currentJm - 1]} ${toFarsiNumber(currentJy)}`;

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
            const dayKey = formatJalaliKey(currentJy, currentJm, i);
            const g = jalaali.toGregorian(currentJy, currentJm, i);

            dayDiv.classList.add('day');
            dayDiv.textContent = toFarsiNumber(i);
            dayDiv.dataset.dateKey = dayKey;
            dayDiv.title = `معادل میلادی: ${toFarsiNumber(g.gd)} ${monthNamesGregorianPersian[g.gm - 1]} ${toFarsiNumber(g.gy)}`;

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

            if (deadlineKeys.has(dayKey)) {
                dayDiv.classList.add('has-deadline');
                const dotColor = getDayUrgencyColor(dayKey);
                if (dotColor) {
                    dayDiv.style.setProperty('--deadline-dot-color', dotColor);
                }
            }

            if (selectedDeadlineKey === dayKey) {
                dayDiv.classList.add('selected-deadline-day');
            }

            dayDiv.addEventListener("click", () => {
                selectedDeadlineKey = dayKey;
                renderCalendar();
                updateDeadlinePanel(dayKey);
            });

            daysContainer.appendChild(dayDiv);
        }
    }
}

document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentCalendarType === "gregorian") {
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
    if (currentCalendarType === "gregorian") {
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

    if (currentCalendarType === "jalali") {
        currentCalendarType = "gregorian";
        const sel = parseJalaliKey(selectedDeadlineKey);
        if (sel && sel.jy && sel.jm && sel.jd) {
            const g = jalaali.toGregorian(sel.jy, sel.jm, sel.jd);
            currentGy = g.gy;
            currentGm = g.gm;
        } else {
            const g = jalaali.toGregorian(currentJy, currentJm, 1);
            currentGy = g.gy;
            currentGm = g.gm;
        }
    } else {
        currentCalendarType = "jalali";
        const sel = parseJalaliKey(selectedDeadlineKey);
        if (sel && sel.jy && sel.jm) {
            currentJy = sel.jy;
            currentJm = sel.jm;
        } else {
            const j = jalaali.toJalaali(currentGy, currentGm, 1);
            currentJy = j.jy;
            currentJm = j.jm;
        }
    }

    localStorage.setItem("calendarType", currentCalendarType);
    if (typeof isExtension !== "undefined" && isExtension) {
        chrome.storage.local.set({ calendarType: currentCalendarType });
    }

    updateCalendarTypeButton();
    renderCalendar();
    updateDeadlinePanel(selectedDeadlineKey);
}

function updateCalendarTypeButton() {
    const btn = document.getElementById("calendar-type-btn");
    if (btn) {
        btn.title = currentCalendarType === "jalali"
            ? "تقویم فعلی: شمسی (کلیک برای تبدیل به تقویم میلادی)"
            : "تقویم فعلی: میلادی (کلیک برای تبدیل به تقویم شمسی)";
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

    toggleBtn.innerText = isMinimized
        ? '+ نمایش تقویم'
        : '− بستن تقویم';

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
            if (e.target.closest('#calendar-type-btn')) return;
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
