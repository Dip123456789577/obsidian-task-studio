import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AuthScreen } from "@/components/taskforge/auth-screen";
import { Workspace } from "@/components/taskforge/workspace";
import { useTaskforgeAuth } from "@/routes/__root";
import { supabase } from "@/integrations/supabase/client";
import { LoaderCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TASKFORGE — Advanced Productivity & Task Management" },
      {
        name: "description",
        content:
          "A focused Obsidian-inspired personal workspace for tasks, priorities, and productivity planning.",
      },
      { property: "og:title", content: "TASKFORGE — Advanced Productivity & Task Management" },
      {
        property: "og:description",
        content:
          "A focused Obsidian-inspired personal workspace for tasks, priorities, and productivity planning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const { user, loading } = useTaskforgeAuth();
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const guestActive = localStorage.getItem("taskforge_guest_active") === "true";
      setIsGuest(guestActive);
    }
  }, []);

  const handleEnterGuest = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("taskforge_guest_active", "true");
    }
    setIsGuest(true);
  };

  const signOut = async () => {
    setSigningOut(true);
    if (typeof window !== "undefined") {
      localStorage.removeItem("taskforge_guest_active");
    }
    setIsGuest(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut error:", err);
    }
    setSigningOut(false);
  };

  if (loading || signingOut) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
          <LoaderCircle className="size-4 animate-spin text-primary" /> Initializing TASKFORGE
          Workspace…
        </div>
      </main>
    );
  }

  // Active user or guest demo session
  const activeUser = user || (isGuest ? { id: "demo-user", email: "demo@taskforge.dev" } : null);

  if (!activeUser) {
    return (
      <AuthScreen
        onAuthenticated={() => {
          setIsGuest(false);
        }}
        onEnterGuest={handleEnterGuest}
      />
    );
  }

  return (
    <Workspace
      userId={activeUser.id}
      email={activeUser.email ?? "user@taskforge.dev"}
      onSignOut={signOut}
    />
  );
}
