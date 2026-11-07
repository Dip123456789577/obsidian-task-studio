import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Calendar,
  CalendarDays,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  ListTodo,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { format, isSameDay, subDays } from "date-fns";
import type { Task, WorkspaceView } from "../types";
import { localDateKey, getCompletionPercent } from "@/lib/taskforge-logic";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DashboardViewProps = {
  tasks: Task[];
  displayName: string;
  onOpenNewTask: () => void;
  onSelectTask: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onToggleStar: (task: Task) => void;
  onNavigate: (view: WorkspaceView) => void;
};

export function DashboardView({
  tasks,
  displayName,
  onOpenNewTask,
  onSelectTask,
  onToggleComplete,
  onToggleStar,
  onNavigate,
}: DashboardViewProps) {
  const liveTasks = useMemo(() => tasks.filter((t) => !t.deleted_at), [tasks]);
  const [now] = useState(() => new Date());
  const todayKey = useMemo(() => localDateKey(now), [now]);

  // Dynamic calculations
  const totalCount = liveTasks.length;
  const completedTasks = useMemo(() => liveTasks.filter((t) => t.completed), [liveTasks]);
  const pendingTasks = useMemo(() => liveTasks.filter((t) => !t.completed), [liveTasks]);
  const overdueTasks = useMemo(
    () => pendingTasks.filter((t) => t.due_at && new Date(t.due_at).getTime() < now.getTime()),
    [pendingTasks, now],
  );

  const todayTasks = useMemo(
    () => liveTasks.filter((t) => t.due_at && localDateKey(new Date(t.due_at)) === todayKey),
    [liveTasks, todayKey],
  );

  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const todayPercent = getCompletionPercent({
    total: todayTasks.length,
    completed: todayCompleted,
  });

  const upcomingDeadlines = useMemo(
    () =>
      pendingTasks
        .filter((t) => t.due_at && new Date(t.due_at).getTime() >= now.getTime())
        .sort((a, b) => (a.due_at! > b.due_at! ? 1 : -1))
        .slice(0, 5),
    [pendingTasks, now],
  );

  const importantTasks = useMemo(
    () => pendingTasks.filter((t) => t.starred).slice(0, 5),
    [pendingTasks],
  );

  const recentTasks = useMemo(
    () => [...pendingTasks].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
    [pendingTasks],
  );

  // Weekly productivity chart data (last 7 days)
  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(now, 6 - i);
      const dayTasks = completedTasks.filter(
        (t) => t.completed_at && isSameDay(new Date(t.completed_at), day),
      );
      return {
        name: format(day, "EEE"),
        date: format(day, "MMM d"),
        completed: dayTasks.length,
      };
    });
  }, [completedTasks, now]);

  const getTimeGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "urgent":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-warning text-black";
      case "medium":
        return "bg-primary/20 text-primary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Welcome Section */}
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-primary">
              {format(now, "EEEE, MMMM d, yyyy")}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">Obsidian Workspace</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
            {getTimeGreeting()}, {displayName.split(" ")[0] || "Architect"}.
          </h1>
          <p className="mt-1 text-xs text-muted-foreground max-w-xl">
            "Clarity precedes mastery. Eliminate distractions, sequence priorities, and execute."
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8.5 gap-1.5 border-border bg-secondary/50 text-xs text-foreground hover:bg-secondary"
            onClick={() => onNavigate("today")}
          >
            <CheckCheck className="size-3.5 text-primary" />
            Today's Queue ({todayTasks.length})
          </Button>
          <Button
            size="sm"
            className="h-8.5 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
            onClick={onOpenNewTask}
          >
            <Plus className="size-3.5" />
            Quick Add Task
          </Button>
        </div>
      </section>

      {/* 2. Overview Cards (Calculated dynamically) */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => onNavigate("tasks")}
          className="rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 group"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium group-hover:text-foreground">Total Tasks</span>
            <ListTodo className="size-4 text-primary" />
          </div>
          <div className="mt-3 font-mono text-2xl font-bold text-foreground">{totalCount}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Active in workspace</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("completed")}
          className="rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-success/50 group"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium group-hover:text-foreground">Completed</span>
            <CheckCircle2 className="size-4 text-success" />
          </div>
          <div className="mt-3 font-mono text-2xl font-bold text-success">
            {completedTasks.length}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {totalCount ? Math.round((completedTasks.length / totalCount) * 100) : 0}% completion
            rate
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("tasks")}
          className="rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 group"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium group-hover:text-foreground">Pending</span>
            <Clock className="size-4 text-primary" />
          </div>
          <div className="mt-3 font-mono text-2xl font-bold text-foreground">
            {pendingTasks.length}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Needs execution</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("today")}
          className="rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-destructive/50 group"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium group-hover:text-foreground">Overdue</span>
            <AlertCircle
              className={`size-4 ${overdueTasks.length ? "text-destructive" : "text-muted-foreground"}`}
            />
          </div>
          <div
            className={`mt-3 font-mono text-2xl font-bold ${overdueTasks.length ? "text-destructive" : "text-foreground"}`}
          >
            {overdueTasks.length}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {overdueTasks.length ? "Immediate attention" : "All deadlines met"}
          </p>
        </button>
      </section>

      {/* 3. Daily Completion Progress & Weekly Productivity Overview */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Daily Completion Progress */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Daily Completion
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {todayPercent}%
              </Badge>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              {todayCompleted} of {todayTasks.length} Done Today
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {todayTasks.length === 0
                ? "No tasks scheduled for today."
                : todayCompleted === todayTasks.length
                  ? "Outstanding! You completed everything due today."
                  : `${todayTasks.length - todayCompleted} remaining on your daily checklist.`}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <Progress value={todayPercent} className="h-2 bg-secondary" />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{todayCompleted} Finished</span>
              <span>{todayTasks.length - todayCompleted} Remaining</span>
            </div>
          </div>
        </div>

        {/* Weekly Productivity Recharts Chart */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Weekly Productivity
              </span>
              <h3 className="text-sm font-semibold text-foreground">
                Completed Tasks Trend (Last 7 Days)
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary gap-1"
              onClick={() => onNavigate("analytics")}
            >
              Full Reports <ArrowRight className="size-3" />
            </Button>
          </div>

          <div className="h-44 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="#71717A"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#303030" }}
                />
                <YAxis
                  stroke="#71717A"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#303030" }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    const item = payload?.[0];
                    if (active && item) {
                      return (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl">
                          <p className="font-semibold text-foreground">{item.payload?.date}</p>
                          <p className="text-primary font-mono font-medium">
                            {item.value} task{Number(item.value) === 1 ? "" : "s"} completed
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#A78BFA"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#purpleGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 4. Priority Queue, Upcoming Deadlines, and Starred Tasks */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Today's Tasks */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <CheckCheck className="size-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Today's Priority Queue ({todayTasks.length})
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary"
              onClick={() => onNavigate("today")}
            >
              View All
            </Button>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {todayTasks.length > 0 ? (
              todayTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/30 p-2.5 hover:bg-secondary/60 transition-colors"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => onToggleComplete(task)}
                  />
                  <div onClick={() => onSelectTask(task)} className="flex-1 min-w-0 cursor-pointer">
                    <p
                      className={`truncate text-xs font-medium ${
                        task.completed ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      {task.due_at && <span>{format(new Date(task.due_at), "h:mm a")}</span>}
                      {task.project && (
                        <span className="truncate text-foreground/80 font-mono">
                          #{task.project}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-mono uppercase ${getPriorityColor(
                      task.priority,
                    )}`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Check className="mx-auto mb-1.5 size-5 text-muted-foreground/60" />
                No tasks due today. Add one to start your sprint!
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Upcoming Deadlines ({upcomingDeadlines.length})
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary"
              onClick={() => onNavigate("upcoming")}
            >
              Calendar View
            </Button>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-2.5 hover:bg-secondary/60 transition-colors cursor-pointer"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="truncate text-xs font-medium text-foreground">{task.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {task.due_at ? format(new Date(task.due_at), "EEE, MMM d · h:mm a") : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-mono uppercase shrink-0 ${getPriorityColor(
                      task.priority,
                    )}`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No upcoming deadlines in the queue.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Important Tasks & Recently Added Tasks */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Starred / Important */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-warning fill-warning" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Important / Starred Focus ({importantTasks.length})
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary"
              onClick={() => onNavigate("important")}
            >
              View All
            </Button>
          </div>

          <div className="space-y-1.5">
            {importantTasks.length > 0 ? (
              importantTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-secondary/30 p-2.5 hover:bg-secondary/60 transition-colors"
                >
                  <button type="button" onClick={() => onToggleStar(task)} className="text-warning">
                    <Star className="size-3.5 fill-warning" />
                  </button>
                  <span
                    onClick={() => onSelectTask(task)}
                    className="flex-1 truncate text-xs font-medium text-foreground cursor-pointer"
                  >
                    {task.title}
                  </span>
                  {task.project && (
                    <Badge variant="outline" className="text-[9px]">
                      {task.project}
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No starred tasks. Click the star icon on any task to pin it here.
              </div>
            )}
          </div>
        </div>

        {/* Recently Added */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Recently Added Tasks
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary"
              onClick={() => onNavigate("tasks")}
            >
              All Tasks
            </Button>
          </div>

          <div className="space-y-1.5">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-2.5 hover:bg-secondary/60 transition-colors cursor-pointer"
                >
                  <span className="flex-1 truncate text-xs font-medium text-foreground pr-2">
                    {task.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {format(new Date(task.created_at), "MMM d")}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No recent tasks found.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
