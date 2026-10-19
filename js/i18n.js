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
    if (switchCalendar && typeof calendarType !== 'undefined') {
        if (newLang === 'ar' && calendarType === 'jalali') {
            calendarType = 'hijri';
            saveCalendarType('hijri');
        } else if ((newLang === 'en' || newLang === 'ko') && (calendarType === 'jalali' || calendarType === 'hijri')) {
            calendarType = 'gregorian';
            saveCalendarType('gregorian');
        } else if (newLang === 'fa' && calendarType === 'hijri') {
            calendarType = 'jalali';
            saveCalendarType('jalali');
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

    // Re-render notes placeholders and texts
    if (typeof renderAllNotes === 'function') {
        renderAllNotes();
    }

    // Re-render calendar
    if (typeof renderCalendar === 'function') {
        renderCalendar();
    }
}
