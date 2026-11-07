import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Archive,
  Calendar,
  CalendarDays,
  Check,
  CheckCheck,
  Clock,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Star,
  Tags,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { ProjectMeta, Task, WorkspaceView } from "./types";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  projects: ProjectMeta[];
  onNavigate: (view: WorkspaceView) => void;
  onOpenNewTask: () => void;
  onSelectTask: (task: Task) => void;
  onFilterProject?: (projectName: string) => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  tasks,
  projects,
  onNavigate,
  onOpenNewTask,
  onSelectTask,
  onFilterProject,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const navCommands = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: LayoutDashboard,
      view: "dashboard" as WorkspaceView,
    },
    { id: "inbox", label: "Go to Inbox", icon: Inbox, view: "inbox" as WorkspaceView },
    { id: "tasks", label: "Go to My Tasks", icon: ListTodo, view: "tasks" as WorkspaceView },
    { id: "today", label: "Go to Today", icon: CheckCheck, view: "today" as WorkspaceView },
    {
      id: "upcoming",
      label: "Go to Upcoming",
      icon: CalendarDays,
      view: "upcoming" as WorkspaceView,
    },
    { id: "calendar", label: "Go to Calendar", icon: Calendar, view: "calendar" as WorkspaceView },
    {
      id: "matrix",
      label: "Go to Eisenhower Decision Matrix",
      icon: Target,
      view: "matrix" as WorkspaceView,
    },
    {
      id: "important",
      label: "Go to Important Tasks",
      icon: Star,
      view: "important" as WorkspaceView,
    },
    {
      id: "completed",
      label: "Go to Completed Tasks",
      icon: Check,
      view: "completed" as WorkspaceView,
    },
    {
      id: "projects",
      label: "Go to Projects",
      icon: FolderKanban,
      view: "projects" as WorkspaceView,
    },
    {
      id: "categories",
      label: "Go to Categories",
      icon: Archive,
      view: "categories" as WorkspaceView,
    },
    { id: "tags", label: "Go to Tags", icon: Tags, view: "tags" as WorkspaceView },
    {
      id: "analytics",
      label: "Go to Analytics",
      icon: Activity,
      view: "analytics" as WorkspaceView,
    },
    { id: "settings", label: "Go to Settings", icon: Settings2, view: "settings" as WorkspaceView },
  ];

  const normalized = query.trim().toLowerCase();

  // Matched actions
  const matchedNav = navCommands.filter((cmd) => cmd.label.toLowerCase().includes(normalized));

  // Matched tasks
  const matchedTasks = tasks
    .filter((task) => !task.deleted_at)
    .filter((task) => {
      if (!normalized) return false;
      const haystack =
        `${task.title} ${task.description} ${task.project || ""} ${task.tags.join(" ")}`.toLowerCase();
      return haystack.includes(normalized);
    })
    .slice(0, 6);

  // Matched projects
  const matchedProjects = projects.filter((p) => p.name.toLowerCase().includes(normalized));

  type PaletteItem = {
    type: "action" | "nav" | "task" | "project";
    id: string;
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    action: () => void;
  };

  const items: PaletteItem[] = [];

  // Always show "Create task" at the top if there's text or empty
  items.push({
    type: "action",
    id: "action-new-task",
    title: normalized ? `Create new task "${query}"` : "Create new task",
    subtitle: "Shortcut: Ctrl/Cmd + N",
    icon: Plus,
    action: () => {
      onOpenChange(false);
      onOpenNewTask();
    },
  });

  if (matchedTasks.length > 0) {
    matchedTasks.forEach((t) => {
      items.push({
        type: "task",
        id: `task-${t.id}`,
        title: t.title,
        subtitle: t.project ? `Project: ${t.project}` : `Priority: ${t.priority}`,
        icon: t.completed ? Check : Clock,
        action: () => {
          onOpenChange(false);
          onSelectTask(t);
        },
      });
    });
  }

  if (matchedProjects.length > 0 && normalized) {
    matchedProjects.forEach((p) => {
      items.push({
        type: "project",
        id: `proj-${p.id}`,
        title: `Project: ${p.name}`,
        subtitle: p.description,
        icon: FolderKanban,
        action: () => {
          onOpenChange(false);
          if (onFilterProject) onFilterProject(p.name);
          onNavigate("tasks");
        },
      });
    });
  }

  matchedNav.forEach((cmd) => {
    items.push({
      type: "nav",
      id: `nav-${cmd.id}`,
      title: cmd.label,
      icon: cmd.icon,
      action: () => {
        onOpenChange(false);
        onNavigate(cmd.view);
      },
    });
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].action();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[18%] translate-y-0 max-w-xl border-border bg-card p-0 shadow-2xl overflow-hidden rounded-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
        </DialogHeader>

        {/* Input Bar */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-secondary/40">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Type a command or search tasks, projects…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="h-7 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Items List */}
        <div className="max-h-[360px] overflow-y-auto p-2">
          {items.map((item, index) => {
            const isSelected = index === selectedIndex;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                  isSelected
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                <div
                  className={`grid size-6 place-items-center rounded border ${
                    isSelected
                      ? "border-primary/40 bg-primary/20 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{item.title}</p>
                  {item.subtitle && (
                    <p className="truncate text-[10px] text-muted-foreground">{item.subtitle}</p>
                  )}
                </div>
                {item.type === "action" && (
                  <Badge variant="outline" className="text-[9px] font-mono">
                    Action
                  </Badge>
                )}
                {item.type === "task" && (
                  <Badge variant="secondary" className="text-[9px] font-mono">
                    Task
                  </Badge>
                )}
              </button>
            );
          })}

          {items.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching commands or tasks found.
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-3 py-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              <kbd className="font-mono">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-mono">↵</kbd> select
            </span>
            <span>
              <kbd className="font-mono">esc</kbd> close
            </span>
          </div>
          <span className="font-mono">TASKFORGE Linear Palette</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
