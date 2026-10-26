//////////////////////////////////////////////////////////////////
// ----------------------
//       I18N SYSTEM
// ----------------------

const SUPPORTED_LANGUAGES = ['fa', 'en', 'ko', 'ar'];

const FLAG_SVGS = {
    fa: `<svg class="lang-flag-svg" viewBox="0 0 24 16" width="20" height="13.3" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" rx="2" fill="#ffffff"/><rect width="24" height="5.33" rx="1.5" fill="#239f40"/><rect y="10.67" width="24" height="5.33" rx="1.5" fill="#da0000"/><circle cx="12" cy="8" r="2.2" fill="#da0000"/></svg>`,
    en: `<svg class="lang-flag-svg" viewBox="0 0 24 16" width="20" height="13.3" xmlns="http://www.w3.org/2000/svg"><clipPath id="ukClip"><rect width="24" height="16" rx="2"/></clipPath><g clip-path="url(#ukClip)"><rect width="24" height="16" fill="#012169"/><path d="M0 0L24 16M24 0L0 16" stroke="#ffffff" stroke-width="3"/><path d="M0 0L24 16M24 0L0 16" stroke="#C8102E" stroke-width="1.8"/><path d="M12 0V16M0 8H24" stroke="#ffffff" stroke-width="5"/><path d="M12 0V16M0 8H24" stroke="#C8102E" stroke-width="3"/></g></svg>`,
    ko: `<svg class="lang-flag-svg" viewBox="0 0 24 16" width="20" height="13.3" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" rx="2" fill="#ffffff" stroke="#e2e8f0" stroke-width="0.6"/><circle cx="12" cy="8" r="3.6" fill="#c60c30"/><path d="M8.4 8A3.6 3.6 0 0 0 15.6 8A1.8 1.8 0 0 0 12 8A1.8 1.8 0 0 1 8.4 8Z" fill="#003478"/></svg>`,
    ar: `<svg class="lang-flag-svg" viewBox="0 0 24 16" width="20" height="13.3" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="16" rx="2" fill="#006C35"/><line x1="6" y1="11" x2="18" y2="11" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/><ellipse cx="12" cy="7" rx="3.5" ry="2" fill="#ffffff"/></svg>`
};


const TRANSLATIONS = {
    fa: {
        dir: 'rtl',
        langName: 'فارسی',
        flag: '🇮🇷',
        addNote: 'یادداشت جدید +',
        noteTitlePlaceholder: 'عنوان یادداشت...',
        taskPlaceholder: 'کار جدید...',
        pencilTitle: 'برای خط‌زدن تسک، مداد را روی آن بکشید',
        eraserTitle: 'برای حذف تسک، پاک‌کن را روی آن بکشید',
        themeToggleTitle: 'تغییر حالت شب و روز (روشن / تاریک)',
        langToggleTitle: 'تغییر زبان (Change Language)',
        calendarClose: '− بستن تقویم',
        calendarOpen: '+ نمایش تقویم',
        calendarTypeTitle: 'تغییر نوع تقویم (شمسی / میلادی / قمری)',
        prevMonthTitle: 'ماه قبل',
        nextMonthTitle: 'ماه بعد',
        weekdays: {
            jalali: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'],
            gregorian: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'],
            hijri: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
        },
        months: {
            jalali: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
            gregorian: ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'],
            hijri: ['محرم', 'صفر', 'ربیع‌الاول', 'ربیع‌الثانی', 'جمادی‌الاول', 'جمادی‌الثانی', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذی‌القعده', 'ذی‌الحجه']
        },
        calendarNames: {
            jalali: 'شمسی',
            gregorian: 'میلادی',
            hijri: 'قمری'
        },
        deadlineTitleToday: 'ددلاین‌های امروز',
        deadlineTitleFor: (dateStr) => `ددلاین‌های ${dateStr}`,
        deadlineEmpty: 'هیچ ددلاینی برای این روز ثبت نشده است.',
        overdueSectionTitle: 'کارهای عقب‌افتاده',
        overdueCountSuffix: 'مورد',
        todayRemaining: (h) => `امروز (${h} ساعت)`,
        overdueDaysAgo: (d) => `عقب‌افتاده (${d} روز پیش)`,
        doneLabel: 'انجام شده',
        ctx: {
            edit: 'ویرایش',
            toggleScribble: 'خط‌زدن / بازگردانی',
            delete: 'حذف',
            setDeadline: 'تنظیم تاریخ',
            clearDeadline: 'حذف تاریخ',
            detachNote: '⎘ خارج کردن از دسته',
            dissolveStack: '📂 انحلال دسته',
            deleteNote: '🗑️ حذف'
        },
        trash: {
            title: '🗑️ سطل زباله',
            sub: 'یادداشت‌های مچاله شده تا ۲۴ ساعت در اینجا نگهداری می‌شوند',
            emptyBtn: 'خالی کردن سطل',
            emptyMsg: 'سطل زباله خالی است',
            restore: 'بازگردانی',
            deletePermanently: 'حذف دائم'
        },
        routines: {
            title: 'کارهای روزمره',
            addNew: '+ کار جدید',
            empty: 'کاری برای روزمره‌های این روز ثبت نشده است.',
            progressTitle: 'پیشرفت کارهای روزمره',
            progressAllDone: 'همه کارهای روزمره انجام شد! 🎉',
            progressNoTasks: 'بدون برنامه روزمره برای این روز',
            progressSubtitle: (done, total) => `${done} از ${total} کار روزمره انجام شده`,
            progressQuietDay: 'روز آرامی در پیش دارید ✨',
            patternDaily: 'هر روز',
            patternInterval: (n) => `هر ${n} روز`,
            patternWeekly: 'هفتگی',
            patternMonthly: (d) => `روز ${d} ماه`,
            deleteConfirm: 'آیا از حذف این مورد از کارهای روزمره اطمینان دارید؟',
            modalTitle: 'تعریف کار روزمره و عادت جدید',
            modalTitleLabel: 'عنوان کار یا عادت:',
            modalTitlePlaceholder: 'مثلاً: ورزش صبحگاهی، مطالعه، تمرین...',
            modalPatternLabel: 'الگوی تکرار:',
            patternOptionDaily: 'هر روز',
            patternOptionInterval: 'روزهای درمیون / بازه‌ای',
            patternOptionWeekly: 'روزهای خاص هفته',
            patternOptionMonthly: 'روز مشخص ماه',
            modalIntervalLabel: 'تکرار هر چند روز یک‌بار؟',
            modalIntervalPrefix: 'هر',
            modalIntervalSuffix: 'روز یک‌بار (مثلاً ۲ = یک روز درمیون)',
            modalWeeklyLabel: 'در چه روزهایی از هفته؟',
            modalStartDateLabel: 'تاریخ شروع:',
            modalStartDateHint: 'روزهای قبل از این تاریخ جزو آمار کارهای انجام‌نشده محاسبه نخواهند شد',
            retroactiveTitle: 'کارهای اضافه‌شده بعد از این تاریخ (جهت ثبت عطف‌به‌ماسبق):',
            insightNewHabit: '🌱 کار تازه تعریف‌شده؛ هنوز موعد اجرای آن فرا نرسیده است.',
            noScheduledTasks: 'بدون برنامه',
            startDatePrefix: 'شروع:',
            modalMonthlyLabel: 'روز مشخص در ماه:',
            modalMonthlyPrefix: 'روز',
            modalMonthlySuffix: 'هر ماه (مثلاً ۱ = اول ماه)',
            modalCancel: 'انصراف',
            modalSave: 'ذخیره برنامه',
                        dashboardBtnTitle: 'داشبورد و تحلیل پیشرفت کارهای روزمره',
            dashboardTitle: 'داشبورد و تقویم تحلیلی کارهای روزمره',
            tabBigCalendar: '📅 تقویم پیشرفت',
            tabAnalytics: '📈 آمار و نمودارها',
            tabManagement: '⚙️ مدیریت عادات',
            kpiAdherence: 'نرخ پایبندی کل',
            kpiCurrentStreak: 'زنجیره فعلی',
            kpiLongestStreak: 'رکورد زنجیره',
            kpiCompleted: 'انجام‌شده',
            kpiSkipped: 'رد شده',
            kpiCompletedVsSkipped: 'تکمیل و رد شده',
            kpiBestDay: 'پربازده‌ترین روز',
            todayBtn: 'امروز',
            prevMonth: 'ماه قبل',
            nextMonth: 'ماه بعد',
            chartTitle: 'روند پایبندی روزانه (۳۰ روز اخیر تا دیروز)',
            kpiSubCompleted: '(تا پایان دیروز)',
            kpiSubSkipped: 'مورد رد شده تا دیروز',
            lockedBadge: 'قفل‌شده',
            lockedNotice: 'قفل‌شده: مهلت ثبت یا تغییر وضعیت پس از یک هفته به پایان رسیده است',
            lockedTooltip: 'بیش از ۷ روز گذشته و وضعیت این روز قفل شده است',
            statusLockedMissed: 'انجام‌نشده (قفل)',
            sleepTitle: 'خواب و بیداری',
            sleepBedtime: 'خواب',
            sleepWaketime: 'بیداری',
            sleepNow: 'الان خوابیدم',
            wakeNow: 'الان بیدار شدم',
            sleepLastNight: 'خواب شب گذشته',
            sleepTonight: 'خواب امشب',
            sleepDuration: 'مدت خواب',
            sleepQualityOptimal: 'کافی و استاندارد',
            sleepQualityFair: 'نسبتاً خوب',
            sleepQualityShort: 'کم‌خوابی',
            sleepQualityLong: 'طولانی',
            sleepHint: 'ساعت خواب و بیداری خود را ثبت کنید',
            sleepClear: 'پاکسازی',
            sleepHours: 'ساعت',
            sleepMinutes: 'دقیقه',
            sleepNotLogged: 'ثبت نشده',
            sleepDayLabel: 'روز',
            sleepNightLabel: 'شب',
            sleepNowTag: 'اکنون',
            sleepAnalyticsTitle: 'تحلیل الگوی خواب و ریتم شبانه‌روزی (۳۰ روز اخیر)',
            sleepAvgDuration: 'میانگین مدت خواب',
            sleepAvgBedtime: 'میانگین زمان خواب',
            sleepAvgWaketime: 'میانگین زمان بیداری',
            sleepQualityRate: 'خواب استاندارد و کافی',
            sleepChartTitle: 'روند مدت خواب روزانه (۳۰ روز اخیر)',
            sleepStandardRange: 'محدوده استاندارد سلامت (۷ تا ۹ ساعت)',
            sleepInspectorBoxTitle: 'ثبت و ویرایش ساعت خواب و بیداری',
            sleepSaveSuccess: 'ذخیره شد',
            sleepInsightOptimal: '🌟 الگوی خواب شما بسیار منظم و در محدوده طلایی سلامت (۷ تا ۹ ساعت) است.',
            sleepInsightShort: '💡 میانگین خواب شما کمتر از ۷ ساعت است؛ کم‌خوابی بازدهی و انرژی روزانه را کاهش می‌دهد.',
            sleepInsightLong: '🌙 میانگین خواب بیش از حد معمول است؛ نظم در زمان بیداری به تعادل انرژی کمک می‌کند.',
            sleepInsightNoData: '🌱 برای مشاهده آمار و ریتم شبانه‌روزی، ساعات خواب و بیداری روزهای خود را ثبت کنید.',
            sleepEditTooltip: 'ویرایش یا ثبت دستی ساعت (در پنل تحلیل)',
            sleepEditActionText: 'ویرایش و ثبت',

            dayDetailsTitle: 'کارهای روزمره در تاریخ',
            dayDetailsEmpty: 'هیچ برنامه روزمره‌ای برای این روز تنظیم نشده است.',
            statusCompleted: 'انجام‌شده',
            statusSkipped: 'رد شده',
            statusPending: 'در انتظار انجام',
            habitBreakdownTitle: 'تحلیل عملکرد به تفکیک هر کار روزمره',
            habitAdherence: 'نرخ تعهد:',
            habitStreak: 'زنجیره:',
            insightConsistent: '🌟 پایبندی فوق‌العاده! این کار به یک عادت تثبیت‌شده تبدیل شده است.',
            insightGood: '👏 روند خوب و رو به رشد است. به همین مسیر ادامه دهید!',
            insightNeedsAttention: '💡 توجه: این کار چند بار اخیر رد شده؛ پیشنهاد می‌کنیم زمان یا حجم آن را بازبینی کنید.',
            btnEditHabit: 'ویرایش الگو',
            btnResetHabitHistory: 'پاکسازی سوابق',
            confirmResetHistory: 'آیا از پاکسازی تمام سوابق ثبت‌شده برای این کار روزمره اطمینان دارید؟',
            daysStreakSuffix: 'روز متوالی',
            allDoneBadge: 'تکمیل ۱۰۰٪',
            partialDoneBadge: 'تکمیل جزئی',
            missedBadge: 'رد شده',
            noTasksBadge: 'بدون برنامه',
            toggleToDeadlines: 'مشاهده ددلاین‌ها',
            toggleToRoutines: 'مشاهده کارهای روزمره'
        },
        prompts: {
            setDeadline: 'تاریخ ددلاین را وارد کنید:\n• شمسی: 1405-07-28\n• میلادی: 2026-10-20\n• قمری: 1448-05-09',
            invalidDate: 'فرمت تاریخ نامعتبر است!'
        }
    },
    en: {
        dir: 'ltr',
        langName: 'English',
        flag: '🇬🇧',
        addNote: '+ Add Note',
        noteTitlePlaceholder: 'Note Title...',
        taskPlaceholder: 'New task...',
        pencilTitle: 'Drag pencil over task to scribble!',
        eraserTitle: 'Drag eraser over task to delete instantly',
        themeToggleTitle: 'Toggle Dark / Light Theme',
        langToggleTitle: 'Change Language',
        calendarClose: '− Close Calendar',
        calendarOpen: '+ Open Calendar',
        calendarTypeTitle: 'Switch Calendar Type (Gregorian / Solar Hijri / Lunar Hijri)',
        prevMonthTitle: 'Previous Month',
        nextMonthTitle: 'Next Month',
        weekdays: {
            jalali: ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'],
            gregorian: ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'],
            hijri: ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr']
        },
        months: {
            jalali: ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'],
            gregorian: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            hijri: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah']
        },
        calendarNames: {
            jalali: 'Solar',
            gregorian: 'Gregorian',
            hijri: 'Hijri'
        },
        deadlineTitleToday: "Today's Deadlines",
        deadlineTitleFor: (dateStr) => `Deadlines for ${dateStr}`,
        deadlineEmpty: 'No deadlines scheduled for this day.',
        overdueSectionTitle: 'Overdue Tasks',
        overdueCountSuffix: 'tasks',
        todayRemaining: (h) => `Today (${h}h left)`,
        overdueDaysAgo: (d) => `Overdue (${d}d ago)`,
        doneLabel: 'Done',
        ctx: {
            edit: 'Edit',
            toggleScribble: 'Cross out / Restore',
            delete: 'Delete',
            setDeadline: 'Set Deadline',
            clearDeadline: 'Clear Deadline',
            detachNote: '⎘ Detach from stack',
            dissolveStack: '📂 Dissolve stack',
            deleteNote: '🗑️ Delete'
        },
        trash: {
            title: '🗑️ Trash Bin',
            sub: 'Crumpled notes are stored here for up to 24 hours',
            emptyBtn: 'Empty Trash',
            emptyMsg: 'Trash bin is empty',
            restore: 'Restore',
            deletePermanently: 'Delete permanently'
        },
        routines: {
            title: 'Daily Tasks & Habits',
            addNew: '+ New Task',
            empty: 'No daily tasks scheduled for this day.',
            progressTitle: 'Daily Progress',
            progressAllDone: 'All daily tasks completed! 🎉',
            progressNoTasks: 'No daily tasks for this day',
            progressSubtitle: (done, total) => `${done} of ${total} tasks completed`,
            progressQuietDay: 'A quiet day ahead ✨',
            patternDaily: 'Every day',
            patternInterval: (n) => `Every ${n} days`,
            patternWeekly: 'Weekly',
            patternMonthly: (d) => `Day ${d} of month`,
            deleteConfirm: 'Are you sure you want to delete this daily task?',
            modalTitle: 'New Daily Task & Habit',
            modalTitleLabel: 'Task or Habit Title:',
            modalTitlePlaceholder: 'e.g., Morning workout, reading, study...',
            modalPatternLabel: 'Recurrence Pattern:',
            patternOptionDaily: 'Every day',
            patternOptionInterval: 'Interval / Every N days',
            patternOptionWeekly: 'Specific days of week',
            patternOptionMonthly: 'Specific day of month',
            modalIntervalLabel: 'Repeat interval:',
            modalIntervalPrefix: 'Every',
            modalIntervalSuffix: 'days (e.g. 2 = every other day)',
            modalWeeklyLabel: 'On which days of the week?',
            modalStartDateLabel: 'Start Date:',
            modalStartDateHint: 'Days prior to this date are excluded from missed calculations',
            retroactiveTitle: 'Habits created after this date (for retroactive logging):',
            insightNewHabit: '🌱 Newly created routine; scheduled date hasn\'t arrived yet.',
            noScheduledTasks: 'No Tasks Scheduled',
            startDatePrefix: 'Started:',
            modalMonthlyLabel: 'Specific day of month:',
            modalMonthlyPrefix: 'Day',
            modalMonthlySuffix: 'of each month (e.g. 1 = 1st)',
            modalCancel: 'Cancel',
            modalSave: 'Save Task',
                        dashboardBtnTitle: 'Daily Tasks Analytics & Progress Dashboard',
            dashboardTitle: 'Daily Tasks & Habits Analytics Dashboard',
            tabBigCalendar: '📅 Habit Calendar',
            tabAnalytics: '📈 Analytics & Trends',
            tabManagement: '⚙️ Manage Habits',
            kpiAdherence: 'Overall Adherence',
            kpiCurrentStreak: 'Current Streak',
            kpiLongestStreak: 'Best Streak',
            kpiCompleted: 'Completed',
            kpiSkipped: 'Skipped',
            kpiCompletedVsSkipped: 'Completed & Skipped',
            kpiBestDay: 'Best Day',
            todayBtn: 'Today',
            prevMonth: 'Previous Month',
            nextMonth: 'Next Month',
            chartTitle: 'Daily Adherence Trend (Past 30 Days up to Yesterday)',
            kpiSubCompleted: '(up to yesterday)',
            kpiSubSkipped: 'missed up to yesterday',
            lockedBadge: 'Locked',
            lockedNotice: 'Locked: Routine status can only be modified within 1 week',
            lockedTooltip: 'More than 7 days have passed; this day is locked',
            statusLockedMissed: 'Missed (Locked)',
            sleepTitle: 'Sleep & Wake',
            sleepBedtime: 'Bedtime',
            sleepWaketime: 'Wake-up',
            sleepNow: 'Slept now',
            wakeNow: 'Woke up now',
            sleepLastNight: "Last night's sleep",
            sleepTonight: "Tonight's sleep",
            sleepDuration: 'Sleep duration',
            sleepQualityOptimal: 'Optimal',
            sleepQualityFair: 'Fair',
            sleepQualityShort: 'Short',
            sleepQualityLong: 'Long',
            sleepHint: 'Log your bedtime & wake-up time',
            sleepClear: 'Clear',
            sleepHours: 'h',
            sleepMinutes: 'm',
            sleepNotLogged: 'Not logged',
            sleepDayLabel: 'Day',
            sleepNightLabel: 'Night',
            sleepNowTag: 'Now',
            sleepAnalyticsTitle: 'Sleep & Circadian Rhythm Analytics (Last 30 Days)',
            sleepAvgDuration: 'Avg Sleep Duration',
            sleepAvgBedtime: 'Avg Bedtime',
            sleepAvgWaketime: 'Avg Wake-up Time',
            sleepQualityRate: 'Optimal Sleep Consistency',
            sleepChartTitle: 'Daily Sleep Duration Trend (Last 30 Days)',
            sleepStandardRange: 'Optimal Healthy Range (7–9 hrs)',
            sleepInspectorBoxTitle: 'Log & Edit Sleep / Wake Times',
            sleepSaveSuccess: 'Saved',
            sleepInsightOptimal: '🌟 Your sleep schedule is highly consistent and within the optimal healthy range (7–9 hrs).',
            sleepInsightShort: '💡 Your average sleep is under 7 hrs; chronic sleep deficit lowers daily habit energy.',
            sleepInsightLong: '🌙 Sleep duration is longer than usual (>9 hrs); a structured rhythm will balance your energy.',
            sleepInsightNoData: '🌱 Log your sleep and wake times to unlock personalized circadian insights.',
            sleepEditTooltip: 'Edit or manually log times (in Analytics Panel)',
            sleepEditActionText: 'Edit & Log',

            dayDetailsTitle: 'Daily Tasks for',
            dayDetailsEmpty: 'No daily tasks scheduled for this day.',
            statusCompleted: 'Completed',
            statusSkipped: 'Skipped',
            statusPending: 'Pending',
            habitBreakdownTitle: 'Performance by Habit',
            habitAdherence: 'Adherence:',
            habitStreak: 'Streak:',
            insightConsistent: '🌟 Outstanding consistency! This routine is becoming a permanent habit.',
            insightGood: '👏 Great steady progress. Keep up the momentum!',
            insightNeedsAttention: '💡 Missed recently. Consider adjusting its time or breaking it into smaller steps.',
            btnEditHabit: 'Edit Pattern',
            btnResetHabitHistory: 'Reset History',
            confirmResetHistory: 'Are you sure you want to clear all completion history for this routine?',
            daysStreakSuffix: 'days streak',
            allDoneBadge: '100% Done',
            partialDoneBadge: 'Partial',
            missedBadge: 'Missed',
            noTasksBadge: 'No Tasks',
            toggleToDeadlines: 'Switch to Deadlines',
            toggleToRoutines: 'Switch to Daily Tasks'
        },
        prompts: {
            setDeadline: 'Enter deadline date:\n• Gregorian: 2026-10-20\n• Solar Hijri: 1405-07-28\n• Lunar Hijri: 1448-05-09',
            invalidDate: 'Invalid date format!'
        }
    },
    ko: {
        dir: 'ltr',
        langName: '한국어',
        flag: '🇰🇷',
        addNote: '+ 새 메모',
        noteTitlePlaceholder: '메모 제목...',
        taskPlaceholder: '새 할 일...',
        pencilTitle: '할 일을 지우려면 연필을 드래그하세요!',
        eraserTitle: '할 일을 즉시 삭제하려면 지우개를 드래그하세요',
        themeToggleTitle: '다크 / 라이트 모드 전환',
        langToggleTitle: '언어 변경',
        calendarClose: '− 달력 닫기',
        calendarOpen: '+ 달력 열기',
        calendarTypeTitle: '달력 유형 전환 (양력 / 태양력 / 이슬람력)',
        prevMonthTitle: '이전 달',
        nextMonthTitle: '다음 달',
        weekdays: {
            jalali: ['토', '일', '월', '화', '수', '목', '금'],
            gregorian: ['토', '일', '월', '화', '수', '목', '금'],
            hijri: ['토', '일', '월', '화', '수', '목', '금']
        },
        months: {
            jalali: ['파르바르딘', '오르디베헤시트', '호르다드', '티르', '모르다드', '샤흐리바르', '메흐르', '아반', '아자르', '데이', '바흐만', '에스판드'],
            gregorian: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
            hijri: ['무하람', '사파르', '라비 알아우왈', '라비 알사니', '주마다 알아우왈', '주마다 알사니', '라잡', '샤반', '라마단', '샤왈', '두 알카다', '두 알히자']
        },
        calendarNames: {
            jalali: '태양력',
            gregorian: '양력',
            hijri: '이슬람력'
        },
        deadlineTitleToday: '오늘의 마감 기한',
        deadlineTitleFor: (dateStr) => `${dateStr} 마감 기한`,
        deadlineEmpty: '이 날짜에 예정된 마감 기한이 없습니다.',
        overdueSectionTitle: '기한 초과된 작업',
        overdueCountSuffix: '건',
        todayRemaining: (h) => `오늘 (${h}시간 남음)`,
        overdueDaysAgo: (d) => `기한 초과 (${d}일 전)`,
        doneLabel: '완료됨',
        ctx: {
            edit: '수정',
            toggleScribble: '취소선 / 복원',
            delete: '삭제',
            setDeadline: '기한 설정',
            clearDeadline: '기한 삭제',
            detachNote: '⎘ 그룹에서 분리',
            dissolveStack: '📂 그룹 해제',
            deleteNote: '🗑️ 삭제'
        },
        trash: {
            title: '🗑️ 휴지통',
            sub: '구겨진 메모는 최대 24시간 동안 보관됩니다',
            emptyBtn: '휴지통 비우기',
            emptyMsg: '휴지통이 비어 있습니다',
            restore: '복원',
            deletePermanently: '영구 삭제'
        },
        routines: {
            title: '일일 작업 및 습관',
            addNew: '+ 새 작업',
            empty: '이 날짜에 예정된 일일 작업이 없습니다.',
            progressTitle: '오늘의 진행률',
            progressAllDone: '오늘의 모든 작업을 마쳤습니다! 🎉',
            progressNoTasks: '이 날에는 작업이 없습니다',
            progressSubtitle: (done, total) => `${total}개 중 ${done}개 완료`,
            progressQuietDay: '여유로운 하루를 보내세요 ✨',
            patternDaily: '매일',
            patternInterval: (n) => `${n}일마다`,
            patternWeekly: '매주',
            patternMonthly: (d) => `매월 ${d}일`,
            deleteConfirm: '이 항목을 삭제하시겠습니까?',
            modalTitle: '새 일일 작업 및 습관 만들기',
            modalTitleLabel: '작업 또는 습관 이름:',
            modalTitlePlaceholder: '예: 아침 운동, 독서 30분...',
            modalPatternLabel: '반복 패턴:',
            patternOptionDaily: '매일',
            patternOptionInterval: '간격 반복 (N일마다)',
            patternOptionWeekly: '특정 요일',
            patternOptionMonthly: '매월 특정일',
            modalIntervalLabel: '반복 주기:',
            modalIntervalPrefix: '매',
            modalIntervalSuffix: '일마다 (예: 2 = 이틀마다)',
            modalWeeklyLabel: '반복할 요일 선택:',
            modalStartDateLabel: '시작일:',
            modalStartDateHint: '이 날짜 이전의 일은 건너뛴 것으로 계산되지 않습니다',
            retroactiveTitle: '이 날짜 이후 생성된 습관 (소급 기록용):',
            insightNewHabit: '🌱 새로 추가된 습관입니다. 아직 실행 일정이 되지 않았습니다.',
            noScheduledTasks: '일정 없음',
            startDatePrefix: '시작:',
            modalMonthlyLabel: '매월 특정 날짜:',
            modalMonthlyPrefix: '매월',
            modalMonthlySuffix: '일',
            modalCancel: '취소',
            modalSave: '저장',
                        dashboardBtnTitle: '일일 작업 분석 및 진행 대시보드',
            dashboardTitle: '일일 작업 및 습관 분석 대시보드',
            tabBigCalendar: '📅 습관 달력',
            tabAnalytics: '📈 통계 및 차트',
            tabManagement: '⚙️ 습관 관리',
            kpiAdherence: '전체 달성률',
            kpiCurrentStreak: '현재 연속 일수',
            kpiLongestStreak: '최고 기록',
            kpiCompleted: '완료됨',
            kpiSkipped: '건너뜀',
            kpiCompletedVsSkipped: '완료 및 건너뜀',
            kpiBestDay: '최고의 요일',
            todayBtn: '오늘',
            prevMonth: '이전 달',
            nextMonth: '다음 달',
            chartTitle: '일일 달성률 추세 (어제까지 최근 30일)',
            kpiSubCompleted: '(어제까지)',
            kpiSubSkipped: '어제까지 건너뜀',
            lockedBadge: '잠김',
            lockedNotice: '잠김: 일일 작업은 최대 1주일까지만 수정할 수 있습니다',
            lockedTooltip: '7일이 지나 이 날의 상태가 잠겼습니다',
            statusLockedMissed: '건너뜀 (잠김)',
            sleepTitle: '수면 및 기상',
            sleepBedtime: '취침',
            sleepWaketime: '기상',
            sleepNow: '취침 기록',
            wakeNow: '기상 기록',
            sleepLastNight: '어젯밤 수면',
            sleepTonight: '오늘 밤 수면',
            sleepDuration: '수면 시간',
            sleepQualityOptimal: '충분함',
            sleepQualityFair: '보통',
            sleepQualityShort: '부족',
            sleepQualityLong: '과다',
            sleepHint: '취침 및 기상 시간을 기록하세요',
            sleepClear: '초기화',
            sleepHours: '시간',
            sleepMinutes: '분',
            sleepNotLogged: '기록 없음',
            sleepDayLabel: '낮',
            sleepNightLabel: '밤',
            sleepNowTag: '현재',
            sleepAnalyticsTitle: '수면 및 일주기 분석 (최근 30일)',
            sleepAvgDuration: '평균 수면 시간',
            sleepAvgBedtime: '평균 취침 시간',
            sleepAvgWaketime: '평균 기상 시간',
            sleepQualityRate: '표준 수면 일관성',
            sleepChartTitle: '일일 수면 시간 추이 (최근 30일)',
            sleepStandardRange: '건강 권장 수면 범위 (7~9시간)',
            sleepInspectorBoxTitle: '수면 및 기상 시간 기록/수정',
            sleepSaveSuccess: '저장됨',
            sleepInsightOptimal: '🌟 수면 패턴이 매우 규칙적이며 최적의 건강 범위(7~9시간) 내에 있습니다.',
            sleepInsightShort: '💡 평균 수면 시간이 7시간 미만입니다. 충분한 수면은 일상 에너지와 습관 실천을 돕습니다.',
            sleepInsightLong: '🌙 평균 수면 시간이 긴 편입니다(9시간 초과). 규칙적인 기상 루틴으로 생체 에너지를 맞춰보세요.',
            sleepInsightNoData: '🌱 맞춤형 일주기 수면 분석을 보려면 수면 및 기상 시간을 기록해보세요.',
            sleepEditTooltip: '시간 직접 입력 및 수정 (분석 패널)',
            sleepEditActionText: '수정 및 기록',

            dayDetailsTitle: '해당 날짜의 일일 작업:',
            dayDetailsEmpty: '이 날에는 예정된 일일 작업이 없습니다.',
            statusCompleted: '완료됨',
            statusSkipped: '건너뜀',
            statusPending: '대기 중',
            habitBreakdownTitle: '습관별 성과 분석',
            habitAdherence: '달성률:',
            habitStreak: '연속:',
            insightConsistent: '🌟 탁월한 꾸준함입니다! 습관이 잘 정착되고 있습니다.',
            insightGood: '👏 좋은 진행입니다. 계속 이 기세를 유지하세요!',
            insightNeedsAttention: '💡 최근에 건너뛰었습니다. 시간대를 조정하거나 단계를 나누어 보세요.',
            btnEditHabit: '패턴 수정',
            btnResetHabitHistory: '기록 초기화',
            confirmResetHistory: '이 습관의 모든 완료 기록을 초기화하시겠습니까?',
            daysStreakSuffix: '일 연속',
            allDoneBadge: '100% 완료',
            partialDoneBadge: '부분 완료',
            missedBadge: '건너뜀',
            noTasksBadge: '일정 없음',
            toggleToDeadlines: '마감일로 전환',
            toggleToRoutines: '일일 작업으로 전환'
        },
        prompts: {
            setDeadline: '마감 날짜를 입력하세요:\n• 양력 (그레고리력): 2026-10-20\n• 태양력 (페르시아): 1405-07-28\n• 이슬람력: 1448-05-09',
            invalidDate: '잘못된 날짜 형식입니다!'
        }
    },
    ar: {
        dir: 'rtl',
        langName: 'العربية',
        flag: '🇸🇦',
        addNote: '+ ملاحظة جديدة',
        noteTitlePlaceholder: 'عنوان الملاحظة...',
        taskPlaceholder: 'مهمة جديدة...',
        pencilTitle: 'اسحب القلم للشطب على المهمة!',
        eraserTitle: 'اسحب الممحاة لحذف المهمة مباشرة',
        themeToggleTitle: 'تبديل الوضع الليلي / النهاري',
        langToggleTitle: 'تغيير اللغة',
        calendarClose: '− إغلاق التقويم',
        calendarOpen: '+ فتح التقويم',
        calendarTypeTitle: 'تغيير نوع التقويم (هجري قمري / ميلادي / هجري شمسي)',
        prevMonthTitle: 'الشهر السابق',
        nextMonthTitle: 'الشهر القادم',
        weekdays: {
            jalali: ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'],
            gregorian: ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'],
            hijri: ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج']
        },
        months: {
            jalali: ['فروردين', 'أرديبهشت', 'خرداد', 'تير', 'مرداد', 'شهريور', 'مهر', 'أبان', 'آذر', 'دي', 'بهمن', 'إسفند'],
            gregorian: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
            hijri: ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة']
        },
        calendarNames: {
            jalali: 'شمسي',
            gregorian: 'ميلادي',
            hijri: 'قمري'
        },
        deadlineTitleToday: 'مواعيد اليوم النهائية',
        deadlineTitleFor: (dateStr) => `مواعيد ${dateStr}`,
        deadlineEmpty: 'لا توجد مواعيد نهائية مسجلة لهذا اليوم.',
        overdueSectionTitle: 'المهام المتأخرة',
        overdueCountSuffix: 'مهام',
        todayRemaining: (h) => `اليوم (متبقي ${h} ساعة)`,
        overdueDaysAgo: (d) => `متأخر (منذ ${d} يوم)`,
        doneLabel: 'تم الإنجاز',
        ctx: {
            edit: 'تعديل',
            toggleScribble: 'شطب / استعادة',
            delete: 'حذف',
            setDeadline: 'تحديد موعد نهائي',
            clearDeadline: 'إزالة الموعد',
            detachNote: '⎘ فصل عن المجموعة',
            dissolveStack: '📂 حل المجموعة',
            deleteNote: '🗑️ حذف'
        },
        trash: {
            title: '🗑️ سلة المهملات',
            sub: 'يتم الاحتفاظ بالملاحظات المحذوفة هنا لمدة تصل إلى ٢٤ ساعة',
            emptyBtn: 'إفراغ السلة',
            emptyMsg: 'سلة المهملات فارغة',
            restore: 'استعادة',
            deletePermanently: 'حذف نهائي'
        },
        routines: {
            title: 'المهام اليومية والعادات',
            addNew: '+ مهمة جديدة',
            empty: 'لا توجد مهام يومية مجدولة لهذا اليوم.',
            progressTitle: 'التقدم اليومي',
            progressAllDone: 'تم إنجاز جميع المهام اليومية! 🎉',
            progressNoTasks: 'لا توجد مهام لهذا اليوم',
            progressSubtitle: (done, total) => `تم إنجاز ${done} من ${total} مهمة`,
            progressQuietDay: 'يوم هادئ بانتظارك ✨',
            patternDaily: 'يومياً',
            patternInterval: (n) => `كل ${n} أيام`,
            patternWeekly: 'أسبوعياً',
            patternMonthly: (d) => `يوم ${d} من الشهر`,
            deleteConfirm: 'هل أنت متأكد من حذف هذه المهمة اليومية؟',
            modalTitle: 'إضافة مهمة يومية أو عادة جديدة',
            modalTitleLabel: 'عنوان المهمة أو العادة:',
            modalTitlePlaceholder: 'مثال: رياضة صباحية، قراءة، تمرين...',
            modalPatternLabel: 'نمط التكرار:',
            patternOptionDaily: 'كل يوم',
            patternOptionInterval: 'كل عدد معين من الأيام',
            patternOptionWeekly: 'أيام محددة من الأسبوع',
            patternOptionMonthly: 'يوم محدد من الشهر',
            modalIntervalLabel: 'التكرار كل كم يوم؟',
            modalIntervalPrefix: 'كل',
            modalIntervalSuffix: 'أيام (مثلاً ۲ = يوم بعد يوم)',
            modalWeeklyLabel: 'في أي أيام الأسبوع؟',
            modalStartDateLabel: 'تاريخ البدء:',
            modalStartDateHint: 'لن تُحسب الأيام السابقة لهذا التاريخ ضمن المهام الفائتة',
            retroactiveTitle: 'العادات المنشأة بعد هذا التاريخ (للتسجيل بأثر رجعي):',
            insightNewHabit: '🌱 مهمة جديدة؛ لم يحن موعد تنفيذها بعد.',
            noScheduledTasks: 'لا توجد مهام',
            startDatePrefix: 'البدء:',
            modalMonthlyLabel: 'يوم محدد في الشهر:',
            modalMonthlyPrefix: 'يوم',
            modalMonthlySuffix: 'من كل شهر',
            modalCancel: 'إلغاء',
            modalSave: 'حفظ',
                        dashboardBtnTitle: 'لوحة تحليلات وتقدم المهام اليومية',
            dashboardTitle: 'لوحة تحليلات المهام اليومية والعادات',
            tabBigCalendar: '📅 تقويم الإنجاز',
            tabAnalytics: '📈 الإحصائيات والرسم البياني',
            tabManagement: '⚙️ إدارة العادات',
            kpiAdherence: 'معدل الالتزام الكلي',
            kpiCurrentStreak: 'السلسلة الحالية',
            kpiLongestStreak: 'أطول سلسلة',
            kpiCompleted: 'المكتملة',
            kpiSkipped: 'المتخطاة',
            kpiCompletedVsSkipped: 'المكتمل والمتروك',
            kpiBestDay: 'أفضل يوم إنجاز',
            todayBtn: 'اليوم',
            prevMonth: 'الشهر السابق',
            nextMonth: 'الشهر القادم',
            chartTitle: 'مؤشر الالتزام اليومي (آخر 30 يوماً حتى أمس)',
            kpiSubCompleted: '(حتى نهاية أمس)',
            kpiSubSkipped: 'حالة فائتة حتى أمس',
            lockedBadge: 'مقفل',
            lockedNotice: 'مقفل: يمكن تعديل حالة المهام خلال أسبوع واحد فقط',
            lockedTooltip: 'مضى أكثر من 7 أيام؛ تم قفل هذا اليوم',
            statusLockedMissed: 'فائتة (مقفل)',
            sleepTitle: 'النوم والاستيقاظ',
            sleepBedtime: 'نوم',
            sleepWaketime: 'استيقاظ',
            sleepNow: 'نمت الآن',
            wakeNow: 'استيقظت الآن',
            sleepLastNight: 'نوم الليلة الماضية',
            sleepTonight: 'نوم الليلة',
            sleepDuration: 'مدة النوم',
            sleepQualityOptimal: 'كافٍ ومثالي',
            sleepQualityFair: 'مقبول',
            sleepQualityShort: 'قليل',
            sleepQualityLong: 'طويل',
            sleepHint: 'سجّل وقت النوم والاستيقاظ',
            sleepClear: 'مسح',
            sleepHours: 'ساعة',
            sleepMinutes: 'دقيقة',
            sleepNotLogged: 'غير مسجل',
            sleepDayLabel: 'نهار',
            sleepNightLabel: 'ليل',
            sleepNowTag: 'الآن',
            sleepAnalyticsTitle: 'تحليل نمط وفترة النوم (آخر ۳۰ يوماً)',
            sleepAvgDuration: 'متوسط فترة النوم',
            sleepAvgBedtime: 'متوسط وقت النوم',
            sleepAvgWaketime: 'متوسط وقت الاستيقاظ',
            sleepQualityRate: 'اتساق النوم القياسي',
            sleepChartTitle: 'مخطط فترة النوم اليومية (آخر ۳۰ يوماً)',
            sleepStandardRange: 'النطاق الصحي المثالي (۷–۹ ساعات)',
            sleepInspectorBoxTitle: 'تسجيل وتعديل أوقات النوم والاستيقاظ',
            sleepSaveSuccess: 'تم الحفظ',
            sleepInsightOptimal: '🌟 نمط نومك منتظم للغاية وضمن النطاق الصحي المثالي (۷ إلى ۹ ساعات).',
            sleepInsightShort: '💡 متوسط نومك أقل من ۷ ساعات؛ قلة النوم تقلل من طاقة ونشاط العادات اليومية.',
            sleepInsightLong: '🌙 متوسط النوم أطول من المعتاد (> ۹ ساعات)؛ الانتظام في الاستيقاظ يعزز توازن الطاقة.',
            sleepInsightNoData: '🌱 سجّل أوقات نومك واستيقاظك لعرض تحليلات النوم والساعة البيولوجية.',
            sleepEditTooltip: 'تعديل أو تسجيل الوقت يدوياً (في لوحة التحليل)',
            sleepEditActionText: 'تعديل وتسجيل',

            dayDetailsTitle: 'المهام اليومية لتاريخ',
            dayDetailsEmpty: 'لا توجد مهام يومية مجدولة لهذا اليوم.',
            statusCompleted: 'مكتملة',
            statusSkipped: 'متخطاة',
            statusPending: 'في الانتظار',
            habitBreakdownTitle: 'تحليل الأداء حسب كل عادة',
            habitAdherence: 'معدل الالتزام:',
            habitStreak: 'السلسلة:',
            insightConsistent: '🌟 التزام استثنائي! هذه المهمة أصبحت عادة راسخة لديك.',
            insightGood: '👏 تقدم ممتاز ومستمر. حافظ على هذا الزخم!',
            insightNeedsAttention: '💡 تم تخطيها مؤخراً. نقترح تعديل وقتها أو تبسيط خطواتها.',
            btnEditHabit: 'تعديل النمط',
            btnResetHabitHistory: 'مسح السجلات',
            confirmResetHistory: 'هل أنت متأكد من رغبتك في مسح كافة سجلات الإنجاز لهذه العادة؟',
            daysStreakSuffix: 'أيام متتالية',
            allDoneBadge: 'مكتمل 100%',
            partialDoneBadge: 'مكتمل جزئياً',
            missedBadge: 'متخطاة',
            noTasksBadge: 'بدون مهام',
            toggleToDeadlines: 'التبديل إلى المواعيد',
            toggleToRoutines: 'التبديل إلى المهام اليومية'
        },
        prompts: {
            setDeadline: 'أدخل تاريخ الموعد النهائي:\n• هجري قمري: 1448-05-09\n• ميلادي: 2026-10-20\n• هجري شمسي: 1405-07-28',
            invalidDate: 'صيغة التاريخ غير صالحة!'
        }
    }
};

let currentLanguage = (function() {
    try {
        const saved = localStorage.getItem('appLanguage');
        if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
            return saved;
        }
    } catch(e) {}
    return 'fa';
})();

function getTranslation(key) {
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.fa;
    if (key.includes('.')) {
        const parts = key.split('.');
        let val = dict;
        for (const p of parts) {
            if (val && typeof val === 'object' && p in val) {
                val = val[p];
            } else {
                return key;
            }
        }
        return val;
    }
    return dict[key] !== undefined ? dict[key] : key;
}

const t = getTranslation;

function formatDigits(numOrStr) {
    if (numOrStr === null || numOrStr === undefined) return '';
    const str = String(numOrStr);
    if (currentLanguage === 'fa') {
        return str.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
    }
    if (currentLanguage === 'ar') {
        return str.replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    }
    return str;
}

function setLanguage(newLang, switchCalendar = true) {
    if (!SUPPORTED_LANGUAGES.includes(newLang)) return;
    currentLanguage = newLang;

    try {
        localStorage.setItem('appLanguage', newLang);
        if (typeof isExtension !== 'undefined' && isExtension) {
            chrome.storage.local.set({ appLanguage: newLang });
        }
    } catch (e) {}

    const dict = TRANSLATIONS[newLang];
    document.documentElement.setAttribute('dir', dict.dir);
    document.documentElement.setAttribute('lang', newLang);

    // Contextual calendar recommendation if requested
    if (switchCalendar) {
        const cal = typeof currentCalendarType !== 'undefined' ? currentCalendarType : 'jalali';
        if (typeof switchCalendarTo === 'function') {
            if (newLang === 'ar' && cal === 'jalali') {
                switchCalendarTo('hijri');
            } else if ((newLang === 'en' || newLang === 'ko') && (cal === 'jalali' || cal === 'hijri')) {
                switchCalendarTo('gregorian');
            } else if (newLang === 'fa' && cal === 'hijri') {
                switchCalendarTo('jalali');
            }
        }
    }

    applyI18nToUI();
}

function applyI18nToUI() {
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.fa;
    document.documentElement.setAttribute('dir', dict.dir);
    document.documentElement.setAttribute('lang', currentLanguage);

    // Update bottom actions buttons
    const addNoteBtn = document.getElementById('add-note-btn');
    if (addNoteBtn) {
        addNoteBtn.innerText = dict.addNote;
    }

    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.setAttribute('title', dict.themeToggleTitle);
    }

    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
        langBtn.setAttribute('title', dict.langToggleTitle);
    }

    const curFlag = document.getElementById('lang-current-flag');
    if (curFlag) {
        curFlag.innerHTML = FLAG_SVGS[currentLanguage] || dict.flag;
    }

    const pencil = document.getElementById('pen');
    if (pencil) {
        pencil.setAttribute('title', dict.pencilTitle);
    }

    const eraser = document.getElementById('eraser');
    if (eraser) {
        eraser.setAttribute('title', dict.eraserTitle);
    }

    // Calendar toggle button
    const calToggleBtn = document.getElementById('calendar-btn');
    const calendarEl = document.getElementById('calendar');
    if (calToggleBtn && calendarEl) {
        const isMin = calendarEl.classList.contains('minimized');
        calToggleBtn.innerText = isMin ? dict.calendarOpen : dict.calendarClose;
    }

    const calTypeBtn = document.getElementById('calendar-type-btn');
    if (calTypeBtn) {
        calTypeBtn.setAttribute('title', dict.calendarTypeTitle);
    }

    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.setAttribute('title', dict.prevMonthTitle);
    }

    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.setAttribute('title', dict.nextMonthTitle);
    }

    // Context menus
    const editBtn = document.querySelector('#task-context-menu [data-action="edit"]');
    if (editBtn) editBtn.innerText = dict.ctx.edit;

    const scribbleBtn = document.querySelector('#task-context-menu [data-action="toggle-scribble"]');
    if (scribbleBtn) scribbleBtn.innerText = dict.ctx.toggleScribble;

    const delTaskBtn = document.querySelector('#task-context-menu [data-action="delete"]');
    if (delTaskBtn) delTaskBtn.innerText = dict.ctx.delete;

    const setDlBtn = document.querySelector('#task-context-menu [data-action="set-deadline"]');
    if (setDlBtn) setDlBtn.innerText = dict.ctx.setDeadline;

    const clearDlBtn = document.querySelector('#task-context-menu [data-action="clear-deadline"]');
    if (clearDlBtn) clearDlBtn.innerText = dict.ctx.clearDeadline;

    const detachBtn = document.getElementById('ctx-detach-note-btn');
    if (detachBtn) detachBtn.innerText = dict.ctx.detachNote;

    const dissolveBtn = document.getElementById('ctx-dissolve-stack-btn');
    if (dissolveBtn) dissolveBtn.innerText = dict.ctx.dissolveStack;

    const delNoteBtn = document.querySelector('#note-context-menu [data-action="delete-note"]');
    if (delNoteBtn) delNoteBtn.innerText = dict.ctx.deleteNote;

    // Trash modal
    const trashTitle = document.querySelector('.trash-header-info h2');
    if (trashTitle) trashTitle.innerText = dict.trash.title;

    const trashSub = document.querySelector('.trash-header-sub');
    if (trashSub) trashSub.innerText = dict.trash.sub;

    const emptyTrashBtn = document.getElementById('empty-trash-btn');
    if (emptyTrashBtn) emptyTrashBtn.innerText = dict.trash.emptyBtn;

    // Update side panel labels & toggle button
    const addRoutineBtn = document.getElementById("btn-open-add-routine");
    if (addRoutineBtn && dict.routines) {
        addRoutineBtn.textContent = dict.routines.addNew;
    }
    if (typeof updateSidePanelHeader === "function" && typeof selectedDeadlineKey !== "undefined") {
        updateSidePanelHeader(selectedDeadlineKey);
    }

    // Re-render notes placeholders and texts
    if (typeof renderAllNotes === 'function') {
        renderAllNotes();
    }

    // Re-render calendar
    if (typeof renderCalendar === 'function') {
        renderCalendar();
    }

    if (typeof updateNotesLayout === 'function') {
        setTimeout(updateNotesLayout, 50);
        setTimeout(updateNotesLayout, 350);
    }
}
