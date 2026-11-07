import type { Tables } from "@/integrations/supabase/types";

export type TaskRecord = Tables<"tasks">;
export type SubtaskRecord = Tables<"subtasks">;
export type ProfileRecord = Tables<"profiles">;

export type TaskPriority = "urgent" | "high" | "medium" | "low";
export type TaskStatus = "backlog" | "in_progress" | "in_review" | "done";

export type Subtask = {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  notes: string;
  completed: boolean;
  completed_at: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  start_at: string | null;
  category: string | null;
  project: string | null;
  tags: string[];
  starred: boolean;
  recurrence: string | null;
  reminder_at: string | null;
  deleted_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  subtasks: Subtask[];
};

export type WorkspaceView =
  | "dashboard"
  | "inbox"
  | "tasks"
  | "today"
  | "upcoming"
  | "calendar"
  | "matrix"
  | "important"
  | "completed"
  | "projects"
  | "categories"
  | "tags"
  | "trash"
  | "analytics"
  | "settings";

export type ViewMode = "list" | "kanban" | "calendar" | "grid" | "matrix";

export type CalendarViewType = "month" | "week" | "day";

export type ProjectMeta = {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  createdAt: string;
};

export type CategoryMeta = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type UserPreferences = {
  theme: "dark" | "light" | "system";
  accentColor: "purple" | "emerald" | "cyan" | "amber" | "rose";
  density: "comfortable" | "compact";
  dateFormat: "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";
  timeFormat: "12h" | "24h";
  weekStart: "monday" | "sunday";
  defaultPriority: TaskPriority;
  defaultView: ViewMode;
  inAppReminders: boolean;
  soundAlerts: boolean;
  browserNotifications: boolean;
};

export type TaskFilterState = {
  query: string;
  priority: string;
  status: string;
  project: string;
  category: string;
  tag: string;
  starredOnly: boolean;
  dueTodayOnly: boolean;
  overdueOnly: boolean;
  sortBy: "due_at" | "priority" | "created_at" | "title" | "updated_at";
  sortOrder: "asc" | "desc";
};
