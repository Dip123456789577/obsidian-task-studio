import { useState } from "react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, CircleCheck, Command, LoaderCircle, LockKeyhole } from "lucide-react";

type AuthScreenProps = { onAuthenticated: () => void };

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
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
      toast.error(error instanceof Error ? error.message : "Sign-in could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  const signInSocial = async (provider: "google" | "lovable") => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message);
      setBusy(false);
    }
  };

  if (confirmationPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section className="w-full max-w-md border border-border bg-card p-8 text-center">
          <CircleCheck className="mx-auto mb-5 size-10 text-success" />
          <h1 className="text-xl font-semibold">Check your inbox</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A confirmation link was sent to {email}. Confirm your email to open your TASKFORGE
            workspace.
          </p>
          <Button className="mt-6 w-full" onClick={() => setConfirmationPending(false)}>
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
          <div className="grid size-9 place-items-center border border-primary/30 bg-primary/10 text-primary">
            <Command className="size-5" />
          </div>
          <span className="text-sm font-semibold tracking-[0.12em]">TASKFORGE</span>
        </div>
        <div className="max-w-lg">
          <p className="mb-5 font-mono text-xs uppercase text-primary">
            A quieter way to get things done
          </p>
          <h1 className="text-4xl font-semibold leading-tight">
            Make room for the work that matters.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
            Keep tasks, priorities, and plans in one focused workspace—built around your day.
          </p>
          <div className="mt-9 space-y-3 text-sm text-muted-foreground">
            {[
              "A clear view of what matters today",
              "Projects, priorities, and notes together",
              "Your workspace, private to your account",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Check className="size-4 text-success" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Your personal productivity workspace.</p>
      </section>

      <section className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <div className="grid size-9 place-items-center border border-primary/30 bg-primary/10 text-primary">
              <Command className="size-5" />
            </div>
            <span className="text-sm font-semibold tracking-[0.12em]">TASKFORGE</span>
          </div>
          <p className="font-mono text-xs uppercase text-primary">Personal workspace</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to pick up where you left off."
              : "Set up your private TASKFORGE workspace."}
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-10"
              disabled={busy}
              onClick={() => void signInSocial("google")}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="h-10"
              disabled={busy}
              onClick={() => void signInSocial("lovable")}
            >
              <Command className="size-4" /> Continue with Lovable
            </Button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or continue with email</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  autoComplete="name"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="h-10 w-full" disabled={busy}>
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <LockKeyhole className="size-4" />
              )}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to TASKFORGE?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">
            By continuing, you agree to use your workspace responsibly. Your tasks remain private to
            your account.
          </p>
        </div>
      </section>
    </main>
  );
}
