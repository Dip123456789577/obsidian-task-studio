import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Timer,
  Volume2,
  VolumeX,
  X,
  Sparkles,
} from "lucide-react";
import type { Task } from "./types";
import { toast } from "sonner";

type PomodoroMode = "focus" | "short_break" | "long_break";

type PomodoroTimerProps = {
  tasks: Task[];
  open: boolean;
  onClose: () => void;
  activeTask?: Task | null;
  onSelectTask?: (task: Task) => void;
};

const MODE_DURATIONS: Record<PomodoroMode, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

// Play a pleasant dual-tone bell sound using Web Audio API (zero external assets needed)
function playZenChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";

    // Pleasant high harmonics: 528Hz (solfeggio) & 1056Hz
    osc1.frequency.setValueAtTime(528, ctx.currentTime);
    osc2.frequency.setValueAtTime(1056, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 2.5);
    osc2.stop(ctx.currentTime + 2.5);
  } catch {
    // Audio context may be restricted before user gesture
  }
}

export function PomodoroTimer({
  tasks,
  open,
  onClose,
  activeTask: initialActiveTask,
}: PomodoroTimerProps) {
  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [timeLeft, setTimeLeft] = useState(MODE_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(initialActiveTask?.id || "");

  const activeTask = tasks.find((t) => t.id === selectedTaskId) || initialActiveTask;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const handleCompleteRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (initialActiveTask?.id) {
      setSelectedTaskId(initialActiveTask.id);
    }
  }, [initialActiveTask]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleCompleteRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleComplete = () => {
    setIsRunning(false);
    if (soundEnabled) {
      playZenChime();
    }

    if (mode === "focus") {
      const nextCount = sessionsCompleted + 1;
      setSessionsCompleted(nextCount);
      toast.success("Focus block completed! Great work.", {
        description: activeTask
          ? `Completed 25m on "${activeTask.title}"`
          : "Take a short break to recharge.",
      });

      if (nextCount % 4 === 0) {
        setMode("long_break");
        setTimeLeft(MODE_DURATIONS.long_break);
      } else {
        setMode("short_break");
        setTimeLeft(MODE_DURATIONS.short_break);
      }
    } else {
      toast.info("Break is over. Ready to begin your next focus sprint?");
      setMode("focus");
      setTimeLeft(MODE_DURATIONS.focus);
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const switchMode = (newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODE_DURATIONS[newMode]);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODE_DURATIONS[mode]);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const totalDuration = MODE_DURATIONS[mode];
  const progressPercent = Math.round(((totalDuration - timeLeft) / totalDuration) * 100);

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-border/80 bg-card/95 p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Timer className="size-4 text-primary" />
          <span>Pomodoro Focus Session</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={soundEnabled ? "Mute audio chimes" : "Enable audio chimes"}
          >
            {soundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Mode Selectors */}
      <div className="grid grid-cols-3 gap-1 bg-secondary/50 p-1 rounded-lg mt-4 text-[11px] font-mono">
        <button
          type="button"
          onClick={() => switchMode("focus")}
          className={`py-1 rounded transition-colors ${
            mode === "focus"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Focus
        </button>
        <button
          type="button"
          onClick={() => switchMode("short_break")}
          className={`py-1 rounded transition-colors ${
            mode === "short_break"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Short Break
        </button>
        <button
          type="button"
          onClick={() => switchMode("long_break")}
          className={`py-1 rounded transition-colors ${
            mode === "long_break"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Long Break
        </button>
      </div>

      {/* Big Countdown Display */}
      <div className="my-6 text-center">
        <div className="font-mono text-5xl font-bold tracking-tight text-foreground select-none">
          {timeFormatted}
        </div>
        <p className="mt-1 text-xs text-muted-foreground font-mono">
          {mode === "focus" ? "Deep Work Block" : "Recharge Interval"} • {sessionsCompleted}{" "}
          completed
        </p>

        {/* Progress Bar */}
        <div className="mt-3 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Task Assignment */}
      <div className="mb-4">
        <label className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider block mb-1">
          Active Objective
        </label>
        <select
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          className="w-full text-xs rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-foreground outline-none focus:border-primary truncate"
        >
          <option value="">-- General Productivity Session --</option>
          {tasks
            .filter((t) => !t.completed && !t.deleted_at)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
        </select>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={resetTimer}
          className="size-9 rounded-full"
          title="Reset interval"
        >
          <RotateCcw className="size-4" />
        </Button>

        <Button
          onClick={toggleTimer}
          size="default"
          className="rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs flex items-center gap-2"
        >
          {isRunning ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
          {isRunning ? "Pause" : "Start Focus"}
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={handleComplete}
          className="size-9 rounded-full"
          title="Skip to next interval"
        >
          <SkipForward className="size-4" />
        </Button>
      </div>
    </div>
  );
}
