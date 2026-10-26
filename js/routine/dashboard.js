//////////////////////////////////////////////////////////////////
// ---------------------------------------------------------------
//   DAILY ROUTINES & HABITS ANALYTICS DASHBOARD
// ---------------------------------------------------------------
//////////////////////////////////////////////////////////////////

let dashboardActiveTab = "calendar"; // "calendar" | "analytics" | "management"
let dashboardMonthOffset = 0; // 0 = current active month
let dashboardSelectedDate = null; // Date object for Day Inspector

// ----------------------
//   ANALYTICS CALCULATIONS
// ----------------------

function getRoutineDateKey(gDate, calType) {
    if (!gDate) return "";
    const type = calType || (typeof currentCalendarType !== "undefined" ? currentCalendarType : "jalali");
    if (type === "jalali" && typeof jalaali !== "undefined") {
        const j = jalaali.toJalaali(gDate);
        return formatJalaliKey(j.jy, j.jm, j.jd);
    }
    const gy = gDate.getFullYear();
    const gm = String(gDate.getMonth() + 1).padStart(2, "0");
    const gd = String(gDate.getDate()).padStart(2, "0");
    return `${gy}-${gm}-${gd}`;
}

function calculateRoutineAnalytics(daysCount = 30) {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    let totalScheduled = 0;
    let totalCompleted = 0;
    let totalSkipped = 0;

    const weekdayStats = [
        { scheduled: 0, completed: 0 }, // 0: Sat
        { scheduled: 0, completed: 0 }, // 1: Sun
        { scheduled: 0, completed: 0 }, // 2: Mon
        { scheduled: 0, completed: 0 }, // 3: Tue
        { scheduled: 0, completed: 0 }, // 4: Wed
        { scheduled: 0, completed: 0 }, // 5: Thu
        { scheduled: 0, completed: 0 }  // 6: Fri
    ];

    const trendPoints = [];

    // Analyze completed days: from daysCount days ago up to yesterday (i = 1)
    // Ongoing day (today) is excluded from retrospective performance analytics
    for (let i = daysCount; i >= 1; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        d.setHours(12, 0, 0, 0);

        const jKey = (typeof jalaali !== "undefined") ? (() => {
            const j = jalaali.toJalaali(d);
            return formatJalaliKey(j.jy, j.jm, j.jd);
        })() : null;

        const scheduledRoutines = routines.filter(r => isRoutineScheduledForDate(r, d));
        const completedRoutines = scheduledRoutines.filter(r => isRoutineCompletedOnDate(r, jKey, d));

        const sched = scheduledRoutines.length;
        const comp = completedRoutines.length;

        totalScheduled += sched;
        totalCompleted += comp;

        if (sched > comp) {
            totalSkipped += (sched - comp);
        }

        // Weekday calculation (0 = Saturday ... 6 = Friday)
        const jsDay = d.getDay();
        const satIdx = (jsDay + 1) % 7;
        weekdayStats[satIdx].scheduled += sched;
        weekdayStats[satIdx].completed += comp;

        trendPoints.push({
            date: d,
            jKey: jKey,
            scheduled: sched,
            completed: comp,
            pct: sched > 0 ? Math.round((comp / sched) * 100) : 0,
            isPast: true,
            isToday: false
        });
    }

    const overallAdherence = totalScheduled > 0
        ? Math.round((totalCompleted / totalScheduled) * 100)
        : 100;

    // Calculate Streaks
    // Check if today is already 100% completed to credit active streak
    const todayScheduled = routines.filter(r => isRoutineScheduledForDate(r, today));
    const todayCompleted = todayScheduled.filter(r => isRoutineCompletedOnDate(r, null, today));
    const todayAllDone = todayScheduled.length > 0 && todayCompleted.length === todayScheduled.length;

    let currentStreak = todayAllDone ? 1 : 0;

    // Step backwards through trendPoints starting from yesterday (last element)
    for (let idx = trendPoints.length - 1; idx >= 0; idx--) {
        const p = trendPoints[idx];
        if (p.scheduled === 0) {
            // Off day doesn't break the streak
            continue;
        }
        if (p.completed > 0) {
            currentStreak++;
        } else {
            break;
        }
    }

    // Longest streak in the analyzed period
    let longestStreak = 0;
    let tempStreak = 0;
    for (const p of trendPoints) {
        if (p.scheduled === 0) continue;
        if (p.completed > 0) {
            tempStreak++;
            if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
            tempStreak = 0;
        }
    }
    if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
    }

    // Best day of week
    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const weekdayNames = (dict && dict.weekdays && dict.weekdays.jalali)
        ? dict.weekdays.jalali
        : ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];

    let bestDayIdx = 0;
    let bestDayRate = -1;
    weekdayStats.forEach((st, idx) => {
        if (st.scheduled > 0) {
            const rate = (st.completed / st.scheduled) * 100;
            if (rate > bestDayRate) {
                bestDayRate = rate;
                bestDayIdx = idx;
            }
        }
    });

    const bestDayName = bestDayRate >= 0 ? weekdayNames[bestDayIdx] : "—";
    const bestDayPercent = bestDayRate >= 0 ? Math.round(bestDayRate) : 0;

    return {
        overallAdherence,
        totalScheduled,
        totalCompleted,
        totalSkipped,
        currentStreak,
        longestStreak,
        bestDayName,
        bestDayPercent,
        trendPoints
    };
}

function calculatePerHabitStats(routine, daysCount = 30) {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    let scheduledCount = 0;
    let completedCount = 0;
    let consecutiveMissed = 0;
    let streakActive = true;

    // Check if completed today to credit streak
    const todayDone = isRoutineCompletedOnDate(routine, null, today);
    let currentStreak = todayDone ? 1 : 0;

    // Performance analysis calculates completed days up to yesterday (i = 1 to daysCount)
    for (let i = 1; i <= daysCount; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        d.setHours(12, 0, 0, 0);

        const jKey = (typeof jalaali !== "undefined") ? (() => {
            const j = jalaali.toJalaali(d);
            return formatJalaliKey(j.jy, j.jm, j.jd);
        })() : null;

        const isSched = isRoutineScheduledForDate(routine, d);
        if (!isSched) continue;

        scheduledCount++;
        const isDone = isRoutineCompletedOnDate(routine, jKey, d);

        if (isDone) {
            completedCount++;
            if (streakActive) currentStreak++;
        } else {
            if (streakActive) streakActive = false;
            if (i <= 3) consecutiveMissed++;
        }
    }

    const pct = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 100;

    // Smart Insight
    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const rDict = dict && dict.routines ? dict.routines : null;

    let insight = rDict ? rDict.insightGood : "روند خوب و رو به رشد است 👏";
    if (scheduledCount === 0) {
        insight = rDict ? rDict.insightNewHabit : "🌱 کار تازه تعریف‌شده؛ هنوز موعد اجرای آن فرا نرسیده است.";
    } else if (pct >= 85) {
        insight = rDict ? rDict.insightConsistent : "🌟 پایبندی فوق‌العاده! این کار به یک عادت تثبیت‌شده تبدیل شده است.";
    } else if (consecutiveMissed >= 2) {
        insight = rDict ? rDict.insightNeedsAttention : "💡 توجه: چند بار اخیر انجام نشده؛ شاید نیاز به بازبینی ساعت آن باشد.";
    }

    return {
        scheduledCount,
        completedCount,
        adherencePercent: pct,
        currentStreak,
        insight
    };
}

function calculateSleepAnalytics(daysCount = 30) {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    let loggedDaysCount = 0;
    let sumDuration = 0;
    const bedtimeMinsList = [];
    const waketimeMinsList = [];
    let optimalCount = 0;
    let fairCount = 0;
    let shortCount = 0;
    let longCount = 0;

    const dailyPoints = [];

    // Analyze last daysCount days up to today
    for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        d.setHours(12, 0, 0, 0);

        const gKey = (typeof getSleepDateKey === "function")
            ? getSleepDateKey(d)
            : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        const sLog = (typeof getSleepLogForDate === "function") ? getSleepLogForDate(d) : (typeof sleepLogs !== "undefined" ? sleepLogs[gKey] : null);

        let dur = null;
        if (sLog && sLog.bedtime && sLog.waketime && typeof calculateSleepDuration === "function") {
            dur = calculateSleepDuration(sLog.bedtime, sLog.waketime);
        }

        if (dur) {
            loggedDaysCount++;
            sumDuration += dur.totalMinutes;

            // Normalize bedtime across midnight (relative to midday 12:00)
            const [bH, bM] = sLog.bedtime.split(":").map(Number);
            let bTotal = bH * 60 + bM;
            if (bTotal < 720) bTotal += 1440; // after midnight
            bedtimeMinsList.push(bTotal);

            // Waketime
            const [wH, wM] = sLog.waketime.split(":").map(Number);
            waketimeMinsList.push(wH * 60 + wM);

            if (dur.qualityClass === "optimal") optimalCount++;
            else if (dur.qualityClass === "fair") fairCount++;
            else if (dur.qualityClass === "short") shortCount++;
            else if (dur.qualityClass === "long") longCount++;
        }

        dailyPoints.push({
            date: d,
            gKey: gKey,
            hasLog: !!dur,
            bedtime: sLog ? sLog.bedtime : "",
            waketime: sLog ? sLog.waketime : "",
            durationMinutes: dur ? dur.totalMinutes : 0,
            hours: dur ? dur.hours : 0,
            minutes: dur ? dur.minutes : 0,
            qualityClass: dur ? dur.qualityClass : "none"
        });
    }

    let avgDurationMinutes = 0;
    let avgBedtimeStr = "—";
    let avgWaketimeStr = "—";
    let optimalRate = 0;

    if (loggedDaysCount > 0) {
        avgDurationMinutes = Math.round(sumDuration / loggedDaysCount);
        
        // Avg bedtime
        let avgB = bedtimeMinsList.reduce((a, b) => a + b, 0) / bedtimeMinsList.length;
        if (avgB >= 1440) avgB -= 1440;
        const bH = Math.floor(avgB / 60);
        const bM = Math.round(avgB % 60);
        avgBedtimeStr = `${String(bH).padStart(2, "0")}:${String(bM).padStart(2, "0")}`;

        // Avg waketime
        const avgW = waketimeMinsList.reduce((a, b) => a + b, 0) / waketimeMinsList.length;
        const wH = Math.floor(avgW / 60);
        const wM = Math.round(avgW % 60);
        avgWaketimeStr = `${String(wH).padStart(2, "0")}:${String(wM).padStart(2, "0")}`;

        optimalRate = Math.round((optimalCount / loggedDaysCount) * 100);
    }

    const avgHours = Math.floor(avgDurationMinutes / 60);
    const avgMinutes = avgDurationMinutes % 60;

    // Smart Insight
    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const rDict = dict && dict.routines ? dict.routines : null;

    let insight = rDict ? rDict.sleepInsightNoData : "برای مشاهده تحلیل خواب، ساعات خواب و بیداری روزهای خود را ثبت کنید.";
    if (loggedDaysCount > 0) {
        if (avgHours >= 7 && avgHours <= 9) {
            insight = rDict ? rDict.sleepInsightOptimal : "🌟 الگوی خواب شما بسیار منظم و در محدوده طلایی سلامت (۷ تا ۹ ساعت) است.";
        } else if (avgHours < 7) {
            insight = rDict ? rDict.sleepInsightShort : "💡 میانگین خواب شما کمتر از ۷ ساعت است؛ کم‌خوابی بازدهی و انرژی روزانه را کاهش می‌دهد.";
        } else {
            insight = rDict ? rDict.sleepInsightLong : "🌙 میانگین خواب بیش از حد معمول است؛ نظم در زمان بیداری به تعادل انرژی کمک می‌کند.";
        }
    }

    return {
        loggedDaysCount,
        avgDurationMinutes,
        avgHours,
        avgMinutes,
        avgBedtimeStr,
        avgWaketimeStr,
        optimalRate,
        optimalCount,
        fairCount,
        shortCount,
        longCount,
        dailyPoints,
        insight
    };
}


// ----------------------
//   DASHBOARD MODAL DOM
// ----------------------

function openRoutineDashboardModal(targetDate) {
    let modal = document.getElementById("routine-dashboard-modal");
    if (modal) modal.remove();

    dashboardMonthOffset = 0;
    if (targetDate instanceof Date) {
        dashboardSelectedDate = targetDate;
    } else if (!dashboardSelectedDate) {
        dashboardSelectedDate = new Date();
    }

    modal = createRoutineDashboardModalDOM();
    document.body.appendChild(modal);

    modal.classList.remove("hidden");
    renderDashboardCurrentTab();

    // Close on Escape
    const escListener = (e) => {
        if (e.key === "Escape") {
            closeRoutineDashboardModal();
            document.removeEventListener("keydown", escListener);
        }
    };
    document.addEventListener("keydown", escListener);
}

function closeRoutineDashboardModal() {
    const modal = document.getElementById("routine-dashboard-modal");
    if (modal) {
        modal.classList.add("hidden");
        setTimeout(() => modal.remove(), 200);
    }
}

function createRoutineDashboardModalDOM() {
    const modal = document.createElement("div");
    modal.id = "routine-dashboard-modal";
    modal.className = "routine-modal routine-dashboard-modal";

    const backdrop = document.createElement("div");
    backdrop.className = "routine-modal-backdrop";
    backdrop.addEventListener("click", closeRoutineDashboardModal);

    const content = document.createElement("div");
    content.className = "routine-modal-content routine-dashboard-content";

    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const rDict = dict && dict.routines ? dict.routines : null;

    const titleText = rDict ? rDict.dashboardTitle : "داشبورد و تقویم تحلیلی کارهای روزمره";
    const tabCalText = rDict ? rDict.tabBigCalendar : "📅 تقویم پیشرفت";
    const tabAnalyticsText = rDict ? rDict.tabAnalytics : "📈 آمار و نمودارها";
    const tabMgmtText = rDict ? rDict.tabManagement : "⚙️ مدیریت عادات";

    content.innerHTML = `
        <div class="routine-dashboard-header">
            <div class="routine-dashboard-header-title">
                <span class="routine-dash-icon">📊</span>
                <h3>${titleText}</h3>
            </div>
            <div class="routine-dashboard-tabs">
                <button type="button" class="routine-tab-btn ${dashboardActiveTab === 'calendar' ? 'active' : ''}" data-tab="calendar">${tabCalText}</button>
                <button type="button" class="routine-tab-btn ${dashboardActiveTab === 'analytics' ? 'active' : ''}" data-tab="analytics">${tabAnalyticsText}</button>
                <button type="button" class="routine-tab-btn ${dashboardActiveTab === 'management' ? 'active' : ''}" data-tab="management">${tabMgmtText}</button>
            </div>
            <button type="button" class="close-routine-modal" id="btn-close-routine-dashboard">✕</button>
        </div>
        <div class="routine-dashboard-body" id="routine-dashboard-body">
            <!-- Dynamic tab content injected here -->
        </div>
    `;

    modal.appendChild(backdrop);
    modal.appendChild(content);

    // Tab buttons listener
    content.querySelectorAll(".routine-tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const tab = e.currentTarget.dataset.tab;
            dashboardActiveTab = tab;
            content.querySelectorAll(".routine-tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
            renderDashboardCurrentTab();
        });
    });

    const closeBtn = content.querySelector("#btn-close-routine-dashboard");
    if (closeBtn) closeBtn.addEventListener("click", closeRoutineDashboardModal);

    return modal;
}

function renderDashboardCurrentTab() {
    const body = document.getElementById("routine-dashboard-body");
    if (!body) return;

    if (dashboardActiveTab === "calendar") {
        renderDashboardCalendarTab(body);
    } else if (dashboardActiveTab === "analytics") {
        renderDashboardAnalyticsTab(body);
    } else if (dashboardActiveTab === "management") {
        renderDashboardManagementTab(body);
    }
}

// ----------------------
//   TAB 1: BIG CALENDAR VIEW
// ----------------------

function renderDashboardCalendarTab(container) {
    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const rDict = dict && dict.routines ? dict.routines : null;
    const fd = typeof formatDigits === "function" ? formatDigits : (x => x);

    // Calculate month info based on offset & calendar type
    const calType = typeof currentCalendarType !== "undefined" ? currentCalendarType : "jalali";

    // Target date for month
    const baseDate = new Date();
    baseDate.setDate(1);
    baseDate.setMonth(baseDate.getMonth() + dashboardMonthOffset);

    let year = baseDate.getFullYear();
    let month = baseDate.getMonth() + 1; // 1-based
    let monthName = "";
    let daysCount = 30;
    let startWeekdayIndex = 0; // 0 = Sat, 6 = Fri

    if (calType === "jalali" && typeof jalaali !== "undefined") {
        const j = jalaali.toJalaali(baseDate);
        year = j.jy;
        month = j.jm;
        monthName = dict && dict.months && dict.months.jalali ? dict.months.jalali[month - 1] : `ماه ${month}`;
        daysCount = jalaali.jalaaliMonthLength(year, month);
        const firstG = jalaali.toGregorian(year, month, 1);
        const gFirstDate = new Date(firstG.gy, firstG.gm - 1, firstG.gd);
        startWeekdayIndex = (gFirstDate.getDay() + 1) % 7;
    } else if (calType === "hijri" && typeof getHijriParts === "function") {
        const h = getHijriParts(baseDate);
        year = h.hy;
        month = h.hm;
        monthName = dict && dict.months && dict.months.hijri ? dict.months.hijri[month - 1] : `ماه ${month}`;
        daysCount = 30;
        startWeekdayIndex = (baseDate.getDay() + 1) % 7;
    } else {
        // Gregorian
        monthName = dict && dict.months && dict.months.gregorian ? dict.months.gregorian[month - 1] : `Month ${month}`;
        daysCount = new Date(year, month, 0).getDate();
        startWeekdayIndex = (baseDate.getDay() + 1) % 7;
    }

    const weekdays = (dict && dict.weekdays && dict.weekdays.jalali)
        ? dict.weekdays.jalali
        : ["ش", "ی", "د", "س", "چ", "پ", "ج"];

    // Overall analytics for quick header KPI
    const stats = calculateRoutineAnalytics(30);

    container.innerHTML = `
        <div class="dash-top-kpis">
            <div class="dash-kpi-pill">
                <span class="kpi-label">${rDict ? rDict.kpiAdherence : "پایبندی:"}</span>
                <span class="kpi-val highlight">${fd(stats.overallAdherence)}%</span>
            </div>
            <div class="dash-kpi-pill">
                <span class="kpi-label">${rDict ? rDict.kpiCurrentStreak : "زنجیره:"}</span>
                <span class="kpi-val fire">🔥 ${fd(stats.currentStreak)} ${rDict ? rDict.daysStreakSuffix : "روز"}</span>
            </div>
            <div class="dash-kpi-pill">
                <span class="kpi-label">${rDict ? rDict.kpiCompleted : "انجام‌شده:"}</span>
                <span class="kpi-val done">✓ ${fd(stats.totalCompleted)}</span>
            </div>
            <div class="dash-kpi-pill">
                <span class="kpi-label">${rDict ? rDict.kpiSkipped : "رد شده:"}</span>
                <span class="kpi-val skipped">✕ ${fd(stats.totalSkipped)}</span>
            </div>
        </div>

        <div class="dash-calendar-container">
            <div class="dash-cal-header">
                <button type="button" class="dash-cal-nav-btn" id="dash-cal-prev" title="${rDict ? rDict.prevMonth : 'ماه قبل'}">❮</button>
                <div class="dash-cal-month-title">${monthName} ${fd(year)}</div>
                <button type="button" class="dash-cal-nav-btn" id="dash-cal-next" title="${rDict ? rDict.nextMonth : 'ماه بعد'}">❯</button>
                <button type="button" class="dash-cal-today-btn" id="dash-cal-today">${rDict ? rDict.todayBtn : 'امروز'}</button>
            </div>

            <div class="dash-cal-grid-header">
                ${weekdays.map(w => `<div class="dash-cal-weekday">${w}</div>`).join('')}
            </div>

            <div class="dash-cal-days-grid" id="dash-cal-days-grid">
                <!-- Day cells rendered here -->
            </div>
        </div>

        <div class="dash-day-inspector" id="dash-day-inspector">
            <!-- Day details drawer -->
        </div>
    `;

    // Month Navigation listeners
    container.querySelector("#dash-cal-prev").addEventListener("click", () => {
        dashboardMonthOffset--;
        renderDashboardCurrentTab();
    });
    container.querySelector("#dash-cal-next").addEventListener("click", () => {
        dashboardMonthOffset++;
        renderDashboardCurrentTab();
    });
    container.querySelector("#dash-cal-today").addEventListener("click", () => {
        dashboardMonthOffset = 0;
        dashboardSelectedDate = new Date();
        renderDashboardCurrentTab();
    });

    // Populate calendar grid days
    const gridEl = container.querySelector("#dash-cal-days-grid");
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    // 1. Empty leading cells
    for (let e = 0; e < startWeekdayIndex; e++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "dash-cal-cell empty";
        gridEl.appendChild(emptyCell);
    }

    // 2. Day cells
    for (let dayNum = 1; dayNum <= daysCount; dayNum++) {
        let gDate = null;
        let dayJalaliKey = "";

        if (calType === "jalali" && typeof jalaali !== "undefined") {
            const g = jalaali.toGregorian(year, month, dayNum);
            gDate = new Date(g.gy, g.gm - 1, g.gd, 12, 0, 0);
            dayJalaliKey = formatJalaliKey(year, month, dayNum);
        } else {
            gDate = new Date(year, month - 1, dayNum, 12, 0, 0);
            if (typeof jalaali !== "undefined") {
                const j = jalaali.toJalaali(gDate);
                dayJalaliKey = formatJalaliKey(j.jy, j.jm, j.jd);
            }
        }

        const isToday = gDate.toDateString() === today.toDateString();
        const isPast = gDate.getTime() < today.getTime() && !isToday;
        const isFuture = gDate.getTime() > today.getTime();
        const isLocked = typeof isDateLockedForRoutineEditing === "function" && isDateLockedForRoutineEditing(gDate);

        const scheduled = routines.filter(r => isRoutineScheduledForDate(r, gDate));
        const completed = scheduled.filter(r => isRoutineCompletedOnDate(r, dayJalaliKey, gDate));

        let statusClass = "none";
        let statusBadge = "";

        if (scheduled.length > 0) {
            if (completed.length === scheduled.length) {
                statusClass = "full";
                statusBadge = `<span class="dash-badge-full">✓ ${fd(completed.length)}/${fd(scheduled.length)}</span>`;
            } else if (completed.length > 0) {
                statusClass = "partial";
                statusBadge = `<span class="dash-badge-partial">${fd(completed.length)}/${fd(scheduled.length)}</span>`;
            } else if (isPast) {
                statusClass = "missed";
                statusBadge = `<span class="dash-badge-missed">${isLocked ? '🔒' : '✕'} ${fd(scheduled.length)}</span>`;
            } else {
                statusClass = "pending";
                statusBadge = `<span class="dash-badge-pending">⏳ ${fd(scheduled.length)}</span>`;
            }
        }

        let sleepCellBadge = "";
        if (typeof getSleepLogForDate === "function" && typeof calculateSleepDuration === "function") {
            const sLog = getSleepLogForDate(gDate);
            if (sLog && sLog.bedtime && sLog.waketime) {
                const sDur = calculateSleepDuration(sLog.bedtime, sLog.waketime);
                if (sDur) {
                    const durH = sDur.hours + (sDur.minutes >= 30 ? 0.5 : 0);
                    const qText = (rDict && rDict[sDur.qualityKey]) ? rDict[sDur.qualityKey] : "";
                    sleepCellBadge = `<span class="dash-cell-sleep-badge ${sDur.qualityClass}" title="${rDict ? rDict.sleepDuration : 'خواب'}: ${fd(sDur.hours)}h ${sDur.minutes > 0 ? fd(sDur.minutes) + 'm' : ''} (${qText})">🌙 ${fd(durH)}h</span>`;
                }
            }
        }

        const cell = document.createElement("div");
        cell.className = `dash-cal-cell ${statusClass} ${isToday ? 'is-today' : ''} ${isLocked ? 'is-locked' : ''}`;
        cell.innerHTML = `
            <div class="dash-cell-top">
                <span class="dash-cell-num">${fd(dayNum)}</span>
                ${isToday ? '<span class="dash-today-dot" title="امروز"></span>' : ''}
                ${sleepCellBadge}
                ${(isLocked && scheduled.length > 0 && isPast) ? '<span class="dash-locked-icon" title="' + (rDict ? rDict.lockedTooltip : 'قفل‌شده') + '">🔒</span>' : ''}
            </div>
            <div class="dash-cell-status">
                ${statusBadge}
            </div>
        `;

        cell.addEventListener("click", () => {
            gridEl.querySelectorAll(".dash-cal-cell").forEach(c => c.classList.remove("selected"));
            cell.classList.add("selected");
            dashboardSelectedDate = gDate;
            renderDayInspector(container.querySelector("#dash-day-inspector"), gDate, dayJalaliKey);
        });

        // Default selection: select today or day 1
        if (isToday || (!dashboardSelectedDate && dayNum === 1)) {
            cell.classList.add("selected");
            dashboardSelectedDate = gDate;
        }

        gridEl.appendChild(cell);
    }

    // Render inspector for currently selected day
    if (dashboardSelectedDate) {
        const selJKey = (typeof jalaali !== "undefined") ? (() => {
            const j = jalaali.toJalaali(dashboardSelectedDate);
            return formatJalaliKey(j.jy, j.jm, j.jd);
        })() : null;
        renderDayInspector(container.querySelector("#dash-day-inspector"), dashboardSelectedDate, selJKey);
    }
}

function renderDayInspector(container, gDate, dayJalaliKey) {
    if (!container || !gDate) return;

    const isLocked = typeof isDateLockedForRoutineEditing === "function" && isDateLockedForRoutineEditing(gDate);

    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const rDict = dict && dict.routines ? dict.routines : null;
    const fd = typeof formatDigits === "function" ? formatDigits : (x => x);

    const formattedDate = (typeof formatDayTitleForCurrentCalendar === "function")
        ? formatDayTitleForCurrentCalendar(dayJalaliKey || getRoutineDateKey(gDate))
        : gDate.toLocaleDateString();

    const scheduled = routines.filter(r => isRoutineScheduledForDate(r, gDate));
    const unstarted = (!isLocked) ? routines.filter(r => !isRoutineScheduledForDate(r, gDate)) : [];
    const titlePrefix = rDict ? rDict.dayDetailsTitle : "کارهای روزمره در تاریخ";

    let scheduledListHTML = "";
    if (scheduled.length === 0) {
        scheduledListHTML = `
            <div class="dash-inspector-empty">
                <span>✨ ${rDict ? rDict.dayDetailsEmpty : 'هیچ برنامه روزمره‌ای برای این روز تنظیم نشده است.'}</span>
            </div>
        `;
    } else {
        scheduledListHTML = `<div class="dash-inspector-list" id="dash-inspector-list"></div>`;
    }

    let retroactiveHTML = "";
    if (unstarted.length > 0) {
        retroactiveHTML = `
            <div class="dash-inspector-retroactive-section">
                <button type="button" class="btn-toggle-retroactive" id="btn-toggle-retroactive">
                    <span>➕ ${rDict ? rDict.retroactiveTitle : 'کارهای اضافه‌شده بعد از این تاریخ (جهت ثبت عطف‌به‌ماسبق):'}</span>
                    <span class="retroactive-chevron" id="retroactive-chevron">▼</span>
                </button>
                <div class="dash-retroactive-list hidden" id="dash-retroactive-list"></div>
            </div>
        `;
    }

    const lockedHeaderBadge = isLocked ? `<span class="dash-inspector-locked-pill">🔒 ${rDict ? rDict.lockedBadge : 'قفل‌شده'}</span>` : '';
    const inspectorTip = isLocked
        ? `<span class="dash-inspector-tip is-locked">🔒 ${rDict ? rDict.lockedNotice : 'مهلت ثبت یا تغییر وضعیت پس از یک هفته به پایان رسیده است.'}</span>`
        : (scheduled.length > 0 ? `<span class="dash-inspector-tip">💡 برای ثبت یا تغییر وضعیت، تیک کارها را بزنید:</span>` : '');

    let sleepBoxHTML = "";
    let sleepTargetDate = gDate;
    if (typeof getSleepLogForDate === "function" && typeof calculateSleepDuration === "function") {
        const now = new Date();
        const isToday = (
            gDate.getFullYear() === now.getFullYear() &&
            gDate.getMonth() === now.getMonth() &&
            gDate.getDate() === now.getDate()
        );
        const isDaytime = now.getHours() >= 4 && now.getHours() < 18;

        // If inspecting Today during daytime (04:00 to 18:00),
        // waking up today belongs to the previous day's night session (روز قبلی)!
        // Both bedtime and waketime pair together into the previous day!
        let boxTitle = rDict ? rDict.sleepInspectorBoxTitle : 'ثبت و ویرایش ساعت خواب و بیداری';
        let boxSubLabel = "";

        if (isToday && isDaytime) {
            const yDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            sleepTargetDate = yDate;
            boxTitle = rDict ? (rDict.sleepLastNight || "خواب شب گذشته") : "خواب شب گذشته";
            boxSubLabel = "";
        } else if (isToday && !isDaytime) {
            boxTitle = rDict ? (rDict.sleepTonight || "خواب امشب") : "خواب امشب";
            boxSubLabel = "";
        }

        const sLog = getSleepLogForDate(sleepTargetDate) || { bedtime: "", waketime: "" };
        const bedtime = sLog.bedtime || "";
        const waketime = sLog.waketime || "";
        const dur = calculateSleepDuration(bedtime, waketime);
        const qualityText = (dur && rDict && rDict[dur.qualityKey]) ? rDict[dur.qualityKey] : "";
        let durFormatted = "";
        if (dur) {
            durFormatted = dur.minutes > 0
                ? `${fd(dur.hours)} ${rDict ? rDict.sleepHours : 'ساعت'} ${fd(dur.minutes)} ${rDict ? rDict.sleepMinutes : 'دقیقه'}`
                : `${fd(dur.hours)} ${rDict ? rDict.sleepHours : 'ساعت'}`;
        }
        const bLabel = rDict ? rDict.sleepBedtime : 'ساعت خواب';
        const wLabel = rDict ? rDict.sleepWaketime : 'ساعت بیداری';
        const clearText = rDict ? rDict.sleepClear : 'پاکسازی';

        sleepBoxHTML = `
            <div class="dash-inspector-sleep-box ${isLocked ? 'is-locked' : ''}">
                <div class="dash-inspector-sleep-head">
                    <div class="dash-inspector-sleep-title">
                        <span class="sleep-icon">🌙</span>
                        <strong>${boxTitle}</strong>
                        ${boxSubLabel}
                        ${isLocked ? `<span class="dash-sleep-lock-badge">🔒 ${rDict ? rDict.lockedBadge : 'قفل'}</span>` : ''}
                    </div>
                    ${(!isLocked && (bedtime || waketime)) ? `
                        <button type="button" class="btn-inspector-clear-sleep" id="btn-inspector-clear-sleep" title="${clearText}">✕ ${clearText}</button>
                    ` : ''}
                </div>

                <div class="dash-inspector-sleep-inputs">
                    <div class="dash-sleep-input-group">
                        <label for="dash-inp-bedtime" class="dash-sleep-input-lbl">
                            <span>🛏️</span>
                            <span>${bLabel}:</span>
                        </label>
                        <input type="time" id="dash-inp-bedtime" class="dash-sleep-input-field" value="${bedtime}" ${isLocked ? 'disabled' : ''}>
                    </div>

                    <div class="dash-sleep-input-group">
                        <label for="dash-inp-waketime" class="dash-sleep-input-lbl">
                            <span>🌅</span>
                            <span>${wLabel}:</span>
                        </label>
                        <input type="time" id="dash-inp-waketime" class="dash-sleep-input-field" value="${waketime}" ${isLocked ? 'disabled' : ''}>
                    </div>

                    <div class="dash-sleep-calc-badge" id="dash-sleep-calc-badge">
                        ${dur ? `
                            <span class="dash-sleep-calc-dur">⏱️ ${durFormatted}</span>
                            <span class="circadian-quality-pill ${dur.qualityClass}">${qualityText}</span>
                        ` : `
                            <span class="dash-sleep-calc-empty">${rDict ? rDict.sleepNotLogged : 'ثبت نشده'}</span>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="dash-inspector-card ${scheduled.length === 0 ? 'empty' : ''} ${isLocked ? 'is-locked' : ''}">
            <div class="dash-inspector-header">
                <div class="dash-inspector-header-row">
                    <h4>📅 ${titlePrefix} ${formattedDate} ${scheduled.length > 0 ? `(${fd(scheduled.length)} کار)` : ''}</h4>
                    ${lockedHeaderBadge}
                </div>
                ${inspectorTip}
            </div>
            ${sleepBoxHTML}
            ${scheduledListHTML}
            ${retroactiveHTML}
        </div>
    `;

    // Populate active scheduled list
    if (scheduled.length > 0) {
        const listEl = container.querySelector("#dash-inspector-list");
        scheduled.forEach(routine => {
            const isDone = isRoutineCompletedOnDate(routine, dayJalaliKey, gDate);

            const item = document.createElement("div");
            item.className = `dash-inspector-item ${isDone ? 'done' : ''} ${isLocked ? 'is-locked' : ''}`;

            let badgeStatusText = '';
            let badgeClass = '';
            if (isDone) {
                badgeStatusText = rDict ? rDict.statusCompleted : 'انجام‌شده ✓';
                badgeClass = 'done';
            } else if (isLocked) {
                badgeStatusText = rDict ? rDict.statusLockedMissed : 'انجام‌نشده (قفل)';
                badgeClass = 'locked-missed';
            } else {
                badgeStatusText = rDict ? rDict.statusSkipped : 'انجام‌نشده';
                badgeClass = 'pending';
            }

            item.innerHTML = `
                <label class="dash-inspector-label ${isLocked ? 'is-locked' : ''}">
                    <input type="checkbox" class="dash-inspector-checkbox" ${isDone ? 'checked' : ''} ${isLocked ? 'disabled' : ''}>
                    <span class="dash-inspector-title">${routine.title}</span>
                </label>
                <span class="dash-inspector-badge ${badgeClass}">
                    ${badgeStatusText}
                </span>
            `;

            const chk = item.querySelector(".dash-inspector-checkbox");
            if (!isLocked) {
                chk.addEventListener("change", (e) => {
                    e.stopPropagation();
                    toggleRoutineCompletion(routine.id, dayJalaliKey, gDate);
                    renderDashboardCurrentTab();
                });
            } else {
                chk.title = rDict ? rDict.lockedTooltip : '';
            }

            listEl.appendChild(item);
        });
    }

    // Populate retroactive list for routines that hadn't started yet
    if (unstarted.length > 0) {
        const retroListEl = container.querySelector("#dash-retroactive-list");
        const toggleBtn = container.querySelector("#btn-toggle-retroactive");
        const chevron = container.querySelector("#retroactive-chevron");

        toggleBtn.addEventListener("click", () => {
            const isHidden = retroListEl.classList.toggle("hidden");
            chevron.textContent = isHidden ? "▼" : "▲";
        });

        unstarted.forEach(routine => {
            const item = document.createElement("div");
            item.className = "dash-inspector-item retroactive-item";

            let startDisplay = routine.startDate || routine.anchorDate || "";
            if (typeof formatDayTitleForCurrentCalendar === "function" && startDisplay) {
                startDisplay = formatDayTitleForCurrentCalendar(startDisplay);
            }

            item.innerHTML = `
                <label class="dash-inspector-label">
                    <input type="checkbox" class="dash-inspector-checkbox">
                    <span class="dash-inspector-title">${routine.title}</span>
                </label>
                <span class="dash-inspector-badge unstarted">
                    ${rDict ? rDict.startDatePrefix : 'شروع:'} ${startDisplay}
                </span>
            `;

            const chk = item.querySelector(".dash-inspector-checkbox");
            chk.addEventListener("change", (e) => {
                e.stopPropagation();
                toggleRoutineCompletion(routine.id, dayJalaliKey, gDate);
                renderDashboardCurrentTab();
            });

            retroListEl.appendChild(item);
        });
    }

    // Sleep Box inputs event listeners
    const inpBed = container.querySelector("#dash-inp-bedtime");
    const inpWake = container.querySelector("#dash-inp-waketime");
    const clearSleepBtn = container.querySelector("#btn-inspector-clear-sleep");

    const saveSleepEntry = () => {
        if (isLocked) return;
        const bVal = inpBed ? inpBed.value : "";
        const wVal = inpWake ? inpWake.value : "";
        if (typeof setSleepTime === "function") {
            setSleepTime(sleepTargetDate, "bedtime", bVal);
            setSleepTime(sleepTargetDate, "waketime", wVal);
        }
        // Sync side panel widget
        const curDeadlineKey = (typeof selectedDeadlineKey !== "undefined") ? selectedDeadlineKey : "";
        if (typeof updateSleepTrackerWidget === "function") {
            updateSleepTrackerWidget(curDeadlineKey);
        }
        renderDashboardCurrentTab();
    };

    if (inpBed && !isLocked) inpBed.addEventListener("change", saveSleepEntry);
    if (inpWake && !isLocked) inpWake.addEventListener("change", saveSleepEntry);
    if (clearSleepBtn && !isLocked) {
        clearSleepBtn.addEventListener("click", () => {
            if (typeof clearSleepLogForDate === "function") {
                clearSleepLogForDate(sleepTargetDate);
            }
            const curDeadlineKey = (typeof selectedDeadlineKey !== "undefined") ? selectedDeadlineKey : "";
            if (typeof updateSleepTrackerWidget === "function") {
                updateSleepTrackerWidget(curDeadlineKey);
            }
            renderDashboardCurrentTab();
        });
    }
}

// ----------------------
//   TAB 2: ANALYTICS & TRENDS
// ----------------------

function renderDashboardAnalyticsTab(container) {
    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const rDict = dict && dict.routines ? dict.routines : null;
    const fd = typeof formatDigits === "function" ? formatDigits : (x => x);

    const stats = calculateRoutineAnalytics(30);
    const sleepStats = calculateSleepAnalytics(30);

    // Sleep Duration 30-day Chart
    const sleepBarWidth = 18;
    const sleepBarGap = 8;
    const sleepChartHeight = 120;
    const sleepTotalWidth = sleepStats.dailyPoints.length * (sleepBarWidth + sleepBarGap);

    let sleepBarsSVG = "";
    const baselineY = 100;
    const hourScale = 7.5; // 12h = 90px
    const bandTopY = baselineY - (9 * hourScale); // 32.5
    const bandHeight = (9 - 7) * hourScale; // 15
    const bandBottomY = baselineY - (7 * hourScale); // 47.5

    sleepBarsSVG += `
        <!-- Healthy Sleep Range Guide Band (7-9 hrs) -->
        <rect x="0" y="${bandTopY}" width="${sleepTotalWidth + 10}" height="${bandHeight}" fill="rgba(16, 185, 129, 0.08)" class="sleep-healthy-band" />
        <line x1="0" y1="${bandTopY}" x2="${sleepTotalWidth + 10}" y2="${bandTopY}" stroke="rgba(16, 185, 129, 0.3)" stroke-dasharray="3 3" stroke-width="1" />
        <line x1="0" y1="${bandBottomY}" x2="${sleepTotalWidth + 10}" y2="${bandBottomY}" stroke="rgba(16, 185, 129, 0.3)" stroke-dasharray="3 3" stroke-width="1" />
        <text x="${sleepTotalWidth + 8}" y="${bandTopY + 11}" font-size="7.5" fill="#10b981" font-weight="700" text-anchor="end">۷-۹h</text>
    `;

    sleepStats.dailyPoints.forEach((p, idx) => {
        const x = idx * (sleepBarWidth + sleepBarGap) + 4;
        const durHours = p.durationMinutes / 60;
        const barHeight = Math.min(90, Math.max(8, Math.round(durHours * hourScale)));
        const y = baselineY - barHeight;

        let fill = "#cbd5e1";
        if (p.hasLog) {
            if (p.qualityClass === "optimal") fill = "#10b981"; // 7-9h
            else if (p.qualityClass === "fair") fill = "#38bdf8"; // 6-7h
            else if (p.qualityClass === "short") fill = "#f59e0b"; // <6h
            else if (p.qualityClass === "long") fill = "#a855f7"; // >9h
        }

        const dateLabel = fd(p.date.getDate());
        const isRTL = (dict && dict.dir === 'rtl') || (!dict && document.documentElement.getAttribute('dir') === 'rtl');
        const timeArrow = isRTL ? '←' : '➔';
        const tipText = p.hasLog
            ? `${fd(p.hours)}h ${p.minutes > 0 ? fd(p.minutes) + 'm' : ''} (${fd(p.bedtime)} ${timeArrow} ${fd(p.waketime)})`
            : (rDict ? rDict.sleepNotLogged : "ثبت نشده");

        sleepBarsSVG += `
            <g class="dash-chart-bar-group" data-tip="${tipText}">
                ${p.hasLog ? `
                    <rect x="${x}" y="${y}" width="${sleepBarWidth}" height="${barHeight}" rx="4" fill="${fill}" class="dash-chart-bar sleep-bar" />
                ` : `
                    <rect x="${x + (sleepBarWidth - 4)/2}" y="${baselineY - 4}" width="4" height="4" rx="2" fill="#94a3b8" opacity="0.35" />
                `}
                <text x="${x + sleepBarWidth / 2}" y="${sleepChartHeight - 4}" text-anchor="middle" font-size="9" fill="#64748b">${dateLabel}</text>
            </g>
        `;
    });

    // SVG Bar Chart generation (30 days)
    const barWidth = 18;
    const barGap = 8;
    const chartHeight = 120;
    const totalWidth = stats.trendPoints.length * (barWidth + barGap);

    let barsSVG = "";
    stats.trendPoints.forEach((p, idx) => {
        const x = idx * (barWidth + barGap) + 4;
        const height = Math.max(8, Math.round((p.pct / 100) * (chartHeight - 30)));
        const y = chartHeight - height - 18;

        let fill = "#cbd5e1"; // empty / rest
        if (p.scheduled > 0) {
            if (p.pct === 100) fill = "#10b981"; // full green
            else if (p.pct > 0) fill = "#f59e0b"; // partial amber
            else fill = p.isPast ? "#f43f5e" : "#94a3b8"; // missed rose / pending
        }

        const dateLabel = fd(p.date.getDate());

        const tipText = p.scheduled > 0
            ? `${p.pct}% (${fd(p.completed)}/${fd(p.scheduled)})`
            : (rDict ? rDict.noScheduledTasks : "بدون برنامه");
        barsSVG += `
            <g class="dash-chart-bar-group" data-tip="${tipText}">
                <rect x="${x}" y="${y}" width="${barWidth}" height="${height}" rx="4" fill="${fill}" class="dash-chart-bar" />
                <text x="${x + barWidth / 2}" y="${chartHeight - 4}" text-anchor="middle" font-size="9" fill="#64748b">${dateLabel}</text>
            </g>
        `;
    });

    container.innerHTML = `
        <div class="dash-analytics-kpi-grid">
            <div class="dash-big-kpi-card">
                <div class="kpi-icon">🎯</div>
                <div class="kpi-info">
                    <span class="kpi-title">${rDict ? rDict.kpiAdherence : "نرخ پایبندی کل"}</span>
                    <span class="kpi-number">${fd(stats.overallAdherence)}%</span>
                    <span class="kpi-sub">${fd(stats.totalCompleted)} از ${fd(stats.totalScheduled)} برنامه انجام شده ${rDict && rDict.kpiSubCompleted ? rDict.kpiSubCompleted : '(تا دیروز)'}</span>
                </div>
            </div>

            <div class="dash-big-kpi-card">
                <div class="kpi-icon">🔥</div>
                <div class="kpi-info">
                    <span class="kpi-title">${rDict ? rDict.kpiCurrentStreak : "زنجیره فعلی"}</span>
                    <span class="kpi-number fire">${fd(stats.currentStreak)} ${rDict ? rDict.daysStreakSuffix : "روز"}</span>
                    <span class="kpi-sub">${rDict ? rDict.kpiLongestStreak : "رکورد زنجیره"}: ${fd(stats.longestStreak)} ${rDict ? rDict.daysStreakSuffix : "روز"}</span>
                </div>
            </div>

            <div class="dash-big-kpi-card">
                <div class="kpi-icon">⚖️</div>
                <div class="kpi-info">
                    <span class="kpi-title">${rDict ? rDict.kpiCompletedVsSkipped : (dict && dict.dir === 'rtl' ? 'تکمیل و رد شده' : 'Completed & Skipped')}</span>
                    <span class="kpi-number done">${fd(stats.totalCompleted)} <span class="divider">/</span> <span class="missed">${fd(stats.totalSkipped)}</span></span>
                    <span class="kpi-sub">${fd(stats.totalSkipped)} ${rDict && rDict.kpiSubSkipped ? rDict.kpiSubSkipped : 'مورد رد شده تا دیروز'}</span>
                </div>
            </div>
        </div>

        <div class="dash-chart-card">
            <div class="dash-chart-header">
                <h4>📈 ${rDict ? rDict.chartTitle : "روند پایبندی روزانه (۳۰ روز اخیر)"}</h4>
                <div class="dash-chart-legend">
                    <span class="legend-item"><span class="dot done"></span> ۱۰۰٪ انجام‌شده</span>
                    <span class="legend-item"><span class="dot partial"></span> بخشی</span>
                    <span class="legend-item"><span class="dot missed"></span> رد شده</span>
                </div>
            </div>
            <div class="dash-svg-container">
                <svg viewBox="0 0 ${totalWidth + 10} ${chartHeight}" class="dash-svg-chart">
                    ${barsSVG}
                </svg>
            </div>
        </div>

        <div class="dash-habit-breakdown-card">
            <h4>🎯 ${rDict ? rDict.habitBreakdownTitle : "تحلیل عملکرد به تفکیک هر کار روزمره"}</h4>
            <div class="dash-habits-list" id="dash-habits-list"></div>
        </div>

        <!-- SLEEP & CIRCADIAN ANALYTICS SECTION -->
        <div class="dash-sleep-analytics-section">
            <div class="dash-section-header">
                <h4>🌙 ${rDict ? rDict.sleepAnalyticsTitle : "تحلیل الگوی خواب و ریتم شبانه‌روزی (۳۰ روز اخیر)"}</h4>
                <div class="dash-sleep-legend">
                    <span class="legend-item"><span class="dot optimal"></span> ${rDict ? rDict.sleepQualityOptimal : 'کافی و استاندارد (۷-۹س)'}</span>
                    <span class="legend-item"><span class="dot fair"></span> ${rDict ? rDict.sleepQualityFair : 'نسبتاً خوب (۶-۷س)'}</span>
                    <span class="legend-item"><span class="dot short"></span> ${rDict ? rDict.sleepQualityShort : 'کم‌خوابی (<۶س)'}</span>
                </div>
            </div>

            <!-- 4 Sleep KPI Cards -->
            <div class="dash-analytics-kpi-grid sleep-kpi-grid">
                <!-- Avg Duration -->
                <div class="dash-big-kpi-card sleep-card">
                    <div class="kpi-icon">⏱️</div>
                    <div class="kpi-info">
                        <span class="kpi-title">${rDict ? rDict.sleepAvgDuration : "میانگین مدت خواب"}</span>
                        <span class="kpi-number highlight">${sleepStats.loggedDaysCount > 0 ? `${fd(sleepStats.avgHours)} ${rDict ? rDict.sleepHours : 'ساعت'} ${sleepStats.avgMinutes > 0 ? fd(sleepStats.avgMinutes) + ' ' + (rDict ? rDict.sleepMinutes : 'دقیقه') : ''}` : '—'}</span>
                        <span class="kpi-sub">${sleepStats.loggedDaysCount > 0 ? `${fd(sleepStats.loggedDaysCount)} شب ثبت‌شده در ۳۰ روز اخیر` : (rDict ? rDict.sleepNotLogged : 'هنوز ثبتی انجام نشده')}</span>
                    </div>
                </div>

                <!-- Avg Bedtime -->
                <div class="dash-big-kpi-card sleep-card">
                    <div class="kpi-icon">🛏️</div>
                    <div class="kpi-info">
                        <span class="kpi-title">${rDict ? rDict.sleepAvgBedtime : "میانگین زمان خواب"}</span>
                        <span class="kpi-number fire">${sleepStats.loggedDaysCount > 0 ? fd(sleepStats.avgBedtimeStr) : '—'}</span>
                        <span class="kpi-sub">${rDict ? rDict.sleepBedtime : 'خواب شبانه'}</span>
                    </div>
                </div>

                <!-- Avg Waketime -->
                <div class="dash-big-kpi-card sleep-card">
                    <div class="kpi-icon">🌅</div>
                    <div class="kpi-info">
                        <span class="kpi-title">${rDict ? rDict.sleepAvgWaketime : "میانگین زمان بیداری"}</span>
                        <span class="kpi-number done">${sleepStats.loggedDaysCount > 0 ? fd(sleepStats.avgWaketimeStr) : '—'}</span>
                        <span class="kpi-sub">${rDict ? rDict.sleepWaketime : 'بیداری صبحگاهی'}</span>
                    </div>
                </div>

                <!-- Optimal Sleep Rate -->
                <div class="dash-big-kpi-card sleep-card">
                    <div class="kpi-icon">🎯</div>
                    <div class="kpi-info">
                        <span class="kpi-title">${rDict ? rDict.sleepQualityRate : "خواب استاندارد و کافی"}</span>
                        <span class="kpi-number highlight">${sleepStats.loggedDaysCount > 0 ? `${fd(sleepStats.optimalRate)}%` : '—'}</span>
                        <span class="kpi-sub">${sleepStats.loggedDaysCount > 0 ? `${fd(sleepStats.optimalCount)} از ${fd(sleepStats.loggedDaysCount)} شب (۷ تا ۹ ساعت)` : (rDict ? rDict.sleepStandardRange : 'استاندارد سلامت')}</span>
                    </div>
                </div>
            </div>

            <!-- 30-Day Sleep Duration SVG Chart -->
            <div class="dash-chart-card sleep-chart-card">
                <div class="dash-chart-header">
                    <h4>📈 ${rDict ? rDict.sleepChartTitle : "روند مدت خواب روزانه (۳۰ روز اخیر)"}</h4>
                    <span class="dash-chart-target-hint">🎯 ${rDict ? rDict.sleepStandardRange : "محدوده استاندارد (۷ تا ۹ ساعت)"}</span>
                </div>
                <div class="dash-svg-container">
                    <svg viewBox="0 0 ${sleepTotalWidth + 10} ${sleepChartHeight}" class="dash-svg-chart">
                        ${sleepBarsSVG}
                    </svg>
                </div>
            </div>

            <!-- Smart Circadian Lifestyle Insight Card -->
            <div class="dash-sleep-insight-card">
                <div class="sleep-insight-icon">💡</div>
                <div class="sleep-insight-content">
                    <strong>${rDict ? rDict.sleepTitle : 'تحلیل الگوی خواب'}:</strong>
                    <p>${sleepStats.insight}</p>
                </div>
            </div>
        </div>
    `;

    // Habit-by-habit breakdown cards
    const habitsList = container.querySelector("#dash-habits-list");
    routines.forEach(r => {
        const hStats = calculatePerHabitStats(r, 30);
        const card = document.createElement("div");
        card.className = "dash-habit-item-card";
        card.innerHTML = `
            <div class="habit-item-header">
                <div class="habit-item-title-wrap">
                    <strong class="habit-title">${escapeHTML(r.title)}</strong>
                </div>
                <div class="habit-item-stats">
                    <span class="habit-badge-pct">${fd(hStats.adherencePercent)}% پایبندی</span>
                    <span class="habit-badge-streak">🔥 ${fd(hStats.currentStreak)} روز</span>
                </div>
            </div>
            <div class="habit-progress-bar-bg">
                <div class="habit-progress-bar-fill" style="width: ${hStats.adherencePercent}%"></div>
            </div>
            <div class="habit-insight-text">
                ${hStats.insight}
            </div>
        `;
        habitsList.appendChild(card);
    });
}

// ----------------------
//   TAB 3: HABIT MANAGEMENT
// ----------------------

function renderDashboardManagementTab(container) {
    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const rDict = dict && dict.routines ? dict.routines : null;
    const fd = typeof formatDigits === "function" ? formatDigits : (x => x);

    container.innerHTML = `
        <div class="dash-mgmt-container">
            <div class="dash-mgmt-header">
                <h4>${rDict ? rDict.tabManagement : "⚙️ مدیریت عادات و الگوها"}</h4>
                <button type="button" class="btn-mgmt-new-habit" id="btn-mgmt-add-new">+ تعریف کار روزمره جدید</button>
            </div>
            <div class="dash-mgmt-list" id="dash-mgmt-list"></div>
        </div>
    `;

    container.querySelector("#btn-mgmt-add-new").addEventListener("click", () => {
        closeRoutineDashboardModal();
        if (typeof openAddRoutineModal === "function") {
            openAddRoutineModal();
        }
    });

    const listEl = container.querySelector("#dash-mgmt-list");

    routines.forEach(routine => {
        const item = document.createElement("div");
        item.className = "dash-mgmt-item";

        let patternText = "هر روز";
        if (routine.pattern === "interval") patternText = `هر ${fd(routine.intervalDays)} روز`;
        else if (routine.pattern === "weekly") patternText = "هفتگی";
        else if (routine.pattern === "monthly") patternText = `روز ${fd(routine.monthlyDay)} ماه`;

        const completedHistoryCount = routine.completedDates ? Object.keys(routine.completedDates).length : 0;

        let startDateDisplay = routine.startDate || routine.anchorDate || "—";
        if (typeof formatDayTitleForCurrentCalendar === "function" && (routine.startDate || routine.anchorDate)) {
            startDateDisplay = formatDayTitleForCurrentCalendar(routine.startDate || routine.anchorDate);
        }
        item.innerHTML = `
            <div class="dash-mgmt-item-info">
                <div class="dash-mgmt-texts">
                    <strong>${escapeHTML(routine.title)}</strong>
                    <div class="dash-mgmt-sub">
                        <span class="dash-mgmt-pill">${patternText}</span>
                        <span class="dash-mgmt-start-pill">📅 ${rDict ? rDict.startDatePrefix : "شروع:"} ${startDateDisplay}</span>
                        <span class="dash-mgmt-history-count">${fd(completedHistoryCount)} بار انجام ثبت‌شده</span>
                    </div>
                </div>
            </div>
            <div class="dash-mgmt-actions">
                <button type="button" class="btn-mgmt-reset" data-id="${routine.id}" title="${rDict ? rDict.btnResetHabitHistory : 'پاکسازی سوابق'}">🧹 ${rDict ? rDict.btnResetHabitHistory : 'پاکسازی سوابق'}</button>
                <button type="button" class="btn-mgmt-delete" data-id="${routine.id}" title="حذف">🗑️ حذف</button>
            </div>
        `;

        // Reset history
        item.querySelector(".btn-mgmt-reset").addEventListener("click", (e) => {
            e.stopPropagation();
            const confirmMsg = rDict ? rDict.confirmResetHistory : "آیا از پاکسازی تمام سوابق ثبت‌شده برای این کار روزمره اطمینان دارید؟";
            if (confirm(confirmMsg)) {
                routine.completedDates = {};
                saveRoutines();
                renderDashboardCurrentTab();
                if (typeof updateRoutinePanel === "function" && typeof selectedDeadlineKey !== "undefined") {
                    updateRoutinePanel(selectedDeadlineKey);
                }
            }
        });

        // Delete habit
        item.querySelector(".btn-mgmt-delete").addEventListener("click", (e) => {
            e.stopPropagation();
            const confirmMsg = rDict ? rDict.deleteConfirm : "آیا از حذف این مورد از کارهای روزمره اطمینان دارید؟";
            if (confirm(confirmMsg)) {
                deleteRoutine(routine.id);
                renderDashboardCurrentTab();
            }
        });

        listEl.appendChild(item);
    });
}
