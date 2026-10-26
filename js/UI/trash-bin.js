// ----------------------
//       TRASH BIN
// ----------------------
function cleanupTrash() {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();

    notes = notes.filter(n => !n.deletedAt || now - n.deletedAt < ONE_DAY);

    saveNotes();
    updateTrashIcon();
}

function updateTrashIcon() {
    const badge = document.getElementById("trash-count-badge");
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const deletedNotes = notes.filter(n => n.deletedAt && (now - n.deletedAt < ONE_DAY));
    const count = deletedNotes.length;
    const isDark = document.body.classList.contains("dark-mode") || document.documentElement.classList.contains("dark-mode");

    if (count > 0) {
        if (trashIcon) {
            trashIcon.src = isDark ? "images/waste-dark.png" : "images/waste.ico";
        }
        if (badge) {
            badge.classList.remove("hidden");
            badge.textContent = toFarsiNumber(count);
        }
        if (trashBin) {
            trashBin.title = `سطل زباله (${toFarsiNumber(count)} یادداشت مچاله شده - کلیک برای مشاهده)`;
        }
    } else {
        if (trashIcon) {
            trashIcon.src = isDark ? "images/trash-bin-dark.png" : "images/trash-bin.ico";
        }
        if (badge) {
            badge.classList.add("hidden");
        }
        if (trashBin) {
            trashBin.title = "سطل زباله (خالی)";
        }
    }
}

// ----------------------
//    TRASH MODAL LOGIC
// ----------------------
const trashModal = document.getElementById("trash-modal");
const closeTrashBtn = document.getElementById("close-trash-modal");
const emptyTrashBtn = document.getElementById("empty-trash-btn");
const trashBackdrop = document.getElementById("trash-modal-backdrop");
let isDraggingToTrash = false;

function openTrashModal() {
    if (!trashModal) return;
    renderTrashModal();
    trashModal.classList.remove("hidden");
}

function closeTrashModal() {
    if (!trashModal) return;
    trashModal.classList.add("hidden");
}

function renderTrashModal() {
    const listEl = document.getElementById("trash-modal-list");
    if (!listEl) return;

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const deletedNotes = notes.filter(n => n.deletedAt && (now - n.deletedAt < ONE_DAY));

    if (emptyTrashBtn) {
        emptyTrashBtn.style.display = deletedNotes.length > 0 ? "inline-block" : "none";
    }

    if (deletedNotes.length === 0) {
        listEl.innerHTML = `
            <div class="trash-empty-state">
                <div class="trash-empty-icon">🗑️</div>
                <h3>سطل زباله خالی است</h3>
                <p>هیچ یادداشت مچاله‌شده‌ای در سطل وجود ندارد.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = "";
    const rotations = [-4, 3.5, -2.5, 5, -3.5, 2.5];

    deletedNotes.forEach((note, idx) => {
        const card = document.createElement("div");
        card.className = `crumpled-note-card ${note.colorClass || 'color-0'}`;

        const rot = rotations[idx % rotations.length];
        card.style.transform = `rotate(${rot}deg)`;

        const hoursLeft = Math.max(1, Math.ceil((ONE_DAY - (now - note.deletedAt)) / (60 * 60 * 1000)));

        const tasksHtml = (note.tasks || []).slice(0, 4).map(t => `
            <li class="crumpled-task-item">
                <span class="crumpled-task-text">• ${escapeHTML(t.text || "(بدون متن)")}</span>
            </li>
        `).join("");

        const moreTasksCount = (note.tasks || []).length - 4;
        const moreTasksHtml = moreTasksCount > 0 
            ? `<li class="crumpled-task-item" style="text-decoration: none; opacity: 0.6; font-size: 0.78rem;">... و ${toFarsiNumber(moreTasksCount)} مورد دیگر</li>` 
            : '';

        card.innerHTML = `
            <div class="crumpled-tape"></div>
            <div class="crumpled-card-top">
                <div class="crumpled-title">${escapeHTML(note.title?.trim() || "بدون عنوان")}</div>
                <ul class="crumpled-task-list">
                    ${tasksHtml}
                    ${moreTasksHtml}
                </ul>
            </div>
            <div class="crumpled-card-bottom">
                <span class="crumpled-timer" title="زمان تا حذف خودکار">⏳ ${toFarsiNumber(hoursLeft)} ساعت مانده</span>
                <div class="crumpled-actions">
                    <button type="button" class="restore-note-btn" title="بازگردانی به تخته">↩ بازگردانی</button>
                    <button type="button" class="perm-delete-btn" title="حذف دائمی">🗑️</button>
                </div>
            </div>
        `;

        card.querySelector(".restore-note-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            restoreNote(note.id);
        });

        card.querySelector(".perm-delete-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            permanentlyDeleteNote(note.id);
        });

        listEl.appendChild(card);
    });
}

function restoreNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    note.deletedAt = null;
    // If was in stack that no longer exists, clear stackId
    if (note.stackId && !stacks[note.stackId]) {
        note.stackId = null;
    }

    saveNotes();
    renderAllNotes();
    updateTrashIcon();
    renderTrashModal();
}

function permanentlyDeleteNote(noteId) {
    notes = notes.filter(n => n.id !== noteId);
    saveNotes();
    renderAllNotes();
    updateTrashIcon();
    renderTrashModal();
}

function emptyTrash() {
    notes = notes.filter(n => !n.deletedAt);
    saveNotes();
    renderAllNotes();
    updateTrashIcon();
    renderTrashModal();
}

if (trashBin) {
    trashBin.addEventListener("click", (e) => {
        if (!isDraggingToTrash) {
            openTrashModal();
        }
    });
}

if (closeTrashBtn) {
    closeTrashBtn.addEventListener("click", closeTrashModal);
}

if (trashBackdrop) {
    trashBackdrop.addEventListener("click", closeTrashModal);
}

if (emptyTrashBtn) {
    emptyTrashBtn.addEventListener("click", emptyTrash);
}

window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && trashModal && !trashModal.classList.contains("hidden")) {
        closeTrashModal();
    }
});

// ----------------------
//    DRAG & DROP EVENTS
// ----------------------
trashBin.addEventListener("dragover", (e) => {
    if (currentDragType !== "note" && currentDragType !== "stack") return;

    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    isDraggingToTrash = true;
    trashBin.classList.add("drag-over");
});

trashBin.addEventListener("dragleave", () => {
    trashBin.classList.remove("drag-over");
    isDraggingToTrash = false;
});

trashBin.addEventListener("drop", (e) => {
    if (currentDragType !== "note" && currentDragType !== "stack") return;

    e.preventDefault();
    trashBin.classList.remove("drag-over");
    isDraggingToTrash = false;

    // Trigger bounce animation on drop
    trashBin.classList.remove("trash-dropped");
    void trashBin.offsetWidth;
    trashBin.classList.add("trash-dropped");
    setTimeout(() => trashBin.classList.remove("trash-dropped"), 600);

    if (currentDragType === "stack" && draggedStackId) {
        notes.forEach(n => {
            if (n.stackId === draggedStackId) {
                n.deletedAt = Date.now();
            }
        });
        delete stacks[draggedStackId];
        saveNotes();
        renderAllNotes();
        updateTrashIcon();
        return;
    }

    const note = notes.find(n => n.id === draggedNoteId);

    if (note) {
        note.deletedAt = Date.now();
        if (note.stackId) {
            const remaining = getStackNotes(note.stackId);
            if (remaining.length === 1) {
                remaining[0].stackId = null;
                delete stacks[note.stackId];
            } else if (remaining.length > 1 && stacks[note.stackId]?.activeNoteId === note.id) {
                stacks[note.stackId].activeNoteId = remaining[0].id;
            }
        }
        saveNotes();
        renderAllNotes();
        updateTrashIcon();
    }
});
