# Fridge Sticky Notes

[فارسی](README.fa.md) | **English**

A skeuomorphic personal productivity and task management dashboard designed as a refrigerator door. Built as both a Google Chrome Extension (Manifest V3 new-tab override) and a standalone browser application.

The project is built entirely with vanilla web technologies, requiring zero build steps, zero package managers, and no external framework dependencies.

---

## Features

### Notes and Stacks
- Multi-page sticky notes with automatic paper chaining and visual metallic staples when tasks exceed page capacity.
- Note grouping (stacks) with masking tape headers, counter badges, and keyboard navigation.
- Masonry-based cascading grid layout that adapts dynamically to window resizing and panel toggles.
- Custom right-click context menus for note color selection, duplicating, stacking, and deletion.

### Interactive Tasks and Magnetic Tools
- Inline task creation, inline editing, and reordering.
- Magnetic tools:
  - **Pen**: Drag and drop onto any task to strike it through with a wavy scribble effect.
  - **Eraser**: Drag and drop over tasks to delete them.
- Timed cleanup: scribbled tasks are automatically cleared after 2 hours; deleted notes in the recycling bin are permanently purged after 24 hours.
- Text selection and drag separation: single-click opens direct text editing, while dragging the task moves it.

### Tri-Calendar System and Deadlines
- Three calendar modes: Solar Hijri (Jalali), Gregorian, and Lunar Hijri, with smooth transitions.
- Task deadline binding with colored indicator dots on calendar dates.
- Overdue task aggregation with an alert counter.
- **Expanded Calendar View**: Full-screen monthly view displaying task pills directly inside day cells, with drag-and-drop deadline rescheduling across days.
- **3-Week Reminder Bell**: Magnetic brass bell with animated clapper for urgent tasks, overdue filter tabs, and one-click jump-to-note focusing.

### Daily Habits and Circadian Sleep Tracker
- Habit scheduler supporting daily, interval, weekly, and monthly recurrence patterns.
- 7-day retrospective editing lock to maintain habit tracking integrity.
- Focus chronometer: circular countdown timer with pause/resume and automatic completion upon reaching 100%.
- Circadian sleep tracking: 04:00 to 04:00 session window normalizing sleep across midnight, with nighttime and daytime status modes.
- Analytics dashboard: 30-day SVG adherence charts, sleep duration trend curves with healthy bands, streak counters, and per-habit lifestyle insights.

### Procedural Audio Engine
- Built-in Web Audio API procedural sound synthesizer (no external audio files or network requests).
- Acoustic feedback for sticking notes, checkbox clicks, pencil scribbling, eraser wiping, paper crumpling, bell chimes, and timer bells.
- Persistent mute/unmute toggle control.

### Localization and Themes
- Four languages supported: English, Persian (فارسی), Arabic (العربية), and Korean (한국어).
- Complete bidirectional layout mirroring (RTL and LTR).
- Dark and light theme modes with high-contrast skeuomorphic styling.

---

## Installation

### Option 1: Chrome Extension (Recommended)
1. Clone or download this repository:
   ```bash
   git clone https://github.com/Mohammad-Khoshroo/sticky-todo-chrome-extension.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the cloned repository directory (containing `manifest.json`).
6. Open a new tab to access the dashboard.

### Option 2: Standalone Web Application
You can run the application directly in any modern browser without Chrome extension APIs:
- Double-click `index.html` to open it locally via the `file://` protocol, or
- Serve the directory using any static file server:
  ```bash
  # Python 3
  python -m http.server 8000

  # Node.js (npx)
  npx serve .
  ```
  Then navigate to `http://localhost:8000`. Storage automatically falls back to `window.localStorage`.

---

## Keyboard Shortcuts

| Shortcut | Context | Action |
| --- | --- | --- |
| `Enter` | Inside task input | Split text or create a new task below |
| `Enter` | Note title | Move focus to the first task |
| `Shift + Enter` | Inside task input | Insert newline in current task |
| `Ctrl + Enter` | Anywhere | Append a new task to the active note |
| `ArrowLeft` / `ArrowRight` | Active stack | Cycle through notes in the stack |
| `Escape` | Modals / Calendars | Close open dialog or expanded view |

---

## Project Structure

```text
├── index.html                  # Main DOM structure and modal containers
├── manifest.json               # Chrome Extension Manifest V3 configuration
├── style.css                   # Master stylesheet and font imports
├── AGENTS.md                   # Developer architecture documentation and guidelines
├── jalaali/                    # Jalaali calendar calculation library
├── images/                     # Extension icons, textures, and UI assets
├── fonts/ & vazirmatn/         # Typography assets
├── styles/                     # Modular CSS
│   ├── UI.css                  # Refrigerator magnets, buttons, menus, and LTR overrides
│   ├── notes.css               # Paper textures, tape, staples, and note typography
│   ├── calendar.css            # Compact calendar, deadline badges, and expanded grid
│   ├── routine.css             # Habit tracking cards, circadian sleep widget, charts
│   └── dark-mode.css           # Comprehensive dark theme color overrides
└── js/                         # Modular JavaScript
    ├── main.js                 # App initialization, storage synchronization, and cleanup
    ├── i18n.js                 # 4-language dictionary and translation engine
    ├── masorny.js              # Masonry cascading grid layout engine
    ├── calendar/               # Jalali/Gregorian/Hijri logic, reminders, expanded modal
    ├── note/                   # Note lifecycle, task editing, drag-and-drop mechanics
    ├── routine/                # Habit patterns, focus chronometer, circadian sleep, dashboard
    └── UI/                     # Web Audio synthesizer, theme, trash bin, magnetic tools
```

---

## Architecture and Design Decisions

- **Zero Build Tooling**: Standard ES6+ JavaScript modules loaded synchronously, allowing direct inspection, debugging, and offline execution without transpilation or bundle steps.
- **Dual Storage Strategy**: Environment detection checks for `chrome.storage.local` and seamlessly falls back to `window.localStorage` when running outside an extension environment.
- **Procedural Sound**: All sound effects are generated dynamically via oscillator nodes, gain envelopes, and biquad filters, eliminating asset loading latency and missing file errors.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
