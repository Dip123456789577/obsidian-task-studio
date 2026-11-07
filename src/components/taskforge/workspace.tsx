import { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Check,
  CheckCheck,
  Clock,
  Filter,
  FolderKanban,
  LayoutGrid,
  List,
  ListTodo,
  Plus,
  RotateCcw,
  Star,
  Target,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import type {
  CategoryMeta,
  ProjectMeta,
  Task,
  TaskPriority,
  TaskStatus,
  UserPreferences,
  ViewMode,
  WorkspaceView,
} from "./types";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PREFERENCES,
  DEFAULT_PROJECTS,
  getLocalCategories,
  getLocalPreferences,
  getLocalProjects,
  saveLocalCategories,
  saveLocalPreferences,
  saveLocalProjects,
  TaskforgeStorage,
} from "./storage-service";
import { localDateKey } from "@/lib/taskforge-logic";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { CommandPalette } from "./command-palette";
import { TaskModal } from "./task-modal";
import { playTaskCompleteSound, playTaskUncheckSound } from "@/lib/sound-effects";
import { DashboardView } from "./views/dashboard-view";
import { ListView } from "./views/list-view";
import { KanbanView } from "./views/kanban-view";
import { CalendarView } from "./views/calendar-view";
import { GridView } from "./views/grid-view";
import { MatrixView } from "./views/matrix-view";
import { ProjectsView } from "./views/projects-view";
import { CategoriesView } from "./views/categories-view";
import { TagsView } from "./views/tags-view";
import { AnalyticsView } from "./views/analytics-view";
import { SettingsView } from "./views/settings-view";
import { PomodoroTimer } from "./pomodoro-timer";
import { ShortcutsModal } from "./shortcuts-modal";

const VIEW_TITLES: Record<WorkspaceView, string> = {
  dashboard: "Productivity Dashboard",
  inbox: "Inbox",
  tasks: "All Tasks Workspace",
  today: "Today's Agenda",
  upcoming: "Upcoming Timeline",
  calendar: "Interactive Calendar",
  matrix: "Eisenhower Decision Matrix",
  important: "Important / Starred",
  completed: "Completed Archive",
  projects: "Projects Portfolio",
  categories: "Domain Categories",
  tags: "Tags & Taxonomy",
  trash: "Trash Bin",
  analytics: "Productivity Intelligence",
  settings: "Settings & Personalization",
};

type WorkspaceProps = {
  userId: string;
  email: string;
  onSignOut: () => Promise<void>;
};

export function Workspace({ userId, email, onSignOut }: WorkspaceProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<ProjectMeta[]>(DEFAULT_PROJECTS);
  const [categories, setCategories] = useState<CategoryMeta[]>(DEFAULT_CATEGORIES);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [displayName, setDisplayName] = useState(email.split("@")[0] || "Architect");
  const [loading, setLoading] = useState(true);

  // Layout & Navigation State
  const [currentView, setCurrentView] = useState<WorkspaceView>("dashboard");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | Partial<Task> | null>(null);
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [starredOnly, setStarredOnly] = useState(false);
  const [dueTodayOnly, setDueTodayOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [sortBy, setSortBy] = useState<"due_at" | "priority" | "created_at" | "title">("due_at");

  // Reminders tracked set
  const notifiedReminders = useState<Set<string>>(() => new Set())[0];

  // Load initial data
  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const loadedTasks = await TaskforgeStorage.loadAllTasks(userId);
      setTasks(loadedTasks);

      const loadedProjects = getLocalProjects(userId);
      setProjects(loadedProjects);

      const loadedCategories = getLocalCategories(userId);
      setCategories(loadedCategories);

      const loadedPrefs = getLocalPreferences(userId);
      setPreferences(loadedPrefs);
      if (loadedPrefs.defaultView) {
        setViewMode(loadedPrefs.defaultView);
      }
    } catch (err) {
      console.error("Workspace load error:", err);
      toast.error("Could not load workspace. Running in offline storage mode.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  // Global Keyboard Shortcuts (Ctrl/Cmd + K, Ctrl/Cmd + N, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement;

      // Ctrl / Cmd + K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }

      // Ctrl / Cmd + B -> Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }

      // Ctrl / Cmd + N -> New Task (or press 'c' when not typing)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setSelectedTask(null);
        setTaskModalOpen(true);
      } else if (!isInput && e.key.toLowerCase() === "c") {
        e.preventDefault();
        setSelectedTask(null);
        setTaskModalOpen(true);
      }

      // Shortcuts modal: '?'
      if (!isInput && e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }

      // Pomodoro focus timer: 'p'
      if (!isInput && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPomodoroOpen((prev) => !prev);
      }

      // Number keys 1-5 for fast view switching (when not typing)
      if (!isInput && ["1", "2", "3", "4", "5"].includes(e.key)) {
        e.preventDefault();
        if (e.key === "1") setViewMode("list");
        if (e.key === "2") setViewMode("kanban");
        if (e.key === "3") setViewMode("matrix");
        if (e.key === "4") setViewMode("calendar");
        if (e.key === "5") setViewMode("grid");
      }

      // Escape -> close dialogs
      if (e.key === "Escape") {
        if (commandPaletteOpen) setCommandPaletteOpen(false);
        if (taskModalOpen) setTaskModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, taskModalOpen]);

  // Background Reminder Checker (every 30s)
  useEffect(() => {
    if (!preferences.inAppReminders) return;

    const checkReminders = () => {
      const now = Date.now();
      tasks.forEach((task) => {
        if (task.completed || task.deleted_at || !task.reminder_at) return;
        if (notifiedReminders.has(task.id)) return;

        const reminderTime = new Date(task.reminder_at).getTime();
        if (reminderTime <= now && reminderTime > now - 3600000) {
          notifiedReminders.add(task.id);
          toast.info(`Task Reminder: "${task.title}" is due now!`, {
            duration: 8000,
            action: {
              label: "Open Task",
              onClick: () => {
                setSelectedTask(task);
                setTaskModalOpen(true);
              },
            },
          });

          if (
            preferences.browserNotifications &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification(`TASKFORGE Reminder: ${task.title}`, {
              body: task.description || "Deadline approaching.",
            });
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [tasks, preferences, notifiedReminders]);

  // Task Actions
  const handleSaveTask = async (taskData: Partial<Task> & { title: string }) => {
    try {
      const saved = await TaskforgeStorage.upsertTask(taskData, userId);
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      toast.success(taskData.id ? "Task updated successfully." : "New task created.");
      setTaskModalOpen(false);
      setSelectedTask(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save task.";
      toast.error(message);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const { task: updated, nextRecurring } = await TaskforgeStorage.toggleComplete(task, userId);
      if (updated.completed) {
        playTaskCompleteSound();
      } else {
        playTaskUncheckSound();
      }
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === task.id ? updated : t));
        if (nextRecurring) next.unshift(nextRecurring);
        return next;
      });

      if (nextRecurring) {
        toast.success(
          `Completed! Next recurring task scheduled for ${format(new Date(nextRecurring.due_at!), "MMM d")}.`,
        );
      } else {
        toast.success(updated.completed ? "Task marked completed!" : "Task reopened.");
      }
    } catch {
      toast.error("Could not update task status.");
    }
  };

  const handleToggleStar = async (task: Task) => {
    try {
      const updated: Task = {
        ...task,
        starred: !task.starred,
        updated_at: new Date().toISOString(),
      };
      await TaskforgeStorage.upsertTask(updated, userId);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch {
      toast.error("Could not toggle star.");
    }
  };

  const handleDelete = async (task: Task) => {
    try {
      await TaskforgeStorage.moveToTrash(task.id, userId);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, deleted_at: new Date().toISOString() } : t)),
      );
      toast.success("Task moved to Trash.");
    } catch {
      toast.error("Could not delete task.");
    }
  };

  const handleRestore = async (task: Task) => {
    try {
      await TaskforgeStorage.restoreFromTrash(task.id, userId);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, deleted_at: null } : t)));
      toast.success("Task restored.");
    } catch {
      toast.error("Could not restore task.");
    }
  };

  const handlePermanentDelete = async (task: Task) => {
    if (!window.confirm(`Permanently delete "${task.title}"? This cannot be undone.`)) return;
    try {
      await TaskforgeStorage.permanentlyDelete(task.id, userId);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success("Task permanently deleted.");
    } catch {
      toast.error("Could not delete task.");
    }
  };

  const handleDuplicate = async (task: Task) => {
    try {
      const copy = await TaskforgeStorage.duplicateTask(task, userId);
      setTasks((prev) => [copy, ...prev]);
      toast.success("Task duplicated.");
    } catch {
      toast.error("Could not duplicate task.");
    }
  };

  const handleUpdateTaskPriority = async (
    taskId: string,
    priority: "urgent" | "high" | "medium" | "low",
    starred: boolean,
  ) => {
    try {
      const target = tasks.find((t) => t.id === taskId);
      if (!target) return;
      const updated: Task = {
        ...target,
        priority,
        starred,
        updated_at: new Date().toISOString(),
      };
      await TaskforgeStorage.upsertTask(updated, userId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      toast.success(
        `Task moved to ${priority.toUpperCase()} (${starred ? "Starred" : "Standard"})`,
      );
    } catch {
      toast.error("Could not update task priority.");
    }
  };

  const handleMoveTaskStatus = async (task: Task, newStatus: TaskStatus) => {
    const isDone = newStatus === "done";
    const updated: Task = {
      ...task,
      status: newStatus,
      completed: isDone,
      completed_at: isDone ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    await TaskforgeStorage.upsertTask(updated, userId);
  };

  const handleInlineUpdateTitle = async (task: Task, newTitle: string) => {
    const updated: Task = { ...task, title: newTitle, updated_at: new Date().toISOString() };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    await TaskforgeStorage.upsertTask(updated, userId);
  };

  const handleBulkComplete = async (taskIds: string[]) => {
    const nowIso = new Date().toISOString();
    for (const id of taskIds) {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        await TaskforgeStorage.upsertTask(
          { ...task, completed: true, status: "done", completed_at: nowIso },
          userId,
        );
      }
    }
    setTasks((prev) =>
      prev.map((t) =>
        taskIds.includes(t.id)
          ? { ...t, completed: true, status: "done", completed_at: nowIso }
          : t,
      ),
    );
    toast.success(`${taskIds.length} tasks marked complete.`);
  };

  const handleBulkDelete = async (taskIds: string[]) => {
    for (const id of taskIds) {
      await TaskforgeStorage.moveToTrash(id, userId);
    }
    const nowIso = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => (taskIds.includes(t.id) ? { ...t, deleted_at: nowIso } : t)),
    );
    toast.success(`${taskIds.length} tasks moved to Trash.`);
  };

  // Projects & Categories handlers
  const handleSaveProject = async (proj: ProjectMeta) => {
    const updated = projects.filter((p) => p.id !== proj.id);
    updated.push(proj);
    setProjects(updated);
    saveLocalProjects(userId, updated);
  };

  const handleDeleteProject = async (projId: string) => {
    const updated = projects.filter((p) => p.id !== projId);
    setProjects(updated);
    saveLocalProjects(userId, updated);
    toast.success("Project deleted.");
  };

  const handleSaveCategory = async (cat: CategoryMeta) => {
    const updated = categories.filter((c) => c.id !== cat.id);
    updated.push(cat);
    setCategories(updated);
    saveLocalCategories(userId, updated);
  };

  const handleDeleteCategory = async (catId: string) => {
    const updated = categories.filter((c) => c.id !== catId);
    setCategories(updated);
    saveLocalCategories(userId, updated);
    toast.success("Category deleted.");
  };

  const handleUpdatePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    saveLocalPreferences(userId, newPrefs);
  };

  const handleOpenNewTask = (defaultStatus?: TaskStatus, defaultDate?: string) => {
    setSelectedTask(
      defaultDate || defaultStatus
        ? {
            title: "",
            description: "",
            notes: "",
            priority: "medium",
            status: defaultStatus || "backlog",
            completed: false,
            due_at: defaultDate || null,
            subtasks: [],
            tags: [],
          }
        : null,
    );
    setTaskModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setPriorityFilter("all");
    setStatusFilter("all");
    setProjectFilter("all");
    setCategoryFilter("all");
    setTagFilter("all");
    setStarredOnly(false);
    setDueTodayOnly(false);
    setOverdueOnly(false);
    setFocusMode(false);
  };

  // Filter pipeline
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const todayKey = localDateKey(now);
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return tasks
      .filter((task) => {
        // Trash filter
        if (currentView === "trash") return task.deleted_at !== null;
        if (task.deleted_at !== null) return false;

        // View-specific routes
        if (currentView === "completed" && !task.completed) return false;
        if (
          currentView !== "completed" &&
          task.completed &&
          !["tasks", "inbox", "calendar", "projects", "categories", "tags"].includes(currentView)
        ) {
          return false;
        }

        if (currentView === "inbox" && task.project) return false;
        if (currentView === "important" && !task.starred) return false;
        if (
          currentView === "today" &&
          (!task.due_at || localDateKey(new Date(task.due_at)) !== todayKey)
        ) {
          return false;
        }
        if (
          currentView === "upcoming" &&
          (!task.due_at || new Date(task.due_at).getTime() < now.getTime())
        ) {
          return false;
        }

        // Focus Mode filter (Urgent / High or Starred only)
        if (
          focusMode &&
          (task.completed ||
            (task.priority !== "urgent" && task.priority !== "high" && !task.starred))
        ) {
          return false;
        }

        // Priority filter
        if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;

        // Status filter
        if (statusFilter !== "all") {
          const curStatus = task.status || (task.completed ? "done" : "backlog");
          if (curStatus !== statusFilter) return false;
        }

        // Project filter
        if (projectFilter !== "all" && task.project !== projectFilter) return false;

        // Category filter
        if (categoryFilter !== "all" && task.category !== categoryFilter) return false;

        // Tag filter
        if (
          tagFilter !== "all" &&
          !task.tags.map((t) => t.toLowerCase()).includes(tagFilter.toLowerCase())
        ) {
          return false;
        }

        // Starred only toggle
        if (starredOnly && !task.starred) return false;

        // Due today toggle
        if (dueTodayOnly && (!task.due_at || localDateKey(new Date(task.due_at)) !== todayKey)) {
          return false;
        }

        // Overdue toggle
        if (
          overdueOnly &&
          (task.completed || !task.due_at || new Date(task.due_at).getTime() >= now.getTime())
        ) {
          return false;
        }

        // Search Query
        if (normalizedQuery) {
          const haystack = [
            task.title,
            task.description,
            task.notes,
            task.project,
            task.category,
            ...task.tags,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (!haystack.includes(normalizedQuery)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (currentView === "trash") {
          return new Date(b.deleted_at ?? 0).getTime() - new Date(a.deleted_at ?? 0).getTime();
        }

        // Sort by chosen criterion
        if (sortBy === "priority") {
          const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        }
        if (sortBy === "created_at") {
          return b.created_at.localeCompare(a.created_at);
        }
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }

        // Default: due_at (ascending) with starred priority
        const dueA = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
        const dueB = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
        return (
          Number(b.starred) - Number(a.starred) ||
          dueA - dueB ||
          b.created_at.localeCompare(a.created_at)
        );
      });
  }, [
    tasks,
    currentView,
    focusMode,
    priorityFilter,
    statusFilter,
    projectFilter,
    categoryFilter,
    tagFilter,
    starredOnly,
    dueTodayOnly,
    overdueOnly,
    searchQuery,
    sortBy,
  ]);

  const activeFilterCount =
    (priorityFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (projectFilter !== "all" ? 1 : 0) +
    (categoryFilter !== "all" ? 1 : 0) +
    (tagFilter !== "all" ? 1 : 0) +
    (starredOnly ? 1 : 0) +
    (dueTodayOnly ? 1 : 0) +
    (overdueOnly ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground select-none">
      {/* 1. Left Navigation Sidebar */}
      <aside
        className={`hidden md:block shrink-0 border-r border-sidebar-border bg-sidebar transition-all duration-200 ${
          sidebarCollapsed ? "w-16" : "w-60"
        }`}
      >
        <Sidebar
          currentView={currentView}
          collapsed={sidebarCollapsed}
          tasks={tasks}
          email={email}
          displayName={displayName}
          onNavigate={(view) => {
            setCurrentView(view);
            if (view === "tasks") setViewMode("list");
          }}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenNewTask={() => handleOpenNewTask()}
          onSignOut={onSignOut}
        />
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 border-sidebar-border bg-sidebar p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar Navigation</SheetTitle>
          </SheetHeader>
          <Sidebar
            currentView={currentView}
            collapsed={false}
            compact
            tasks={tasks}
            email={email}
            displayName={displayName}
            onNavigate={(view) => {
              setCurrentView(view);
              setMobileNavOpen(false);
            }}
            onToggleCollapse={() => {}}
            onOpenNewTask={() => {
              setMobileNavOpen(false);
              handleOpenNewTask();
            }}
            onSignOut={onSignOut}
          />
        </SheetContent>
      </Sheet>

      {/* 2. Main Content Workspace */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <TopNav
          currentView={currentView}
          pageTitle={VIEW_TITLES[currentView] || "TASKFORGE"}
          tasks={tasks}
          email={email}
          displayName={displayName}
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode(!focusMode)}
          onOpenSearch={() => setCommandPaletteOpen(true)}
          onOpenNewTask={() => handleOpenNewTask()}
          onOpenPomodoro={() => setPomodoroOpen((prev) => !prev)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onNavigate={(view) => setCurrentView(view)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onSignOut={onSignOut}
          onTaskClick={(task) => {
            setSelectedTask(task);
            setTaskModalOpen(true);
          }}
        />

        {/* Workspace Body */}
        <main className="hide-scrollbar flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1440px] space-y-5">
            {/* View Specific Content */}
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-28 rounded-xl bg-card border border-border" />
                <div className="grid grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-card border border-border" />
                  ))}
                </div>
                <div className="h-72 rounded-xl bg-card border border-border" />
              </div>
            ) : currentView === "dashboard" ? (
              <DashboardView
                tasks={tasks}
                displayName={displayName}
                onOpenNewTask={() => handleOpenNewTask()}
                onSelectTask={(task) => {
                  setSelectedTask(task);
                  setTaskModalOpen(true);
                }}
                onToggleComplete={handleToggleComplete}
                onToggleStar={handleToggleStar}
                onNavigate={(view) => setCurrentView(view)}
              />
            ) : currentView === "projects" ? (
              <ProjectsView
                projects={projects}
                tasks={tasks}
                onSaveProject={handleSaveProject}
                onDeleteProject={handleDeleteProject}
                onFilterByProject={(name) => {
                  setProjectFilter(name);
                  setCurrentView("tasks");
                }}
                onOpenNewTaskForProject={(name) => {
                  setSelectedTask({ project: name });
                  setTaskModalOpen(true);
                }}
              />
            ) : currentView === "categories" ? (
              <CategoriesView
                categories={categories}
                tasks={tasks}
                onSaveCategory={handleSaveCategory}
                onDeleteCategory={handleDeleteCategory}
                onFilterByCategory={(cat) => {
                  setCategoryFilter(cat);
                  setCurrentView("tasks");
                }}
                onOpenNewTaskForCategory={(cat) => {
                  setSelectedTask({ category: cat });
                  setTaskModalOpen(true);
                }}
              />
            ) : currentView === "tags" ? (
              <TagsView
                tasks={tasks}
                onFilterByTag={(tag) => {
                  setTagFilter(tag);
                  setCurrentView("tasks");
                }}
                onOpenNewTaskWithTag={(tag) => {
                  setSelectedTask({ tags: [tag] });
                  setTaskModalOpen(true);
                }}
              />
            ) : currentView === "analytics" ? (
              <AnalyticsView tasks={tasks} />
            ) : currentView === "settings" ? (
              <SettingsView
                email={email}
                displayName={displayName}
                preferences={preferences}
                tasks={tasks}
                projects={projects}
                categories={categories}
                onUpdateDisplayName={async (name) => setDisplayName(name)}
                onUpdatePreferences={handleUpdatePreferences}
                onRefreshData={loadWorkspace}
                onSignOut={onSignOut}
              />
            ) : (
              /* All Task List / Kanban / Calendar / Grid views */
              <div className="space-y-4">
                {/* Advanced Search, Filters & View Mode Selector */}
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
                  {/* Row 1: Title & View Modes */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-foreground tracking-tight">
                        {VIEW_TITLES[currentView]}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"} shown
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* View Mode Switcher */}
                      <div className="flex items-center border border-border rounded-lg p-0.5 bg-secondary/40">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2.5 text-xs gap-1.5 ${
                            viewMode === "list"
                              ? "bg-card text-foreground font-semibold shadow-xs"
                              : "text-muted-foreground"
                          }`}
                          onClick={() => setViewMode("list")}
                        >
                          <List className="size-3.5" />
                          <span className="hidden sm:inline">List</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2.5 text-xs gap-1.5 ${
                            viewMode === "kanban"
                              ? "bg-card text-foreground font-semibold shadow-xs"
                              : "text-muted-foreground"
                          }`}
                          onClick={() => setViewMode("kanban")}
                        >
                          <FolderKanban className="size-3.5" />
                          <span className="hidden sm:inline">Kanban</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2.5 text-xs gap-1.5 ${
                            viewMode === "matrix" || currentView === "matrix"
                              ? "bg-card text-foreground font-semibold shadow-xs text-primary"
                              : "text-muted-foreground"
                          }`}
                          onClick={() => setViewMode("matrix")}
                        >
                          <Target className="size-3.5" />
                          <span className="hidden sm:inline">Matrix</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2.5 text-xs gap-1.5 ${
                            viewMode === "calendar"
                              ? "bg-card text-foreground font-semibold shadow-xs"
                              : "text-muted-foreground"
                          }`}
                          onClick={() => setViewMode("calendar")}
                        >
                          <CalendarDays className="size-3.5" />
                          <span className="hidden sm:inline">Calendar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2.5 text-xs gap-1.5 ${
                            viewMode === "grid"
                              ? "bg-card text-foreground font-semibold shadow-xs"
                              : "text-muted-foreground"
                          }`}
                          onClick={() => setViewMode("grid")}
                        >
                          <LayoutGrid className="size-3.5" />
                          <span className="hidden sm:inline">Cards</span>
                        </Button>
                      </div>

                      {currentView !== "trash" && (
                        <Button
                          size="sm"
                          className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                          onClick={() => handleOpenNewTask()}
                        >
                          <Plus className="size-3.5" />
                          New Task
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Filter Selectors */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                    {/* Priority Filter */}
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="h-7.5 w-32 text-xs bg-secondary/40 border-border">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="all" className="text-xs">
                          All Priorities
                        </SelectItem>
                        <SelectItem value="urgent" className="text-xs">
                          Urgent
                        </SelectItem>
                        <SelectItem value="high" className="text-xs">
                          High
                        </SelectItem>
                        <SelectItem value="medium" className="text-xs">
                          Medium
                        </SelectItem>
                        <SelectItem value="low" className="text-xs">
                          Low
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-7.5 w-32 text-xs bg-secondary/40 border-border">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="all" className="text-xs">
                          All Statuses
                        </SelectItem>
                        <SelectItem value="backlog" className="text-xs">
                          To Do
                        </SelectItem>
                        <SelectItem value="in_progress" className="text-xs">
                          In Progress
                        </SelectItem>
                        <SelectItem value="in_review" className="text-xs">
                          In Review
                        </SelectItem>
                        <SelectItem value="done" className="text-xs">
                          Done
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Project Filter */}
                    <Select value={projectFilter} onValueChange={setProjectFilter}>
                      <SelectTrigger className="h-7.5 w-32 text-xs bg-secondary/40 border-border">
                        <SelectValue placeholder="Project" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="all" className="text-xs">
                          All Projects
                        </SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.name} className="text-xs">
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Quick filter pills */}
                    <Button
                      variant={starredOnly ? "secondary" : "outline"}
                      size="sm"
                      className="h-7.5 text-xs gap-1 font-mono"
                      onClick={() => setStarredOnly(!starredOnly)}
                    >
                      <Star
                        className={`size-3 ${starredOnly ? "fill-warning text-warning" : ""}`}
                      />
                      Starred
                    </Button>

                    <Button
                      variant={dueTodayOnly ? "secondary" : "outline"}
                      size="sm"
                      className="h-7.5 text-xs gap-1 font-mono"
                      onClick={() => setDueTodayOnly(!dueTodayOnly)}
                    >
                      <Clock className="size-3" />
                      Due Today
                    </Button>

                    <Button
                      variant={overdueOnly ? "secondary" : "outline"}
                      size="sm"
                      className={`h-7.5 text-xs gap-1 font-mono ${
                        overdueOnly ? "text-destructive border-destructive" : ""
                      }`}
                      onClick={() => setOverdueOnly(!overdueOnly)}
                    >
                      Overdue
                    </Button>

                    {/* Clear Filters Button */}
                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7.5 text-xs text-muted-foreground hover:text-foreground gap-1"
                        onClick={handleResetFilters}
                      >
                        <X className="size-3" />
                        Clear Filters ({activeFilterCount})
                      </Button>
                    )}
                  </div>
                </div>

                {/* Main View Renderer */}
                {viewMode === "matrix" || currentView === "matrix" ? (
                  <MatrixView
                    tasks={tasks}
                    onSelectTask={(task) => {
                      setSelectedTask(task);
                      setTaskModalOpen(true);
                    }}
                    onToggleComplete={handleToggleComplete}
                    onToggleStar={handleToggleStar}
                    onOpenNewTaskWithPriority={(priority, starred) => {
                      setSelectedTask({ priority, starred: Boolean(starred) });
                      setTaskModalOpen(true);
                    }}
                    onUpdateTaskPriority={handleUpdateTaskPriority}
                  />
                ) : viewMode === "list" ? (
                  <ListView
                    tasks={filteredTasks}
                    view={currentView}
                    onOpenNewTask={() => handleOpenNewTask()}
                    onSelectTask={(task) => {
                      setSelectedTask(task);
                      setTaskModalOpen(true);
                    }}
                    onToggleComplete={handleToggleComplete}
                    onToggleStar={handleToggleStar}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                    onPermanentDelete={handlePermanentDelete}
                    onDuplicate={handleDuplicate}
                    onBulkComplete={handleBulkComplete}
                    onBulkDelete={handleBulkDelete}
                    onInlineUpdateTitle={handleInlineUpdateTitle}
                  />
                ) : viewMode === "kanban" ? (
                  <KanbanView
                    tasks={filteredTasks}
                    onOpenNewTask={(st) => handleOpenNewTask(st)}
                    onSelectTask={(task) => {
                      setSelectedTask(task);
                      setTaskModalOpen(true);
                    }}
                    onMoveTaskStatus={handleMoveTaskStatus}
                    onToggleComplete={handleToggleComplete}
                  />
                ) : viewMode === "calendar" ? (
                  <CalendarView
                    tasks={filteredTasks}
                    onOpenNewTaskWithDate={(dateIso) => handleOpenNewTask(undefined, dateIso)}
                    onSelectTask={(task) => {
                      setSelectedTask(task);
                      setTaskModalOpen(true);
                    }}
                    onOpenNewTask={() => handleOpenNewTask()}
                  />
                ) : (
                  <GridView
                    tasks={filteredTasks}
                    onOpenNewTask={() => handleOpenNewTask()}
                    onSelectTask={(task) => {
                      setSelectedTask(task);
                      setTaskModalOpen(true);
                    }}
                    onToggleComplete={handleToggleComplete}
                    onToggleStar={handleToggleStar}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 3. Global Command Palette (Ctrl/Cmd + K) */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        tasks={tasks}
        projects={projects}
        onNavigate={(view) => setCurrentView(view)}
        onOpenNewTask={() => handleOpenNewTask()}
        onSelectTask={(task) => {
          setSelectedTask(task);
          setTaskModalOpen(true);
        }}
        onFilterProject={(name) => {
          setProjectFilter(name);
          setCurrentView("tasks");
        }}
      />

      {/* 4. Contextual Task Details Modal / Drawer */}
      <TaskModal
        open={taskModalOpen}
        task={selectedTask}
        projects={projects}
        categories={categories}
        onClose={() => {
          setTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleSaveTask}
      />

      {/* 5. Pomodoro Focus Timer Widget */}
      <PomodoroTimer
        open={pomodoroOpen}
        onClose={() => setPomodoroOpen(false)}
        tasks={tasks}
        activeTask={selectedTask && "id" in selectedTask ? (selectedTask as Task) : null}
      />

      {/* 6. Power User Shortcuts Cheat Sheet Modal */}
      <ShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
