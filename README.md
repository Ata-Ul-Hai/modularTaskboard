# TaskFlow – Modular Task Board

A lightweight, dependency-free Kanban-style task management application built with vanilla JavaScript (ES6 modules). Tasks are persisted in the browser's `localStorage`, and background deadline checking is handled by a Web Worker so the main thread stays responsive.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Architecture](#architecture)
- [Business Rules](#business-rules)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)

---

## Features

| Feature | Details |
|---|---|
| **Kanban Board** | Four columns: *To Do*, *In Progress*, *Incomplete*, *Done* |
| **Drag & Drop** | Move cards between columns with smart constraint enforcement |
| **Task Management** | Create, edit, and delete tasks with title, due date, and team assignment |
| **Automatic Expiry** | Web Worker auto-moves past-deadline tasks to *Incomplete* every second |
| **Analytics Dashboard** | On-time rate, missed count, pie chart breakdown |
| **Search & Filter** | Real-time filtering by title or team member name |
| **Activity Log** | Full audit trail of every change made to a task |
| **Themes** | Dark mode (default) and light mode, toggled from the sidebar |
| **Responsive Design** | Two-column desktop layout collapses to single-column on mobile |
| **No Build Step** | Pure ES6 modules — open in a browser and it works |

---

## Project Structure

```
modularTaskboard/
├── index.html              # App shell: columns, modal, analytics view, sidebar
├── style.css               # CSS custom properties, themes, responsive layout
└── modules/
    ├── main.js             # Entry point: initialization, event-listener wiring
    ├── store.js            # State management (pub-sub + localStorage)
    ├── ui.js               # DOM rendering, charts, modals, theme switching
    ├── event-handlers.js   # Business logic, drag-and-drop, constraint checks
    └── worker-manager.js   # Web Worker: background deadline monitoring
```

---

## Getting Started

ES6 modules are loaded over HTTP, so the app must be served — opening `index.html` directly via `file://` will be blocked by the browser's CORS policy.

### Option A — Python (no install required)

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

### Option B — Node.js

```bash
npx http-server .
```

Then open <http://localhost:8080>.

### Option C — VS Code Live Server

Install the **Live Server** extension and click *"Go Live"* in the status bar.

---

## Usage

### Creating a task

1. Click **+ New Task** in the sidebar.
2. Fill in the title, due date/time, and select one or more team members.
3. Click **Save** — the card appears in the *To Do* column.

### Moving tasks

Drag a card and drop it onto the target column header. Constraint rules apply (see [Business Rules](#business-rules)).

### Editing / deleting a task

- **Edit** — click the pencil icon on a card to reopen the modal.
- **Delete** — click the **×** icon and confirm the prompt.

### Analytics view

Click **Analytics** in the sidebar to switch from the board to the performance dashboard. It shows overall on-time rate, missed deadlines, and a pie chart of task distribution.

### Resetting data

Click **Reset** in the sidebar to clear all tasks from `localStorage` and reload the app.

---

## Architecture

### State management (`store.js`)

A minimal pub-sub store wraps the `localStorage` key `tasks_v5_simple`. Any module can call `subscribe(callback)` to be notified whenever tasks change, keeping the board in sync without a framework.

### Task schema

```js
{
  id:         Number,           // timestamp-based unique identifier
  title:      String,
  team:       String[],         // selected team members
  due:        String,           // ISO datetime string
  col:        'todo' | 'progress' | 'incomplete' | 'done',
  lateStatus: 'none' | 'missed' | 'late_done',
  history: [                    // audit log
    { user: String, action: String, timestamp: Number }
  ]
}
```

### Background deadline checking (`worker-manager.js`)

A dedicated Web Worker runs a 1-second interval. When a task's `due` date passes and the task is not yet *Done* or *Incomplete*, the worker posts a message to the main thread, which moves the card and logs the event.

---

## Business Rules

| Rule | Behaviour |
|---|---|
| **Move to Incomplete** | Only allowed when the task's deadline has already passed |
| **Exit Incomplete** | Moving back to *To Do* or *In Progress* requires updating the due date to a future time |
| **Late completion** | Dropping an overdue task on *Done* records `lateStatus: 'late_done'` and shows a *Late Done* badge |
| **Auto-expiry** | The Web Worker sets `lateStatus: 'missed'` and moves overdue tasks to *Incomplete* the moment their deadline passes |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Vanilla JavaScript (ES6+) |
| Module system | Native ES6 `import` / `export` |
| Styling | Plain CSS with CSS custom properties |
| State | Custom pub-sub pattern + `localStorage` |
| Background processing | Web Workers API |
| Charting | HTML5 `<canvas>` (custom pie chart) |
| Fonts | Google Fonts — *Inter* |

No bundler, no framework, no runtime dependencies.

---

## Contributing

1. Fork the repository and create a feature branch.
2. Serve the app locally (see [Getting Started](#getting-started)) and verify your changes in the browser.
3. Open a pull request describing what you changed and why.

Because there is no build step, changes take effect immediately on page reload.
