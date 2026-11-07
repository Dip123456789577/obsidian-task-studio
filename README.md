# Obsidian Task Studio

# PROJECT: TASKFORGE — Advanced Personal Productivity & Task Management Platform

Act as a senior full-stack developer, UI/UX designer, and SaaS product architect.

Build a complete, fully functional, responsive To-Do List and Personal Productivity Management Web Application named **TASKFORGE**.

The application must have the visual identity of Obsidian: sophisticated dark surfaces, charcoal backgrounds, subtle purple accents, elegant typography, minimal visual noise, and a professional knowledge-work aesthetic.

IMPORTANT: This must be a REAL WORKING WEB APPLICATION, not just a static UI prototype. Every button, menu, filter, modal, form, navigation item, and task interaction must work correctly.

---

# 1. DESIGN SYSTEM — OBSIDIAN-INSPIRED

Create a premium dark interface inspired by the Obsidian desktop application.

### Color Palette

- Main background: #111111
- Sidebar background: #151515
- Card background: #1B1B1B
- Elevated surface: #202020
- Border: #2B2B2B
- Primary accent: #A78BFA
- Secondary accent: #8B5CF6
- Main text: #F5F5F5
- Secondary text: #A1A1AA
- Muted text: #71717A
- Success: #4ADE80
- Warning: #FBBF24
- Danger: #F87171

### UI Style

- Modern typography: Inter or Geist.
- Minimalist and professional layout.
- Subtle borders and shadows.
- Rounded corners between 8px and 14px.
- Smooth micro-interactions.
- Elegant transitions.
- Beautiful empty states.
- Consistent spacing and alignment.
- Lucide icons throughout the application.

Avoid excessive gradients, oversized headings, unnecessary animations, and colorful dashboard cards.

The result should feel like a premium desktop productivity tool.

# 2. APPLICATION LAYOUT

Create a professional dashboard with three primary areas:

### Left Sidebar

Fixed, collapsible navigation containing:

- TASKFORGE logo and brand name.
- Dashboard.
- Inbox.
- My Tasks.
- Today.
- Upcoming.
- Calendar.
- Important / Starred.
- Completed.
- Projects.
- Categories.
- Tags.
- Trash.
- Settings.

At the bottom:

- User profile.
- Account information.
- Theme settings.
- Collapse sidebar button.

Show active navigation states with a subtle purple highlight.

### Main Content Area

Display the currently selected workspace and its content.

### Top Header

Include:

- Dynamic page title.
- Current date.
- Global search.
- Keyboard shortcut indicator (Ctrl + K).
- Notification icon.
- Quick Add Task button.
- User avatar menu.

# 3. DASHBOARD

Create a beautiful productivity dashboard.

### Welcome Section

Display a dynamic greeting:
"Good afternoon, Alex."
Subtitle: "Let's make today productive."

Show the current date.

### Statistics Cards

Create four compact summary cards:

1. Total Tasks.
2. Completed Tasks.
3. Pending Tasks.
4. Overdue Tasks.

All numbers must update dynamically based on actual task data.

### Productivity Section

- Daily completion progress.
- Completion percentage.
- Weekly productivity chart.
- Upcoming deadlines.
- Recently created tasks.
- Important tasks.
- Today's task list.

Use real application data rather than hardcoded statistics.

# 4. COMPLETE TASK MANAGEMENT SYSTEM

This is the most important functionality.

Users must be able to:

- Create tasks.
- Edit tasks.
- Delete tasks.
- Restore deleted tasks.
- Permanently delete tasks.
- Mark tasks as completed.
- Reopen completed tasks.
- Duplicate tasks.
- Star and unstar important tasks.
- Add task descriptions.
- Set deadlines.
- Set start dates.
- Set due times.
- Assign priorities.
- Assign categories and projects.
- Add multiple tags.
- Add subtasks.
- Track task progress.
- Add notes to tasks.

### Task Properties

Each task should support:

- Unique ID.
- Title.
- Description.
- Completion status.
- Priority: Low, Medium, High, Urgent.
- Due date.
- Due time.
- Creation date.
- Last updated date.
- Category.
- Project.
- Multiple tags.
- Starred status.
- Recurrence settings.
- Reminder settings.
- Subtasks.

### Task Creation Interface

Create a premium task creation modal or slide-over panel.

Fields:

- Task title.
- Description

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
