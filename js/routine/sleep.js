//////////////////////////////////////////////////////////////////
// ----------------------
//   SLEEP & WAKE-UP TRACKER (خواب و بیداری)
//   24-Hour Celestial Circadian Curve & Minimalist Actions
// ----------------------

let sleepLogs = {};
let celestialLiveTimer = null;

function normalizeSleepLogs() {
    if (!sleepLogs || typeof sleepLogs !== "object") return;
    const keys = Object.keys(sleepLogs).sort();
    let modified = false;

    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const log = sleepLogs[k];
        if (!log) continue;

        // If a day has waketime without bedtime, check previous day
        if (!log.bedtime && log.waketime) {
            const parts = k.split("-").map(Number);
            const prevD = new Date(parts[0], parts[1] - 1, parts[2] - 1);
            const prevKey = getSleepDateKey(prevD);
            if (sleepLogs[prevKey] && sleepLogs[prevKey].bedtime && !sleepLogs[prevKey].waketime) {
                // Pair them together in previous day's record!
                sleepLogs[prevKey].waketime = log.waketime;
                const dur = calculateSleepDuration(sleepLogs[prevKey].bedtime, sleepLogs[prevKey].waketime);
                if (dur) sleepLogs[prevKey].durationMinutes = dur.totalMinutes;
                delete sleepLogs[k];
                modified = true;
            }
        }
    }

    if (modified) {
        saveSleepLogs();
    }
}

function loadSleepLogs() {
    try {
        const saved = localStorage.getItem("fridgeSleepLogs");
        if (saved) {
            sleepLogs = JSON.parse(saved);
            normalizeSleepLogs();
        } else {
            sleepLogs = {};
        }
    } catch (e) {
        sleepLogs = {};
    }
}

function saveSleepLogs() {
    try {
        localStorage.setItem("fridgeSleepLogs", JSON.stringify(sleepLogs));
        if (typeof isExtension !== "undefined" && isExtension) {
            chrome.storage.local.set({ fridgeSleepLogs: sleepLogs });
        }
    } catch (e) {}
}

function getSleepDateKey(dateKeyOrGDate) {
    if (!dateKeyOrGDate) {
        const now = new Date();
        const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, "0"), d = String(now.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }
    if (dateKeyOrGDate instanceof Date) {
        const y = dateKeyOrGDate.getFullYear(), m = String(dateKeyOrGDate.getMonth() + 1).padStart(2, "0"), d = String(dateKeyOrGDate.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }
    if (typeof parseAnyDeadlineKey === "function") {
        const parsed = parseAnyDeadlineKey(dateKeyOrGDate);
        if (parsed && parsed.gKey) return parsed.gKey;
    }
    return String(dateKeyOrGDate);
}

// Circadian cycle helper (Dawn boundary at 04:00 AM)
// Between 00:00 and 03:59, biological cycle belongs to yesterday's night
function getCircadianSleepCycleDate(dateObj) {
    const d = (dateObj instanceof Date) ? new Date(dateObj) : new Date();
    if (d.getHours() < 4) {
        d.setDate(d.getDate() - 1);
    }
    return d;
}

function getCircadianSleepDateKey(dateObj) {
    const d = getCircadianSleepCycleDate(dateObj);
    return getSleepDateKey(d);
}

function getSleepLogForDate(dateKey) {
    const key = getSleepDateKey(dateKey);
    return sleepLogs[key] || null;
}

function calculateSleepDuration(bedtime, waketime) {
    if (!bedtime || !waketime) return null;
    const [bH, bM] = bedtime.split(":").map(Number);
    const [wH, wM] = waketime.split(":").map(Number);
    if (isNaN(bH) || isNaN(bM) || isNaN(wH) || isNaN(wM)) return null;
    if (bedtime === waketime) return null;

    let bedMin = bH * 60 + bM;
    let wakeMin = wH * 60 + wM;
    if (wakeMin <= bedMin) {
        wakeMin += 24 * 60;
    }
    const totalMinutes = wakeMin - bedMin;
    if (totalMinutes <= 0 || totalMinutes > 18 * 60) return null;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let qualityKey = "sleepQualityOptimal";
    let qualityClass = "optimal";
    if (totalMinutes < 360) { // < 6 hours
        qualityKey = "sleepQualityShort";
        qualityClass = "short";
    } else if (totalMinutes < 420) { // 6 to 7 hours
        qualityKey = "sleepQualityFair";
        qualityClass = "fair";
    } else if (totalMinutes <= 540) { // 7 to 9 hours
        qualityKey = "sleepQualityOptimal";
        qualityClass = "optimal";
    } else { // > 9 hours
        qualityKey = "sleepQualityLong";
        qualityClass = "long";
    }

    return { totalMinutes, hours, minutes, qualityKey, qualityClass };
}

function setSleepTime(dateKey, type, timeStr) {
    const key = getSleepDateKey(dateKey);
    if (!sleepLogs[key]) {
        sleepLogs[key] = { bedtime: "", waketime: "" };
    }
    sleepLogs[key][type] = timeStr;
    const dur = calculateSleepDuration(sleepLogs[key].bedtime, sleepLogs[key].waketime);
    if (dur) {
        sleepLogs[key].durationMinutes = dur.totalMinutes;
    } else {
        delete sleepLogs[key].durationMinutes;
    }
    sleepLogs[key].updatedAt = Date.now();
    saveSleepLogs();
}

function clearSleepLogForDate(dateKey) {
    const key = getSleepDateKey(dateKey);
    if (sleepLogs[key]) {
        delete sleepLogs[key];
        saveSleepLogs();
    }
}

// Initial load
loadSleepLogs();

// ----------------------
//   CIRCADIAN SINE CURVE MATH (04:00 to 04:00 next day)
// ----------------------
// Canvas width: 340px, height: 84px, horizon: y = 64
// Day Arc (04:00 to 18:00 = 840 mins / 14h): x from 10 to 170, peak at x=90 (11:00), y = 64 - 46 * sin(u * pi)
// Night Arc (18:00 to 04:00 = 600 mins / 10h): x from 170 to 330, peak at x=250 (23:00), y = 64 - 46 * sin(u * pi)
function calculateCelestialCoordinates(curMinutes) {
    // 04:00 = 240 mins, 18:00 = 1080 mins
    const isDay = curMinutes >= 240 && curMinutes < 1080;

    if (isDay) {
        const u = Math.min(1, Math.max(0, (curMinutes - 240) / 840));
        const x = Math.round((10 + u * 160) * 10) / 10;
        const y = Math.round((64 - 46 * Math.sin(u * Math.PI)) * 10) / 10;
        const pos = { x, y };
        return {
            isDay: true,
            activePos: pos,
            sunPos: pos,
            moonPos: null
        };
    } else {
        const nightMins = curMinutes >= 1080 ? (curMinutes - 1080) : (curMinutes + 360);
        const u = Math.min(1, Math.max(0, nightMins / 600));
        const x = Math.round((170 + u * 160) * 10) / 10;
        const y = Math.round((64 - 46 * Math.sin(u * Math.PI)) * 10) / 10;
        const pos = { x, y };
        return {
            isDay: false,
            activePos: pos,
            sunPos: null,
            moonPos: pos
        };
    }
}

// ----------------------
//   RENDER 24-HOUR CIRCADIAN SLEEP TRACKER
// ----------------------
function updateSleepTrackerWidget(deadlineKey) {
    const container = document.getElementById("sleep-tracker-container");
    if (!container) return;

    const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
        ? TRANSLATIONS[currentLanguage]
        : null;
    const rDict = dict && dict.routines ? dict.routines : null;
    const fd = typeof formatDigits === "function" ? formatDigits : (x => x);

    // Current time
    const now = new Date();
    const curHours = now.getHours();
    const curMins = now.getMinutes();
    const curTotalMins = curHours * 60 + curMins;
    const isDaytime = curTotalMins >= 240 && curTotalMins < 1080; // 04:00 to 18:00
    const celestial = calculateCelestialCoordinates(curTotalMins);

    // Target view date
    const targetParsed = (typeof parseAnyDeadlineKey === "function") ? parseAnyDeadlineKey(deadlineKey) : null;
    const gDate = targetParsed ? targetParsed.gDate : now;
    const viewDateKey = getSleepDateKey(gDate);

    // Check if user is looking at today
    const isViewingToday = !targetParsed || (
        gDate.getFullYear() === now.getFullYear() &&
        gDate.getMonth() === now.getMonth() &&
        gDate.getDate() === now.getDate()
    );

    let activeKey = viewDateKey;
    let isLastNight = false;

    if (isViewingToday) {
        if (isDaytime) {
            // In daytime, show last night's completed session unless today has an explicit log
            const yDate = new Date(now);
            yDate.setDate(now.getDate() - 1);
            const yKey = getSleepDateKey(yDate);
            const yLog = sleepLogs[yKey];
            const tLog = sleepLogs[viewDateKey];

            if (tLog && (tLog.bedtime || tLog.waketime)) {
                activeKey = viewDateKey;
            } else if (yLog && (yLog.bedtime || yLog.waketime)) {
                activeKey = yKey;
                isLastNight = true;
            } else {
                activeKey = viewDateKey;
            }
        } else {
            // In nighttime (18:00 to 04:00)
            if (curHours < 4) {
                // Post-midnight hours (00:00 to 03:59) belong to active cycle of yesterday's night
                activeKey = getCircadianSleepDateKey(now);
            } else {
                activeKey = viewDateKey;
            }
        }
    }

    const activeDate = (activeKey === viewDateKey) ? gDate : new Date(activeKey + "T12:00:00");
    const isLocked = typeof isDateLockedForRoutineEditing === "function" && isDateLockedForRoutineEditing(activeDate);
    const log = sleepLogs[activeKey] || { bedtime: "", waketime: "" };
    const bedtime = log.bedtime || "";
    const waketime = log.waketime || "";
    const duration = calculateSleepDuration(bedtime, waketime);

    // Text translations
    const bedtimeLabel = rDict ? rDict.sleepBedtime : "خواب";
    const waketimeLabel = rDict ? rDict.sleepWaketime : "بیداری";
    const sleepNowText = rDict ? rDict.sleepNow : "الان خوابیدم";
    const wakeNowText = rDict ? rDict.wakeNow : "الان بیدار شدم";
    const clearText = rDict ? rDict.sleepClear : "پاکسازی";
    const lastNightLabel = rDict ? (rDict.sleepLastNight || "خواب شب گذشته") : "خواب شب گذشته";
    const isRTL = (dict && dict.dir === 'rtl') || (!dict && document.documentElement.getAttribute('dir') === 'rtl');
    const timeArrow = isRTL ? '←' : '➔';

    // Duration text
    let durFormatted = "";
    let qualityBadgeHTML = "";
    if (duration) {
        const qualityText = rDict && rDict[duration.qualityKey] ? rDict[duration.qualityKey] : "";
        if (duration.minutes > 0) {
            durFormatted = `${fd(duration.hours)} ${rDict ? rDict.sleepHours : 'ساعت'} ${fd(duration.minutes)} ${rDict ? rDict.sleepMinutes : 'دقیقه'}`;
        } else {
            durFormatted = `${fd(duration.hours)} ${rDict ? rDict.sleepHours : 'ساعت'}`;
        }
        qualityBadgeHTML = `<span class="circadian-quality-pill ${duration.qualityClass}">${qualityText}</span>`;
    }

    // Full 24-Hour Circadian Horizon Curve
    const isDayActive = celestial.isDay;
    const sunPos = celestial.sunPos;
    const moonPos = celestial.moonPos;

    container.innerHTML = `
        <div class="sleep-tracker-card ${isDayActive ? 'is-day' : 'is-night'} ${isLocked ? 'is-locked' : ''}" id="sleep-tracker-card-el">
            <!-- Circadian 24h Curve SVG -->
            <div class="circadian-curve-wrapper">
                <svg class="circadian-svg" viewBox="0 0 340 84">
                    <defs>
                        <!-- Day Sky Gradient -->
                        <linearGradient id="dayCurveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.18"/>
                            <stop offset="100%" stop-color="#fbbf24" stop-opacity="0.0"/>
                        </linearGradient>
                        <!-- Night Sky Gradient -->
                        <linearGradient id="nightCurveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#818cf8" stop-opacity="0.18"/>
                            <stop offset="100%" stop-color="#818cf8" stop-opacity="0.0"/>
                        </linearGradient>
                        <!-- Active Sun Aura -->
                        <radialGradient id="sunAuraGrad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stop-color="#fde047" stop-opacity="0.85"/>
                            <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.35"/>
                            <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
                        </radialGradient>
                    </defs>

                    <!-- Horizon Ground Line -->
                    <line x1="6" y1="64" x2="334" y2="64" class="circadian-horizon-line"/>

                    <!-- Day Area Fill -->
                    <path d="M 10 64 C 36 40.5, 61 18, 90 18 C 119 18, 144 40.5, 170 64 Z" fill="url(#dayCurveGrad)" class="circadian-area-fill"/>
                    <!-- Day Curve Stroke -->
                    <path d="M 10 64 C 36 40.5, 61 18, 90 18 C 119 18, 144 40.5, 170 64" class="circadian-curve-path day-path ${isDayActive ? 'active-path' : ''}"/>

                    <!-- Night Area Fill -->
                    <path d="M 170 64 C 196 40.5, 221 18, 250 18 C 279 18, 304 40.5, 330 64 Z" fill="url(#nightCurveGrad)" class="circadian-area-fill"/>
                    <!-- Night Curve Stroke -->
                    <path d="M 170 64 C 196 40.5, 221 18, 250 18 C 279 18, 304 40.5, 330 64" class="circadian-curve-path night-path ${!isDayActive ? 'active-path' : ''}"/>

                    <!-- Celestial Markers (Tick Dots) -->
                    <circle cx="10" cy="64" r="1.6" class="circadian-tick"/>
                    <circle cx="90" cy="64" r="1.3" class="circadian-tick" opacity="0.6"/>
                    <circle cx="170" cy="64" r="1.6" class="circadian-tick"/>
                    <circle cx="250" cy="64" r="1.3" class="circadian-tick" opacity="0.6"/>
                    <circle cx="330" cy="64" r="1.6" class="circadian-tick"/>

                    <!-- Time Ticks Labels: 04:00 to 04:00 Dawn Cycle -->
                    <text x="14" y="78" class="circadian-tick-text" text-anchor="middle">${fd('04:00')}</text>
                    <text x="90" y="78" class="circadian-tick-text day-highlight" text-anchor="middle">${fd('11:00')}</text>
                    <text x="170" y="78" class="circadian-tick-text" text-anchor="middle">${fd('18:00')}</text>
                    <text x="250" y="78" class="circadian-tick-text night-highlight" text-anchor="middle">${fd('23:00')}</text>
                    <text x="326" y="78" class="circadian-tick-text" text-anchor="middle">${fd('04:00')}</text>

                    <!-- The Sun Actor (Daytime only) -->
                    ${isDayActive && sunPos ? `
                    <g transform="translate(${sunPos.x}, ${sunPos.y})" class="celestial-actor-group active-actor">
                        <circle cx="0" cy="0" r="13" fill="url(#sunAuraGrad)" class="sun-pulse-aura"/>
                        <circle cx="0" cy="0" r="5" class="celestial-sun-disc"/>
                        <!-- Sun Rays -->
                        <g class="sun-mini-rays celestial-sun-rays" stroke-width="1.1" stroke-linecap="round">
                            <line x1="0" y1="-7" x2="0" y2="-9"/>
                            <line x1="0" y1="7" x2="0" y2="9"/>
                            <line x1="-7" y1="0" x2="-9" y2="0"/>
                            <line x1="7" y1="0" x2="9" y2="0"/>
                            <line x1="-4.9" y1="-4.9" x2="-6.4" y2="-6.4"/>
                            <line x1="4.9" y1="4.9" x2="6.4" y2="6.4"/>
                            <line x1="-4.9" y1="4.9" x2="-6.4" y2="6.4"/>
                            <line x1="4.9" y1="-4.9" x2="6.4" y2="-6.4"/>
                        </g>
                    </g>
                    ` : ''}

                    <!-- The Moon Actor (Nighttime only - aligned with curve & no dots) -->
                    ${!isDayActive && moonPos ? `
                    <g transform="translate(${moonPos.x}, ${moonPos.y})" class="celestial-actor-group active-actor">
                        <g transform="translate(0, -2.5)">
                            <circle cx="0" cy="0" r="12" class="moon-pulse-aura"/>
                            <path d="M3.2 -4.2C2.3 -0.4 0 1.8 -3.8 2.2C-1.8 3.6 0.9 4.1 3.2 2.8C5.5 1.4 6 -1.8 3.2 -4.2Z" class="celestial-moon-body"/>
                        </g>
                    </g>
                    ` : ''}
                </svg>
            </div>

            <!-- Sleek Minimal Controls Row -->
            <div class="circadian-controls-row">
                <!-- Logged Times & Duration Summary -->
                <div class="circadian-status-col">
                    ${duration ? `
                        <div class="circadian-duration-wrap">
                            <div class="circadian-row-top">
                                ${isLastNight ? `<span class="circadian-lastnight-tag">${lastNightLabel}:</span>` : ''}
                                <span class="circadian-duration-text">${durFormatted}</span>
                                ${isLocked ? '<span class="sleep-locked-badge" title="قفل‌شده">🔒</span>' : ''}
                            </div>
                            <div class="circadian-row-bottom">
                                ${qualityBadgeHTML}
                                <span class="circadian-times-summary">(${fd(bedtime)} ${timeArrow} ${fd(waketime)})</span>
                            </div>
                        </div>
                    ` : (bedtime ? `
                        <div class="circadian-duration-wrap">
                            <div class="circadian-row-top">
                                ${isLastNight ? `<span class="circadian-lastnight-tag">${lastNightLabel}:</span>` : ''}
                                <span class="circadian-single-time">${bedtimeLabel}: ${fd(bedtime)}</span>
                                ${isLocked ? '<span class="sleep-locked-badge" title="قفل‌شده">🔒</span>' : ''}
                            </div>
                        </div>
                    ` : (waketime ? `
                        <div class="circadian-duration-wrap">
                            <div class="circadian-row-top">
                                ${isLastNight ? `<span class="circadian-lastnight-tag">${lastNightLabel}:</span>` : ''}
                                <span class="circadian-single-time">${waketimeLabel}: ${fd(waketime)}</span>
                                ${isLocked ? '<span class="sleep-locked-badge" title="قفل‌شده">🔒</span>' : ''}
                            </div>
                        </div>
                    ` : ''))}
                </div>

                <!-- Minimalist Quick-Action Icon Buttons (with Expanding Hover Label) -->
                ${!isLocked ? `
                    <div class="circadian-quick-actions">
                        <!-- Manual Entry / Edit Button (opens Dashboard Day Inspector) -->
                        <button type="button" class="btn-circadian-action edit-act" id="btn-open-sleep-inspector" title="${rDict ? rDict.sleepEditTooltip : 'ویرایش یا ثبت دستی ساعت (در پنل تحلیل)'}" aria-label="${rDict ? rDict.sleepEditTooltip : 'ویرایش یا ثبت دستی ساعت'}">
                            <svg class="action-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                            <span class="btn-action-text">${rDict && rDict.sleepEditActionText ? rDict.sleepEditActionText : 'ویرایش و ثبت'}</span>
                        </button>

                        <!-- Sleep Action (zzz icon button) -->
                        <button type="button" class="btn-circadian-action sleep-act" id="btn-quick-sleep" title="${sleepNowText}" aria-label="${sleepNowText}">
                            <svg class="action-svg zzz-svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path class="zzz-path zzz-p1" d="M17 17h3l-3 4h3" stroke-width="1.5" />
                                <path class="zzz-path zzz-p2" d="M12 11h4l-4 5h4" stroke-width="1.8" />
                                <path class="zzz-path zzz-p3" d="M4 6h5l-5 6h5" />
                            </svg>
                            <span class="btn-action-text">${sleepNowText}</span>
                        </button>

                        <!-- Wake Action (Sleepy Coffee Emoji icon button) -->
                        <button type="button" class="btn-circadian-action wake-act" id="btn-quick-wake" title="${wakeNowText}" aria-label="${wakeNowText}">
                            <svg class="sleepy-coffee-icon" viewBox="0 0 38 34" width="24" height="22" style="overflow: visible; display: inline-block; flex-shrink: 0;" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="15.5" cy="18" r="13" fill="#eddc67" stroke="#1f212b" stroke-width="1.4" />
                                <path d="M 7 12 C 9 8 15 7 19 8" fill="none" stroke="#fef6aa" stroke-width="1.2" stroke-linecap="round" />
                                <ellipse cx="7.2" cy="22.2" rx="2.4" ry="1.4" fill="#f87171" opacity="0.4" />
                                <ellipse cx="20.8" cy="22.2" rx="2.4" ry="1.4" fill="#f87171" opacity="0.4" />
                                <path d="M 7.5 10.5 C 9 8.5 12.5 8.5 14 10.2" fill="none" stroke="#1f212b" stroke-width="1.3" stroke-linecap="round" />
                                <path d="M 16.5 10.2 C 18 8.5 21.5 8.5 23 10.5" fill="none" stroke="#1f212b" stroke-width="1.3" stroke-linecap="round" />
                                <path d="M 7 21.5 C 8.5 23.5 12 23.5 13.5 21.5" fill="none" stroke="#1f212b" stroke-width="0.8" stroke-linecap="round" opacity="0.5" />
                                <path d="M 16.5 21.5 C 18 23.5 21.5 23.5 23 21.5" fill="none" stroke="#1f212b" stroke-width="0.8" stroke-linecap="round" opacity="0.5" />
                                <g class="eye-left">
                                    <ellipse cx="10.4" cy="18" rx="3.5" ry="4.2" fill="#ffffff" stroke="#1f212b" stroke-width="0.8" />
                                    <circle cx="10.5" cy="18.8" r="1.8" fill="#1f212b" />
                                    <circle cx="11.2" cy="18.2" r="0.6" fill="#ffffff" />
                                    <path d="M 6.8 17.5 C 8 19.8 12.8 19.8 14 17.5 C 14 13.5 6.8 13.5 6.8 17.5 Z" fill="#eddc67" stroke="#1f212b" stroke-width="1" stroke-linejoin="round" />
                                    <path d="M 7.8 15.5 C 9.2 16.6 11.6 16.6 13 15.5" fill="none" stroke="#1f212b" stroke-width="0.6" stroke-linecap="round" opacity="0.5" />
                                </g>
                                <g class="eye-right">
                                    <ellipse cx="19.8" cy="18" rx="3.5" ry="4.2" fill="#ffffff" stroke="#1f212b" stroke-width="0.8" />
                                    <circle cx="19.9" cy="18.8" r="1.8" fill="#1f212b" />
                                    <circle cx="20.6" cy="18.2" r="0.6" fill="#ffffff" />
                                    <path d="M 16.2 17.5 C 17.4 19.8 22.2 19.8 23.4 17.5 C 23.4 13.5 16.2 13.5 16.2 17.5 Z" fill="#eddc67" stroke="#1f212b" stroke-width="1" stroke-linejoin="round" />
                                    <path d="M 17.2 15.5 C 18.6 16.6 21 16.6 22.4 15.5" fill="none" stroke="#1f212b" stroke-width="0.6" stroke-linecap="round" opacity="0.5" />
                                </g>
                                <path d="M 12 25.8 C 13.8 24.8 15.8 26.8 17.5 25.4" fill="none" stroke="#1f212b" stroke-width="1.3" stroke-linecap="round" />
                                <g class="coffee-group">
                                    <path class="steam-line steam-1" d="M 27.5 12.5 C 26 10 28.2 8 26.8 5 C 25.6 3.5 26.6 2 26.2 1" fill="none" stroke="#94a3b8" stroke-width="1.1" stroke-linecap="round" />
                                    <path class="steam-line steam-2" d="M 30.5 12 C 32 9.5 30 7.5 31.4 5 C 32.2 3.8 31.5 2.5 31 1.5" fill="none" stroke="#94a3b8" stroke-width="0.9" stroke-linecap="round" />
                                    <rect x="23.5" y="14.5" width="8.5" height="11.5" rx="2.2" fill="#38bdf8" stroke="#1f212b" stroke-width="1.3" />
                                    <path d="M 25 16 L 25 24" stroke="#bae6fd" stroke-width="1" stroke-linecap="round" />
                                    <ellipse cx="27.75" cy="14.8" rx="4" ry="1.3" fill="#3e2723" stroke="#1f212b" stroke-width="0.9" />
                                    <path d="M 32 17 C 35 17 35.2 22.5 32 23" fill="none" stroke="#1f212b" stroke-width="1.4" stroke-linecap="round" />
                                    <g class="hand-fingers-right">
                                        <rect x="30.8" y="16.8" width="3.4" height="2.2" rx="1.1" fill="#eddc67" stroke="#1f212b" stroke-width="0.8" />
                                        <rect x="31" y="19.4" width="3.6" height="2.2" rx="1.1" fill="#eddc67" stroke="#1f212b" stroke-width="0.8" />
                                        <rect x="30.8" y="22" width="3.4" height="2.2" rx="1.1" fill="#eddc67" stroke="#1f212b" stroke-width="0.8" />
                                    </g>
                                </g>
                            </svg>
                            <span class="btn-action-text">${wakeNowText}</span>
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // Event listeners

    const openInspectorBtn = container.querySelector("#btn-open-sleep-inspector");
    if (openInspectorBtn) {
        openInspectorBtn.addEventListener("click", () => {
            if (typeof openRoutineDashboardModal === "function") {
                const parts = activeKey.split("-").map(Number);
                const targetD = new Date(parts[0], parts[1] - 1, parts[2]);
                dashboardActiveTab = "calendar";
                openRoutineDashboardModal(targetD);
            }
        });
    }

    const durationWrap = container.querySelector(".circadian-duration-wrap");
    if (durationWrap) {
        durationWrap.style.cursor = "pointer";
        durationWrap.title = rDict ? rDict.sleepEditTooltip : "ویرایش یا ثبت دستی ساعت (در پنل تحلیل)";
        durationWrap.addEventListener("click", (e) => {
            if (typeof openRoutineDashboardModal === "function") {
                const parts = activeKey.split("-").map(Number);
                const targetD = new Date(parts[0], parts[1] - 1, parts[2]);
                dashboardActiveTab = "calendar";
                openRoutineDashboardModal(targetD);
            }
        });
    }

    const clearBtn = container.querySelector("#btn-clear-sleep");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            clearSleepLogForDate(activeKey);
            updateSleepTrackerWidget(deadlineKey);
            if (typeof updateSidePanelHeightAndCollapse === "function") {
                updateSidePanelHeightAndCollapse();
            }
        });
    }

    const quickSleepBtn = container.querySelector("#btn-quick-sleep");
    if (quickSleepBtn && !isLocked) {
        quickSleepBtn.addEventListener("click", () => {
            const currentNow = new Date();
            const hh = String(currentNow.getHours()).padStart(2, "0");
            const mm = String(currentNow.getMinutes()).padStart(2, "0");

            let targetCycleKey = activeKey;
            if (isViewingToday) {
                const yDate = new Date(currentNow.getFullYear(), currentNow.getMonth(), currentNow.getDate() - 1);
                const yKey = getSleepDateKey(yDate);

                // If daytime and yesterday has an open waketime without bedtime, setting bedtime completes yesterday
                if (currentNow.getHours() < 18 && sleepLogs[yKey] && sleepLogs[yKey].waketime && !sleepLogs[yKey].bedtime) {
                    targetCycleKey = yKey;
                } else {
                    targetCycleKey = getCircadianSleepDateKey(currentNow);
                }
            }

            setSleepTime(targetCycleKey, "bedtime", `${hh}:${mm}`);
            updateSleepTrackerWidget(deadlineKey);
            if (typeof updateSidePanelHeightAndCollapse === "function") {
                updateSidePanelHeightAndCollapse();
            }
        });
    }

    const quickWakeBtn = container.querySelector("#btn-quick-wake");
    if (quickWakeBtn && !isLocked) {
        quickWakeBtn.addEventListener("click", () => {
            const currentNow = new Date();
            const hh = String(currentNow.getHours()).padStart(2, "0");
            const mm = String(currentNow.getMinutes()).padStart(2, "0");

            let targetCycleKey = activeKey;
            if (isViewingToday) {
                const yDate = new Date(currentNow.getFullYear(), currentNow.getMonth(), currentNow.getDate() - 1);
                const yKey = getSleepDateKey(yDate);
                const tKey = getSleepDateKey(currentNow);

                // Morning/daytime wake-up always pairs into yesterday's record (روز قبلی)!
                if (currentNow.getHours() < 18) {
                    targetCycleKey = yKey;
                    // If today had an orphan bedtime (e.g. set after midnight), pair it into yesterday
                    if (sleepLogs[tKey] && sleepLogs[tKey].bedtime && (!sleepLogs[yKey] || !sleepLogs[yKey].bedtime)) {
                        setSleepTime(yKey, "bedtime", sleepLogs[tKey].bedtime);
                        delete sleepLogs[tKey].bedtime;
                    }
                } else {
                    targetCycleKey = tKey;
                }
            }

            setSleepTime(targetCycleKey, "waketime", `${hh}:${mm}`);
            updateSleepTrackerWidget(deadlineKey);
            if (typeof updateSidePanelHeightAndCollapse === "function") {
                updateSidePanelHeightAndCollapse();
            }
        });
    }

    // Set 60-second live ticker
    if (!celestialLiveTimer) {
        celestialLiveTimer = setInterval(() => {
            if (document.getElementById("sleep-tracker-card-el")) {
                const activeDeadline = (typeof selectedDeadlineKey !== "undefined") ? selectedDeadlineKey : "";
                updateSleepTrackerWidget(activeDeadline);
            }
        }, 60000);
    }
}
