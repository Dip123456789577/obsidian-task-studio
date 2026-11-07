import { useState } from "react";
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
      { title: "TASKFORGE — Personal productivity" },
      {
        name: "description",
        content: "A focused personal workspace for tasks, priorities, and plans.",
      },
      { property: "og:title", content: "TASKFORGE — Personal productivity" },
      {
        property: "og:description",
        content: "A focused personal workspace for tasks, priorities, and plans.",
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

  const signOut = async () => {
    setSigningOut(true);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setSigningOut(false);
  };

  if (loading || signingOut) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin text-primary" /> Opening TASKFORGE…
        </div>
      </main>
    );
  }

  if (!user) return <AuthScreen onAuthenticated={() => undefined} />;

  return <Workspace userId={user.id} email={user.email ?? ""} onSignOut={signOut} />;
}
