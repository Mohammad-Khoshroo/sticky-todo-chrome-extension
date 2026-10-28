//////////////////////////////////////////////////////////////////
// ----------------------
//   DAILY ROUTINES & HABITS
// ----------------------

let routines = [];

function loadRoutines() {
    try {
        const saved = localStorage.getItem("fridgeRoutines");
        if (saved) {
            routines = JSON.parse(saved);
            let changed = false;
            routines.forEach(r => {
                if (!r.startDate) {
                    if (r.anchorDate) {
                        r.startDate = r.anchorDate;
                    } else if (r.createdAt) {
                        r.startDate = r.createdAt.slice(0, 10);
                    } else {
                        const match = String(r.id).match(/^routine_(\d{10,13})/);
                        if (match) {
                            const d = new Date(parseInt(match[1], 10));
                            const gy = d.getFullYear(), gm = String(d.getMonth() + 1).padStart(2, "0"), gd = String(d.getDate()).padStart(2, "0");
                            r.startDate = `${gy}-${gm}-${gd}`;
                        } else {
                            const now = new Date();
                            const gy = now.getFullYear(), gm = String(now.getMonth() + 1).padStart(2, "0"), gd = String(now.getDate()).padStart(2, "0");
                            r.startDate = `${gy}-${gm}-${gd}`;
                        }
                    }
                    changed = true;
                }
                if (!r.anchorDate) {
                    r.anchorDate = r.startDate;
                    changed = true;
                }
                if (!r.createdAt) {
                    r.createdAt = r.startDate ? (r.startDate + "T00:00:00.000Z") : new Date().toISOString();
                    changed = true;
                }
                if (r.isTimed === undefined) {
                    r.isTimed = false;
                    changed = true;
                }
                if (r.targetDurationMinutes === undefined) {
                    r.targetDurationMinutes = 60;
                    changed = true;
                }
                if (!r.onCloseBehavior) {
                    r.onCloseBehavior = "ask";
                    changed = true;
                }
                if (!r.timerLogs) {
                    r.timerLogs = {};
                    changed = true;
                }
            });
            if (changed) {
                saveRoutines();
            }
        } else {
            // Default introductory routines
            routines = [
                {
                    id: "routine_def_1",
                    title: "ورزش و نرمش روزانه",
                    pattern: "daily",
                    intervalDays: 1,
                    anchorDate: "2026-10-01",
                    startDate: "2026-10-01",
                    createdAt: "2026-10-01T00:00:00.000Z",
                    weeklyDays: [0, 1, 2, 3, 4, 5, 6],
                    monthlyDay: 1,
                    completedDates: {},
                    isTimed: false,
                    targetDurationMinutes: 60,
                    onCloseBehavior: "ask",
                    timerLogs: {}
                },
                {
                    id: "routine_def_2",
                    title: "مطالعه کتاب (۳۰ دقیقه)",
                    pattern: "interval",
                    intervalDays: 2, // Every other day
                    anchorDate: "2026-10-01",
                    startDate: "2026-10-01",
                    createdAt: "2026-10-01T00:00:00.000Z",
                    weeklyDays: [0, 2, 4],
                    monthlyDay: 1,
                    completedDates: {},
                    isTimed: true,
                    targetDurationMinutes: 30,
                    onCloseBehavior: "ask",
                    timerLogs: {}
                },
                {
                    id: "routine_def_3",
                    title: "برنامه‌ریزی هفتگی",
                    pattern: "weekly",
                    intervalDays: 1,
                    anchorDate: "2026-10-01",
                    startDate: "2026-10-01",
                    createdAt: "2026-10-01T00:00:00.000Z",
                    weeklyDays: [0], // Saturday only
                    monthlyDay: 1,
                    completedDates: {},
                    isTimed: false,
                    targetDurationMinutes: 60,
                    onCloseBehavior: "ask",
                    timerLogs: {}
                }
            ];
            saveRoutines();
        }
    } catch (e) {
        routines = [];
    }
}

function saveRoutines() {
    try {
        localStorage.setItem("fridgeRoutines", JSON.stringify(routines));
        if (typeof isExtension !== "undefined" && isExtension) {
            chrome.storage.local.set({ fridgeRoutines: routines });
        }
    } catch (e) {}
}

function getRoutineStartDate(routine) {
    if (!routine) return null;

    if (routine.startDate) {
        const parts = String(routine.startDate).split("-");
        if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            return new Date(y, m, d, 0, 0, 0, 0);
        }
        const parsed = new Date(routine.startDate);
        if (!isNaN(parsed.getTime())) {
            return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
        }
    }

    if (routine.createdAt) {
        const parsed = new Date(routine.createdAt);
        if (!isNaN(parsed.getTime())) {
            return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
        }
    }

    if (routine.anchorDate) {
        const parts = String(routine.anchorDate).split("-");
        if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            return new Date(y, m, d, 0, 0, 0, 0);
        }
        const parsed = new Date(routine.anchorDate);
        if (!isNaN(parsed.getTime())) {
            return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
        }
    }

    if (typeof routine.id === "string") {
        const match = routine.id.match(/^routine_(\d{10,13})/);
        if (match) {
            const parsed = new Date(parseInt(match[1], 10));
            if (!isNaN(parsed.getTime())) {
                return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
            }
        }
    }

    return null;
}

function isRoutineCompletedOnDate(routine, dayJalaliKey, gDate) {
    if (!routine) return false;
    if (routine.completedDates) {
        if (dayJalaliKey && routine.completedDates[dayJalaliKey]) return true;

        if (gDate) {
            const gy = gDate.getFullYear(), gm = String(gDate.getMonth() + 1).padStart(2, "0"), gd = String(gDate.getDate()).padStart(2, "0");
            const gKey = `${gy}-${gm}-${gd}`;
            if (routine.completedDates[gKey]) return true;

            if (typeof jalaali !== "undefined") {
                const j = jalaali.toJalaali(gDate);
                const jKey = formatJalaliKey(j.jy, j.jm, j.jd);
                if (routine.completedDates[jKey]) return true;
            }
        }
    }

    // Check if timed routine reached target duration on this date
    if (routine.isTimed && routine.targetDurationMinutes && routine.timerLogs) {
        let log = null;
        if (gDate) {
            const gy = gDate.getFullYear(), gm = String(gDate.getMonth() + 1).padStart(2, "0"), gd = String(gDate.getDate()).padStart(2, "0");
            const gKey = `${gy}-${gm}-${gd}`;
            log = routine.timerLogs[gKey];
        }
        if (!log && dayJalaliKey) {
            log = routine.timerLogs[dayJalaliKey];
        }
        if (log) {
            const live = (log.elapsedSeconds || 0) + ((log.isRunning && log.lastStartedAt) ? Math.floor((Date.now() - log.lastStartedAt) / 1000) : 0);
            if (live >= (routine.targetDurationMinutes * 60)) {
                return true;
            }
        }
    }

    return false;
}

function isRoutineScheduledForDate(routine, gDate) {
    if (!routine || !gDate) return false;

    // 1. If explicitly completed on this date (e.g. retroactive check), it counts as scheduled and completed
    if (isRoutineCompletedOnDate(routine, null, gDate)) {
        return true;
    }

    // 2. Check if the target date is strictly before the routine was created / started
    const startDate = getRoutineStartDate(routine);
    if (startDate) {
        const targetDate = new Date(gDate.getFullYear(), gDate.getMonth(), gDate.getDate(), 0, 0, 0, 0);
        if (targetDate.getTime() < startDate.getTime()) {
            // Target date is before the routine existed; DO NOT count or calculate as missed!
            return false;
        }
    }

    // 3. Pattern checking for active routine
    const pattern = routine.pattern || "daily";

    if (pattern === "daily") {
        return true;
    }

    if (pattern === "interval") {
        const interval = Math.max(1, parseInt(routine.intervalDays, 10) || 1);
        const anchor = routine.anchorDate ? new Date(routine.anchorDate + "T12:00:00Z") : (startDate || new Date(Date.UTC(2026, 9, 1, 12, 0, 0)));
        const target = new Date(Date.UTC(gDate.getFullYear(), gDate.getMonth(), gDate.getDate(), 12, 0, 0));
        const diffDays = Math.round((target.getTime() - anchor.getTime()) / 86400000);
        return diffDays >= 0 && (diffDays % interval === 0);
    }

    if (pattern === "weekly") {
        const days = Array.isArray(routine.weeklyDays) ? routine.weeklyDays : [];
        const jsDay = gDate.getDay();
        const saturdayIndex = (jsDay + 1) % 7; // Saturday = 0, Sunday = 1 ... Friday = 6
        return days.includes(saturdayIndex);
    }

    if (pattern === "monthly") {
        const targetDay = parseInt(routine.monthlyDay, 10) || 1;
        if (typeof currentCalendarType !== "undefined" && currentCalendarType === "jalali" && typeof jalaali !== "undefined") {
            const j = jalaali.toJalaali(gDate);
            return j.jd === targetDay;
        } else if (typeof currentCalendarType !== "undefined" && currentCalendarType === "hijri" && typeof getHijriParts === "function") {
            const h = getHijriParts(gDate);
            return h.hd === targetDay;
        }
        return gDate.getDate() === targetDay;
    }

    return true;
}

const ROUTINE_EDIT_WINDOW_DAYS = 7;

function isDateLockedForRoutineEditing(gDate) {
    if (!gDate) return false;
    let d = gDate;
    if (!(d instanceof Date)) {
        if (typeof parseAnyDeadlineKey === "function") {
            const p = parseAnyDeadlineKey(d);
            if (p && p.gDate) d = p.gDate;
            else if (typeof d === "string" && d.includes("-")) {
                const parts = d.split("-").map(Number);
                d = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
                d = new Date(d);
            }
        } else if (typeof d === "string" && d.includes("-")) {
            const parts = d.split("-").map(Number);
            d = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
            d = new Date(d);
        }
    }
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

    // Dates in the future are not older than 7 days
    if (targetDate.getTime() > todayStart.getTime()) {
        return false;
    }

    const diffDays = Math.round((todayStart.getTime() - targetDate.getTime()) / 86400000);
    return diffDays > ROUTINE_EDIT_WINDOW_DAYS;
}

function toggleRoutineCompletion(routineId, dayJalaliKey, gDate) {
    let targetGDate = gDate;
    if (!targetGDate && dayJalaliKey && typeof parseAnyDeadlineKey === "function") {
        const parsed = parseAnyDeadlineKey(dayJalaliKey);
        if (parsed) targetGDate = parsed.gDate;
    }

    if (targetGDate && isDateLockedForRoutineEditing(targetGDate)) {
        console.warn("Routine modification is locked for dates older than 7 days.");
        return;
    }

    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    if (!routine.completedDates) routine.completedDates = {};
    const currentlyDone = isRoutineCompletedOnDate(routine, dayJalaliKey, gDate);

    const gy = gDate ? gDate.getFullYear() : null;
    const gm = gDate ? String(gDate.getMonth() + 1).padStart(2, "0") : null;
    const gd = gDate ? String(gDate.getDate()).padStart(2, "0") : null;
    const gKey = gDate ? `${gy}-${gm}-${gd}` : null;

    if (currentlyDone) {
        if (dayJalaliKey) delete routine.completedDates[dayJalaliKey];
        if (gKey) delete routine.completedDates[gKey];
    } else {
        if (dayJalaliKey) routine.completedDates[dayJalaliKey] = true;
        if (gKey) routine.completedDates[gKey] = true;
    }

    saveRoutines();
    if (typeof updateRoutinePanel === "function" && typeof selectedDeadlineKey !== "undefined") {
        updateRoutinePanel(selectedDeadlineKey);
    }
    if (typeof updateDeadlinePanel === "function" && typeof selectedDeadlineKey !== "undefined") {
        updateDeadlinePanel(selectedDeadlineKey);
    }
}

function deleteRoutine(routineId) {
    routines = routines.filter(r => r.id !== routineId);
    saveRoutines();
    if (typeof updateRoutinePanel === "function" && typeof selectedDeadlineKey !== "undefined") {
        updateRoutinePanel(selectedDeadlineKey);
    }
    if (typeof updateDeadlinePanel === "function" && typeof selectedDeadlineKey !== "undefined") {
        updateDeadlinePanel(selectedDeadlineKey);
    }
}

function calculateDayProgress(dayKey) {
    const parsed = typeof parseAnyDeadlineKey === "function" ? parseAnyDeadlineKey(dayKey) : null;
    const gDate = parsed ? parsed.gDate : new Date();
    const dayJalaliKey = parsed ? parsed.jKey : dayKey;

    const dayRoutines = routines.filter(r => isRoutineScheduledForDate(r, gDate));
    const completedRoutines = dayRoutines.filter(r => isRoutineCompletedOnDate(r, dayJalaliKey, gDate));

    const dayDeadlines = typeof getTasksByDeadlineKey === "function" ? getTasksByDeadlineKey(dayKey) : [];
    const completedDeadlines = dayDeadlines.filter(item => item.task && item.task.checked);

    const total = dayRoutines.length + dayDeadlines.length;
    const completed = completedRoutines.length + completedDeadlines.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 100;

    return {
        total,
        completed,
        percent,
        hasTasks: total > 0,
        routinesCount: dayRoutines.length,
        deadlinesCount: dayDeadlines.length
    };
}


//////////////////////////////////////////////////////////////////
// ----------------------
//   ROUTINE TIMER ENGINE
// ----------------------

let routineTimerInterval = null;

function getRoutineIsoDateKey(gDate) {
    const d = (gDate instanceof Date) ? gDate : new Date();
    const gy = d.getFullYear();
    const gm = String(d.getMonth() + 1).padStart(2, "0");
    const gd = String(d.getDate()).padStart(2, "0");
    return `${gy}-${gm}-${gd}`;
}

function getRoutineTimerData(routine, dateKey) {
    if (!routine) return { elapsedSeconds: 0, isRunning: false, lastStartedAt: null };
    if (!routine.timerLogs) routine.timerLogs = {};
    if (!routine.timerLogs[dateKey]) {
        routine.timerLogs[dateKey] = {
            elapsedSeconds: 0,
            isRunning: false,
            lastStartedAt: null
        };
    }
    return routine.timerLogs[dateKey];
}

function getLiveElapsedSeconds(timerData) {
    if (!timerData) return 0;
    let elapsed = timerData.elapsedSeconds || 0;
    if (timerData.isRunning && timerData.lastStartedAt) {
        const diffSec = Math.floor((Date.now() - timerData.lastStartedAt) / 1000);
        if (diffSec > 0) elapsed += diffSec;
    }
    return elapsed;
}

function formatTimerSeconds(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const fd = typeof formatDigits === "function" ? formatDigits : (x => x);
    const pad = n => String(n).padStart(2, "0");

    if (hours > 0) {
        return `${fd(pad(hours))}:${fd(pad(mins))}:${fd(pad(secs))}`;
    }
    return `${fd(pad(mins))}:${fd(pad(secs))}`;
}

function formatTimerTimeWithTarget(seconds, targetSeconds) {
    const s = Math.max(0, Math.floor(seconds));
    const showHours = (targetSeconds >= 3600 || s >= 3600);
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const fd = typeof formatDigits === "function" ? formatDigits : (x => x);
    const pad = n => String(n).padStart(2, "0");

    if (showHours) {
        return `${fd(pad(hours))}:${fd(pad(mins))}:${fd(pad(secs))}`;
    }
    return `${fd(pad(mins))}:${fd(pad(secs))}`;
}

function ensureRoutineTimerTicker() {
    if (routineTimerInterval) return;
    routineTimerInterval = setInterval(routineTimerTick, 1000);
}

function stopRoutineTimerTickerIfIdle() {
    const hasRunning = routines.some(r => r.isTimed && r.timerLogs && Object.values(r.timerLogs).some(l => l && l.isRunning));
    if (!hasRunning && routineTimerInterval) {
        clearInterval(routineTimerInterval);
        routineTimerInterval = null;
    }
}

function startRoutineTimer(routineId, dateKey) {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;
    const log = getRoutineTimerData(routine, dateKey);
    if (log.isRunning) return;

    log.isRunning = true;
    log.lastStartedAt = Date.now();
    saveRoutines();

    ensureRoutineTimerTicker();

    const widget = document.querySelector(`.routine-timer-widget[data-routine-id="${routineId}"][data-date-key="${dateKey}"]`);
    if (widget) {
        widget.setAttribute("data-is-running", "true");
        const btnToggle = widget.querySelector(".routine-timer-btn-toggle");
        if (btnToggle) {
            btnToggle.classList.add("is-running");
            btnToggle.innerHTML = `
                <svg class="stopwatch-btn-icon icon-pause" viewBox="0 0 24 24" width="13" height="13">
                    <rect x="5.5" y="4" width="4" height="16" rx="1.5" fill="currentColor"/>
                    <rect x="14.5" y="4" width="4" height="16" rx="1.5" fill="currentColor"/>
                </svg>
            `;
            const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage]) ? TRANSLATIONS[currentLanguage] : null;
            btnToggle.title = (dict && dict.routines && dict.routines.timerBtnPause) || "توقف";
        }
        const dot = widget.querySelector(".stopwatch-status-dot");
        if (dot) {
            dot.className = "stopwatch-status-dot is-running";
        }
        const statusLabel = widget.querySelector(".stopwatch-status-text");
        if (statusLabel) {
            const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage]) ? TRANSLATIONS[currentLanguage] : null;
            statusLabel.textContent = (dict && dict.routines && dict.routines.timerStatusRunning) || "در حال زمان‌گیری...";
        }
    }
}

function pauseRoutineTimer(routineId, dateKey) {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;
    const log = getRoutineTimerData(routine, dateKey);
    if (!log.isRunning) return;

    const diff = Math.floor((Date.now() - log.lastStartedAt) / 1000);
    if (diff > 0) {
        log.elapsedSeconds = (log.elapsedSeconds || 0) + diff;
    }
    log.isRunning = false;
    log.lastStartedAt = null;

    const targetSec = (routine.targetDurationMinutes || 60) * 60;
    const isGoalReached = log.elapsedSeconds >= targetSec;
    if (isGoalReached) {
        if (!routine.completedDates) routine.completedDates = {};
        routine.completedDates[dateKey] = true;
    }

    saveRoutines();
    stopRoutineTimerTickerIfIdle();

    const widget = document.querySelector(`.routine-timer-widget[data-routine-id="${routineId}"][data-date-key="${dateKey}"]`);
    if (widget) {
        widget.setAttribute("data-is-running", "false");
        const btnToggle = widget.querySelector(".routine-timer-btn-toggle");
        if (btnToggle) {
            btnToggle.classList.remove("is-running");
            btnToggle.innerHTML = `
                <svg class="stopwatch-btn-icon icon-play" viewBox="0 0 24 24" width="13" height="13">
                    <path d="M7 4.5v15l12-7.5-12-7.5z" fill="currentColor"/>
                </svg>
            `;
            const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage]) ? TRANSLATIONS[currentLanguage] : null;
            btnToggle.title = (dict && dict.routines && dict.routines.timerBtnResume) || "ادامه";
        }
        const digitsEl = widget.querySelector(".timer-digits");
        if (digitsEl) {
            digitsEl.textContent = formatTimerTimeWithTarget(log.elapsedSeconds, targetSec);
        }
        const percent = Math.min(100, Math.round((log.elapsedSeconds / targetSec) * 100));
        const ringFill = widget.querySelector(".stopwatch-ring-fill");
        if (ringFill) {
            const offset = Math.max(0, 119.4 * (1 - percent / 100));
            ringFill.style.strokeDashoffset = offset.toFixed(1);
            if (percent >= 100) ringFill.classList.add("goal-reached");
        }
        const percentEl = widget.querySelector(".target-percent");
        if (percentEl) {
            const fd = typeof formatDigits === "function" ? formatDigits : (x => x);
            percentEl.textContent = `${fd(percent)}%`;
        }
        const dot = widget.querySelector(".stopwatch-status-dot");
        const statusLabel = widget.querySelector(".stopwatch-status-text");
        const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage]) ? TRANSLATIONS[currentLanguage] : null;
        if (isGoalReached) {
            widget.classList.add("goal-reached");
            const targetPill = widget.querySelector(".stopwatch-target-pill");
            if (targetPill) targetPill.classList.add("goal-reached");
            const targetIcon = widget.querySelector(".target-icon");
            if (targetIcon) targetIcon.textContent = "🎉";
            if (dot) dot.className = "stopwatch-status-dot is-done";
            if (statusLabel) statusLabel.textContent = (dict && dict.routines && dict.routines.timerStatusGoalMet) || "هدف محقق شد! 🎉";
        } else {
            if (dot) dot.className = "stopwatch-status-dot is-paused";
            if (statusLabel) statusLabel.textContent = (dict && dict.routines && dict.routines.timerStatusPaused) || "متوقف شده";
        }
    }

    if (typeof selectedDeadlineKey !== "undefined") {
        updateDailyProgressRing(selectedDeadlineKey);
    }
}

function resetRoutineTimer(routineId, dateKey) {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    const log = getRoutineTimerData(routine, dateKey);
    log.elapsedSeconds = 0;
    log.isRunning = false;
    log.lastStartedAt = null;

    saveRoutines();
    stopRoutineTimerTickerIfIdle();

    if (typeof selectedDeadlineKey !== "undefined" && typeof updateRoutinePanel === "function") {
        updateRoutinePanel(selectedDeadlineKey);
    }
}

function routineTimerTick() {
    const activeWidgets = document.querySelectorAll(".routine-timer-widget[data-is-running='true']");
    if (!activeWidgets.length) {
        stopRoutineTimerTickerIfIdle();
        return;
    }

    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage]) ? TRANSLATIONS[currentLanguage] : null;
    const rDict = dict && dict.routines ? dict.routines : null;
    const fd = typeof formatDigits === "function" ? formatDigits : (x => x);

    let anyStateChanged = false;

    activeWidgets.forEach(widget => {
        const routineId = widget.getAttribute("data-routine-id");
        const dateKey = widget.getAttribute("data-date-key");
        const routine = routines.find(r => r.id === routineId);
        if (!routine || !routine.timerLogs || !routine.timerLogs[dateKey]) return;

        const log = routine.timerLogs[dateKey];
        if (!log.isRunning) {
            widget.setAttribute("data-is-running", "false");
            const btnToggle = widget.querySelector(".routine-timer-btn-toggle");
            if (btnToggle) {
                btnToggle.classList.remove("is-running");
                btnToggle.innerHTML = `
                    <svg class="stopwatch-btn-icon icon-play" viewBox="0 0 24 24" width="13" height="13">
                        <path d="M7 4.5v15l12-7.5-12-7.5z" fill="currentColor"/>
                    </svg>
                `;
            }
            return;
        }

        const elapsed = getLiveElapsedSeconds(log);
        const targetSec = (routine.targetDurationMinutes || 60) * 60;
        const percent = Math.min(100, Math.round((elapsed / targetSec) * 100));

        const digitsEl = widget.querySelector(".timer-digits");
        if (digitsEl) {
            digitsEl.textContent = formatTimerTimeWithTarget(elapsed, targetSec);
        }

        const ringFill = widget.querySelector(".stopwatch-ring-fill");
        if (ringFill) {
            const offset = Math.max(0, 119.4 * (1 - percent / 100));
            ringFill.style.strokeDashoffset = offset.toFixed(1);
            if (percent >= 100) {
                ringFill.classList.add("goal-reached");
            }
        }

        const percentEl = widget.querySelector(".target-percent");
        if (percentEl) {
            percentEl.textContent = `${fd(percent)}%`;
        }

        // Auto-complete if goal reached
        if (elapsed >= targetSec) {
            if (!routine.completedDates) routine.completedDates = {};
            if (!routine.completedDates[dateKey]) {
                routine.completedDates[dateKey] = true;
                anyStateChanged = true;

                widget.classList.add("goal-reached");

                const targetPill = widget.querySelector(".stopwatch-target-pill");
                if (targetPill) targetPill.classList.add("goal-reached");

                const targetIcon = widget.querySelector(".target-icon");
                if (targetIcon) targetIcon.textContent = "🎉";

                const dot = widget.querySelector(".stopwatch-status-dot");
                if (dot) dot.className = "stopwatch-status-dot is-done";

                const statusLabel = widget.querySelector(".stopwatch-status-text");
                if (statusLabel) statusLabel.textContent = (rDict && rDict.timerStatusGoalMet) || "هدف محقق شد! 🎉";

                const parentItem = widget.closest(".routine-item");
                if (parentItem) {
                    parentItem.classList.add("done");
                    const chk = parentItem.querySelector(".routine-checkbox");
                    if (chk) chk.checked = true;
                }
            }
        }
    });

    if (anyStateChanged) {
        saveRoutines();
        if (typeof selectedDeadlineKey !== "undefined") {
            updateDailyProgressRing(selectedDeadlineKey);
        }
    }
}

function showRoutineTimerRecoveryPrompt(routine, dateKey, diffSec) {
    const sidePanel = document.getElementById("side-panel");
    const bodyEl = document.getElementById("side-panel-body");
    if (!sidePanel || !bodyEl) return;

    const existing = document.getElementById(`recovery-banner-${routine.id}`);
    if (existing) existing.remove();

    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage]) ? TRANSLATIONS[currentLanguage] : null;
    const rDict = dict && dict.routines ? dict.routines : null;
    const fd = typeof formatDigits === "function" ? formatDigits : (x => x);

    const banner = document.createElement("div");
    banner.className = "routine-recovery-banner";
    banner.id = `recovery-banner-${routine.id}`;

    const diffHours = Math.floor(diffSec / 3600);
    const diffMins = Math.floor((diffSec % 3600) / 60);
    let timeStr = "";
    if (diffHours > 0) {
        timeStr = `${fd(diffHours)} ${rDict ? rDict.timerHours : 'ساعت'} و ${fd(diffMins)} ${rDict ? rDict.timerMinutes : 'دقیقه'}`;
    } else {
        timeStr = `${fd(Math.max(1, diffMins))} ${rDict ? rDict.timerMinutes : 'دقیقه'}`;
    }

    const titleText = rDict ? rDict.timerRecoveryTitle : "زمان سپری‌شده در پس‌زمینه";
    const descText = (rDict && typeof rDict.timerRecoveryDesc === "function")
        ? rDict.timerRecoveryDesc(escapeHTML(routine.title), timeStr)
        : `زمان‌سنج «${escapeHTML(routine.title)}» در زمان بسته بودن مرورگر فعال بود (${timeStr} سپری شد). آیا این زمان به کار امروز افزوده شود؟`;
    const acceptText = rDict ? rDict.timerRecoveryAccept : "✓ بله، افزوده شود";
    const rejectText = rDict ? rDict.timerRecoveryReject : "✕ خیر، متوقف بماند";

    banner.innerHTML = `
        <div class="recovery-banner-header">
            <span class="recovery-icon">⏱️</span>
            <strong>${titleText}</strong>
            <button type="button" class="recovery-close-btn" title="بستن">✕</button>
        </div>
        <p class="recovery-desc">${descText}</p>
        <div class="recovery-actions">
            <button type="button" class="btn-recovery-accept">${acceptText}</button>
            <button type="button" class="btn-recovery-reject">${rejectText}</button>
        </div>
    `;

    banner.querySelector(".recovery-close-btn").addEventListener("click", () => {
        banner.remove();
        if (typeof updateSidePanelHeightAndCollapse === "function") {
            updateSidePanelHeightAndCollapse();
        }
    });

    banner.querySelector(".btn-recovery-accept").addEventListener("click", () => {
        const log = getRoutineTimerData(routine, dateKey);
        log.elapsedSeconds = (log.elapsedSeconds || 0) + diffSec;
        const targetSec = (routine.targetDurationMinutes || 60) * 60;
        if (log.elapsedSeconds >= targetSec) {
            if (!routine.completedDates) routine.completedDates = {};
            routine.completedDates[dateKey] = true;
        }
        saveRoutines();
        banner.remove();
        if (typeof selectedDeadlineKey !== "undefined" && typeof updateRoutinePanel === "function") {
            updateRoutinePanel(selectedDeadlineKey);
        }
    });

    banner.querySelector(".btn-recovery-reject").addEventListener("click", () => {
        banner.remove();
        saveRoutines();
        if (typeof selectedDeadlineKey !== "undefined" && typeof updateRoutinePanel === "function") {
            updateRoutinePanel(selectedDeadlineKey);
        }
    });

    bodyEl.insertBefore(banner, bodyEl.firstChild);
    if (typeof updateSidePanelHeightAndCollapse === "function") {
        updateSidePanelHeightAndCollapse();
    }
}

function checkRoutineTimerRecovery() {
    const now = Date.now();
    let changed = false;

    routines.forEach(routine => {
        if (!routine.isTimed || !routine.timerLogs) return;
        Object.entries(routine.timerLogs).forEach(([dateKey, log]) => {
            if (!log) return;

            if (log.isRunning && log.lastStartedAt && routine.onCloseBehavior === "continue") {
                const diffSec = Math.floor((now - log.lastStartedAt) / 1000);
                if (diffSec > 0) {
                    log.elapsedSeconds = (log.elapsedSeconds || 0) + diffSec;
                    log.lastStartedAt = now;
                    changed = true;
                    const targetSec = (routine.targetDurationMinutes || 60) * 60;
                    if (log.elapsedSeconds >= targetSec) {
                        if (!routine.completedDates) routine.completedDates = {};
                        routine.completedDates[dateKey] = true;
                    }
                }
                ensureRoutineTimerTicker();
            } else if (log.isRunning && log.lastStartedAt && (routine.onCloseBehavior === "ask" || !routine.onCloseBehavior)) {
                const diffSec = Math.floor((now - log.lastStartedAt) / 1000);
                log.isRunning = false;
                log.lastStartedAt = null;
                changed = true;

                if (diffSec >= 30) {
                    setTimeout(() => {
                        showRoutineTimerRecoveryPrompt(routine, dateKey, diffSec);
                    }, 500);
                }
            } else if (log.isRunning && log.lastStartedAt && routine.onCloseBehavior === "pause") {
                const diffSec = Math.floor((now - log.lastStartedAt) / 1000);
                if (diffSec > 0) {
                    log.elapsedSeconds = (log.elapsedSeconds || 0) + diffSec;
                }
                log.isRunning = false;
                log.lastStartedAt = null;
                changed = true;
            }
        });
    });

    if (changed) {
        saveRoutines();
    }
}

window.addEventListener("beforeunload", (e) => {
    let hasRunning = false;
    routines.forEach(routine => {
        if (!routine.isTimed || !routine.timerLogs) return;
        Object.entries(routine.timerLogs).forEach(([dateKey, log]) => {
            if (log && log.isRunning && log.lastStartedAt) {
                hasRunning = true;
                const now = Date.now();
                const diff = Math.floor((now - log.lastStartedAt) / 1000);

                if (routine.onCloseBehavior === "pause") {
                    if (diff > 0) log.elapsedSeconds = (log.elapsedSeconds || 0) + diff;
                    log.isRunning = false;
                    log.lastStartedAt = null;
                }
            }
        });
    });

    saveRoutines();

    if (hasRunning) {
        e.preventDefault();
        e.returnValue = "";
    }
});

// ----------------------
//   ROUTINES MODAL
// ----------------------
function openAddRoutineModal() {
    let modal = document.getElementById("routine-modal");
    if (modal) {
        modal.remove();
    }
    modal = createRoutineModalDOM();
    document.body.appendChild(modal);

    const titleInput = document.getElementById("routine-title-input");
    if (titleInput) {
        titleInput.value = "";
        setTimeout(() => titleInput.focus(), 80);
    }

    // Reset pattern
    const patternDaily = document.getElementById("pattern-daily");
    if (patternDaily) patternDaily.checked = true;
    toggleRoutinePatternFields("daily");

    modal.classList.remove("hidden");
}

function closeAddRoutineModal(immediate = false) {
    const modal = document.getElementById("routine-modal");
    if (!modal) return;
    if (immediate) {
        modal.classList.add("hidden");
        modal.classList.remove("is-closing");
        return;
    }
    modal.classList.add("is-closing");
    setTimeout(() => {
        if (modal.classList.contains("is-closing")) {
            modal.classList.add("hidden");
            modal.classList.remove("is-closing");
        }
    }, 200);
}

function toggleRoutinePatternFields(pattern) {
    const intervalField = document.getElementById("routine-interval-field");
    const weeklyField = document.getElementById("routine-weekly-field");
    const monthlyField = document.getElementById("routine-monthly-field");

    if (intervalField) intervalField.classList.toggle("hidden", pattern !== "interval");
    if (weeklyField) weeklyField.classList.toggle("hidden", pattern !== "weekly");
    if (monthlyField) monthlyField.classList.toggle("hidden", pattern !== "monthly");
}

function createRoutineModalDOM() {
    const modal = document.createElement("div");
    modal.id = "routine-modal";
    modal.className = "routine-modal hidden";

    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage]) ? TRANSLATIONS[currentLanguage] : null;
    const rDict = dict && dict.routines ? dict.routines : null;
    const calType = (typeof currentCalendarType !== "undefined") ? currentCalendarType : "jalali";
    const weekdaysList = (dict && dict.weekdays && dict.weekdays[calType]) 
        ? dict.weekdays[calType] 
        : ["ش", "ی", "د", "س", "چ", "پ", "ج"];

    const modalTitle = rDict ? rDict.modalTitle : "تعریف کار روزمره و عادت جدید";
    const titleLabel = rDict ? rDict.modalTitleLabel : "عنوان کار روزمره یا عادت:";
    const titlePlaceholder = rDict ? rDict.modalTitlePlaceholder : "مثلاً: ورزش صبحگاهی، مطالعه، تمرین...";
    const patternLabel = rDict ? rDict.modalPatternLabel : "الگوی تکرار:";
    const optDaily = rDict ? rDict.patternOptionDaily : "هر روز";
    const optInterval = rDict ? rDict.patternOptionInterval : "روزهای درمیون / بازه‌ای";
    const optWeekly = rDict ? rDict.patternOptionWeekly : "روزهای خاص هفته";
    const optMonthly = rDict ? rDict.patternOptionMonthly : "روز مشخص ماه";
    const intervalLabel = rDict ? rDict.modalIntervalLabel : "تکرار هر چند روز یک‌بار؟";
    const intervalPrefix = rDict ? rDict.modalIntervalPrefix : "هر";
    const intervalSuffix = rDict ? rDict.modalIntervalSuffix : "روز یک‌بار (مثلاً ۲ = یک روز درمیون)";
    const weeklyLabel = rDict ? rDict.modalWeeklyLabel : "در چه روزهایی از هفته؟";
    const monthlyLabel = rDict ? rDict.modalMonthlyLabel : "روز مشخص در ماه:";
    const monthlyPrefix = rDict ? rDict.modalMonthlyPrefix : "روز";
    const monthlySuffix = rDict ? rDict.modalMonthlySuffix : "هر ماه (مثلاً ۱ = اول ماه)";
    const btnCancel = rDict ? rDict.modalCancel : "انصراف";
    const btnSave = rDict ? rDict.modalSave : "ذخیره کار روزمره";
    const todayModalG = new Date();
    const modalGy = todayModalG.getFullYear(), modalGm = String(todayModalG.getMonth() + 1).padStart(2, "0"), modalGd = String(todayModalG.getDate()).padStart(2, "0");
    const todayStr = `${modalGy}-${modalGm}-${modalGd}`;
    let dateDisplayHint = todayStr;
    if (typeof jalaali !== "undefined") {
        const j = jalaali.toJalaali(todayModalG);
        dateDisplayHint = `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
    }

    modal.innerHTML = `
        <div class="routine-modal-backdrop" id="routine-modal-backdrop"></div>
        <div class="routine-modal-content">
            <div class="routine-modal-header">
                <h3>${modalTitle}</h3>
                <button type="button" class="close-routine-modal" id="close-routine-modal">✕</button>
            </div>
            <div class="routine-modal-body">
                <div class="routine-form-group">
                    <label>${titleLabel}</label>
                    <input type="text" id="routine-title-input" class="routine-input" placeholder="${titlePlaceholder}">
                </div>

                <div class="routine-form-group">
                    <label>${patternLabel}</label>
                    <div class="routine-pattern-options">
                        <label class="pattern-radio-label">
                            <input type="radio" name="routine-pattern" value="daily" id="pattern-daily" checked>
                            <span>${optDaily}</span>
                        </label>
                        <label class="pattern-radio-label">
                            <input type="radio" name="routine-pattern" value="interval" id="pattern-interval">
                            <span>${optInterval}</span>
                        </label>
                        <label class="pattern-radio-label">
                            <input type="radio" name="routine-pattern" value="weekly" id="pattern-weekly">
                            <span>${optWeekly}</span>
                        </label>
                        <label class="pattern-radio-label">
                            <input type="radio" name="routine-pattern" value="monthly" id="pattern-monthly">
                            <span>${optMonthly}</span>
                        </label>
                    </div>
                </div>

                <div class="routine-form-group hidden" id="routine-interval-field">
                    <label>${intervalLabel}</label>
                    <div class="interval-input-row">
                        <span>${intervalPrefix}</span>
                        <input type="number" id="routine-interval-input" class="routine-number-input" value="2" min="2" max="30">
                        <span>${intervalSuffix}</span>
                    </div>
                </div>

                <div class="routine-form-group hidden" id="routine-weekly-field">
                    <label>${weeklyLabel}</label>
                    <div class="weekly-days-picker" id="weekly-days-picker">
                        <label class="day-chip"><input type="checkbox" value="0" checked><span>${weekdaysList[0]}</span></label>
                        <label class="day-chip"><input type="checkbox" value="1"><span>${weekdaysList[1]}</span></label>
                        <label class="day-chip"><input type="checkbox" value="2" checked><span>${weekdaysList[2]}</span></label>
                        <label class="day-chip"><input type="checkbox" value="3"><span>${weekdaysList[3]}</span></label>
                        <label class="day-chip"><input type="checkbox" value="4" checked><span>${weekdaysList[4]}</span></label>
                        <label class="day-chip"><input type="checkbox" value="5"><span>${weekdaysList[5]}</span></label>
                        <label class="day-chip"><input type="checkbox" value="6"><span>${weekdaysList[6]}</span></label>
                    </div>
                </div>

                <div class="routine-form-group hidden" id="routine-monthly-field">
                    <label>${monthlyLabel}</label>
                    <div class="interval-input-row">
                        <span>${monthlyPrefix}</span>
                        <input type="number" id="routine-monthly-input" class="routine-number-input" value="1" min="1" max="31">
                        <span>${monthlySuffix}</span>
                    </div>
                </div>

                <div class="routine-form-group" id="routine-start-date-field">
                    <label>${rDict ? rDict.modalStartDateLabel : 'تاریخ شروع:'}</label>
                    <div class="start-date-input-row">
                        <input type="date" id="routine-start-date-input" class="routine-input" value="${todayStr}">
                        <span class="routine-date-hint">(${dateDisplayHint})</span>
                    </div>
                    <span class="routine-form-subhint">${rDict ? rDict.modalStartDateHint : 'روزهای قبل از این تاریخ جزو آمار کارهای انجام‌نشده محاسبه نخواهند شد'}</span>
                </div>

                <div class="routine-form-group routine-timer-toggle-group">
                    <label class="routine-checkbox-toggle-label">
                        <input type="checkbox" id="routine-timed-checkbox">
                        <span class="routine-toggle-title">⏱️ ${rDict ? rDict.timerOptionToggle : 'فعال‌سازی زمان‌سنج (کرنومتر هدف)'}</span>
                    </label>
                </div>

                <div class="routine-form-group hidden" id="routine-timer-fields">
                    <label>${rDict ? rDict.timerTargetLabel : 'مدت زمان هدف:'}</label>
                    <div class="routine-timer-duration-row">
                        <div class="timer-duration-input-group">
                            <input type="number" id="routine-timer-hours" class="routine-number-input" value="1" min="0" max="23">
                            <span>${rDict ? rDict.timerHours : 'ساعت'}</span>
                        </div>
                        <div class="timer-duration-input-group">
                            <input type="number" id="routine-timer-minutes" class="routine-number-input" value="0" min="0" max="59" step="5">
                            <span>${rDict ? rDict.timerMinutes : 'دقیقه'}</span>
                        </div>
                    </div>
                    <div class="timer-quick-chips">
                        <button type="button" class="timer-chip" data-h="0" data-m="15">${rDict ? rDict.timerChip15m : '۱۵ دقیقه'}</button>
                        <button type="button" class="timer-chip" data-h="0" data-m="25">${rDict ? rDict.timerChip25m : '۲۵ دقیقه (پومودورو)'}</button>
                        <button type="button" class="timer-chip" data-h="0" data-m="30">${rDict ? rDict.timerChip30m : '۳۰ دقیقه'}</button>
                        <button type="button" class="timer-chip" data-h="0" data-m="45">${rDict ? rDict.timerChip45m : '۴۵ دقیقه'}</button>
                        <button type="button" class="timer-chip active" data-h="1" data-m="0">${rDict ? rDict.timerChip1h : '۱ ساعت'}</button>
                        <button type="button" class="timer-chip" data-h="2" data-m="0">${rDict ? rDict.timerChip2h : '۲ ساعت'}</button>
                    </div>
                    <div class="routine-close-behavior-row">
                        <label class="sub-label">${rDict ? rDict.timerCloseBehaviorLabel : 'هنگام بستن مرورگر:'}</label>
                        <select id="routine-close-behavior-select" class="routine-select">
                            <option value="ask" selected>${rDict ? rDict.timerCloseAsk : 'پرسش پس از بازگشایی (پیشنهادی)'}</option>
                            <option value="pause">${rDict ? rDict.timerClosePause : 'توقف خودکار در لحظه خروج'}</option>
                            <option value="continue">${rDict ? rDict.timerCloseContinue : 'ادامه خودکار زمان در پس‌زمینه'}</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="routine-modal-actions">
                <button type="button" class="btn-cancel-routine" id="btn-cancel-routine">${btnCancel}</button>
                <button type="button" class="btn-save-routine" id="btn-save-routine">${btnSave}</button>
            </div>
        </div>
    `;

    // Event listeners
    modal.querySelector("#routine-modal-backdrop").addEventListener("click", closeAddRoutineModal);
    modal.querySelector("#close-routine-modal").addEventListener("click", closeAddRoutineModal);
    modal.querySelector("#btn-cancel-routine").addEventListener("click", closeAddRoutineModal);

    modal.querySelectorAll("input[name='routine-pattern']").forEach(radio => {
        radio.addEventListener("change", (e) => {
            toggleRoutinePatternFields(e.target.value);
        });
    });

    const timedCheckbox = modal.querySelector("#routine-timed-checkbox");
    const timerFields = modal.querySelector("#routine-timer-fields");
    if (timedCheckbox && timerFields) {
        timedCheckbox.addEventListener("change", (e) => {
            if (e.target.checked) {
                timerFields.classList.remove("hidden");
            } else {
                timerFields.classList.add("hidden");
            }
        });
    }

    modal.querySelectorAll(".timer-chip").forEach(chip => {
        chip.addEventListener("click", (e) => {
            e.preventDefault();
            modal.querySelectorAll(".timer-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            const h = chip.getAttribute("data-h");
            const m = chip.getAttribute("data-m");
            const hInput = modal.querySelector("#routine-timer-hours");
            const mInput = modal.querySelector("#routine-timer-minutes");
            if (hInput) hInput.value = h;
            if (mInput) mInput.value = m;
        });
    });

    modal.querySelector("#btn-save-routine").addEventListener("click", () => {
        const titleInput = document.getElementById("routine-title-input");
        const title = titleInput ? titleInput.value.trim() : "";
        if (!title) {
            alert(rDict ? rDict.modalTitlePlaceholder : "لطفاً عنوان کار روزمره را وارد کنید.");
            return;
        }

        const selectedPatternRadio = modal.querySelector("input[name='routine-pattern']:checked");
        const pattern = selectedPatternRadio ? selectedPatternRadio.value : "daily";

        let intervalDays = 1;
        let weeklyDays = [0, 1, 2, 3, 4, 5, 6];
        let monthlyDay = 1;

        if (pattern === "interval") {
            const inputVal = parseInt(document.getElementById("routine-interval-input")?.value, 10);
            intervalDays = Math.max(2, inputVal || 2);
        } else if (pattern === "weekly") {
            const checkedChips = modal.querySelectorAll("#weekly-days-picker input[type='checkbox']:checked");
            weeklyDays = Array.from(checkedChips).map(c => parseInt(c.value, 10));
            if (!weeklyDays.length) weeklyDays = [0];
        } else if (pattern === "monthly") {
            monthlyDay = parseInt(document.getElementById("routine-monthly-input")?.value, 10) || 1;
        }

        const todayG = new Date();
        const gy = todayG.getFullYear(), gm = String(todayG.getMonth() + 1).padStart(2, "0"), gd = String(todayG.getDate()).padStart(2, "0");
        const todayStr = `${gy}-${gm}-${gd}`;

        const startDateInput = modal.querySelector("#routine-start-date-input");
        const chosenStartDate = (startDateInput && startDateInput.value) ? startDateInput.value : todayStr;

        const isTimed = !!modal.querySelector("#routine-timed-checkbox")?.checked;
        let targetDurationMinutes = 60;
        let onCloseBehavior = "ask";
        if (isTimed) {
            const hours = parseInt(modal.querySelector("#routine-timer-hours")?.value, 10) || 0;
            const mins = parseInt(modal.querySelector("#routine-timer-minutes")?.value, 10) || 0;
            targetDurationMinutes = Math.max(1, (hours * 60) + mins);
            onCloseBehavior = modal.querySelector("#routine-close-behavior-select")?.value || "ask";
        }

        const newRoutine = {
            id: "routine_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
            title,
            pattern,
            intervalDays,
            anchorDate: chosenStartDate,
            startDate: chosenStartDate,
            createdAt: new Date().toISOString(),
            weeklyDays,
            monthlyDay,
            completedDates: {},
            isTimed,
            targetDurationMinutes,
            onCloseBehavior,
            timerLogs: {}
        };

        routines.push(newRoutine);
        saveRoutines();
        closeAddRoutineModal();

        if (typeof updateDeadlinePanel === "function" && typeof selectedDeadlineKey !== "undefined") {
            updateDeadlinePanel(selectedDeadlineKey);
        }
    });

    return modal;
}

// Initial load
loadRoutines();

// ----------------------
//   SVGS FOR TOGGLE BUTTON
// ----------------------
const SVG_ROUTINES_MODE = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 14.93-4"/><polyline points="19 4 19 8 15 8"/><path d="M20 12a8 8 0 0 1-14.93 4"/><polyline points="5 20 5 16 9 16"/><path d="M9 12l2 2 4-4"/></svg>`;

const SVG_DEADLINES_MODE = SVG_ROUTINES_MODE;

let currentSidePanelMode = localStorage.getItem("sidePanelMode") || "deadlines"; // "deadlines" | "routines"

// ----------------------
//   ROUTINES PANEL RENDERER
// ----------------------
function updateDailyProgressRing(deadlineKey) {
    const progressEl = document.getElementById("daily-progress-container");
    if (!progressEl) return;

    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const rDict = dict && dict.routines ? dict.routines : null;
    const fd = typeof formatDigits === "function" ? formatDigits : (x => x);

    const targetParsed = (typeof parseAnyDeadlineKey === "function") ? parseAnyDeadlineKey(deadlineKey) : null;
    const gDate = targetParsed ? targetParsed.gDate : new Date();
    const dayJalaliKey = targetParsed ? targetParsed.jKey : deadlineKey;
    const isLocked = isDateLockedForRoutineEditing(gDate);

    const dayRoutines = routines.filter(r => isRoutineScheduledForDate(r, gDate));
    const completedRoutines = dayRoutines.filter(r => isRoutineCompletedOnDate(r, dayJalaliKey, gDate));

    // Calculate progress for routines
    const totalR = dayRoutines.length;
    const doneR = completedRoutines.length;
    const percent = totalR > 0 ? Math.round((doneR / totalR) * 100) : 100;

    // SVG Ring calculations
    const radius = 18;
    const circumference = Math.round(2 * Math.PI * radius * 10) / 10;
    const offset = Math.round((circumference - (percent / 100) * circumference) * 10) / 10;

    let strokeColor = "#4f46e5";
    if (percent === 100 && totalR > 0) strokeColor = "#10b981";
    else if (percent < 40) strokeColor = "#f59e0b";

    let pTitle = "";
    let pSub = "";
    if (totalR === 0) {
        pTitle = rDict ? rDict.progressNoTasks : "بدون برنامه روزمره برای این روز";
        pSub = rDict ? rDict.progressQuietDay : "روز آرامی در پیش دارید ✨";
    } else if (percent === 100) {
        pTitle = rDict ? rDict.progressAllDone : "همه کارهای روزمره انجام شد! 🎉";
        pSub = rDict && typeof rDict.progressSubtitle === "function"
            ? rDict.progressSubtitle(fd(doneR), fd(totalR))
            : `${fd(doneR)} از ${fd(totalR)} کار روزمره انجام شده`;
    } else {
        pTitle = rDict ? rDict.progressTitle : "پیشرفت کارهای روزمره";
        pSub = rDict && typeof rDict.progressSubtitle === "function"
            ? rDict.progressSubtitle(fd(doneR), fd(totalR))
            : `${fd(doneR)} از ${fd(totalR)} کار روزمره انجام شده`;
    }

    progressEl.innerHTML = `
        <div class="progress-ring-box">
            <svg class="progress-ring-svg" width="46" height="46" viewBox="0 0 46 46">
                <circle class="progress-ring-circle-bg" cx="23" cy="23" r="${radius}" stroke-width="4.5" fill="transparent" />
                <circle class="progress-ring-circle" cx="23" cy="23" r="${radius}" stroke="${strokeColor}" stroke-width="4.5" 
                        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" fill="transparent" />
            </svg>
            <span class="progress-ring-text" style="color: ${strokeColor};">${fd(percent)}%</span>
        </div>
        <div class="progress-info-box">
            <div class="progress-title">${pTitle}</div>
            <div class="progress-subtitle">${pSub}</div>
            ${isLocked ? `<div class="progress-locked-notice" title="${rDict ? rDict.lockedTooltip : ''}">🔒 ${rDict ? rDict.lockedNotice : 'قفل‌شده: مهلت ویرایش پس از یک هفته به پایان رسیده است'}</div>` : ''}
        </div>
    `;
}

function updateRoutinePanel(deadlineKey) {
    const listEl = document.getElementById("routine-list");
    const progressEl = document.getElementById("daily-progress-container");

    if (!listEl || !progressEl) return;

    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const rDict = dict && dict.routines ? dict.routines : null;
    const fd = typeof formatDigits === "function" ? formatDigits : (x => x);

    const targetParsed = (typeof parseAnyDeadlineKey === "function") ? parseAnyDeadlineKey(deadlineKey) : null;
    const gDate = targetParsed ? targetParsed.gDate : new Date();
    const dayJalaliKey = targetParsed ? targetParsed.jKey : deadlineKey;
    const dateKey = getRoutineIsoDateKey(gDate);
    const isLocked = isDateLockedForRoutineEditing(gDate);

    const dayRoutines = routines.filter(r => isRoutineScheduledForDate(r, gDate));

    // Update Progress Ring
    updateDailyProgressRing(deadlineKey);

    // Render routines list
    listEl.innerHTML = "";
    if (dayRoutines.length === 0) {
        const emptyEl = document.createElement("div");
        emptyEl.className = "routine-empty";
        emptyEl.textContent = rDict ? rDict.empty : "کاری برای روزمره‌های این روز ثبت نشده است.";
        listEl.appendChild(emptyEl);
    } else {
        dayRoutines.forEach(routine => {
            const isDone = isRoutineCompletedOnDate(routine, dayJalaliKey, gDate);

            let badgeText = rDict ? rDict.patternDaily : "هر روز";
            if (routine.pattern === "interval") {
                const n = routine.intervalDays || 2;
                badgeText = rDict && typeof rDict.patternInterval === "function" ? rDict.patternInterval(fd(n)) : `هر ${fd(n)} روز`;
            } else if (routine.pattern === "weekly") {
                badgeText = rDict ? rDict.patternWeekly : "هفتگی";
            } else if (routine.pattern === "monthly") {
                const m = routine.monthlyDay || 1;
                badgeText = rDict && typeof rDict.patternMonthly === "function" ? rDict.patternMonthly(fd(m)) : `روز ${fd(m)} ماه`;
            }

            const rItem = document.createElement("div");
            rItem.className = `routine-item ${isDone ? "done" : ""} ${isLocked ? "is-locked" : ""} ${routine.isTimed ? "is-timed" : ""}`;

            const escapedTitle = (typeof escapeHTML === "function") ? escapeHTML(routine.title) : routine.title;
            const lockBadgeHTML = isLocked
                ? `<span class="routine-lock-badge" title="${rDict ? rDict.lockedTooltip : ''}">🔒 ${rDict ? rDict.lockedBadge : 'قفل‌شده'}</span>`
                : "";

            let timerWidgetHTML = "";
            let targetBadgeText = "";

            if (routine.isTimed) {
                const timerData = getRoutineTimerData(routine, dateKey);
                const isRunning = timerData ? !!timerData.isRunning : false;
                const liveElapsed = getLiveElapsedSeconds(timerData);
                const targetSec = (routine.targetDurationMinutes || 60) * 60;
                const progressPercent = Math.min(100, Math.round((liveElapsed / targetSec) * 100));
                const isGoalReached = liveElapsed >= targetSec;
                const dashOffset = Math.max(0, 119.4 * (1 - progressPercent / 100));

                const durHours = Math.floor((routine.targetDurationMinutes || 60) / 60);
                const durMins = (routine.targetDurationMinutes || 60) % 60;
                let targetBadgeTextShort = "";
                if (durHours > 0 && durMins > 0) {
                    targetBadgeText = `⏱️ ${fd(durHours)}h ${fd(durMins)}m`;
                    targetBadgeTextShort = `${fd(durHours)}h ${fd(durMins)}m`;
                } else if (durHours > 0) {
                    targetBadgeText = `⏱️ ${fd(durHours)}h`;
                    targetBadgeTextShort = `${fd(durHours)}h`;
                } else {
                    targetBadgeText = `⏱️ ${fd(durMins)}m`;
                    targetBadgeTextShort = `${fd(durMins)}m`;
                }

                const elapsedFormatted = formatTimerTimeWithTarget(liveElapsed, targetSec);
                const btnPlayTitle = isRunning
                    ? (rDict ? rDict.timerBtnPause : "توقف")
                    : (liveElapsed > 0 ? (rDict ? rDict.timerBtnResume : "ادامه") : (rDict ? rDict.timerBtnStart : "شروع"));
                const resetTitle = rDict ? rDict.timerBtnReset : "بازنشانی";

                let statusText = "";
                let statusDotClass = "";
                if (isGoalReached) {
                    statusText = (rDict && rDict.timerStatusGoalMet) || "هدف محقق شد! 🎉";
                    statusDotClass = "is-done";
                } else if (isRunning) {
                    statusText = (rDict && rDict.timerStatusRunning) || "در حال زمان‌گیری...";
                    statusDotClass = "is-running";
                } else if (liveElapsed > 0) {
                    statusText = (rDict && rDict.timerStatusPaused) || "متوقف شده";
                    statusDotClass = "is-paused";
                } else {
                    statusText = (rDict && rDict.timerStatusReady) || "آماده شروع";
                    statusDotClass = "is-ready";
                }

                timerWidgetHTML = `
                    <div class="routine-timer-widget ${isGoalReached ? 'goal-reached' : ''}" data-routine-id="${routine.id}" data-date-key="${dateKey}" data-is-running="${isRunning ? 'true' : 'false'}">
                        <div class="routine-stopwatch-dial">
                            <div class="stopwatch-crown"></div>
                            <div class="stopwatch-ring-wrapper">
                                <svg class="stopwatch-ring-svg" viewBox="0 0 46 46">
                                    <circle class="stopwatch-ring-bg" cx="23" cy="23" r="19" />
                                    <circle class="stopwatch-ring-fill ${isGoalReached ? 'goal-reached' : ''}" cx="23" cy="23" r="19" style="stroke-dashoffset: ${dashOffset.toFixed(1)};" />
                                </svg>
                                ${!isLocked ? `
                                    <button type="button" class="routine-timer-btn routine-timer-btn-toggle ${isRunning ? 'is-running' : ''}" title="${btnPlayTitle}">
                                        ${isRunning ? `
                                            <svg class="stopwatch-btn-icon icon-pause" viewBox="0 0 24 24" width="13" height="13">
                                                <rect x="5.5" y="4" width="4" height="16" rx="1.5" fill="currentColor"/>
                                                <rect x="14.5" y="4" width="4" height="16" rx="1.5" fill="currentColor"/>
                                            </svg>
                                        ` : `
                                            <svg class="stopwatch-btn-icon icon-play" viewBox="0 0 24 24" width="13" height="13">
                                                <path d="M7 4.5v15l12-7.5-12-7.5z" fill="currentColor"/>
                                            </svg>
                                        `}
                                    </button>
                                ` : `
                                    <div class="routine-timer-locked-icon" title="${rDict ? rDict.lockedTooltip : ''}">🔒</div>
                                `}
                            </div>
                        </div>

                        <div class="routine-stopwatch-info">
                            <div class="routine-stopwatch-row-top">
                                <div class="stopwatch-status">
                                    <span class="stopwatch-status-dot ${statusDotClass}"></span>
                                    <span class="stopwatch-status-text">${statusText}</span>
                                </div>
                                ${!isLocked ? `
                                    <button type="button" class="routine-timer-btn routine-timer-btn-reset" title="${resetTitle}">
                                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                            <path d="M3 3v5h5"/>
                                        </svg>
                                    </button>
                                ` : ''}
                            </div>
                            <div class="routine-stopwatch-row-bottom">
                                <div class="stopwatch-display">
                                    <span class="timer-digits">${elapsedFormatted}</span>
                                </div>
                                <div class="stopwatch-target-pill ${isGoalReached ? 'goal-reached' : ''}">
                                    <span class="target-icon">${isGoalReached ? '🎉' : '⏱️'}</span>
                                    <span class="target-text">${targetBadgeTextShort}</span>
                                    <span class="target-percent">${fd(progressPercent)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                if (isRunning) {
                    ensureRoutineTimerTicker();
                }
            }

            rItem.innerHTML = `
                <div class="routine-item-main">
                    <div class="routine-item-left">
                        <input type="checkbox" class="routine-checkbox" ${isDone ? "checked" : ""} ${isLocked ? "disabled" : ""}>
                        <span class="routine-item-title">${escapedTitle}</span>
                    </div>
                    <div class="routine-item-right">
                        ${lockBadgeHTML}
                        ${routine.isTimed ? `<span class="routine-badge timer-target-badge">${targetBadgeText}</span>` : ''}
                        <span class="routine-badge">${badgeText}</span>
                        <button type="button" class="routine-del-btn" title="حذف">✕</button>
                    </div>
                </div>
                ${timerWidgetHTML}
            `;

            const chk = rItem.querySelector(".routine-checkbox");
            if (!isLocked) {
                chk.addEventListener("change", (e) => {
                    e.stopPropagation();
                    toggleRoutineCompletion(routine.id, dayJalaliKey, gDate);
                });
            } else {
                chk.title = rDict ? rDict.lockedTooltip : "";
            }

            const delBtn = rItem.querySelector(".routine-del-btn");
            delBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const confirmMsg = rDict ? rDict.deleteConfirm : "آیا از حذف این مورد اطمینان دارید؟";
                if (confirm(confirmMsg)) {
                    deleteRoutine(routine.id);
                }
            });

            if (routine.isTimed && !isLocked) {
                const toggleBtn = rItem.querySelector(".routine-timer-btn-toggle");
                if (toggleBtn) {
                    toggleBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        const currentLog = getRoutineTimerData(routine, dateKey);
                        if (currentLog.isRunning) {
                            pauseRoutineTimer(routine.id, dateKey);
                        } else {
                            startRoutineTimer(routine.id, dateKey);
                        }
                    });
                }

                const resetBtn = rItem.querySelector(".routine-timer-btn-reset");
                if (resetBtn) {
                    resetBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        const confirmMsg = rDict ? (rDict.timerBtnReset + "?") : "آیا از بازنشانی زمان این کار اطمینان دارید؟";
                        if (confirm(confirmMsg)) {
                            resetRoutineTimer(routine.id, dateKey);
                        }
                    });
                }
            }

            listEl.appendChild(rItem);
        });
    }

    if (typeof updateSleepTrackerWidget === "function") {
        updateSleepTrackerWidget(deadlineKey);
    }

    if (typeof updateSidePanelHeader === "function") {
        updateSidePanelHeader(deadlineKey);
    }
    if (typeof updateSidePanelHeightAndCollapse === "function") {
        updateSidePanelHeightAndCollapse();
    }
}

// ----------------------
//   SIDE PANEL CONTROLLER
// ----------------------
function updateSidePanelHeader(deadlineKey) {
    const titleTextEl = document.getElementById("side-panel-title-text");
    const countBadge = document.getElementById("side-panel-count-badge");
    const iconEl = document.getElementById("side-panel-icon");
    const toggleBtn = document.getElementById("panel-mode-toggle-btn");
    const addBtn = document.getElementById("btn-open-add-routine");

    if (!titleTextEl) return;

    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const rDict = dict && dict.routines ? dict.routines : null;
    const fd = typeof formatDigits === "function" ? formatDigits : (x => x);

    const targetParsed = (typeof parseAnyDeadlineKey === "function") ? parseAnyDeadlineKey(deadlineKey) : null;
    const todayJalaliKey = (typeof todayJalali !== "undefined" && typeof formatJalaliKey === "function")
        ? formatJalaliKey(todayJalali.jy, todayJalali.jm, todayJalali.jd)
        : "";
    const isToday = targetParsed && targetParsed.jKey === todayJalaliKey;

    if (currentSidePanelMode === "routines") {
        if (iconEl) iconEl.textContent = "🔄";
        if (titleTextEl) titleTextEl.textContent = rDict ? rDict.title : "کارهای روزمره";
        if (addBtn) addBtn.classList.remove("hidden");
        const dashBtn = document.getElementById("btn-open-routine-dashboard");
        if (dashBtn) {
            dashBtn.classList.remove("hidden");
            dashBtn.title = rDict ? rDict.dashboardBtnTitle : "داشبورد و تحلیل پیشرفت کارهای روزمره";
        }

        const gDate = targetParsed ? targetParsed.gDate : new Date();
        const dayRoutines = routines.filter(r => isRoutineScheduledForDate(r, gDate));
        if (countBadge) countBadge.textContent = fd(dayRoutines.length);

        if (toggleBtn) {
            toggleBtn.innerHTML = SVG_DEADLINES_MODE;
            toggleBtn.title = rDict ? rDict.toggleToDeadlines : "مشاهده ددلاین‌ها";
        }
    } else { // "deadlines"
        if (iconEl) iconEl.textContent = "📅";
        if (addBtn) addBtn.classList.add("hidden");
        const dashBtnDeadlines = document.getElementById("btn-open-routine-dashboard");
        if (dashBtnDeadlines) dashBtnDeadlines.classList.add("hidden");

        let titleText = "";
        if (isToday) {
            const formattedToday = (typeof formatDayTitleForCurrentCalendar === "function")
                ? formatDayTitleForCurrentCalendar(todayJalaliKey)
                : "";
            titleText = dict ? `${dict.deadlineTitleToday} (${formattedToday})` : `ددلاین‌های امروز (${formattedToday})`;
        } else {
            const formattedDate = (typeof formatDayTitleForCurrentCalendar === "function")
                ? formatDayTitleForCurrentCalendar(deadlineKey)
                : deadlineKey;
            titleText = dict && typeof dict.deadlineTitleFor === "function"
                ? dict.deadlineTitleFor(formattedDate)
                : `ددلاین‌های ${formattedDate}`;
        }
        if (titleTextEl) titleTextEl.textContent = titleText;

        const allOverdue = (typeof getOverdueTasks === "function") ? getOverdueTasks() : [];
        const currentItems = (typeof getTasksByDeadlineKey === "function") ? getTasksByDeadlineKey(deadlineKey) : [];
        const otherOverdue = allOverdue.filter(item => item.deadlineKey !== (targetParsed ? targetParsed.jKey : ""));
        const totalCount = currentItems.length + otherOverdue.length;
        if (countBadge) countBadge.textContent = fd(totalCount);

        if (toggleBtn) {
            toggleBtn.innerHTML = SVG_ROUTINES_MODE;
            toggleBtn.title = rDict ? rDict.toggleToRoutines : "مشاهده کارهای روزمره";
        }
    }
}

function setSidePanelMode(mode, animate = true) {
    currentSidePanelMode = mode;
    localStorage.setItem("sidePanelMode", mode);

    const toggleBtn = document.getElementById("panel-mode-toggle-btn");
    const deadlineView = document.getElementById("deadline-view");
    const routineView = document.getElementById("routine-view");

    if (animate && toggleBtn) {
        toggleBtn.classList.add("flipping");
        setTimeout(() => toggleBtn.classList.remove("flipping"), 420);
    }

    if (mode === "routines") {
        if (deadlineView) deadlineView.classList.add("hidden");
        if (routineView) routineView.classList.remove("hidden");
    } else {
        if (deadlineView) deadlineView.classList.remove("hidden");
        if (routineView) routineView.classList.add("hidden");
    }

    const currentKey = (typeof selectedDeadlineKey !== "undefined") ? selectedDeadlineKey : "";
    updateSidePanelHeader(currentKey);
    updateSidePanelHeightAndCollapse();
}

function toggleSidePanelMode() {
    const nextMode = (currentSidePanelMode === "deadlines") ? "routines" : "deadlines";
    setSidePanelMode(nextMode, true);
}


// ----------------------
//   DYNAMIC HEIGHT & INDEPENDENT COLLAPSE
// ----------------------
function getAvailableSidePanelHeight() {
    const eraser = document.getElementById("eraser");
    const pen = document.getElementById("pen");
    const sidePanel = document.getElementById("side-panel");

    let barrier = window.innerHeight - 120;
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

    const targetBottom = barrier - 20;

    let panelTop = 0;
    if (sidePanel) {
        const rect = sidePanel.getBoundingClientRect();
        panelTop = rect.top;
    }
    if (!panelTop || panelTop <= 0) {
        const cal = document.getElementById("calendar");
        const isMin = cal && cal.classList.contains("minimized");
        panelTop = 30 + (isMin ? 38 : 445) + 10;
    }

    const header = sidePanel ? sidePanel.querySelector(".side-panel-header") : null;
    const headerHeight = header ? header.offsetHeight : 44;

    const available = Math.floor(targetBottom - panelTop - headerHeight - 16);
    return Math.max(available, 60);
}

function updateSidePanelHeightAndCollapse() {
    const sidePanel = document.getElementById("side-panel");
    const collapseBtn = document.getElementById("side-panel-collapse-btn");
    const bodyEl = document.getElementById("side-panel-body");
    const deadlineView = document.getElementById("deadline-view");
    const routineView = document.getElementById("routine-view");

    if (!sidePanel || !collapseBtn || !bodyEl) return;

    const availableHeight = getAvailableSidePanelHeight();

    // Check independent collapsed states
    const isDeadlinesCollapsed = localStorage.getItem("deadlinePanelCollapsed") === "true";
    const isRoutinesCollapsed = localStorage.getItem("routinePanelCollapsed") === "true";

    const isCurrentModeCollapsed = (currentSidePanelMode === "routines")
        ? isRoutinesCollapsed
        : isDeadlinesCollapsed;

    const activeView = (currentSidePanelMode === "routines") ? routineView : deadlineView;
    if (!activeView) return;

    // Temporarily unconstrain to accurately measure natural content height
    const prevMax = bodyEl.style.maxHeight;
    const prevOverflow = bodyEl.style.overflow;
    const wasCollapsed = sidePanel.classList.contains("collapsed");
    if (wasCollapsed) {
        sidePanel.classList.remove("collapsed");
    }
    bodyEl.style.maxHeight = "none";
    bodyEl.style.overflow = "visible";

    const contentHeight = activeView.offsetHeight || activeView.scrollHeight;
    bodyEl.style.overflow = prevOverflow;

    const exceedsAvailable = contentHeight > (availableHeight + 6);

    if (!exceedsAvailable) {
        // Fits comfortably within available height: hide button, expand naturally, no scrolling needed
        collapseBtn.classList.add("hidden");
        sidePanel.classList.remove("collapsed");
        bodyEl.style.maxHeight = `${availableHeight}px`;
    } else {
        // Exceeds available space: show expand/collapse button
        collapseBtn.classList.remove("hidden");

        if (isCurrentModeCollapsed) {
            sidePanel.classList.add("collapsed");
            collapseBtn.textContent = "+";
            collapseBtn.title = "بزرگ کردن پنل";
            bodyEl.style.maxHeight = "0px";
        } else {
            sidePanel.classList.remove("collapsed");
            collapseBtn.textContent = "−";
            collapseBtn.title = "کوچک کردن پنل";
            bodyEl.style.maxHeight = `${availableHeight}px`;
        }
    }
}

function initSidePanelsUI() {
    // 1. Toggle button listener
    const toggleBtn = document.getElementById("panel-mode-toggle-btn");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleSidePanelMode();
        });
    }

    // 2. Add routine & Dashboard buttons
    const addBtn = document.getElementById("btn-open-add-routine");
    if (addBtn) {
        addBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openAddRoutineModal();
        });
    }

    const dashBtn = document.getElementById("btn-open-routine-dashboard");
    if (dashBtn) {
        dashBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (typeof openRoutineDashboardModal === "function") {
                openRoutineDashboardModal();
            }
        });
    }

    // 3. Side panel collapse toggle with independent states
    const collapseBtn = document.getElementById("side-panel-collapse-btn");
    if (collapseBtn) {
        collapseBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (currentSidePanelMode === "routines") {
                const wasCollapsed = localStorage.getItem("routinePanelCollapsed") === "true";
                localStorage.setItem("routinePanelCollapsed", String(!wasCollapsed));
            } else {
                const wasCollapsed = localStorage.getItem("deadlinePanelCollapsed") === "true";
                localStorage.setItem("deadlinePanelCollapsed", String(!wasCollapsed));
            }
            updateSidePanelHeightAndCollapse();
        });
    }

    // 4. Resize listener to keep height and button visibility in sync
    window.addEventListener("resize", () => {
        updateSidePanelHeightAndCollapse();
    });

    // 5. Initialize active view mode
    const savedMode = localStorage.getItem("sidePanelMode") || "deadlines";
    setSidePanelMode(savedMode, false);

    // 6. Routine Timer Recovery check
    try {
        checkRoutineTimerRecovery();
    } catch (e) {}

    // 7. Initial render of routines
    try {
        if (typeof selectedDeadlineKey !== "undefined") {
            updateRoutinePanel(selectedDeadlineKey);
        }
    } catch (e) {}

    updateSidePanelHeightAndCollapse();
}

document.addEventListener("DOMContentLoaded", initSidePanelsUI);
