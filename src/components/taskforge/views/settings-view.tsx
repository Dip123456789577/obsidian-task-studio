import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Bell,
  Check,
  Download,
  FileJson,
  FileSpreadsheet,
  Globe,
  KeyRound,
  LogOut,
  Moon,
  Palette,
  ShieldCheck,
  Sliders,
  Sun,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import type {
  CategoryMeta,
  ProjectMeta,
  Task,
  UserPreferences,
  ViewMode,
  TaskPriority,
} from "../types";
import { TaskforgeStorage } from "../storage-service";
import { toast } from "sonner";

type SettingsViewProps = {
  email: string;
  displayName: string;
  preferences: UserPreferences;
  tasks: Task[];
  projects: ProjectMeta[];
  categories: CategoryMeta[];
  onUpdateDisplayName: (newName: string) => Promise<void>;
  onUpdatePreferences: (newPrefs: UserPreferences) => void;
  onRefreshData: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

const ACCENT_COLORS = [
  { id: "purple", label: "Obsidian Purple", hex: "#A78BFA" },
  { id: "emerald", label: "Emerald Green", hex: "#4ADE80" },
  { id: "cyan", label: "Cyan Sapphire", hex: "#38BDF8" },
  { id: "amber", label: "Amber Glow", hex: "#FBBF24" },
  { id: "rose", label: "Crimson Rose", hex: "#F87171" },
] as const;

export function SettingsView({
  email,
  displayName,
  preferences,
  tasks,
  projects,
  categories,
  onUpdateDisplayName,
  onUpdatePreferences,
  onRefreshData,
  onSignOut,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<
    "account" | "appearance" | "preferences" | "notifications" | "data"
  >("account");

  const [nameInput, setNameInput] = useState(displayName);
  const [savingName, setSavingName] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      await onUpdateDisplayName(nameInput.trim());
      toast.success("Profile display name updated.");
    } catch {
      toast.error("Could not update name.");
    } finally {
      setSavingName(false);
    }
  };

  const patchPref = <K extends keyof UserPreferences>(key: K, val: UserPreferences[K]) => {
    const updated = { ...preferences, [key]: val };
    onUpdatePreferences(updated);
    toast.success("Preferences saved");
  };

  const handleExport = (format: "json" | "csv") => {
    const content = TaskforgeStorage.exportData(tasks, projects, categories, format);
    const mime = format === "json" ? "application/json" : "text/csv;charset=utf-8;";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `taskforge-export-${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${tasks.length} tasks to ${format.toUpperCase()}`);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const res = await TaskforgeStorage.importData(text, email);
        await onRefreshData();
        toast.success(`Successfully restored ${res.importedCount} tasks from JSON.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error("Import failed: " + msg);
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    await TaskforgeStorage.clearAllData(email);
    await onRefreshData();
    setClearDialogOpen(false);
    toast.success("Workspace data cleared.");
  };

  const requestBrowserPermission = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Notifications not supported on this browser.");
      return;
    }
    const res = await Notification.requestPermission();
    if (res === "granted") {
      patchPref("browserNotifications", true);
      toast.success("Browser notifications authorized.");
    } else {
      patchPref("browserNotifications", false);
      toast.error("Permission was not granted.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <span className="font-mono text-xs uppercase tracking-wider text-primary">
          Workspace Configuration
        </span>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          Settings & Preferences
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Customize your workspace aesthetics, notification cadence, and account security.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-border/80 gap-1 overflow-x-auto hide-scrollbar">
        {[
          { id: "account", label: "Account", icon: User },
          { id: "appearance", label: "Appearance", icon: Palette },
          { id: "preferences", label: "Preferences", icon: Sliders },
          { id: "notifications", label: "Notifications", icon: Bell },
          { id: "data", label: "Data Management", icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors shrink-0 ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Account Tab */}
      {activeTab === "account" && (
        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Personal Profile</h3>
            <p className="text-xs text-muted-foreground">
              Update how your name appears on the dashboard and shared reports.
            </p>

            <form onSubmit={handleSaveName} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Display Name</Label>
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-secondary/40 border-border text-xs"
                  maxLength={60}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email Account</Label>
                <Input
                  value={email}
                  disabled
                  className="bg-secondary/20 border-border text-xs opacity-75 font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  Primary account identity verified by Supabase Auth.
                </p>
              </div>

              <Button
                type="submit"
                disabled={savingName}
                size="sm"
                className="bg-primary text-primary-foreground text-xs"
              >
                {savingName ? "Saving…" : "Save Changes"}
              </Button>
            </form>
          </section>

          {/* Security & Sign Out */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Session & Security</h3>
                <p className="text-xs text-muted-foreground">
                  Owner-scoped access enforced with Row Level Security.
                </p>
              </div>
              <ShieldCheck className="size-5 text-success" />
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 text-xs"
                onClick={() => void onSignOut()}
              >
                <LogOut className="size-3.5" />
                Sign Out of Workspace
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* 2. Appearance Tab */}
      {activeTab === "appearance" && (
        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Theme Mode</h3>
            <p className="text-xs text-muted-foreground">
              Select your ambient environment. TASKFORGE is fine-tuned for Obsidian Dark.
            </p>

            <div className="grid grid-cols-3 gap-3 max-w-md">
              {(["dark", "light", "system"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => patchPref("theme", t)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-xs capitalize transition-all ${
                    preferences.theme === t
                      ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40"
                      : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "dark" ? (
                    <Moon className="size-4" />
                  ) : t === "light" ? (
                    <Sun className="size-4" />
                  ) : (
                    <Globe className="size-4" />
                  )}
                  {t}
                </button>
              ))}
            </div>
          </section>

          {/* Accent Color */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Accent Color</h3>
            <p className="text-xs text-muted-foreground">
              Choose your primary highlight color across badges, charts, and focus elements.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {ACCENT_COLORS.map((accent) => (
                <button
                  key={accent.id}
                  type="button"
                  onClick={() =>
                    patchPref("accentColor", accent.id as UserPreferences["accentColor"])
                  }
                  className={`flex items-center gap-3 rounded-lg border p-3 text-xs text-left transition-all ${
                    preferences.accentColor === accent.id
                      ? "border-primary bg-secondary text-foreground font-semibold ring-1 ring-primary/40"
                      : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className="size-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: accent.hex }}
                  />
                  <span className="flex-1">{accent.label}</span>
                  {preferences.accentColor === accent.id && (
                    <Check className="size-3.5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Density */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Layout Density</h3>
            <p className="text-xs text-muted-foreground">
              Adjust spacing and padding for maximum information density or breathing room.
            </p>

            <div className="flex gap-3 max-w-xs">
              {(["comfortable", "compact"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => patchPref("density", d)}
                  className={`flex-1 rounded-lg border py-2 text-xs capitalize transition-all font-medium ${
                    preferences.density === d
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 3. Preferences Tab */}
      {activeTab === "preferences" && (
        <section className="rounded-xl border border-border bg-card p-5 space-y-5">
          <h3 className="text-sm font-semibold text-foreground">Defaults & Formats</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
            {/* Date format */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Date Format</Label>
              <Select
                value={preferences.dateFormat}
                onValueChange={(val) =>
                  patchPref("dateFormat", val as UserPreferences["dateFormat"])
                }
              >
                <SelectTrigger className="h-8.5 bg-secondary/40 border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="YYYY-MM-DD" className="text-xs font-mono">
                    YYYY-MM-DD (2026-11-07)
                  </SelectItem>
                  <SelectItem value="MM/DD/YYYY" className="text-xs font-mono">
                    MM/DD/YYYY (11/07/2026)
                  </SelectItem>
                  <SelectItem value="DD/MM/YYYY" className="text-xs font-mono">
                    DD/MM/YYYY (07/11/2026)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time format */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Time Format</Label>
              <Select
                value={preferences.timeFormat}
                onValueChange={(val) =>
                  patchPref("timeFormat", val as UserPreferences["timeFormat"])
                }
              >
                <SelectTrigger className="h-8.5 bg-secondary/40 border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="12h" className="text-xs">
                    12-Hour (e.g. 5:30 PM)
                  </SelectItem>
                  <SelectItem value="24h" className="text-xs">
                    24-Hour (e.g. 17:30)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Week start */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">First Day of Week</Label>
              <Select
                value={preferences.weekStart}
                onValueChange={(val) => patchPref("weekStart", val as UserPreferences["weekStart"])}
              >
                <SelectTrigger className="h-8.5 bg-secondary/40 border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="monday" className="text-xs">
                    Monday
                  </SelectItem>
                  <SelectItem value="sunday" className="text-xs">
                    Sunday
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Default View */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Default Workspace View</Label>
              <Select
                value={preferences.defaultView}
                onValueChange={(val) =>
                  patchPref("defaultView", val as UserPreferences["defaultView"])
                }
              >
                <SelectTrigger className="h-8.5 bg-secondary/40 border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="list" className="text-xs">
                    List View
                  </SelectItem>
                  <SelectItem value="kanban" className="text-xs">
                    Kanban Board
                  </SelectItem>
                  <SelectItem value="calendar" className="text-xs">
                    Calendar View
                  </SelectItem>
                  <SelectItem value="grid" className="text-xs">
                    Grid Cards
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      )}

      {/* 4. Notifications Tab */}
      {activeTab === "notifications" && (
        <section className="rounded-xl border border-border bg-card p-5 space-y-5">
          <h3 className="text-sm font-semibold text-foreground">Reminders & Alerts</h3>
          <p className="text-xs text-muted-foreground">
            Configure how and when TASKFORGE notifies you of approaching deadlines.
          </p>

          <div className="space-y-4 max-w-lg">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <p className="text-xs font-medium text-foreground">In-App Reminders</p>
                <p className="text-[11px] text-muted-foreground">
                  Show notifications in the top bar bell icon when deadlines arrive.
                </p>
              </div>
              <Switch
                checked={preferences.inAppReminders}
                onCheckedChange={(checked) => patchPref("inAppReminders", checked)}
              />
            </div>

            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <p className="text-xs font-medium text-foreground">Desktop Browser Alerts</p>
                <p className="text-[11px] text-muted-foreground">
                  Send system notifications when TASKFORGE is open in the background.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={requestBrowserPermission}
              >
                {preferences.browserNotifications ? "Authorized" : "Authorize"}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* 5. Data Management Tab */}
      {activeTab === "data" && (
        <div className="space-y-5">
          {/* Export */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Data Export</h3>
            <p className="text-xs text-muted-foreground">
              Download your entire productivity dataset for local backups or spreadsheet analysis.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8.5 gap-2 text-xs"
                onClick={() => handleExport("json")}
              >
                <FileJson className="size-3.5 text-primary" />
                Export JSON (Full Backup)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8.5 gap-2 text-xs"
                onClick={() => handleExport("csv")}
              >
                <FileSpreadsheet className="size-3.5 text-success" />
                Export CSV (Spreadsheet)
              </Button>
            </div>
          </section>

          {/* Import */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Restore from Backup</h3>
            <p className="text-xs text-muted-foreground">
              Upload a valid TASKFORGE JSON backup file to merge or restore your data.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportFile}
            />

            <Button
              variant="outline"
              size="sm"
              disabled={importing}
              className="h-8.5 gap-2 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-3.5" />
              {importing ? "Importing…" : "Upload JSON Backup"}
            </Button>
          </section>

          {/* Danger Zone */}
          <section className="rounded-xl border border-destructive/30 bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
            <p className="text-xs text-muted-foreground">
              Permanently wipe all tasks, subtasks, projects, and categories from this workspace.
            </p>

            <Button
              variant="outline"
              size="sm"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs"
              onClick={() => setClearDialogOpen(true)}
            >
              <Trash2 className="size-3.5 mr-1.5" /> Clear All Workspace Data
            </Button>
          </section>
        </div>
      )}

      {/* Confirmation Dialog for Clearing Data */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="max-w-md border-border bg-card p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="size-5" />
              <DialogTitle className="text-base font-semibold">Clear All Data?</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This will permanently delete all tasks, subtasks, and custom projects. This action
              cannot be reversed. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setClearDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClearAll} className="text-xs">
              Yes, Delete Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
