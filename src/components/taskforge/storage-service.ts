import { supabase } from "@/integrations/supabase/client";
import type {
  Task,
  Subtask,
  ProjectMeta,
  CategoryMeta,
  UserPreferences,
  TaskPriority,
  TaskStatus,
} from "./types";
import { localDateKey, nextRecurringDue } from "@/lib/taskforge-logic";

const LOCAL_TASKS_KEY = "taskforge_tasks_store_v1";
const LOCAL_PROJECTS_KEY = "taskforge_projects_store_v1";
const LOCAL_CATEGORIES_KEY = "taskforge_categories_store_v1";
const LOCAL_PREFS_KEY = "taskforge_user_prefs_v1";

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "dark",
  accentColor: "purple",
  density: "comfortable",
  dateFormat: "YYYY-MM-DD",
  timeFormat: "12h",
  weekStart: "monday",
  defaultPriority: "medium",
  defaultView: "list",
  inAppReminders: true,
  soundAlerts: false,
  browserNotifications: false,
};

export const DEFAULT_CATEGORIES: CategoryMeta[] = [
  { id: "work", name: "Work", icon: "Briefcase", color: "#8B5CF6" },
  { id: "personal", name: "Personal", icon: "User", color: "#38BDF8" },
  { id: "study", name: "Study", icon: "BookOpen", color: "#FBBF24" },
  { id: "health", name: "Health", icon: "Heart", color: "#4ADE80" },
  { id: "shopping", name: "Shopping", icon: "ShoppingCart", color: "#F43F5E" },
];

export const DEFAULT_PROJECTS: ProjectMeta[] = [
  {
    id: "proj-1",
    name: "TASKFORGE V1 Launch",
    description: "Launch Obsidian-inspired productivity management system",
    color: "#A78BFA",
    icon: "Rocket",
    createdAt: new Date().toISOString(),
  },
  {
    id: "proj-2",
    name: "System Architecture",
    description: "Optimize database schemas, RLS policies and caching layers",
    color: "#38BDF8",
    icon: "Layers",
    createdAt: new Date().toISOString(),
  },
  {
    id: "proj-3",
    name: "Personal Knowledge Base",
    description: "Daily reading, research notes and productivity synthesis",
    color: "#4ADE80",
    icon: "BookMarked",
    createdAt: new Date().toISOString(),
  },
];

export function getInitialSeedTasks(userId: string): Task[] {
  const now = new Date();
  const todayIso = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    17,
    0,
    0,
  ).toISOString();
  const tomorrowIso = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    14,
    30,
    0,
  ).toISOString();
  const inThreeDaysIso = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 3,
    11,
    0,
    0,
  ).toISOString();
  const yesterdayIso = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    10,
    0,
    0,
  ).toISOString();

  return [
    {
      id: "task-seed-1",
      user_id: userId,
      title: "Review TASKFORGE architecture and security policies",
      description: "Ensure Row Level Security is enforced and offline caching works smoothly.",
      notes: "Verify Supabase policies allow owner-only read/write access.",
      completed: false,
      completed_at: null,
      status: "in_progress",
      priority: "urgent",
      due_at: todayIso,
      start_at: new Date().toISOString(),
      category: "Work",
      project: "TASKFORGE V1 Launch",
      tags: ["security", "database", "priority"],
      starred: true,
      recurrence: "none",
      reminder_at: todayIso,
      deleted_at: null,
      sort_order: 1,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date().toISOString(),
      subtasks: [
        {
          id: "sub-1",
          task_id: "task-seed-1",
          user_id: userId,
          title: "Check RLS policies",
          completed: true,
          sort_order: 0,
        },
        {
          id: "sub-2",
          task_id: "task-seed-1",
          user_id: userId,
          title: "Verify JSON & CSV export",
          completed: false,
          sort_order: 1,
        },
        {
          id: "sub-3",
          task_id: "task-seed-1",
          user_id: userId,
          title: "Test Kanban drag-and-drop",
          completed: false,
          sort_order: 2,
        },
      ],
    },
    {
      id: "task-seed-2",
      user_id: userId,
      title: "Complete Obsidian dark aesthetic UI review",
      description: "Fine-tune contrast, font sizes, borders, and smooth transitions.",
      notes: "Focus on #111111 background and #A78BFA accent colors.",
      completed: true,
      completed_at: yesterdayIso,
      status: "done",
      priority: "high",
      due_at: yesterdayIso,
      start_at: yesterdayIso,
      category: "Work",
      project: "TASKFORGE V1 Launch",
      tags: ["ui", "design", "obsidian"],
      starred: true,
      recurrence: "none",
      reminder_at: null,
      deleted_at: null,
      sort_order: 2,
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      updated_at: yesterdayIso,
      subtasks: [
        {
          id: "sub-4",
          task_id: "task-seed-2",
          user_id: userId,
          title: "Palette alignment (#111111, #151515, #1E1E1E)",
          completed: true,
          sort_order: 0,
        },
        {
          id: "sub-5",
          task_id: "task-seed-2",
          user_id: userId,
          title: "Lucide icon consistency",
          completed: true,
          sort_order: 1,
        },
      ],
    },
    {
      id: "task-seed-3",
      user_id: userId,
      title: "Plan weekly productivity sprint & goal tracking",
      description: "Review analytics, completed tasks, and upcoming milestones.",
      notes: "Check weekly completion rates and workload distribution.",
      completed: false,
      completed_at: null,
      status: "backlog",
      priority: "medium",
      due_at: tomorrowIso,
      start_at: null,
      category: "Personal",
      project: "Personal Knowledge Base",
      tags: ["planning", "goals"],
      starred: false,
      recurrence: "weekly",
      reminder_at: tomorrowIso,
      deleted_at: null,
      sort_order: 3,
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      updated_at: new Date().toISOString(),
      subtasks: [
        {
          id: "sub-6",
          task_id: "task-seed-3",
          user_id: userId,
          title: "Draft next week objectives",
          completed: false,
          sort_order: 0,
        },
        {
          id: "sub-7",
          task_id: "task-seed-3",
          user_id: userId,
          title: "Update priority queue",
          completed: false,
          sort_order: 1,
        },
      ],
    },
    {
      id: "task-seed-4",
      user_id: userId,
      title: "30-minute cardio & strength routine",
      description: "Daily exercise session to keep energy and focus high.",
      notes: "Drink plenty of water before and after.",
      completed: false,
      completed_at: null,
      status: "backlog",
      priority: "low",
      due_at: todayIso,
      start_at: null,
      category: "Health",
      project: null,
      tags: ["health", "fitness", "daily"],
      starred: false,
      recurrence: "daily",
      reminder_at: null,
      deleted_at: null,
      sort_order: 4,
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      updated_at: new Date().toISOString(),
      subtasks: [],
    },
    {
      id: "task-seed-5",
      user_id: userId,
      title: "Prepare technical architecture documentation",
      description: "Document component hierarchy, state flow, and database models.",
      notes: "Include diagrams for subagent integration and cloud storage.",
      completed: false,
      completed_at: null,
      status: "in_review",
      priority: "high",
      due_at: inThreeDaysIso,
      start_at: null,
      category: "Study",
      project: "System Architecture",
      tags: ["documentation", "architecture"],
      starred: true,
      recurrence: "none",
      reminder_at: inThreeDaysIso,
      deleted_at: null,
      sort_order: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subtasks: [
        {
          id: "sub-8",
          task_id: "task-seed-5",
          user_id: userId,
          title: "ER diagram review",
          completed: true,
          sort_order: 0,
        },
        {
          id: "sub-9",
          task_id: "task-seed-5",
          user_id: userId,
          title: "Component interaction chart",
          completed: false,
          sort_order: 1,
        },
      ],
    },
  ];
}

// Helper to check if Supabase is active
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("tasks").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

// Local Storage helpers
export function getLocalTasks(userId: string): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_TASKS_KEY}_${userId}`);
    if (!raw) {
      const seeded = getInitialSeedTasks(userId);
      localStorage.setItem(`${LOCAL_TASKS_KEY}_${userId}`, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load local tasks:", err);
    return [];
  }
}

export function saveLocalTasks(userId: string, tasks: Task[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${LOCAL_TASKS_KEY}_${userId}`, JSON.stringify(tasks));
  } catch (err) {
    console.error("Failed to persist local tasks:", err);
  }
}

export function getLocalProjects(userId: string): ProjectMeta[] {
  if (typeof window === "undefined") return DEFAULT_PROJECTS;
  try {
    const raw = localStorage.getItem(`${LOCAL_PROJECTS_KEY}_${userId}`);
    if (!raw) {
      localStorage.setItem(`${LOCAL_PROJECTS_KEY}_${userId}`, JSON.stringify(DEFAULT_PROJECTS));
      return DEFAULT_PROJECTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROJECTS;
  }
}

export function saveLocalProjects(userId: string, projects: ProjectMeta[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${LOCAL_PROJECTS_KEY}_${userId}`, JSON.stringify(projects));
  } catch (err) {
    console.error("Failed to persist local projects:", err);
  }
}

export function getLocalCategories(userId: string): CategoryMeta[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(`${LOCAL_CATEGORIES_KEY}_${userId}`);
    if (!raw) {
      localStorage.setItem(`${LOCAL_CATEGORIES_KEY}_${userId}`, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveLocalCategories(userId: string, categories: CategoryMeta[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${LOCAL_CATEGORIES_KEY}_${userId}`, JSON.stringify(categories));
  } catch (err) {
    console.error("Failed to persist local categories:", err);
  }
}

export function getLocalPreferences(userId: string): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(`${LOCAL_PREFS_KEY}_${userId}`);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveLocalPreferences(userId: string, prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${LOCAL_PREFS_KEY}_${userId}`, JSON.stringify(prefs));
  } catch (err) {
    console.error("Failed to persist preferences:", err);
  }
}

// Unified Task Storage Engine
export class TaskforgeStorage {
  static async loadAllTasks(userId: string): Promise<Task[]> {
    try {
      const [taskRes, subtaskRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("subtasks")
          .select("*")
          .eq("user_id", userId)
          .order("sort_order", { ascending: true }),
      ]);

      if (taskRes.error || !taskRes.data) {
        // Fallback to local storage if offline or error
        return getLocalTasks(userId);
      }

      // If online data exists, map it
      const subtasksByTask = new Map<string, Subtask[]>();
      (subtaskRes.data ?? []).forEach((sub) => {
        const list = subtasksByTask.get(sub.task_id) ?? [];
        list.push({
          id: sub.id,
          task_id: sub.task_id,
          user_id: sub.user_id,
          title: sub.title,
          completed: sub.completed,
          sort_order: sub.sort_order,
          created_at: sub.created_at,
          updated_at: sub.updated_at,
        });
        subtasksByTask.set(sub.task_id, list);
      });

      const loadedTasks: Task[] = taskRes.data.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        description: row.description ?? "",
        notes: row.notes ?? "",
        completed: row.completed,
        completed_at: row.completed_at,
        status: (row.status as TaskStatus) || (row.completed ? "done" : "backlog"),
        priority: (row.priority as TaskPriority) || "medium",
        due_at: row.due_at,
        start_at: row.start_at,
        category: row.category,
        project: row.project,
        tags: Array.isArray(row.tags) ? row.tags : [],
        starred: row.starred,
        recurrence: row.recurrence,
        reminder_at: row.reminder_at,
        deleted_at: row.deleted_at,
        sort_order: row.sort_order,
        created_at: row.created_at,
        updated_at: row.updated_at,
        subtasks: subtasksByTask.get(row.id) ?? [],
      }));

      // Cache locally as backup
      saveLocalTasks(userId, loadedTasks);
      return loadedTasks;
    } catch {
      return getLocalTasks(userId);
    }
  }

  static async upsertTask(
    taskData: Partial<Task> & { title: string },
    userId: string,
  ): Promise<Task> {
    const isNew = !taskData.id;
    const taskId = taskData.id || crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const taskRow = {
      id: taskId,
      user_id: userId,
      title: taskData.title.trim(),
      description: taskData.description || "",
      notes: taskData.notes || "",
      priority: taskData.priority || "medium",
      status: taskData.status || (taskData.completed ? "done" : "backlog"),
      completed: Boolean(taskData.completed),
      completed_at: taskData.completed ? taskData.completed_at || nowIso : null,
      due_at: taskData.due_at || null,
      start_at: taskData.start_at || null,
      reminder_at: taskData.reminder_at || null,
      category: taskData.category || null,
      project: taskData.project || null,
      tags: taskData.tags || [],
      starred: Boolean(taskData.starred),
      recurrence: taskData.recurrence || null,
      deleted_at: taskData.deleted_at || null,
      sort_order: taskData.sort_order ?? 0,
      updated_at: nowIso,
    };

    // Try Supabase first
    let onlineSuccess = false;
    try {
      if (isNew) {
        const { error } = await supabase.from("tasks").insert({
          ...taskRow,
          created_at: nowIso,
        });
        if (!error) onlineSuccess = true;
      } else {
        const { error } = await supabase.from("tasks").update(taskRow).eq("id", taskId);
        if (!error) onlineSuccess = true;
      }

      if (onlineSuccess && taskData.subtasks) {
        // Sync subtasks in Supabase
        await supabase.from("subtasks").delete().eq("task_id", taskId);
        if (taskData.subtasks.length > 0) {
          const subRows = taskData.subtasks.map((sub, index) => ({
            id: sub.id || crypto.randomUUID(),
            task_id: taskId,
            user_id: userId,
            title: sub.title,
            completed: Boolean(sub.completed),
            sort_order: index,
          }));
          await supabase.from("subtasks").insert(subRows);
        }
      }
    } catch {
      onlineSuccess = false;
    }

    // Always update local cache
    const currentTasks = getLocalTasks(userId);
    const updatedSubtasks: Subtask[] = (taskData.subtasks || []).map((sub, idx) => ({
      id: sub.id || crypto.randomUUID(),
      task_id: taskId,
      user_id: userId,
      title: sub.title,
      completed: Boolean(sub.completed),
      sort_order: idx,
    }));

    const completeTask: Task = {
      ...taskRow,
      created_at: taskData.created_at || nowIso,
      subtasks: updatedSubtasks,
    };

    const nextTasks = isNew
      ? [completeTask, ...currentTasks]
      : currentTasks.map((t) => (t.id === taskId ? completeTask : t));

    saveLocalTasks(userId, nextTasks);
    return completeTask;
  }

  static async toggleComplete(
    task: Task,
    userId: string,
  ): Promise<{ task: Task; nextRecurring?: Task }> {
    const nextCompleted = !task.completed;
    const nowIso = new Date().toISOString();
    const updatedTask: Task = {
      ...task,
      completed: nextCompleted,
      completed_at: nextCompleted ? nowIso : null,
      status: nextCompleted ? "done" : "backlog",
      updated_at: nowIso,
    };

    await this.upsertTask(updatedTask, userId);

    let nextRecurring: Task | undefined;
    if (nextCompleted && task.recurrence && task.recurrence !== "none") {
      const nextDue = nextRecurringDue(task.due_at, task.recurrence);
      if (nextDue) {
        const recurringTask: Partial<Task> & { title: string } = {
          title: task.title,
          description: task.description,
          notes: task.notes,
          priority: task.priority,
          status: "backlog",
          completed: false,
          due_at: nextDue,
          category: task.category,
          project: task.project,
          tags: [...task.tags],
          starred: task.starred,
          recurrence: task.recurrence,
          subtasks: task.subtasks.map((sub, idx) => ({
            id: crypto.randomUUID(),
            task_id: "",
            user_id: userId,
            title: sub.title,
            completed: false,
            sort_order: idx,
          })),
        };
        nextRecurring = await this.upsertTask(recurringTask, userId);
      }
    }

    return nextRecurring ? { task: updatedTask, nextRecurring } : { task: updatedTask };
  }

  static async moveToTrash(taskId: string, userId: string): Promise<void> {
    const nowIso = new Date().toISOString();
    try {
      await supabase.from("tasks").update({ deleted_at: nowIso }).eq("id", taskId);
    } catch (err) {
      console.warn("Supabase update failed, falling back to local:", err);
    }

    const tasks = getLocalTasks(userId);
    saveLocalTasks(
      userId,
      tasks.map((t) => (t.id === taskId ? { ...t, deleted_at: nowIso } : t)),
    );
  }

  static async restoreFromTrash(taskId: string, userId: string): Promise<void> {
    try {
      await supabase.from("tasks").update({ deleted_at: null }).eq("id", taskId);
    } catch (err) {
      console.warn("Supabase update failed, falling back to local:", err);
    }

    const tasks = getLocalTasks(userId);
    saveLocalTasks(
      userId,
      tasks.map((t) => (t.id === taskId ? { ...t, deleted_at: null } : t)),
    );
  }

  static async permanentlyDelete(taskId: string, userId: string): Promise<void> {
    try {
      await supabase.from("tasks").delete().eq("id", taskId);
    } catch (err) {
      console.warn("Supabase delete failed, falling back to local:", err);
    }

    const tasks = getLocalTasks(userId);
    saveLocalTasks(
      userId,
      tasks.filter((t) => t.id !== taskId),
    );
  }

  static async duplicateTask(task: Task, userId: string): Promise<Task> {
    const copy: Partial<Task> & { title: string } = {
      title: `${task.title} (copy)`,
      description: task.description,
      notes: task.notes,
      priority: task.priority,
      status: task.status,
      completed: false,
      completed_at: null,
      due_at: task.due_at,
      start_at: task.start_at,
      category: task.category,
      project: task.project,
      tags: [...task.tags],
      starred: task.starred,
      recurrence: task.recurrence,
      subtasks: task.subtasks.map((sub, idx) => ({
        id: crypto.randomUUID(),
        task_id: "",
        user_id: userId,
        title: sub.title,
        completed: false,
        sort_order: idx,
      })),
    };
    return this.upsertTask(copy, userId);
  }

  // Export / Import
  static exportData(
    tasks: Task[],
    projects: ProjectMeta[],
    categories: CategoryMeta[],
    format: "json" | "csv",
  ): string {
    if (format === "json") {
      const payload = {
        app: "TASKFORGE",
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        tasks,
        projects,
        categories,
      };
      return JSON.stringify(payload, null, 2);
    }

    // CSV format
    const headers = [
      "ID",
      "Title",
      "Description",
      "Status",
      "Priority",
      "Completed",
      "Due Date",
      "Category",
      "Project",
      "Tags",
      "Starred",
      "Created At",
    ];

    const rows = tasks.map((t) => [
      t.id,
      `"${(t.title || "").replace(/"/g, '""')}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.completed ? "Yes" : "No",
      t.due_at || "",
      `"${(t.category || "").replace(/"/g, '""')}"`,
      `"${(t.project || "").replace(/"/g, '""')}"`,
      `"${t.tags.join("; ")}"`,
      t.starred ? "Yes" : "No",
      t.created_at,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }

  static async importData(jsonString: string, userId: string): Promise<{ importedCount: number }> {
    try {
      const data = JSON.parse(jsonString);
      if (!data.tasks || !Array.isArray(data.tasks)) {
        throw new Error("Invalid TASKFORGE JSON structure");
      }

      const existingTasks = getLocalTasks(userId);
      const importedTasks: Task[] = data.tasks.map((item: Partial<Task>) => ({
        id: item.id || crypto.randomUUID(),
        user_id: userId,
        title: item.title || "Untitled Task",
        description: item.description || "",
        notes: item.notes || "",
        completed: Boolean(item.completed),
        completed_at: item.completed_at || null,
        status: (item.status as TaskStatus) || (item.completed ? "done" : "backlog"),
        priority: (item.priority as TaskPriority) || "medium",
        due_at: item.due_at || null,
        start_at: item.start_at || null,
        category: item.category || null,
        project: item.project || null,
        tags: Array.isArray(item.tags) ? item.tags : [],
        starred: Boolean(item.starred),
        recurrence: item.recurrence || null,
        reminder_at: item.reminder_at || null,
        deleted_at: item.deleted_at || null,
        sort_order: item.sort_order ?? 0,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subtasks: Array.isArray(item.subtasks)
          ? item.subtasks.map((s, idx) => ({
              id: s.id || crypto.randomUUID(),
              task_id: item.id || "",
              user_id: userId,
              title: s.title || "Subtask",
              completed: Boolean(s.completed),
              sort_order: idx,
            }))
          : [],
      }));

      // Combine preventing duplicate IDs
      const taskMap = new Map<string, Task>();
      existingTasks.forEach((t) => taskMap.set(t.id, t));
      importedTasks.forEach((t) => taskMap.set(t.id, t));

      const merged = Array.from(taskMap.values());
      saveLocalTasks(userId, merged);

      // Import projects and categories if provided
      if (Array.isArray(data.projects)) {
        const curProjects = getLocalProjects(userId);
        const projMap = new Map<string, ProjectMeta>();
        curProjects.forEach((p) => projMap.set(p.id, p));
        data.projects.forEach((p: ProjectMeta) => projMap.set(p.id, p));
        saveLocalProjects(userId, Array.from(projMap.values()));
      }

      if (Array.isArray(data.categories)) {
        const curCats = getLocalCategories(userId);
        const catMap = new Map<string, CategoryMeta>();
        curCats.forEach((c) => catMap.set(c.id, c));
        data.categories.forEach((c: CategoryMeta) => catMap.set(c.id, c));
        saveLocalCategories(userId, Array.from(catMap.values()));
      }

      return { importedCount: importedTasks.length };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error("Import failed: " + msg);
    }
  }

  static async clearAllData(userId: string): Promise<void> {
    try {
      await supabase.from("subtasks").delete().eq("user_id", userId);
      await supabase.from("tasks").delete().eq("user_id", userId);
    } catch (err) {
      console.warn("Supabase clear failed, proceeding with local clear:", err);
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem(`${LOCAL_TASKS_KEY}_${userId}`);
      localStorage.removeItem(`${LOCAL_PROJECTS_KEY}_${userId}`);
      localStorage.removeItem(`${LOCAL_CATEGORIES_KEY}_${userId}`);
    }
  }
}
