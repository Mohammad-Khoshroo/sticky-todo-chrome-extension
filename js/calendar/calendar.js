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

let currentGregorianDate = new Date();
let todayJalali = jalaali.toJalaali(currentGregorianDate);

let currentJy = todayJalali.jy;
let currentJm = todayJalali.jm;
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
    return `${toFarsiNumber(jd)} ${monthNames[jm - 1]} ${toFarsiNumber(jy)}`;
}

const DEADLINE_EXPAND_THRESHOLD = 2;
const STANDARD_DEADLINE_LIST_MAX_HEIGHT = 220;

let isDeadlinePanelUserCollapsed = false;
let currentPanelDeadlineKey = null;
let previousDeadlineItemsCount = 0;

function getAvailableDeadlineListHeight() {
    const eraser = document.getElementById("eraser");
    const pen = document.getElementById("pen");
    const deadlineList = document.getElementById("deadline-list");
    const deadlinePanel = document.getElementById("deadline-panel");

    if (!deadlineList) return STANDARD_DEADLINE_LIST_MAX_HEIGHT;

    // Bottom barrier: top of eraser or pen
    let barrier = window.innerHeight - 110;
    if (eraser && pen) {
        const eraserTop = eraser.getBoundingClientRect().top;
        const penTop = pen.getBoundingClientRect().top;
        barrier = Math.min(eraserTop, penTop);
    } else if (eraser) {
        barrier = eraser.getBoundingClientRect().top;
    } else if (pen) {
        barrier = pen.getBoundingClientRect().top;
    }

    // Leave a comfortable gap of 20px above eraser & pen
    const targetBottom = barrier - 20;

    // Current top of deadlineList
    const listRect = deadlineList.getBoundingClientRect();
    let listTop = listRect.top;

    if (!listTop || listTop <= 0) {
        const panelRect = deadlinePanel ? deadlinePanel.getBoundingClientRect() : null;
        if (panelRect && panelRect.top > 0) {
            listTop = panelRect.top + 42;
        } else {
            const calendarEl = document.getElementById("calendar");
            const calHeight = (calendarEl && !calendarEl.classList.contains("minimized")) ? 445 : 38;
            listTop = 30 + calHeight + 10 + 42;
        }
    }

    const available = Math.floor(targetBottom - listTop);
    return Math.max(available, 140);
}

function applyDeadlinePanelState() {
    const toggleBtn = document.getElementById("deadline-panel-toggle-btn");
    const listEl = document.getElementById("deadline-list");

    if (!toggleBtn || !listEl) return;

    const items = getTasksByDeadlineKey(selectedDeadlineKey);
    const hasManyItems = items.length > DEADLINE_EXPAND_THRESHOLD;

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

function updateDeadlinePanel(deadlineKey) {
    const titleEl = document.getElementById("deadline-panel-title");
    const listEl = document.getElementById("deadline-list");

    if (!titleEl || !listEl) return;

    if (currentPanelDeadlineKey !== deadlineKey) {
        currentPanelDeadlineKey = deadlineKey;
        isDeadlinePanelUserCollapsed = false;
        previousDeadlineItemsCount = 0;
    }

    const items = getTasksByDeadlineKey(deadlineKey);

    if (items.length > previousDeadlineItemsCount && items.length > DEADLINE_EXPAND_THRESHOLD) {
        isDeadlinePanelUserCollapsed = false;
    }
    previousDeadlineItemsCount = items.length;

    const titleText = `ددلاین‌های ${formatPersianDeadlineTitle(deadlineKey)}`;
    titleEl.textContent = titleText;
    titleEl.title = titleText;
    listEl.innerHTML = "";

    if (!items.length) {
        listEl.innerHTML = `<div class="deadline-empty">ددلاینی برای این روز وجود ندارد</div>`;
        applyDeadlinePanelState();
        return;
    }

    items.forEach(({ note, task, noteIndex }) => {
        const item = document.createElement("div");
        item.className = `deadline-item ${task.checked ? "done" : ""}`;

        item.innerHTML = `
            <div class="deadline-item-note">${escapeHTML(note.title?.trim() || "بدون عنوان")}</div>
            <div class="deadline-item-text">${escapeHTML(task.text?.trim() || "(بدون متن)")}</div>
        `;

        item.addEventListener("click", () => {
            activeNoteIndex = noteIndex;
            renderAllNotes();
        });

        listEl.appendChild(item);
    });

    applyDeadlinePanelState();
}

function renderCalendar(jy, jm) {
    const daysContainer = document.getElementById('daysContainer');
    const monthYearDisplay = document.getElementById('monthYear');

    daysContainer.innerHTML = '';
    monthYearDisplay.textContent = `${monthNames[jm - 1]} ${toFarsiNumber(jy)}`;

    const deadlineKeys = getAllDeadlineKeys();

    const firstDayGregorian = jalaali.toGregorian(jy, jm, 1);
    const dateObj = new Date(
        firstDayGregorian.gy,
        firstDayGregorian.gm - 1,
        firstDayGregorian.gd
    );

    let firstDayOfWeek = dateObj.getDay() + 1;
    if (firstDayOfWeek === 7) firstDayOfWeek = 0;

    const monthLength = jalaali.jalaaliMonthLength(jy, jm);

    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day', 'empty');
        daysContainer.appendChild(emptyDiv);
    }

    for (let i = 1; i <= monthLength; i++) {
        const dayDiv = document.createElement('div');
        const dayKey = formatJalaliKey(jy, jm, i);

        dayDiv.classList.add('day');
        dayDiv.textContent = toFarsiNumber(i);
        dayDiv.dataset.dateKey = dayKey;

        if ((firstDayOfWeek + i - 1) % 7 === 6) {
            dayDiv.classList.add('friday');
        }

        if (
            jy === todayJalali.jy &&
            jm === todayJalali.jm &&
            i === todayJalali.jd
        ) {
            dayDiv.classList.add('today');
        }

        if (deadlineKeys.has(dayKey)) {
            dayDiv.classList.add('has-deadline');
        }

        if (selectedDeadlineKey === dayKey) {
            dayDiv.classList.add('selected-deadline-day');
        }

        dayDiv.addEventListener("click", () => {
            selectedDeadlineKey = dayKey;
            renderCalendar(currentJy, currentJm);
            updateDeadlinePanel(dayKey);
        });

        daysContainer.appendChild(dayDiv);
    }
}

document.getElementById('prevBtn').addEventListener('click', () => {
    currentJm--;

    if (currentJm < 1) {
        currentJm = 12;
        currentJy--;
    }

    renderCalendar(currentJy, currentJm);
});

document.getElementById('nextBtn').addEventListener('click', () => {
    currentJm++;

    if (currentJm > 12) {
        currentJm = 1;
        currentJy++;
    }

    renderCalendar(currentJy, currentJm);
});

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

    toggleBtn.addEventListener('click', function () {
        const isMinimized = !calendar.classList.contains('minimized');

        applyCalendarState(isMinimized);
        saveCalendarState(isMinimized);
    });
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

renderCalendar(currentJy, currentJm);
updateDeadlinePanel(selectedDeadlineKey);
