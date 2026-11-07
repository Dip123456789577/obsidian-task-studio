import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Activity,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Keyboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Timer,
} from "lucide-react";
import { format } from "date-fns";
import type { Task, WorkspaceView } from "./types";
import { toast } from "sonner";

type TopNavProps = {
  currentView: WorkspaceView;
  pageTitle: string;
  tasks: Task[];
  email: string;
  displayName: string;
  focusMode: boolean;
  onToggleFocus: () => void;
  onOpenSearch: () => void;
  onOpenNewTask: () => void;
  onOpenPomodoro?: () => void;
  onOpenShortcuts?: () => void;
  onNavigate: (view: WorkspaceView) => void;
  onOpenMobileNav: () => void;
  onSignOut: () => Promise<void>;
  onTaskClick: (task: Task) => void;
};

export function TopNav({
  currentView,
  pageTitle,
  tasks,
  email,
  displayName,
  focusMode,
  onToggleFocus,
  onOpenSearch,
  onOpenNewTask,
  onOpenPomodoro,
  onOpenShortcuts,
  onNavigate,
  onOpenMobileNav,
  onSignOut,
  onTaskClick,
}: TopNavProps) {
  const [notifOpen, setNotifOpen] = useState(false);

  // Active reminders
  const reminders = tasks.filter((t) => !t.completed && !t.deleted_at && t.reminder_at);

  // Overdue tasks
  const overdueTasks = tasks.filter(
    (t) => !t.completed && !t.deleted_at && t.due_at && new Date(t.due_at).getTime() < Date.now(),
  );

  const totalAlertCount = reminders.length + overdueTasks.length;

  const requestBrowserPermission = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Browser notifications are not supported on this device.");
      return;
    }
    const res = await Notification.requestPermission();
    if (res === "granted") {
      toast.success("Desktop alerts active for due tasks & reminders.");
      new Notification("TASKFORGE Alerts Enabled", {
        body: "You will be alerted when task reminders trigger.",
      });
    } else {
      toast.error("Notification permission denied in browser settings.");
    }
  };

  const getInitials = (str: string) => {
    const parts = str.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return ((parts[0][0] ?? "") + (parts[1][0] ?? "")).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase() || "TF";
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-sidebar/70 backdrop-blur-md px-3 sm:px-6">
      {/* Left: Mobile menu toggle + Page title & breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 md:hidden text-muted-foreground hover:text-foreground"
          onClick={onOpenMobileNav}
          aria-label="Open sidebar menu"
        >
          <Menu className="size-4" />
        </Button>

        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
          <button
            onClick={() => onNavigate("dashboard")}
            className="hidden sm:inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-mono uppercase text-[11px] tracking-wider"
          >
            <span>TASKFORGE</span>
          </button>
          <span className="hidden sm:inline text-muted-foreground/60">/</span>
          <h1 className="truncate font-semibold text-foreground tracking-tight">{pageTitle}</h1>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex items-center flex-1 justify-center max-w-md mx-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex h-8.5 w-full items-center justify-between gap-2 rounded-md border border-border bg-card/60 px-3 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-card hover:text-foreground"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">Search tasks, tags, projects…</span>
          </div>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted/50 px-1.5 font-mono text-[10px] text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right Actions: Focus, Notifications, Add Task, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Pomodoro Focus Timer button */}
        {onOpenPomodoro && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            onClick={onOpenPomodoro}
            title="Pomodoro Focus Timer (P)"
            aria-label="Open Pomodoro focus timer"
          >
            <Timer className="size-4 text-primary" />
          </Button>
        )}

        {/* Shortcuts Cheat Sheet button */}
        {onOpenShortcuts && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 hidden sm:inline-flex text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (?)"
            aria-label="Open shortcuts cheat sheet"
          >
            <Keyboard className="size-4" />
          </Button>
        )}

        {/* Focus Mode button */}
        <Button
          variant="ghost"
          size="icon"
          className={`size-8 hidden sm:inline-flex ${
            focusMode
              ? "bg-primary/15 text-primary hover:bg-primary/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={onToggleFocus}
          title={focusMode ? "Exit Focus Mode" : "Focus Mode (High priority only)"}
          aria-label="Toggle focus mode"
        >
          <Activity className="size-4" />
        </Button>

        {/* Notifications Popover */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-8 text-muted-foreground hover:text-foreground"
              aria-label="Open notifications"
            >
              <Bell className="size-4" />
              {totalAlertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary font-mono text-[9px] font-bold text-primary-foreground">
                  {totalAlertCount > 9 ? "9+" : totalAlertCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 border-border bg-card p-0 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Notifications & Alerts
                </span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {totalAlertCount} active
              </Badge>
            </div>

            <div className="max-h-72 divide-y divide-border/60 overflow-y-auto">
              {overdueTasks.length > 0 && (
                <div className="p-2">
                  <p className="px-2 py-1 text-[10px] font-mono uppercase text-destructive font-semibold">
                    Overdue Deadlines ({overdueTasks.length})
                  </p>
                  {overdueTasks.slice(0, 3).map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        onTaskClick(task);
                      }}
                      className="flex w-full items-start gap-2.5 rounded p-2 text-left hover:bg-muted/50"
                    >
                      <Clock className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">{task.title}</p>
                        <p className="text-[10px] text-destructive">
                          Due{" "}
                          {task.due_at ? format(new Date(task.due_at), "MMM d, h:mm a") : "Overdue"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {reminders.length > 0 && (
                <div className="p-2">
                  <p className="px-2 py-1 text-[10px] font-mono uppercase text-primary font-semibold">
                    Upcoming Reminders ({reminders.length})
                  </p>
                  {reminders.slice(0, 4).map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        onTaskClick(task);
                      }}
                      className="flex w-full items-start gap-2.5 rounded p-2 text-left hover:bg-muted/50"
                    >
                      <Clock className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">{task.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Reminder:{" "}
                          {task.reminder_at
                            ? format(new Date(task.reminder_at), "MMM d, h:mm a")
                            : ""}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {totalAlertCount === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="mx-auto mb-2 size-6 text-success" />
                  <p className="font-medium text-foreground">All caught up!</p>
                  <p className="mt-1">No overdue tasks or active reminders.</p>
                </div>
              )}
            </div>

            <div className="border-t border-border p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-primary hover:text-primary"
                onClick={requestBrowserPermission}
              >
                Enable Desktop Push Notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Quick Add Task Button */}
        <Button
          size="sm"
          className="h-8 gap-1.5 px-2.5 sm:px-3 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          onClick={onOpenNewTask}
          title="New Task (Ctrl/Cmd + N)"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline text-xs">New Task</span>
        </Button>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="size-8 rounded-full p-0 border border-border"
              aria-label="User account menu"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/15 font-mono text-[11px] font-semibold text-primary">
                  {getInitials(displayName || email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-border bg-card">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-medium text-foreground leading-none">
                  {displayName || "TASKFORGE User"}
                </p>
                <p className="text-[11px] text-muted-foreground leading-none truncate">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-xs"
              onClick={() => onNavigate("settings")}
            >
              <Settings2 className="size-3.5 text-muted-foreground" />
              Settings & Preferences
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-xs"
              onClick={() => onNavigate("analytics")}
            >
              <Activity className="size-3.5 text-muted-foreground" />
              Productivity Reports
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
              onClick={() => void onSignOut()}
            >
              <LogOut className="size-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
