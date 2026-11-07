import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Archive,
  Calendar,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Moon,
  Plus,
  Settings2,
  Sparkles,
  Star,
  Sun,
  Tags,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import type { Task, WorkspaceView } from "./types";
import { localDateKey } from "@/lib/taskforge-logic";

type SidebarProps = {
  currentView: WorkspaceView;
  collapsed: boolean;
  tasks: Task[];
  email: string;
  displayName: string;
  onNavigate: (view: WorkspaceView) => void;
  onToggleCollapse: () => void;
  onOpenNewTask: () => void;
  onSignOut: () => Promise<void>;
  compact?: boolean;
};

type NavEntry = {
  id: WorkspaceView;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number | null;
};

export function Sidebar({
  currentView,
  collapsed,
  tasks,
  email,
  displayName,
  onNavigate,
  onToggleCollapse,
  onOpenNewTask,
  onSignOut,
  compact = false,
}: SidebarProps) {
  const liveTasks = tasks.filter((t) => !t.deleted_at);
  const todayKey = localDateKey(new Date());

  const todayCount = liveTasks.filter(
    (t) => !t.completed && t.due_at && localDateKey(new Date(t.due_at)) === todayKey,
  ).length;

  const inboxCount = liveTasks.filter((t) => !t.completed && !t.project).length;
  const myTasksCount = liveTasks.filter((t) => !t.completed).length;
  const importantCount = liveTasks.filter((t) => !t.completed && t.starred).length;
  const completedCount = liveTasks.filter((t) => t.completed).length;
  const trashCount = tasks.filter((t) => t.deleted_at !== null).length;

  const primaryItems: NavEntry[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inbox", label: "Inbox", icon: Inbox, badge: inboxCount },
    { id: "tasks", label: "My Tasks", icon: ListTodo, badge: myTasksCount },
    { id: "today", label: "Today", icon: CheckCheck, badge: todayCount },
    { id: "upcoming", label: "Upcoming", icon: CalendarDays },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "matrix", label: "Decision Matrix", icon: Target },
    { id: "important", label: "Important", icon: Star, badge: importantCount },
    { id: "completed", label: "Completed", icon: Check, badge: completedCount },
  ];

  const organizeItems: NavEntry[] = [
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "categories", label: "Categories", icon: Archive },
    { id: "tags", label: "Tags", icon: Tags },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "trash", label: "Trash", icon: Trash2, badge: trashCount },
  ];

  const getInitials = (str: string) => {
    const parts = str.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return ((parts[0][0] ?? "") + (parts[1][0] ?? "")).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase() || "TF";
  };

  const isCollapsed = collapsed && !compact;

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar select-none">
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="grid size-7.5 place-items-center rounded-md border border-primary/40 bg-primary/10 text-primary shrink-0">
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-bold tracking-[0.16em] text-foreground">
                TASKFORGE
              </span>
              <span className="text-[10px] text-muted-foreground tracking-tight">
                Productivity Studio
              </span>
            </div>
          )}
        </div>

        {!compact && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        )}
      </div>

      {/* Quick Add Button */}
      <div className="p-2.5">
        <Button
          size="sm"
          className={`w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium ${
            isCollapsed ? "px-2 justify-center" : "px-3"
          }`}
          onClick={onOpenNewTask}
          title="New Task (Ctrl/Cmd + N)"
        >
          <Plus className="size-4 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-xs text-left">New Task</span>
              <kbd className="rounded border border-primary-foreground/20 px-1 font-mono text-[9px]">
                N
              </kbd>
            </>
          )}
        </Button>
      </div>

      {/* Navigation Sections */}
      <nav className="hide-scrollbar flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {/* Workspace section */}
        <div>
          {!isCollapsed && (
            <p className="px-2 pb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Workspace
            </p>
          )}
          <div className="space-y-0.5">
            {primaryItems.map((item) => (
              <SidebarButton
                key={item.id}
                active={currentView === item.id}
                collapsed={isCollapsed}
                label={item.label}
                icon={<item.icon className="size-4 shrink-0" />}
                badge={item.badge}
                onClick={() => onNavigate(item.id)}
              />
            ))}
          </div>
        </div>

        {/* Organize section */}
        <div>
          {!isCollapsed && (
            <p className="px-2 pb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Manage & Review
            </p>
          )}
          <div className="space-y-0.5">
            {organizeItems.map((item) => (
              <SidebarButton
                key={item.id}
                active={currentView === item.id}
                collapsed={isCollapsed}
                label={item.label}
                icon={<item.icon className="size-4 shrink-0" />}
                badge={item.badge}
                onClick={() => onNavigate(item.id)}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Sidebar Footer: Settings, Profile & Logout */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <SidebarButton
          active={currentView === "settings"}
          collapsed={isCollapsed}
          label="Settings"
          icon={<Settings2 className="size-4 shrink-0" />}
          onClick={() => onNavigate("settings")}
        />

        <div
          className={`flex items-center gap-2.5 rounded-md p-1.5 transition-colors hover:bg-card/50 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <Avatar className="size-7.5 border border-border">
            <AvatarFallback className="bg-primary/15 font-mono text-[10px] font-semibold text-primary">
              {getInitials(displayName || email)}
            </AvatarFallback>
          </Avatar>

          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">
                  {displayName || "User"}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">{email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={() => void onSignOut()}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarButton({
  active,
  collapsed,
  label,
  icon,
  badge,
  onClick,
}: {
  active: boolean;
  collapsed: boolean;
  label: string;
  icon: ReactNode;
  badge?: number | null | undefined;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-xs transition-colors ${
        active
          ? "bg-primary/15 font-medium text-primary shadow-xs"
          : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
      } ${collapsed ? "justify-center px-0" : ""}`}
      title={collapsed ? label : undefined}
      aria-label={label}
    >
      <span
        className={active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}
      >
        {icon}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-left">{label}</span>
          {typeof badge === "number" && badge > 0 && (
            <span
              className={`rounded px-1.5 py-0.2 font-mono text-[10px] font-medium ${
                active
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground group-hover:text-foreground"
              }`}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}
