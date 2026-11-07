import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import type { CalendarViewType, Task, TaskPriority } from "../types";
import { localDateKey } from "@/lib/taskforge-logic";

type CalendarViewProps = {
  tasks: Task[];
  onOpenNewTaskWithDate?: (dateIso: string) => void;
  onSelectTask: (task: Task) => void;
  onOpenNewTask: () => void;
};

export function CalendarView({
  tasks,
  onOpenNewTaskWithDate,
  onSelectTask,
  onOpenNewTask,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>("month");

  // Navigation helpers
  const handlePrev = () => {
    if (viewType === "month") setCurrentDate((d) => subMonths(d, 1));
    else if (viewType === "week") setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => subDays(d, 1));
  };

  const handleNext = () => {
    if (viewType === "month") setCurrentDate((d) => addMonths(d, 1));
    else if (viewType === "week") setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addDays(d, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Map tasks by date key
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      if (!t.due_at || t.deleted_at) return;
      const key = localDateKey(new Date(t.due_at));
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    });
    return map;
  }, [tasks]);

  // Month days matrix
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let cur = start;
    while (cur <= end) {
      days.push(cur);
      cur = addDays(cur, 1);
    }
    return days;
  }, [currentDate]);

  // Week days
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [currentDate]);

  const handleCellClick = (date: Date) => {
    if (onOpenNewTaskWithDate) {
      const due = new Date(date);
      due.setHours(12, 0, 0, 0);
      onOpenNewTaskWithDate(due.toISOString());
    } else {
      onOpenNewTask();
    }
  };

  const getPriorityBorder = (p: TaskPriority) => {
    switch (p) {
      case "urgent":
        return "border-destructive text-destructive bg-destructive/10";
      case "high":
        return "border-warning text-warning bg-warning/10";
      case "medium":
        return "border-primary text-primary bg-primary/10";
      default:
        return "border-muted-foreground text-muted-foreground bg-muted/40";
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header with Navigation and View Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-secondary/40">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handlePrev}
              aria-label="Previous period"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs font-mono font-medium"
              onClick={handleToday}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handleNext}
              aria-label="Next period"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <h2 className="text-base font-semibold text-foreground tracking-tight">
            {viewType === "day"
              ? format(currentDate, "EEEE, MMMM d, yyyy")
              : viewType === "week" && weekDays[0] && weekDays[6]
                ? `Week of ${format(weekDays[0], "MMM d")} – ${format(weekDays[6], "MMM d, yyyy")}`
                : format(currentDate, "MMMM yyyy")}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View Type Toggle */}
          <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-secondary/40">
            {(["month", "week", "day"] as const).map((vt) => (
              <button
                key={vt}
                type="button"
                onClick={() => setViewType(vt)}
                className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  viewType === vt
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {vt}
              </button>
            ))}
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
      </div>

      {/* MONTH VIEW */}
      {viewType === "month" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border bg-secondary/40 text-center font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-2">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
            {monthDays.map((day) => {
              const dayKey = localDateKey(day);
              const dayTasks = tasksByDate.get(dayKey) ?? [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleCellClick(day)}
                  className={`group relative min-h-[110px] p-2 transition-colors hover:bg-secondary/30 cursor-pointer ${
                    !isCurrentMonth ? "opacity-35 bg-muted/10" : ""
                  } ${isToday ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`grid size-6 place-items-center rounded-full font-mono text-xs ${
                        isToday
                          ? "bg-primary font-bold text-primary-foreground shadow-xs"
                          : "text-muted-foreground group-hover:text-foreground font-medium"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    {dayTasks.length > 0 && (
                      <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Tasks List on Date */}
                  <div className="mt-1.5 space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTask(task);
                        }}
                        className={`block w-full truncate rounded border-l-2 px-1.5 py-0.5 text-left text-[10px] font-medium transition-colors ${getPriorityBorder(
                          task.priority,
                        )} ${task.completed ? "line-through opacity-50" : ""}`}
                      >
                        {task.title}
                      </button>
                    ))}

                    {dayTasks.length > 3 && (
                      <span className="block text-center font-mono text-[9px] text-muted-foreground">
                        +{dayTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewType === "week" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-border/60">
            {weekDays.map((day) => {
              const dayKey = localDateKey(day);
              const dayTasks = tasksByDate.get(dayKey) ?? [];
              const isToday = isSameDay(day, new Date());

              return (
                <div key={day.toISOString()} className="flex flex-col min-h-[460px]">
                  {/* Header */}
                  <div
                    className={`border-b border-border p-3 text-center ${
                      isToday ? "bg-primary/10" : "bg-secondary/30"
                    }`}
                  >
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {format(day, "EEE")}
                    </p>
                    <p
                      className={`mt-1 font-mono text-lg font-bold ${
                        isToday ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {format(day, "d")}
                    </p>
                  </div>

                  {/* Body with Click to Add */}
                  <div
                    onClick={() => handleCellClick(day)}
                    className="flex-1 p-2 space-y-2 hover:bg-secondary/20 transition-colors cursor-pointer"
                  >
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTask(task);
                        }}
                        className={`rounded-lg border p-2 text-xs transition-colors shadow-xs ${getPriorityBorder(
                          task.priority,
                        )} ${task.completed ? "line-through opacity-50" : ""}`}
                      >
                        <p className="font-medium text-foreground truncate">{task.title}</p>
                        {task.due_at && (
                          <p className="text-[10px] opacity-75 font-mono mt-1">
                            {format(new Date(task.due_at), "h:mm a")}
                          </p>
                        )}
                      </div>
                    ))}

                    {dayTasks.length === 0 && (
                      <div className="flex h-32 items-center justify-center text-[11px] text-muted-foreground/40">
                        + Click to add
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {viewType === "day" && (
        <div className="rounded-xl border border-border bg-card p-5 max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <p className="font-mono text-xs text-primary uppercase tracking-wider">
                Daily Focus Agenda
              </p>
              <h3 className="text-lg font-semibold text-foreground">
                {format(currentDate, "EEEE, MMMM d, yyyy")}
              </h3>
            </div>
            <Badge variant="outline" className="font-mono">
              {(tasksByDate.get(localDateKey(currentDate)) ?? []).length} Scheduled
            </Badge>
          </div>

          <div className="space-y-2.5">
            {(tasksByDate.get(localDateKey(currentDate)) ?? []).map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-secondary/40 transition-colors ${getPriorityBorder(
                  task.priority,
                )}`}
              >
                <div>
                  <h4
                    className={`text-sm font-medium ${
                      task.completed ? "line-through opacity-60" : "text-foreground"
                    }`}
                  >
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0 font-mono text-xs">
                  {task.due_at ? format(new Date(task.due_at), "h:mm a") : "All Day"}
                </div>
              </div>
            ))}

            {(tasksByDate.get(localDateKey(currentDate)) ?? []).length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <Clock className="mx-auto size-7 text-muted-foreground/40" />
                <p>No tasks scheduled for this day.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCellClick(currentDate)}
                  className="mt-2 text-xs"
                >
                  <Plus className="size-3.5 mr-1" /> Add task for this day
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
