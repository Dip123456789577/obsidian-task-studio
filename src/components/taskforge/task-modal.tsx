import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import {
  Bell,
  Calendar,
  Check,
  Clock,
  Eye,
  FileText,
  FolderKanban,
  ListTodo,
  Plus,
  Repeat,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import type { CategoryMeta, ProjectMeta, Subtask, Task, TaskPriority, TaskStatus } from "./types";
import { toast } from "sonner";

type TaskModalProps = {
  open: boolean;
  task: Task | Partial<Task> | null;
  projects: ProjectMeta[];
  categories: CategoryMeta[];
  onClose: () => void;
  onSave: (taskData: Partial<Task> & { title: string }) => Promise<void>;
};

function formatIsoForInput(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export function TaskModal({ open, task, projects, categories, onClose, onSave }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("backlog");
  const [starred, setStarred] = useState(false);
  const [dueAt, setDueAt] = useState("");
  const [startAt, setStartAt] = useState("");
  const [reminderAt, setReminderAt] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [project, setProject] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [subtasks, setSubtasks] = useState<{ id?: string; title: string; completed: boolean }[]>(
    [],
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [notesTab, setNotesTab] = useState<"write" | "preview">("write");

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setNotes(task.notes || "");
      setPriority(task.priority || "medium");
      setStatus(task.status || (task.completed ? "done" : "backlog"));
      setStarred(Boolean(task.starred));
      setDueAt(formatIsoForInput(task.due_at));
      setStartAt(formatIsoForInput(task.start_at));
      setReminderAt(formatIsoForInput(task.reminder_at));
      setRecurrence(task.recurrence || "none");
      setProject(task.project || "");
      setCategory(task.category || "");
      setTags(task.tags ? [...task.tags] : []);
      setSubtasks(
        task.subtasks
          ? task.subtasks.map((s) => ({
              id: s.id,
              title: s.title,
              completed: s.completed,
            }))
          : [],
      );
    } else {
      setTitle("");
      setDescription("");
      setNotes("");
      setPriority("medium");
      setStatus("backlog");
      setStarred(false);
      setDueAt("");
      setStartAt("");
      setReminderAt("");
      setRecurrence("none");
      setProject("");
      setCategory("");
      setTags([]);
      setSubtasks([]);
    }
    setTagInput("");
    setNewSubtaskTitle("");
  }, [task, open]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, "");
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddSubtask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([...subtasks, { title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle("");
  };

  const toggleSubtask = (index: number) => {
    setSubtasks(subtasks.map((s, idx) => (idx === index ? { ...s, completed: !s.completed } : s)));
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, idx) => idx !== index));
  };

  const handleAutoGenerateMilestones = () => {
    const query = `${title} ${description}`.toLowerCase();
    let suggested: string[] = [];

    if (
      query.includes("bug") ||
      query.includes("fix") ||
      query.includes("error") ||
      query.includes("issue")
    ) {
      suggested = [
        "Reproduce issue & isolate test case",
        "Analyze root cause & formulate fix",
        "Implement code patch & verify edge cases",
        "Run regression suite & merge",
      ];
    } else if (
      query.includes("feature") ||
      query.includes("build") ||
      query.includes("develop") ||
      query.includes("api") ||
      query.includes("backend") ||
      query.includes("frontend")
    ) {
      suggested = [
        "Scope architecture & requirements",
        "Implement core logic & data model",
        "Integrate with UI components & handlers",
        "Execute end-to-end verification",
      ];
    } else if (
      query.includes("design") ||
      query.includes("ui") ||
      query.includes("ux") ||
      query.includes("style")
    ) {
      suggested = [
        "Audit existing layouts & gather inspiration",
        "Create high-fidelity wireframes in dark aesthetic",
        "Review typography, contrast & touch targets",
        "Refine responsive breakpoints (mobile/tablet/desktop)",
      ];
    } else if (
      query.includes("study") ||
      query.includes("learn") ||
      query.includes("research") ||
      query.includes("read")
    ) {
      suggested = [
        "Gather reference documentation & articles",
        "Read & take Obsidian conceptual notes",
        "Build a proof-of-concept prototype",
        "Synthesize key takeaways & summary",
      ];
    } else {
      suggested = [
        "Phase 1: Scope requirements & setup",
        "Phase 2: Core execution & implementation",
        "Phase 3: Final review & quality verification",
      ];
    }

    const existing = new Set(subtasks.map((s) => s.title.toLowerCase()));
    const newItems = suggested
      .filter((st) => !existing.has(st.toLowerCase()))
      .map((st) => ({
        id: crypto.randomUUID(),
        title: st,
        completed: false,
      }));

    if (newItems.length > 0) {
      setSubtasks([...subtasks, ...newItems]);
      toast.success(`Generated ${newItems.length} milestone subtasks.`);
    } else {
      toast.info("Milestones are already added.");
    }
  };

  const handleApplyTemplate = async (tmplId: string) => {
    try {
      const res = await fetch("/api/templates");
      if (!res.ok) return;
      const data = (await res.json()) as {
        templates?: {
          id: string;
          title: string;
          category: string;
          priority: TaskPriority;
          tags: string[];
          subtasks: string[];
        }[];
      };
      const tmpl = data.templates?.find((t) => t.id === tmplId);
      if (tmpl) {
        setTitle(tmpl.title);
        setCategory(tmpl.category);
        setPriority(tmpl.priority);
        setTags([...tmpl.tags]);
        setSubtasks(
          tmpl.subtasks.map((st) => ({
            id: crypto.randomUUID(),
            title: st,
            completed: false,
          })),
        );
        toast.info(`Applied "${tmpl.title}" template.`);
      }
    } catch (err) {
      console.warn("Could not load template:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a task title.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...(task ? { id: task.id } : {}),
        title: title.trim(),
        description: description.trim(),
        notes: notes.trim(),
        priority,
        status,
        completed: status === "done",
        starred,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        start_at: startAt ? new Date(startAt).toISOString() : null,
        reminder_at: reminderAt ? new Date(reminderAt).toISOString() : null,
        recurrence: recurrence === "none" ? null : recurrence,
        project: project.trim() || null,
        category: category.trim() || null,
        tags,
        subtasks: subtasks.map((s, idx) => ({
          id: s.id || crypto.randomUUID(),
          task_id: task?.id || "",
          user_id: "",
          title: s.title,
          completed: s.completed,
          sort_order: idx,
        })),
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save task.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const subtaskProgress =
    subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto border-border bg-card p-0"
      >
        <form onSubmit={handleSubmit} className="flex min-h-full flex-col">
          {/* Header */}
          <SheetHeader className="border-b border-border px-6 py-4 pr-12 bg-secondary/30">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                TASKFORGE / {task ? "Edit Task" : "New Task"}
              </span>
              <button
                type="button"
                onClick={() => setStarred(!starred)}
                className={`p-1 rounded hover:bg-muted/60 transition-colors ${
                  starred ? "text-primary" : "text-muted-foreground"
                }`}
                title={starred ? "Unstar task" : "Star as important"}
              >
                <Star className={`size-4 ${starred ? "fill-primary" : ""}`} />
              </button>
            </div>
            <SheetTitle className="text-lg font-semibold tracking-tight text-foreground">
              {task ? "Update Task Specifications" : "Create Productivity Task"}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Define timeline, priorities, subtask milestones, and tags.
            </SheetDescription>
          </SheetHeader>

          {/* Form Body */}
          <div className="flex-1 space-y-5 px-6 py-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="task-title" className="text-xs font-medium">
                Task Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="task-title"
                autoFocus
                placeholder="What needs to be accomplished?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="bg-secondary/40 border-border"
                required
              />
              {!task?.id && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                    <Sparkles className="size-3 text-primary" /> Templates:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate("tmpl-sprint")}
                    className="rounded bg-secondary/80 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors border border-border/60"
                  >
                    Sprint
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate("tmpl-deepwork")}
                    className="rounded bg-secondary/80 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors border border-border/60"
                  >
                    Deep Work
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate("tmpl-weekly-review")}
                    className="rounded bg-secondary/80 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors border border-border/60"
                  >
                    Weekly Review
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="task-description" className="text-xs font-medium">
                Description & Context
              </Label>
              <Textarea
                id="task-description"
                placeholder="Add background details, requirements, or next action steps…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="bg-secondary/40 border-border resize-none text-xs"
              />
            </div>

            {/* Priority & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Priority</Label>
                <Select value={priority} onValueChange={(val) => setPriority(val as TaskPriority)}>
                  <SelectTrigger className="h-9 bg-secondary/40 border-border text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="urgent" className="text-xs">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-destructive" />
                        Urgent
                      </span>
                    </SelectItem>
                    <SelectItem value="high" className="text-xs">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-warning" />
                        High
                      </span>
                    </SelectItem>
                    <SelectItem value="medium" className="text-xs">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary" />
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="low" className="text-xs">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-muted-foreground" />
                        Low
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Workflow Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as TaskStatus)}>
                  <SelectTrigger className="h-9 bg-secondary/40 border-border text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="backlog" className="text-xs">
                      To Do / Backlog
                    </SelectItem>
                    <SelectItem value="in_progress" className="text-xs">
                      In Progress
                    </SelectItem>
                    <SelectItem value="in_review" className="text-xs">
                      In Review
                    </SelectItem>
                    <SelectItem value="done" className="text-xs">
                      Done (Completed)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates: Due Date & Start Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-due" className="text-xs font-medium">
                  Due Date & Time
                </Label>
                <Input
                  id="task-due"
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="bg-secondary/40 border-border text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-start" className="text-xs font-medium">
                  Start Date & Time
                </Label>
                <Input
                  id="task-start"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="bg-secondary/40 border-border text-xs"
                />
              </div>
            </div>

            {/* Recurrence & Reminder */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Recurrence</Label>
                <Select value={recurrence} onValueChange={setRecurrence}>
                  <SelectTrigger className="h-9 bg-secondary/40 border-border text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none" className="text-xs">
                      Does not repeat
                    </SelectItem>
                    <SelectItem value="daily" className="text-xs">
                      Daily
                    </SelectItem>
                    <SelectItem value="weekly" className="text-xs">
                      Weekly
                    </SelectItem>
                    <SelectItem value="monthly" className="text-xs">
                      Monthly
                    </SelectItem>
                    <SelectItem value="yearly" className="text-xs">
                      Yearly
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-reminder" className="text-xs font-medium">
                  Reminder Alert
                </Label>
                <Input
                  id="task-reminder"
                  type="datetime-local"
                  value={reminderAt}
                  onChange={(e) => setReminderAt(e.target.value)}
                  className="bg-secondary/40 border-border text-xs"
                />
              </div>
            </div>

            {/* Project & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Project</Label>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Project name…"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    list="projects-datalist"
                    className="bg-secondary/40 border-border text-xs"
                  />
                  <datalist id="projects-datalist">
                    {projects.map((p) => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Category</Label>
                <Input
                  placeholder="e.g. Work, Study…"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  list="categories-datalist"
                  className="bg-secondary/40 border-border text-xs"
                />
                <datalist id="categories-datalist">
                  {categories.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tags (press Enter)</Label>
              <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-secondary/40 p-2 min-h-10">
                {tags.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="gap-1 px-2 py-0.5 text-[11px] bg-card border border-border text-foreground"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  type="text"
                  placeholder={tags.length === 0 ? "Type tag and press Enter…" : "Add tag…"}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="flex-1 bg-transparent text-xs outline-none min-w-24 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Subtasks Section */}
            <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Subtask Checklist</h4>
                  <p className="text-[11px] text-muted-foreground">
                    {completedSubtasks} of {subtasks.length} items complete
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAutoGenerateMilestones}
                    className="flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-[10px] font-mono text-primary hover:bg-primary/20 transition-colors border border-primary/30"
                    title="Intelligently decompose this task into actionable subtask milestones"
                  >
                    <Wand2 className="size-2.5" /> Decompose
                  </button>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {subtaskProgress}%
                  </Badge>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>

              {/* Subtask items */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {subtasks.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 rounded bg-card/60 px-2.5 py-1.5 border border-border/50 text-xs"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleSubtask(idx)}
                      id={`subtask-check-${idx}`}
                    />
                    <span
                      className={`flex-1 truncate ${
                        item.completed ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {item.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add subtask input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a subtask milestone…"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  className="h-8 bg-card border-border text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 gap-1 text-xs"
                  onClick={() => handleAddSubtask()}
                >
                  <Plus className="size-3.5" />
                  Add
                </Button>
              </div>
            </div>

            {/* Extended Notes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="task-notes" className="text-xs font-medium">
                  Extended Notes (Markdown supported)
                </Label>
                <div className="flex items-center gap-1 bg-secondary/60 p-0.5 rounded text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setNotesTab("write")}
                    className={`px-1.5 py-0.5 rounded transition-colors ${
                      notesTab === "write"
                        ? "bg-card text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotesTab("preview")}
                    className={`px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 ${
                      notesTab === "preview"
                        ? "bg-card text-primary font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="size-2.5" /> Preview
                  </button>
                </div>
              </div>

              {notesTab === "write" ? (
                <Textarea
                  id="task-notes"
                  placeholder="Obsidian-style formatted notes, links, or checklists…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="bg-secondary/40 border-border text-xs font-mono"
                />
              ) : (
                <div className="min-h-24 max-h-48 overflow-y-auto rounded-md border border-border/80 bg-secondary/30 p-3 text-xs font-mono space-y-1.5 text-foreground/90">
                  {notes.trim() ? (
                    notes.split("\n").map((line, lIdx) => {
                      if (line.startsWith("# ")) {
                        return (
                          <h3
                            key={lIdx}
                            className="text-sm font-bold text-primary mt-1 border-b border-border/40 pb-1"
                          >
                            {line.slice(2)}
                          </h3>
                        );
                      }
                      if (line.startsWith("## ")) {
                        return (
                          <h4 key={lIdx} className="text-xs font-semibold text-foreground mt-1">
                            {line.slice(3)}
                          </h4>
                        );
                      }
                      if (line.startsWith("- [ ] ") || line.startsWith("- [x] ")) {
                        const checked = line.startsWith("- [x] ");
                        return (
                          <div key={lIdx} className="flex items-center gap-2 text-xs">
                            <span className={checked ? "text-primary" : "text-muted-foreground"}>
                              {checked ? "☑" : "☐"}
                            </span>
                            <span className={checked ? "line-through text-muted-foreground" : ""}>
                              {line.slice(6)}
                            </span>
                          </div>
                        );
                      }
                      if (line.startsWith("- ")) {
                        return (
                          <li key={lIdx} className="ml-3 list-disc text-muted-foreground">
                            {line.slice(2)}
                          </li>
                        );
                      }
                      return (
                        <p key={lIdx} className="text-xs text-muted-foreground leading-relaxed">
                          {line || "\u00A0"}
                        </p>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground/50 italic">No notes written yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <SheetFooter className="border-t border-border bg-secondary/30 px-6 py-4 flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={saving}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-5 font-medium"
            >
              {saving ? "Saving…" : task ? "Save Changes" : "Create Task"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
