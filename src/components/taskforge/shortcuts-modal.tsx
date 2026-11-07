import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard, Command, Sparkles } from "lucide-react";

type ShortcutsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SHORTCUT_GROUPS = [
  {
    title: "Global Navigation",
    shortcuts: [
      { keys: ["Ctrl/⌘", "K"], description: "Open Command Palette search" },
      { keys: ["Ctrl/⌘", "N"], description: "Create a new task immediately" },
      { keys: ["Ctrl/⌘", "B"], description: "Toggle sidebar collapse" },
      { keys: ["?"], description: "Open this keyboard shortcuts cheat sheet" },
      { keys: ["Esc"], description: "Dismiss modal, drawer or active dialog" },
    ],
  },
  {
    title: "View Modes",
    shortcuts: [
      { keys: ["1"], description: "Switch to List View" },
      { keys: ["2"], description: "Switch to Kanban Board View" },
      { keys: ["3"], description: "Switch to Eisenhower Matrix View" },
      { keys: ["4"], description: "Switch to Calendar View" },
      { keys: ["5"], description: "Switch to Grid Cards View" },
    ],
  },
  {
    title: "Productivity & Focus",
    shortcuts: [
      { keys: ["P"], description: "Toggle Pomodoro Focus Session timer" },
      { keys: ["F"], description: "Toggle Zen Focus Mode (hide header & sidebar)" },
      { keys: ["T"], description: "Filter tasks due Today" },
    ],
  },
];

export function ShortcutsModal({ open, onOpenChange }: ShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-card p-6">
        <DialogHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Keyboard className="size-4 text-primary" />
            <DialogTitle className="text-sm font-semibold text-foreground">
              TASKFORGE Keyboard Shortcuts
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Power user shortcuts inspired by Linear and Obsidian.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 max-h-[420px] overflow-y-auto">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                {group.title}
              </h4>
              <div className="space-y-1.5">
                {group.shortcuts.map((sc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-md bg-secondary/30"
                  >
                    <span className="text-muted-foreground">{sc.description}</span>
                    <div className="flex items-center gap-1 font-mono">
                      {sc.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="rounded border border-border bg-secondary/80 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
