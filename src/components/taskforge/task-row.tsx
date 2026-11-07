import { useState } from "react";
import { Check, Copy, Ellipsis, RotateCcw, Star, Trash2, Undo2 } from "lucide-react";
import type { Task } from "@/lib/taskforge-logic";
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
import { format } from "date-fns";

type TaskRowProps = {
  task: Task;
  onComplete: (task: Task) => void;
  onStar: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onRestore: (task: Task) => void;
  onPermanentDelete: (task: Task) => void;
  onDuplicate: (task: Task) => void;
};

const priorityColor: Record<string, string> = {
  urgent: "border-destructive/30 bg-destructive/10 text-destructive",
  high: "border-warning/30 bg-warning/10 text-warning",
  medium: "border-primary/20 bg-primary/10 text-primary",
  low: "border-border bg-muted text-muted-foreground",
};

export function TaskRow(props: TaskRowProps) {
  const { task } = props;
  const [open, setOpen] = useState(false);
  const due = task.due_at ? new Date(task.due_at) : null;
  const overdue = due && due.getTime() < Date.now() && !task.completed;
  const subtaskProgress = task.subtasks.length
    ? `${task.subtasks.filter((item) => item.completed).length}/${task.subtasks.length}`
    : null;

  return (
    <article
      className={`group flex gap-3 border-b border-border px-3 py-3 transition-colors hover:bg-muted/40 sm:items-center ${task.completed ? "opacity-60" : ""}`}
    >
      <div className="pt-0.5 sm:pt-0">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => props.onComplete(task)}
          aria-label={task.completed ? `Reopen ${task.title}` : `Complete ${task.title}`}
        />
      </div>
      <Button
        size="icon"
        variant="ghost"
        className={`size-8 shrink-0 ${task.starred ? "text-primary" : "text-muted-foreground"}`}
        title={task.starred ? "Remove from important" : "Mark important"}
        aria-label={task.starred ? "Remove from important" : "Mark important"}
        onClick={() => props.onStar(task)}
      >
        <Star className="size-4" fill={task.starred ? "currentColor" : "none"} />
      </Button>
      <button
        type="button"
        className="min-w-0 flex-1 cursor-pointer text-left"
        onClick={() => props.onEdit(task)}
      >
        <span
          className={`block truncate text-sm font-medium ${task.completed ? "line-through" : ""}`}
        >
          {task.title}
        </span>
        {task.description && (
          <span className="mt-1 block truncate text-xs text-muted-foreground">
            {task.description}
          </span>
        )}
        <span className="mt-2 flex flex-wrap items-center gap-1.5">
          {task.priority && (
            <Badge
              variant="outline"
              className={`px-1.5 py-0 text-[10px] capitalize ${priorityColor[task.priority] ?? ""}`}
            >
              {task.priority}
            </Badge>
          )}
          {task.project && (
            <span className="max-w-36 truncate text-[11px] text-muted-foreground">
              {task.project}
            </span>
          )}
          {task.category && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {task.category}
            </Badge>
          )}
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[11px] text-muted-foreground">
              #{tag}
            </span>
          ))}
          {subtaskProgress && (
            <span className="text-[11px] text-muted-foreground">{subtaskProgress} subtasks</span>
          )}
        </span>
      </button>
      {due && (
        <span
          className={`hidden shrink-0 text-xs md:block ${overdue ? "text-destructive" : "text-muted-foreground"}`}
        >
          {format(due, "MMM d · h:mm a")}
        </span>
      )}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 shrink-0"
            aria-label={`More actions for ${task.title}`}
          >
            <Ellipsis className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {task.deleted_at ? (
            <>
              <DropdownMenuItem onClick={() => props.onRestore(task)}>
                <Undo2 className="size-4" /> Restore task
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => props.onPermanentDelete(task)}
              >
                <Trash2 className="size-4" /> Delete permanently
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => props.onEdit(task)}>
                <Check className="size-4" /> Edit task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => props.onDuplicate(task)}>
                <Copy className="size-4" /> Duplicate task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => props.onDelete(task)}>
                <Trash2 className="size-4" /> Move to trash
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
}
