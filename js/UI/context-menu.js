function openTaskContextMenu(x, y, noteIndex, taskIndex) {
    if (!taskContextMenu) return;

    contextTaskInfo = { noteIndex, taskIndex };

    taskContextMenu.classList.remove("hidden");
    taskContextMenu.style.left = `${x}px`;
    taskContextMenu.style.top = `${y}px`;

    const menuRect = taskContextMenu.getBoundingClientRect();

    if (menuRect.right > window.innerWidth) {
        taskContextMenu.style.left = `${window.innerWidth - menuRect.width - 8}px`;
    }

    if (menuRect.bottom > window.innerHeight) {
        taskContextMenu.style.top = `${window.innerHeight - menuRect.height - 8}px`;
    }
}

function closeTaskContextMenu() {
    if (!taskContextMenu) return;

    taskContextMenu.classList.add("hidden");
    contextTaskInfo = null;
}

fridgeContainer.addEventListener("contextmenu", (e) => {
    const taskEl = e.target.closest(".note-task");
    if (!taskEl) return;

    const notePaper = taskEl.closest(".note-paper");
    if (!notePaper) return;

    e.preventDefault();

    const noteIndex = Number(notePaper.dataset.noteIndex);
    const taskIndex = Number(taskEl.dataset.taskIndex);

    openTaskContextMenu(e.clientX, e.clientY, noteIndex, taskIndex);
});

taskContextMenu.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn || !contextTaskInfo) return;

    const { noteIndex, taskIndex } = contextTaskInfo;
    const action = btn.dataset.action;

    const note = notes[noteIndex];
    const task = note?.tasks?.[taskIndex];

    if (!task) {
        closeTaskContextMenu();
        return;
    }

    if (action === "edit") {
        closeTaskContextMenu();

        setTimeout(() => {
            const notePapers = document.querySelectorAll(
                `.note-paper[data-note-index="${noteIndex}"]`
            );

            let taskEl = null;

            notePapers.forEach(notePaper => {
                const foundTask = notePaper.querySelector(
                    `.note-task[data-task-index="${taskIndex}"]`
                );

                if (foundTask) {
                    taskEl = foundTask;
                }
            });

            if (!taskEl) return;

            const taskText = taskEl.querySelector(".note-task-text");
            if (!taskText) return;

            taskText.removeAttribute("readonly");
            taskText.classList.remove("locked-task");
            taskText.classList.add("editing-task");

            taskText.focus();

            const len = taskText.value.length;
            taskText.setSelectionRange(len, len);

            taskText.style.height = "auto";
            taskText.style.height = taskText.scrollHeight + "px";
        }, 0);

        return;
    }

    if (action === "toggle-scribble") {
        task.scribbled = !task.scribbled;
        task.scribbledAt = task.scribbled ? Date.now() : null;
        if (activeTaskElement) {
            activeTaskElement.classList.toggle("scribbled", task.scribbled);
        }

        saveNotes();
        closeTaskContextMenu();
        return;
    }
    
    if (action === "set-deadline") {
        closeTaskContextMenu();

        const currentKey = getTaskDeadlineKey(task);
        const baseKey = currentKey || formatJalaliKey(todayJalali.jy, todayJalali.jm, todayJalali.jd);
        let defaultPromptVal = baseKey;

        const parsedBase = typeof parseAnyDeadlineKey === "function" ? parseAnyDeadlineKey(baseKey) : null;
        if (parsedBase) {
            if (typeof currentCalendarType !== "undefined" && currentCalendarType === "gregorian") {
                defaultPromptVal = parsedBase.gKey;
            } else if (typeof currentCalendarType !== "undefined" && currentCalendarType === "hijri") {
                defaultPromptVal = parsedBase.hKey;
            } else {
                defaultPromptVal = parsedBase.jKey;
            }
        }

        const dict = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage])
            ? TRANSLATIONS[currentLanguage]
            : null;
        const promptMsg = dict && dict.prompts ? dict.prompts.setDeadline : "تاریخ ددلاین را وارد کنید (شمسی، میلادی یا قمری):";

        const input = prompt(promptMsg, defaultPromptVal);

        if (input === null) return;

        const normalized = input.trim();
        const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

        if (!match) {
            alert(dict && dict.prompts ? dict.prompts.invalidDate : "فرمت تاریخ نامعتبر است!");
            return;
        }

        let jy, jm, jd;
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);

        if (year >= 1900) {
            const testD = new Date(year, month - 1, day);
            if (
                testD.getFullYear() !== year ||
                testD.getMonth() + 1 !== month ||
                testD.getDate() !== day
            ) {
                alert("Invalid Gregorian date!");
                return;
            }
            const j = jalaali.toJalaali(year, month, day);
            jy = j.jy;
            jm = j.jm;
            jd = j.jd;
        } else if (year >= 1430 && year < 1600) {
            const gDate = typeof hijriToGregorianDate === "function"
                ? hijriToGregorianDate(year, month, day)
                : new Date();
            const j = jalaali.toJalaali(gDate.getFullYear(), gDate.getMonth() + 1, gDate.getDate());
            jy = j.jy;
            jm = j.jm;
            jd = j.jd;
        } else {
            if (!jalaali.isValidJalaaliDate(year, month, day)) {
                alert("تاریخ جلالی وارد شده معتبر نیست.");
                return;
            }
            jy = year;
            jm = month;
            jd = day;
        }

        task.deadline = formatJalaliKey(jy, jm, jd);
        selectedDeadlineKey = task.deadline;

        saveNotes();
        if (typeof updateReminderBell === "function") updateReminderBell();

        currentJy = jy;
        currentJm = jm;

        const g = jalaali.toGregorian(jy, jm, jd);
        currentGy = g.gy;
        currentGm = g.gm;

        if (typeof getHijriParts === "function") {
            const h = getHijriParts(new Date(g.gy, g.gm - 1, g.gd, 12, 0, 0));
            currentHy = h.hy;
            currentHm = h.hm;
        }

        renderCalendar();
        updateDeadlinePanel(selectedDeadlineKey);
        return;
    }

    if (action === "clear-deadline") {
        task.deadline = null;

        saveNotes();
        if (typeof updateReminderBell === "function") updateReminderBell();
        renderCalendar();
        updateDeadlinePanel(selectedDeadlineKey);
        closeTaskContextMenu();
        return;
    }

    if (action === "delete") {
        note.tasks.splice(taskIndex, 1);

        saveNotes();
        renderAllNotes();
        closeTaskContextMenu();
        return;
    }
});

document.addEventListener("click", (e) => {
    if (!taskContextMenu) return;
    if (taskContextMenu.classList.contains("hidden")) return;

    if (!e.target.closest("#task-context-menu")) {
        closeTaskContextMenu();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeTaskContextMenu();
    }
});

window.addEventListener("resize", closeTaskContextMenu);
window.addEventListener("scroll", closeTaskContextMenu, true);

// ----------------------
//   NOTE & STACK CONTEXT MENU
// ----------------------
const noteContextMenu = document.getElementById("note-context-menu");
const ctxDetachNoteBtn = document.getElementById("ctx-detach-note-btn");
const ctxDissolveStackBtn = document.getElementById("ctx-dissolve-stack-btn");
let contextNoteTarget = null; // { type: 'note', noteId } or { type: 'stack', stackId }

function closeNoteContextMenu() {
    if (noteContextMenu) {
        noteContextMenu.classList.add("hidden");
        contextNoteTarget = null;
    }
}

fridgeContainer.addEventListener("contextmenu", (e) => {
    // If clicking on a task, let task context menu handle it
    if (e.target.closest(".note-task")) return;

    const stackHeader = e.target.closest(".stack-header-paper");
    const notePaper = e.target.closest(".note-paper");

    if (!stackHeader && !notePaper) return;

    e.preventDefault();
    closeTaskContextMenu();

    if (stackHeader) {
        const stackWrapper = stackHeader.closest(".note-wrapper.is-stack");
        const stackId = stackWrapper?.dataset.stackId;
        if (!stackId) return;

        contextNoteTarget = { type: 'stack', stackId };
        ctxDetachNoteBtn.classList.add("hidden");
        ctxDissolveStackBtn.classList.remove("hidden");
    } else if (notePaper) {
        const noteIndex = Number(notePaper.dataset.noteIndex);
        const note = notes[noteIndex];
        if (!note) return;

        contextNoteTarget = { type: 'note', noteId: note.id, noteIndex };
        if (note.stackId) {
            ctxDetachNoteBtn.classList.remove("hidden");
        } else {
            ctxDetachNoteBtn.classList.add("hidden");
        }
        ctxDissolveStackBtn.classList.add("hidden");
    }

    noteContextMenu.classList.remove("hidden");
    noteContextMenu.style.left = `${e.clientX}px`;
    noteContextMenu.style.top = `${e.clientY}px`;

    const r = noteContextMenu.getBoundingClientRect();
    if (r.right > window.innerWidth) {
        noteContextMenu.style.left = `${window.innerWidth - r.width - 8}px`;
    }
    if (r.bottom > window.innerHeight) {
        noteContextMenu.style.top = `${window.innerHeight - r.height - 8}px`;
    }
});

noteContextMenu?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn || !contextNoteTarget) return;

    const action = btn.dataset.action;

    if (action === "detach-note" && contextNoteTarget.type === 'note') {
        const note = notes.find(n => n.id === contextNoteTarget.noteId);
        if (note && note.stackId) {
            const oldStackId = note.stackId;
            note.stackId = null;
            const remaining = getStackNotes(oldStackId);
            if (remaining.length <= 1) {
                remaining.forEach(r => r.stackId = null);
                delete stacks[oldStackId];
            } else if (stacks[oldStackId]?.activeNoteId === note.id) {
                stacks[oldStackId].activeNoteId = remaining[0].id;
            }
            saveNotes();
            renderAllNotes();
        }
    }

    if (action === "dissolve-stack" && contextNoteTarget.type === 'stack') {
        const stackId = contextNoteTarget.stackId;
        notes.forEach(n => {
            if (n.stackId === stackId) n.stackId = null;
        });
        delete stacks[stackId];
        saveNotes();
        renderAllNotes();
    }

    if (action === "delete-note") {
        if (contextNoteTarget.type === 'stack') {
            const stackId = contextNoteTarget.stackId;
            notes.forEach(n => {
                if (n.stackId === stackId) n.deletedAt = Date.now();
            });
            delete stacks[stackId];
        } else if (contextNoteTarget.type === 'note') {
            const note = notes.find(n => n.id === contextNoteTarget.noteId);
            if (note) {
                note.deletedAt = Date.now();
                if (note.stackId) {
                    const remaining = getStackNotes(note.stackId);
                    if (remaining.length <= 1) {
                        remaining.forEach(r => r.stackId = null);
                        delete stacks[note.stackId];
                    }
                }
            }
        }
        saveNotes();
        renderAllNotes();
        updateTrashIcon();
    }

    closeNoteContextMenu();
});

document.addEventListener("click", (e) => {
    if (noteContextMenu && !noteContextMenu.classList.contains("hidden")) {
        if (!e.target.closest("#note-context-menu")) {
            closeNoteContextMenu();
        }
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeNoteContextMenu();
    }
});

window.addEventListener("resize", closeNoteContextMenu);
window.addEventListener("scroll", closeNoteContextMenu, true);
