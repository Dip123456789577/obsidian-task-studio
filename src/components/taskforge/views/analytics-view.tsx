import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  Star,
  TrendingUp,
} from "lucide-react";
import { format, isSameDay, subDays } from "date-fns";
import type { Task } from "../types";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsViewProps = {
  tasks: Task[];
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#F87171",
  high: "#FBBF24",
  medium: "#A78BFA",
  low: "#71717A",
};

export function AnalyticsView({ tasks }: AnalyticsViewProps) {
  const liveTasks = useMemo(() => tasks.filter((t) => !t.deleted_at), [tasks]);
  const completedTasks = useMemo(() => liveTasks.filter((t) => t.completed), [liveTasks]);
  const pendingTasks = useMemo(() => liveTasks.filter((t) => !t.completed), [liveTasks]);
  const overdueTasks = useMemo(
    () => pendingTasks.filter((t) => t.due_at && new Date(t.due_at).getTime() < Date.now()),
    [pendingTasks],
  );

  const completionRate =
    liveTasks.length > 0 ? Math.round((completedTasks.length / liveTasks.length) * 100) : 0;

  // 14-day daily completion trend
  const dailyData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const day = subDays(new Date(), 13 - i);
      const finishedOnDay = completedTasks.filter(
        (t) => t.completed_at && isSameDay(new Date(t.completed_at), day),
      ).length;
      return {
        date: format(day, "MMM d"),
        count: finishedOnDay,
      };
    });
  }, [completedTasks]);

  // Priority breakdown
  const priorityData = useMemo(() => {
    const counts = { urgent: 0, high: 0, medium: 0, low: 0 };
    liveTasks.forEach((t) => {
      if (t.priority in counts) counts[t.priority as keyof typeof counts] += 1;
    });
    return [
      { name: "Urgent", value: counts.urgent, key: "urgent" },
      { name: "High", value: counts.high, key: "high" },
      { name: "Medium", value: counts.medium, key: "medium" },
      { name: "Low", value: counts.low, key: "low" },
    ].filter((p) => p.value > 0);
  }, [liveTasks]);

  // Project progress breakdown
  const projectData = useMemo(() => {
    const map = new Map<string, { total: number; completed: number }>();
    liveTasks.forEach((t) => {
      const proj = t.project || "Unassigned";
      const cur = map.get(proj) || { total: 0, completed: 0 };
      cur.total += 1;
      if (t.completed) cur.completed += 1;
      map.set(proj, cur);
    });

    return Array.from(map.entries())
      .map(([name, stat]) => ({
        name,
        completed: stat.completed,
        pending: stat.total - stat.completed,
      }))
      .slice(0, 6);
  }, [liveTasks]);

  // Status breakdown
  const statusData = useMemo(() => {
    return [
      { name: "Completed", count: completedTasks.length, fill: "#4ADE80" },
      { name: "Pending", count: pendingTasks.length, fill: "#A78BFA" },
      { name: "Overdue", count: overdueTasks.length, fill: "#F87171" },
    ];
  }, [completedTasks, pendingTasks, overdueTasks]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            Intelligence Engine
          </span>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
            Productivity Analytics & Reports
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Actionable telemetry derived from your completed tasks, deadlines, and backlog velocity.
          </p>
        </div>

        <Badge
          variant="outline"
          className="gap-1.5 font-mono text-xs border-success/40 text-success"
        >
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          Live Calculations
        </Badge>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Completion Rate</span>
            <TrendingUp className="size-4 text-success" />
          </div>
          <div className="mt-3 font-mono text-2xl font-bold text-success">{completionRate}%</div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {completedTasks.length} of {liveTasks.length} tasks finished
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Open Tasks</span>
            <ListTodo className="size-4 text-primary" />
          </div>
          <div className="mt-3 font-mono text-2xl font-bold text-foreground">
            {pendingTasks.length}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Currently active in pipeline</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Overdue Backlog</span>
            <AlertCircle className="size-4 text-destructive" />
          </div>
          <div
            className={`mt-3 font-mono text-2xl font-bold ${overdueTasks.length ? "text-destructive" : "text-foreground"}`}
          >
            {overdueTasks.length}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {overdueTasks.length ? "Missed target dates" : "No overdue tasks"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Starred Focus</span>
            <Star className="size-4 text-warning fill-warning" />
          </div>
          <div className="mt-3 font-mono text-2xl font-bold text-foreground">
            {liveTasks.filter((t) => t.starred && !t.completed).length}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">High importance pending</p>
        </div>
      </div>

      {/* Row 1: Daily Completion AreaChart & Priority Donut */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Daily Productivity AreaChart (2 cols) */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Completion Trend
              </span>
              <h3 className="text-sm font-semibold text-foreground">
                Daily Completed Tasks (Last 14 Days)
              </h3>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">
              14-Day Velocity
            </Badge>
          </div>

          <div className="h-60 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaViolet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
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
                          <p className="font-mono text-primary font-medium">
                            {item.value} completed
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#A78BFA"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#areaViolet)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution PieChart (1 col) */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1 flex flex-col justify-between">
          <div className="border-b border-border/60 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Priority Allocation
            </span>
            <h3 className="text-sm font-semibold text-foreground">Workload by Priority</h3>
          </div>

          <div className="h-52 w-full">
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {priorityData.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={PRIORITY_COLORS[entry.key] || "#A78BFA"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      const item = payload?.[0];
                      if (active && item) {
                        return (
                          <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-xl">
                            <span className="font-semibold text-foreground">
                              {item.name}: {item.value} tasks
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No active tasks to analyze.
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[10px] font-mono text-muted-foreground">
            {priorityData.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: PRIORITY_COLORS[p.key] }}
                />
                <span>
                  {p.name} ({p.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Project-wise Progress BarChart & 30-Day Activity Heatmap */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Project Comparison BarChart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Project Distribution
              </span>
              <h3 className="text-sm font-semibold text-foreground">
                Completed vs Pending by Project
              </h3>
            </div>
          </div>

          <div className="h-60 w-full pt-4">
            {projectData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      const item0 = payload?.[0];
                      const item1 = payload?.[1];
                      if (active && item0) {
                        return (
                          <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl space-y-1">
                            <p className="font-semibold text-foreground">{item0.payload?.name}</p>
                            <p className="text-success font-mono">Completed: {item0.value}</p>
                            <p className="text-primary font-mono">Pending: {item1?.value ?? 0}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="completed" name="Completed" fill="#4ADE80" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#A78BFA" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No project tasks tracked.
              </div>
            )}
          </div>
        </div>

        {/* 30-Day Focus Cadence Heatmap */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
          <div className="border-b border-border/60 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Consistency Matrix
            </span>
            <h3 className="text-sm font-semibold text-foreground">30-Day Focus Activity Grid</h3>
          </div>

          <div className="py-4">
            <p className="text-xs text-muted-foreground mb-3">
              Daily task completion density over the previous 30 days:
            </p>
            <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
              {Array.from({ length: 30 }, (_, index) => {
                const date = subDays(new Date(), 29 - index);
                const count = completedTasks.filter(
                  (t) => t.completed_at && isSameDay(new Date(t.completed_at), date),
                ).length;

                return (
                  <div
                    key={date.toISOString()}
                    title={`${format(date, "MMM d")}: ${count} task${count === 1 ? "" : "s"} completed`}
                    className={`aspect-square rounded border transition-colors ${
                      count >= 3
                        ? "border-primary bg-primary"
                        : count === 2
                          ? "border-primary/60 bg-primary/70"
                          : count === 1
                            ? "border-primary/30 bg-primary/30"
                            : "border-border bg-secondary/40"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-3 border-t border-border/50">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <span className="size-2 rounded bg-secondary/40 border border-border" />
              <span className="size-2 rounded bg-primary/30" />
              <span className="size-2 rounded bg-primary/70" />
              <span className="size-2 rounded bg-primary" />
            </div>
            <span>More Velocity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
