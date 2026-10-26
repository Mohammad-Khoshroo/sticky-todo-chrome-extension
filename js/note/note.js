// ----------------------
//       RENDERING
// ----------------------
function autoResizeTextareas() {
    document.querySelectorAll('.note-task-text, .note-title').forEach(t => {
        t.style.height = 'auto';
        t.style.height = t.scrollHeight + 'px';
    });
}

function createRandomNoteLayout(note) {
    let taskOffset = 0;
    let pageIndex = 0;
    let currentSign = Math.random() > 0.5 ? 1 : -1;
    const pageRotations = [];

    do {
        const tasksLimit = pageIndex === 0 ? 4 : 5;
        const pageTasks = note.tasks.slice(taskOffset, taskOffset + tasksLimit);

        let rotationAngle;

        if (Math.random() < 0.05) {
            rotationAngle = 0;
        } else {
            const randomMagnitude = Math.random() * 2 + 1;
            rotationAngle = randomMagnitude * currentSign;
        }

        if (rotationAngle !== 0) {
            currentSign *= -1;
        }

        pageRotations.push(rotationAngle);

        taskOffset += pageTasks.length;
        pageIndex++;
    } while (taskOffset < note.tasks.length);

    return {
        wrapperRotation: (Math.random() * 6) - 3,
        marginTop: Math.random() * 15 + 40,
        marginLeft: (Math.random() * 10) - 5,
        pageRotations
    };
}

function renderStackWrapper(stackId, stackNotes) {
    const stack = stacks[stackId] || { title: 'دسته یادداشت', activeNoteId: stackNotes[0]?.id };
    const activeNoteId = stack.activeNoteId || stackNotes[0]?.id;
    let activeIdx = stackNotes.findIndex(n => n.id === activeNoteId);
    if (activeIdx === -1) activeIdx = 0;
    const currentNote = stackNotes[activeIdx];
    const currentNoteIndex = notes.indexOf(currentNote);

    const wrapper = document.createElement('div');
    wrapper.className = 'note-wrapper is-stack';
    wrapper.dataset.stackId = stackId;
    wrapper.dataset.noteId = currentNote.id;
    wrapper.draggable = true;

    if (!noteLayouts[stackId]) {
        noteLayouts[stackId] = createRandomNoteLayout({ tasks: [] });
    }
    const layout = noteLayouts[stackId];
    wrapper.style.transform = `rotate(${layout.wrapperRotation}deg)`;
    wrapper.style.marginTop = `${layout.marginTop}px`;
    wrapper.style.marginLeft = `${layout.marginLeft}px`;

    // 1. Narrow Header Paper (فقط برای دسته نوت‌ها)
    const headerPaper = document.createElement('div');
    headerPaper.className = 'stack-header-paper';
    headerPaper.dataset.stackId = stackId;
    if (activeStackId === stackId) {
        headerPaper.classList.add('selected');
    }

    // Big Tape on top of the narrow paper
    const bigTape = document.createElement('div');
    bigTape.className = 'tape big-tape';
    headerPaper.appendChild(bigTape);

    // Title textarea on the narrow paper
    const titleText = document.createElement('textarea');
    titleText.className = 'stack-title-text';
    titleText.rows = 1;
    titleText.value = stack.title || 'دسته یادداشت';
    titleText.placeholder = 'عنوان دسته. . .';
    titleText.setAttribute('readonly', 'readonly');

    titleText.addEventListener('input', (e) => {
        stack.title = e.target.value;
        notes.forEach(n => {
            if (n.stackId === stackId) n.stackTitle = e.target.value;
        });
        titleText.style.height = 'auto';
        titleText.style.height = titleText.scrollHeight + 'px';
        saveNotes();
    });

    titleText.addEventListener('blur', () => {
        titleText.setAttribute('readonly', 'readonly');
        titleText.classList.remove('editing');
        saveNotes();
    });

    titleText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            titleText.blur();
        }
    });

    headerPaper.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeStackId !== stackId) {
            activeStackId = stackId;
            document.querySelectorAll('.stack-header-paper').forEach(el => el.classList.remove('selected'));
            headerPaper.classList.add('selected');
        }
    });

    headerPaper.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        titleText.removeAttribute('readonly');
        titleText.classList.add('editing');
        titleText.focus();
        titleText.select();
    });

    headerPaper.appendChild(titleText);

    // Counter badge: ۱/۳
    const counterBadge = document.createElement('span');
    counterBadge.className = 'stack-paper-counter';
    counterBadge.textContent = `${toFarsiNumber(activeIdx + 1)}/${toFarsiNumber(stackNotes.length)}`;
    headerPaper.appendChild(counterBadge);

    wrapper.appendChild(headerPaper);

    // 2. Physical Paper Layers & Active Note Paper
    const pileContainer = document.createElement('div');
    pileContainer.className = 'stack-pile-container';

    // Layer 2 (bottom-most paper peek)
    if (stackNotes.length > 2) {
        const nextNextIdx = (activeIdx + 2) % stackNotes.length;
        const layer2 = document.createElement('div');
        layer2.className = `stack-layer stack-layer-2 ${stackNotes[nextNextIdx].colorClass}`;
        layer2.title = stackNotes[nextNextIdx].title || 'نوت دیگر';
        layer2.addEventListener('click', (e) => {
            e.stopPropagation();
            activeNoteIndex = notes.indexOf(stackNotes[nextNextIdx]);
            switchStackActiveNote(stackId, stackNotes[nextNextIdx].id);
        });
        pileContainer.appendChild(layer2);
    }

    // Layer 1 (middle paper peek)
    if (stackNotes.length > 1) {
        const nextIdx = (activeIdx + 1) % stackNotes.length;
        const layer1 = document.createElement('div');
        layer1.className = `stack-layer stack-layer-1 ${stackNotes[nextIdx].colorClass}`;
        layer1.title = stackNotes[nextIdx].title || 'نوت بعدی';
        layer1.addEventListener('click', (e) => {
            e.stopPropagation();
            activeNoteIndex = notes.indexOf(stackNotes[nextIdx]);
            switchStackActiveNote(stackId, stackNotes[nextIdx].id);
        });
        pileContainer.appendChild(layer1);
    }

    // Active Note Paper inside Pile
    let taskOffset = 0;
    let pageIndex = 0;
    if (!noteLayouts[currentNote.id]) {
        noteLayouts[currentNote.id] = createRandomNoteLayout(currentNote);
    }
    const currentNoteLayout = noteLayouts[currentNote.id];

    do {
        const tasksLimit = pageIndex === 0 ? 4 : 5;
        const pageTasks = (currentNote.tasks || []).slice(taskOffset, taskOffset + tasksLimit);

        const noteDiv = document.createElement('div');
        const rotationAngle = currentNoteLayout.pageRotations[pageIndex] ?? 0;
        noteDiv.style.transform = `rotate(${rotationAngle}deg)`;
        noteDiv.className = `note-paper ${currentNote.colorClass} ${activeNoteIndex === currentNoteIndex ? 'active' : ''}`;
        noteDiv.dataset.noteIndex = currentNoteIndex;

        let tasksHTML = pageTasks.map((task, tIndex) => {
            const absoluteIndex = taskOffset + tIndex;
            const taskPlh = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage]) ? TRANSLATIONS[currentLanguage].taskPlaceholder : "کار جدید...";
            return `
                <li class="note-task ${task.scribbled ? 'scribbled' : ''}" 
                    data-task-index="${absoluteIndex}" 
                    draggable="true">
                    <input type="checkbox" class="task-checkbox" draggable="false" ${task.checked ? "checked" : ""}>
                    <textarea class="note-task-text ${task.text.trim() ? 'locked-task' : 'editing-task'}" 
                        rows="1" draggable="false" placeholder="${taskPlh}" ${task.text.trim() ? 'readonly' : ''}>${escapeHTML(task.text)}</textarea>
                </li>
            `;
        }).join('');

        let innerHTML = '';
        if (pageIndex === 0) {
            const notePlh = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage]) ? TRANSLATIONS[currentLanguage].noteTitlePlaceholder : "عنوان یادداشت...";
            innerHTML += `<div class="tape"></div>`;
            innerHTML += `<textarea class="note-title" rows="1" draggable="false" placeholder="${notePlh}">${escapeHTML(currentNote.title)}</textarea>`;
        } else {
            innerHTML += `<div class="tape link-tape"></div>`;
            noteDiv.classList.add('chained-note');
        }
        innerHTML += `<ul class="task-list">${tasksHTML}</ul>`;
        noteDiv.innerHTML = innerHTML;
        pileContainer.appendChild(noteDiv);

        taskOffset += pageTasks.length;
        pageIndex++;
    } while (taskOffset < (currentNote.tasks ? currentNote.tasks.length : 0));

    wrapper.appendChild(pileContainer);
    return wrapper;
}

function switchStackActiveNote(stackId, targetNoteId) {
    if (typeof stacks === "undefined" || !stacks[stackId]) return null;
    const stack = stacks[stackId];
    if (stack.activeNoteId === targetNoteId) {
        return document.querySelector(`.note-wrapper[data-stack-id="${stackId}"]`);
    }

    stack.activeNoteId = targetNoteId;
    if (typeof activeStackId !== "undefined") {
        activeStackId = stackId;
    }
    if (typeof saveNotes === "function") {
        saveNotes();
    }

    const oldWrapper = document.querySelector(`.note-wrapper[data-stack-id="${stackId}"]`);
    if (oldWrapper && typeof getStackNotes === "function") {
        const stackNotes = getStackNotes(stackId);
        const newWrapper = renderStackWrapper(stackId, stackNotes);
        oldWrapper.replaceWith(newWrapper);
        if (typeof autoResizeTextareas === "function") {
            autoResizeTextareas();
        }
        if (typeof msnry !== "undefined" && msnry && typeof msnry.reloadItems === "function") {
            msnry.reloadItems();
            msnry.layout();
        }
        return newWrapper;
    }
    return null;
}
window.switchStackActiveNote = switchStackActiveNote;

function syncFridgeTaskCheckbox(noteIndex, taskIndex, isChecked) {
    const note = (typeof notes !== "undefined" && notes[noteIndex]) ? notes[noteIndex] : null;
    if (!note) return;
    const wrapper = document.querySelector(`.note-wrapper[data-note-id="${note.id}"]`) ||
                    (note.stackId ? document.querySelector(`.note-wrapper[data-stack-id="${note.stackId}"]`) : null) ||
                    document.querySelectorAll('.note-wrapper')[noteIndex];
    if (wrapper) {
        const taskEls = wrapper.querySelectorAll('.note-task');
        if (taskEls && taskEls[taskIndex]) {
            const cb = taskEls[taskIndex].querySelector('.task-checkbox');
            if (cb) {
                cb.checked = isChecked;
            }
        }
    }
}
window.syncFridgeTaskCheckbox = syncFridgeTaskCheckbox;

function renderAllNotes() {
    fridgeContainer.innerHTML = '';
    const renderedStackIds = new Set();

    notes.forEach((note, noteIndex) => {
        if (note.deletedAt) return;

        if (note.stackId) {
            if (!renderedStackIds.has(note.stackId)) {
                renderedStackIds.add(note.stackId);
                const stackNotes = getStackNotes(note.stackId);
                if (stackNotes.length > 0) {
                    const stackWrapper = renderStackWrapper(note.stackId, stackNotes);
                    fridgeContainer.appendChild(stackWrapper);
                }
            }
        } else {
            if (!note.id) {
                note.id = 'note_' + Date.now() + '_' + Math.random();
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'note-wrapper';
            if (note.isNew) {
                wrapper.classList.add('new-note-anim');
                delete note.isNew;
            }
            wrapper.dataset.noteId = note.id;
            wrapper.draggable = true;

            if (!noteLayouts[note.id]) {
                noteLayouts[note.id] = createRandomNoteLayout(note);
            }

            const layout = noteLayouts[note.id];

            const expectedPages = (() => {
                if (note.tasks.length <= 4) return 1;
                return 1 + Math.ceil((note.tasks.length - 4) / 5);
            })();

            if (layout.pageRotations.length !== expectedPages) {
                noteLayouts[note.id] = createRandomNoteLayout(note);
            }

            const finalLayout = noteLayouts[note.id];

            wrapper.style.transform = `rotate(${finalLayout.wrapperRotation}deg)`;
            wrapper.style.marginTop = `${finalLayout.marginTop}px`;
            wrapper.style.marginLeft = `${finalLayout.marginLeft}px`;

            let taskOffset = 0;
            let pageIndex = 0;

            do {
                const tasksLimit = pageIndex === 0 ? 4 : 5;
                const pageTasks = note.tasks.slice(taskOffset, taskOffset + tasksLimit);

                const noteDiv = document.createElement('div');

                const rotationAngle = finalLayout.pageRotations[pageIndex] ?? 0;
                noteDiv.style.transform = `rotate(${rotationAngle}deg)`;

                noteDiv.className = `note-paper ${note.colorClass} ${activeNoteIndex === noteIndex ? 'active' : ''}`;
                noteDiv.dataset.noteIndex = noteIndex;

                let tasksHTML = pageTasks.map((task, tIndex) => {
                    const absoluteIndex = taskOffset + tIndex;

                    return `
                        <li class="note-task ${task.scribbled ? 'scribbled' : ''}" 
                            data-task-index="${absoluteIndex}" 
                            draggable="true">
                            
                            <input 
                                type="checkbox" 
                                class="task-checkbox" 
                                draggable="false"
                                ${task.checked ? "checked" : ""}>
                                
                            <textarea 
                                class="note-task-text ${task.text.trim() ? 'locked-task' : 'editing-task'}" 
                                rows="1" 
                                draggable="false"
                                placeholder="${(typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLanguage]) ? TRANSLATIONS[currentLanguage].taskPlaceholder : 'کار جدید...'}"
                                ${task.text.trim() ? 'readonly' : ''}>${escapeHTML(task.text)}</textarea>
                        </li>
                    `;
                }).join('');

                let innerHTML = '';

                if (pageIndex === 0) {
                    innerHTML += `<div class="tape"></div>`;
                    innerHTML += `
                        <textarea 
                            class="note-title" 
                            rows="1" 
                            draggable="false"
                            placeholder="${(typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLanguage]) ? TRANSLATIONS[currentLanguage].noteTitlePlaceholder : 'عنوان یادداشت...'}">${escapeHTML(note.title)}</textarea>
                    `;
                } else {
                    innerHTML += `<div class="tape link-tape"></div>`;
                    noteDiv.classList.add('chained-note');
                }

                innerHTML += `<ul class="task-list">${tasksHTML}</ul>`;
                noteDiv.innerHTML = innerHTML;

                wrapper.appendChild(noteDiv);

                taskOffset += pageTasks.length;
                pageIndex++;
            } while (taskOffset < note.tasks.length);

            fridgeContainer.appendChild(wrapper);
        }
    });

    autoResizeTextareas();
    updateTrashIcon();
    renderCalendar(currentJy, currentJm);
    updateDeadlinePanel(selectedDeadlineKey);

    setTimeout(() => {
        updateNotesLayout();
    }, 50);
}

function updateNotesLayout() {
    if (typeof Masonry === 'undefined' || !fridgeContainer) return;
    if (msnry) {
        msnry.destroy();
    }

    fridgeContainer.style.width = '';

    msnry = new Masonry(fridgeContainer, {
        itemSelector: '.note-wrapper',
        columnWidth: 270,
        gutter: 20,
        fitWidth: true,
        transitionDuration: '0.2s'
    });
}
window.updateNotesLayout = updateNotesLayout;

// ----------------------
//          EVENTS
// ----------------------

addNoteBtn.addEventListener('click', () => {
    const newNote = {
        id: 'note_' + Date.now(),
        title: '',
        colorClass: getRandomColorClass(),
        tasks: [{ text: '', checked: false, scribbled: false }],
        isNew: true
    };

    newNote.layout = createRandomNoteLayout(newNote);

    notes.push(newNote);

    activeNoteIndex = notes.length - 1;
    saveNotes();
    renderAllNotes();
});

fridgeContainer.addEventListener('input', (e) => {
    const noteEl = e.target.closest('.note-paper');
    if (!noteEl) return;

    const noteIndex = Number(noteEl.dataset.noteIndex);

    if (e.target.classList.contains('note-title')) {
        notes[noteIndex].title = e.target.value;
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
        saveNotes();
    }

    if (e.target.classList.contains('note-task-text')) {
        const taskEl = e.target.closest('.note-task');
        if (!taskEl) return;

        const taskIndex = Number(taskEl.dataset.taskIndex);
        notes[noteIndex].tasks[taskIndex].text = e.target.value;

        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';

        saveNotes();
    }
});

fridgeContainer.addEventListener('change', (e) => {
    const noteEl = e.target.closest('.note-paper');
    if (!noteEl) return;

    const noteIndex = Number(noteEl.dataset.noteIndex);

    if (e.target.classList.contains('task-checkbox')) {
        const taskEl = e.target.closest('.note-task');
        if (!taskEl) return;

        const taskIndex = Number(taskEl.dataset.taskIndex);
        notes[noteIndex].tasks[taskIndex].checked = e.target.checked;
        saveNotes();
        if (typeof updateDeadlinePanel === 'function') {
            updateDeadlinePanel(selectedDeadlineKey);
        }
        if (typeof renderCalendar === 'function') {
            renderCalendar(currentJy, currentJm);
        }
    }
});

document.addEventListener("mousedown", (e) => {
    if (e.detail > 1 && !e.target.closest("input, textarea")) {
        e.preventDefault();
        window.getSelection()?.removeAllRanges();
    }

    const noteEl = e.target.closest(".note-paper");

    if (noteEl) {
        const newIndex = Number(noteEl.dataset.noteIndex);

        if (newIndex !== activeNoteIndex) {
            activeNoteIndex = newIndex;

            document.querySelectorAll('.note-paper').forEach(el => {
                el.classList.remove('active');
            });

            document.querySelectorAll(`.note-paper[data-note-index="${activeNoteIndex}"]`).forEach(el => {
                el.classList.add('active');
            });
        }

        return;
    }

    const headerPaper = e.target.closest(".stack-header-paper");
    if (headerPaper) {
        return;
    }

    if (!headerPaper && activeStackId !== null) {
        activeStackId = null;
        document.querySelectorAll('.stack-header-paper').forEach(el => el.classList.remove('selected'));
    }

    if (
        e.target.closest("#add-note-btn") ||
        e.target.closest("#trash-bin") ||
        e.target.closest("#pen") ||
        e.target.closest("#eraser") ||
        e.target.closest(".stack-layer") ||
        e.target.closest("#note-context-menu") ||
        e.target.closest("#task-context-menu")
    ) {
        return;
    }

    if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
    ) {
        document.activeElement.blur();
    }

    if (activeNoteIndex !== null) {
        activeNoteIndex = null;
        document.querySelectorAll('.note-paper.active').forEach(el => el.classList.remove('active'));
    }
});

document.addEventListener("dblclick", (e) => {
    if (!e.target.closest("input, textarea, .stack-header-paper")) {
        e.preventDefault();
        window.getSelection()?.removeAllRanges();
    }
});

// ----------------------------------------------------
//  KEYBOARD NAVIGATION FOR STACKS (چپ و راست روی دسته)
// ----------------------------------------------------
document.addEventListener("keydown", (e) => {
    if (activeStackId && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        const activeEl = document.activeElement;
        if (
            activeEl &&
            (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') &&
            !activeEl.hasAttribute('readonly') &&
            activeEl.classList.contains('editing')
        ) {
            return;
        }

        const stackNotes = getStackNotes(activeStackId);
        if (stackNotes.length > 1) {
            e.preventDefault();
            const currentActiveId = stacks[activeStackId]?.activeNoteId;
            let currentIdx = stackNotes.findIndex(n => n.id === currentActiveId);
            if (currentIdx === -1) currentIdx = 0;

            let nextIdx;
            if (e.key === "ArrowLeft") {
                nextIdx = (currentIdx + 1) % stackNotes.length;
            } else {
                nextIdx = (currentIdx - 1 + stackNotes.length) % stackNotes.length;
            }

            activeNoteIndex = notes.indexOf(stackNotes[nextIdx]);
            switchStackActiveNote(activeStackId, stackNotes[nextIdx].id);
        }
    }
});
