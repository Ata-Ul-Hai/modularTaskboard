import { getTasks, addTask, updateTask, removeTask, CURRENT_USER } from './store.js';
// Wait, store needs to trigger worker sync. I'll handle worker sync in main or via subscription.
import { openModal, closeModal, renderBoard } from './ui.js';

let pendingDropCol = null;

// Helpers
function getSelectedTeam() {
    const select = document.getElementById('t-team');
    if (!select) return ["Unassigned"];
    return Array.from(select.options).filter(o => o.selected && o.value !== 'Unassigned').map(o => o.value);
}

export function handleSaveTask() {
    const id = document.getElementById('t-id').value;
    const title = document.getElementById('t-title').value;
    const team = getSelectedTeam();
    const due = document.getElementById('t-due').value;

    if (!title) return alert("Title required");

    // CONSTRAINT B: Rescue Mission
    if (pendingDropCol) {
        const now = new Date();
        const newDate = due ? new Date(due) : null;

        if (!newDate || newDate <= now) {
            alert("To move a task out of Incomplete, you must update the Due Date to the future.");
            return;
        }
    }

    if (id) {
        const tasks = getTasks();
        const existingTask = tasks.find(t => t.id == id);
        if (existingTask) {
            let updatedTask = { ...existingTask, title, team, due };

            if (pendingDropCol) {
                updatedTask.col = pendingDropCol;
                updatedTask.lateStatus = 'none';
                updatedTask.history.push({ user: CURRENT_USER, action: `Rescued to ${pendingDropCol} (Date Updated)`, timestamp: Date.now() });
                pendingDropCol = null;
            } else {
                updatedTask.history.push({ user: CURRENT_USER, action: `Updated`, timestamp: Date.now() });
            }
            updateTask(updatedTask);
        }
    } else {
        addTask({ id: Date.now(), title, team, due, col: 'todo', lateStatus: 'none', history: [] });
    }

    closeModal();
}

export function handleEditClick(id) {
    // We don't reset pendingDropCol here if it was set by a drop action
    // But if opened manually, we should ensure it is null. 
    // However, this function is called when clicking "Edit". manual open calls openModal directly in main.
    // Actually, let's make sure we find the task.
    const task = getTasks().find(t => t.id == id);
    if (task) {
        openModal(task);
    }
}

export function handleDeleteClick(id) {
    if (confirm("Delete?")) {
        removeTask(id);
    }
}

export function handleOpenModal() {
    pendingDropCol = null;
    openModal(null);
}

// Drag and Drop
export function handleDragStart(e) {
    e.dataTransfer.setData("text", e.target.dataset.id);
}

export function handleDragOver(e) {
    e.preventDefault();
}

export function handleDrop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text");
    const colDiv = e.target.closest('.column');
    if (!colDiv) return;

    const targetColId = colDiv.id.replace('col-', '').replace('list-', '');
    const tasks = getTasks();
    const t = tasks.find(x => x.id == id);

    if (!t || t.col === targetColId) return;

    const now = new Date();
    const deadline = t.due ? new Date(t.due) : null;

    // CONSTRAINT A
    if (targetColId === 'incomplete') {
        if (deadline && deadline > now) {
            alert("Only expired tasks can be moved to Incomplete.");
            return;
        }
    }

    // CONSTRAINT B
    if (t.col === 'incomplete' && (targetColId === 'todo' || targetColId === 'progress')) {
        pendingDropCol = targetColId;
        openModal(t); // Open edit for this task
        alert(`Task is expired! Update the Due Date to move it to ${targetColId}.`);
        return;
    }

    // CONSTRAINT B-2
    if (t.col === 'done' && (targetColId === 'todo' || targetColId === 'progress')) {
        if (deadline && deadline < now) {
            pendingDropCol = targetColId;
            openModal(t);
            alert(`Task is expired! Update the Due Date to move it to ${targetColId}.`);
            return;
        }
    }

    // CONSTRAINT C
    let updatedTask = { ...t };
    if (!updatedTask.history) updatedTask.history = [];
    updatedTask.history.push({ user: CURRENT_USER, action: `Moved to ${targetColId}`, timestamp: Date.now() });

    if (targetColId === 'done') {
        if (updatedTask.due && now > new Date(updatedTask.due)) updatedTask.lateStatus = 'late_done';
        else updatedTask.lateStatus = 'none';
    } else if (targetColId !== 'incomplete') {
        updatedTask.lateStatus = 'none';
    }

    updatedTask.col = targetColId;
    updateTask(updatedTask);
}
