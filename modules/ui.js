export function renderBoard(tasks, filter = "") {
    const counts = { todo: 0, progress: 0, incomplete: 0, done: 0 };
    const cols = { todo: [], progress: [], incomplete: [], done: [] };

    tasks.forEach(t => {
        const teamString = Array.isArray(t.team) ? t.team.join(' ') : t.team;
        if (t.title.toLowerCase().includes(filter.toLowerCase()) || teamString.toLowerCase().includes(filter.toLowerCase())) {
            if (cols[t.col]) {
                cols[t.col].push(t);
                counts[t.col]++;
            }
        }
    });

    for (const k in cols) {
        const colEl = document.getElementById(`list-${k}`);
        if (colEl) colEl.innerHTML = cols[k].map(t => createCard(t)).join('');

        const countEl = document.getElementById(`c-${k}`);
        if (countEl) countEl.innerText = counts[k];
    }
    updateAnalytics(tasks, counts);
}

function createCard(t) {
    const dateObj = t.due ? new Date(t.due) : null;
    const dateStr = dateObj ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    const isMissed = t.col === 'incomplete' || t.lateStatus === 'late_done' ? 'missed' : '';

    let statusTag = '';
    if (t.col === 'incomplete') statusTag = `<span class="tag" style="color:var(--danger); border-color:var(--danger)">Late</span>`;
    else if (t.lateStatus === 'late_done') statusTag = `<span class="tag" style="color:var(--warning)">Late Done</span>`;

    return `
        <div class="task-card ${isMissed}" id="${t.id}" draggable="true" data-id="${t.id}">
            ${statusTag}
            <div class="card-title">${t.title}</div>
            <div class="meta-row">
                ${createAvatarGroup(t.team)}
                <div style="display:flex; align-items:center; gap:8px;">
                    <span>${dateStr}</span>
                    <span class="edit-btn" data-id="${t.id}" style="cursor:pointer">Edit</span>
                    <span class="delete-btn" data-id="${t.id}" style="cursor:pointer; color:var(--danger)">&times;</span>
                </div>
            </div>
        </div>
    `;
}

function createAvatarGroup(teamArray) {
    const team = Array.isArray(teamArray) && teamArray.length > 0 ? teamArray : ["Unassigned"];
    const avatarsHTML = team.map(member => {
        const initials = member === 'Unassigned' ? '?' : member.split(' ').map(n => n[0]).join('');
        return `<div class="avatar" title="${member}">${initials}</div>`;
    }).join('');
    return `<div class="avatar-group">${avatarsHTML}</div>`;
}

function updateAnalytics(tasks, counts) {
    const total = tasks.length;
    const doneTotal = tasks.filter(t => t.col === 'done').length;
    const missedList = tasks.filter(t => t.col === 'incomplete' || t.lateStatus === 'late_done');

    const anTotal = document.getElementById('an-total');
    if (anTotal) anTotal.innerText = total;

    const anOnTime = document.getElementById('an-ontime');
    if (anOnTime) anOnTime.innerText = (doneTotal > 0 ? Math.round((tasks.filter(t => t.col === 'done' && t.lateStatus === 'none').length / doneTotal) * 100) : 0) + "%";

    const anLate = document.getElementById('an-late');
    if (anLate) anLate.innerText = missedList.length;

    const missedLog = document.getElementById('missed-log');
    if (missedLog) missedLog.innerHTML = missedList.map(t => `<li>${t.title}</li>`).join('') || '<span style="color:var(--text-muted)">None</span>';

    renderChart(counts, total);
}

function renderChart(counts, total) {
    const chartData = [
        { label: 'Todo', count: counts.todo, color: '#4f46e5' },
        { label: 'Progress', count: counts.progress, color: '#f59e0b' },
        { label: 'Incomplete', count: counts.incomplete, color: '#ef4444' },
        { label: 'Done', count: counts.done, color: '#10b981' }
    ];

    const canvas = document.getElementById('taskPieChart');
    if (canvas && total > 0) {
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        let currentAngle = 0;
        let legendHTML = '';

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        chartData.forEach(segment => {
            if (segment.count > 0) {
                const sliceAngle = (segment.count / total) * 2 * Math.PI;
                ctx.fillStyle = segment.color;
                ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle); ctx.closePath(); ctx.fill();
                currentAngle += sliceAngle;
                legendHTML += `<div class="legend-item"><div class="legend-color" style="background:${segment.color};"></div><span>${segment.label} (${segment.count})</span></div>`;
            }
        });
        const legend = document.getElementById('chart-legend');
        if (legend) legend.innerHTML = legendHTML;
    }
}

export function switchView(v) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const navBtn = document.getElementById(`nav-${v}`);
    if (navBtn) navBtn.classList.add('active');

    document.getElementById('view-board').style.display = v === 'board' ? 'grid' : 'none';
    document.getElementById('view-analytics').style.display = v === 'analytics' ? 'block' : 'none';

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.remove('active');
        document.querySelector('.sidebar-overlay').classList.remove('active');
    }
}

export function toggleTheme() {
    document.body.setAttribute('data-theme', document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    let theme_name = document.body.getAttribute('data-theme') === 'dark' ? 'Light Mode' : 'Dark Mode';
    document.getElementById('btn-theme').innerText = theme_name;
}

export function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

export function renderActivityLog(history) {
    const logElement = document.getElementById('activity-log-display');
    if (!history || history.length === 0) { logElement.innerHTML = 'No activity.'; return; }
    logElement.innerHTML = history.slice().reverse().map(log => {
        return `<div class="log-item"><strong>${log.user}</strong>: ${log.action}</div>`;
    }).join('');
}

export function openModal(task = null) {
    document.getElementById('t-id').value = task ? task.id : '';
    document.getElementById('t-title').value = task ? task.title : '';
    document.getElementById('t-due').value = task ? task.due : '';

    const teamSelect = document.getElementById('t-team');
    if (teamSelect) {
        if (task) {
            Array.from(teamSelect.options).forEach(o => o.selected = task.team.includes(o.value));
        } else {
            Array.from(teamSelect.options).forEach(o => o.selected = o.value === 'Unassigned');
        }
    }

    renderActivityLog(task ? task.history : null);
    document.getElementById('task-modal').style.display = 'grid';
}

export function closeModal() {
    document.getElementById('task-modal').style.display = 'none';
}
