import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useCallback, createContext, useContext, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

type AppUser = { id: string; email: string; name?: string | undefined };
type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  setUser: (user: AppUser | null) => void;
};
const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  setUser: () => {},
});

export function useTaskforgeAuth() {
  return useContext(AuthContext);
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error("TASKFORGE application error:", error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
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
      { name: "twitter:site", content: "@taskforge" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate icon", href: "/favicon.ico" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  const setUser = useCallback(
    (user: AppUser | null) => {
      if (typeof window !== "undefined") {
        try {
          if (user) {
            localStorage.setItem("taskforge_auth_session", JSON.stringify(user));
          } else {
            localStorage.removeItem("taskforge_auth_session");
          }
        } catch {
          // storage disabled or restricted
        }
      }
      setAuth((prev) => ({ ...prev, user, loading: false }));
      router.invalidate();
    },
    [router],
  );

  const [auth, setAuth] = useState<AuthContextValue>({
    user: null,
    loading: true,
    setUser,
  });

  useEffect(() => {
    let active = true;

    // Check localStorage session immediately for instant interactive render
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("taskforge_auth_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed.id === "string" && typeof parsed.email === "string") {
            setAuth({ user: parsed, loading: false, setUser });
          }
        }
      } catch {
        // ignore parse error
      }
    }

    const onAuthEvent = (e: Event) => {
      const custom = e as CustomEvent<AppUser | null>;
      if (custom.detail) {
        setAuth({ user: custom.detail, loading: false, setUser });
      } else {
        setAuth({ user: null, loading: false, setUser });
      }
      router.invalidate();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("taskforge:auth-change", onAuthEvent);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      const metadata = session?.user?.user_metadata as Record<string, unknown> | undefined;
      const displayName =
        typeof metadata?.["display_name"] === "string" ? metadata["display_name"] : undefined;
      const nextUser: AppUser | null = session?.user
        ? {
            id: session.user.id,
            email: session.user.email ?? "",
            name: displayName,
          }
        : null;

      if (event === "SIGNED_OUT") {
        if (typeof window !== "undefined") {
          localStorage.removeItem("taskforge_auth_session");
        }
        setAuth({ user: null, loading: false, setUser });
      } else if (nextUser) {
        if (typeof window !== "undefined") {
          localStorage.setItem("taskforge_auth_session", JSON.stringify(nextUser));
        }
        setAuth({ user: nextUser, loading: false, setUser });
      }
      router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });

    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (!error && data.user) {
        const metadata = data.user.user_metadata as Record<string, unknown> | undefined;
        const displayName =
          typeof metadata?.["display_name"] === "string" ? metadata["display_name"] : undefined;
        const supaUser: AppUser = {
          id: data.user.id,
          email: data.user.email ?? "",
          name: displayName,
        };
        if (typeof window !== "undefined") {
          localStorage.setItem("taskforge_auth_session", JSON.stringify(supaUser));
        }
        setAuth({ user: supaUser, loading: false, setUser });
      } else {
        // If Supabase has no session, check if we have a valid local session
        let hasLocal = false;
        if (typeof window !== "undefined") {
          try {
            const stored = localStorage.getItem("taskforge_auth_session");
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed?.id && parsed?.email) {
                hasLocal = true;
                setAuth({ user: parsed, loading: false, setUser });
              }
            }
          } catch {
            // ignore localStorage error
          }
        }
        if (!hasLocal) {
          setAuth({ user: null, loading: false, setUser });
        }
      }
    });

    return () => {
      active = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("taskforge:auth-change", onAuthEvent);
      }
      subscription.unsubscribe();
    };
  }, [queryClient, router, setUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <Toaster />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
