import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Archive,
  Calendar,
  Check,
  Clock,
  Copy,
  Edit2,
  FolderKanban,
  Layers,
  ListCheck,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import type { Task, WorkspaceView } from "../types";

type ListViewProps = {
  tasks: Task[];
  view: WorkspaceView;
  onOpenNewTask: () => void;
  onSelectTask: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onToggleStar: (task: Task) => void;
  onDelete: (task: Task) => void;
  onRestore: (task: Task) => void;
  onPermanentDelete: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onBulkComplete?: (taskIds: string[]) => void;
  onBulkDelete?: (taskIds: string[]) => void;
  onInlineUpdateTitle?: (task: Task, newTitle: string) => void;
};

export function ListView({
  tasks,
  view,
  onOpenNewTask,
  onSelectTask,
  onToggleComplete,
  onToggleStar,
  onDelete,
  onRestore,
  onPermanentDelete,
  onDuplicate,
  onBulkComplete,
  onBulkDelete,
  onInlineUpdateTitle,
}: ListViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<"none" | "priority" | "status" | "project">("priority");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inlineTitle, setInlineTitle] = useState("");

  const isTrash = view === "trash";

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const selectAll = () => {
    if (selectedIds.length === tasks.length) setSelectedIds([]);
    else setSelectedIds(tasks.map((t) => t.id));
  };

  const handleStartInlineEdit = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(task.id);
    setInlineTitle(task.title);
  };

  const handleSaveInline = (task: Task) => {
    if (inlineTitle.trim() && inlineTitle.trim() !== task.title) {
      if (onInlineUpdateTitle) onInlineUpdateTitle(task, inlineTitle.trim());
    }
    setEditingId(null);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="size-2 rounded-full bg-destructive shrink-0" title="Urgent Priority" />
        );
      case "high":
        return <span className="size-2 rounded-full bg-warning shrink-0" title="High Priority" />;
      case "medium":
        return <span className="size-2 rounded-full bg-primary shrink-0" title="Medium Priority" />;
      default:
        return (
          <span
            className="size-2 rounded-full bg-muted-foreground/60 shrink-0"
            title="Low Priority"
          />
        );
    }
  };

  const renderTaskRow = (task: Task) => {
    const isSelected = selectedIds.includes(task.id);
    const subtaskCompleted = task.subtasks.filter((s) => s.completed).length;

    return (
      <div
        key={task.id}
        onClick={() => onSelectTask(task)}
        className={`group flex items-center gap-3 border-b border-border/60 bg-card px-4 py-2.5 transition-colors hover:bg-secondary/40 cursor-pointer ${
          isSelected ? "bg-primary/5" : ""
        }`}
      >
        {/* Selection checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => toggleSelect(task.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${task.title}`}
        />

        {/* Complete Checkbox */}
        {!isTrash && (
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggleComplete(task)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Mark complete: ${task.title}`}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        )}

        {/* Priority Dot */}
        {getPriorityBadge(task.priority)}

        {/* Star icon */}
        {!isTrash && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(task);
            }}
            className={`p-0.5 rounded transition-colors ${
              task.starred ? "text-warning" : "text-muted-foreground/40 hover:text-muted-foreground"
            }`}
          >
            <Star className={`size-3.5 ${task.starred ? "fill-warning" : ""}`} />
          </button>
        )}

        {/* Title & Inline Edit */}
        <div className="flex-1 min-w-0 pr-2">
          {editingId === task.id ? (
            <input
              type="text"
              autoFocus
              value={inlineTitle}
              onChange={(e) => setInlineTitle(e.target.value)}
              onBlur={() => handleSaveInline(task)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveInline(task);
                if (e.key === "Escape") setEditingId(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-secondary px-2 py-0.5 text-xs text-foreground outline-none rounded border border-primary font-medium"
            />
          ) : (
            <div className="flex items-center gap-2">
              <span
                className={`truncate text-xs font-medium ${
                  task.completed ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {task.title}
              </span>
              <button
                type="button"
                onClick={(e) => handleStartInlineEdit(task, e)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                title="Inline edit title"
              >
                <Edit2 className="size-3" />
              </button>
            </div>
          )}
        </div>

        {/* Subtask count */}
        {task.subtasks.length > 0 && (
          <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            <ListCheck className="size-3 text-muted-foreground" />
            {subtaskCompleted}/{task.subtasks.length}
          </span>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="hidden md:flex items-center gap-1">
            {task.tags.slice(0, 2).map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="px-1.5 py-0 text-[9px] font-mono border-border bg-secondary/50 text-muted-foreground"
              >
                #{t}
              </Badge>
            ))}
            {task.tags.length > 2 && (
              <span className="text-[9px] text-muted-foreground font-mono">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Project Badge */}
        {task.project && (
          <Badge
            variant="secondary"
            className="hidden sm:inline-flex max-w-28 truncate px-2 py-0 text-[10px] bg-secondary text-foreground/80 font-mono"
          >
            {task.project}
          </Badge>
        )}

        {/* Due Date */}
        {task.due_at && (
          <span className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-muted-foreground shrink-0">
            <Clock className="size-3" />
            {format(new Date(task.due_at), "MMM d")}
          </span>
        )}

        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 border-border bg-card">
            {!isTrash ? (
              <>
                <DropdownMenuItem
                  className="text-xs cursor-pointer gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTask(task);
                  }}
                >
                  <Edit2 className="size-3.5" />
                  Edit Specifications
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs cursor-pointer gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(task);
                  }}
                >
                  <Copy className="size-3.5" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  className="text-xs cursor-pointer gap-2 text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task);
                  }}
                >
                  <Trash2 className="size-3.5" />
                  Move to Trash
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  className="text-xs cursor-pointer gap-2 text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(task);
                  }}
                >
                  <RotateCcw className="size-3.5" />
                  Restore Task
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  className="text-xs cursor-pointer gap-2 text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPermanentDelete(task);
                  }}
                >
                  <Trash2 className="size-3.5" />
                  Permanently Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* List View Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={tasks.length > 0 && selectedIds.length === tasks.length}
            onCheckedChange={selectAll}
            aria-label="Select all tasks"
          />
          <span className="text-xs text-muted-foreground font-mono">
            {selectedIds.length > 0 ? `${selectedIds.length} selected` : `${tasks.length} tasks`}
          </span>

          {selectedIds.length > 0 && !isTrash && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] gap-1"
                onClick={() => {
                  if (onBulkComplete) onBulkComplete(selectedIds);
                  setSelectedIds([]);
                }}
              >
                <Check className="size-3 text-success" />
                Complete Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] gap-1 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (onBulkDelete) onBulkDelete(selectedIds);
                  setSelectedIds([]);
                }}
              >
                <Trash2 className="size-3" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Group By selector */}
          <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-secondary/30">
            <span className="px-2 text-[10px] uppercase font-mono text-muted-foreground">
              Group:
            </span>
            {(["priority", "status", "project", "none"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupBy(g)}
                className={`rounded px-2 py-0.5 text-[10px] font-medium capitalize transition-colors ${
                  groupBy === g
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {!isTrash && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onOpenNewTask}
            >
              <Plus className="size-3.5" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Task List Content */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {tasks.length === 0 ? (
          <div className="py-14 text-center text-xs text-muted-foreground space-y-2">
            <Archive className="mx-auto size-7 text-muted-foreground/50" />
            <p className="font-medium text-foreground">No tasks found</p>
            <p>
              {isTrash
                ? "Trash is empty. Deleted tasks will show up here."
                : "Create a task or change your active filters."}
            </p>
          </div>
        ) : groupBy === "none" || isTrash ? (
          <div>{tasks.map(renderTaskRow)}</div>
        ) : groupBy === "priority" ? (
          <div className="divide-y divide-border/60">
            {(["urgent", "high", "medium", "low"] as const).map((p) => {
              const groupTasks = tasks.filter((t) => t.priority === p);
              if (groupTasks.length === 0) return null;
              return (
                <div key={p}>
                  <div className="flex items-center justify-between bg-secondary/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-2">
                      {getPriorityBadge(p)}
                      {p} Priority ({groupTasks.length})
                    </span>
                  </div>
                  <div>{groupTasks.map(renderTaskRow)}</div>
                </div>
              );
            })}
          </div>
        ) : groupBy === "status" ? (
          <div className="divide-y divide-border/60">
            {(["backlog", "in_progress", "in_review", "done"] as const).map((st) => {
              const groupTasks = tasks.filter(
                (t) => (t.status || (t.completed ? "done" : "backlog")) === st,
              );
              if (groupTasks.length === 0) return null;
              const label =
                st === "backlog"
                  ? "To Do / Backlog"
                  : st === "in_progress"
                    ? "In Progress"
                    : st === "in_review"
                      ? "In Review"
                      : "Completed";
              return (
                <div key={st}>
                  <div className="flex items-center justify-between bg-secondary/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>
                      {label} ({groupTasks.length})
                    </span>
                  </div>
                  <div>{groupTasks.map(renderTaskRow)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {Array.from(new Set(tasks.map((t) => t.project || "No Project"))).map((proj) => {
              const groupTasks = tasks.filter((t) => (t.project || "No Project") === proj);
              return (
                <div key={proj}>
                  <div className="flex items-center justify-between bg-secondary/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <FolderKanban className="size-3.5 text-primary" />
                      {proj} ({groupTasks.length})
                    </span>
                  </div>
                  <div>{groupTasks.map(renderTaskRow)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
