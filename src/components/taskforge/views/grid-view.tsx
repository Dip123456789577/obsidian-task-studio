import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  Copy,
  Edit2,
  FolderKanban,
  ListCheck,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import type { Task, TaskPriority } from "../types";

type GridViewProps = {
  tasks: Task[];
  onOpenNewTask: () => void;
  onSelectTask: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onToggleStar: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function GridView({
  tasks,
  onOpenNewTask,
  onSelectTask,
  onToggleComplete,
  onToggleStar,
  onDuplicate,
  onDelete,
}: GridViewProps) {
  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return "border-destructive/30 bg-destructive/10 text-destructive";
      case "high":
        return "border-warning/30 bg-warning/10 text-warning";
      case "medium":
        return "border-primary/30 bg-primary/10 text-primary";
      default:
        return "border-border bg-secondary text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cards Grid View
          </span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {tasks.length} tasks
          </Badge>
        </div>

        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          onClick={onOpenNewTask}
        >
          <Plus className="size-3.5" />
          Add Task
        </Button>
      </div>

      {/* Grid of Cards */}
      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-xs text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">No tasks match your criteria</p>
          <p>Create a task or clear filters to view cards.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tasks.map((task) => {
            const subCompleted = task.subtasks.filter((s) => s.completed).length;
            const progress =
              task.subtasks.length > 0
                ? Math.round((subCompleted / task.subtasks.length) * 100)
                : 0;

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-lg cursor-pointer"
              >
                <div>
                  {/* Top: Priority, Star, Actions */}
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-mono uppercase font-semibold border ${getPriorityStyle(
                        task.priority,
                      )}`}
                    >
                      {task.priority}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStar(task);
                        }}
                        className={`p-1 rounded hover:bg-muted/60 transition-colors ${
                          task.starred
                            ? "text-warning"
                            : "text-muted-foreground/30 hover:text-muted-foreground"
                        }`}
                      >
                        <Star className={`size-3.5 ${task.starred ? "fill-warning" : ""}`} />
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 border-border bg-card">
                          <DropdownMenuItem
                            className="text-xs cursor-pointer gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTask(task);
                            }}
                          >
                            <Edit2 className="size-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs cursor-pointer gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicate(task);
                            }}
                          >
                            <Copy className="size-3.5" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem
                            className="text-xs cursor-pointer gap-2 text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(task);
                            }}
                          >
                            <Trash2 className="size-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Title & Checkbox */}
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => onToggleComplete(task)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5"
                    />
                    <h3
                      className={`text-xs font-semibold text-foreground line-clamp-2 leading-snug ${
                        task.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.title}
                    </h3>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground leading-relaxed pl-6">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Subtask progress */}
                {task.subtasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/40 space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                      <span>Subtasks</span>
                      <span>
                        {subCompleted}/{task.subtasks.length} ({progress}%)
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Tags & Footer Meta */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-1">
                    {task.project && (
                      <Badge variant="secondary" className="px-1.5 py-0 text-[9px] font-mono">
                        #{task.project}
                      </Badge>
                    )}
                    {task.tags.slice(0, 2).map((t) => (
                      <span key={t} className="font-mono text-muted-foreground/80">
                        #{t}
                      </span>
                    ))}
                  </div>

                  {task.due_at && (
                    <span className="flex items-center gap-1 font-mono text-muted-foreground shrink-0">
                      <Clock className="size-3" />
                      {format(new Date(task.due_at), "MMM d")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
