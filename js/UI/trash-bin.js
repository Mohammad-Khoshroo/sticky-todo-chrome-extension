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
    const hasTrash = notes.some(n => n.deletedAt);

    if (hasTrash) {
        trashIcon.src = "images/waste.ico";
    } else {
        trashIcon.src = "images/trash-bin.ico";
    }
}

trashBin.addEventListener("dragover", (e) => {
    if (currentDragType !== "note" && currentDragType !== "stack") return;

    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    trashBin.classList.add("drag-over");
});

trashBin.addEventListener("dragleave", () => {
    trashBin.classList.remove("drag-over");
});

trashBin.addEventListener("drop", (e) => {
    if (currentDragType !== "note" && currentDragType !== "stack") return;

    e.preventDefault();
    trashBin.classList.remove("drag-over");

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
