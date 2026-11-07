import { describe, expect, it } from "vitest";
import { getCompletionPercent, getTaskStats, getVisibleTasks, nextRecurringDue, type Task } from "@/lib/taskforge-logic";

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    user_id: "user-1",
    title: "Write a task",
    description: "",
    notes: "",
    completed: false,
    completed_at: null,
    status: "backlog",
    priority: "medium",
    due_at: null,
    start_at: null,
    category: null,
    project: null,
    tags: [],
    starred: false,
    recurrence: null,
    reminder_at: null,
    deleted_at: null,
    sort_order: 0,
    created_at: "2026-11-07T08:00:00.000Z",
    updated_at: "2026-11-07T08:00:00.000Z",
    subtasks: [],
    ...overrides,
  };
}

describe("TASKFORGE task rules", () => {
  it("counts only unfinished tasks with a due time before now as overdue", () => {
    const now = new Date("2026-11-07T12:00:00.000Z");
    const tasks = [
      task({ id: "late", due_at: "2026-11-07T11:00:00.000Z" }),
      task({ id: "done", completed: true, due_at: "2026-11-07T10:00:00.000Z" }),
      task({ id: "later", due_at: "2026-11-07T13:00:00.000Z" }),
      task({ id: "trashed", deleted_at: "2026-11-07T09:00:00.000Z", due_at: "2026-11-07T08:00:00.000Z" }),
    ];

    expect(getTaskStats(tasks, now)).toMatchObject({ total: 3, completed: 1, pending: 2, overdue: 1 });
  });

  it("keeps deleted tasks out of normal lists and includes them in Trash", () => {
    const tasks = [task({ id: "live" }), task({ id: "trash", deleted_at: "2026-11-07T09:00:00.000Z" })];

    expect(getVisibleTasks(tasks, { view: "tasks" }).map(({ id }) => id)).toEqual(["live"]);
    expect(getVisibleTasks(tasks, { view: "trash" }).map(({ id }) => id)).toEqual(["trash"]);
  });

  it("filters the Important view to starred tasks only", () => {
    const tasks = [task({ id: "starred", starred: true }), task({ id: "ordinary", starred: false })];

    expect(getVisibleTasks(tasks, { view: "important" }).map(({ id }) => id)).toEqual(["starred"]);
  });

  it("calculates completion percentage from the actual task count", () => {
    expect(getCompletionPercent({ total: 8, completed: 5 })).toBe(63);
    expect(getCompletionPercent({ total: 0, completed: 0 })).toBe(0);
  });

  it("moves a recurring task forward by its interval and clamps short months", () => {
    expect(nextRecurringDue("2026-11-07T08:00:00.000Z", "daily")).toBe("2026-11-08T08:00:00.000Z");
    expect(nextRecurringDue("2026-11-07T08:00:00.000Z", "weekly")).toBe("2026-11-14T08:00:00.000Z");
    expect(nextRecurringDue("2026-01-31T08:00:00.000Z", "monthly")).toBe("2026-02-28T08:00:00.000Z");
  });
});