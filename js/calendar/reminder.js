//////////////////////////////////////////////////////////////////
// ---------------------------------------------------------------
//   REMINDER BELL & 3-WEEK DEADLINE SYSTEM (سیستم یادآور ۳ هفته‌ای)
// ---------------------------------------------------------------
//////////////////////////////////////////////////////////////////

let activeReminderFilter = "all"; // "all" | "urgent" | "thisWeek" | "nextWeek" | "lastWeek"

function getThreeWeeksDateRange(refDate = new Date()) {
    const d = new Date(refDate);
    d.setHours(12, 0, 0, 0);

    const isLtr = document.documentElement.getAttribute("dir") !== "rtl";
    const jsDay = d.getDay(); // 0: Sun, 1: Mon ... 6: Sat

    // In Persian/Arabic (RTL), week starts on Saturday.
    // In English/Korean (LTR), week starts on Sunday.
    let daysSinceWeekStart;
    if (!isLtr) {
        // Saturday = 0 days ago, Sunday = 1 day ago ... Friday = 6 days ago
        daysSinceWeekStart = (jsDay + 1) % 7;
    } else {
        // Sunday = 0 days ago
        daysSinceWeekStart = jsDay;
    }

    const currentWeekStart = new Date(d);
    currentWeekStart.setDate(d.getDate() - daysSinceWeekStart);
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(currentWeekStart.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);

    const lastWeekEnd = new Date(currentWeekStart);
    lastWeekEnd.setMilliseconds(-1);

    const nextWeekStart = new Date(currentWeekEnd);
    nextWeekStart.setMilliseconds(1);

    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    nextWeekEnd.setHours(23, 59, 59, 999);

    return {
        lastWeekStart,
        lastWeekEnd,
        currentWeekStart,
        currentWeekEnd,
        nextWeekStart,
        nextWeekEnd
    };
}

function getThreeWeekDeadlines() {
    const range = getThreeWeeksDateRange();
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const overdue = [];
    const today = [];
    const thisWeekRemaining = [];
    const nextWeek = [];
    const lastWeek = [];

    if (typeof notes === "undefined" || !Array.isArray(notes)) {
        return { overdue, today, thisWeekRemaining, nextWeek, lastWeek, totalActive: 0, range };
    }

    notes.forEach((note, noteIndex) => {
        if (note.deletedAt) return;
        (note.tasks || []).forEach((task, taskIndex) => {
            const rawKey = (typeof getTaskDeadlineKey === "function")
                ? getTaskDeadlineKey(task)
                : (task.deadline || null);
            if (!rawKey) return;

            const parsed = (typeof parseAnyDeadlineKey === "function")
                ? parseAnyDeadlineKey(rawKey)
                : null;
            if (!parsed || !parsed.gDate) return;

            const gDate = parsed.gDate;
            const deadlineEnd = new Date(gDate.getFullYear(), gDate.getMonth(), gDate.getDate(), 23, 59, 59, 999).getTime();
            const diffDays = Math.round((deadlineEnd - now) / 86400000);

            const item = {
                note,
                noteIndex,
                task,
                taskIndex,
                deadlineKey: rawKey,
                parsed,
                gDate,
                deadlineEnd,
                diffDays,
                isChecked: !!task.checked
            };

            const isDone = !!task.checked;

            if (!isDone && deadlineEnd < todayStart.getTime()) {
                // Any unchecked deadline in the past is overdue
                overdue.push(item);
            } else if (deadlineEnd >= todayStart.getTime() && deadlineEnd <= todayEnd.getTime()) {
                // Due today
                today.push(item);
            } else if (deadlineEnd > todayEnd.getTime() && deadlineEnd <= range.currentWeekEnd.getTime()) {
                // Rest of current week
                thisWeekRemaining.push(item);
            } else if (deadlineEnd >= range.nextWeekStart.getTime() && deadlineEnd <= range.nextWeekEnd.getTime()) {
                // Next week
                nextWeek.push(item);
            } else if (deadlineEnd >= range.lastWeekStart.getTime() && deadlineEnd <= range.lastWeekEnd.getTime()) {
                // Previous week
                lastWeek.push(item);
            }
        });
    });

    // Sort overdue by oldest first
    overdue.sort((a, b) => a.deadlineEnd - b.deadlineEnd);
    // Sort upcoming by closest first
    today.sort((a, b) => a.deadlineEnd - b.deadlineEnd);
    thisWeekRemaining.sort((a, b) => a.deadlineEnd - b.deadlineEnd);
    nextWeek.sort((a, b) => a.deadlineEnd - b.deadlineEnd);
    // Sort last week by newest first
    lastWeek.sort((a, b) => b.deadlineEnd - a.deadlineEnd);

    const totalActive = overdue.filter(x => !x.isChecked).length +
                        today.filter(x => !x.isChecked).length +
                        thisWeekRemaining.filter(x => !x.isChecked).length;

    return {
        overdue,
        today,
        thisWeekRemaining,
        nextWeek,
        lastWeek,
        totalActive,
        range
    };
}

function updateReminderBell() {
    const bellBtn = document.getElementById("reminder-bell-btn");
    const badge = document.getElementById("reminder-bell-badge");
    if (!bellBtn || !badge) return;

    const data = getThreeWeekDeadlines();
    const urgentCount = data.overdue.filter(x => !x.isChecked).length +
                        data.today.filter(x => !x.isChecked).length;
    const totalCount = data.totalActive;

    const fd = (typeof toFarsiNumber === "function" && (currentLanguage === "fa" || currentLanguage === "ar"))
        ? toFarsiNumber
        : (x => x);

    if (totalCount > 0) {
        badge.classList.remove("hidden");
        badge.textContent = fd(totalCount);
    } else {
        badge.classList.add("hidden");
        badge.textContent = "0";
    }

    if (urgentCount > 0) {
        bellBtn.classList.add("has-urgent");
        badge.classList.add("urgent");
    } else {
        bellBtn.classList.remove("has-urgent");
        badge.classList.remove("urgent");
    }
}

// ----------------------
//   REMINDER MODAL UI
// ----------------------

function openReminderModal() {
    let modal = document.getElementById("reminder-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "reminder-modal";
        modal.className = "reminder-modal";
        document.body.appendChild(modal);
    }

    renderReminderModalContent(modal);
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
}

function closeReminderModal() {
    const modal = document.getElementById("reminder-modal");
    if (modal) {
        modal.classList.add("hidden");
    }
    document.body.classList.remove("modal-open");
}

function renderReminderModalContent(modal) {
    const data = getThreeWeekDeadlines();
    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const remDict = dict && dict.reminder ? dict.reminder : null;
    const fd = (typeof toFarsiNumber === "function" && (currentLanguage === "fa" || currentLanguage === "ar"))
        ? toFarsiNumber
        : (x => x);

    const titleText = remDict ? remDict.modalTitle : "یادآور ددلاین‌ها (۳ هفته)";
    const closeTitle = remDict ? remDict.close : "بستن";

    // Format range string
    const rangeStr = formatThreeWeeksRangeLabel(data.range);

    const overdueCount = data.overdue.filter(x => !x.isChecked).length;
    const todayCount = data.today.filter(x => !x.isChecked).length;
    const thisWeekCount = data.thisWeekRemaining.filter(x => !x.isChecked).length;
    const nextWeekCount = data.nextWeek.filter(x => !x.isChecked).length;

    modal.innerHTML = `
        <div class="reminder-modal-backdrop" id="reminder-modal-backdrop"></div>
        <div class="reminder-modal-content">
            <div class="reminder-modal-header">
                <div class="reminder-header-title">
                    <span class="reminder-header-icon">🔔</span>
                    <div>
                        <h3>${titleText}</h3>
                        <span class="reminder-header-sub">${rangeStr}</span>
                    </div>
                </div>
                <button type="button" class="close-reminder-modal-btn" id="btn-close-reminder-modal" title="${closeTitle}">✕</button>
            </div>

            <!-- Urgent KPI Bar -->
            <div class="reminder-kpi-bar">
                <div class="reminder-kpi-chip overdue ${overdueCount > 0 ? 'active' : ''}">
                    <span class="kpi-dot">🔴</span>
                    <span class="kpi-label">${remDict ? remDict.kpiOverdue : 'معوقه'}:</span>
                    <span class="kpi-val">${fd(overdueCount)}</span>
                </div>
                <div class="reminder-kpi-chip today ${todayCount > 0 ? 'active' : ''}">
                    <span class="kpi-dot">🟡</span>
                    <span class="kpi-label">${remDict ? remDict.kpiToday : 'امروز'}:</span>
                    <span class="kpi-val">${fd(todayCount)}</span>
                </div>
                <div class="reminder-kpi-chip this-week ${thisWeekCount > 0 ? 'active' : ''}">
                    <span class="kpi-dot">🟢</span>
                    <span class="kpi-label">${remDict ? remDict.kpiThisWeek : 'این هفته'}:</span>
                    <span class="kpi-val">${fd(thisWeekCount)}</span>
                </div>
                <div class="reminder-kpi-chip next-week ${nextWeekCount > 0 ? 'active' : ''}">
                    <span class="kpi-dot">🔵</span>
                    <span class="kpi-label">${remDict ? remDict.kpiNextWeek : 'هفته آینده'}:</span>
                    <span class="kpi-val">${fd(nextWeekCount)}</span>
                </div>
            </div>

            <!-- Filter Tabs -->
            <div class="reminder-filter-tabs">
                <button type="button" class="reminder-tab-btn ${activeReminderFilter === 'all' ? 'active' : ''}" data-filter="all">
                    ${remDict ? remDict.tabAll : 'همه موارد'}
                </button>
                <button type="button" class="reminder-tab-btn ${activeReminderFilter === 'urgent' ? 'active' : ''}" data-filter="urgent">
                    ${remDict ? remDict.tabUrgent : 'فوری (معوقه و امروز)'}
                    ${(overdueCount + todayCount) > 0 ? `<span class="tab-badge">${fd(overdueCount + todayCount)}</span>` : ''}
                </button>
                <button type="button" class="reminder-tab-btn ${activeReminderFilter === 'thisWeek' ? 'active' : ''}" data-filter="thisWeek">
                    ${remDict ? remDict.tabThisWeek : 'کل این هفته'}
                </button>
                <button type="button" class="reminder-tab-btn ${activeReminderFilter === 'nextWeek' ? 'active' : ''}" data-filter="nextWeek">
                    ${remDict ? remDict.tabNextWeek : 'هفته آینده'}
                </button>
                <button type="button" class="reminder-tab-btn ${activeReminderFilter === 'lastWeek' ? 'active' : ''}" data-filter="lastWeek">
                    ${remDict ? remDict.tabLastWeek : 'هفته گذشته'}
                </button>
            </div>

            <!-- Tasks List Body -->
            <div class="reminder-modal-body" id="reminder-modal-body">
                <!-- Injected via renderFilteredReminderTasks -->
            </div>
        </div>
    `;

    // Bind listeners
    modal.querySelector("#reminder-modal-backdrop").addEventListener("click", closeReminderModal);
    modal.querySelector("#btn-close-reminder-modal").addEventListener("click", closeReminderModal);

    modal.querySelectorAll(".reminder-tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            activeReminderFilter = e.currentTarget.dataset.filter;
            modal.querySelectorAll(".reminder-tab-btn").forEach(b => b.classList.toggle("active", b.dataset.filter === activeReminderFilter));
            renderFilteredReminderTasks(data);
        });
    });

    renderFilteredReminderTasks(data);
}

function formatThreeWeeksRangeLabel(range) {
    if (!range) return "";
    const fd = (typeof toFarsiNumber === "function" && (currentLanguage === "fa" || currentLanguage === "ar"))
        ? toFarsiNumber
        : (x => x);

    if (currentLanguage === "fa" && typeof jalaali !== "undefined") {
        const jStart = jalaali.toJalaali(range.lastWeekStart);
        const jEnd = jalaali.toJalaali(range.nextWeekEnd);
        return `بازه ۳ هفته: از ${fd(jStart.jd)} ${getJalaliMonthName(jStart.jm)} تا ${fd(jEnd.jd)} ${getJalaliMonthName(jEnd.jm)} ${fd(jEnd.jy)}`;
    }
    // Default Gregorian format
    const sStr = range.lastWeekStart.toLocaleDateString(currentLanguage || "en", { month: "short", day: "numeric" });
    const eStr = range.nextWeekEnd.toLocaleDateString(currentLanguage || "en", { month: "short", day: "numeric", year: "numeric" });
    return `${sStr} – ${eStr}`;
}

function getJalaliMonthName(jm) {
    const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
    return months[jm - 1] || "";
}

function renderFilteredReminderTasks(data) {
    const body = document.getElementById("reminder-modal-body");
    if (!body) return;

    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const remDict = dict && dict.reminder ? dict.reminder : null;

    let sections = [];

    if (activeReminderFilter === "all") {
        sections = [
            { key: "overdue", title: remDict ? remDict.secOverdue : "⚠️ ددلاین‌های گذشته (اقدام فوری)", items: data.overdue, badgeClass: "overdue" },
            { key: "today", title: remDict ? remDict.secToday : "⏰ ددلاین‌های امروز", items: data.today, badgeClass: "today" },
            { key: "thisWeek", title: remDict ? remDict.secThisWeek : "📅 روزهای آینده این هفته", items: data.thisWeekRemaining, badgeClass: "this-week" },
            { key: "nextWeek", title: remDict ? remDict.secNextWeek : "🚀 ددلاین‌های هفته آینده", items: data.nextWeek, badgeClass: "next-week" },
            { key: "lastWeek", title: remDict ? remDict.secLastWeek : "📋 کارهای هفته گذشته", items: data.lastWeek, badgeClass: "last-week" }
        ];
    } else if (activeReminderFilter === "urgent") {
        sections = [
            { key: "overdue", title: remDict ? remDict.secOverdue : "⚠️ ددلاین‌های گذشته (اقدام فوری)", items: data.overdue, badgeClass: "overdue" },
            { key: "today", title: remDict ? remDict.secToday : "⏰ ددلاین‌های امروز", items: data.today, badgeClass: "today" }
        ];
    } else if (activeReminderFilter === "thisWeek") {
        sections = [
            { key: "today", title: remDict ? remDict.secToday : "⏰ امروز", items: data.today, badgeClass: "today" },
            { key: "thisWeek", title: remDict ? remDict.secThisWeek : "📅 روزهای باقی‌مانده این هفته", items: data.thisWeekRemaining, badgeClass: "this-week" }
        ];
    } else if (activeReminderFilter === "nextWeek") {
        sections = [
            { key: "nextWeek", title: remDict ? remDict.secNextWeek : "🚀 ددلاین‌های هفته آینده", items: data.nextWeek, badgeClass: "next-week" }
        ];
    } else if (activeReminderFilter === "lastWeek") {
        sections = [
            { key: "lastWeek", title: remDict ? remDict.secLastWeek : "📋 کارهای هفته گذشته", items: data.lastWeek, badgeClass: "last-week" }
        ];
    }

    let totalVisible = 0;
    sections.forEach(s => totalVisible += s.items.length);

    if (totalVisible === 0) {
        body.innerHTML = `
            <div class="reminder-empty-state">
                <div class="reminder-empty-icon">🎉</div>
                <h4>${remDict ? remDict.emptyTitle : 'هیچ ددلاینی در این بازه یافت نشد!'}</h4>
                <p>${remDict ? remDict.emptyDesc : 'همه کارهای شما به موقع انجام شده‌اند یا ددلاینی برای این بازه تعریف نشده است.'}</p>
            </div>
        `;
        return;
    }

    let html = "";
    sections.forEach(sec => {
        if (sec.items.length === 0) return;

        html += `
            <div class="reminder-section ${sec.badgeClass}">
                <div class="reminder-section-header">
                    <h4>${sec.title}</h4>
                    <span class="reminder-section-count">${sec.items.length}</span>
                </div>
                <div class="reminder-items-grid">
        `;

        sec.items.forEach(item => {
            const isChecked = !!item.task.checked;
            const noteColorClass = item.note.colorClass || "color-0";
            const noteTitle = item.note.title || (remDict ? remDict.untitledNote : "یادداشت بدون عنوان");
            const taskText = item.task.text || (remDict ? remDict.emptyTask : "تسک بدون عنوان");
            const relativeDateText = getRelativeDeadlineLabel(item);
            const formattedDate = (typeof formatDayTitleForCurrentCalendar === "function")
                ? formatDayTitleForCurrentCalendar(item.deadlineKey, true)
                : item.deadlineKey;

            html += `
                <div class="reminder-task-card ${noteColorClass} ${isChecked ? 'is-done' : ''} ${sec.key === 'overdue' && !isChecked ? 'is-overdue' : ''}" data-note-index="${item.noteIndex}" data-task-index="${item.taskIndex}">
                    <div class="reminder-card-side-bar"></div>
                    <div class="reminder-card-body">
                        <div class="reminder-card-top">
                            <label class="reminder-checkbox-wrap">
                                <input type="checkbox" class="reminder-task-checkbox" ${isChecked ? 'checked' : ''}>
                                <span class="reminder-task-text">${escapeHTML(taskText)}</span>
                            </label>
                            <button type="button" class="reminder-jump-btn" title="${remDict ? remDict.jumpToNote : 'مشاهده روی برگه'}">
                                ↗
                            </button>
                        </div>
                        <div class="reminder-card-meta">
                            <span class="reminder-note-badge" title="${escapeHTML(noteTitle)}">
                                📋 ${escapeHTML(noteTitle)}
                            </span>
                            <span class="reminder-date-pill ${sec.key}" title="${formattedDate}">
                                ${relativeDateText}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    body.innerHTML = html;

    // Attach card event listeners
    body.querySelectorAll(".reminder-task-card").forEach(card => {
        const noteIndex = Number(card.dataset.noteIndex);
        const taskIndex = Number(card.dataset.taskIndex);

        // Checkbox toggle
        const checkbox = card.querySelector(".reminder-task-checkbox");
        if (checkbox) {
            checkbox.addEventListener("change", (e) => {
                e.stopPropagation();
                if (notes[noteIndex] && notes[noteIndex].tasks[taskIndex]) {
                    notes[noteIndex].tasks[taskIndex].checked = checkbox.checked;
                    if (typeof saveNotes === "function") saveNotes();
                    if (typeof renderAllNotes === "function") renderAllNotes();
                    if (typeof updateDeadlinePanel === "function" && typeof selectedDeadlineKey !== "undefined") {
                        updateDeadlinePanel(selectedDeadlineKey);
                    }
                    if (typeof updateReminderBell === "function") updateReminderBell();

                    // Re-render modal in place
                    renderFilteredReminderTasks(getThreeWeekDeadlines());
                }
            });
        }

        // Jump to note on fridge
        const jumpBtn = card.querySelector(".reminder-jump-btn");
        if (jumpBtn) {
            jumpBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                jumpToNoteOnFridge(noteIndex, taskIndex);
            });
        }
    });
}

function getRelativeDeadlineLabel(item) {
    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const remDict = dict && dict.reminder ? dict.reminder : null;
    const fd = (typeof toFarsiNumber === "function" && (currentLanguage === "fa" || currentLanguage === "ar"))
        ? toFarsiNumber
        : (x => x);

    const now = new Date();
    now.setHours(12, 0, 0, 0);
    const target = new Date(item.gDate);
    target.setHours(12, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - now.getTime()) / 86400000);

    if (diffDays === 0) return remDict ? remDict.relToday : "امروز";
    if (diffDays === 1) return remDict ? remDict.relTomorrow : "فردا";
    if (diffDays === 2) return remDict ? remDict.relDayAfter : "پس‌فردا";
    if (diffDays === -1) return remDict ? remDict.relYesterday : "دیروز";

    if (diffDays > 0) {
        if (remDict && typeof remDict.relInDays === "function") {
            return remDict.relInDays(fd(diffDays));
        }
        return `${fd(diffDays)} روز دیگر`;
    } else {
        const absDays = Math.abs(diffDays);
        if (remDict && typeof remDict.relDaysAgo === "function") {
            return remDict.relDaysAgo(fd(absDays));
        }
        return `${fd(absDays)} روز پیش`;
    }
}

function jumpToNoteOnFridge(noteIndex, taskIndex) {
    closeReminderModal();

    // Look for note paper element
    const noteEl = document.querySelector(`.note-wrapper[data-note-id="${notes[noteIndex]?.id}"]`) ||
                   document.querySelectorAll(`.note-wrapper`)[noteIndex];

    if (noteEl) {
        noteEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

        // Add vibrant pulse highlight
        noteEl.classList.add("note-jump-highlight");
        setTimeout(() => {
            noteEl.classList.remove("note-jump-highlight");
        }, 2200);

        // Highlight specific task if found
        const taskInputs = noteEl.querySelectorAll(".note-task-text");
        if (taskInputs && taskInputs[taskIndex]) {
            taskInputs[taskIndex].focus();
        }
    }
}

// ----------------------
//   INITIALIZATION
// ----------------------

function initReminderBellUI() {
    const bellBtn = document.getElementById("reminder-bell-btn");
    if (bellBtn) {
        bellBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openReminderModal();
        });
    }

    setTimeout(updateReminderBell, 600);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReminderBellUI);
} else {
    initReminderBellUI();
}

// Periodic refresh every 60 seconds
setInterval(() => {
    if (typeof updateReminderBell === "function") {
        updateReminderBell();
    }
}, 60000);

window.updateReminderBell = updateReminderBell;
window.openReminderModal = openReminderModal;
window.closeReminderModal = closeReminderModal;
