import { useState } from "react";
import type { Task } from "../types";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Flame, Target, Zap, Archive, Plus, Clock, Star, GripVertical } from "lucide-react";
import { format } from "date-fns";

type MatrixViewProps = {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onToggleStar: (task: Task) => void;
  onOpenNewTaskWithPriority: (
    priority: "urgent" | "high" | "medium" | "low",
    starred?: boolean,
  ) => void;
  onUpdateTaskPriority: (
    taskId: string,
    priority: "urgent" | "high" | "medium" | "low",
    starred: boolean,
  ) => void;
};

type QuadrantType = "do_first" | "schedule" | "delegate" | "eliminate";

interface QuadrantConfig {
  id: QuadrantType;
  title: string;
  subtitle: string;
  icon: typeof Flame;
  accentBorder: string;
  badgeBg: string;
  badgeText: string;
  priority: "urgent" | "high" | "medium" | "low";
  starred: boolean;
}

const QUADRANTS: QuadrantConfig[] = [
  {
    id: "do_first",
    title: "1. Do First",
    subtitle: "Urgent & Important — Critical immediate execution",
    icon: Flame,
    accentBorder: "border-destructive/60 hover:border-destructive",
    badgeBg: "bg-destructive/15 border-destructive/30",
    badgeText: "text-destructive",
    priority: "urgent",
    starred: true,
  },
  {
    id: "schedule",
    title: "2. Schedule & Deep Work",
    subtitle: "Important, Not Urgent — High leverage long-term goals",
    icon: Target,
    accentBorder: "border-primary/60 hover:border-primary",
    badgeBg: "bg-primary/15 border-primary/30",
    badgeText: "text-primary",
    priority: "high",
    starred: true,
  },
  {
    id: "delegate",
    title: "3. Quick Action / Delegate",
    subtitle: "Urgent, Less Critical — Rapid tasks and interruptions",
    icon: Zap,
    accentBorder: "border-warning/60 hover:border-warning",
    badgeBg: "bg-warning/15 border-warning/30",
    badgeText: "text-warning",
    priority: "urgent",
    starred: false,
  },
  {
    id: "eliminate",
    title: "4. Don't Prioritize / Backlog",
    subtitle: "Neither Urgent nor Critical — Low impact / someday",
    icon: Archive,
    accentBorder: "border-border/60 hover:border-border",
    badgeBg: "bg-secondary border-border/80",
    badgeText: "text-muted-foreground",
    priority: "low",
    starred: false,
  },
];

export function MatrixView({
  tasks,
  onSelectTask,
  onToggleComplete,
  onToggleStar,
  onOpenNewTaskWithPriority,
  onUpdateTaskPriority,
}: MatrixViewProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverQuadrant, setDragOverQuadrant] = useState<QuadrantType | null>(null);

  // Categorize tasks into the 4 Eisenhower quadrants
  const getQuadrantTasks = (quadId: QuadrantType) => {
    return tasks.filter((t) => {
      if (t.completed || t.deleted_at) return false;
      const isUrgent = t.priority === "urgent";
      const isImportant = t.starred || t.priority === "high";

      if (quadId === "do_first") return isUrgent && isImportant;
      if (quadId === "schedule") return !isUrgent && isImportant;
      if (quadId === "delegate") return isUrgent && !isImportant;
      if (quadId === "eliminate") return !isUrgent && !isImportant;
      return false;
    });
  };

  const handleDragStart = (taskId: string, e: React.DragEvent) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (quadId: QuadrantType, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverQuadrant !== quadId) {
      setDragOverQuadrant(quadId);
    }
  };

  const handleDrop = (quad: QuadrantConfig, e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggingTaskId;
    setDraggingTaskId(null);
    setDragOverQuadrant(null);

    if (taskId) {
      onUpdateTaskPriority(taskId, quad.priority, quad.starred);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Target className="size-4 text-primary" />
            Eisenhower Decision Matrix
          </h2>
          <p className="text-xs text-muted-foreground">
            Classify your focus by Urgency vs Importance to maximize high-leverage outcomes.
          </p>
        </div>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUADRANTS.map((quad) => {
          const quadTasks = getQuadrantTasks(quad.id);
          const Icon = quad.icon;
          const isOver = dragOverQuadrant === quad.id;

          return (
            <div
              key={quad.id}
              onDragOver={(e) => handleDragOver(quad.id, e)}
              onDragLeave={() => setDragOverQuadrant(null)}
              onDrop={(e) => handleDrop(quad, e)}
              className={`flex flex-col rounded-xl border bg-card/60 p-4 min-h-[320px] transition-all shadow-xs ${
                quad.accentBorder
              } ${isOver ? "ring-2 ring-primary/50 bg-secondary/40" : ""}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${quad.badgeBg}`}>
                    <Icon className={`size-4 ${quad.badgeText}`} />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-foreground tracking-tight">
                      {quad.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">{quad.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0">
                    {quadTasks.length}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => onOpenNewTaskWithPriority(quad.priority, quad.starred)}
                    className="p-1 rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    title={`Add task to ${quad.title}`}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Task Cards Container */}
              <div className="flex-1 space-y-2 pt-3 overflow-y-auto max-h-[420px] pr-1">
                {quadTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-muted-foreground/60 border border-dashed border-border/40 rounded-lg">
                    <p>No active tasks in this quadrant</p>
                    <button
                      type="button"
                      onClick={() => onOpenNewTaskWithPriority(quad.priority, quad.starred)}
                      className="mt-2 text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="size-3" /> Quick Add
                    </button>
                  </div>
                ) : (
                  quadTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(task.id, e)}
                      onDragEnd={() => setDraggingTaskId(null)}
                      onClick={() => onSelectTask(task)}
                      className={`group flex items-start gap-2.5 rounded-lg border border-border/70 bg-secondary/30 p-2.5 hover:bg-secondary/70 hover:border-border transition-all cursor-pointer ${
                        draggingTaskId === task.id ? "opacity-30 scale-95" : ""
                      }`}
                    >
                      <GripVertical className="size-3.5 text-muted-foreground/30 group-hover:text-muted-foreground mt-0.5 shrink-0 cursor-grab" />

                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => onToggleComplete(task)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 data-[state=checked]:bg-primary"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground line-clamp-2">
                          {task.title}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground">
                          {task.project && (
                            <span className="font-mono text-foreground/80">#{task.project}</span>
                          )}

                          {task.due_at && (
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="size-2.5" />
                              {format(new Date(task.due_at), "MMM d")}
                            </span>
                          )}

                          {task.tags.slice(0, 2).map((t) => (
                            <span key={t} className="font-mono text-muted-foreground/80">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStar(task);
                        }}
                        className={`p-1 rounded shrink-0 transition-colors ${
                          task.starred
                            ? "text-warning"
                            : "text-muted-foreground/30 hover:text-muted-foreground"
                        }`}
                      >
                        <Star className={`size-3 ${task.starred ? "fill-warning" : ""}`} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
