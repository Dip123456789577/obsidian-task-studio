import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { TaskEditor, type DraftTask } from "@/components/taskforge/task-editor";
import { TaskRow } from "@/components/taskforge/task-row";
import { getCompletionPercent, getTaskStats, getVisibleTasks, localDateKey, nextRecurringDue, type Task, type WorkspaceView } from "@/lib/taskforge-logic";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { addDays, endOfMonth, format, isSameDay, startOfMonth } from "date-fns";
import {
  Activity, Archive, ArrowDown, ArrowUp, Bell, CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight,
  CircleHelp, ClipboardList, Clock3, Command, FolderKanban, Inbox, LayoutDashboard, ListTodo, LogOut,
  Menu, MoreHorizontal, Plus, Search, Settings2, ShieldCheck, Star, Tags, Trash2, TrendingUp, X,
} from "lucide-react";

type Profile = Tables<"profiles">;
type TaskRowRecord = Tables<"tasks">;
type SubtaskRowRecord = Tables<"subtasks">;

type WorkspaceProps = { userId: string; email: string; onSignOut: () => Promise<void> };

const NAV_ITEMS: { id: WorkspaceView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "tasks", label: "My Tasks", icon: ListTodo },
  { id: "today", label: "Today", icon: CheckCheck },
  { id: "upcoming", label: "Upcoming", icon: CalendarDays },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "important", label: "Important", icon: Star },
  { id: "completed", label: "Completed", icon: Check },
];

const EXTRA_ITEMS: { id: WorkspaceView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "categories", label: "Categories", icon: Archive },
  { id: "tags", label: "Tags", icon: Tags },
  { id: "trash", label: "Trash", icon: Trash2 },
];

const PAGE_TITLES: Record<WorkspaceView, string> = {
  dashboard: "Dashboard", inbox: "Inbox", tasks: "My Tasks", today: "Today", upcoming: "Upcoming",
  calendar: "Calendar", important: "Important", completed: "Completed", projects: "Projects",
  categories: "Categories", tags: "Tags", trash: "Trash", analytics: "Analytics", settings: "Settings",
};

const COLUMNS = [
  { id: "backlog", title: "Backlog", className: "text-muted-foreground" },
  { id: "in_progress", title: "In Progress", className: "text-primary" },
  { id: "in_review", title: "In Review", className: "text-warning" },
  { id: "done", title: "Done", className: "text-success" },
] as const;

export function Workspace({ userId, email, onSignOut }: WorkspaceProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<WorkspaceView>("dashboard");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "calendar">("list");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [focusOnly, setFocusOnly] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [draggingTask, setDraggingTask] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const notifiedReminders = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    setLoading(true);
    const [taskResult, subtaskResult, profileResult] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("subtasks").select("*").order("sort_order", { ascending: true }),
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    ]);
    if (taskResult.error || subtaskResult.error || profileResult.error) {
      toast.error("Your workspace could not be loaded. Please try again.");
      setLoading(false);
      return;
    }
    const subtasksByTask = new Map<string, SubtaskRowRecord[]>();
    (subtaskResult.data ?? []).forEach((subtask) => {
      const rows = subtasksByTask.get(subtask.task_id) ?? [];
      rows.push(subtask);
      subtasksByTask.set(subtask.task_id, rows);
    });
    setTasks((taskResult.data ?? []).map((task) => ({ ...task, subtasks: subtasksByTask.get(task.id) ?? [] })));
    const loadedProfile = profileResult.data;
    setProfile(loadedProfile);
    setProfileName(loadedProfile?.display_name ?? "");
    setLoading(false);
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const isTyping = event.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      } else if (!isTyping && event.key.toLowerCase() === "c") {
        event.preventDefault();
        setEditingTask(null);
        setEditorOpen(true);
      } else if (event.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => searchRef.current?.focus(), 30);
  }, [searchOpen]);

  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const checkReminders = () => {
      const now = Date.now();
      tasks.forEach((task) => {
        if (task.deleted_at || task.completed || !task.reminder_at || notifiedReminders.current.has(task.id)) return;
        if (new Date(task.reminder_at).getTime() <= now) {
          new Notification("TASKFORGE reminder", { body: task.title });
          notifiedReminders.current.add(task.id);
        }
      });
    };
    checkReminders();
    const timer = window.setInterval(checkReminders, 60_000);
    return () => window.clearInterval(timer);
  }, [tasks]);

  const liveTasks = useMemo(() => tasks.filter((task) => !task.deleted_at), [tasks]);
  const stats = useMemo(() => getTaskStats(tasks), [tasks]);
  const visibleTasks = useMemo(() => getVisibleTasks(tasks, { view, query, focusOnly }), [tasks, view, query, focusOnly]);
  const filteredTasks = useMemo(() => priorityFilter === "all" ? visibleTasks : visibleTasks.filter((task) => task.priority === priorityFilter), [priorityFilter, visibleTasks]);
  const activeNavItems = NAV_ITEMS;
  const displayName = profile?.display_name.trim() || email.split("@")[0] || "there";
  const firstName = displayName.split(/\s+/)[0];
  const todayLabel = format(new Date(), "EEEE, MMMM d");

  const openNewTask = () => { setEditingTask(null); setEditorOpen(true); };
  const openTask = (task: Task) => { setEditingTask(task); setEditorOpen(true); };

  const saveTask = async (draft: DraftTask) => {
    const nowIso = new Date().toISOString();
    const row = {
      title: draft.title,
      description: draft.description,
      notes: draft.notes,
      priority: draft.priority,
      due_at: draft.dueAt ? new Date(draft.dueAt).toISOString() : null,
      start_at: draft.startAt ? new Date(draft.startAt).toISOString() : null,
      reminder_at: draft.reminderAt ? new Date(draft.reminderAt).toISOString() : null,
      category: draft.category.trim() || null,
      project: draft.project.trim() || null,
      tags: draft.tags.split(",").map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean),
      starred: draft.starred,
      recurrence: draft.recurrence === "none" ? null : draft.recurrence,
      updated_at: nowIso,
    };

    let savedId: string;
    if (editingTask) {
      const { error } = await supabase.from("tasks").update(row).eq("id", editingTask.id);
      if (error) throw error;
      savedId = editingTask.id;
    } else {
      const { data, error } = await supabase.from("tasks").insert({ ...row, user_id: userId }).select("id").single();
      if (error) throw error;
      savedId = data.id;
    }

    const originalIds = new Set(editingTask?.subtasks.map((item) => item.id) ?? []);
    const requestedIds = new Set(draft.subtasks.map((item) => item.id).filter((id): id is string => Boolean(id)));
    const removedIds = [...originalIds].filter((id) => !requestedIds.has(id));
    if (removedIds.length) {
      const { error } = await supabase.from("subtasks").delete().in("id", removedIds);
      if (error) throw error;
    }
    for (const [index, item] of draft.subtasks.entries()) {
      if (item.id) {
        const { error } = await supabase.from("subtasks").update({ title: item.title, completed: item.completed, sort_order: index }).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subtasks").insert({ task_id: savedId, user_id: userId, title: item.title, completed: item.completed, sort_order: index });
        if (error) throw error;
      }
    }
    setEditorOpen(false);
    toast.success(editingTask ? "Task updated" : "Task created");
    await refresh();
  };

  const toggleComplete = async (task: Task) => {
    const completed = !task.completed;
    const { error } = await supabase.from("tasks").update({ completed, completed_at: completed ? new Date().toISOString() : null, status: completed ? "done" : "backlog" }).eq("id", task.id);
    if (error) { toast.error("Task could not be updated"); return; }
    const nextDue = completed ? nextRecurringDue(task.due_at, task.recurrence) : null;
    if (nextDue) {
      const { data, error: insertError } = await supabase.from("tasks").insert({
        user_id: userId, title: task.title, description: task.description, notes: task.notes,
        priority: task.priority, due_at: nextDue, start_at: null, category: task.category, project: task.project,
        tags: task.tags, starred: task.starred, recurrence: task.recurrence, status: "backlog",
      }).select("id").single();
      if (!insertError && data) {
        const copies = task.subtasks.map((subtask, index) => ({ task_id: data.id, user_id: userId, title: subtask.title, completed: false, sort_order: index }));
        if (copies.length) await supabase.from("subtasks").insert(copies);
      }
      toast.success("Completed — the next recurring task is ready");
    } else {
      toast.success(completed ? "Task completed" : "Task reopened");
    }
    await refresh();
  };

  const toggleStar = async (task: Task) => {
    const { error } = await supabase.from("tasks").update({ starred: !task.starred }).eq("id", task.id);
    if (error) { toast.error("Importance could not be changed"); return; }
    await refresh();
  };

  const moveToTrash = async (task: Task) => {
    const { error } = await supabase.from("tasks").update({ deleted_at: new Date().toISOString() }).eq("id", task.id);
    if (error) { toast.error("Task could not be moved to Trash"); return; }
    toast.success("Moved to Trash");
    await refresh();
  };

  const restoreTask = async (task: Task) => {
    const { error } = await supabase.from("tasks").update({ deleted_at: null }).eq("id", task.id);
    if (error) { toast.error("Task could not be restored"); return; }
    toast.success("Task restored");
    await refresh();
  };

  const permanentlyDelete = async (task: Task) => {
    if (!window.confirm(`Permanently delete “${task.title}”? This cannot be undone.`)) return;
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) { toast.error("Task could not be deleted"); return; }
    toast.success("Task permanently deleted");
    await refresh();
  };

  const duplicateTask = async (task: Task) => {
    const { data, error } = await supabase.from("tasks").insert({
      user_id: userId, title: `${task.title} (copy)`, description: task.description, notes: task.notes,
      priority: task.priority, due_at: task.due_at, start_at: task.start_at, category: task.category,
      project: task.project, tags: task.tags, starred: task.starred, recurrence: task.recurrence, status: task.status,
    }).select("id").single();
    if (error || !data) { toast.error("Task could not be duplicated"); return; }
    const copies = task.subtasks.map((subtask, index) => ({ task_id: data.id, user_id: userId, title: subtask.title, completed: false, sort_order: index }));
    if (copies.length) await supabase.from("subtasks").insert(copies);
    toast.success("Task duplicated");
    await refresh();
  };

  const moveTask = async (task: Task, status: string) => {
    const { error } = await supabase.from("tasks").update({ status, completed: status === "done", completed_at: status === "done" ? new Date().toISOString() : null }).eq("id", task.id);
    if (error) toast.error("Task could not be moved");
    else await refresh();
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").upsert({ id: userId, display_name: profileName.trim() });
    setSavingProfile(false);
    if (error) toast.error("Profile could not be saved");
    else { toast.success("Profile updated"); await refresh(); }
  };

  const goToView = (next: WorkspaceView) => {
    setView(next);
    setFocusOnly(false);
    setMobileNavOpen(false);
    if (next === "tasks") setViewMode("list");
  };

  const signOut = async () => {
    await onSignOut();
  };

  const NavContent = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center border border-primary/30 bg-primary/10 text-primary"><Command className="size-4" /></div>
          {!collapsed && !compact && <span className="truncate text-xs font-semibold tracking-[0.12em]">TASKFORGE</span>}
        </div>
        {!compact && <Button variant="ghost" size="icon" className="size-8" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed(!collapsed)}><Menu className="size-4" /></Button>}
      </div>

      <div className="px-3 pt-4">
        <Button className={`w-full justify-start gap-2 ${collapsed && !compact ? "px-2" : ""}`} onClick={openNewTask} title="New task · C">
          <Plus className="size-4 shrink-0" />{(!collapsed || compact) && <><span>New task</span><kbd className="ml-auto rounded border border-primary-foreground/20 px-1 text-[10px]">C</kbd></>}
        </Button>
      </div>

      <nav className="hide-scrollbar flex-1 overflow-y-auto px-2 py-4">
        <p className={`px-2 pb-2 font-mono text-[10px] uppercase text-muted-foreground ${collapsed && !compact ? "sr-only" : ""}`}>Workspace</p>
        <div className="space-y-0.5">
          {activeNavItems.map(({ id, label, icon: Icon }) => {
            const count = id === "today" ? stats.today.length : id === "completed" ? stats.completed : id === "inbox" ? liveTasks.filter((task) => !task.completed && !task.project).length : id === "tasks" ? stats.pending : null;
            return <NavButton key={id} active={view === id} collapsed={collapsed && !compact} label={label} icon={<Icon className="size-4 shrink-0" />} count={count} onClick={() => goToView(id)} />;
          })}
        </div>
        <p className={`px-2 pb-2 pt-6 font-mono text-[10px] uppercase text-muted-foreground ${collapsed && !compact ? "sr-only" : ""}`}>Organize</p>
        <div className="space-y-0.5">
          {EXTRA_ITEMS.map(({ id, label, icon: Icon }) => <NavButton key={id} active={view === id} collapsed={collapsed && !compact} label={label} icon={<Icon className="size-4 shrink-0" />} count={id === "trash" ? tasks.filter((task) => task.deleted_at).length : null} onClick={() => goToView(id)} />)}
          <NavButton active={view === "analytics"} collapsed={collapsed && !compact} label="Analytics" icon={<Activity className="size-4 shrink-0" />} onClick={() => goToView("analytics")} />
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <NavButton active={view === "settings"} collapsed={collapsed && !compact} label="Settings" icon={<Settings2 className="size-4 shrink-0" />} onClick={() => goToView("settings")} />
        <div className="mt-2 flex items-center gap-3 px-2 py-2">
          <Avatar className="size-8 border border-border"><AvatarFallback className="bg-primary/15 text-xs text-primary">{initials(displayName)}</AvatarFallback></Avatar>
          {(!collapsed || compact) && <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{displayName}</p><p className="truncate text-[10px] text-muted-foreground">{email}</p></div>}
          {(!collapsed || compact) && <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="Sign out" title="Sign out" onClick={() => void signOut()}><LogOut className="size-4" /></Button>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh min-h-[640px] overflow-hidden bg-background text-foreground">
      <aside className={`hidden shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:block ${collapsed ? "w-[68px]" : "w-[244px]"}`}><NavContent /></aside>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[280px] border-sidebar-border bg-sidebar p-0"><SheetHeader className="sr-only"><SheetTitle>Workspace navigation</SheetTitle></SheetHeader><NavContent compact /></SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-3 sm:px-5">
          <Button variant="ghost" size="icon" className="size-9 md:hidden" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu className="size-4" /></Button>
          <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex"><span className="font-medium">TASKFORGE</span><span className="text-muted-foreground">/</span><span className="truncate text-muted-foreground">Personal workspace</span></div>
          <Button variant="outline" className="h-9 min-w-0 flex-1 justify-start gap-2 px-3 text-muted-foreground sm:ml-4 sm:max-w-lg" onClick={() => setSearchOpen(true)}><Search className="size-4 shrink-0" /><span className="truncate">Search tasks, tags, projects…</span><kbd className="ml-auto hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">Ctrl K</kbd></Button>
          <Button variant="ghost" size="icon" className="hidden size-9 sm:inline-flex" aria-label="Toggle focus mode" title={focusOnly ? "Exit focus mode" : "Focus mode"} onClick={() => { setFocusOnly(!focusOnly); if (!focusOnly) setView("tasks"); }}><Activity className={`size-4 ${focusOnly ? "text-primary" : ""}`} /></Button>
          <Button variant="ghost" size="icon" className="size-9" aria-label="Notifications and reminders" title="Notifications and reminders" onClick={() => setNotificationOpen(true)}><Bell className="size-4" /></Button>
          <Button className="hidden h-9 shrink-0 sm:inline-flex" onClick={openNewTask}><Plus className="size-4" /> Add task</Button>
          <Button variant="outline" size="icon" className="size-9 shrink-0 sm:hidden" aria-label="Add task" onClick={openNewTask}><Plus className="size-4" /></Button>
        </header>

        <main className="hide-scrollbar flex-1 overflow-auto">
          <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
            {loading ? <LoadingState /> : <>
              {view === "dashboard" && <DashboardContent tasks={liveTasks} stats={stats} displayName={firstName} dateLabel={todayLabel} openNewTask={openNewTask} openTask={openTask} setView={goToView} />}
              {view === "calendar" && <CalendarContent tasks={liveTasks} month={month} setMonth={setMonth} openTask={openTask} openNewTask={openNewTask} />}
              {view === "analytics" && <AnalyticsContent tasks={liveTasks} />}
              {view === "settings" && <SettingsContent email={email} profileName={profileName} setProfileName={setProfileName} profile={profile} saving={savingProfile} onSave={saveProfile} onSignOut={() => void signOut()} />}
              {view !== "dashboard" && view !== "calendar" && view !== "analytics" && view !== "settings" && <TaskListContent
                view={view}
                tasks={filteredTasks}
                allTasks={liveTasks}
                query={query}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                viewMode={viewMode}
                setViewMode={setViewMode}
                openNewTask={openNewTask}
                openTask={openTask}
                onComplete={toggleComplete}
                onStar={toggleStar}
                onDelete={moveToTrash}
                onRestore={restoreTask}
                onPermanentDelete={permanentlyDelete}
                onDuplicate={duplicateTask}
                onMove={moveTask}
                draggingTask={draggingTask}
                setDraggingTask={setDraggingTask}
              />}
            </>}
          </div>
        </main>
      </div>

      <TaskEditor open={editorOpen} task={editingTask} onClose={() => setEditorOpen(false)} onSave={saveTask} />

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="top-[18%] translate-y-0 border-border bg-card p-0 sm:max-w-xl">
          <DialogHeader className="sr-only"><DialogTitle>Search your workspace</DialogTitle><DialogDescription>Find tasks, tags, and projects.</DialogDescription></DialogHeader>
          <div className="flex items-center gap-3 border-b border-border px-4"><Search className="size-4 shrink-0 text-muted-foreground" /><Input ref={searchRef} className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" placeholder="Search tasks, tags, projects…" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { setSearchOpen(false); setView("tasks"); } }} /><kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">ESC</kbd></div>
          <div className="max-h-[55vh] overflow-auto p-2">{query.trim() ? <>{getVisibleTasks(tasks, { view: "tasks", query }).slice(0, 8).map((task) => <button key={task.id} type="button" className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted" onClick={() => { setSearchOpen(false); openTask(task); }}><Checkbox checked={task.completed} tabIndex={-1} aria-hidden="true" /><span className="min-w-0 flex-1 truncate">{task.title}</span><span className="text-xs text-muted-foreground">{task.project || task.priority}</span></button>)}{getVisibleTasks(tasks, { view: "tasks", query }).length === 0 && <p className="p-5 text-center text-sm text-muted-foreground">No matching tasks.</p>}</> : <div className="grid gap-1 p-2 text-xs text-muted-foreground"><p className="px-2 py-1 font-mono uppercase">Quick actions</p><button className="flex items-center gap-2 px-2 py-2 text-left hover:bg-muted" onClick={() => { setSearchOpen(false); openNewTask(); }}><Plus className="size-4" /> Create a task <kbd className="ml-auto">C</kbd></button><button className="flex items-center gap-2 px-2 py-2 text-left hover:bg-muted" onClick={() => { setSearchOpen(false); setView("today"); }}><CalendarDays className="size-4" /> Open today</button><button className="flex items-center gap-2 px-2 py-2 text-left hover:bg-muted" onClick={() => { setSearchOpen(false); setView("important"); }}><Star className="size-4" /> Open important tasks</button></div>}</div>
        </DialogContent>
      </Dialog>

      <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
        <DialogContent className="border-border bg-card sm:max-w-md"><DialogHeader><DialogTitle>Reminders</DialogTitle><DialogDescription>Upcoming reminders saved on your tasks.</DialogDescription></DialogHeader>
          <div className="max-h-72 space-y-2 overflow-auto">{tasks.filter((task) => !task.completed && !task.deleted_at && task.reminder_at).sort((a, b) => String(a.reminder_at).localeCompare(String(b.reminder_at))).slice(0, 8).map((task) => <div key={task.id} className="flex items-start gap-3 border-b border-border py-2"><Clock3 className="mt-0.5 size-4 text-primary" /><div className="min-w-0"><p className="truncate text-sm">{task.title}</p><p className="text-xs text-muted-foreground">{format(new Date(task.reminder_at as string), "EEE, MMM d · h:mm a")}</p></div></div>)}{tasks.filter((task) => !task.completed && !task.deleted_at && task.reminder_at).length === 0 && <EmptyState title="No reminders yet" description="Add a reminder while creating or editing a task." icon={<Bell className="size-5" />} />}</div>
          {typeof Notification !== "undefined" && <Button variant="outline" className="w-full" onClick={async () => { const permission = await Notification.requestPermission(); if (permission === "granted") toast.success("Browser reminders enabled while TASKFORGE is open"); else toast.error("Browser notifications were not enabled"); }}><Bell className="size-4" /> Enable browser alerts</Button>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavButton({ active, collapsed, label, icon, count, onClick }: { active: boolean; collapsed: boolean; label: string; icon: React.ReactNode; count?: number | null; onClick: () => void }) {
  return <Button variant="ghost" className={`h-9 w-full justify-start gap-3 px-2.5 text-sm ${active ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary" : "text-muted-foreground"}`} aria-current={active ? "page" : undefined} title={collapsed ? label : undefined} onClick={onClick}>
    {icon}{!collapsed && <><span className="flex-1 truncate text-left">{label}</span>{count !== null && count !== undefined && count > 0 && <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{count}</span>}</>}
  </Button>;
}

function DashboardContent({ tasks, stats, displayName, dateLabel, openNewTask, openTask, setView }: { tasks: Task[]; stats: ReturnType<typeof getTaskStats>; displayName: string; dateLabel: string; openNewTask: () => void; openTask: (task: Task) => void; setView: (view: WorkspaceView) => void }) {
  const percent = getCompletionPercent(stats);
  const todayTasks = tasks.filter((task) => task.due_at && localDateKey(new Date(task.due_at)) === localDateKey(new Date())).sort((a, b) => String(a.due_at).localeCompare(String(b.due_at)));
  const recent = tasks.filter((task) => !task.completed).slice(0, 5);
  const upcoming = tasks.filter((task) => !task.completed && task.due_at && new Date(task.due_at).getTime() >= Date.now()).sort((a, b) => String(a.due_at).localeCompare(String(b.due_at))).slice(0, 4);
  const important = tasks.filter((task) => !task.completed && task.starred).slice(0, 4);

  return <div className="space-y-5">
    <section className="flex flex-col gap-4 border border-border bg-card px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="font-mono text-[11px] uppercase text-primary">{dateLabel}</p><h1 className="mt-2 text-2xl font-semibold">Good {getTimeGreeting()}, {displayName}.</h1><p className="mt-1 text-sm text-muted-foreground">Let's make today productive.</p></div>
      <div className="flex items-center gap-2"><Button variant="outline" onClick={() => setView("today")}><CalendarDays className="size-4" /> Today</Button><Button onClick={openNewTask}><Plus className="size-4" /> Quick add</Button></div>
    </section>

    <section className="border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-medium">Daily completion</p><p className="mt-1 text-xs text-muted-foreground">{stats.completed} of {stats.total} tasks completed</p></div><div className="text-2xl font-semibold text-primary">{percent}%</div></div>
      <Progress value={percent} className="mt-4 h-2" />
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span><span className="mr-1.5 inline-block size-2 rounded-full bg-primary" />{stats.pending} pending</span><span><span className="mr-1.5 inline-block size-2 rounded-full bg-success" />{stats.completed} completed</span><span className="text-destructive">{stats.overdue} overdue</span></div>
    </section>

    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard label="Total tasks" value={stats.total} icon={<ListTodo className="size-4" />} detail="In your workspace" onClick={() => setView("tasks")} />
      <StatCard label="Completed" value={stats.completed} icon={<CheckCheck className="size-4" />} detail={`${percent}% completion`} tone="success" onClick={() => setView("completed")} />
      <StatCard label="Pending" value={stats.pending} icon={<Clock3 className="size-4" />} detail="Still to do" onClick={() => setView("tasks")} />
      <StatCard label="Overdue" value={stats.overdue} icon={<Activity className="size-4" />} detail={stats.overdue ? "Needs attention" : "You're up to date"} tone={stats.overdue ? "danger" : "success"} onClick={() => setView("today")} />
    </section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
      <div className="min-w-0 space-y-5">
        <div className="border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><h2 className="text-sm font-medium">Today's priority queue</h2><p className="mt-0.5 text-xs text-muted-foreground">{todayTasks.length} tasks due today</p></div><Button variant="ghost" size="sm" className="text-primary" onClick={() => setView("today")}>View all <ChevronRight className="size-4" /></Button></div>
          <div>{todayTasks.length ? todayTasks.slice(0, 5).map((task) => <DashboardTask key={task.id} task={task} openTask={openTask} />) : <EmptyState title="Nothing due today" description="Add a task or enjoy a little breathing room." icon={<CheckCheck className="size-5" />} action={<Button variant="outline" size="sm" onClick={openNewTask}><Plus className="size-4" /> Add a task</Button>} />}</div>
        </div>
        <div className="border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><h2 className="text-sm font-medium">Recently added</h2><p className="mt-0.5 text-xs text-muted-foreground">Your latest open tasks</p></div><Button variant="ghost" size="icon" className="size-8" aria-label="Open all tasks" onClick={() => setView("tasks")}><ArrowUp className="size-4" /></Button></div>
          <div>{recent.length ? recent.map((task) => <DashboardTask key={task.id} task={task} openTask={openTask} />) : <EmptyState title="Your task list is clear" description="Create a task to get started." icon={<ListTodo className="size-5" />} action={<Button size="sm" onClick={openNewTask}><Plus className="size-4" /> Create task</Button>} />}</div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="border border-border bg-card p-4">
          <div className="flex items-center justify-between"><div><h2 className="text-sm font-medium">Coming up</h2><p className="mt-1 text-xs text-muted-foreground">Next deadlines</p></div><Clock3 className="size-4 text-primary" /></div>
          <div className="mt-3 space-y-1">{upcoming.length ? upcoming.map((task) => <button key={task.id} type="button" onClick={() => openTask(task)} className="flex w-full items-center gap-3 border-b border-border py-2.5 text-left last:border-0"><span className="grid size-8 shrink-0 place-items-center border border-border font-mono text-[10px] text-primary">{format(new Date(task.due_at as string), "dd")}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{task.title}</span><span className="text-[11px] text-muted-foreground">{format(new Date(task.due_at as string), "EEE, MMM d")}</span></span><ChevronRight className="size-3.5 text-muted-foreground" /></button>) : <p className="py-5 text-center text-xs text-muted-foreground">No upcoming deadlines.</p>}</div>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="flex items-center justify-between"><div><h2 className="text-sm font-medium">Important</h2><p className="mt-1 text-xs text-muted-foreground">Starred tasks to keep close</p></div><Star className="size-4 text-primary" /></div>
          <div className="mt-3 space-y-1">{important.length ? important.map((task) => <button key={task.id} type="button" onClick={() => openTask(task)} className="flex w-full items-center gap-2 border-b border-border py-2.5 text-left last:border-0"><Star className="size-3.5 shrink-0 text-primary" /><span className="truncate text-xs">{task.title}</span></button>) : <p className="py-5 text-center text-xs text-muted-foreground">Star a task to pin it here.</p>}</div>
        </div>
      </div>
    </section>
  </div>;
}

function TaskListContent(props: {
  view: WorkspaceView; tasks: Task[]; allTasks: Task[]; query: string; priorityFilter: string; setPriorityFilter: (value: string) => void;
  viewMode: "list" | "kanban" | "calendar"; setViewMode: (value: "list" | "kanban" | "calendar") => void; openNewTask: () => void; openTask: (task: Task) => void;
  onComplete: (task: Task) => void; onStar: (task: Task) => void; onDelete: (task: Task) => void; onRestore: (task: Task) => void;
  onPermanentDelete: (task: Task) => void; onDuplicate: (task: Task) => void; onMove: (task: Task, status: string) => void;
  draggingTask: string | null; setDraggingTask: (id: string | null) => void;
}) {
  const { view, tasks, allTasks } = props;
  const [selected, setSelected] = useState<string[]>([]);
  const [grouped, setGrouped] = useState(true);
  const title = PAGE_TITLES[view];
  const priorityCount = tasks.filter((task) => task.priority === "urgent" || task.priority === "high").length;

  const bulkComplete = async () => {
    if (!selected.length) return;
    const { error } = await supabase.from("tasks").update({ completed: true, completed_at: new Date().toISOString(), status: "done" }).in("id", selected);
    if (error) toast.error("Selected tasks could not be completed");
    else { toast.success(`${selected.length} tasks completed`); setSelected([]); window.location.reload(); }
  };

  const rows = (items: Task[]) => items.map((task) => <TaskRow key={task.id} task={task} onComplete={props.onComplete} onStar={props.onStar} onEdit={props.openTask} onDelete={props.onDelete} onRestore={props.onRestore} onPermanentDelete={props.onPermanentDelete} onDuplicate={props.onDuplicate} />);

  const toggleSelected = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return <div className="space-y-5">
    <section className="flex flex-col gap-4 border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-mono text-[10px] uppercase text-primary">Personal workspace</p><h1 className="mt-1 text-xl font-semibold">{title}</h1><p className="mt-1 text-xs text-muted-foreground">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}{view === "trash" ? " in Trash" : " in your workspace"}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center border border-border p-0.5">
          <ViewModeButton active={props.viewMode === "list"} label="List" icon={<ClipboardList className="size-3.5" />} onClick={() => props.setViewMode("list")} />
          {view === "tasks" && <ViewModeButton active={props.viewMode === "kanban"} label="Board" icon={<FolderKanban className="size-3.5" />} onClick={() => props.setViewMode("kanban")} />}
          <ViewModeButton active={props.viewMode === "calendar"} label="Calendar" icon={<CalendarDays className="size-3.5" />} onClick={() => { props.setViewMode("calendar"); }} />
        </div>
        <Select value={props.priorityFilter} onValueChange={props.setPriorityFilter}><SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All priorities" /></SelectTrigger><SelectContent><SelectItem value="all">All priorities</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select>
        <Button variant="outline" size="sm" className="h-8" onClick={() => setGrouped(!grouped)}><MoreHorizontal className="size-3.5" /> {grouped ? "Ungroup" : "Group"}</Button>
        {view === "trash" ? null : <Button size="sm" className="h-8" onClick={props.openNewTask}><Plus className="size-4" /> New task</Button>}
      </div>
    </section>

    <div className="flex flex-wrap items-center gap-2">
      {[{ label: "All tasks", count: allTasks.filter((task) => !task.completed).length, active: true }, { label: "High priority", count: priorityCount, active: false }, { label: "Starred", count: allTasks.filter((task) => task.starred && !task.completed).length, active: false }, { label: "Due today", count: allTasks.filter((task) => task.due_at && localDateKey(new Date(task.due_at)) === localDateKey(new Date())).length, active: false }].map((item) => <span key={item.label} className={`border px-2 py-1 text-[11px] ${item.active ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{item.label} <span className="ml-1 font-mono">{item.count}</span></span>)}
      {selected.length > 0 && <><span className="ml-auto text-xs text-muted-foreground">{selected.length} selected</span><Button size="sm" variant="outline" className="h-7" onClick={() => void bulkComplete()}><Check className="size-3.5" /> Complete selected</Button><Button size="icon" variant="ghost" className="size-7" aria-label="Clear selection" onClick={() => setSelected([])}><X className="size-4" /></Button></>}
    </div>

    {props.viewMode === "kanban" && view === "tasks" ? <KanbanView tasks={tasks.filter((task) => !task.completed)} openTask={props.openTask} onMove={props.onMove} openNewTask={props.openNewTask} draggingTask={props.draggingTask} setDraggingTask={props.setDraggingTask} /> : props.viewMode === "calendar" ? <CalendarContent tasks={tasks} month={startOfMonth(new Date())} setMonth={() => {}} openTask={props.openTask} openNewTask={props.openNewTask} /> : tasks.length === 0 ? <EmptyState title={view === "trash" ? "Trash is empty" : view === "completed" ? "No completed tasks yet" : "Nothing here yet"} description={view === "trash" ? "Deleted tasks will appear here so you can restore them." : "Create a task to start building your list."} icon={view === "trash" ? <Trash2 className="size-5" /> : <ListTodo className="size-5" />} action={view !== "trash" && <Button size="sm" onClick={props.openNewTask}><Plus className="size-4" /> Create task</Button>} /> : grouped && view !== "trash" ? <div className="space-y-4">{["urgent", "high", "medium", "low"].map((priority) => { const group = tasks.filter((task) => task.priority === priority); if (!group.length) return null; return <section key={priority} className="border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-4 py-3"><div className="flex items-center gap-2"><PriorityMark priority={priority} /><h2 className="text-xs font-medium capitalize">{priority} priority</h2><Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{group.length}</Badge></div><Button variant="ghost" size="icon" className="size-7" aria-label={`Select all ${priority} tasks`} onClick={() => setSelected((current) => [...new Set([...current, ...group.map((task) => task.id)])])}><Checkbox checked={group.every((task) => selected.includes(task.id))} aria-label={`Select ${priority} tasks`} /></Button></div><div>{group.map((task) => <div key={task.id} className="flex items-center"><Checkbox className="ml-4" checked={selected.includes(task.id)} onCheckedChange={() => toggleSelected(task.id)} aria-label={`Select ${task.title}`} /> <div className="min-w-0 flex-1">{rows([task])}</div></div>)}</div></section>; })}</div> : <section className="border border-border bg-card">{view === "trash" && <div className="border-b border-border px-4 py-3 text-xs text-muted-foreground">Items in Trash can be restored or permanently deleted.</div>}{rows(tasks)}</section>}
  </div>;
}

function CalendarContent({ tasks, month, setMonth, openTask, openNewTask }: { tasks: Task[]; month: Date; setMonth: (date: Date) => void; openTask: (task: Task) => void; openNewTask: () => void }) {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7;
  const days = Array.from({ length: Math.ceil((offset + endOfMonth(month).getDate()) / 7) * 7 }, (_, index) => addDays(first, index - offset));
  const dueByDay = new Map<string, Task[]>();
  tasks.forEach((task) => { if (!task.due_at || task.completed || task.deleted_at) return; const key = localDateKey(new Date(task.due_at)); dueByDay.set(key, [...(dueByDay.get(key) ?? []), task]); });

  return <div className="space-y-5">
    <section className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card p-4"><div><p className="font-mono text-[10px] uppercase text-primary">Plan your time</p><h1 className="mt-1 text-xl font-semibold">Calendar</h1></div><div className="flex items-center gap-2"><Button variant="outline" size="icon" className="size-8" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="size-4" /></Button><span className="min-w-32 text-center text-sm font-medium">{format(month, "MMMM yyyy")}</span><Button variant="outline" size="icon" className="size-8" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="size-4" /></Button><Button size="sm" onClick={openNewTask}><Plus className="size-4" /> Add task</Button></div></section>
    <section className="border border-border bg-card p-3 sm:p-5">
      <div className="grid grid-cols-7 border-b border-border pb-2">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <p key={day} className="px-1 py-2 text-center font-mono text-[10px] uppercase text-muted-foreground sm:text-xs">{day}</p>)}</div>
      <div className="grid grid-cols-7">{days.map((date) => { const dayTasks = dueByDay.get(localDateKey(date)) ?? []; const sameMonth = date.getMonth() === month.getMonth(); return <div key={date.toISOString()} className={`min-h-24 border-b border-r border-border p-1.5 sm:min-h-32 sm:p-2 ${sameMonth ? "" : "opacity-40"} ${isSameDay(date, new Date()) ? "bg-primary/5" : ""}`}><div className="flex items-center justify-between"><span className={`grid size-6 place-items-center font-mono text-xs ${isSameDay(date, new Date()) ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{format(date, "d")}</span>{dayTasks.length > 0 && <span className="font-mono text-[10px] text-primary">{dayTasks.length}</span>}</div><div className="mt-1 space-y-1">{dayTasks.slice(0, 3).map((task) => <button key={task.id} type="button" onClick={() => openTask(task)} className="block w-full truncate border-l-2 border-primary bg-primary/10 px-1 py-0.5 text-left text-[10px] text-foreground sm:text-xs">{task.title}</button>)}{dayTasks.length > 3 && <span className="block text-[10px] text-muted-foreground">+{dayTasks.length - 3} more</span>}</div></div>; })}</div>
    </section>
  </div>;
}

function AnalyticsContent({ tasks }: { tasks: Task[] }) {
  const completed = tasks.filter((task) => task.completed);
  const percentage = getCompletionPercent({ total: tasks.length, completed: completed.length });
  const lastSeven = Array.from({ length: 7 }, (_, index) => addDays(new Date(), index - 6));
  const bars = lastSeven.map((date) => ({ date, count: completed.filter((task) => task.completed_at && isSameDay(new Date(task.completed_at), date)).length }));
  const overdue = tasks.filter((task) => !task.completed && task.due_at && new Date(task.due_at).getTime() < Date.now()).length;
  const priorities = ["urgent", "high", "medium", "low"].map((priority) => ({ priority, count: tasks.filter((task) => task.priority === priority && !task.completed).length }));
  const maxBar = Math.max(1, ...bars.map((day) => day.count));
  return <div className="space-y-5">
    <section className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] uppercase text-primary">Personal workspace</p><h1 className="mt-1 text-xl font-semibold">Productivity analytics</h1><p className="mt-1 text-sm text-muted-foreground">A clear look at your task flow, built from your saved work.</p></div><Badge variant="outline" className="gap-1.5"><span className="size-1.5 rounded-full bg-success" /> Live from your tasks</Badge></section>
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4"><StatCard label="Completion rate" value={`${percentage}%`} icon={<TrendingUp className="size-4" />} detail={`${completed.length} completed`} tone="success" /><StatCard label="Open tasks" value={tasks.filter((task) => !task.completed).length} icon={<ListTodo className="size-4" />} detail="In your workspace" /><StatCard label="Overdue tasks" value={overdue} icon={<Clock3 className="size-4" />} detail={overdue ? "Needs attention" : "Nothing overdue"} tone={overdue ? "danger" : "success"} /><StatCard label="Starred" value={tasks.filter((task) => task.starred && !task.completed).length} icon={<Star className="size-4" />} detail="Marked important" /></section>
    <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
      <div className="border border-border bg-card p-5"><div><h2 className="text-sm font-medium">Tasks completed this week</h2><p className="mt-1 text-xs text-muted-foreground">Completed tasks by day</p></div><div className="mt-7 flex h-52 items-end gap-3 border-b border-border px-2">{bars.map((day) => <div key={day.date.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="font-mono text-[10px] text-muted-foreground">{day.count || ""}</span><div className="w-full max-w-10 bg-primary/80 transition-[height]" style={{ height: `${Math.max(day.count ? 8 : 2, day.count / maxBar * 76)}%` }} /><span className="pb-2 font-mono text-[10px] text-muted-foreground">{format(day.date, "EEE")}</span></div>)}</div></div>
      <div className="border border-border bg-card p-5"><h2 className="text-sm font-medium">Open tasks by priority</h2><p className="mt-1 text-xs text-muted-foreground">Where your attention is going</p><div className="mt-6 space-y-5">{priorities.map(({ priority, count }) => <div key={priority}><div className="mb-2 flex justify-between text-xs"><span className="capitalize text-muted-foreground">{priority}</span><span className="font-mono">{count}</span></div><Progress value={tasks.length ? count / tasks.length * 100 : 0} className={`h-1.5 ${priority === "urgent" ? "[&>div]:bg-destructive" : priority === "high" ? "[&>div]:bg-warning" : ""}`} /></div>)}</div></div>
    </section>
    <section className="border border-border bg-card p-5"><h2 className="text-sm font-medium">Focus cadence</h2><p className="mt-1 text-xs text-muted-foreground">Your completed work across the last 30 days.</p><div className="mt-5 grid grid-cols-10 gap-1.5 sm:grid-cols-15 md:grid-cols-20">{Array.from({ length: 30 }, (_, index) => { const date = addDays(new Date(), index - 29); const count = completed.filter((task) => task.completed_at && isSameDay(new Date(task.completed_at), date)).length; return <div key={date.toISOString()} title={`${format(date, "MMM d")}: ${count} completed`} className={`aspect-square border ${count ? "border-primary/30 bg-primary/50" : "border-border bg-muted/50"}`} />; })}</div><div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground"><span>{completed.length} completed overall</span><span>{tasks.length} tasks tracked</span></div></section>
  </div>;
}

function SettingsContent({ email, profileName, setProfileName, profile, saving, onSave, onSignOut }: { email: string; profileName: string; setProfileName: (name: string) => void; profile: Profile | null; saving: boolean; onSave: (event: React.FormEvent<HTMLFormElement>) => void; onSignOut: () => void }) {
  return <div className="mx-auto max-w-2xl space-y-5"><section><p className="font-mono text-[10px] uppercase text-primary">Your workspace</p><h1 className="mt-1 text-xl font-semibold">Settings</h1><p className="mt-1 text-sm text-muted-foreground">Manage your profile and account.</p></section>
    <section className="border border-border bg-card p-5"><div className="mb-5 flex items-center gap-3"><Avatar className="size-12"><AvatarFallback className="bg-primary/15 text-primary">{initials(profileName || email)}</AvatarFallback></Avatar><div><h2 className="text-sm font-medium">Personal profile</h2><p className="text-xs text-muted-foreground">Updated {profile ? format(new Date(profile.updated_at), "MMM d, yyyy") : "when you save changes"}</p></div></div><form onSubmit={onSave} className="space-y-4"><div className="space-y-2"><label htmlFor="settings-name" className="text-sm font-medium">Display name</label><Input id="settings-name" value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Your name" maxLength={80} /></div><div className="space-y-2"><label htmlFor="settings-email" className="text-sm font-medium">Email</label><Input id="settings-email" value={email} disabled /><p className="text-xs text-muted-foreground">Your sign-in email is managed by your account.</p></div><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button></form></section>
    <section className="flex items-start gap-3 border border-border bg-card p-5"><ShieldCheck className="mt-0.5 size-5 text-success" /><div><h2 className="text-sm font-medium">Private by design</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Your tasks and profile are only available to your signed-in account.</p></div></section>
    <section className="border border-destructive/30 bg-card p-5"><h2 className="text-sm font-medium">Account</h2><p className="mt-1 text-xs text-muted-foreground">Sign out of this TASKFORGE workspace on this device.</p><Button variant="outline" className="mt-4 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={onSignOut}><LogOut className="size-4" /> Sign out</Button></section>
  </div>;
}

function KanbanView({ tasks, openTask, onMove, openNewTask, draggingTask, setDraggingTask }: { tasks: Task[]; openTask: (task: Task) => void; onMove: (task: Task, status: string) => void; openNewTask: () => void; draggingTask: string | null; setDraggingTask: (id: string | null) => void }) {
  return <div className="grid gap-4 lg:grid-cols-4">{COLUMNS.map((column) => { const cards = tasks.filter((task) => task.status === column.id); return <section key={column.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const task = tasks.find((item) => item.id === draggingTask); if (task) onMove(task, column.id); setDraggingTask(null); }} className={`min-h-56 border border-border bg-card/50 ${draggingTask ? "border-dashed border-primary/50" : ""}`}><div className="flex items-center justify-between border-b border-border px-3 py-3"><div className="flex items-center gap-2"><span className={`size-2 rounded-full bg-current ${column.className}`} /><h2 className="text-xs font-medium">{column.title}</h2><span className="font-mono text-[10px] text-muted-foreground">{cards.length}</span></div><Button variant="ghost" size="icon" className="size-7" title={`Add task to ${column.title}`} aria-label={`Add task to ${column.title}`} onClick={openNewTask}><Plus className="size-4" /></Button></div><div className="space-y-2 p-2">{cards.map((task) => <button key={task.id} type="button" draggable onDragStart={() => setDraggingTask(task.id)} onDragEnd={() => setDraggingTask(null)} onClick={() => openTask(task)} className="block w-full cursor-grab border border-border bg-card p-3 text-left active:cursor-grabbing"><p className="line-clamp-2 text-xs font-medium">{task.title}</p><div className="mt-3 flex flex-wrap gap-1">{task.project && <Badge variant="secondary" className="max-w-24 truncate px-1.5 py-0 text-[9px]">{task.project}</Badge>}<PriorityMark priority={task.priority} /></div>{task.subtasks.length > 0 && <p className="mt-3 text-[10px] text-muted-foreground">{task.subtasks.filter((item) => item.completed).length}/{task.subtasks.length} subtasks</p>}{task.due_at && <p className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground"><Clock3 className="size-3" />{format(new Date(task.due_at), "MMM d")}</p>}</button>)}{cards.length === 0 && <p className="px-2 py-8 text-center text-[11px] text-muted-foreground">Drop tasks here</p>}</div></section>; })}</div>;
}

function StatCard({ label, value, icon, detail, tone = "default", onClick }: { label: string; value: string | number; icon: React.ReactNode; detail: string; tone?: "default" | "success" | "danger"; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className={`border border-border bg-card p-4 text-left transition-colors ${onClick ? "cursor-pointer hover:border-primary/40" : "cursor-default"}`}><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{label}</span><span className={`${tone === "success" ? "text-success" : tone === "danger" ? "text-destructive" : "text-primary"}`}>{icon}</span></div><div className={`mt-3 text-2xl font-semibold ${tone === "success" ? "text-success" : tone === "danger" ? "text-destructive" : ""}`}>{value}</div><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></button>;
}

function DashboardTask({ task, openTask }: { task: Task; openTask: (task: Task) => void }) {
  return <button type="button" onClick={() => openTask(task)} className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-muted/40"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${task.priority === "urgent" ? "bg-destructive" : task.priority === "high" ? "bg-warning" : "bg-primary"}`} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{task.title}</span><span className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">{task.project && <span className="truncate">{task.project}</span>}{task.due_at && <><span>·</span><span>{format(new Date(task.due_at), "h:mm a")}</span></>}</span></span><PriorityMark priority={task.priority} /></button>;
}

function PriorityMark({ priority }: { priority: string }) {
  const color = priority === "urgent" ? "bg-destructive" : priority === "high" ? "bg-warning" : priority === "medium" ? "bg-primary" : "bg-muted-foreground";
  return <span title={`${priority} priority`} className={`size-2 shrink-0 rounded-full ${color}`} />;
}

function ViewModeButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return <Button variant="ghost" size="sm" className={`h-7 gap-1.5 px-2 text-[11px] ${active ? "bg-muted text-foreground" : "text-muted-foreground"}`} onClick={onClick}>{icon}<span className="hidden sm:inline">{label}</span></Button>;
}

function EmptyState({ title, description, icon, action }: { title: string; description: string; icon: React.ReactNode; action?: React.ReactNode }) {
  return <div className="flex flex-col items-center justify-center px-5 py-12 text-center"><div className="mb-3 grid size-10 place-items-center border border-border bg-muted text-primary">{icon}</div><h3 className="text-sm font-medium">{title}</h3><p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

function LoadingState() {
  return <div className="space-y-5 animate-pulse"><div className="h-28 border border-border bg-card" /><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-28 border border-border bg-card" />)}</div><div className="h-72 border border-border bg-card" /></div>;
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

function initials(value: string) {
  return value.split(/\s+/).map((piece) => piece[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "TF";
}