import type { Tables } from "@/integrations/supabase/types";

export type TaskRecord = Tables<"tasks">;
export type SubtaskRecord = Tables<"subtasks">;

export type Task = TaskRecord & { subtasks: SubtaskRecord[] };

export type WorkspaceView =
  | "dashboard"
  | "inbox"
  | "tasks"
  | "today"
  | "upcoming"
  | "calendar"
  | "important"
  | "completed"
  | "projects"
  | "categories"
  | "tags"
  | "trash"
  | "analytics"
  | "settings";

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTaskStats(tasks: TaskRecord[], now = new Date()) {
  const live = tasks.filter((task) => !task.deleted_at);
  const completed = live.filter((task) => task.completed).length;
  const overdue = live.filter(
    (task) => !task.completed && task.due_at !== null && new Date(task.due_at).getTime() < now.getTime(),
  ).length;

  return {
    total: live.length,
    completed,
    pending: live.length - completed,
    overdue,
    today: live.filter((task) => task.due_at !== null && localDateKey(new Date(task.due_at)) === localDateKey(now)),
  };
}

export function getVisibleTasks(
  tasks: Task[],
  options: { view: WorkspaceView; query?: string; focusOnly?: boolean; now?: Date },
): Task[] {
  const { view, query = "", focusOnly = false, now = new Date() } = options;
  const today = localDateKey(now);
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return tasks
    .filter((task) => {
      if (view === "trash") return task.deleted_at !== null;
      if (task.deleted_at !== null) return false;
      if (view === "completed" && !task.completed) return false;
      if (view !== "completed" && task.completed && !["dashboard", "tasks", "inbox", "calendar", "analytics", "projects", "categories", "tags"].includes(view)) return false;
      if (view === "important" && !task.starred) return false;
      if (view === "today" && (!task.due_at || localDateKey(new Date(task.due_at)) !== today)) return false;
      if (view === "upcoming" && (!task.due_at || new Date(task.due_at).getTime() < now.getTime())) return false;
      if (focusOnly && (task.completed || (task.priority !== "urgent" && task.priority !== "high" && !task.starred))) return false;

      if (view === "projects" && !task.project) return false;
      if (view === "categories" && !task.category) return false;
      if (view === "tags" && task.tags.length === 0) return false;

      if (normalizedQuery) {
        const searchable = [task.title, task.description, task.notes, task.project, task.category, ...task.tags]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase();
        if (!searchable.includes(normalizedQuery)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (view === "trash") return new Date(b.deleted_at ?? 0).getTime() - new Date(a.deleted_at ?? 0).getTime();
      const dueA = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      const dueB = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      return Number(b.starred) - Number(a.starred) || dueA - dueB || b.created_at.localeCompare(a.created_at);
    });
}

export function getCompletionPercent(stats: { total: number; completed: number }): number {
  return stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);
}

export function nextRecurringDue(dueAt: string | null, recurrence: string | null): string | null {
  if (!dueAt || !recurrence || recurrence === "none") return null;
  const next = new Date(dueAt);
  if (recurrence === "daily") next.setDate(next.getDate() + 1);
  if (recurrence === "weekly") next.setDate(next.getDate() + 7);
  if (recurrence === "monthly") next.setMonth(next.getMonth() + 1);
  return next.toISOString();
}