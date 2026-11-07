import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Check,
  CircleCheck,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

type AuthScreenProps = {
  onAuthenticated: () => void;
  onEnterGuest?: () => void;
};

export function AuthScreen({ onAuthenticated, onEnterGuest }: AuthScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        setResetEmailSent(true);
        toast.success("Password reset instructions sent to your email.");
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: displayName } },
        });
        if (error) throw error;
        if (!data.session) {
          setConfirmationPending(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      onAuthenticated();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Authentication failed. Please verify credentials.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDemoAccess = () => {
    if (onEnterGuest) {
      onEnterGuest();
    } else {
      // Set local guest user session
      localStorage.setItem("taskforge_guest_active", "true");
      onAuthenticated();
    }
    toast.success("Welcome to TASKFORGE Demo Workspace!");
  };

  if (confirmationPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section className="w-full max-w-md border border-border bg-card p-8 text-center rounded-lg">
          <CircleCheck className="mx-auto mb-5 size-10 text-success" />
          <h1 className="text-xl font-semibold">Check your inbox</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A confirmation link was sent to {email}. Click the link to activate your TASKFORGE
            workspace.
          </p>
          <Button className="mt-6 w-full" onClick={() => setConfirmationPending(false)}>
            Back to sign in
          </Button>
        </section>
      </main>
    );
  }

  if (resetEmailSent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section className="w-full max-w-md border border-border bg-card p-8 text-center rounded-lg">
          <CircleCheck className="mx-auto mb-5 size-10 text-success" />
          <h1 className="text-xl font-semibold">Reset Link Sent</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            If an account exists for {email}, a password reset link has been dispatched.
          </p>
          <Button
            className="mt-6 w-full"
            onClick={() => {
              setResetEmailSent(false);
              setMode("signin");
            }}
          >
            Back to sign in
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-background">
      <section className="hidden w-1/2 flex-col justify-between border-r border-border bg-sidebar p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center border border-primary/40 bg-primary/10 text-primary rounded-md">
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-[0.16em] text-foreground">TASKFORGE</span>
        </div>
        <div className="max-w-lg">
          <p className="mb-4 font-mono text-xs uppercase tracking-wider text-primary">
            Obsidian Dark Architecture
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-foreground tracking-tight">
            High-velocity productivity for focused builders.
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
            Combines Obsidian's distraction-free dark workspace aesthetic with Linear's fluid
            engineering and multi-view project tracking.
          </p>
          <div className="mt-8 space-y-3.5 text-sm text-muted-foreground">
            {[
              "Multi-view workspace: List, Kanban, Calendar & Grid",
              "Subtask breakdowns, recurring schedules & smart reminders",
              "Analytics with Recharts and GitHub-style 30-day activity matrix",
              "Owner-scoped database persistence with local offline backup",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Check className="size-4 text-success shrink-0" />
                <span className="text-sm text-foreground/90">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
          <span>TASKFORGE Enterprise Platform</span>
          <span>Encrypted & Private</span>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid size-9 place-items-center border border-primary/40 bg-primary/10 text-primary rounded-md">
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-[0.16em]">TASKFORGE</span>
          </div>

          <p className="font-mono text-xs uppercase tracking-wider text-primary">
            {mode === "forgot" ? "Account Recovery" : "Productivity Workspace"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {mode === "signin"
              ? "Sign in to workspace"
              : mode === "signup"
                ? "Create your account"
                : "Reset your password"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Access your tasks, projects, and productivity metrics."
              : mode === "signup"
                ? "Set up your personal Obsidian-inspired environment."
                : "Enter your registered email to receive recovery instructions."}
          </p>

          {/* Quick Demo Access Button */}
          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full gap-2 border-primary/40 bg-primary/5 text-primary hover:bg-primary/15 transition-colors"
              onClick={handleDemoAccess}
            >
              <Sparkles className="size-4" />
              Explore Demo Workspace (Instant)
            </Button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
              {mode === "forgot" ? "Email verification" : "Or use your credentials"}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="display-name" className="text-xs text-muted-foreground">
                  Display Name
                </Label>
                <Input
                  id="display-name"
                  autoComplete="name"
                  placeholder="e.g. Dipta"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="bg-card border-border"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="developer@taskforge.dev"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="bg-card border-border"
                required
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs text-muted-foreground">
                    Password
                  </Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline font-medium"
                      onClick={() => setMode("forgot")}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    className="bg-card border-border pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="h-10 w-full gap-2 mt-2" disabled={busy}>
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : mode === "forgot" ? (
                <KeyRound className="size-4" />
              ) : (
                <LockKeyhole className="size-4" />
              )}
              {mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" && (
              <p>
                New to TASKFORGE?{" "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Create an account
                </button>
              </p>
            )}
            {mode === "signup" && (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <p>
                Remembered your password?{" "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => setMode("signin")}
                >
                  Back to sign in
                </button>
              </p>
            )}
          </div>

          <p className="mt-8 text-center text-xs leading-5 text-muted-foreground/80">
            End-to-end user scoped security. Row Level Security policies safeguard your tasks.
          </p>
        </div>
      </section>
    </main>
  );
}
