// On blur, if task has text, lock it for dragging and clean display
fridgeContainer.addEventListener("blur", (e) => {
    if (!e.target.classList.contains("note-task-text")) return;

    const taskText = e.target;

    if (taskText.value.trim()) {
        taskText.setAttribute("readonly", "readonly");
        taskText.classList.add("locked-task");
        taskText.classList.remove("editing-task");
    }
}, true);

// Unlock task on focus (keyboard tab or programmatic focus)
fridgeContainer.addEventListener("focus", (e) => {
    if (e.target.classList && e.target.classList.contains("note-task-text")) {
        const taskText = e.target;
        if (taskText.hasAttribute("readonly") || taskText.classList.contains("locked-task")) {
            taskText.removeAttribute("readonly");
            taskText.classList.remove("locked-task");
            taskText.classList.add("editing-task");
        }
    }
}, true);

// Unlock task on click for immediate inline editing
fridgeContainer.addEventListener("click", (e) => {
    if (e.target.closest(".task-checkbox")) return;

    const taskText = e.target.closest(".note-task-text");
    if (taskText) {
        if (taskText.hasAttribute("readonly") || taskText.classList.contains("locked-task")) {
            taskText.removeAttribute("readonly");
            taskText.classList.remove("locked-task");
            taskText.classList.add("editing-task");
            taskText.focus();
        }
        return;
    }

    const taskEl = e.target.closest(".note-task");
    if (taskEl) {
        const input = taskEl.querySelector(".note-task-text");
        if (input && (input.hasAttribute("readonly") || input.classList.contains("locked-task"))) {
            input.removeAttribute("readonly");
            input.classList.remove("locked-task");
            input.classList.add("editing-task");
            input.focus();
            const len = input.value.length;
            input.setSelectionRange(len, len);
        }
    }
});

// Helper to get note reliably from paper or element
function getNoteFromPaper(notePaper) {
    if (typeof getNoteFromElement === 'function') {
        return getNoteFromElement(notePaper);
    }
    if (!notePaper) return null;
    const noteId = notePaper.dataset.noteId || notePaper.closest('.note-wrapper')?.dataset.noteId;
    if (noteId && typeof notes !== 'undefined') {
        const found = notes.find(n => n.id === noteId);
        if (found) return found;
    }
    const idx = Number(notePaper.dataset.noteIndex);
    if (!isNaN(idx) && typeof notes !== 'undefined' && notes[idx]) {
        return notes[idx];
    }
    return null;
}

// Keyboard shortcuts for tasks:
// 1. Enter key: creates a new task directly below current task (splits if cursor in middle)
// 2. Backspace key on empty task: deletes the task and focuses previous with bounce protection
// 3. Enter on note-title: moves focus to first task
fridgeContainer.addEventListener("keydown", (e) => {
    if (e.target.classList.contains("note-task-text")) {
        const taskTextarea = e.target;
        const taskEl = taskTextarea.closest(".note-task");
        const notePaper = taskEl ? taskEl.closest(".note-paper") : null;
        if (!taskEl || !notePaper) return;

        const taskIndex = Number(taskEl.dataset.taskIndex);
        const note = getNoteFromPaper(notePaper);
        if (!note) return;

        if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
            e.preventDefault();

            // Split text if cursor is inside, or create empty task below
            const cursorStart = (taskTextarea.selectionStart !== null && taskTextarea.selectionStart !== undefined)
                ? taskTextarea.selectionStart
                : taskTextarea.value.length;
            const cursorEnd = (taskTextarea.selectionEnd !== null && taskTextarea.selectionEnd !== undefined)
                ? taskTextarea.selectionEnd
                : cursorStart;
            const fullText = taskTextarea.value;
            const textBefore = fullText.substring(0, cursorStart);
            const textAfter = fullText.substring(cursorEnd);

            note.tasks[taskIndex].text = textBefore;

            const newTask = {
                id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                text: textAfter,
                checked: false,
                scribbled: false,
                deadline: null
            };
            note.tasks.splice(taskIndex + 1, 0, newTask);

            saveNotes();
            if (window.SoundEngine) SoundEngine.click();
            if (typeof refreshSingleNoteOnFridge === 'function') {
                refreshSingleNoteOnFridge(note);
            } else {
                renderAllNotes();
            }

            setTimeout(() => {
                const wrapper = document.querySelector(`.note-wrapper[data-note-id="${note.id}"]`) ||
                                (note.stackId ? document.querySelector(`.note-wrapper[data-stack-id="${note.stackId}"]`) : null);
                if (wrapper) {
                    const allTasks = wrapper.querySelectorAll('.note-task');
                    const targetEl = allTasks[taskIndex + 1] || allTasks[allTasks.length - 1];
                    if (targetEl) {
                        const input = targetEl.querySelector('.note-task-text');
                        if (input) {
                            input.removeAttribute("readonly");
                            input.classList.remove("locked-task");
                            input.classList.add("editing-task");
                            input.focus();
                            if (textAfter.length > 0) {
                                input.setSelectionRange(0, 0);
                            }
                        }
                    }
                }
            }, 30);
            return;
        }

        if (e.key === "Backspace") {
            // 1. Backspace immunity window protection from previous task deletion
            const now = Date.now();
            if (taskTextarea._ignoreBackspaceUntil && now < taskTextarea._ignoreBackspaceUntil) {
                e.preventDefault();
                return;
            }

            // 2. If key is repeating (held down), NEVER delete the task container or jump to previous!
            if (e.repeat) {
                if (taskTextarea.value === "") {
                    e.preventDefault();
                }
                return;
            }

            // 3. If there is text in the textarea, allow standard character deletion
            if (taskTextarea.value.trim() !== "") {
                return;
            }

            // 4. Field is already empty and user tapped Backspace afresh (!e.repeat)
            if (note.tasks && note.tasks.length > 1) {
                e.preventDefault();
                note.tasks.splice(taskIndex, 1);
                saveNotes();
                if (window.SoundEngine) SoundEngine.erase();
                if (typeof refreshSingleNoteOnFridge === 'function') {
                    refreshSingleNoteOnFridge(note);
                } else {
                    renderAllNotes();
                }

                setTimeout(() => {
                    const wrapper = document.querySelector(`.note-wrapper[data-note-id="${note.id}"]`) ||
                                    (note.stackId ? document.querySelector(`.note-wrapper[data-stack-id="${note.stackId}"]`) : null);
                    if (wrapper) {
                        const allTasks = wrapper.querySelectorAll('.note-task');
                        if (taskIndex > 0) {
                            const prevIdx = taskIndex - 1;
                            const prevEl = allTasks[prevIdx];
                            if (prevEl) {
                                const input = prevEl.querySelector('.note-task-text');
                                if (input) {
                                    input.removeAttribute("readonly");
                                    input.classList.remove("locked-task");
                                    input.classList.add("editing-task");
                                    input._ignoreBackspaceUntil = Date.now() + 450;
                                    input.focus();
                                    const len = input.value.length;
                                    input.setSelectionRange(len, len);
                                }
                            }
                        } else {
                            // Deleting task at index 0: focus note-title if exists, or first remaining task
                            const titleInput = wrapper.querySelector('.note-title');
                            if (titleInput) {
                                titleInput.focus();
                                const len = titleInput.value.length;
                                titleInput.setSelectionRange(len, len);
                            } else if (allTasks.length > 0) {
                                const firstInput = allTasks[0].querySelector('.note-task-text');
                                if (firstInput) {
                                    firstInput.removeAttribute("readonly");
                                    firstInput.classList.remove("locked-task");
                                    firstInput.classList.add("editing-task");
                                    firstInput._ignoreBackspaceUntil = Date.now() + 450;
                                    firstInput.focus();
                                }
                            }
                        }
                    }
                }, 30);
                return;
            } else if (note.tasks && note.tasks.length <= 1) {
                // If it's the only task and empty, move cursor up to note title
                if (taskIndex === 0) {
                    e.preventDefault();
                    const wrapper = document.querySelector(`.note-wrapper[data-note-id="${note.id}"]`) ||
                                    (note.stackId ? document.querySelector(`.note-wrapper[data-stack-id="${note.stackId}"]`) : null);
                    if (wrapper) {
                        const titleInput = wrapper.querySelector('.note-title');
                        if (titleInput) {
                            titleInput.focus();
                            const len = titleInput.value.length;
                            titleInput.setSelectionRange(len, len);
                        }
                    }
                }
                return;
            }
        }
    }

    if (e.target.classList.contains("note-title") && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const notePaper = e.target.closest(".note-paper");
        if (!notePaper) return;
        const note = getNoteFromPaper(notePaper);
        if (!note) return;

        if (!note.tasks || note.tasks.length === 0) {
            note.tasks = [{
                id: 'task_' + Date.now(),
                text: "",
                checked: false,
                scribbled: false,
                deadline: null
            }];
            saveNotes();
            if (typeof refreshSingleNoteOnFridge === 'function') {
                refreshSingleNoteOnFridge(note);
            } else {
                renderAllNotes();
            }
        }

        setTimeout(() => {
            const wrapper = document.querySelector(`.note-wrapper[data-note-id="${note.id}"]`) ||
                            (note.stackId ? document.querySelector(`.note-wrapper[data-stack-id="${note.stackId}"]`) : null);
            if (wrapper) {
                const firstTaskInput = wrapper.querySelector(".note-task-text");
                if (firstTaskInput) {
                    firstTaskInput.removeAttribute("readonly");
                    firstTaskInput.classList.remove("locked-task");
                    firstTaskInput.classList.add("editing-task");
                    firstTaskInput.focus();
                }
            }
        }, 30);
    }
});

// Ctrl + Enter برای اضافه کردن تسک به انتهای یادداشت فعال
document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key === "Enter") {
        let targetNote = null;
        if (document.activeElement) {
            targetNote = getNoteFromPaper(document.activeElement.closest('.note-paper'));
        }
        if (!targetNote && activeNoteIndex !== null && activeNoteIndex !== undefined) {
            targetNote = notes[activeNoteIndex];
        }

        if (targetNote) {
            targetNote.tasks.push({
                id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                text: "",
                checked: false,
                scribbled: false,
                deadline: null
            });

            saveNotes();
            if (window.SoundEngine) SoundEngine.click();
            if (typeof refreshSingleNoteOnFridge === 'function') {
                refreshSingleNoteOnFridge(targetNote);
            } else {
                renderAllNotes();
            }

            setTimeout(() => {
                const wrapper = document.querySelector(`.note-wrapper[data-note-id="${targetNote.id}"]`) ||
                                (targetNote.stackId ? document.querySelector(`.note-wrapper[data-stack-id="${targetNote.stackId}"]`) : null);
                if (wrapper) {
                    const inputs = wrapper.querySelectorAll('.note-task-text');
                    if (inputs.length > 0) {
                        const lastInput = inputs[inputs.length - 1];
                        lastInput.removeAttribute("readonly");
                        lastInput.classList.remove("locked-task");
                        lastInput.classList.add("editing-task");
                        lastInput.focus();
                    }
                }
            }, 30);
        }
    }
});

// ----------------------
//     DRAG & DROP CLEAN
// ----------------------
fridgeContainer.addEventListener("dragstart", (e) => {
    const taskText = e.target.closest(".note-task-text");
    const noteTitle = e.target.closest(".note-title");
    const checkbox = e.target.closest(".task-checkbox");

    if (noteTitle || checkbox) {
        e.preventDefault();
        return;
    }

    if (taskText) {
        const isLocked =
            taskText.classList.contains("locked-task") ||
            taskText.hasAttribute("readonly");

        if (!isLocked) {
            e.preventDefault();
            return;
        }
    }

    const taskEl = e.target.closest(".note-task");

    if (taskEl) {
        const notePaper = taskEl.closest(".note-paper");
        if (!notePaper) return;

        const noteIndex = Number(notePaper.dataset.noteIndex);
        const taskIndex = Number(taskEl.dataset.taskIndex);

        currentDragType = "task";
        draggedTaskInfo = { noteIndex, taskIndex };
        draggedNoteId = null;

        e.dataTransfer.setData("text/plain", "task");
        e.dataTransfer.effectAllowed = "move";

        taskEl.classList.add("dragging-task");
        return;
    }

    const stackHeader = e.target.closest(".stack-header-paper");
    if (stackHeader) {
        const stackWrapper = stackHeader.closest(".note-wrapper.is-stack");
        const stackId = stackWrapper?.dataset.stackId;
        if (stackId) {
            currentDragType = "stack";
            draggedStackId = stackId;
            draggedNoteId = null;
            e.dataTransfer.setData("text/plain", "stack");
            e.dataTransfer.effectAllowed = "move";
            stackWrapper.classList.add("dragging-note");
            return;
        }
    }

    const wrapper = e.target.closest(".note-wrapper");

    if (wrapper) {
        const notePaper = e.target.closest(".note-paper") || wrapper.querySelector(".note-paper");
        if (!notePaper) return;

        const noteIndex = Number(notePaper.dataset.noteIndex);
        const note = notes[noteIndex];
        if (!note) return;

        if (!note.id) {
            note.id = 'note_' + Date.now() + '_' + Math.random();
            saveNotes();
        }

        currentDragType = "note";
        draggedTaskInfo = null;
        draggedNoteId = note.id;
        draggedStackId = null;

        e.dataTransfer.setData("text/plain", "note");
        e.dataTransfer.effectAllowed = "move";

        wrapper.classList.add("dragging-note");
    }
});

document.addEventListener("dragend", () => {
    document.querySelectorAll(".dragging-task").forEach(el => {
        el.classList.remove("dragging-task");
    });

    document.querySelectorAll(".dragging-note").forEach(el => {
        el.classList.remove("dragging-note");
    });

    document.querySelectorAll(".note-task.drag-over").forEach(el => {
        el.classList.remove("drag-over");
    });

    document.querySelectorAll(".can-stack-drop").forEach(el => {
        el.classList.remove("can-stack-drop");
    });

    trashBin.classList.remove("drag-over");

    currentDragType = null;
    draggedTaskInfo = null;
    draggedNoteId = null;
    draggedStackId = null;
});

fridgeContainer.addEventListener("dragover", (e) => {
    if (currentDragType === "note") {
        const targetStack = e.target.closest(".note-wrapper.is-stack");
        const targetNoteWrapper = e.target.closest(".note-wrapper:not(.is-stack)");
        const target = targetStack || targetNoteWrapper;

        document.querySelectorAll(".can-stack-drop").forEach(el => {
            if (el !== target) el.classList.remove("can-stack-drop");
        });

        if (target) {
            const isSelf = (target.dataset.noteId === draggedNoteId);
            if (!isSelf) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                target.classList.add("can-stack-drop");
                const hint = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage] && TRANSLATIONS[currentLanguage].dropToStack)
                    ? TRANSLATIONS[currentLanguage].dropToStack
                    : "➕ رها کنید برای دسته‌بندی";
                target.setAttribute("data-drop-hint", hint);
                return;
            }
        }
    }

    // ۱. اگر درگ مربوط به ما نیست کلاً خارج شو
    if (!["task", "pen", "eraser"].includes(currentDragType)) return;

    // ۲. حذف علامت ممنوع برای این ابزارها در کل محدوده یخچال
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // ۳. پیدا کردن تسک زیر موس
    const taskItem = e.target.closest(".note-task");

    // ۴. مدیریت کلاس‌های بصری (هاور شدن)
    document.querySelectorAll(".note-task.drag-over").forEach(el => {
        if (el !== taskItem) {
            el.classList.remove("drag-over");
        }
    });

    if (taskItem) {
        taskItem.classList.add("drag-over");
    }
});

fridgeContainer.addEventListener("dragleave", (e) => {
    const targetWrap = e.target.closest(".note-wrapper");
    if (targetWrap && !targetWrap.contains(e.relatedTarget)) {
        targetWrap.classList.remove("can-stack-drop");
    }

    const taskItem = e.target.closest(".note-task");
    if (!taskItem) return;

    const related = e.relatedTarget;

    if (related && taskItem.contains(related)) {
        return;
    }

    taskItem.classList.remove("drag-over");
});

fridgeContainer.addEventListener("drop", (e) => {
    if (currentDragType === "note" && draggedNoteId) {
        if (window.SoundEngine) SoundEngine.stick();
        const targetStack = e.target.closest(".note-wrapper.is-stack");
        const targetNoteWrapper = e.target.closest(".note-wrapper:not(.is-stack)");

        document.querySelectorAll(".can-stack-drop").forEach(el => el.classList.remove("can-stack-drop"));

        const sourceNote = notes.find(n => n.id === draggedNoteId);
        if (!sourceNote) return;

        if (targetStack) {
            const targetStackId = targetStack.dataset.stackId;
            if (targetStackId && sourceNote.stackId !== targetStackId) {
                e.preventDefault();
                e.stopPropagation();
                sourceNote.stackId = targetStackId;
                if (stacks[targetStackId]) {
                    stacks[targetStackId].activeNoteId = sourceNote.id;
                }
                activeStackId = targetStackId;
                saveNotes();
                renderAllNotes();
                return;
            }
        }

        if (targetNoteWrapper && targetNoteWrapper.dataset.noteId !== draggedNoteId) {
            const targetNote = notes.find(n => n.id === targetNoteWrapper.dataset.noteId);
            if (targetNote) {
                e.preventDefault();
                e.stopPropagation();
                const newStackId = 'stack_' + Date.now();
                stacks[newStackId] = {
                    id: newStackId,
                    title: 'دسته یادداشت',
                    activeNoteId: sourceNote.id
                };
                sourceNote.stackId = newStackId;
                targetNote.stackId = newStackId;
                activeStackId = newStackId;
                saveNotes();
                renderAllNotes();
                return;
            }
        }
    }
    const targetTaskEl = e.target.closest(".note-task");
    if (!targetTaskEl) return;

    if (!["task", "pen", "eraser"].includes(currentDragType)) return;

    e.preventDefault();
    e.stopPropagation();

    document.querySelectorAll(".note-task.drag-over").forEach(el => {
        el.classList.remove("drag-over");
    });

    const targetNotePaper = targetTaskEl.closest(".note-paper");
    if (!targetNotePaper) return;

    const targetNoteIndex = Number(targetNotePaper.dataset.noteIndex);
    const targetTaskIndex = Number(targetTaskEl.dataset.taskIndex);

    if (currentDragType === "task") {
        if (!draggedTaskInfo) return;

        const sourceNoteIndex = draggedTaskInfo.noteIndex;
        const sourceTaskIndex = draggedTaskInfo.taskIndex;

        if (
            Number.isNaN(sourceNoteIndex) ||
            Number.isNaN(sourceTaskIndex) ||
            Number.isNaN(targetNoteIndex) ||
            Number.isNaN(targetTaskIndex)
        ) {
            return;
        }

        if (sourceNoteIndex === targetNoteIndex && sourceTaskIndex === targetTaskIndex) {
            return;
        }

        const sourceTasks = notes[sourceNoteIndex]?.tasks;
        const targetTasks = notes[targetNoteIndex]?.tasks;

        if (!sourceTasks || !targetTasks) return;

        const [movedTask] = sourceTasks.splice(sourceTaskIndex, 1);
        if (!movedTask) return;

        let insertIndex = targetTaskIndex;

        if (sourceNoteIndex === targetNoteIndex && sourceTaskIndex < targetTaskIndex) {
            insertIndex--;
        }

        targetTasks.splice(insertIndex, 0, movedTask);

        saveNotes();
        renderAllNotes();
        return;
    }

    if (currentDragType === "pen") {
        const task = notes[targetNoteIndex]?.tasks?.[targetTaskIndex];
        if (!task) return;

        task.scribbled = !task.scribbled;
        if (window.SoundEngine) SoundEngine.scribble();
        task.scribbledAt = task.scribbled ? Date.now() : null;
        targetTaskEl.classList.toggle("scribbled", task.scribbled);

        saveNotes();
        return;
    }

    if (currentDragType === "eraser") {
        if (!notes[targetNoteIndex]?.tasks) return;

        notes[targetNoteIndex].tasks.splice(targetTaskIndex, 1);
        if (window.SoundEngine) SoundEngine.erase();

        saveNotes();
        if (typeof refreshSingleNoteOnFridge === 'function') {
            refreshSingleNoteOnFridge(notes[targetNoteIndex]);
        } else {
            renderAllNotes();
        }
    }
});
