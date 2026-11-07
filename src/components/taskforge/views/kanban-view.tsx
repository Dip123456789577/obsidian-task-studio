import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  GripVertical,
  ListCheck,
  MoreHorizontal,
  Plus,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import type { Task, TaskPriority, TaskStatus } from "../types";

type KanbanViewProps = {
  tasks: Task[];
  onOpenNewTask: (defaultStatus?: TaskStatus) => void;
  onSelectTask: (task: Task) => void;
  onMoveTaskStatus: (task: Task, newStatus: TaskStatus) => Promise<void>;
  onToggleComplete: (task: Task) => void;
};

type ColumnDef = {
  id: TaskStatus;
  title: string;
  dotColor: string;
};

const COLUMNS: ColumnDef[] = [
  { id: "backlog", title: "To Do / Backlog", dotColor: "bg-muted-foreground" },
  { id: "in_progress", title: "In Progress", dotColor: "bg-primary" },
  { id: "in_review", title: "In Review", dotColor: "bg-warning" },
  { id: "done", title: "Done", dotColor: "bg-success" },
];

export function KanbanView({
  tasks,
  onOpenNewTask,
  onSelectTask,
  onMoveTaskStatus,
  onToggleComplete,
}: KanbanViewProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [activeDropCol, setActiveDropCol] = useState<TaskStatus | null>(null);

  const handleDragStart = (taskId: string, e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setActiveDropCol(null);
  };

  const handleDragOver = (colId: TaskStatus, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (activeDropCol !== colId) {
      setActiveDropCol(colId);
    }
  };

  const handleDragLeave = (colId: TaskStatus, e: React.DragEvent) => {
    if (activeDropCol === colId) {
      setActiveDropCol(null);
    }
  };

  const handleDrop = async (colId: TaskStatus, e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggingTaskId;
    setActiveDropCol(null);
    setDraggingTaskId(null);

    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status !== colId) {
      await onMoveTaskStatus(task, colId);
    }
  };

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start min-h-[500px]">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter(
          (t) => (t.status || (t.completed ? "done" : "backlog")) === column.id,
        );
        const isTarget = activeDropCol === column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(column.id, e)}
            onDragLeave={(e) => handleDragLeave(column.id, e)}
            onDrop={(e) => handleDrop(column.id, e)}
            className={`flex flex-col rounded-xl border bg-card/60 transition-all duration-200 overflow-hidden ${
              isTarget ? "border-primary bg-primary/5 ring-1 ring-primary/40" : "border-border/80"
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-border/60 bg-secondary/30 px-3.5 py-3">
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${column.dotColor}`} />
                <h3 className="text-xs font-semibold text-foreground tracking-tight">
                  {column.title}
                </h3>
                <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                  {columnTasks.length}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-foreground"
                onClick={() => onOpenNewTask(column.id)}
                title={`Add task to ${column.title}`}
              >
                <Plus className="size-3.5" />
              </Button>
            </div>

            {/* Column Task List */}
            <div className="flex-1 space-y-2 p-2.5 min-h-64 overflow-y-auto max-h-[calc(100vh-230px)]">
              {columnTasks.map((task) => {
                const isDragging = draggingTaskId === task.id;
                const subCompleted = task.subtasks.filter((s) => s.completed).length;

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(task.id, e)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onSelectTask(task)}
                    className={`group relative rounded-lg border border-border/80 bg-card p-3 shadow-xs transition-all hover:border-primary/50 cursor-grab active:cursor-grabbing ${
                      isDragging ? "opacity-30 scale-95 border-dashed border-primary" : ""
                    }`}
                  >
                    {/* Top Row: Priority & Star */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-mono uppercase font-medium border ${getPriorityStyle(
                          task.priority,
                        )}`}
                      >
                        {task.priority}
                      </span>

                      <div className="flex items-center gap-1">
                        {task.starred && <Star className="size-3 fill-warning text-warning" />}
                        <span className="text-muted-foreground/40 group-hover:text-muted-foreground">
                          <GripVertical className="size-3.5" />
                        </span>
                      </div>
                    </div>

                    {/* Task Title */}
                    <h4
                      className={`text-xs font-medium text-foreground line-clamp-2 ${
                        task.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.title}
                    </h4>

                    {/* Description preview */}
                    {task.description && (
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                        {task.description}
                      </p>
                    )}

                    {/* Meta Footer */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                      {task.project && (
                        <span className="font-mono text-foreground/80 truncate max-w-28">
                          #{task.project}
                        </span>
                      )}

                      {task.subtasks.length > 0 && (
                        <span className="flex items-center gap-1 font-mono">
                          <ListCheck className="size-3" />
                          {subCompleted}/{task.subtasks.length}
                        </span>
                      )}

                      {task.due_at && (
                        <span className="flex items-center gap-1 ml-auto font-mono">
                          <Clock className="size-3" />
                          {format(new Date(task.due_at), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {columnTasks.length === 0 && (
                <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border/60 text-center text-xs text-muted-foreground/60">
                  <p>Drop tasks here</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
