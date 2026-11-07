import { useEffect, useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import type { Task } from "@/lib/taskforge-logic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type DraftTask = {
  title: string;
  description: string;
  notes: string;
  priority: string;
  dueAt: string;
  startAt: string;
  category: string;
  project: string;
  tags: string;
  starred: boolean;
  recurrence: string;
  reminderAt: string;
  subtasks: { id?: string; title: string; completed: boolean }[];
};

type TaskEditorProps = {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (draft: DraftTask) => Promise<void>;
};

function dateTimeLocalValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function TaskEditor({ open, task, onClose, onSave }: TaskEditorProps) {
  const [draft, setDraft] = useState<DraftTask>(emptyDraft());
  const [newSubtask, setNewSubtask] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(
      task
        ? {
            title: task.title,
            description: task.description,
            notes: task.notes,
            priority: task.priority,
            dueAt: dateTimeLocalValue(task.due_at),
            startAt: dateTimeLocalValue(task.start_at),
            category: task.category ?? "",
            project: task.project ?? "",
            tags: task.tags.join(", "),
            starred: task.starred,
            recurrence: task.recurrence ?? "none",
            reminderAt: dateTimeLocalValue(task.reminder_at),
            subtasks: task.subtasks.map((subtask) => ({
              id: subtask.id,
              title: subtask.title,
              completed: subtask.completed,
            })),
          }
        : emptyDraft(),
    );
    setNewSubtask("");
  }, [task, open]);

  const patch = <K extends keyof DraftTask>(key: K, value: DraftTask[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...draft, title: draft.title.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-border bg-card p-0 sm:max-w-xl"
      >
        <form onSubmit={submit} className="flex min-h-full flex-col">
          <SheetHeader className="border-b border-border px-6 py-5 pr-14">
            <p className="font-mono text-[11px] uppercase text-primary">TASKFORGE / task</p>
            <SheetTitle>{task ? "Edit task" : "Create a task"}</SheetTitle>
            <SheetDescription>Keep the next step clear and manageable.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task title</Label>
              <Input
                id="task-title"
                autoFocus
                placeholder="What needs to get done?"
                value={draft.title}
                onChange={(event) => patch("title", event.target.value)}
                required
                maxLength={180}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                placeholder="Add a little context…"
                value={draft.description}
                onChange={(event) => patch("description", event.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={draft.priority} onValueChange={(value) => patch("priority", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Repeat</Label>
                <Select
                  value={draft.recurrence}
                  onValueChange={(value) => patch("recurrence", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Does not repeat</SelectItem>
                    <SelectItem value="daily">Every day</SelectItem>
                    <SelectItem value="weekly">Every week</SelectItem>
                    <SelectItem value="monthly">Every month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-due">Due date & time</Label>
                <Input
                  id="task-due"
                  type="datetime-local"
                  value={draft.dueAt}
                  onChange={(event) => patch("dueAt", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-start">Start date & time</Label>
                <Input
                  id="task-start"
                  type="datetime-local"
                  value={draft.startAt}
                  onChange={(event) => patch("startAt", event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-reminder">Reminder</Label>
              <Input
                id="task-reminder"
                type="datetime-local"
                value={draft.reminderAt}
                onChange={(event) => patch("reminderAt", event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Saved to this task. Notifications require browser permission.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-project">Project</Label>
                <Input
                  id="task-project"
                  placeholder="e.g. Website refresh"
                  value={draft.project}
                  onChange={(event) => patch("project", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-category">Category</Label>
                <Input
                  id="task-category"
                  placeholder="e.g. Work"
                  value={draft.category}
                  onChange={(event) => patch("category", event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-tags">Tags</Label>
              <Input
                id="task-tags"
                placeholder="focus, planning, home"
                value={draft.tags}
                onChange={(event) => patch("tags", event.target.value)}
              />
              <p className="text-xs text-muted-foreground">Separate tags with commas.</p>
            </div>

            <section className="border-t border-border pt-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Subtasks</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {draft.subtasks.filter((item) => item.completed).length} of{" "}
                    {draft.subtasks.length} complete
                  </p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {draft.subtasks.length
                    ? Math.round(
                        (draft.subtasks.filter((item) => item.completed).length /
                          draft.subtasks.length) *
                          100,
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="space-y-2">
                {draft.subtasks.map((item, index) => (
                  <div key={item.id ?? `new-${index}`} className="flex items-center gap-3">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={(checked) =>
                        patch(
                          "subtasks",
                          draft.subtasks.map((subtask, row) =>
                            row === index ? { ...subtask, completed: checked === true } : subtask,
                          ),
                        )
                      }
                      aria-label={`Mark ${item.title} complete`}
                    />
                    <span
                      className={`min-w-0 flex-1 text-sm ${item.completed ? "text-muted-foreground line-through" : ""}`}
                    >
                      {item.title}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      aria-label={`Remove ${item.title}`}
                      onClick={() =>
                        patch(
                          "subtasks",
                          draft.subtasks.filter((_, row) => row !== index),
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  aria-label="New subtask"
                  placeholder="Add a subtask"
                  value={newSubtask}
                  onChange={(event) => setNewSubtask(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addSubtask();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Add subtask"
                  onClick={addSubtask}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </section>

            <div className="space-y-2">
              <Label htmlFor="task-notes">Notes</Label>
              <Textarea
                id="task-notes"
                placeholder="Add notes or a checklist…"
                value={draft.notes}
                onChange={(event) => patch("notes", event.target.value)}
                rows={3}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 border-t border-border pt-5 text-sm">
              <Checkbox
                checked={draft.starred}
                onCheckedChange={(checked) => patch("starred", checked === true)}
              />
              <span>Mark as important</span>
              <CalendarClock className="ml-auto size-4 text-muted-foreground" />
            </label>
          </div>

          <SheetFooter className="sticky bottom-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : task ? "Save changes" : "Create task"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );

  function addSubtask() {
    const title = newSubtask.trim();
    if (!title) return;
    patch("subtasks", [...draft.subtasks, { title, completed: false }]);
    setNewSubtask("");
  }
}

function emptyDraft(): DraftTask {
  return {
    title: "",
    description: "",
    notes: "",
    priority: "medium",
    dueAt: "",
    startAt: "",
    category: "",
    project: "",
    tags: "",
    starred: false,
    recurrence: "none",
    reminderAt: "",
    subtasks: [],
  };
}
